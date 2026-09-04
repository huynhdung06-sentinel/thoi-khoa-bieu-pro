export type UserRole = 'student' | 'admin';

export interface ChildProfile {
  id: string;
  name: string;
  grade?: number | string; // 6, 7, 8, 9, or "Lớp 10A1", "Sinh viên Năm 2"
  className?: string; // e.g. "9A1", "Kỹ thuật phần mềm"
  avatar: string; // emoji icon e.g. "🚀", "🐱", "🦁", "🦊", "⭐", "🦄", "⚽", "🎮", "📚"
  studentCode?: string; // Mã kết nối riêng biệt cho con (do phụ huynh tạo, vd: 123456 hoặc AN8899)
}

export interface FamilyAccount {
  parentName: string;
  parentPin: string;
  parentEmail?: string;
  children: ChildProfile[];
}

export type SessionPeriod = 'morning' | 'afternoon';

export interface PeriodInfo {
  period: number;
  startTime: string;
  endTime: string;
  session: SessionPeriod;
}

export interface Subject {
  id: string;
  name: string;
  shortName?: string;
  defaultTeacher: string;
  color: string;
  bgColor?: string;
  emoji?: string;
  masterPdfUrl?: string; // Sách giáo khoa PDF dùng chung
  masterPdfName?: string; 
}

export interface LessonSection {
  id: string;
  title: string;
  type: 'html' | 'embedded_html' | 'youtube' | 'homework_image' | 'pdf_page' | 'link';
  content?: string; // HTML rich content, notes, raw text, or raw HTML file code
  url?: string; // YouTube link, external link, or PDF url
  imageUrls?: string[]; // Array of image URLs (homework / drawings / photos)
  pdfPageNumber?: number;
  pdfEndPage?: number;
  order: number;
  fileName?: string;
}

export interface LessonReference {
  id: string;
  type: 'youtube' | 'html' | 'embedded_html' | 'image' | 'link';
  title: string;
  url: string;
  htmlContent?: string;
}

export interface Lesson {
  id: string;
  subjectName: string;
  lessonNumber: number;
  title: string;
  chapter?: string;
  summary?: string;
  keyPoints?: string[];
  materialsUrl?: string;
  examples?: { question: string; answer: string; tip?: string }[];
  flashcards?: { question: string; answer: string }[];
  personalNote?: string;
  isBookmarked?: boolean;
  gradeLevel?: string;
  term?: string;
  volume?: number; // Tập 1 (HK1) hoặc Tập 2 (HK2)
  masterDocumentUrl?: string; // URL của file SGK PDF gốc
  pdfPageNumber?: number; // Trang bắt đầu
  pdfEndPage?: number;    // Trang kết thúc
  references?: LessonReference[]; // Danh sách tài liệu tham khảo (Youtube, HTML, hình ảnh)
  sections?: LessonSection[]; // Mục lục & các khối nội dung bài học đa phương tiện
  activeSectionId?: string;
  completedHomeworkImages?: string[]; // Danh sách ảnh chụp bài làm sau khi học xong
  htmlBody?: string; // Nội dung HTML bài học chính nếu có
  embeddedHtmlCode?: string; // Mã hoặc file HTML được kéo thả/nhúng riêng biệt
  embeddedHtmlFileName?: string; // Tên file HTML đã tải/kéo thả
  youtubeUrl?: string; // Video Youtube bài giảng chính
  youtubeVideos?: { id: string; title: string; url: string; note?: string }[]; // Danh sách nhiều thẻ video Youtube
  pdfStorageKey?: string; // Khóa định danh luồng lưu trữ IndexedDB cho file PDF lớn
  textbookLinks?: { id: string; title: string; url: string; description?: string; platform?: 'drive' | 'cloud' | 'onedrive' | 'hanhtrangso' | 'other' }[]; // Danh sách link SGK điện tử, Drive, Cloud
  mindmapReport?: LessonMindmapReport; // Báo cáo học bài & Sơ đồ tư duy dạng cây
}

export interface MindmapSection {
  id: string;
  title: string; // Tên phần (e.g., "Phần 1: Khái niệm & Định nghĩa")
  keyPoints: string[]; // Các ý chính của phần
}

export interface LessonMindmapReport {
  lessonTitle: string;
  sections: MindmapSection[];
  studentNote?: string;
  submittedAt?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 2 -> 7 (Thứ 2 đến Thứ 7)
  session: SessionPeriod;
  period: number; // 1 -> 5
  subjectName: string;
  teacher: string;
  room?: string;
}

export interface LessonPlan {
  id: string; // e.g. "plan-2016-12-19-m-1-2"
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 2..7
  session: SessionPeriod;
  period: number;
  subjectName: string;
  teacher: string;
  lessonId?: string;
  lessonTitle?: string;
  summary?: string;
  keyPoints?: string[];
  customNote?: string;
}

export type StudyRecordStatus = 'COMPLETED' | 'NEEDS_REVISION' | 'PENDING';

export interface StudyRecord {
  id: string;
  studentId?: string;
  studentName: string;
  lessonPlanId: string; // matches LessonPlan.id
  lessonId?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: number;
  session: SessionPeriod;
  period: number;
  subjectName: string;
  lessonTitle: string;
  mindmapImageUrl: string;
  completedImages?: string[];
  mindmapTitle?: string;
  studentNote?: string;
  mindmapReport?: LessonMindmapReport;
  submittedAt: string; // ISO string
  status: StudyRecordStatus;
  parentFeedback?: string;
  parentReviewedAt?: string;
  showOnTimetable?: boolean;
}

export interface ClassInfo {
  className: string; // "11A1-01"
  teacherName: string; // "Nguyễn Đức Việt"
  weekStartDate: string; // "YYYY-MM-DD"
  studentName: string; // "Nguyễn Minh"
}

export type DashboardTab = 'timetable' | 'mindmap_gallery' | 'analytics' | 'lessons' | 'knowledge_summary';

export type DocumentCategory = 'lecture' | 'assignment' | 'exam' | 'handout' | 'reference';

export interface DocumentItem {
  id: string;
  title: string;
  subjectName: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: 'pdf' | 'docx' | 'image' | 'presentation' | 'sheet' | 'text' | 'other';
  fileDataUrl?: string; // Base64 data URL for fast local view
  fileUrl?: string; // External or blob URL
  category: DocumentCategory;
  uploadedAt: string; // ISO date
  uploaderRole: UserRole;
  uploaderName?: string;
  description?: string;
  tags?: string[];
  lessonTitle?: string;
  downloadsCount?: number;
}


// Backward compatibility types for legacy files
export type ViewMode = 'day' | 'week' | 'month' | 'year';
export type PlatformType = string;
export interface StudySlot {
  id: string;
  title?: string;
  subjectName: string;
  subjectCode?: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  teacher?: string;
  description?: string;
  homework?: string;
  studyUrl?: string;
  studyLink?: string;
  color?: string;
  notes?: string;
  isCompleted?: boolean;
  platform?: PlatformType;
  [key: string]: any;
}
export interface DayInfo {
  date: Date;
  dateStr?: string;
  dateString?: string;
  dayOfWeek: number | string;
  dayName?: string;
  dayNameShort?: string;
  dayNameFull?: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  [key: string]: any;
}
