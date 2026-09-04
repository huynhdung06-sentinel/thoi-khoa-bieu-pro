import React, { useRef, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  RotateCcw,
  GraduationCap,
  BookOpen,
  Eye,
  Edit3,
  Download,
  Upload,
  Palette,
  Check,
  Sparkles
} from 'lucide-react';
import { ViewMode } from '../types';
import { formatVietnameseHeaderDate } from '../utils/dateUtils';

export const LIGHT_MODE_COLORS = [
  { id: 'do', hex: '#C0392B', label: 'Đỏ' },
  { id: 'xanh_duong', hex: '#2980B9', label: 'Xanh Dương' },
  { id: 'xanh_la', hex: '#27AE60', label: 'Xanh Lá' },
  { id: 'cam', hex: '#E67E22', label: 'Cam' },
  { id: 'tim', hex: '#8E44AD', label: 'Tím' },
  { id: 'xanh_ngoc', hex: '#16A085', label: 'Xanh Ngọc' },
  { id: 'xam', hex: '#34495E', label: 'Xám' },
];

interface HeaderNavbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onGoToToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  lightColor: string;
  setLightColor: (color: string) => void;
  onOpenSubjectsSitemap: () => void;
  onOpenAutoModal: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  appMode: 'viewer' | 'editor';
  setAppMode: (mode: 'viewer' | 'editor') => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentDate,
  viewMode,
  setViewMode,
  onGoToToday,
  onPrev,
  onNext,
  searchQuery,
  setSearchQuery,
  isDarkMode,
  setIsDarkMode,
  lightColor,
  setLightColor,
  onOpenSubjectsSitemap,
  onOpenAutoModal,
  onResetData,
  onExportData,
  onImportData,
  appMode,
  setAppMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
      // Reset input value so same file can be imported again if needed
      e.target.value = '';
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#1E272C]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#2C3531] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-start gap-3 md:gap-6">
          
          {/* Top Brand & Title Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-lg dark:bg-blue-600 text-white flex items-center justify-center shadow-xs transition-colors"
                style={{ backgroundColor: isDarkMode ? undefined : lightColor }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 
                    className="text-lg font-bold dark:text-white tracking-tight transition-colors"
                    style={{ color: isDarkMode ? undefined : lightColor }}
                  >
                    Thời Khóa Biểu
                  </h1>
                </div>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              {/* Theme Color Picker Popover Mobile */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="p-1.5 rounded-lg border border-[#d2d2d7] dark:border-[#2d323f] bg-[#f5f5f7] dark:bg-[#202430] text-[#1d1d1f] dark:text-white flex items-center gap-1 cursor-pointer h-7"
                  title="Chọn màu sắc Light Mode"
                >
                  <span className="text-xs">🎨</span>
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-xs" 
                    style={{ backgroundColor: lightColor }} 
                  />
                </button>

                {isColorPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                    <div 
                      className="theme-picker absolute top-9 right-0 z-50 flex items-center gap-1.5 p-2 bg-white dark:bg-[#202430] border border-[#d2d2d7] dark:border-[#2d323f] rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150"
                      role="toolbar"
                      aria-label="Chọn giao diện"
                    >
                      <span className="tp-label text-xs select-none">🎨</span>
                      {LIGHT_MODE_COLORS.map((c) => {
                        const isActive = !isDarkMode && lightColor === c.hex;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            data-theme-btn={c.id}
                            onClick={() => {
                              setIsDarkMode(false);
                              setLightColor(c.hex);
                              setIsColorPickerOpen(false);
                            }}
                            className={`tp-dot tp-${c.id} w-5 h-5 rounded-full transition-all cursor-pointer relative flex items-center justify-center shrink-0 ${
                              isActive 
                                ? 'active scale-125 ring-2 ring-slate-800 dark:ring-white z-10 shadow-xs' 
                                : 'hover:scale-110 opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={`Giao diện ${c.label}`}
                            aria-label={`Giao diện ${c.label}`}
                          >
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Standalone Dark Mode Toggle Mobile */}
              <button
                type="button"
                id="tpDark"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg border border-[#d2d2d7] dark:border-[#2d323f] bg-[#f5f5f7] dark:bg-[#202430] text-[#1d1d1f] dark:text-amber-400 flex items-center justify-center cursor-pointer h-7 w-7"
                title={isDarkMode ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
                aria-label="Dark mode"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              </button>

              {/* Mode Switcher Mobile */}
              <div className="flex items-center bg-[#f5f5f7] dark:bg-[#2a2e39] p-0.5 rounded-lg border border-[#d2d2d7] dark:border-[#363a45] text-[11px] font-bold">
                <button
                   onClick={() => setAppMode('viewer')}
                   className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                     appMode === 'viewer'
                       ? 'bg-emerald-600 text-white shadow-xs'
                       : 'text-[#515154] dark:text-slate-300'
                   }`}
                   title="Chế độ Xem"
                 >
                   <Eye className="w-3 h-3" />
                   <span>Xem</span>
                 </button>
                 <button
                   onClick={() => setAppMode('editor')}
                   className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                     appMode === 'editor'
                       ? 'dark:bg-blue-600 text-white shadow-xs'
                       : 'text-[#515154] dark:text-slate-300'
                   }`}
                   style={{ backgroundColor: appMode === 'editor' && !isDarkMode ? lightColor : undefined }}
                   title="Chế độ Sửa"
                 >
                   <Edit3 className="w-3 h-3" />
                   <span>Sửa</span>
                 </button>
               </div>
  
               <button
                 onClick={onOpenAutoModal}
                 className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 text-white rounded-lg transition-colors shadow-xs cursor-pointer h-7"
                 title="Tự động nhập lịch học (Auto)"
               >
                 <Sparkles className="w-3.5 h-3.5" />
                 <span>Auto</span>
               </button>

               <button
                 onClick={onOpenSubjectsSitemap}
                 className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer h-7"
                 style={{ backgroundColor: isDarkMode ? undefined : lightColor }}
                 title="Xem sitemap các môn học & link học"
               >
                 <BookOpen className="w-3.5 h-3.5" />
                 <span>Môn học</span>
               </button>
             </div>
           </div>
 
          {/* Center: TradingView Style Controls (Hôm nay, Navigation, Date Range Display) */}
          <div className="flex flex-col items-start gap-2 py-1.5 border-y md:border-y-0 border-[#d2d2d7] dark:border-[#2a2e39]/40 w-full md:w-auto">
            {/* Top Row: Navigation and Date Display */}
            <div className="flex items-center justify-start gap-2.5 w-full md:w-auto">
              {/* Unified Navigation Group: [ Prev | Hôm nay | Next ] - Keep perfectly fixed in size */}
              <div className="flex items-center bg-[#f5f5f7] dark:bg-[#202430] p-0.5 rounded-xl border border-[#d2d2d7] dark:border-[#2d323f] h-9 shadow-2xs shrink-0 w-[144px]">
                <button
                  onClick={onPrev}
                  className="w-8 h-7 flex items-center justify-center rounded-lg text-[#ff3b30] dark:text-slate-400 hover:bg-white dark:hover:bg-[#2d323f] transition-all cursor-pointer shrink-0"
                  style={{ color: isDarkMode ? undefined : lightColor }}
                  title="Thời gian trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onGoToToday}
                  className="flex-1 h-7 text-xs font-bold dark:text-slate-200 hover:bg-white dark:hover:bg-[#2d323f] rounded-lg transition-all cursor-pointer shrink-0 text-center"
                  style={{ color: isDarkMode ? undefined : lightColor }}
                  title="Quay về hôm nay"
                >
                  Hôm nay
                </button>
                <button
                  onClick={onNext}
                  className="w-8 h-7 flex items-center justify-center rounded-lg text-[#ff3b30] dark:text-slate-400 hover:bg-white dark:hover:bg-[#2d323f] transition-all cursor-pointer shrink-0"
                  style={{ color: isDarkMode ? undefined : lightColor }}
                  title="Thời gian tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Modern Date Display badge - Anchored left, grows rightwards only */}
              <div 
                className="flex items-center gap-2 text-xs sm:text-sm font-bold dark:text-blue-300 px-3.5 h-9 bg-[#f5f5f7] dark:bg-blue-950/20 rounded-xl border border-[#d2d2d7] dark:border-blue-900/30 shadow-2xs justify-start select-none shrink-0 w-auto"
                style={{ color: isDarkMode ? undefined : lightColor }}
              >
                <CalendarIcon className="w-4 h-4 dark:text-blue-400 shrink-0" style={{ color: isDarkMode ? undefined : lightColor }} />
                <span className="tracking-tight select-none whitespace-nowrap">{formatVietnameseHeaderDate(currentDate, viewMode)}</span>
              </div>
            </div>
 
            {/* Bottom Row: TradingView Pill Tabs (Ngày / Tuần / Tháng / Năm) */}
            <div className="flex items-center bg-[#f5f5f7] dark:bg-[#202430] p-0.5 rounded-xl border border-[#d2d2d7] dark:border-[#2d323f] text-xs font-bold shadow-2xs h-9 shrink-0 w-full sm:w-auto justify-start sm:justify-center">
              <button
                onClick={() => setViewMode('day')}
                className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer h-7 flex items-center justify-center ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-[#2d323f] dark:text-blue-400 shadow-3xs font-extrabold'
                    : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                }`}
                style={{ color: viewMode === 'day' && !isDarkMode ? lightColor : undefined }}
              >
                Ngày
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer h-7 flex items-center justify-center ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-[#2d323f] dark:text-blue-400 shadow-3xs font-extrabold'
                    : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                }`}
                style={{ color: viewMode === 'week' && !isDarkMode ? lightColor : undefined }}
              >
                Tuần
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer h-7 flex items-center justify-center ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-[#2d323f] dark:text-blue-400 shadow-3xs font-extrabold'
                    : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                }`}
                style={{ color: viewMode === 'month' && !isDarkMode ? lightColor : undefined }}
              >
                Tháng
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer h-7 flex items-center justify-center ${
                  viewMode === 'year'
                    ? 'bg-white dark:bg-[#2d323f] dark:text-blue-400 shadow-3xs font-extrabold'
                    : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                }`}
                style={{ color: viewMode === 'year' && !isDarkMode ? lightColor : undefined }}
              >
                Năm
              </button>
            </div>
          </div>
 
          {/* Right Toolbar: Main Action Controls */}
          <div className="flex items-center justify-end gap-2.5 mt-2 md:mt-0 shrink-0 md:ml-auto">
            {/* Hidden Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
 
            {/* Desktop-only action items */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Theme Picker Button & Popover Desktop */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="flex items-center gap-1.5 px-2.5 h-9 bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#202430] dark:hover:bg-[#2a2e39] border border-[#d2d2d7] dark:border-[#2d323f] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                  title="Chọn màu giao diện Light Mode"
                >
                  <span className="text-sm select-none">🎨</span>
                  <span 
                    className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white/60 shrink-0" 
                    style={{ backgroundColor: lightColor }} 
                  />
                </button>

                {isColorPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                    <div 
                      className="theme-picker absolute top-11 right-0 z-50 flex items-center gap-2 p-2.5 bg-white dark:bg-[#202430] border border-[#d2d2d7] dark:border-[#2d323f] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                      role="toolbar" 
                      aria-label="Chọn giao diện"
                    >
                      <span className="tp-label text-xs select-none font-bold text-slate-700 dark:text-slate-300" title="Màu Light Mode">🎨</span>
                      {LIGHT_MODE_COLORS.map((c) => {
                        const isActive = !isDarkMode && lightColor === c.hex;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            data-theme-btn={c.id}
                            onClick={() => {
                              setIsDarkMode(false);
                              setLightColor(c.hex);
                              setIsColorPickerOpen(false);
                            }}
                            className={`tp-dot tp-${c.id} w-6 h-6 rounded-full transition-all cursor-pointer relative flex items-center justify-center shrink-0 ${
                              isActive 
                                ? 'active scale-125 ring-2 ring-slate-800 dark:ring-white z-10 shadow-xs' 
                                : 'hover:scale-110 opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={`Giao diện ${c.label}`}
                            aria-label={`Giao diện ${c.label}`}
                          >
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Standalone Dark Mode Toggle Button Desktop */}
              <button
                type="button"
                id="tpDark"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl hover:bg-[#e8e8ed] dark:hover:bg-[#2a2e39] text-[#515154] dark:text-amber-400 hover:text-[#1d1d1f] dark:hover:text-amber-300 transition-colors h-9 w-9 flex items-center justify-center border border-[#d2d2d7] dark:border-[#2d323f] bg-[#f5f5f7] dark:bg-[#202430] cursor-pointer shadow-2xs"
                title={isDarkMode ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
                aria-label="Dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Export JSON Button */}
              <button
                onClick={onExportData}
                className="p-2 rounded-xl hover:bg-[#e8e8ed] dark:hover:bg-[#2a2e39] text-[#515154] dark:text-blue-400 hover:text-[#1d1d1f] dark:hover:text-blue-300 transition-colors h-9 w-9 flex items-center justify-center border border-[#d2d2d7] dark:border-[#2a2e39] cursor-pointer"
                title="Xuất dữ liệu lịch học (JSON) tải về máy"
              >
                <Download className="w-4 h-4" />
              </button>
 
              {/* Import JSON Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-[#e8e8ed] dark:hover:bg-[#2a2e39] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors h-9 w-9 flex items-center justify-center border border-[#d2d2d7] dark:border-[#2a2e39] cursor-pointer"
                title="Nhập dữ liệu lịch học từ file JSON"
              >
                <Upload className="w-4 h-4" />
              </button>
 
              <div className="flex items-center bg-[#f5f5f7] dark:bg-[#202430] p-0.5 rounded-xl border border-[#d2d2d7] dark:border-[#2d323f] text-xs font-bold h-9">
                <button
                  onClick={() => setAppMode('viewer')}
                  className={`flex items-center gap-1 px-3 h-7 rounded-lg transition-all cursor-pointer ${
                    appMode === 'viewer'
                      ? 'bg-[#34c759] text-white shadow-xs font-extrabold'
                      : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                  }`}
                  title="Chế độ Xem: Chỉ xem thông tin & mở link bài học"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem</span>
                </button>
                <button
                  onClick={() => setAppMode('editor')}
                  className={`flex items-center gap-1 px-3 h-7 rounded-lg transition-all cursor-pointer ${
                    appMode === 'editor'
                      ? 'dark:bg-blue-600 text-white shadow-xs font-extrabold'
                      : 'text-[#515154] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-slate-200'
                  }`}
                  style={{ backgroundColor: appMode === 'editor' && !isDarkMode ? lightColor : undefined }}
                  title="Chế độ Sửa: Thêm, sửa, xóa môn học & giờ học"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
              </div>
 
              {/* Auto Schedule Button */}
              <button
                onClick={onOpenAutoModal}
                className="flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 text-white rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95"
                title="Tự động nhập lịch học mới (Auto)"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nhập Lịch - Auto</span>
              </button>

              {/* Main Action: Các Môn Học */}
              <button
                onClick={onOpenSubjectsSitemap}
                className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs cursor-pointer"
                style={{ backgroundColor: isDarkMode ? undefined : lightColor }}
                title="Xem sitemap tổng quan các môn học & link trang học"
              >
                <BookOpen className="w-4 h-4" />
                <span>Các môn học</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

