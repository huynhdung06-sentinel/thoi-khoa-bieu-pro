/**
 * Phase 2B: In-Memory Server Sync Engine (Concurrency-Hardened Patch)
 *
 * Implements:
 * 1. 4 logical stores: child_sync_state, study_records, mutation_log, processed_mutations (global by updateId)
 * 2. Strict FIFO promise-chain mutex for serialized execution per childId
 * 3. Atomic global updateId in-flight claim & lock to eliminate race conditions across different childId
 * 4. Deadlock-free two-phase locking (Global updateId locks claimed in sorted order BEFORE childId lock)
 * 5. Monotonic serverVersion strictly serialized per childId
 * 6. True per-mutation atomicity via deep-state backup + rollback
 * 7. Test-only failure checkpoints (AFTER_CANONICAL_WRITE, AFTER_MUTATION_LOG_WRITE, etc.)
 * 8. Global Idempotency via deep originalInput comparison (DUPLICATE vs IDEMPOTENCY_CONFLICT)
 * 9. Deep cloning for all stored canonical objects and response payloads
 * 10. Strict validation for baseRecordVersion, sinceVersion, and record identity
 * 11. Empty log compaction boundary handling (retainCount = 0 -> oldestRetained = current + 1)
 * 12. Terminal Tombstone semantics (no resurrection)
 * 13. 3 GET modes: SNAPSHOT, DELTA, SNAPSHOT_REQUIRED with safe pagination
 */

export type ServerRecordStatus = 'COMPLETED' | 'NEEDS_REVISION' | 'PENDING';

export interface ServerCanonicalRecord {
  id: string;
  childId: string;
  recordVersion: number;
  lessonId?: string;
  date: string;
  status: ServerRecordStatus;
  score?: number | null;
  completedAt?: string | null;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  data: Record<string, unknown>;
}

export interface ServerChildSyncState {
  childId: string;
  currentServerVersion: number;
  oldestRetainedServerVersion: number;
  updatedAt: string;
}

export interface ServerMutationLogEntry {
  id: string;
  childId: string;
  serverVersion: number;
  updateId: string;
  action: 'UPSERT' | 'DELETE';
  recordId: string;
  recordData?: Record<string, unknown> | null;
  createdAt: string;
}

export type MutationProcessStatus = 'SUCCESS' | 'DUPLICATE' | 'REJECTED' | 'INVALID';

export interface OriginalMutationInputSnapshot {
  childId: string;
  recordId: string;
  action: 'UPSERT' | 'DELETE';
  baseRecordVersion: number;
  recordPayload: Record<string, unknown> | null;
}

export interface ServerProcessedMutation {
  updateId: string;
  childId: string;
  recordId: string;
  action: 'UPSERT' | 'DELETE';
  status: MutationProcessStatus;
  appliedServerVersion: number | null;
  errorCode?: string | null;
  message?: string | null;
  currentRecord?: Record<string, unknown> | null;
  newRecordVersion?: number | null;
  processedAt: string;
  originalInput: OriginalMutationInputSnapshot;
}

export interface PostSyncMutationInput {
  updateId: string;
  action: 'UPSERT' | 'DELETE';
  recordId: string;
  baseRecordVersion: number;
  record?: {
    id: string;
    childId: string;
    lessonId?: string;
    date: string;
    status: ServerRecordStatus;
    score?: number | null;
    completedAt?: string | null;
    updatedAt: string;
    data?: Record<string, unknown>;
  };
  createdAt?: string;
}

export interface PostSyncRequest {
  childId: string;
  mutations: PostSyncMutationInput[];
}

export interface PostSyncMutationResult {
  updateId: string;
  status: MutationProcessStatus;
  recordId: string;
  appliedServerVersion?: number | null;
  newRecordVersion?: number | null;
  errorCode?: string | null;
  message?: string | null;
  currentRecord?: Record<string, unknown> | null;
}

export interface PostSyncResponse {
  success: boolean;
  childId: string;
  currentChildVersion: number;
  results: PostSyncMutationResult[];
}

