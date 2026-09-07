import type {
  ClassInfo,
  Subject,
  TimetableSlot,
  PeriodInfo,
  Lesson,
  LessonPlan,
  StudyRecord,
  DocumentItem,
} from '../types';

/**
 * Transfer Protocol Constants
 */
export const TRANSFER_SCHEMA = 'THOI_KHOA_BIEU_TRANSFER' as const;
export const TRANSFER_VERSION = '1.0.0' as const;

export type TransferSchemaType = typeof TRANSFER_SCHEMA;
export type TransferVersionType = typeof TRANSFER_VERSION;

/**
 * Canonical dataset containing exactly 8 entities for transfer
 */
export interface TransferCanonicalData {
  classInfo: ClassInfo;
  subjects: Subject[];
  timetableSlots: TimetableSlot[];
  periods: PeriodInfo[];
  lessons: Lesson[];
  lessonPlans: LessonPlan[];
  studyRecords: StudyRecord[];
  documents: DocumentItem[];
}

/**
 * Self-contained, isolated TransferPackage contract
 */
export interface TransferPackage {
  schema: 'THOI_KHOA_BIEU_TRANSFER';
  version: '1.0.0';
  transferId: string;
  childId: string;
  createdAt: string;
  data: TransferCanonicalData;
}

export interface TransferValidationSuccess {
  isValid: true;
  package: TransferPackage;
}

export interface TransferValidationFailure {
  isValid: false;
  error: string;
}

export type TransferValidationResult = TransferValidationSuccess | TransferValidationFailure;

/**
 * Generates a unique Transfer ID
 */
