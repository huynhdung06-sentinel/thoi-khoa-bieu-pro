import { useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { receiveAndApplyTransfer, ReceiveTransferResult } from '../utils/parentTransferReceiver';

interface UseParentTransferListenerOptions {
  onSuccess?: (result: ReceiveTransferResult) => void;
  onError?: (err: any) => void;
  baseUrl?: string;
}

/**
 * Custom React Hook that establishes an SSE (EventSource) connection to listen for
 * TRANSFER_AVAILABLE notifications for the active child.
 *
 * Requirements:
 * - Only runs when currentRole === 'admin' and activeChildId is defined.
 * - Auto-reconnects/re-establishes SSE on activeChildId changes (closing the old one).
 * - Automatically triggers receiveAndApplyTransfer() upon receiving TRANSFER_AVAILABLE.
 * - Safely closes SSE connection on unmount or child ID change.
 * - Prevents multiple concurrent/duplicate connections for the same child.
 */
export function useParentTransferListener(
  role: UserRole,
  activeChildId: string | null | undefined,
  options?: UseParentTransferListenerOptions
) {
  const onSuccessRef = useRef(options?.onSuccess);
  const onErrorRef = useRef(options?.onError);
  const baseUrl = options?.baseUrl || '';

  // Stabilize callbacks using refs to prevent effect re-runs when callbacks change
  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
    onErrorRef.current = options?.onError;
  }, [options?.onSuccess, options?.onError]);

  useEffect(() => {
    // 1. Guard check: only run when role is 'admin' (Parent/Admin) and there is a valid activeChildId
    if (role !== 'admin' || !activeChildId) {
      return;
    }

    let isCancelled = false;
    let eventSource: EventSource | null = null;

    try {
      const url = `${baseUrl}/api/transfer/events?childId=${encodeURIComponent(activeChildId)}`;
      eventSource = new EventSource(url);

      // Listen to TRANSFER_AVAILABLE event
      eventSource.addEventListener('TRANSFER_AVAILABLE', async (event: MessageEvent) => {
        if (isCancelled) return;

        try {
          const data = JSON.parse(event.data);
          const { transferId } = data;

          if (!transferId) {
            console.warn('[ParentSSEListener] Received event with empty transferId');
            return;
          }

          // Trigger Core Receiver to fetch, validate, snapshot-apply, and ACK
          const result = await receiveAndApplyTransfer(activeChildId, transferId, { baseUrl });

          if (result.success) {
            if (onSuccessRef.current) {
              onSuccessRef.current(result);
            }
          } else {
            console.error('[ParentSSEListener] Failed to apply transfer:', result.error);
            if (onErrorRef.current) {
              onErrorRef.current(new Error(result.error || 'Apply transfer failed'));
            }
          }
        } catch (err) {
          console.error('[ParentSSEListener] Error parsing SSE payload:', err);
          if (onErrorRef.current) {
            onErrorRef.current(err);
          }
        }
      });

      eventSource.onerror = (err) => {
        console.warn('[ParentSSEListener] EventSource error or disconnected:', err);
      };

    } catch (err) {
      console.error('[ParentSSEListener] Failed to initialize EventSource:', err);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
    }

    // Cleanup: close SSE connection on unmount or when child/role changes
    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [role, activeChildId, baseUrl]);
}
