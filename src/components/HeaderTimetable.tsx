import React, { useState, useEffect } from 'react';
import { UserRole, ClassInfo, DashboardTab, FamilyAccount, ChildProfile } from '../types';
import { getVietnamCurrentMondayStr, getVietnamTimeParts } from '../utils/dateUtils';
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
  ShieldCheck
} from 'lucide-react';

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
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [tempClass, setTempClass] = useState(classInfo.className);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [tempStudent, setTempStudent] = useState(classInfo.studentName || '');

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
          
          {/* LOCAL-FIRST: NÚT XUẤT SAO LƯU DỮ LIỆU */}
          {onExportData && (
            <button
              type="button"
              onClick={onExportData}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                backupStatus?.status === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                  : backupStatus?.status === 'pending'
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
              title={
                backupStatus?.status === 'warning'
                  ? `⚠️ Cần tải file sao lưu! Có ${backupStatus.unsavedCount} mục mới chưa export hoặc lâu chưa tải file.`
                  : backupStatus?.status === 'pending'
                  ? `💡 Có ${backupStatus.unsavedCount} thay đổi mới. Bấm để tải file sao lưu về máy!`
                  : `✓ Dữ liệu đã được sao lưu an toàn (${backupStatus?.lastBackupDateStr || 'Mới nhất'})`
              }
            >
              <Download className="w-3.5 h-3.5 text-current shrink-0" />
              <span className="hidden md:inline">Tải Sao Lưu</span>
              {backupStatus && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  backupStatus.status === 'warning'
                    ? 'bg-red-500 ring-2 ring-red-300'
                    : backupStatus.status === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`} />
              )}
              {backupStatus && backupStatus.unsavedCount > 0 && (
                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-1 rounded-full font-black">
                  +{backupStatus.unsavedCount}
                </span>
              )}
            </button>
          )}

          {/* LOCAL-FIRST: NÚT KHÔI PHỤC DỮ LIỆU */}
          {onImportData && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={onImportData}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Khôi phục thời khóa biểu và dữ liệu học tập từ file sao lưu .json"
              >
                <Upload className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="hidden md:inline">Khôi Phục Data</span>
              </button>
            </>
          )}

          {/* Guest Mode Cloud Sync Pill */}
          {isGuestMode && onOpenCloudSync && (
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

          {/* Unified Profile Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Nhấp để chuyển nhanh tài khoản gia đình"
            >
              <span className="text-sm select-none">
                {currentRole === 'admin' ? '🔑' : (activeChildProfile?.avatar || '🚀')}
              </span>
              <span className="font-extrabold truncate max-w-[80px] sm:max-w-[120px]">
                {currentRole === 'admin' ? (family.parentName || 'Bố Mẹ') : (activeChildProfile?.name || classInfo.studentName)}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 p-4">
                  
                  {/* Guest Notice */}
                  {isGuestMode && onOpenCloudSync && (
                    <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <span>🎮</span>
                        <span>Đang dùng Chế độ Khách</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        Thời khóa biểu đang lưu an toàn trên máy này. Bấm nút dưới để đồng bộ lên Google khi cần.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenCloudSync();
                        }}
                        className="mt-2 w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>☁️ Lưu dữ liệu lên Google</span>
                      </button>
                    </div>
                  )}

                  <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Thành viên gia đình</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5 pt-3">
                    {/* Card Phụ huynh */}
                    <div
                      onClick={() => {
                        if (currentRole !== 'admin') {
                          setIsProfileMenuOpen(false);
                          onSelectParent();
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all select-none relative ${
                        currentRole === 'admin'
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer'
                      }`}
                    >
                      {currentRole === 'admin' && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded-md">✓</span>
                      )}
                      <div className="text-2xl mb-1 select-none">🔑</div>
                      <div className="text-xs font-extrabold text-center leading-tight">
                        {family.parentName || "Bố Mẹ"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mb-1 font-medium">
                        Phụ huynh
                      </div>

                      {/* Parent-only controls (Cài đặt & Đăng xuất) */}
                      {currentRole === 'admin' && (
                        <div className="w-full space-y-1 mt-2 pt-2 border-t border-purple-200/40 dark:border-purple-800/40 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProfileMenuOpen(false);
                              onOpenSettings();
                            }}
                            className="w-full py-1 px-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-950 hover:bg-purple-200/60 border border-purple-200/50 dark:border-purple-800 rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="Mở bảng điều khiển cấu hình"
                          >
                            <Settings className="w-2.5 h-2.5" />
                            <span>Cấu hình</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLogoutConfirm(true);
                            }}
                            className="w-full py-1 px-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/40 rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <LogOut className="w-2.5 h-2.5" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cards Học Sinh */}
                    {family.children.map((child) => {
                      const isActive = currentRole === 'student' && activeChildProfile?.id === child.id;
                      return (
                        <div
                          key={child.id}
                          onClick={() => {
                            if (!isActive) {
                              setIsProfileMenuOpen(false);
                              onSelectChild(child);
                            }
                          }}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all select-none relative ${
                            isActive
                              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded-md">✓</span>
                          )}
                          <div className="text-2xl mb-1 select-none">{child.avatar || '🚀'}</div>
                          <div className="text-xs font-extrabold text-center leading-tight truncate w-full">
                            {child.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center truncate w-full">
                            {child.className || `Lớp ${child.grade}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Local-First Backup Section */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-left space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Sao lưu cục bộ (Local-First):
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                        backupStatus?.status === 'warning'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                          : backupStatus?.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}>
                        {backupStatus?.status === 'warning'
                          ? '⚠️ Cần tải backup'
                          : backupStatus?.status === 'pending'
                          ? '💡 Có mục mới'
                          : '✓ Đã an toàn'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Lần tải gần nhất:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {backupStatus?.lastBackupDateStr || 'Chưa lưu'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onExportData?.();
                        }}
                        className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Download className="w-3 h-3" />
                        <span>Tải file .json</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="py-1 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Khôi phục file</span>
                      </button>
                    </div>
                  </div>

                  {/* Switch Account or Re-login option */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1 text-center">
                    {onOpenFamilyCodeCard && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenFamilyCodeCard();
                        }}
                        className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800"
                      >
                        <span>🔑 Xem Thẻ Đăng Nhập Cho Con</span>
                      </button>
                    )}

                    {onSwitchProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSwitchProfile();
                        }}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <span>🔄 Chuyển tài khoản / Đổi máy</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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