export interface GetSyncSnapshotResponse {
  success: true;
  childId: string;
  mode: 'SNAPSHOT';
  snapshotVersion: number;
  records: ServerCanonicalRecord[];
}

export interface GetSyncDeltaResponse {
  success: true;
  childId: string;
  mode: 'DELTA';
  fromVersion: number;
  toVersion: number;
  currentServerVersion: number;
  hasMore: boolean;
  changes: Array<{
    serverVersion: number;
    updateId: string;
    action: 'UPSERT' | 'DELETE';
    recordId: string;
    record?: Record<string, unknown> | null;
  }>;
}

export interface GetSyncSnapshotRequiredResponse {
  success: true;
  childId: string;
  mode: 'SNAPSHOT_REQUIRED';
  oldestRetainedServerVersion: number;
  currentServerVersion: number;
  message: string;
}

export type GetSyncResponse =
  | GetSyncSnapshotResponse
  | GetSyncDeltaResponse
  | GetSyncSnapshotRequiredResponse;

// ============================================================================
// FAILURE INJECTION HOOK FOR ATOMICITY TESTING
// ============================================================================

export type SyncEngineFailureCheckpoint =
  | 'AFTER_CANONICAL_WRITE'
  | 'AFTER_MUTATION_LOG_WRITE'
  | 'AFTER_PROCESSED_MUTATION_WRITE'
  | 'AFTER_SERVER_VERSION_UPDATE'
  | 'INSIDE_CHILD_LOCK_DELAY'
  | 'INSIDE_UPDATE_LOCK_DELAY';

let activeFailureCheckpoint: SyncEngineFailureCheckpoint | null = null;

export function setSyncEngineFailureCheckpoint(checkpoint: SyncEngineFailureCheckpoint | null): void {
  activeFailureCheckpoint = checkpoint;
}

async function triggerCheckpointIfNeeded(checkpoint: SyncEngineFailureCheckpoint) {
  if (activeFailureCheckpoint === checkpoint) {
    if (checkpoint.includes('DELAY')) {
      await new Promise(r => setTimeout(r, 50));
    } else {
      throw new Error(`Simulated test panic at checkpoint: ${checkpoint}`);
    }
  }
}

// ============================================================================
// DEEP CLONE HELPER
// ============================================================================

function deepClone<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

// 1. child_sync_state: childId -> ServerChildSyncState
const childSyncStateStore = new Map<string, ServerChildSyncState>();

// 2. study_records: childId -> (recordId -> ServerCanonicalRecord)
const studyRecordsStore = new Map<string, Map<string, ServerCanonicalRecord>>();

// 3. mutation_log: childId -> ServerMutationLogEntry[]
const mutationLogStore = new Map<string, ServerMutationLogEntry[]>();

// 4. processed_mutations: GLOBAL updateId -> ServerProcessedMutation
const processedMutationsStore = new Map<string, ServerProcessedMutation>();

// ============================================================================
// ROBUST SERIALIZED MUTEX IMPLEMENTATION (PROMISE-CHAIN FIFO QUEUE)
// ============================================================================

// Per-childId execution chain
const childLockTails = new Map<string, Promise<void>>();

// Per-updateId in-flight processing chain to prevent concurrent cross-child races
const updateIdLockTails = new Map<string, Promise<void>>();

/**
 * Strictly serializes operations per childId using a robust Promise queue.
 * Guarantees zero race conditions, strict FIFO ordering, and reliable lock release even on error.
 */
export function withChildLock<T>(childId: string, fn: () => Promise<T> | T): Promise<T> {
  const currentTail = childLockTails.get(childId) || Promise.resolve();

  let releaseLock!: () => void;
  const nextLockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  const newTail = currentTail.then(
    () => nextLockPromise,
    () => nextLockPromise
  );
  childLockTails.set(childId, newTail);

  return new Promise<T>((resolve, reject) => {
    currentTail
      .then(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          releaseLock();
          if (childLockTails.get(childId) === newTail) {
            childLockTails.delete(childId);
          }
        }
      })
      .catch((err) => {
        releaseLock();
        reject(err);
      });
  });
}

/**
 * Serializes multiple updateIds in lexicographical order to prevent deadlocks.
 */
