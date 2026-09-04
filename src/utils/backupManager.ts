import { ClassInfo, TimetableSlot, Subject, Lesson, LessonPlan, StudyRecord, DocumentItem, PeriodInfo, FamilyAccount } from '../types';

const STORAGE_PREFIX = 'thoikhoabieu_';
const LAST_BACKUP_KEY = `${STORAGE_PREFIX}last_backup_timestamp`;
const UNSAVED_CHANGES_KEY = `${STORAGE_PREFIX}unsaved_changes_count`;

export interface BackupPackage {
  schema: 'THOI_KHOA_BIEU_LOCAL_FIRST_BACKUP';
  version: '2.0.0';
  appTitle: 'Thời Khóa Biểu & Thư Viện Học Tập Cấp 2';
  exportedAt: string;
  exportedTimestamp: number;
  metadata: {
    studentName: string;
    className: string;
    totalSlots: number;
    totalLessons: number;
    totalRecords: number;
    totalDocuments: number;
    childrenCount: number;
  };
  family: FamilyAccount;
  classInfo: ClassInfo;
  timetableSlots: TimetableSlot[];
  subjects: Subject[];
  periods: PeriodInfo[];
  lessons: Lesson[];
  lessonPlans: LessonPlan[];
  studyRecords: StudyRecord[];
  documents: DocumentItem[];
}

export function getLastBackupTimestamp(): number {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return 0;
}

export function setLastBackupTimestamp(ts: number = Date.now()): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, ts.toString());
    localStorage.setItem(UNSAVED_CHANGES_KEY, '0');
  } catch {}
}

export function getUnsavedChangesCount(): number {
  try {
    const raw = localStorage.getItem(UNSAVED_CHANGES_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return 0;
}

export function incrementUnsavedChanges(delta: number = 1): number {
  try {
    const current = getUnsavedChangesCount();
    const next = current + delta;
    localStorage.setItem(UNSAVED_CHANGES_KEY, next.toString());
    return next;
  } catch {
    return 0;
  }
}

export function resetUnsavedChanges(): void {
  try {
    localStorage.setItem(UNSAVED_CHANGES_KEY, '0');
    localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
  } catch {}
}

export function getBackupStatus(): {
  status: 'fresh' | 'pending' | 'warning';
  daysSinceLastBackup: number;
  unsavedCount: number;
  lastBackupDateStr: string;
} {
  const lastTs = getLastBackupTimestamp();
  const unsavedCount = getUnsavedChangesCount();
  
  const now = Date.now();
  const diffMs = lastTs > 0 ? now - lastTs : Infinity;
  const daysSinceLastBackup = lastTs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 999;
  
  const lastBackupDateStr = lastTs > 0 
    ? new Date(lastTs).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Chưa từng sao lưu';

  let status: 'fresh' | 'pending' | 'warning' = 'fresh';

  if (lastTs === 0 || daysSinceLastBackup >= 4 || unsavedCount >= 5) {
    status = 'warning';
  } else if (unsavedCount > 0 || daysSinceLastBackup >= 2) {
    status = 'pending';
  } else {
    status = 'fresh';
  }

  return {
    status,
    daysSinceLastBackup,
    unsavedCount,
    lastBackupDateStr
  };
}

export function createBackupPackage(params: {
  family: FamilyAccount;
  classInfo: ClassInfo;
  timetableSlots: TimetableSlot[];
  subjects: Subject[];
  periods: PeriodInfo[];
  lessons: Lesson[];
  lessonPlans: LessonPlan[];
  studyRecords: StudyRecord[];
  documents: DocumentItem[];
}): BackupPackage {
  const {
    family,
    classInfo,
    timetableSlots,
    subjects,
    periods,
    lessons,
    lessonPlans,
    studyRecords,
    documents
  } = params;

  return {
    schema: 'THOI_KHOA_BIEU_LOCAL_FIRST_BACKUP',
    version: '2.0.0',
    appTitle: 'Thời Khóa Biểu & Thư Viện Học Tập Cấp 2',
    exportedAt: new Date().toISOString(),
    exportedTimestamp: Date.now(),
    metadata: {
      studentName: classInfo.studentName || 'Học sinh',
      className: classInfo.className || 'Lớp học',
      totalSlots: timetableSlots.length,
      totalLessons: lessons.length,
      totalRecords: studyRecords.length,
      totalDocuments: documents.length,
      childrenCount: family.children?.length || 0,
    },
    family,
    classInfo,
    timetableSlots,
    subjects,
    periods,
    lessons,
    lessonPlans,
    studyRecords,
    documents,
  };
}

export function validateAndParseBackup(jsonText: string): {
  isValid: boolean;
  error?: string;
  data?: Partial<BackupPackage>;
  summary?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Tệp không phải định dạng JSON hợp lệ.' };
    }

    // Check minimum requirements: either v2 schema or legacy format
    const hasClassInfo = Boolean(parsed.classInfo && typeof parsed.classInfo === 'object');
    const hasSlots = Array.isArray(parsed.timetableSlots);
    const hasLessons = Array.isArray(parsed.lessons);

    if (!hasClassInfo && !hasSlots && !hasLessons) {
      return { isValid: false, error: 'Tệp không chứa cấu trúc thời khóa biểu hợp lệ của ứng dụng.' };
    }

    const studentName = parsed.classInfo?.studentName || parsed.metadata?.studentName || 'Học sinh';
    const className = parsed.classInfo?.className || parsed.metadata?.className || 'Lớp học';
    const slotCount = Array.isArray(parsed.timetableSlots) ? parsed.timetableSlots.length : 0;
    const lessonCount = Array.isArray(parsed.lessons) ? parsed.lessons.length : 0;
    const recordCount = Array.isArray(parsed.studyRecords) ? parsed.studyRecords.length : 0;

    const summary = `${studentName} (${className}) • ${slotCount} tiết học • ${lessonCount} bài học • ${recordCount} ghi chú`;

    return {
      isValid: true,
      data: parsed,
      summary
    };
  } catch (err: any) {
    return { isValid: false, error: `Lỗi đọc tệp: ${err?.message || 'Tệp bị lỗi cú pháp'}` };
  }
}
