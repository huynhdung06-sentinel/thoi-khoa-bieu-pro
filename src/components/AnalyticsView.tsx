import React, { useState, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { StudyRecord, LessonPlan, TimetableSlot, DocumentItem, UserRole, Subject } from '../types';
import { SUBJECTS_LIST, STANDARD_PERIODS } from '../data/mockData';
import { getTodayVietnamInfo, formatDateToYYYYMMDD, getVietnamCurrentMondayStr } from '../utils/dateUtils';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Eye,
  Check,
  ShieldCheck,
  Award,
  Search,
  RotateCcw,
  BookMarked,
  Filter,
  Share2,
  X,
  Download,
  Mail,
  Send,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface AnalyticsViewProps {
  studyRecords: StudyRecord[];
  lessonPlans: LessonPlan[];
  timetableSlots: TimetableSlot[];
  documents: DocumentItem[];
  currentRole: UserRole;
  weekStartDate: string;
  subjects?: Subject[];
  onNavigateTab: (tab: any) => void;
  onSelectSubject?: (subjectName: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  studyRecords,
  lessonPlans,
  timetableSlots,
  documents,
  currentRole,
  weekStartDate,
  subjects = SUBJECTS_LIST,
  onNavigateTab,
  onSelectSubject,
}) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportDataUrl, setReportDataUrl] = useState<string | null>(null);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const handleShareReport = async () => {
    if (!captureRef.current) return;
    setIsSharing(true);
    setCopyNotice(null);
    try {
      // 1. Capture the div
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff'
      });

      // 2. Convert base64 to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      setReportDataUrl(dataUrl);
      setReportBlob(blob);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error sharing report:', err);
      alert('Có lỗi khi tạo ảnh báo cáo.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!reportDataUrl) return;
    const a = document.createElement('a');
    a.href = reportDataUrl;
    a.download = `Bao_Cao_Hoc_Tap_${getTodayVietnamInfo().dateStr}.png`;
    a.click();
    setCopyNotice('Đã tải ảnh báo cáo về máy thành công! 📥');
  };

  const copyImageToClipboard = async () => {
    if (!reportBlob) return false;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': reportBlob })
        ]);
        return true;
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    return false;
  };

  const handleShareZalo = async () => {
    const copied = await copyImageToClipboard();
    handleDownloadImage();
    window.open('https://chat.zalo.me/', '_blank');
    if (copied) {
      setCopyNotice('Đã sao chép ảnh báo cáo & tải ảnh về máy! Bạn chỉ cần nhấn Ctrl + V vào ô chat Zalo của Ba Mẹ nhé 💙');
    } else {
      setCopyNotice('Đã tải ảnh báo cáo về máy! Hãy đính kèm ảnh vừa tải gửi qua Zalo cho Ba Mẹ nhé 💙');
    }
  };

  const handleShareMessenger = async () => {
    const copied = await copyImageToClipboard();
    handleDownloadImage();
    window.open('https://www.messenger.com/', '_blank');
    if (copied) {
      setCopyNotice('Đã sao chép ảnh báo cáo & tải ảnh về máy! Bạn chỉ cần nhấn Ctrl + V vào ô chat Messenger của Ba Mẹ nhé 💬');
    } else {
      setCopyNotice('Đã tải ảnh báo cáo về máy! Hãy đính kèm ảnh vừa tải gửi qua Messenger cho Ba Mẹ nhé 💬');
    }
  };

  const handleShareGmail = () => {
    handleDownloadImage();
    const today = getTodayVietnamInfo();
    const subject = encodeURIComponent(`[Báo Cáo Học Tập] Kết quả học tập ngày ${today.displayDate} của con`);
    const body = encodeURIComponent(`Con chào Ba Mẹ,\n\nHôm nay (${today.displayDate}), con đã hoàn thành xong các môn học. Con gửi Ba Mẹ xem báo cáo chi tiết đính kèm nhé!\n\nChúc Ba Mẹ một ngày vui vẻ!`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
    setCopyNotice('Đã tải ảnh báo cáo & mở Gmail! Bạn đính kèm ảnh vừa tải vào email gửi cho Ba Mẹ nhé ✉️');
  };

  const handleShareTelegram = () => {
    handleDownloadImage();
    const today = getTodayVietnamInfo();
    const text = encodeURIComponent(`[Báo Cáo Học Tập] Kết quả học tập ngày ${today.displayDate} của con. Con đã học xong các bài hôm nay, Ba Mẹ xem qua nhé!`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
    setCopyNotice('Đã tải ảnh báo cáo & mở Telegram! Bạn gửi ảnh đính kèm cho Ba Mẹ nhé ✈️');
  };

  // 1. Determine Vietnam Today info (UTC+7 / Asia/Ho_Chi_Minh)
  const todayInfo = getTodayVietnamInfo();

  // State for Curriculum Subject Progress Tracker
  const [subjectFilter, setSubjectFilter] = useState<'ALL' | 'ON_TRACK' | 'BEHIND' | 'NEEDS_REVISION'>('ALL');
  const [subjectSearch, setSubjectSearch] = useState('');

  // 2. Filter today's slots from timetable
  const todaySlots = timetableSlots
    .filter((s) => s.dayOfWeek === todayInfo.dayOfWeek && s.subjectName && s.subjectName !== '—' && s.subjectName !== 'Trống')
    .sort((a, b) => {
      if (a.session !== b.session) {
        return a.session === 'morning' ? -1 : 1;
      }
      return a.period - b.period;
    });

  // Active study slots for today (excluding Chào cờ & SHL for study scoring)
  const todayStudySlots = todaySlots.filter(
    (s) => s.subjectName !== 'Chào cờ' && s.subjectName !== 'SHL'
  );

  // Map each today's slot with its lesson plan and study record
  const todaySlotItems = todaySlots.map((slot) => {
    const periodInfo = STANDARD_PERIODS.find(
      (p) => p.session === slot.session && p.period === slot.period
    );
    const plan = lessonPlans.find(
      (lp) =>
        lp.dayOfWeek === slot.dayOfWeek &&
        lp.session === slot.session &&
        lp.period === slot.period
    );
    // Find record by matching today's plan or slot specifically for today's date
    const record = studyRecords.find((r) => {
      if (r.status !== 'COMPLETED') return false;
      if (plan && r.lessonPlanId === plan.id) {
        if (r.date && todayInfo.dateStr && r.date !== todayInfo.dateStr) return false;
        return true;
      }
      if (r.date && todayInfo.dateStr && r.date === todayInfo.dateStr) {
        if (r.session === slot.session && r.period === slot.period) return true;
      }
      return false;
    });

    const isCompleted = record?.status === 'COMPLETED';

    return {
      slot,
      periodInfo,
      plan,
      record,
      isCompleted,
      isSpecial: slot.subjectName === 'Chào cờ' || slot.subjectName === 'SHL',
    };
  });

  // Separate morning and afternoon slots
  const morningSlotItems = todaySlotItems.filter((i) => i.slot.session === 'morning');
  const afternoonSlotItems = todaySlotItems.filter((i) => i.slot.session === 'afternoon');

  const morningCompletedCount = morningSlotItems.filter((i) => !i.isSpecial && i.isCompleted).length;
  const morningTotalCount = morningSlotItems.filter((i) => !i.isSpecial).length;

  const afternoonCompletedCount = afternoonSlotItems.filter((i) => !i.isSpecial && i.isCompleted).length;
  const afternoonTotalCount = afternoonSlotItems.filter((i) => !i.isSpecial).length;

  const todayCompletedCount = todaySlotItems.filter((i) => !i.isSpecial && i.isCompleted).length;
  const todayTotalCount = todayStudySlots.length;
  const todayPendingCount = Math.max(0, todayTotalCount - todayCompletedCount);
  const todayRate = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 100;

  // 3. Weekly Stats
  const activeSlots = timetableSlots.filter(
    (s) => s.subjectName && s.subjectName !== 'Chào cờ' && s.subjectName !== 'SHL' && s.subjectName !== '—'
  );
  const completedRecords = studyRecords.filter((r) => r.status === 'COMPLETED');
  const needsRevisionRecords = studyRecords.filter((r) => r.status === 'NEEDS_REVISION');
  const weeklyPendingCount = Math.max(0, activeSlots.length - completedRecords.length);
  const weeklyCompletionRate = activeSlots.length > 0 ? Math.round((completedRecords.length / activeSlots.length) * 100) : 0;

  // Calculate current week dates (Mon-Sun) based on weekStartDate
  const weekDates = useMemo(() => {
    const [y, m, d] = (weekStartDate || getVietnamCurrentMondayStr()).split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const target = new Date(monday);
      target.setDate(monday.getDate() + i);
      dates.push(formatDateToYYYYMMDD(target));
    }
    return dates;
  }, [weekStartDate]);

  // 4. Comprehensive Curriculum / Syllabus Progress per Subject (Scoped to Current Week)
  const curriculumSubjects = useMemo(() => {
    return subjects
      .filter((s) => s.id !== 'chao-co' && s.id !== 'shl' && s.name !== 'Chào cờ' && s.name !== 'SHL')
      .map((subj) => {
        const subjDocs = documents
          .filter((d) => d.subjectName.toLowerCase() === subj.name.toLowerCase())
          .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));

        // Filter records for the current week only
        const subjWeekRecords = studyRecords.filter(
          (r) => r.subjectName.toLowerCase() === subj.name.toLowerCase() && r.date && weekDates.includes(r.date)
        );

        const completedWeekRecords = subjWeekRecords.filter((r) => r.status === 'COMPLETED');
        const needsRevCount = subjWeekRecords.filter((r) => r.status === 'NEEDS_REVISION').length;

        // Weekly schedule slots for this subject
        const weeklySubjSlots = activeSlots.filter(
          (s) => s.subjectName.toLowerCase() === subj.name.toLowerCase()
        );

        const totalCurriculumLessons = weeklySubjSlots.length > 0 ? weeklySubjSlots.length : (subjDocs.length > 0 ? Math.min(subjDocs.length, 3) : 2);
        const completedCount = completedWeekRecords.length;

        // Last completed lesson in this week
        const lastCompletedRecord = completedWeekRecords.length > 0 ? completedWeekRecords[completedWeekRecords.length - 1] : null;
        const lastCompletedLesson = lastCompletedRecord 
          ? (subjDocs.find(d => d.id === lastCompletedRecord.lessonId || d.title === lastCompletedRecord.lessonTitle) || { title: lastCompletedRecord.lessonTitle, subjectName: subj.name })
          : null;

        // Next lesson in this week
        const nextLesson = subjDocs.find(
          (d) => !completedWeekRecords.some((c) => c.lessonId === d.id || c.lessonTitle === d.title)
        ) || subjDocs[0] || null;

        const isBehind = weeklySubjSlots.length > 0 && completedCount < weeklySubjSlots.length && todayInfo.dayOfWeek >= 4;

        let status: 'ON_TRACK' | 'BEHIND' | 'NEEDS_REVISION' = 'ON_TRACK';
        let statusLabel = 'Đúng tiến độ';
        let statusColor = 'emerald';

        if (needsRevCount > 0) {
          status = 'NEEDS_REVISION';
          statusLabel = `Cần ôn tập (${needsRevCount} bài)`;
          statusColor = 'rose';
        } else if (isBehind || (completedCount === 0 && weeklySubjSlots.length > 0 && todayInfo.dayOfWeek >= 4)) {
          status = 'BEHIND';
          statusLabel = 'Chậm bài';
          statusColor = 'amber';
        }

        return {
          ...subj,
          totalCurriculumLessons,
          completedCount,
          needsRevCount,
          lastCompletedLesson,
          nextLesson,
          weeklySlotsCount: weeklySubjSlots.length,
          status,
          statusLabel,
          statusColor,
        };
      });
  }, [subjects, documents, studyRecords, activeSlots, weekDates, todayInfo.dayOfWeek]);

  // Filtered curriculum subjects
  const filteredCurriculumSubjects = useMemo(() => {
    return curriculumSubjects.filter((subj) => {
      const matchFilter =
        subjectFilter === 'ALL' ? true : subj.status === subjectFilter;
      const matchSearch =
        subjectSearch.trim() === '' ||
        subj.name.toLowerCase().includes(subjectSearch.toLowerCase().trim());
      return matchFilter && matchSearch;
    });
  }, [curriculumSubjects, subjectFilter, subjectSearch]);

  const onTrackCount = curriculumSubjects.filter((s) => s.status === 'ON_TRACK').length;
  const behindCount = curriculumSubjects.filter((s) => s.status === 'BEHIND').length;
  const needsRevTotalCount = curriculumSubjects.filter((s) => s.status === 'NEEDS_REVISION').length;

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-200">
      
      {/* ======================================================== */}
      {/* 1. KHỐI GIÁM SÁT TIẾN ĐỘ HÔM NAY (DÀNH CHO PHỤ HUYNH) */}
      {/* ======================================================== */}
      <div className="flex justify-end mb-2">
        <button
          onClick={handleShareReport}
          disabled={isSharing}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? 'Đang tạo ảnh...' : 'Gửi báo cáo cho Ba Mẹ'}</span>
        </button>
      </div>

      <div ref={captureRef} className="bg-white dark:bg-[#161922] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200/80 dark:border-blue-800/80 flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{todayInfo.displayDate}</span>
              </span>
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-500" />
                <span>Giám sát Phụ Huynh & Học Sinh</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tình Hình Học Tập & Hoàn Thành Bài Hôm Nay
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Theo dõi sát các môn học trong ngày, kiểm tra con đã hoàn thành và nộp ảnh bài học hay chưa.
            </p>
          </div>

          {/* Status Badge right */}
          <div className="shrink-0">
            {todayTotalCount === 0 ? (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  ☕ Hôm nay nghỉ / Không có tiết
                </span>
              </div>
            ) : todayPendingCount === 0 ? (
              <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>ĐÃ HOÀN THÀNH TẤT CẢ</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {todayCompletedCount}/{todayTotalCount} môn đạt yêu cầu
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-center shadow-2xs">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>CÒN {todayPendingCount} MÔN CHƯA NỘP</span>
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Đã hoàn thành {todayCompletedCount}/{todayTotalCount} môn ({todayRate}%)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar in Today's Card */}
        {todayTotalCount > 0 && (
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Tiến độ học hôm nay: <strong className="text-slate-900 dark:text-white font-bold">{todayCompletedCount}/{todayTotalCount} môn</strong>
              </span>
              <span className="font-extrabold text-blue-700 dark:text-blue-300">
                {todayRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todayRate === 100 
                    ? 'bg-emerald-600' 
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.max(todayRate, 3)}%` }}
              />
            </div>
          </div>
        )}

        {/* Today's Subjects List - Clean Parent Detail List / Table rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chi tiết các tiết học hôm nay ({todaySlotItems.length} tiết)
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem Thời Khóa Biểu đầy đủ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todaySlotItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <span className="text-3xl block mb-2">🌟</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hôm nay không có tiết học nào trên Thời khóa biểu.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Học sinh có thể xem trước bài học của ngày mai tại Thư viện Bài học.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* --- 1. BUỔI SÁNG --- */}
              {morningSlotItems.length > 0 && (
                <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                  
                  {/* Session Header Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">☀️</span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Buổi Sáng</span>
                        <span className="text-xs font-normal text-slate-500">({morningSlotItems.length} tiết)</span>
                      </h4>
                    </div>

                    <div className="text-xs font-semibold">
                      {morningTotalCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          morningCompletedCount === morningTotalCount
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}>
                          Đã xong {morningCompletedCount}/{morningTotalCount} môn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Morning Rows (Details Table/List) */}
                  <div className="divide-y divide-slate-200/60 dark:divide-slate-800 bg-white dark:bg-[#181d28]">
                    {morningSlotItems.map((item, idx) => {
                      const timeStr = item.periodInfo ? `${item.periodInfo.startTime} - ${item.periodInfo.endTime}` : '';
                      return (
                        <div
                          key={`morning-detail-${idx}`}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-2.5 gap-2.5 transition-colors ${
                            item.isCompleted
                              ? 'bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Col 1: Period & Time & Subject */}
                          <div className="flex items-center gap-3 min-w-0 sm:w-5/12">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-extrabold ${
                                item.isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : item.isSpecial
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                  : 'bg-blue-600 text-white'
                              }`}>
                                {item.slot.period}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-22 hidden md:inline-block">
                                {timeStr}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {item.slot.subjectName}
                              </span>
                            </div>
                          </div>

                          {/* Col 2: Lesson Task & Submission status */}
                          <div className="flex-1 min-w-0 px-0 sm:px-2">
                            {item.isSpecial ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                Tiết Sinh hoạt tập thể / Chào cờ
                              </span>
                            ) : item.isCompleted && item.record?.lessonTitle ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium truncate" title={item.record.lessonTitle}>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">Bài: <strong>{item.record.lessonTitle}</strong></span>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-700/90 dark:text-amber-400 font-normal italic flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Chưa có ảnh nộp bài làm</span>
                              </span>
                            )}
                          </div>

                          {/* Col 3: Status Badge & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <div>
                              {item.isSpecial ? (
                                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Sinh hoạt
                                </span>
                              ) : item.isCompleted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp bài</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Chưa học</span>
                                </span>
                              )}
                            </div>

                            {!item.isSpecial && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectSubject) {
                                    onSelectSubject(item.slot.subjectName);
                                  } else {
                                    onNavigateTab('lessons');
                                  }
                                }}
                                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  item.isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{item.isCompleted ? 'Xem bài' : 'Mở học'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- 2. BUỔI CHIỀU --- */}
              {afternoonSlotItems.length > 0 && (
                <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                  
                  {/* Session Header Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🌇</span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Buổi Chiều</span>
                        <span className="text-xs font-normal text-slate-500">({afternoonSlotItems.length} tiết)</span>
                      </h4>
                    </div>

                    <div className="text-xs font-semibold">
                      {afternoonTotalCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          afternoonCompletedCount === afternoonTotalCount
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                        }`}>
                          Đã xong {afternoonCompletedCount}/{afternoonTotalCount} môn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Afternoon Rows (Details Table/List) */}
                  <div className="divide-y divide-slate-200/60 dark:divide-slate-800 bg-white dark:bg-[#181d28]">
                    {afternoonSlotItems.map((item, idx) => {
                      const timeStr = item.periodInfo ? `${item.periodInfo.startTime} - ${item.periodInfo.endTime}` : '';
                      return (
                        <div
                          key={`afternoon-detail-${idx}`}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-2.5 gap-2.5 transition-colors ${
                            item.isCompleted
                              ? 'bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Col 1: Period & Time & Subject */}
                          <div className="flex items-center gap-3 min-w-0 sm:w-5/12">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-extrabold ${
                                item.isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : item.isSpecial
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                  : 'bg-indigo-600 text-white'
                              }`}>
                                {item.slot.period}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-22 hidden md:inline-block">
                                {timeStr}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {item.slot.subjectName}
                              </span>
                            </div>
                          </div>

                          {/* Col 2: Lesson Task & Submission status */}
                          <div className="flex-1 min-w-0 px-0 sm:px-2">
                            {item.isSpecial ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                Tiết Sinh hoạt tập thể / SHL
                              </span>
                            ) : item.isCompleted && item.record?.lessonTitle ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium truncate" title={item.record.lessonTitle}>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">Bài: <strong>{item.record.lessonTitle}</strong></span>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-700/90 dark:text-amber-400 font-normal italic flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Chưa có ảnh nộp bài làm</span>
                              </span>
                            )}
                          </div>

                          {/* Col 3: Status Badge & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <div>
                              {item.isSpecial ? (
                                <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Sinh hoạt
                                </span>
                              ) : item.isCompleted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp bài</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Chưa học</span>
                                </span>
                              )}
                            </div>

                            {!item.isSpecial && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectSubject) {
                                    onSelectSubject(item.slot.subjectName);
                                  } else {
                                    onNavigateTab('lessons');
                                  }
                                }}
                                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                  item.isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{item.isCompleted ? 'Xem bài' : 'Mở học'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* MODAL GỬI BÁO CÁO CHO BA MẸ (Zalo, Messenger, Gmail, Telegram) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  Gửi Báo Cáo Cho Ba Mẹ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Notice Toast / Alert */}
              {copyNotice && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{copyNotice}</span>
                </div>
              )}

              {/* Preview Thumbnail if available */}
              {reportDataUrl && (
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-36 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                  <img src={reportDataUrl} alt="Báo cáo học tập" className="object-cover max-h-36 w-full opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                    <span className="text-[11px] font-semibold text-white drop-shadow-xs">
                      📸 Báo cáo thành tích ngày {todayInfo.displayDate}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Chọn kênh bạn muốn gửi báo cáo học tập cho Ba Mẹ:
              </p>

              {/* Channel Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Zalo */}
                <button
                  type="button"
                  onClick={handleShareZalo}
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/80 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    Zalo
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-blue-900 dark:text-blue-100 flex items-center gap-1">
                      <span>Mở Zalo Chat</span>
                      <ExternalLink className="w-3 h-3 text-blue-500 opacity-70" />
                    </div>
                    <div className="text-[10.5px] text-blue-700 dark:text-blue-300 truncate">
                      Tự động chép ảnh & mở Zalo
                    </div>
                  </div>
                </button>

                {/* Facebook Messenger */}
                <button
                  type="button"
                  onClick={handleShareMessenger}
                  className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-indigo-900 dark:text-indigo-100 flex items-center gap-1">
                      <span>Messenger</span>
                      <ExternalLink className="w-3 h-3 text-indigo-500 opacity-70" />
                    </div>
                    <div className="text-[10.5px] text-indigo-700 dark:text-indigo-300 truncate">
                      Mở Messenger gửi nhanh
                    </div>
                  </div>
                </button>

                {/* Gmail */}
                <button
                  type="button"
                  onClick={handleShareGmail}
                  className="flex items-center gap-3 p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/80 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-rose-900 dark:text-rose-100 flex items-center gap-1">
                      <span>Gmail</span>
                      <ExternalLink className="w-3 h-3 text-rose-500 opacity-70" />
                    </div>
                    <div className="text-[10.5px] text-rose-700 dark:text-rose-300 truncate">
                      Soạn email kèm ảnh báo cáo
                    </div>
                  </div>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/80 rounded-xl transition-all cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-sky-900 dark:text-sky-100 flex items-center gap-1">
                      <span>Telegram</span>
                      <ExternalLink className="w-3 h-3 text-sky-500 opacity-70" />
                    </div>
                    <div className="text-[10.5px] text-sky-700 dark:text-sky-300 truncate">
                      Chia sẻ qua Telegram
                    </div>
                  </div>
                </button>
              </div>

              {/* Download Option */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Tải Ảnh Báo Cáo Về Máy (PNG)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
