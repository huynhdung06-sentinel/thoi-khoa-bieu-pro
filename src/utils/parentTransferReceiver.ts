import { saveChildLocalAppData, APP_DATA_KEYS } from './localLearningDb';
import { validateAndParseTransfer } from './transferProtocol';

export interface ReceiveTransferResult {
  success: boolean;
  transferId: string;
  childId: string;
  error?: string;
  acknowledged?: boolean;
}

export let _receiveAndApplyTransferOverride: null | ((childId: string, transferId: string, options?: any) => Promise<ReceiveTransferResult>) = null;

export function setReceiveAndApplyTransferOverride(override: typeof _receiveAndApplyTransferOverride) {
  _receiveAndApplyTransferOverride = override;
}

/**
 * Parent-side Core Receiver:
 * 1. Fetches a transfer package from the temporary RAM relay
 * 2. Validates the package with validateAndParseTransfer()
 * 3. Asserts the childId matches
 * 4. Saves all 8 canonical entities to IndexedDB using child-scoped storage (snapshot replacement)
 * 5. Sends POST /api/transfer/:transferId/ack on successful save
 */
export async function receiveAndApplyTransfer(
  childId: string,
  transferId: string,
  options?: { baseUrl?: string; fetchFn?: typeof fetch }
): Promise<ReceiveTransferResult> {
  if (_receiveAndApplyTransferOverride) {
    return _receiveAndApplyTransferOverride(childId, transferId, options);
  }
  const baseUrl = options?.baseUrl || '';
  const fetchFn = options?.fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined);

  if (!fetchFn) {
    return {
      success: false,
      transferId,
      childId,
      error: 'Fetch function is not available in this environment.',
    };
  }

  try {
    // 1. Fetch Transfer Package from RAM relay
    const url = `${baseUrl}/api/transfer/${transferId}`;
    const response = await fetchFn(url);
    if (!response.ok) {
      return {
        success: false,
        transferId,
        childId,
        error: `Failed to fetch transfer package. HTTP status: ${response.status}`,
      };
    }

    const pkgJson = await response.json();

    // 2. Validate and Parse
    const validation = validateAndParseTransfer(pkgJson);
    if (!validation.isValid) {
      const errorMsg = 'error' in validation ? validation.error : 'Unknown validation error';
      return {
        success: false,
        transferId,
        childId,
        error: `Validation failed: ${errorMsg}`,
      };
    }

    const pkg = validation.package;

    // Check if package is intended for the specified childId
    if (pkg.childId !== childId) {
      return {
        success: false,
        transferId,
        childId,
        error: `Child mismatch: package childId is '${pkg.childId}' but expected '${childId}'`,
      };
    }

    // 3. Snapshot Replacement into IndexedDB (Child-Scoped)
    const { data } = pkg;

    await saveChildLocalAppData(childId, APP_DATA_KEYS.CLASS_INFO, data.classInfo);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.SUBJECTS, data.subjects);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.TIMETABLE_SLOTS, data.timetableSlots);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.PERIODS, data.periods);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.LESSONS, data.lessons);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.LESSON_PLANS, data.lessonPlans);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.STUDY_RECORDS, data.studyRecords);
    await saveChildLocalAppData(childId, APP_DATA_KEYS.DOCUMENTS, data.documents);

    // 4. POST /api/transfer/:transferId/ack only on successful save
    const ackUrl = `${baseUrl}/api/transfer/${transferId}/ack`;
    const ackResponse = await fetchFn(ackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!ackResponse.ok) {
      return {
        success: true,
        transferId,
        childId,
        acknowledged: false,
        error: `IndexedDB saved, but ACK request failed. HTTP status: ${ackResponse.ok}`,
      };
    }

    const ackResult = await ackResponse.json();

    return {
      success: true,
      transferId,
      childId,
      acknowledged: ackResult?.acknowledged === true,
    };
  } catch (err: any) {
    return {
      success: false,
      transferId,
      childId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
