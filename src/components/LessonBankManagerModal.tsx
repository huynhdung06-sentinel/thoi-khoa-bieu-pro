import React, { useState } from 'react';
import { Lesson, Subject, TimetableSlot, LessonPlan } from '../types';
import { SUBJECTS_LIST, INITIAL_LESSONS_BANK } from '../data/mockData';
import { 
  X, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles, 
  Check, 
  RotateCcw,
  ListOrdered
} from 'lucide-react';

interface LessonBankManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  timetableSlots: TimetableSlot[];
  onAddLesson: (lesson: Lesson) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onAutoDistributeLessons: (subjectName?: string) => void;
}

export const LessonBankManagerModal: React.FC<LessonBankManagerModalProps> = ({
  isOpen,
  onClose,
  lessons,
  timetableSlots,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAutoDistributeLessons,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  // Form states
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSummary, setLessonSummary] = useState('');
  const [keyPointsText, setKeyPointsText] = useState('');

  if (!isOpen) return null;

  const currentSubjectLessons = lessons
    .filter((l) => (l.subjectName || '').toLowerCase() === (selectedSubject || '').toLowerCase())
    .sort((a, b) => a.lessonNumber - b.lessonNumber);

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingLessonId(null);
    setLessonNumber(currentSubjectLessons.length + 1);
    setLessonTitle('');
    setLessonSummary('');
    setKeyPointsText('');
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingLessonId(null);
    setLessonNumber(currentSubjectLessons.length + 1);
    setLessonTitle(`Bài ${currentSubjectLessons.length + 1}: `);
    setLessonSummary('');
    setKeyPointsText('');
  };

  const handleStartEdit = (l: Lesson) => {
    setEditingLessonId(l.id);
    setIsAddingNew(false);
    setLessonNumber(l.lessonNumber);
    setLessonTitle(l.title);
    setLessonSummary(l.summary || '');
    setKeyPointsText((l.keyPoints || []).join('\n'));
  };

  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập tên bài học.');
      return;
    }

    const keyPointsArray = keyPointsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingLessonId) {
      onUpdateLesson({
        id: editingLessonId,
        subjectName: selectedSubject,
        lessonNumber,
        title: lessonTitle,
        summary: lessonSummary,
        keyPoints: keyPointsArray,
      });
    } else {
      onAddLesson({
        id: `lesson-${Date.now()}`,
        subjectName: selectedSubject,
        lessonNumber,
        title: lessonTitle,
        summary: lessonSummary,
        keyPoints: keyPointsArray,
      });
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-[#1b1f2b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
              📚
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Kho Bài Học &amp; Phân Phối Bài Tự Động
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý ngân hàng bài học và tự động rải bài theo thứ tự vào Thời khóa biểu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Bar: Auto Distribution */}
        <div className="px-5 py-2.5 bg-purple-50/80 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-purple-950 dark:text-purple-300 font-medium">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Thuật toán tự động phân phối bài học theo tuần:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onAutoDistributeLessons(selectedSubject);
                alert(`Đã tự động rải các bài học môn ${selectedSubject} vào các tiết trong tuần!`);
              }}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 hover:bg-purple-100 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              ⚡ Rải bài môn {selectedSubject}
            </button>
            <button
              type="button"
              onClick={() => {
                onAutoDistributeLessons();
                alert('Đã tự động phân phối bài học cho TẤT CẢ các môn trong tuần!');
              }}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              ⚡ Tự động rải bài TẤT CẢ các môn
            </button>
          </div>
        </div>

        {/* Main Content Layout: Subjects Sidebar + Lessons List */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Subjects Sidebar */}
          <div className="w-48 sm:w-56 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3 overflow-y-auto space-y-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 tracking-wider">
              Danh Sách Môn Học
            </span>
            {SUBJECTS_LIST.map((s) => {
              const count = lessons.filter(
                (l) => (l.subjectName || '').toLowerCase() === (s.name || '').toLowerCase()
              ).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(s.name);
                    resetForm();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    selectedSubject === s.name
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedSubject === s.name
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {count} bài
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lessons List & Form */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Subject Title & Add Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Môn: {selectedSubject}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {currentSubjectLessons.length} bài học trong kho
                  </span>
                </h4>
              </div>

              {!isAddingNew && !editingLessonId && (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm bài học mới</span>
                </button>
              )}
            </div>

            {/* Add / Edit Form */}
            {(isAddingNew || editingLessonId) && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs text-blue-900 dark:text-blue-300">
                  <span>{editingLessonId ? '✏️ Chỉnh sửa bài học' : '➕ Thêm bài học mới'}</span>
                  <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-1">
                    <label className="block font-semibold mb-1">Số thứ tự bài:</label>
                    <input
                      type="number"
                      min={1}
                      value={lessonNumber}
                      onChange={(e) => setLessonNumber(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1">Tên bài học:</label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="VD: Bài 3: Cấp số cộng"
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold mb-1">Tóm tắt nội dung trọng tâm:</label>
                  <textarea
                    rows={2}
                    value={lessonSummary}
                    onChange={(e) => setLessonSummary(e.target.value)}
                    placeholder="Mô tả ngắn gọn kiến thức chính của bài..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold mb-1">Các ý chính cần có trong Sơ đồ tư duy (Mỗi dòng 1 ý):</label>
                  <textarea
                    rows={3}
                    value={keyPointsText}
                    onChange={(e) => setKeyPointsText(e.target.value)}
                    placeholder="Định nghĩa&#10;Công thức tính&#10;Phương pháp giải&#10;Ví dụ"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 rounded-lg text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLesson}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                  >
                    Lưu bài học
                  </button>
                </div>
              </div>
            )}

            {/* Lessons Cards List */}
            <div className="space-y-2.5">
              {currentSubjectLessons.length > 0 ? (
                currentSubjectLessons.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
                          {l.lessonNumber}
                        </span>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {l.title}
                        </h5>
                      </div>

                      {l.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">
                          {l.summary}
                        </p>
                      )}

                      {l.keyPoints && l.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-8 pt-1">
                          {l.keyPoints.map((pt, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              • {pt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(l)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                        title="Chỉnh sửa bài học"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deletingLessonId === l.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-lg text-xs">
                          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Xóa?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteLesson(l.id);
                              setDeletingLessonId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            Có
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingLessonId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingLessonId(l.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="Xóa bài học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs">Chưa có bài học nào trong môn {selectedSubject}</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
