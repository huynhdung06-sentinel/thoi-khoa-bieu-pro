import React, { useState, useRef } from 'react';
import { 
  TimetableSlot, 
  LessonPlan, 
  StudyRecord, 
  UserRole, 
  Lesson, 
  Subject 
} from '../types';
import { 
  SUBJECTS_LIST, 
  INITIAL_LESSONS_BANK, 
  createSampleMindmapSvg,
  getSubjectEmoji
} from '../data/mockData';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  ZoomIn, 
  RotateCcw, 
  MessageSquare, 
  Download, 
  Trash2,
  Edit3,
  Heart,
  Smile
} from 'lucide-react';

interface LessonDetailAndMindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimetableSlot | null;
  plan?: LessonPlan;
  record?: StudyRecord;
  currentRole: UserRole;
  allLessons: Lesson[];
  onSubmitMindmap: (
    lessonPlanId: string,
    slot: TimetableSlot,
    imageDataUrl: string,
    studentNote: string,
    showOnTimetable?: boolean
  ) => void;
  onParentReview?: (
    recordId: string,
    status: 'COMPLETED' | 'NEEDS_REVISION',
    feedback: string
  ) => void;
  onDeleteRecord?: (recordId: string) => void;
  onToggleShowOnTimetable?: (recordId: string, show: boolean) => void;
  onUpdatePlanAdmin?: (
    planId: string,
    updatedData: Partial<LessonPlan>
  ) => void;
  onUpdateSlotAdmin?: (
    slotId: string,
    updatedData: Partial<TimetableSlot>
  ) => void;
}