export async function withUpdateIdsLock<T>(updateIds: string[], fn: () => Promise<T> | T): Promise<T> {
  const sortedIds = Array.from(new Set(updateIds)).sort();
  return acquireUpdateLocksRecursively(sortedIds, 0, fn);
}

function acquireUpdateLocksRecursively<T>(sortedIds: string[], index: number, fn: () => Promise<T> | T): Promise<T> {
  if (index >= sortedIds.length) {
    return Promise.resolve().then(fn);
  }

  const currentId = sortedIds[index];
  const currentTail = updateIdLockTails.get(currentId) || Promise.resolve();

  let releaseLock!: () => void;
  const nextLockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  const newTail = currentTail.then(
    () => nextLockPromise,
    () => nextLockPromise
  );
  updateIdLockTails.set(currentId, newTail);

  return new Promise<T>((resolve, reject) => {
    currentTail
      .then(async () => {
        try {
          const result = await acquireUpdateLocksRecursively(sortedIds, index + 1, fn);
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          releaseLock();
          if (updateIdLockTails.get(currentId) === newTail) {
            updateIdLockTails.delete(currentId);
          }
        }
      })
      .catch((err) => {
        releaseLock();
        reject(err);
      });
  });
}

function getOrCreateChildState(childId: string): ServerChildSyncState {
  let state = childSyncStateStore.get(childId);
  if (!state) {
    state = {
      childId,
      currentServerVersion: 0,
      oldestRetainedServerVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    childSyncStateStore.set(childId, state);
  }
  return state;
}

function getChildRecords(childId: string): Map<string, ServerCanonicalRecord> {
  let records = studyRecordsStore.get(childId);
  if (!records) {
    records = new Map<string, ServerCanonicalRecord>();
    studyRecordsStore.set(childId, records);
  }
  return records;
}

function getChildMutationLog(childId: string): ServerMutationLogEntry[] {
  let log = mutationLogStore.get(childId);
  if (!log) {
    log = [];
    mutationLogStore.set(childId, log);
  }
  return log;
}

/**
 * Resets all in-memory stores, failure hooks, and lock tails. Useful for clean test runs.
 */
export function resetSyncEngineState(): void {
  childSyncStateStore.clear();
  studyRecordsStore.clear();
  mutationLogStore.clear();
  processedMutationsStore.clear();
  childLockTails.clear();
  updateIdLockTails.clear();
  activeFailureCheckpoint = null;
}

export function simulateLogCompaction(childId: string, retainCount: number): void {
  const log = getChildMutationLog(childId);
  const state = getOrCreateChildState(childId);

  if (retainCount <= 0) {
    mutationLogStore.set(childId, []);
    state.oldestRetainedServerVersion = state.currentServerVersion + 1;
    state.updatedAt = new Date().toISOString();
  } else if (log.length > retainCount) {
    const retained = log.slice(log.length - retainCount);
    mutationLogStore.set(childId, retained);
    state.oldestRetainedServerVersion = retained[0].serverVersion;
    state.updatedAt = new Date().toISOString();
  }
}

// ============================================================================
// POST /api/sync CORE ENGINE
// ============================================================================

export async function processSyncPush(
  childId: string,
  mutations: PostSyncMutationInput[]
): Promise<{ status: number; body: PostSyncResponse | { success: false; error: { code: string; message: string } } }> {
  if (!childId || typeof childId !== 'string') {
    return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'Missing or invalid childId' } } };
  }
  if (!Array.isArray(mutations)) {
    return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'Mutations must be an array' } } };
  }
  if (mutations.length > 50) {
    return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'Batch size exceeds maximum limit of 50 mutations' } } };
  }

  const seenBatchIds = new Set<string>();
  const updateIdsToLock: string[] = [];

  for (const m of mutations) {
    if (!m || !m.updateId || typeof m.updateId !== 'string') {
      return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'Each mutation must have a valid updateId string' } } };
    }
    if (seenBatchIds.has(m.updateId)) {
      return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: `Duplicate updateId '${m.updateId}' found within the same batch request` } } };
    }
    seenBatchIds.add(m.updateId);
    updateIdsToLock.push(m.updateId);
  }

  // Deadlock-free two-phase locking: Acquire global updateId locks FIRST in sorted order, then childId lock
  return withUpdateIdsLock(updateIdsToLock, () => {
    return withChildLock(childId, async () => {
      // Simulate delay for adversarial testing if requested
      await triggerCheckpointIfNeeded('INSIDE_CHILD_LOCK_DELAY');

      const childState = getOrCreateChildState(childId);
      const records = getChildRecords(childId);
      const mutationLog = getChildMutationLog(childId);

      const results: PostSyncMutationResult[] = [];

      for (const m of mutations) {
        const originalInputSnapshot: OriginalMutationInputSnapshot = {
          childId,
          recordId: m.recordId,
          action: m.action,
          baseRecordVersion: m.baseRecordVersion,
          recordPayload: m.record ? deepClone(m.record) : null,
        };

        if (processedMutationsStore.has(m.updateId)) {
          const prev = processedMutationsStore.get(m.updateId)!;
          const isExactMatch =
            prev.originalInput.childId === childId &&
            prev.originalInput.recordId === m.recordId &&
            prev.originalInput.action === m.action &&
            prev.originalInput.baseRecordVersion === m.baseRecordVersion &&
            JSON.stringify(prev.originalInput.recordPayload) === JSON.stringify(originalInputSnapshot.recordPayload);

          if (isExactMatch) {
            results.push({
              updateId: m.updateId,
              status: 'DUPLICATE',
              recordId: prev.recordId,
              appliedServerVersion: prev.appliedServerVersion,
              newRecordVersion: prev.newRecordVersion,
              errorCode: prev.errorCode,
              message: prev.message,
              currentRecord: prev.currentRecord ? deepClone(prev.currentRecord) as unknown as Record<string, unknown> : null,
            });
          } else {
            results.push({
              updateId: m.updateId,
              status: 'REJECTED',
              recordId: m.recordId,
              appliedServerVersion: null,
              errorCode: 'IDEMPOTENCY_CONFLICT',
              message: 'Idempotency conflict: updateId has already been used with a different mutation payload or childId',
            });
          }
          continue;
        }

        if (typeof m.baseRecordVersion !== 'number' || !Number.isInteger(m.baseRecordVersion) || m.baseRecordVersion < 0) {
          const invalidRecord: ServerProcessedMutation = {
            updateId: m.updateId, childId, recordId: m.recordId || 'unknown', action: m.action || 'UPSERT',
            status: 'INVALID', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD',
            message: 'baseRecordVersion must be a non-negative integer (>= 0)', processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
          };
          processedMutationsStore.set(m.updateId, invalidRecord);
          results.push({ updateId: m.updateId, status: 'INVALID', recordId: m.recordId || 'unknown', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD', message: invalidRecord.message });
          continue;
        }

        if (!m.recordId || (m.action !== 'UPSERT' && m.action !== 'DELETE')) {
          const invalidRecord: ServerProcessedMutation = {
            updateId: m.updateId, childId, recordId: m.recordId || 'unknown', action: m.action || 'UPSERT',
            status: 'INVALID', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD',
            message: 'Missing or invalid mutation fields (recordId, action)', processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
          };
          processedMutationsStore.set(m.updateId, invalidRecord);
          results.push({ updateId: m.updateId, status: 'INVALID', recordId: m.recordId || 'unknown', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD', message: invalidRecord.message });
          continue;
        }

        if (m.action === 'UPSERT') {
          if (!m.record) {
            const invalidRecord: ServerProcessedMutation = {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
              status: 'INVALID', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD',
              message: 'UPSERT mutation requires a record object', processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            };
            processedMutationsStore.set(m.updateId, invalidRecord);
            results.push({ updateId: m.updateId, status: 'INVALID', recordId: m.recordId, appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD', message: invalidRecord.message });
            continue;
          }

          if (m.record.id !== m.recordId || m.record.childId !== childId) {
            const invalidRecord: ServerProcessedMutation = {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
              status: 'INVALID', appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD',
              message: 'Identity mismatch: record.id must match recordId and record.childId must match childId', processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            };
            processedMutationsStore.set(m.updateId, invalidRecord);
            results.push({ updateId: m.updateId, status: 'INVALID', recordId: m.recordId, appliedServerVersion: null, errorCode: 'INVALID_PAYLOAD', message: invalidRecord.message });
            continue;
          }
        }

        const existing = records.get(m.recordId);

        if (m.action === 'UPSERT') {
          if (m.baseRecordVersion === 0) {
            if (existing) {
              const rejectedRecord: ServerProcessedMutation = {
                updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
                status: 'REJECTED', appliedServerVersion: null, errorCode: 'STALE_VERSION',
                message: `Record already exists (current record version: ${existing.recordVersion})`, currentRecord: deepClone(existing) as unknown as Record<string, unknown>, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
              };
              processedMutationsStore.set(m.updateId, rejectedRecord);
              results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'STALE_VERSION', message: rejectedRecord.message, currentRecord: deepClone(rejectedRecord.currentRecord) as unknown as Record<string, unknown> });
              continue;
            }
          } else {
            if (!existing) {
              const rejectedRecord: ServerProcessedMutation = {
                updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
                status: 'REJECTED', appliedServerVersion: null, errorCode: 'RECORD_NOT_FOUND',
                message: `Record with id '${m.recordId}' does not exist on server`, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
              };
              processedMutationsStore.set(m.updateId, rejectedRecord);
              results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'RECORD_NOT_FOUND', message: rejectedRecord.message });
              continue;
            }

            if (existing.isDeleted) {
              const rejectedRecord: ServerProcessedMutation = {
                updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
                status: 'REJECTED', appliedServerVersion: null, errorCode: 'RECORD_DELETED',
                message: 'Cannot update a deleted tombstone record', currentRecord: deepClone(existing) as unknown as Record<string, unknown>, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
              };
              processedMutationsStore.set(m.updateId, rejectedRecord);
              results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'RECORD_DELETED', message: rejectedRecord.message, currentRecord: deepClone(rejectedRecord.currentRecord) as unknown as Record<string, unknown> });
              continue;
            }

            if (existing.recordVersion !== m.baseRecordVersion) {
              const rejectedRecord: ServerProcessedMutation = {
                updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT',
                status: 'REJECTED', appliedServerVersion: null, errorCode: 'STALE_VERSION',
                message: `Version mismatch (client base: ${m.baseRecordVersion}, server current: ${existing.recordVersion})`, currentRecord: deepClone(existing) as unknown as Record<string, unknown>, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
              };
              processedMutationsStore.set(m.updateId, rejectedRecord);
              results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'STALE_VERSION', message: rejectedRecord.message, currentRecord: deepClone(rejectedRecord.currentRecord) as unknown as Record<string, unknown> });
              continue;
            }
          }

          const childStateBackup: ServerChildSyncState = deepClone(childState);
          const originalExistingRecordBackup: ServerCanonicalRecord | null = existing ? deepClone(existing) : null;
          const logLengthBackup = mutationLog.length;
          const hadProcessedRecord = processedMutationsStore.has(m.updateId);

          try {
            const nextServerVersion = childState.currentServerVersion + 1;
            const newRecordVersion = existing ? existing.recordVersion + 1 : 1;

            const updatedCanonical: ServerCanonicalRecord = {
              id: m.recordId, childId, recordVersion: newRecordVersion, lessonId: m.record!.lessonId,
              date: m.record!.date, status: m.record!.status, score: m.record!.score ?? null,
              completedAt: m.record!.completedAt ?? null, updatedAt: m.record!.updatedAt || new Date().toISOString(),
              isDeleted: false, deletedAt: null, data: deepClone(m.record!.data || {}),
            };

            records.set(m.recordId, updatedCanonical);
            await triggerCheckpointIfNeeded('AFTER_CANONICAL_WRITE');

            mutationLog.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              childId, serverVersion: nextServerVersion, updateId: m.updateId, action: 'UPSERT',
              recordId: m.recordId, recordData: deepClone(updatedCanonical) as unknown as Record<string, unknown>, createdAt: new Date().toISOString(),
            });
            await triggerCheckpointIfNeeded('AFTER_MUTATION_LOG_WRITE');

            processedMutationsStore.set(m.updateId, {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'UPSERT', status: 'SUCCESS',
              appliedServerVersion: nextServerVersion, newRecordVersion, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            });
            await triggerCheckpointIfNeeded('AFTER_PROCESSED_MUTATION_WRITE');

            childState.currentServerVersion = nextServerVersion;
            childState.updatedAt = new Date().toISOString();
            await triggerCheckpointIfNeeded('AFTER_SERVER_VERSION_UPDATE');

            results.push({ updateId: m.updateId, status: 'SUCCESS', recordId: m.recordId, appliedServerVersion: nextServerVersion, newRecordVersion });
          } catch (err) {
            if (originalExistingRecordBackup) records.set(m.recordId, originalExistingRecordBackup);
            else records.delete(m.recordId);
            while (mutationLog.length > logLengthBackup) mutationLog.pop();
            if (!hadProcessedRecord) processedMutationsStore.delete(m.updateId);
            childState.currentServerVersion = childStateBackup.currentServerVersion;
            childState.oldestRetainedServerVersion = childStateBackup.oldestRetainedServerVersion;
            childState.updatedAt = childStateBackup.updatedAt;
            throw err;
          }
        } else if (m.action === 'DELETE') {
          if (!existing) {
            const rejectedRecord: ServerProcessedMutation = {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'DELETE',
              status: 'REJECTED', appliedServerVersion: null, errorCode: 'RECORD_NOT_FOUND',
              message: `Record with id '${m.recordId}' does not exist on server`, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            };
            processedMutationsStore.set(m.updateId, rejectedRecord);
            results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'RECORD_NOT_FOUND', message: rejectedRecord.message });
            continue;
          }

          if (existing.isDeleted) {
            const rejectedRecord: ServerProcessedMutation = {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'DELETE',
              status: 'REJECTED', appliedServerVersion: null, errorCode: 'ALREADY_DELETED',
              message: 'Record is already a deleted tombstone', currentRecord: deepClone(existing) as unknown as Record<string, unknown>, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            };
            processedMutationsStore.set(m.updateId, rejectedRecord);
            results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'ALREADY_DELETED', message: rejectedRecord.message, currentRecord: deepClone(rejectedRecord.currentRecord) as unknown as Record<string, unknown> });
            continue;
          }

          if (existing.recordVersion !== m.baseRecordVersion) {
            const rejectedRecord: ServerProcessedMutation = {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'DELETE',
              status: 'REJECTED', appliedServerVersion: null, errorCode: 'STALE_VERSION',
              message: `Version mismatch for delete (client base: ${m.baseRecordVersion}, server current: ${existing.recordVersion})`, currentRecord: deepClone(existing) as unknown as Record<string, unknown>, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            };
            processedMutationsStore.set(m.updateId, rejectedRecord);
            results.push({ updateId: m.updateId, status: 'REJECTED', recordId: m.recordId, appliedServerVersion: null, errorCode: 'STALE_VERSION', message: rejectedRecord.message, currentRecord: deepClone(rejectedRecord.currentRecord) as unknown as Record<string, unknown> });
            continue;
          }

          const childStateBackup: ServerChildSyncState = deepClone(childState);
          const originalExistingRecordBackup: ServerCanonicalRecord = deepClone(existing);
          const logLengthBackup = mutationLog.length;
          const hadProcessedRecord = processedMutationsStore.has(m.updateId);

          try {
            const nextServerVersion = childState.currentServerVersion + 1;
            const newRecordVersion = existing.recordVersion + 1;

            existing.isDeleted = true;
            existing.deletedAt = new Date().toISOString();
            existing.recordVersion = newRecordVersion;
            existing.updatedAt = new Date().toISOString();
            await triggerCheckpointIfNeeded('AFTER_CANONICAL_WRITE');

            mutationLog.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              childId, serverVersion: nextServerVersion, updateId: m.updateId, action: 'DELETE',
              recordId: m.recordId, recordData: null, createdAt: new Date().toISOString(),
            });
            await triggerCheckpointIfNeeded('AFTER_MUTATION_LOG_WRITE');

            processedMutationsStore.set(m.updateId, {
              updateId: m.updateId, childId, recordId: m.recordId, action: 'DELETE', status: 'SUCCESS',
              appliedServerVersion: nextServerVersion, newRecordVersion, processedAt: new Date().toISOString(), originalInput: originalInputSnapshot,
            });
            await triggerCheckpointIfNeeded('AFTER_PROCESSED_MUTATION_WRITE');

            childState.currentServerVersion = nextServerVersion;
            childState.updatedAt = new Date().toISOString();
            await triggerCheckpointIfNeeded('AFTER_SERVER_VERSION_UPDATE');

            results.push({ updateId: m.updateId, status: 'SUCCESS', recordId: m.recordId, appliedServerVersion: nextServerVersion, newRecordVersion });
          } catch (err) {
            records.set(m.recordId, originalExistingRecordBackup);
            while (mutationLog.length > logLengthBackup) mutationLog.pop();
            if (!hadProcessedRecord) processedMutationsStore.delete(m.updateId);
            childState.currentServerVersion = childStateBackup.currentServerVersion;
            childState.oldestRetainedServerVersion = childStateBackup.oldestRetainedServerVersion;
            childState.updatedAt = childStateBackup.updatedAt;
            throw err;
          }
        }
      }

      return { status: 200, body: { success: true, childId, currentChildVersion: childState.currentServerVersion, results } };
    });
  });
}

