import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Key, 
  Download, 
  Upload, 
  Cloud, 
  ShieldCheck, 
  Smartphone, 
  ExternalLink,
  Loader2,
  RefreshCw,
  FolderDown,
  Info
} from 'lucide-react';
import { syncStudentProfileToCloud } from '../lib/firebase';

interface StudentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  avatar?: string;
  viewerPassword?: string;
  onUpdateViewerPassword: (newPassword: string) => Promise<boolean>;
  onExportBackupJson: () => void;
  onImportBackupJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onManualSyncCloud: () => Promise<boolean>;
  isSyncingCloud?: boolean;
}

export const StudentShareModal: React.FC<StudentShareModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  avatar = '👦',
  viewerPassword = '123456',
  onUpdateViewerPassword,
  onExportBackupJson,
  onImportBackupJson,
  onManualSyncCloud,
  isSyncingCloud = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(viewerPassword);
  const [passwordSaveStatus, setPasswordSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [syncFeedback, setSyncFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleManualSyncClick = async () => {
    try {
      const ok = await onManualSyncCloud();
      if (ok) {
        setSyncFeedback('success');
        setTimeout(() => setSyncFeedback('idle'), 3500);
      } else {
        setSyncFeedback('error');
        setTimeout(() => setSyncFeedback('idle'), 4000);
      }
    } catch {
      setSyncFeedback('error');
      setTimeout(() => setSyncFeedback('idle'), 4000);
    }
  };

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?student=${studentId}`
    : `https://vulang-app.web.app/?student=${studentId}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error('Copy link error:', err);
    }
  };

  const handleCopyPassword = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(viewerPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2500);
      }
    } catch (err) {
      console.error('Copy password error:', err);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setPasswordSaveStatus('saving');
    const success = await onUpdateViewerPassword(newPassword.trim());
    if (success) {
      setPasswordSaveStatus('saved');
      setIsEditingPassword(false);
      setTimeout(() => setPasswordSaveStatus('idle'), 2000);
    } else {
      setPasswordSaveStatus('idle');
    }
  };

  return (
    <div 
      id="student-share-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="student-share-modal-container"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-xs">
              {avatar}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Chia Sẻ Cho Cha Mẹ & Sao Lưu</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  Admin {studentName}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gửi 1 Link cố định + 1 Mật khẩu để Cha Mẹ đồng hành xem bài học
              </p>
            </div>
          </div>
          <button
            id="btn-close-student-share-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Card 1: Link Cố Định */}
          <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>1. Link xem bài học cố định của bạn:</span>
              </label>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Chỉ xem (Read-Only)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-fixed-student-share-link"
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden select-all"
              />
              <button
                id="btn-copy-student-share-link"
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã chép!' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Mật Khẩu Xem Bài */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>2. Mật khẩu xem bài dành cho Cha Mẹ:</span>
              </label>
              {!isEditingPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword(viewerPassword);
                    setIsEditingPassword(true);
                  }}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                >
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <form onSubmit={handleSavePassword} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={passwordSaveStatus === 'saving'}
                  className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                >
                  {passwordSaveStatus === 'saving' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPassword(false)}
                  className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 cursor-pointer"
                >
                  Hủy
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-full px-3 py-2 text-sm font-black tracking-widest bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>{viewerPassword}</span>
                  <span className="text-[11px] font-medium text-slate-400 font-sans tracking-normal">
                    (Cung cấp mã này cho Bố/Mẹ)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs ${
                    copiedPassword
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {copiedPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPassword ? 'Đã chép!' : 'Chép mã'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Cơ chế sao lưu & Tải lên Google Drive / File máy */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FolderDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>3. Sao lưu Dữ liệu & Lưu trữ Cá nhân:</span>
              </span>
              <div className="flex items-center gap-2">
                {syncFeedback === 'success' && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    Đã lưu Server thành công!
                  </span>
                )}
                {syncFeedback === 'error' && (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Lưu thất bại, thử lại
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleManualSyncClick}
                  disabled={isSyncingCloud}
                  className="text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:text-sky-800 flex items-center gap-1 cursor-pointer bg-sky-50 dark:bg-sky-950/40 px-2 py-1 rounded border border-sky-200 dark:border-sky-800"
                  title="Đồng bộ dữ liệu ngay lập tức lên Server để Cha/Mẹ xem được"
                >
                  {isSyncingCloud ? (
                    <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                  ) : (
                    <Cloud className="w-3 h-3 text-sky-600" />
                  )}
                  <span>{isSyncingCloud ? 'Đang lưu...' : 'Lưu Server ngay'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Nút Xuất file JSON lưu Google Drive / Máy */}
              <button
                id="btn-export-backup-json"
                type="button"
                onClick={onExportBackupJson}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-center"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Tải File Sao Lưu (.JSON)</span>
              </button>

              {/* Nút Nhập file JSON khôi phục khi cài lại máy */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={onImportBackupJson}
                  className="hidden"
                />
                <button
                  id="btn-import-backup-json"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                >
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Khôi Phục Khi Cài Máy</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Bạn có thể lưu file sao lưu này lên <b>Google Drive cá nhân</b>. Khi đổi sang máy tính hoặc điện thoại mới, chỉ cần chọn "Khôi Phục Khi Cài Máy" là lấy lại 100% thời khóa biểu, bài tập và sơ đồ tư duy.
              </span>
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dữ liệu lưu an toàn trên IndexedDB máy bạn & Server</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
