import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Plus, 
  Trash2, 
  X, 
  Edit2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface SubjectMenuBarProps {
  subjectList: string[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string | null) => void;
  onAddSubject: (name: string) => void;
  onEditSubject: (oldName: string, newName: string) => void;
  onDeleteSubject: (name: string) => void;
  onOpenAddModal: () => void;
  appMode?: 'viewer' | 'editor';
}

export const SubjectMenuBar: React.FC<SubjectMenuBarProps> = ({
  subjectList,
  selectedSubject,
  onSelectSubject,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onOpenAddModal,
  appMode = 'editor',
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Editing state
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  // Delete modal state
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);

  const isEditor = appMode === 'editor';

  // Handle adding new subject
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (name) {
      onAddSubject(name);
      onSelectSubject(name);
      setNewSubjectName('');
      setIsAddingNew(false);
    }
  };

  // Start editing a subject
  const startEditing = (e: React.MouseEvent, subjectName: string) => {
    e.stopPropagation();
    setEditingSubject(subjectName);
    setEditedName(subjectName);
  };

  // Submit subject name edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject && editedName.trim() && editedName.trim() !== editingSubject) {
      onEditSubject(editingSubject, editedName.trim());
    }
    setEditingSubject(null);
    setEditedName('');
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (subjectToDelete) {
      onDeleteSubject(subjectToDelete);
      if (selectedSubject === subjectToDelete) {
        onSelectSubject(null);
      }
      setSubjectToDelete(null);
    }
  };

  return (
    <div className="bg-[#f5f5f7] dark:bg-[#161617] border-b border-[#d2d2d7] dark:border-slate-800/80 py-2.5 px-3 sm:px-6 transition-colors">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        
        {/* Menu Bar Label */}
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#515154] dark:text-slate-400 shrink-0 tracking-tight">
          <BookOpen className="w-4 h-4 text-[#1d1d1f] dark:text-blue-400" />
          <span className="hidden sm:inline">Môn học:</span>
        </div>
 
        {/* Scrollable Horizontal Menu Bar of Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 flex-1">
          
          {/* "Tất Cả Môn" Button */}
          <button
            onClick={() => onSelectSubject(null)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedSubject === null
                ? 'bg-[var(--light-primary,#BC0024)] text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-[#252528] text-[#1d1d1f] dark:text-slate-300 border border-[#d2d2d7] dark:border-slate-800 hover:bg-[#f5f5f7] dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>
 
          {/* Subject Items with Inline Edit & Delete options */}
          {subjectList.map((subjectName) => {
            const isSelected = selectedSubject === subjectName;
            const isBeingEdited = editingSubject === subjectName;
 
            if (isBeingEdited) {
              return (
                <form 
                  key={subjectName} 
                  onSubmit={handleSaveEdit}
                  className="flex items-center gap-1 shrink-0 bg-white dark:bg-[#252528] border border-[#86868b] dark:border-blue-500 rounded-full px-2.5 py-0.5 shadow-xs"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2 py-0.5 text-sm font-medium text-[#1d1d1f] dark:text-white bg-transparent focus:outline-none w-28 sm:w-36"
                  />
                  <button
                    type="submit"
                    className="p-1 text-[#1d1d1f] dark:text-blue-400 hover:bg-[#f5f5f7] dark:hover:bg-blue-950 rounded-full cursor-pointer transition-colors"
                    title="Lưu tên mới"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="p-1 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-slate-200 cursor-pointer"
                    title="Hủy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              );
            }
 
            return (
              <div
                key={subjectName}
                className={`group flex items-center rounded-full text-sm transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-[var(--light-primary,#BC0024)] text-white font-medium border-[var(--light-primary,#BC0024)] dark:bg-blue-600 dark:border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-[#252528] text-[#1d1d1f] dark:text-slate-300 border border-[#d2d2d7] dark:border-slate-800 hover:bg-[#f5f5f7] dark:hover:bg-slate-800'
                }`}
              >
                {/* Subject Name Button */}
                <button
                  onClick={() => onSelectSubject(subjectName)}
                  className="px-3 py-1.5 cursor-pointer whitespace-nowrap font-medium"
                >
                  {subjectName}
                </button>
 
                {/* Edit & Delete Buttons (Editor Mode) */}
                {isEditor && (
                  <div className="flex items-center pr-2 gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEditing(e, subjectName)}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        isSelected 
                          ? 'hover:bg-black/40 text-slate-200' 
                          : 'hover:bg-[#e8e8ed] dark:hover:bg-slate-700 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-slate-200'
                      }`}
                      title={`Sửa tên môn "${subjectName}"`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubjectToDelete(subjectName);
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer ${
                        isSelected 
                          ? 'hover:bg-black/40 text-red-200 hover:text-white' 
                          : 'hover:bg-red-50 dark:hover:bg-red-950/60 text-[#86868b] hover:text-[#ff3b30] dark:hover:text-red-400'
                      }`}
                      title={`Xóa môn "${subjectName}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
 
          {/* Add Subject Inline Input or Button */}
          {isEditor && (
            isAddingNew ? (
              <form 
                onSubmit={handleAddSubmit} 
                className="flex items-center gap-1 shrink-0 bg-white dark:bg-[#252528] border border-[#d2d2d7] dark:border-blue-500 rounded-full px-2 py-0.5 shadow-xs"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Tên môn mới..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="px-2 py-0.5 text-xs text-[#1d1d1f] dark:text-white bg-transparent focus:outline-none w-28 sm:w-36"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#ff3b30] hover:bg-[#e03228] dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full cursor-pointer transition-colors"
                >
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="p-1 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#515154] dark:text-slate-300 bg-[#e8e8ed] dark:bg-slate-800 hover:bg-[#d2d2d7] dark:hover:bg-slate-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="Thêm môn học mới vào menu"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm môn</span>
              </button>
            )
          )}
 
        </div>
 
        {/* Add Quick Schedule Button (Editor mode only) */}
        {isEditor && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#ff3b30] dark:text-blue-400 bg-[#fff0f0] dark:bg-blue-950/60 hover:bg-[#ffe5e5] dark:hover:bg-blue-900/80 border border-[#ffc2c0] dark:border-blue-800/80 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Thêm giờ học mới"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm giờ học</span>
          </button>
        )}
 
      </div>
 
      {/* Delete Confirmation Dialog */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 bg-[#1d1d1f]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-5 max-w-sm w-full border border-[#d2d2d7] dark:border-[#2a2e39] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-950/60 rounded-xl text-[#ff3b30] dark:text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">
                  Xác nhận xóa môn
                </h3>
                <p className="text-xs text-[#86868b] dark:text-slate-400 mt-1 leading-relaxed">
                  Bạn có chắc muốn xóa menu môn <span className="font-semibold text-[#1d1d1f] dark:text-slate-200">"{subjectToDelete}"</span> và tất cả các buổi học liên quan đến môn này?
                </p>
              </div>
            </div>
 
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d2d2d7] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubjectToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#515154] dark:text-slate-300 hover:bg-[#f5f5f7] dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#ff3b30] hover:bg-[#ff453a] rounded-full shadow-xs transition-colors cursor-pointer"
              >
                Xóa môn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