// ============================================================================
// GET /api/sync CORE ENGINE
// ============================================================================

export async function processSyncPull(
  childId: string,
  sinceVersion: number,
  limit: number = 50
): Promise<{ status: number; body: GetSyncResponse | { success: false; error: { code: string; message: string } } }> {
  if (!childId || typeof childId !== 'string') return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'Missing or invalid childId' } } };
  if (typeof sinceVersion !== 'number' || !Number.isInteger(sinceVersion) || sinceVersion < 0) {
    return { status: 400, body: { success: false, error: { code: 'INVALID_REQUEST', message: 'sinceVersion must be a non-negative integer (>= 0)' } } };
  }

  const safeLimit = Math.max(1, Math.min(limit || 50, 200));

  return withChildLock(childId, async () => {
    const childState = getOrCreateChildState(childId);
    const records = getChildRecords(childId);
    const mutationLog = getChildMutationLog(childId);

    if (sinceVersion === 0) {
      const snapshotVersion = childState.currentServerVersion;
      const clonedRecords: ServerCanonicalRecord[] = [];
      for (const r of records.values()) {
        if (!r.isDeleted) clonedRecords.push(deepClone(r));
      }
      return { status: 200, body: { success: true, childId, mode: 'SNAPSHOT', snapshotVersion, records: clonedRecords } };
    }

    if (sinceVersion < childState.oldestRetainedServerVersion - 1) {
      return {
        status: 200,
        body: { success: true, childId, mode: 'SNAPSHOT_REQUIRED', oldestRetainedServerVersion: childState.oldestRetainedServerVersion, currentServerVersion: childState.currentServerVersion, message: `Client sync cursor (${sinceVersion}) is older than oldest retained log version (${childState.oldestRetainedServerVersion}). Full snapshot bootstrap required.` },
      };
    }

    const eligibleLogs = mutationLog.filter((m) => m.serverVersion > sinceVersion);
    eligibleLogs.sort((a, b) => a.serverVersion - b.serverVersion);

    const page = eligibleLogs.slice(0, safeLimit);
    const hasMore = eligibleLogs.length > safeLimit;
    const toVersion = page.length > 0 ? page[page.length - 1].serverVersion : sinceVersion;

    const changes = page.map((log) => ({
      serverVersion: log.serverVersion, updateId: log.updateId, action: log.action, recordId: log.recordId,
      record: log.action === 'UPSERT' ? deepClone(log.recordData || null) : null,
    }));

    return { status: 200, body: { success: true, childId, mode: 'DELTA', fromVersion: sinceVersion, toVersion, currentServerVersion: childState.currentServerVersion, hasMore, changes } };
  });
}
