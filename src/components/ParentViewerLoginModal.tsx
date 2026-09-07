import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { getStudentProfileFromCloud, verifyAndFetchStudentWorkspace } from '../lib/firebase';

interface ParentViewerLoginModalProps {
  isOpen: boolean;
  studentId: string;
  onSuccessLogin: (studentData: any, studentProfile: any) => void;
  onCancel?: () => void;
}

export const ParentViewerLoginModal: React.FC<ParentViewerLoginModalProps> = ({
  isOpen,
  studentId,
  onSuccessLogin,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setErrorMessage(null);
      try {
        const profile = await getStudentProfileFromCloud(studentId);
        if (isMounted) {
          setStudentProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching student profile for viewer:', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await verifyAndFetchStudentWorkspace(studentId, password.trim());
      if (result.success) {
        // Lưu mật khẩu vào sessionStorage để phụ huynh không phải nhập lại trong phiên làm việc
        sessionStorage.setItem(`parent_viewer_pwd_${studentId}`, password.trim());
        onSuccessLogin(result.appState, result.profile);
      } else {
        setErrorMessage(result.error || 'Mật khẩu xem bài không chính xác!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsVerifying(false);
    }
  };

  const studentName = studentProfile?.studentName || 'Học Sinh';
  const avatar = studentProfile?.avatar || '👦';
  const gradeClass = [studentProfile?.grade, studentProfile?.className].filter(Boolean).join(' - ');

  return (
    <div 
      id="parent-viewer-login-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="parent-viewer-login-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Top Banner */}
        <div className="p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <GraduationCap className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg border border-white/30 mb-3 animate-bounce duration-1000">
              {avatar}
            </div>

            <h2 className="text-xl font-extrabold tracking-tight">
              Góc Đồng Hành Của Cha Mẹ
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              Xem tiến độ bài học & sơ đồ tư duy của <b>{studentName}</b>
            </p>
            {gradeClass && (
              <span className="mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30">
                {gradeClass}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Nhập mật khẩu xem bài do con cung cấp:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Mặc định: 123456)
              </span>
            </label>

            <div className="relative">
              <input
                id="input-parent-viewer-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ví dụ: 123456..."
                className="w-full px-4 py-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden pr-11 transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            id="btn-submit-parent-viewer-password"
            type="submit"
            disabled={isVerifying || !password.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải dữ liệu của con...</span>
              </>
            ) : (
              <>
                <span>Vào Xem Bài Học Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chế độ Đồng Hành: Chỉ xem, bảo vệ an toàn 100% bài học của con.</span>
            </p>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline mt-2 block mx-auto cursor-pointer"
              >
                Quay lại không gian chính
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
