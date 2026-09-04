import React, { useState, useEffect } from 'react';
import { PeriodInfo } from '../types';
import { STANDARD_PERIODS } from '../data/mockData';
import { X, Clock, RotateCcw, Save, Sun, Sunset, Check, Trash2, Plus } from 'lucide-react';

interface EditPeriodTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: PeriodInfo[];
  onSavePeriods: (updatedPeriods: PeriodInfo[]) => void;
}

export const EditPeriodTimesModal: React.FC<EditPeriodTimesModalProps> = ({
  isOpen,
  onClose,
  periods,
  onSavePeriods,
}) => {
  const [localPeriods, setLocalPeriods] = useState<PeriodInfo[]>([]);
  const [activeSessionTab, setActiveSessionTab] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (periods && periods.length > 0) {
      setLocalPeriods(JSON.parse(JSON.stringify(periods)));
    } else {
      setLocalPeriods(JSON.parse(JSON.stringify(STANDARD_PERIODS)));
    }
  }, [periods, isOpen]);

  if (!isOpen) return null;

  const handleTimeChange = (session: 'morning' | 'afternoon', periodNum: number, field: 'startTime' | 'endTime', value: string) => {
    setLocalPeriods(prev => 
      prev.map(p => {
        if (p.session === session && p.period === periodNum) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleDeletePeriod = (session: 'morning' | 'afternoon', periodNum: number) => {
    if (localPeriods.filter(p => p.session === session).length <= 1) {
      alert('Mỗi buổi cần có ít nhất 1 tiết học!');
      return;
    }
    setLocalPeriods(prev => prev.filter(p => !(p.session === session && p.period === periodNum)));
  };

  const handleAddPeriod = (session: 'morning' | 'afternoon') => {
    const sessionItems = localPeriods.filter(p => p.session === session);
    const maxPeriod = sessionItems.length > 0 ? Math.max(...sessionItems.map(p => p.period)) : 0;
    const newPeriodNum = maxPeriod + 1;
    const newPeriod: PeriodInfo = {
      period: newPeriodNum,
      session,
      startTime: session === 'morning' ? '11:00' : '16:00',
      endTime: session === 'morning' ? '11:45' : '16:45',
    };
    setLocalPeriods(prev => [...prev, newPeriod]);
  };

  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục về khung giờ tiết học mặc định không?')) {
      setLocalPeriods(JSON.parse(JSON.stringify(STANDARD_PERIODS)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePeriods(localPeriods);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const morningItems = localPeriods.filter(p => p.session === 'morning');
  const afternoonItems = localPeriods.filter(p => p.session === 'afternoon');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Cấu Hình Khung Giờ Tiết Học
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dành cho Phụ huynh & Giáo viên điều chỉnh khớp với lịch học của nhà trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg font-semibold">
            <button
              type="button"
              onClick={() => setActiveSessionTab('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                activeSessionTab === 'all'
                  ? 'bg-white text-blue-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả (10 tiết)
            </button>
            <button
              type="button"
              onClick={() => setActiveSessionTab('morning')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeSessionTab === 'morning'
                  ? 'bg-white text-sky-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Buổi Sáng</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSessionTab('afternoon')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeSessionTab === 'afternoon'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sunset className="w-3.5 h-3.5 text-orange-500" />
              <span>Buổi Chiều</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 font-medium text-xs py-1 px-2 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Khôi phục lại giờ tiết chuẩn mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khôi phục mặc định</span>
          </button>
        </div>

        {/* Main Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          
          {/* BUỔI SÁNG */}
          {(activeSessionTab === 'all' || activeSessionTab === 'morning') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h4 className="font-extrabold text-sky-900 text-sm uppercase tracking-wide">
                    Buổi Sáng ({morningItems.length} tiết)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddPeriod('morning')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tiết sáng</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {morningItems.map((p) => (
                  <div key={`m-${p.period}`} className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center justify-between gap-2">
                    <div className="font-bold text-sky-950 text-xs flex items-center gap-1.5 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center font-black text-xs">
                        {p.period}
                      </span>
                      <span>Tiết {p.period}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        required
                        value={p.startTime}
                        onChange={(e) => handleTimeChange('morning', p.period, 'startTime', e.target.value)}
                        className="px-2 py-1 bg-white border border-sky-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-24"
                      />
                      <span className="text-slate-400 font-bold text-xs">-</span>
                      <input
                        type="time"
                        required
                        value={p.endTime}
                        onChange={(e) => handleTimeChange('morning', p.period, 'endTime', e.target.value)}
                        className="px-2 py-1 bg-white border border-sky-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-24"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod('morning', p.period)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Xóa tiết học này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BUỔI CHIỀU */}
          {(activeSessionTab === 'all' || activeSessionTab === 'afternoon') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Sunset className="w-4 h-4 text-orange-500" />
                  <h4 className="font-extrabold text-amber-900 text-sm uppercase tracking-wide">
                    Buổi Chiều ({afternoonItems.length} tiết)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddPeriod('afternoon')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tiết chiều</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {afternoonItems.map((p) => (
                  <div key={`a-${p.period}`} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between gap-2">
                    <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                        {p.period}
                      </span>
                      <span>Tiết {p.period}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        required
                        value={p.startTime}
                        onChange={(e) => handleTimeChange('afternoon', p.period, 'startTime', e.target.value)}
                        className="px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-24"
                      />
                      <span className="text-slate-400 font-bold text-xs">-</span>
                      <input
                        type="time"
                        required
                        value={p.endTime}
                        onChange={(e) => handleTimeChange('afternoon', p.period, 'endTime', e.target.value)}
                        className="px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-24"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod('afternoon', p.period)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Xóa tiết học này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Footer Bar */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[11px] text-slate-500 italic">
              * Thay đổi giờ sẽ lập tức cập nhật lên bảng Thời khóa biểu của học sinh.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-xs font-extrabold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  saveSuccess ? 'bg-emerald-600' : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 animate-bounce" />
                    <span>Đã Lưu Khung Giờ!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Khung Giờ Học</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