export const LessonDetailAndMindmapModal: React.FC<LessonDetailAndMindmapModalProps> = ({
  isOpen,
  onClose,
  slot,
  plan,
  record,
  currentRole,
  allLessons = INITIAL_LESSONS_BANK,
  onSubmitMindmap,
  onParentReview,
  onDeleteRecord,
  onToggleShowOnTimetable,
  onUpdatePlanAdmin,
  onUpdateSlotAdmin,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'mindmap' | 'lesson' | 'review' | 'admin'>('mindmap');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [parentComment, setParentComment] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOnTimetable, setShowOnTimetable] = useState(false);

  // Admin edit mode
  const [adminSubject, setAdminSubject] = useState('');
  const [adminTeacher, setAdminTeacher] = useState('');
  const [adminLessonId, setAdminLessonId] = useState('');
  const [adminCustomTitle, setAdminCustomTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync admin state when slot opens
  React.useEffect(() => {
    if (slot) {
      setAdminSubject(slot.subjectName || '');
      setAdminTeacher(slot.teacher || '');
      setAdminLessonId(plan?.lessonId || '');
      setAdminCustomTitle(plan?.lessonTitle || '');
      setSelectedImage(null);
      setStudentNote('');
      setParentComment(record?.parentFeedback || '');
      setIsZoomed(false);
      setActiveModalTab(currentRole === 'admin' && !plan ? 'admin' : 'mindmap');
      setShowOnTimetable(record?.showOnTimetable ?? false);
    }
  }, [slot, plan, record, currentRole]);

  if (!isOpen || !slot) return null;

  const isSpecialSubject = slot.subjectName === 'Chào cờ' || slot.subjectName === 'SHL';
  const isCompleted = record?.status === 'COMPLETED';
  const isNeedsRevision = record?.status === 'NEEDS_REVISION';
  const emoji = getSubjectEmoji(slot.subjectName);

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageToDataUrl(file);
      setSelectedImage(compressedDataUrl);
    } catch (err) {
      alert('Không thể xử lý tệp ảnh. Vui lòng chọn ảnh khác.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        setIsUploading(true);
        const compressedDataUrl = await compressImageToDataUrl(file);
        setSelectedImage(compressedDataUrl);
      } catch (err) {
        alert('Không thể đọc file ảnh.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Instant sample mindmap generator for fast testing
  const handleUseSampleMindmap = () => {
    const title = plan?.lessonTitle || slot.subjectName;
    const subjObj = SUBJECTS_LIST.find(
      (s) => (s.name || '').toLowerCase() === (slot.subjectName || '').toLowerCase()
    );
    const color = subjObj?.color || '#2563eb';
    const sampleDataUrl = createSampleMindmapSvg(title, slot.subjectName, color);
    setSelectedImage(sampleDataUrl);
    if (!studentNote) {
      setStudentNote('Em đã vẽ sơ đồ tóm tắt đầy đủ 4 nhánh chính của bài học này ✨');
    }
  };

  // Handle Submit Mindmap
  const handleSubmit = () => {
    const imageToSubmit = selectedImage || record?.mindmapImageUrl;
    if (!imageToSubmit) {
      alert('Bạn ơi, vui lòng chụp hoặc chọn ảnh sơ đồ tư duy trước khi nộp nha!');
      return;
    }

    const planId = plan?.id || `plan-${slot.dayOfWeek}-${slot.session}-${slot.period}`;
    onSubmitMindmap(planId, slot, imageToSubmit, studentNote, showOnTimetable);
  };

  // Save Admin changes
  const handleSaveAdmin = () => {
    if (onUpdateSlotAdmin && slot) {
      onUpdateSlotAdmin(slot.id, {
        subjectName: adminSubject,
        teacher: adminTeacher,
      });
    }

    if (onUpdatePlanAdmin && plan) {
      const selectedLessonObj = allLessons.find((l) => l.id === adminLessonId);
      onUpdatePlanAdmin(plan.id, {
        subjectName: adminSubject,
        teacher: adminTeacher,
        lessonId: adminLessonId,
        lessonTitle: adminCustomTitle || selectedLessonObj?.title || `Bài học ${adminSubject}`,
        summary: selectedLessonObj?.summary,
        keyPoints: selectedLessonObj?.keyPoints,
      });
    }
    alert('Đã cập nhật thông tin tiết học thành công!');
    onClose();
  };

  const currentDisplayImage = selectedImage || record?.mindmapImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-[#161922] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 dark:from-[#1b2230] dark:via-[#161922] dark:to-[#1b2230]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xl shadow-xs">
              {emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {slot.subjectName || 'Tiết học trống'}
                </h3>
                {slot.teacher && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    GV: {slot.teacher}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <span>{slot.session === 'morning' ? '☀️ Buổi Sáng' : '🌇 Buổi Chiều'} • Tiết {slot.period}</span>
                {plan?.date && <span>• Ngày {plan.date}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Friendly Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-[#13161c] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveModalTab('mindmap')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModalTab === 'mindmap'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📸</span>
            <span>Báo cáo học tập</span>
            {isCompleted && <span className="text-[10px] text-emerald-600">✓</span>}
          </button>

          {record && (
            <button
              type="button"
              onClick={() => setActiveModalTab('review')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'review'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>💬</span>
              <span>Góc nhận xét</span>
              {record.parentFeedback && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveModalTab('admin')}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'admin'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>⚙️</span>
              <span>Quản trị tiết</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: BÀI ĐÃ HỌC / BÁO CÁO HỌC TẬP */}
          {activeModalTab === 'mindmap' && (
            <div className="space-y-4">
              
              {/* Title & Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {plan?.lessonTitle || (isSpecialSubject ? slot.subjectName : `Bài học môn ${slot.subjectName}`)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chụp ảnh bài tập, tập vở hoặc kết quả để ghi nhận Bài Đã Học nhé!
                  </p>
                </div>

                {isCompleted ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1 shrink-0 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã hoàn thành ✨
                  </span>
                ) : isNeedsRevision ? (
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-1 shrink-0 border border-amber-300 dark:border-amber-700 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cần vẽ lại chút ✏️
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium shrink-0">
                    Chưa nộp bài
                  </span>
                )}
              </div>

              {/* Case A: Mindmap image exists (Preview mode) */}
              {currentDisplayImage && currentDisplayImage.trim() !== '' ? (
                <div className="space-y-3">
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-center min-h-[220px] max-h-[360px]">
                    <img
                      src={currentDisplayImage}
                      alt="Sơ đồ tư duy bài học"
                      className={`object-contain max-h-[360px] w-full transition-transform ${isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                    />

                    {/* Image overlay controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl backdrop-blur-xs opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="p-1.5 text-white hover:text-blue-300 rounded-lg cursor-pointer"
                        title={isZoomed ? 'Thu nhỏ' : 'Phóng to'}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <a
                        href={currentDisplayImage}
                        download={`mindmap-${slot.subjectName}-${plan?.lessonTitle || 'lesson'}.png`}
                        className="p-1.5 text-white hover:text-blue-300 rounded-lg cursor-pointer"
                        title="Tải ảnh về máy"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Submission info & Student note */}
                  {record && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs space-y-1">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Học sinh: <strong className="text-slate-800 dark:text-slate-200">{record.studentName}</strong></span>
                          <span>Nộp lúc: {new Date(record.submittedAt).toLocaleString('vi-VN')}</span>
                        </div>
                        {record.studentNote && (
                          <div className="text-slate-700 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                            <span>💭</span>
                            <span>&ldquo;{record.studentNote}&rdquo;</span>
                          </div>
                        )}
                      </div>

                      {/* Manual Show on Timetable for Existing Record */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hiển thị Bài lên Thời khóa biểu</span>
                          <span className="text-[10px] text-slate-400">Đưa trực tiếp bài học này lên ô tương ứng trên TKB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !showOnTimetable;
                            setShowOnTimetable(nextVal);
                            if (record && onToggleShowOnTimetable) {
                              onToggleShowOnTimetable(record.id, nextVal);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            showOnTimetable
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {showOnTimetable ? (
                            <>
                              <span>🟢</span>
                              <span>Đồng ý hiển thị</span>
                            </>
                          ) : (
                            <>
                              <span>⚪</span>
                              <span>Không hiển thị</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Student Change/Re-upload Button */}
                  {currentRole === 'student' && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          fileInputRef.current?.click();
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Chụp / Tải ảnh khác</span>
                      </button>

                      {onDeleteRecord && record && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa bài nộp này không?')) {
                              onDeleteRecord(record.id);
                              setSelectedImage(null);
                            }
                          }}
                          className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa bài nộp</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Case B: Upload Box for Student - Simplified to ONLY drag and drop / click to upload */
                <div className="space-y-3.5">
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`block border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
                      Kéo thả ảnh vào đây hoặc bấm vào để chọn file
                    </p>
                    <p className="text-xs text-slate-400">
                      Hỗ trợ định dạng PNG, JPG, WebP
                    </p>
                  </label>
                </div>
              )}

              {/* Form elements for submission (only shown when a new file has been selected) */}
              {selectedImage && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Student Note Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lời nhắn của học sinh (Tùy chọn):
                    </label>
                    <textarea
                      value={studentNote}
                      onChange={(e) => setStudentNote(e.target.value)}
                      placeholder="Ghi chú kiến thức nhớ nhất hoặc điều tâm đắc trong bài..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Manual Show on Timetable during Upload */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Hiển thị Bài lên Thời khóa biểu</span>
                      <span className="text-[10px] text-slate-400">Đưa trực tiếp bài học này lên ô tương ứng trên TKB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOnTimetable(!showOnTimetable)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showOnTimetable
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {showOnTimetable ? (
                        <>
                          <span>🟢</span>
                          <span>Đồng ý hiển thị</span>
                        </>
                      ) : (
                        <>
                          <span>⚪</span>
                          <span>Không hiển thị</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="button"
                    disabled={!selectedImage || isUploading}
                    onClick={handleSubmit}
                    className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      selectedImage && !isUploading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận nộp bài ✨</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB: GÓC NHẬN XET CỦA PHỤ HUYNH */}
          {activeModalTab === 'review' && record && (
            <div className="bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 p-5 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Lời nhận xét &amp; Động viên từ Phụ huynh:</span>
              </div>

              {record.parentFeedback ? (
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs text-slate-800 dark:text-slate-200 italic">
                  &ldquo;{record.parentFeedback}&rdquo;
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Chưa có lời nhận xét nào.
                </p>
              )}

              {currentRole === 'admin' && onParentReview && (
                <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                  <input
                    type="text"
                    value={parentComment}
                    onChange={(e) => setParentComment(e.target.value)}
                    placeholder="VD: Con vẽ sơ đồ rất đẹp và rõ ràng, cố gắng phát huy nhé! ❤️"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onParentReview(record.id, 'COMPLETED', parentComment || 'Đã duyệt đạt');
                        alert('Đã gửi lời khen ngợi cho con!');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Khen ngợi &amp; Duyệt đạt 🎉</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onParentReview(record.id, 'NEEDS_REVISION', parentComment || 'Con vẽ thêm các nhánh chi tiết nhé');
                        alert('Đã gửi lời nhắc con vẽ lại.');
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Nhắc con vẽ lại ✏️</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADMIN CONTROLS */}
          {activeModalTab === 'admin' && currentRole === 'admin' && (
            <div className="border border-purple-200 dark:border-purple-800/80 rounded-3xl p-5 bg-purple-50/40 dark:bg-purple-950/20 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa thông tin tiết học</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Môn học:</label>
                  <select
                    value={adminSubject}
                    onChange={(e) => {
                      setAdminSubject(e.target.value);
                      const subj = SUBJECTS_LIST.find((s) => s.name === e.target.value);
                      if (subj?.defaultTeacher) setAdminTeacher(subj.defaultTeacher);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="">-- Trống --</option>
                    {SUBJECTS_LIST.map((s) => (
                      <option key={s.id} value={s.name}>{s.emoji} {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Giáo viên phụ trách:</label>
                  <input
                    type="text"
                    value={adminTeacher}
                    onChange={(e) => setAdminTeacher(e.target.value)}
                    placeholder="VD: Việt, Hường..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gán bài học từ kho bài:</label>
                <select
                  value={adminLessonId}
                  onChange={(e) => {
                    setAdminLessonId(e.target.value);
                    const l = allLessons.find((item) => item.id === e.target.value);
                    if (l) setAdminCustomTitle(l.title);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="">-- Tùy chỉnh tự do --</option>
                  {allLessons
                    .filter((l) => !adminSubject || (l.subjectName || '').toLowerCase() === (adminSubject || '').toLowerCase())
                    .map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tên bài học hiển thị:</label>
                <input
                  type="text"
                  value={adminCustomTitle}
                  onChange={(e) => setAdminCustomTitle(e.target.value)}
                  placeholder="VD: Bài 3: Cấp số cộng"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveAdmin}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Lưu thay đổi ✨
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-[#13161c]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
