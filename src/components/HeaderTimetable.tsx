import React, { useState, useEffect } from 'react';
import { UserRole, ClassInfo, DashboardTab, FamilyAccount, ChildProfile } from '../types';
import { getVietnamCurrentMondayStr, getVietnamTimeParts } from '../utils/dateUtils';
import { UnifiedFamilyModal, FamilyModalTab } from './UnifiedFamilyModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock,
  Menu, 
  BarChart3, 
  BookOpen, 
  FileText,
  GraduationCap,
  Settings,
  Users,
  LogOut,
  ChevronDown,
  Share2,
  Loader2,
  Download,
  Upload,
  ShieldCheck,
  Cloud,
  Check,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderTimetableProps {
  classInfo: ClassInfo;
  onUpdateClassInfo: (info: Partial<ClassInfo>) => void;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetWeek: () => void;
  onOpenGallery: () => void;
  onOpenLessonBank: () => void;
  onOpenSettings: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetAllData: () => void;
  completedCount: number;
  totalStudySlots: number;
  todayPendingCount?: number;
  todayTotalSlots?: number;
  documentsCount?: number;
  activeTab?: DashboardTab;
  onSelectTab?: (tab: DashboardTab) => void;
  onToggleMobileSidebar?: () => void;
  breadcrumbElement?: React.ReactNode;
  onSwitchProfile?: () => void;
  onLogout?: () => void;
  currentChildAvatar?: string;
  onShareReport?: () => void;
  isVictory?: boolean;
  isCapturing?: boolean;
  onOpenAboutStory?: () => void;
  family: FamilyAccount;
  activeChildProfile: ChildProfile | null;
  onSelectChild: (child: ChildProfile) => void;
  onSelectParent: () => void;
  isGuestMode?: boolean;
  onOpenCloudSync?: () => void;
  backupStatus?: {
    status: 'fresh' | 'pending' | 'warning';
    daysSinceLastBackup: number;
    unsavedCount: number;
    lastBackupDateStr: string;
  };
  onOpenBackupReminder?: () => void;
  onOpenFamilyCodeCard?: () => void;
  onUpdateFamily?: (family: FamilyAccount) => void;
  onAddChild?: (child: ChildProfile) => void;
  onEditChild?: (child: ChildProfile) => void;
  onDeleteChild?: (childId: string) => void;
  onManualSync?: () => Promise<boolean> | void;
  isCloudSyncing?: boolean;
}

