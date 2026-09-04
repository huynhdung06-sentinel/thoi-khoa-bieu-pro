import React from 'react';
import { Download, ShieldCheck, AlertTriangle, Clock, X, CheckCircle, FileText } from 'lucide-react';

interface BackupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteExport: () => void;
  unsavedCount: number;
  daysSinceLastBackup: number;
  lastBackupDateStr: string;
  studentName: string;
  className: string;
}

export const BackupReminderModal: React.FC<BackupReminderModalProps> = ({
  isOpen,
  onClose,
  onExecuteExport,
  unsavedCount,
  daysSinceLastBackup,
  lastBackupDateStr,
  studentName,
  className
}) => {
  if (!isOpen) return null;

  const isCountTrigger = unsavedCount >= 5;
  const isTimeTrigger = daysSinceLastBackup >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden">
        
        {/* Background ambient decorative glow */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-36 h-36 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        {/* Header with Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl border border-amber-200 dark:border-amber-800/80 shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1">
                <span>🛡️ Bảo Vệ Dữ Liệu Học Tập</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-snug">
                {isCountTrigger
                  ? `Bạn có ${unsavedCount} thay đổi mới chưa lưu file!`
                  : isTimeTrigger
                  ? `Đã ${daysSinceLastBackup} ngày bạn chưa tải file sao lưu!`
                  : 'Nhắc nhở sao lưu an toàn định kỳ'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <FileText className="w-4 h-4 text-blue-500" />
              Thời khóa biểu:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {studentName} ({className})
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-amber-500" />
              Lần tải file gần nhất:
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {lastBackupDateStr}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
            <span className="font-medium text-slate-700 dark:text-slate-200">Trạng thái hiện tại:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Có {unsavedCount} mục mới chưa export
            </span>
          </div>
        </div>

        {/* Why backup message */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Vì ứng dụng chạy trên mô hình <strong>Local-First (Ưu tiên lưu cục bộ)</strong>:
          </p>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Dữ liệu thuộc quyền kiểm soát 100% của bạn, bảo mật tuyệt đối.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Tải file về máy giúp tránh bị mất khi bạn lỡ xóa bộ nhớ trình duyệt hoặc cài lại máy tính.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Có thể mở lại trên bất kỳ điện thoại hay máy tính khác bằng nút <strong>Khôi Phục Data</strong>.</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onExecuteExport();
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>📥 TẢI FILE SAO LƯU NGAY (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
          >
            Để tôi tải sau
          </button>
        </div>

      </div>
    </div>
  );
};
