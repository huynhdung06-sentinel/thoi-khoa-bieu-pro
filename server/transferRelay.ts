/**
 * Transfer Relay (Module 2A) - Server-side RAM Temporary Store
 * 
 * NOTE ON ARCHITECTURE:
 * This in-memory store uses a JavaScript Map and is designed strictly for a
 * single Node.js process / single-instance deployment. Restarting the server
 * or running across multiple worker processes will not share or persist state.
 * This satisfies the temporary relay specification without introducing external databases.
 */

import type { Request, Response } from 'express';
import {
  validateAndParseTransfer,
  TransferPackage,
} from '../src/utils/transferProtocol';

export const TRANSFER_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_TRANSFER_PACKAGE_BYTES = 15 * 1024 * 1024; // 15MB in UTF-8 bytes
export const CLEANUP_INTERVAL_MS = 60 * 1000; // 60 seconds

export interface StoredTransfer {
  package: TransferPackage;
  serialized: string;
  receivedAt: string;
  expiresAt: string;
}

// In-memory RAM store: transferId -> StoredTransfer
export const transferStore = new Map<string, StoredTransfer>();

// In-memory SSE subscribers registry (Module 2D): childId -> Set<Response>
export const transferSseSubscribers = new Map<string, Set<Response>>();

/**
 * Notifies all active SSE subscribers for a childId that a new transfer is available.
 * ONLY sends transferId metadata. NEVER sends TransferPackage, documents, or Base64 media.
 */
export function notifyTransferAvailable(childId: string, transferId: string): void {
  const subscribers = transferSseSubscribers.get(childId);
  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const payload = JSON.stringify({ transferId });
  const sseMessage = `event: TRANSFER_AVAILABLE\ndata: ${payload}\n\n`;

  for (const clientRes of subscribers) {
    try {
      clientRes.write(sseMessage);
      if (typeof (clientRes as any).flush === 'function') {
        (clientRes as any).flush();
      }
    } catch {
      // Client connection error will trigger 'close' event handler
    }
  }
}

/**
 * Periodically removes expired transfers from memory.
 */
export function cleanupExpiredTransfers(currentTimeMs: number = Date.now()): number {
  let removedCount = 0;
  for (const [transferId, stored] of transferStore.entries()) {
    const expiresAtMs = new Date(stored.expiresAt).getTime();
    if (expiresAtMs <= currentTimeMs) {
      transferStore.delete(transferId);
      removedCount++;
    }
  }
  return removedCount;
}

// Background cleanup timer
let cleanupTimer: NodeJS.Timeout | null = null;

export function startTransferCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupExpiredTransfers();
  }, CLEANUP_INTERVAL_MS);

  // Allow Node process to exit gracefully if only this interval is active
  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

export function stopTransferCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// Automatically start background cleanup
startTransferCleanupTimer();

/**
 * POST /api/transfer handler
 */
export function handlePostTransfer(req: Request, res: Response): void {
  const rawBody = req.body;

  // 1. Check if body is empty or not an object
  if (!rawBody || typeof rawBody !== 'object') {
    res.status(400).json({ error: 'Missing or malformed transfer package body' });
    return;
  }

  // 2. Validate and parse transfer using shared protocol helper
  const validation = validateAndParseTransfer(rawBody);
  if (!validation.isValid) {
    res.status(400).json({ error: (validation as { isValid: false; error: string }).error });
    return;
  }

  const transferPkg = validation.package;
  const serialized = JSON.stringify(transferPkg);

  // 3. UTF-8 byte size validation (15MB business limit)
  let byteSize: number;
  if (typeof TextEncoder !== 'undefined') {
    byteSize = new TextEncoder().encode(serialized).byteLength;
  } else {
    byteSize = Buffer.byteLength(serialized, 'utf8');
  }

  if (byteSize > MAX_TRANSFER_PACKAGE_BYTES) {
    res.status(413).json({
      error: `Transfer package exceeds maximum allowed size of 15MB (current: ${(byteSize / (1024 * 1024)).toFixed(2)}MB)`,
    });
    return;
  }

  const transferId = transferPkg.transferId;
  const existing = transferStore.get(transferId);

  // 4. Idempotency handling
  if (existing) {
    // Check if package is identical
    if (existing.serialized === serialized) {
      // Case B: Same transferId + same package -> 200 OK (no duplicate, no overwrite)
      res.status(200).json({
        transferId: existing.package.transferId,
        receivedAt: existing.receivedAt,
        expiresAt: existing.expiresAt,
      });
      return;
    } else {
      // Case C: Same transferId + different package -> 409 Conflict (original remains intact)
      res.status(409).json({
        error: `Conflict: transferId '${transferId}' already exists with different payload content`,
      });
      return;
    }
  }

  // 5. Case A: Store new package
  // Server-authoritative TTL: calculated from server received time, NOT client createdAt
  const receivedAtMs = Date.now();
  const receivedAt = new Date(receivedAtMs).toISOString();
  const expiresAt = new Date(receivedAtMs + TRANSFER_TTL_MS).toISOString();

  const storedRecord: StoredTransfer = {
    package: transferPkg,
    serialized,
    receivedAt,
    expiresAt,
  };

  transferStore.set(transferId, storedRecord);

  // Trigger SSE notification for new transfer (Module 2D) - ONLY sends transferId
  notifyTransferAvailable(transferPkg.childId, transferPkg.transferId);

  // 6. Return 201 Created with metadata only (do NOT echo full package)
  res.status(201).json({
    transferId: transferPkg.transferId,
    receivedAt,
    expiresAt,
  });
}