export const HeaderTimetable: React.FC<HeaderTimetableProps> = ({
  classInfo,
  onUpdateClassInfo,
  currentRole,
  onChangeRole,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  completedCount,
  todayPendingCount = 0,
  todayTotalSlots = 0,
  documentsCount,
  activeTab = 'timetable',
  onSelectTab,
  onToggleMobileSidebar,
  breadcrumbElement,
  onOpenSettings,
  onSwitchProfile,
  onLogout,
  currentChildAvatar,
  onShareReport,
  isVictory,
  isCapturing,
  onOpenAboutStory,
  family,
  activeChildProfile,
  onSelectChild,
  onSelectParent,
  isGuestMode,
  onOpenCloudSync,
  onExportData,
  onImportData,
  backupStatus,
  onOpenBackupReminder,
  onOpenFamilyCodeCard,
  onUpdateFamily,
  onAddChild,
  onEditChild,
  onDeleteChild,
  onManualSync,
  isCloudSyncing = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<FamilyModalTab>('overview');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [tempClass, setTempClass] = useState(classInfo.className);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [tempStudent, setTempStudent] = useState(classInfo.studentName || '');
  const [syncSuccessBadge, setSyncSuccessBadge] = useState(false);

  // Live real-time digital clock in Vietnam UTC+7 timezone
  const [timeParts, setTimeParts] = useState(() => getVietnamTimeParts());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeParts(getVietnamTimeParts());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMonday = getVietnamCurrentMondayStr();
  const isCurrentWeek = classInfo.weekStartDate === currentMonday;

  // Format date display (DD/MM/YYYY) - always shows Monday of the week
  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const day = date.getDay();
      const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(y, m - 1, diffToMonday);
      const monD = String(monday.getDate()).padStart(2, '0');
      const monM = String(monday.getMonth() + 1).padStart(2, '0');
      const monY = monday.getFullYear();
      return `${monD}/${monM}/${monY}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="bg-white dark:bg-[#161f30] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors shadow-xs">
      {/* Top Portal Header Bar (Academic School Library Style) */}
      <div className="w-[96%] sm:w-[94%] mx-auto px-2 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Menu Toggle & Institutional Crest */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 md:hidden cursor-pointer hover:bg-slate-100"
              title="Mở menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
              TKB
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-tight block">
                Thời Khóa Biểu &amp; Chương Trình Học
              </span>
              
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Editable Class Tag */}
                {isEditingClass ? (
                  <input
                    type="text"
                    value={tempClass}
                    onChange={(e) => setTempClass(e.target.value)}
                    onBlur={() => {
                      setIsEditingClass(false);
                      onUpdateClassInfo({ className: tempClass.trim() || classInfo.className });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingClass(false);
                        onUpdateClassInfo({ className: tempClass.trim() || classInfo.className });
                      }
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold border border-blue-400 bg-white dark:bg-slate-900 rounded focus:outline-hidden w-28 sm:w-36 text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setTempClass(classInfo.className);
                      setIsEditingClass(true);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 cursor-pointer transition-colors flex items-center gap-1 group"
                    title="Bấm để sửa Lớp học / Khóa học"
                  >
                    <span>
                      {classInfo.className
                        ? (classInfo.className.toLowerCase().startsWith('lớp') || classInfo.className.toLowerCase().startsWith('sinh viên') || classInfo.className.toLowerCase().startsWith('đại học')
                          ? classInfo.className
                          : `Lớp ${classInfo.className}`)
                        : 'Lớp / Khóa học (Bấm để điền)'}
                    </span>
                  </span>
                )}

                {/* Editable Student Name Tag */}
                {isEditingStudent ? (
                  <input
                    type="text"
                    value={tempStudent}
                    onChange={(e) => setTempStudent(e.target.value)}
                    onBlur={() => {
                      setIsEditingStudent(false);
                      onUpdateClassInfo({ studentName: tempStudent.trim() || classInfo.studentName });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingStudent(false);
                        onUpdateClassInfo({ studentName: tempStudent.trim() || classInfo.studentName });
                      }
                    }}
                    className="px-2 py-0.5 text-[11px] font-bold border border-purple-400 bg-white dark:bg-slate-900 rounded focus:outline-hidden w-48 sm:w-64 text-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setTempStudent(classInfo.studentName || '');
                      setIsEditingStudent(true);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 cursor-pointer transition-colors flex items-center gap-1 group"
                    title="Bấm để sửa tên hiển thị"
                  >
                    {currentChildAvatar && <span className="text-xs">{currentChildAvatar}</span>}
                    <span>{classInfo.studentName || 'Họ và tên (Bấm để điền)'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center/Nav: Clean Horizontal Portal Navigation */}
        {onSelectTab && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectTab('timetable')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                activeTab === 'timetable'
                  ? 'bg-blue-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 font-medium'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Thời khóa biểu</span>
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectTab('lessons')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                activeTab === 'lessons'
                  ? 'bg-blue-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 font-medium'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Thư viện Bài Học</span>
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                activeTab === 'analytics'
                  ? 'bg-blue-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 font-medium'
              }`}
              title={
                todayTotalSlots === 0
                  ? 'Hôm nay không có tiết học'
                  : todayPendingCount > 0
                  ? `Hôm nay còn ${todayPendingCount} môn chưa hoàn thành`
                  : 'Hôm nay đã hoàn thành tất cả các môn'
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tiến Độ Đã Học</span>
              {todayTotalSlots > 0 && (
                todayPendingCount > 0 ? (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'analytics'
                      ? 'bg-amber-300 text-amber-950 font-black'
                      : 'bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-700'
                  }`}>
                    {todayPendingCount}
                  </span>
                ) : (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'analytics'
                      ? 'bg-emerald-300 text-emerald-950 font-black'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-700'
                  }`}>
                    ✓
                  </span>
                )
              )}
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectTab('knowledge_summary')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                activeTab === 'knowledge_summary'
                  ? 'bg-blue-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 font-medium'
              }`}
              title="Tổng hợp kiến thức cuối kỳ và xuất file HTML ôn tập độc lập"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tổng Hợp Kiến Thức</span>
            </button>
          </nav>
        )}

        {/* Right: Switch Profile & Parent Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onImportData && (
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
          )}

          {/* Guest Mode Cloud Sync Pill */}
          {isGuestMode && onOpenCloudSync && currentRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 group"
              title="Dữ liệu đang lưu tạm trên máy này. Bấm để đồng bộ lưu vĩnh viễn lên Google!"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="hidden sm:inline font-bold">Khách</span>
              <span className="text-[11px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                ☁️ Lưu Google
              </span>
            </button>
          )}

          {/* Cloud Manual Sync Button */}
          {onManualSync && family.familyCode && (
            <button
              type="button"
              onClick={async () => {
                const res = await onManualSync();
                if (res !== false) {
                  setSyncSuccessBadge(true);
                  setTimeout(() => setSyncSuccessBadge(false), 3000);
                }
              }}
              disabled={isCloudSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                syncSuccessBadge
                  ? 'bg-emerald-600 text-white border border-emerald-700'
                  : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
              title="Đồng bộ toàn bộ Thời khóa biểu & Dữ liệu của con lên đám mây Firebase ngay lập tức"
            >
              {isCloudSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              ) : syncSuccessBadge ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              )}
              <span className="hidden sm:inline">
                {isCloudSyncing ? 'Đang lưu...' : syncSuccessBadge ? 'Đã lưu xong!' : 'Đồng bộ đám mây'}
              </span>
            </button>
          )}

          {/* PARENT ROLE: Unified 'Tài Khoản' Button + 50% Screen Lightbox */}
          {currentRole === 'admin' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileModalTab('overview');
                  setIsProfileMenuOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-800 border border-blue-200 text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="Quản lý Tài Khoản Gia Đình"
              >
                <span className="text-sm select-none">👤</span>
                <span>Tài Khoản</span>
                <ChevronDown className={`w-3.5 h-3.5 text-blue-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Unified Family Modal rendered for Header */}
          <UnifiedFamilyModal
            isOpen={isProfileMenuOpen}
            onClose={() => setIsProfileMenuOpen(false)}
            defaultTab={profileModalTab}
            family={family}
            onUpdateFamily={onUpdateFamily || (() => {})}
            onAddChild={onAddChild}
            onEditChild={onEditChild}
            onDeleteChild={onDeleteChild}
            currentRole={currentRole}
            activeChildProfile={activeChildProfile}
            onSelectChild={(child) => {
              setIsProfileMenuOpen(false);
              onSelectChild(child);
            }}
            onSelectParent={() => {
              setIsProfileMenuOpen(false);
              onSelectParent();
            }}
            onExportData={() => {
              setIsProfileMenuOpen(false);
              onExportData?.();
            }}
            onImportData={(e) => {
              setIsProfileMenuOpen(false);
              onImportData?.(e);
            }}
            onSwitchProfile={() => {
              setIsProfileMenuOpen(false);
              onSwitchProfile?.();
            }}
            onLogout={() => {
              setIsProfileMenuOpen(false);
              setShowLogoutConfirm(true);
            }}
            backupStatus={backupStatus}
            isGuestMode={isGuestMode}
            onOpenCloudSync={onOpenCloudSync}
          />

          {/* STUDENT ROLE: Zero Settings. Simply displays Child Name Badge & subtle PIN button to return to Parent */}
          {currentRole !== 'admin' && (
            <div className="flex items-center gap-2">
              {/* Active Child Profile Name Display (Read-Only) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 shrink-0">
                <span className="text-sm select-none">{activeChildProfile?.avatar || '👦'}</span>
                <span>{activeChildProfile?.name || classInfo.studentName}</span>
              </div>

              {/* Pin Switch back to Parent (Requires Family PIN Challenge) */}
              <button
                type="button"
                onClick={onSelectParent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="Quay lại góc quản lý của Phụ Huynh (Cần nhập mã PIN)"
              >
                <span>🔑</span>
                <span>Góc Phụ Huynh</span>
              </button>
            </div>
          )}

          {onOpenAboutStory && (
            <button
              type="button"
              onClick={onOpenAboutStory}
              className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800 transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95 flex items-center justify-center group"
              title="Mục đích ra đời & Lời nhắn từ tác giả 🌸"
            >
              <svg viewBox="0 0 100 100" className="w-6 h-6 group-hover:rotate-12 transition-transform">
                <path d="M50 15 C55 2, 65 2, 68 15 C71 28, 59 38, 50 38 C41 38, 29 28, 32 15 C35 2, 45 2, 50 15 Z" fill="#FF4D4D" />
                <path d="M50 85 C55 98, 65 98, 68 85 C71 72, 59 62, 50 62 C41 62, 29 72, 32 85 C35 98, 45 98, 50 85 Z" fill="#FF4D4D" />
                <path d="M15 50 C2 55, 2 65, 15 68 C28 71, 38 59, 38 50 C38 41, 28 29, 15 32 C2 35, 2 45, 15 50 Z" fill="#FF4D4D" />
                <path d="M85 50 C98 55, 98 65, 85 68 C72 71, 62 59, 62 50 C62 41, 72 29, 85 32 C98 35, 98 45, 85 50 Z" fill="#FF4D4D" />
                <path d="M25 25 C15 15, 23 5, 34 16 C42 24, 38 36, 29 38 C23 39, 17 33, 25 25 Z" fill="#FF5E3A" />
                <path d="M75 25 C85 15, 77 5, 66 16 C58 24, 62 36, 71 38 C77 39, 83 33, 75 25 Z" fill="#FF5E3A" />
                <path d="M25 75 C15 85, 23 95, 34 84 C42 76, 38 64, 29 62 C23 61, 17 67, 25 75 Z" fill="#FF5E3A" />
                <path d="M75 75 C85 85, 77 95, 66 84 C58 76, 62 64, 71 62 C77 61, 83 67, 75 75 Z" fill="#FF5E3A" />
                <circle cx="50" cy="50" r="22" fill="#FFC72C" stroke="#E69500" strokeWidth="2" />
                <ellipse cx="42" cy="45" rx="3" ry="4" fill="#222" />
                <ellipse cx="58" cy="45" rx="3" ry="4" fill="#222" />
                <circle cx="43" cy="44" r="1" fill="#FFF" />
                <circle cx="59" cy="44" r="1" fill="#FFF" />
                <ellipse cx="37" cy="51" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.8" />
                <ellipse cx="63" cy="51" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.8" />
                <path d="M42 52 Q50 60 58 52" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}

        </div>
      </div>

      {/* Subbar: Week selector & Breadcrumbs on bottom edge */}
      <div className="w-[96%] sm:w-[94%] mx-auto px-2 sm:px-4 py-1.5 bg-slate-50/80 dark:bg-[#121824] flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Tuần từ ngày:</span>
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shadow-2xs">
              <button
                type="button"
                onClick={onPrevWeek}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs px-1.5">
                {formatDisplayDate(classInfo.weekStartDate)}
              </span>
              <button
                type="button"
                onClick={onNextWeek}
                className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Tuần sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nút "Ngày hôm nay" */}
          {onResetWeek && (
            <button
              type="button"
              onClick={onResetWeek}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                isCurrentWeek
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100/70'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-300'
              }`}
              title="Quay về tuần chứa ngày hôm nay"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ngày hôm nay</span>
              {isCurrentWeek ? (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" title="Đang xem tuần này" />
              ) : null}
            </button>
          )}

          {/* Nút / Badge Đồng hồ kỹ thuật số thời gian thực đồng bộ nền trắng */}
          <div
            className="px-2.5 py-1 rounded-md text-xs font-mono tracking-wider font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs select-none"
            title={`Thời gian thực: ${timeParts.displayDate} - ${timeParts.formattedTime}`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="tabular-nums font-bold">{timeParts.formattedTime}</span>
          </div>
        </div>

        {/* Simplified Breadcrumbs on Header Bottom Edge */}
        {breadcrumbElement && (
          <div className="flex items-center">
            {breadcrumbElement}
          </div>
        )}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center text-xl mx-auto font-bold">
              🚪
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Xác Nhận Đăng Xuất?
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Gia đình học tập không?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setIsProfileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
