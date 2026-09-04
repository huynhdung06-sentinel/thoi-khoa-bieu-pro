import React, { useState, useEffect } from 'react';
import { StudySlot, PlatformType } from '../types';
import { COLOR_PALETTE, PRESET_PLATFORMS } from '../data/initialSchedule';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  User, 
  MapPin, 
  BookOpen, 
  FileText, 
  Plus, 
  Video, 
  GraduationCap, 
  Folder, 
  PlayCircle
} from 'lucide-react';

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: StudySlot | null;
  dateStr: string;
  defaultHour: string;
  subjectList?: string[];
  presetSubjectName?: string;
  onSaveSlot: (slot: StudySlot) => void;
  onDeleteSlot: (id: string) => void;
  onToggleComplete: (id: string) => void;
  appMode?: 'viewer' | 'editor';
  setAppMode?: (mode: 'viewer' | 'editor') => void;
}

export const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  dateStr,
  defaultHour,
  subjectList = [],
  presetSubjectName = '',
  onSaveSlot,
  onDeleteSlot,
  onToggleComplete,
  appMode = 'editor',
  setAppMode,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState(defaultHour);
  const [endTime, setEndTime] = useState('09:30');
  const [studyLink, setStudyLink] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('google-meet');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [homework, setHomework] = useState('');

  useEffect(() => {
    if (selectedSlot) {
      setIsEditing(false);
      setSubjectName(selectedSlot.subjectName || '');
      setSubjectCode(selectedSlot.subjectCode || '');
      setTeacher(selectedSlot.teacher || '');
      setRoom(selectedSlot.room || '');
      setStartTime(selectedSlot.startTime || defaultHour);
      setEndTime(selectedSlot.endTime || '09:30');
      setStudyLink(selectedSlot.studyLink || '');
      setPlatform(selectedSlot.platform || 'google-meet');
      setColor(selectedSlot.color || '#3b82f6');
      setDescription(selectedSlot.description || '');
      setHomework(selectedSlot.homework || '');
    } else {
      setIsEditing(true);
      setSubjectName(presetSubjectName || '');
      setSubjectCode('');
      setTeacher('');
      setRoom('');
      setStartTime(defaultHour || '07:30');
      
      // Default end time + 1h30m
      const [h, m] = (defaultHour || '07:30').split(':').map(Number);
      const endMins = h * 60 + m + 90;
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      setEndTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
      
      setStudyLink('');
      setPlatform('google-meet');
      setColor('#3b82f6');
      setDescription('');
      setHomework('');
    }
  }, [selectedSlot, defaultHour, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (studyLink) {
      navigator.clipboard.writeText(studyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    if (studyLink) {
      let url = studyLink.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    let formattedUrl = studyLink.trim();
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newSlot: StudySlot = {
      id: selectedSlot ? selectedSlot.id : `slot-${Date.now()}`,
      date: dateStr,
      startTime,
      endTime,
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
      studyLink: formattedUrl,
      platform,
      color,
      description: description.trim(),
      homework: homework.trim(),
      isCompleted: selectedSlot ? selectedSlot.isCompleted : false,
    };

    onSaveSlot(newSlot);
    onClose();
  };

  const getPlatformIcon = (plt: string) => {
    switch (plt) {
      case 'google-meet':
      case 'zoom':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'lms':
        return <GraduationCap className="w-5 h-5 text-amber-500" />;
      case 'notion':
        return <FileText className="w-5 h-5 text-stone-500" />;
      case 'youtube':
        return <PlayCircle className="w-5 h-5 text-red-500" />;
      case 'drive':
        return <Folder className="w-5 h-5 text-cyan-500" />;
      default:
        return <ExternalLink className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-[#2a2e39] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Modal Header */}
        <div className="bg-slate-50 dark:bg-[#2a2e39]/80 px-5 py-3.5 border-b border-slate-200 dark:border-[#2a2e39] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-800 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedSlot && !isEditing ? 'Chi Tiết Bài Học' : selectedSlot ? 'Chỉnh Sửa Giờ Học' : 'Thêm Giờ Học Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#363a45] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-slate-200">
          
          {/* VIEW MODE (When selecting existing subject) */}
          {selectedSlot && !isEditing ? (
            <div className="space-y-3">
              
              {/* KHUNG 1: MÔN HỌC (Subject Frame) */}
              <div 
                style={{ borderLeftColor: selectedSlot.color || '#3b82f6' }} 
                className="p-4 bg-white dark:bg-[#242832] border border-slate-200/80 dark:border-[#363a45] border-l-4 rounded-2xl space-y-3 shadow-xs"
              >
                {/* Top Bar: Badge + Action Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[10px] font-medium">
                    <span>Môn học</span>
                  </div>

                  {/* Right Actions */}
                  <button
                    onClick={() => onToggleComplete(selectedSlot.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
                      selectedSlot.isCompleted
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedSlot.isCompleted ? 'Đã xong' : 'Đánh dấu xong'}</span>
                  </button>
                </div>

                {/* Subject Title */}
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                    {selectedSlot.subjectName}
                  </h2>
                </div>

                {/* Metadata Chips */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-md font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/50">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                  </div>
                  {selectedSlot.room && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-md text-[11px] font-medium border border-amber-200/60 dark:border-amber-800/40">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{selectedSlot.room}</span>
                    </div>
                  )}
                  {selectedSlot.teacher && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 rounded-md text-[11px] font-medium border border-indigo-200/60 dark:border-indigo-800/40">
                      <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{selectedSlot.teacher}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KHUNG 2: BÀI HỌC (Lesson Frame - Prominent) */}
              <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border-2 border-blue-200/80 dark:border-blue-800/60 rounded-2xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 bg-blue-800 text-white rounded-md text-[10px] font-medium shadow-2xs">
                    Bài học
                  </span>

                  {selectedSlot.studyLink && (
                    <button
                      onClick={handleOpenLink}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-800 hover:bg-blue-900 active:bg-blue-950 text-white transition-all shadow-xs cursor-pointer border border-blue-900"
                      title={`Mở link: ${selectedSlot.studyLink}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Link Bài Học</span>
                    </button>
                  )}
                </div>

                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedSlot.subjectCode 
                    ? (((selectedSlot.subjectCode || '').toLowerCase().startsWith('bài'))
                        ? selectedSlot.subjectCode 
                        : `Bài: ${selectedSlot.subjectCode}`)
                    : (selectedSlot.title || 'Chưa cập nhật tên bài')}
                </div>
              </div>

              {/* Description & Homework Expanded Boxes (Icons Only, No Header Text) */}
              {selectedSlot.description && (
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#2a2e39] rounded-xl border border-slate-200/80 dark:border-[#363a45] flex items-start gap-3.5 min-h-[90px]">
                  <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line flex-1">
                    {selectedSlot.description}
                  </p>
                </div>
              )}

              {selectedSlot.homework && (
                <div className="p-4 sm:p-5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3.5 min-h-[90px]">
                  <FileText className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm leading-relaxed text-amber-900 dark:text-amber-200 whitespace-pre-line flex-1">
                    {selectedSlot.homework}
                  </p>
                </div>
              )}

              {/* Action Buttons: Edit / Delete or Close depending on appMode */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#2a2e39]">
                {appMode === 'editor' ? (
                  <>
                    <button
                      onClick={() => onDeleteSlot(selectedSlot.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-[#363a45] hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa Thông Tin</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-slate-200 dark:bg-[#363a45] hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition-colors"
                  >
                    <span>Đóng</span>
                  </button>
                )}
              </div>

            </div>
          ) : appMode === 'viewer' ? (
            /* VIEWER NOTICE WHEN TRYING TO ADD NEW */
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Đang ở Chế Độ Xem (Viewer)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Bạn đang ở chế độ xem. Để thêm hoặc chỉnh sửa buổi học mới, vui lòng chuyển sang Chế độ Sửa (Editor).
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-[#363a45] hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {setAppMode && (
                  <button
                    onClick={() => {
                      setAppMode('editor');
                      setIsEditing(true);
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chuyển Sang Chế Độ Sửa</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* EDIT / CREATE FORM MODE */
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Môn học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Toán Cao Cấp A1"
                  list="subject-options-list"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <datalist id="subject-options-list">
                  {subjectList?.map((subj) => (
                    <option key={subj} value={subj} />
                  ))}
                </datalist>
              </div>

              {/* Sub-field: Bài (Con của Môn Học, hiện bên dưới Môn Học) */}
              <div className="pl-3 border-l-2 border-blue-400 dark:border-blue-600">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bài
                </label>
                <input
                  type="text"
                  placeholder="VD: Bài 1 - Hàm số nhiều biến"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* STUDY LINK (OPTIONAL) */}
              <div className="p-3 bg-slate-50 dark:bg-[#2a2e39] rounded-xl border border-slate-200 dark:border-[#363a45] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Link Trang Học</span>
                    <span className="text-[10px] font-normal text-slate-400">(Không bắt buộc)</span>
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="https://... (nếu có)"
                  value={studyLink}
                  onChange={(e) => setStudyLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Time Inputs (Giờ bắt đầu & Giờ kết thúc) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Màu sắc thẻ
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${c.bg} ${
                        color === c.hex ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description & Homework */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Nội dung bài học
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập ghi chú hoặc nội dung môn học..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bài tập về nhà
                </label>
                <input
                  type="text"
                  placeholder="Làm bài tập trang 84..."
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#2a2e39] border border-slate-200 dark:border-[#363a45] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2a2e39]">
                {selectedSlot && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#363a45] rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-sm transition-all"
                >
                  {selectedSlot ? 'Lưu Thay Đổi' : 'Tạo Giờ Học'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