/**
 * GET /api/transfer/:transferId handler
 */
export function handleGetTransfer(req: Request, res: Response): void {
  const transferId = req.params?.transferId?.trim();

  if (!transferId) {
    res.status(400).json({ error: 'Missing transferId parameter' });
    return;
  }

  const stored = transferStore.get(transferId);

  // 1. If not found in RAM store
  if (!stored) {
    res.status(404).json({ error: 'Transfer not found or already expired' });
    return;
  }

  // 2. If expired, proactively clean up and return 404
  const expiresAtMs = new Date(stored.expiresAt).getTime();
  if (expiresAtMs <= Date.now()) {
    transferStore.delete(transferId);
    res.status(404).json({ error: 'Transfer has expired' });
    return;
  }

  // 3. Return full TransferPackage intact (HTTP 200) without modifying or deleting it
  res.status(200).json(stored.package);
}

/**
 * POST /api/transfer/:transferId/ack handler (Module 2C)
 * 
 * Rules:
 * - Transfer exists -> delete from RAM store -> 200 OK.
 * - Transfer does not exist -> 200 OK (idempotent ACK retry).
 * - Transfer expired -> ensure deleted from RAM store -> 200 OK.
 * - Subsequent GET requests for this transferId will return 404.
 */
export function handleAckTransfer(req: Request, res: Response): void {
  const transferId = req.params?.transferId?.trim();

  if (!transferId) {
    res.status(400).json({ error: 'Missing transferId parameter' });
    return;
  }

  // Delete from RAM store if present
  if (transferStore.has(transferId)) {
    transferStore.delete(transferId);
  }

  // Always respond 200 OK for idempotent ACK
  res.status(200).json({
    acknowledged: true,
    transferId,
  });
}

/**
 * GET /api/transfer/events?childId=<childId> handler (Module 2D: SSE Notification)
 * 
 * Rules:
 * - Subscribes client to TRANSFER_AVAILABLE events for specified childId.
 * - Only sends transferId in event data (never full package or media).
 * - Cleans up connection when client disconnects.
 * - Supports multiple SSE clients per childId.
 */
export function handleTransferEvents(req: Request, res: Response): void {
  const childId = (req.query?.childId as string | undefined)?.trim();

  if (!childId) {
    res.status(400).json({ error: 'Missing or empty childId parameter' });
    return;
  }

  // Set HTTP headers for SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Initial comment to establish stream
  res.write(': connected\n\n');
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  // Register client in subscribers registry
  let childSubscribers = transferSseSubscribers.get(childId);
  if (!childSubscribers) {
    childSubscribers = new Set<Response>();
    transferSseSubscribers.set(childId, childSubscribers);
  }
  childSubscribers.add(res);

  // Clean up on client disconnect
  req.on('close', () => {
    const currentSubscribers = transferSseSubscribers.get(childId);
    if (currentSubscribers) {
      currentSubscribers.delete(res);
      if (currentSubscribers.size === 0) {
        transferSseSubscribers.delete(childId);
      }
    }
  });
}