export function createTransferId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `trf_${crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(36).substring(2, 11);
  return `trf_${Date.now()}_${rand}`;
}

/**
 * Creates a valid, normalized TransferPackage from childId and 8 canonical entities
 */
export function createTransferPackage(
  childId: string,
  data: TransferCanonicalData,
  options?: {
    transferId?: string;
    createdAt?: string;
  }
): TransferPackage {
  if (!childId || typeof childId !== 'string' || !childId.trim()) {
    throw new Error('childId is required to create a TransferPackage');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('data (TransferCanonicalData) is required to create a TransferPackage');
  }

  return {
    schema: TRANSFER_SCHEMA,
    version: TRANSFER_VERSION,
    transferId: options?.transferId?.trim() || createTransferId(),
    childId: childId.trim(),
    createdAt: options?.createdAt || new Date().toISOString(),
    data: {
      classInfo: data.classInfo ? { ...data.classInfo } : { className: '', teacherName: '', weekStartDate: '', studentName: '' },
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      timetableSlots: Array.isArray(data.timetableSlots) ? data.timetableSlots : [],
      periods: Array.isArray(data.periods) ? data.periods : [],
      lessons: Array.isArray(data.lessons) ? data.lessons : [],
      lessonPlans: Array.isArray(data.lessonPlans) ? data.lessonPlans : [],
      studyRecords: Array.isArray(data.studyRecords) ? data.studyRecords : [],
      documents: Array.isArray(data.documents) ? data.documents : [],
    },
  };
}

/**
 * Serializes a TransferPackage into a JSON string
 */
export function serializeTransferPackage(pkg: TransferPackage): string {
  return JSON.stringify(pkg);
}

/**
 * Calculates byte size of a TransferPackage or JSON string using UTF-8 encoding
 */
export function getTransferPackageByteSize(pkgOrJson: TransferPackage | string): number {
  const jsonStr = typeof pkgOrJson === 'string' ? pkgOrJson : JSON.stringify(pkgOrJson);
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(jsonStr).byteLength;
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(jsonStr, 'utf8');
  }
  return jsonStr.length;
}

/**
 * Validates and parses an unknown input (JSON string or object) into a verified TransferPackage
 */
export function validateAndParseTransfer(input: unknown): TransferValidationResult {
  if (input === null || input === undefined) {
    return { isValid: false, error: 'Input cannot be null or undefined' };
  }

  let parsed: unknown = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (err: any) {
      return { isValid: false, error: `Invalid JSON format: ${err?.message || 'JSON Parse Error'}` };
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { isValid: false, error: 'Transfer package must be a JSON object' };
  }

  const candidate = parsed as Record<string, any>;

  // Check forbidden leak fields (e.g. family, pin, parentPin, tokens)
  if ('family' in candidate || 'parentPin' in candidate || 'pin' in candidate) {
    return { isValid: false, error: 'Transfer package contains forbidden authentication/family fields' };
  }

  // Check schema
  if (candidate.schema !== TRANSFER_SCHEMA) {
    return { isValid: false, error: `Invalid schema: expected '${TRANSFER_SCHEMA}', got '${candidate.schema}'` };
  }

  // Check version
  if (candidate.version !== TRANSFER_VERSION) {
    return { isValid: false, error: `Invalid version: expected '${TRANSFER_VERSION}', got '${candidate.version}'` };
  }

  // Check transferId
  if (typeof candidate.transferId !== 'string' || !candidate.transferId.trim()) {
    return { isValid: false, error: 'Missing or invalid transferId (must be a non-empty string)' };
  }

  // Check childId
  if (typeof candidate.childId !== 'string' || !candidate.childId.trim()) {
    return { isValid: false, error: 'Missing or invalid childId (must be a non-empty string)' };
  }

  // Check createdAt
  if (typeof candidate.createdAt !== 'string' || !candidate.createdAt.trim()) {
    return { isValid: false, error: 'Missing or invalid createdAt (must be a non-empty ISO string)' };
  }

  // Check data object
  if (typeof candidate.data !== 'object' || candidate.data === null || Array.isArray(candidate.data)) {
    return { isValid: false, error: 'Missing or invalid data payload object' };
  }

  const data = candidate.data as Record<string, any>;

  // 1. classInfo
  if (typeof data.classInfo !== 'object' || data.classInfo === null || Array.isArray(data.classInfo)) {
    return { isValid: false, error: 'Invalid canonical entity: classInfo must be an object' };
  }

  // 2. subjects
  if (!Array.isArray(data.subjects)) {
    return { isValid: false, error: 'Invalid canonical entity: subjects must be an array' };
  }

  // 3. timetableSlots
  if (!Array.isArray(data.timetableSlots)) {
    return { isValid: false, error: 'Invalid canonical entity: timetableSlots must be an array' };
  }

  // 4. periods
  if (!Array.isArray(data.periods)) {
    return { isValid: false, error: 'Invalid canonical entity: periods must be an array' };
  }

  // 5. lessons
  if (!Array.isArray(data.lessons)) {
    return { isValid: false, error: 'Invalid canonical entity: lessons must be an array' };
  }

  // 6. lessonPlans
  if (!Array.isArray(data.lessonPlans)) {
    return { isValid: false, error: 'Invalid canonical entity: lessonPlans must be an array' };
  }

  // 7. studyRecords
  if (!Array.isArray(data.studyRecords)) {
    return { isValid: false, error: 'Invalid canonical entity: studyRecords must be an array' };
  }

  // 8. documents
  if (!Array.isArray(data.documents)) {
    return { isValid: false, error: 'Invalid canonical entity: documents must be an array' };
  }

  const validatedPackage: TransferPackage = {
    schema: TRANSFER_SCHEMA,
    version: TRANSFER_VERSION,
    transferId: candidate.transferId.trim(),
    childId: candidate.childId.trim(),
    createdAt: candidate.createdAt.trim(),
    data: {
      classInfo: data.classInfo,
      subjects: data.subjects,
      timetableSlots: data.timetableSlots,
      periods: data.periods,
      lessons: data.lessons,
      lessonPlans: data.lessonPlans,
      studyRecords: data.studyRecords,
      documents: data.documents,
    },
  };

  return { isValid: true, package: validatedPackage };
}
