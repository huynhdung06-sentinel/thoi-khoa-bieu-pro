import React, { useState } from 'react';
import { StudySlot, PlatformType } from '../types';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  BookOpen, 
  Link2, 
  Palette, 
  FileText, 
  Check, 
  Tag
} from 'lucide-react';

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  existingSubjects: string[];
  onSaveAutoSlots: (slots: StudySlot[]) => void;
  isDarkMode: boolean;
  lightColor: string;
}

const COLOR_OPTIONS = [
  { hex: '#C0392B', label: 'Đỏ' },
  { hex: '#2980B9', label: 'Xanh Dương' },
  { hex: '#27AE60', label: 'Xanh Lá' },
  { hex: '#E67E22', label: 'Cam' },
  { hex: '#8E44AD', label: 'Tím' },
  { hex: '#16A085', label: 'Xanh Ngọc' },
  { hex: '#34495E', label: 'Xám' },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ Nhật' },
];

export const AutoScheduleModal: React.FC<AutoScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  existingSubjects,
  onSaveAutoSlots,
  isDarkMode,
  lightColor,
}) => {
  if (!isOpen) return null;

  // Form state
  const [scheduleType, setScheduleType] = useState<'single' | 'recurring'>('single');
  const [singleDate, setSingleDate] = useState<string>(formatDateToYYYYMMDD(selectedDate));
  
  // Recurring state
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([selectedDate.getDay()]); // 0-6
  const [startDateStr, setStartDateStr] = useState<string>(formatDateToYYYYMMDD(selectedDate));
  
  const defaultEndDate = new Date(selectedDate);
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
  const [endDateStr, setEndDateStr] = useState<string>(formatDateToYYYYMMDD(defaultEndDate));

  // Form fields
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [studyLink, setStudyLink] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0].hex);
  const [description, setDescription] = useState<string>('');
  const [homework, setHomework] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');

  const toggleWeekDay = (dayVal: number) => {
    setSelectedWeekDays((prev) => 
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const detectPlatform = (url: string): PlatformType => {
    const lower = url.toLowerCase();
    if (lower.includes('meet.google')) return 'google-meet';
    if (lower.includes('zoom.us')) return 'zoom';
    if (lower.includes('teams.microsoft')) return 'teams';
    if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('notion.so')) return 'notion';
    if (lower.includes('drive.google')) return 'drive';
    if (url.trim().length > 0) return 'lms';
    return 'other';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subjectName.trim()) {
      setErrorMsg('Vui lòng chọn hoặc nhập Tên môn học');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMsg('Vui lòng chọn Thời gian bắt đầu và kết thúc');
      return;
    }

    const newSlotsToCreate: StudySlot[] = [];
    const platform = detectPlatform(studyLink);

    if (scheduleType === 'single') {
      if (!singleDate) {
        setErrorMsg('Vui lòng chọn ngày học');
        return;
      }
      newSlotsToCreate.push({
        id: `slot_auto_${Date.now()}_0`,
        date: singleDate,
        startTime,
        endTime,
        subjectName: subjectName.trim(),
        subjectCode: subjectCode.trim() || undefined,
        studyLink: studyLink.trim(),
        platform,
        color,
        description: description.trim() || undefined,
        homework: homework.trim() || undefined,
        isCompleted: false,
      });
    } else {
      if (selectedWeekDays.length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất 1 Thứ trong tuần');
        return;
      }
      if (!startDateStr || !endDateStr) {
        setErrorMsg('Vui lòng chọn khoảng thời gian học');
        return;
      }

      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (start > end) {
        setErrorMsg('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }

      let curr = new Date(start);
      let count = 0;
      while (curr <= end) {
        const dayOfWeek = curr.getDay();
        if (selectedWeekDays.includes(dayOfWeek)) {
          const dateString = formatDateToYYYYMMDD(curr);
          newSlotsToCreate.push({
            id: `slot_auto_${Date.now()}_${count}`,
            date: dateString,
            startTime,
            endTime,
            subjectName: subjectName.trim(),
            subjectCode: subjectCode.trim() || undefined,
            studyLink: studyLink.trim(),
            platform,
            color,
            description: description.trim() || undefined,
            homework: homework.trim() || undefined,
            isCompleted: false,
          });
          count++;
        }
        curr.setDate(curr.getDate() + 1);
      }

      if (newSlotsToCreate.length === 0) {
        setErrorMsg('Không tìm thấy ngày phù hợp trong khoảng thời gian này');
        return;
      }
    }

    onSaveAutoSlots(newSlotsToCreate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-[#2C3531] rounded-3xl shadow-2xl w-full max-w-3xl my-auto flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-[#2C3531] flex items-center justify-between bg-slate-50 dark:bg-[#121212]">
          <div className="flex items-center gap-3">
            <div 
              className="p-2.5 rounded-2xl text-white shadow-xs"
              style={{ backgroundColor: isDarkMode ? '#2563EB' : lightColor }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Tạo Lịch Học Tự Động
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Thêm môn học và thời gian vào thời khóa biểu cá nhân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* 1. Tên Môn Học */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              1. Tên Môn Học <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Quick chips for existing subjects */}
            {existingSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Môn có sẵn:</span>
                {existingSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubjectName(sub)}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      subjectName === sub
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Bài Học & Link Trang Học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Bài học / Tên bài
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Link học (Google Meet / Zoom...)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={studyLink}
                  onChange={(e) => setStudyLink(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Chế Độ Lịch Học & Thời Gian */}
          <div className="p-4 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Calendar className="w-4 h-4 text-blue-500" />
                2. Chế Độ & Thời Gian Học
              </label>

              {/* Mode Toggle Pills */}
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setScheduleType('single')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    scheduleType === 'single'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  1 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('recurring')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    scheduleType === 'recurring'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Lặp hàng tuần
                </button>
              </div>
            </div>

            {/* Single Date vs Recurring options */}
            {scheduleType === 'single' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Ngày học
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Lặp vào các Thứ trong tuần:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSel = selectedWeekDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleWeekDay(d.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Start and End Time */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#1E272C] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Màu Sắc Thẻ Lịch */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1 uppercase tracking-wide">
              <Palette className="w-4 h-4 text-purple-500" /> 3. Màu sắc hiển thị
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-8 h-8 rounded-xl transition-all cursor-pointer relative flex items-center justify-center ${
                    color === c.hex ? 'scale-110 ring-2 ring-slate-900 dark:ring-white shadow-xs' : 'hover:scale-105 opacity-80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {color === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Ghi chú & Bài tập */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-500" /> Mô tả / Ghi chú
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1">
                <FileText className="w-4 h-4 text-amber-500" /> Bài tập về nhà
              </label>
              <textarea
                rows={2}
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#2C3531] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: isDarkMode ? '#2563EB' : lightColor }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo Lịch Học</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
