import React, { useState } from 'react';
import { ClassInfo } from '../types';
import { X, Settings, RotateCcw, Save, ShieldAlert, Sparkles } from 'lucide-react';
import { INITIAL_CLASS_INFO } from '../data/mockData';

interface ClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classInfo: ClassInfo;
  onSaveClassInfo: (info: ClassInfo) => void;
  onResetToDefaults: () => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({
  isOpen,
  onClose,
  classInfo,
  onSaveClassInfo,
  onResetToDefaults,
}) => {
  const [className, setClassName] = useState(classInfo.className);
  const [teacherName, setTeacherName] = useState(classInfo.teacherName);
  const [studentName, setStudentName] = useState(classInfo.studentName);
  const [weekStartDate, setWeekStartDate] = useState(classInfo.weekStartDate);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !teacherName.trim()) {
      alert('Vui lòng nhập đầy đủ tên lớp và tên GVCN.');
      return;
    }
    onSaveClassInfo({
      className: className.trim(),
      teacherName: teacherName.trim(),
      studentName: studentName.trim() || 'Học sinh',
      weekStartDate,
    });
    alert('Đã cập nhật thông tin lớp học thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-[#1b1f2b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-lg shrink-0">
              ⚙️
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Cài Đặt Lớp Học &amp; Thời Khóa Biểu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tùy chỉnh thông tin lớp 11A1-01, GVCN và ngày bắt đầu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Lớp học:
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="VD: 11A1-01"
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Giáo viên chủ nhiệm (GVCN):
            </label>
            <input
              type="text"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="VD: Nguyễn Đức Việt"
              className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-blue-700 dark:text-blue-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Học sinh (Sử dụng cho giao diện Học sinh/Phụ huynh):
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="VD: Nguyễn Minh"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              TKB áp dụng từ ngày (Thứ Hai bắt đầu tuần):
            </label>
            <input
              type="date"
              required
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset Template Danger Action */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Khôi phục lại dữ liệu mặc định chuẩn như ảnh mẫu 11A1-01 (GVCN Nguyễn Đức Việt)?')) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục TKB gốc 11A1-01</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cài Đặt</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
