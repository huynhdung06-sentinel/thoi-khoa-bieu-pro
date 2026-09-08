import React from 'react';
import { LogOut, User, X, GraduationCap, ShieldCheck } from 'lucide-react';
import { ChildProfile, FamilyAccount, UserRole } from '../types';

export type FamilyModalTab = 'overview' | 'qr_cards' | 'parent_dashboard';

interface UnifiedFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: FamilyModalTab;
  family: FamilyAccount;
  onUpdateFamily?: (updated: FamilyAccount) => void;
  currentRole?: UserRole;
  activeChildProfile?: ChildProfile | null;
  onSelectChild?: (child: ChildProfile) => void;
  onSelectParent?: () => void;
  onSwitchActiveChild?: (child: ChildProfile) => void;
  onDeleteChild?: (childId: string) => void;
  onEditChild?: (child: ChildProfile) => void;
  onAddChild?: (child: ChildProfile) => void;
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchProfile?: () => void;
  onLogout?: () => void;
  backupStatus?: {
    status: 'fresh' | 'pending' | 'warning';
    daysSinceLastBackup: number;
    unsavedCount: number;
    lastBackupDateStr: string;
  };
  onOpenCloudSync?: () => void;
  onExitParentMode?: () => void;
  currentUserEmail?: string;
}

export const UnifiedFamilyModal: React.FC<UnifiedFamilyModalProps> = ({
  isOpen,
  onClose,
  family,
  activeChildProfile,
  currentUserEmail,
  onLogout,
}) => {
  if (!isOpen) return null;

  const studentName = activeChildProfile?.name || family.parentName || 'Học sinh';
  const studentGrade = activeChildProfile?.grade || 'Học tập tích cực';
  const studentAvatar = activeChildProfile?.avatar || '🎓';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 text-slate-900">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm border border-blue-100">
              🎓
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                Tài Khoản Học Sinh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Hệ thống thời khóa biểu & học tập
              </p>
            </div>
          </div>
        </div>

        {/* Body - Student Info */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 flex items-center justify-center text-3xl shadow-sm border border-blue-100">
              {studentAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-slate-900 truncate">
                {studentName}
              </div>
              <div className="text-xs text-blue-700 font-semibold mt-0.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {studentGrade}
              </div>
              {currentUserEmail && (
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentUserEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tài khoản cá nhân hoạt động ổn định và bảo mật.</span>
          </div>
        </div>

        {/* Footer - Logout Button */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất tài khoản
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
