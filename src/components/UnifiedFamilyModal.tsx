import React, { useState } from 'react';
import { 
  X, 
  User, 
  Download, 
  Upload, 
  LogOut, 
  ShieldCheck, 
  KeyRound, 
  Pencil, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff, 
  Copy, 
  Link as LinkIcon, 
  QrCode, 
  Maximize2, 
  RefreshCw,
  HelpCircle,
  Sparkles,
  Users,
  Lock,
  Smartphone
} from 'lucide-react';
import { ChildProfile, FamilyAccount, UserRole } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export type FamilyModalTab = 'overview' | 'qr_cards' | 'parent_dashboard';

interface UnifiedFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: FamilyModalTab;
  family: FamilyAccount;
  onUpdateFamily: (updated: FamilyAccount) => void;
  currentRole: UserRole;
  activeChildProfile: ChildProfile | null;
  onSelectChild: (child: ChildProfile) => void;
  onSelectParent: () => void;
  onSwitchActiveChild?: (child: ChildProfile) => void;
  onDeleteChild?: (childId: string) => void;
  onEditChild?: (child: ChildProfile) => void;
  onAddChild?: (child: ChildProfile) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSwitchProfile?: () => void;
  onLogout?: () => void;
  backupStatus?: {
    status: 'fresh' | 'pending' | 'warning';
    daysSinceLastBackup: number;
    unsavedCount: number;
    lastBackupDateStr: string;
  };
  isGuestMode?: boolean;
  onOpenCloudSync?: () => void;
  onExitParentMode?: () => void;
}

const AVAILABLE_AVATARS = ['🚀', '🐱', '🦁', '🦊', '🐼', '🐬', '🦄', '⭐', '⚽', '🎮', '🎨', '📚'];

const GRADE_PRESETS = [
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 
  'Lớp 10', 'Lớp 11', 'Lớp 12', 
  'Sinh viên Năm 1', 'Sinh viên', 'Đại học'
];

const DEFAULT_SECURITY_QUESTIONS = [
  'Năm sinh của Mẹ (hoặc Bố)?',
  'Tên trường tiểu học đầu tiên của con?',
  'Tên thú cưng hoặc con vật yêu thích của gia đình?',
  'Món ăn yêu thích nhất của gia đình vào cuối tuần?',
  'Biệt danh thuở nhỏ của con?',
  'Thành phố hoặc quê hương nơi gia đình từng đi du lịch cùng nhau?'
];

export const UnifiedFamilyModal: React.FC<UnifiedFamilyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'overview',
  family,
  onUpdateFamily,
  currentRole,
  activeChildProfile,
  onSelectChild,
  onSelectParent,
  onSwitchActiveChild,
  onDeleteChild,
  onEditChild,
  onAddChild,
  onExportData,
  onImportData,
  onSwitchProfile,
  onLogout,
  backupStatus,
  isGuestMode,
  onOpenCloudSync,
  onExitParentMode,
}) => {
  const [activeTab, setActiveTab] = useState<FamilyModalTab>(defaultTab);

  // Sync tab if defaultTab changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Tab 2 (QR Cards) state
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [zoomChildId, setZoomChildId] = useState<string | null>(null);

  // Tab 3 (Parent Dashboard) state
  const [parentName, setParentName] = useState(family.parentName || 'Bố Mẹ');
  const [parentPin, setParentPin] = useState(family.parentPin || '');
  const [familyCode, setFamilyCode] = useState(family.familyCode || '');
  const [securityQuestion, setSecurityQuestion] = useState(
    family.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState(family.securityAnswer || '');
  const [showPassword, setShowPassword] = useState(false);
  const [settingMsg, setSettingMsg] = useState('');
  const [settingError, setSettingError] = useState('');

  // Parent PIN Verification state for Tab 3 (if currentRole !== 'admin')
  const [inputPin, setInputPin] = useState('');
  const [pinAuthError, setPinAuthError] = useState('');
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(currentRole === 'admin');

  // Forgot PIN state inside Tab 3
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessPin, setForgotSuccessPin] = useState('');

  // Edit / Add Child state
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editAvatar, setEditAvatar] = useState('🚀');
  const [editError, setEditError] = useState('');

  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('Lớp 7');
  const [newAvatar, setNewAvatar] = useState('🦊');
  const [addError, setAddError] = useState('');

  const [deletingChild, setDeletingChild] = useState<ChildProfile | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeFamilyCode = family.familyCode || 'GD8899';

  // Copy helper for QR link
  const getChildLink = (childId: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('family', activeFamilyCode);
    url.searchParams.set('child', childId);
    return url.toString();
  };

  const handleCopyAllLinks = () => {
    let text = `🌟 ĐƯỜNG LINK ĐĂNG NHẬP HỌC TẬP GIA ĐÌNH 🌟\n`;
    text += `🏠 Gia đình: ${family.parentName}\n`;
    text += `🔑 Mã Gia Đình: ${activeFamilyCode}\n\n`;
    text += `📚 ĐƯỜNG LINK ĐĂNG NHẬP CỦA CÁC CON:\n`;
    family.children.forEach((c, idx) => {
      text += `${idx + 1}. ${c.avatar || '👦'} ${c.name} (${c.className || `Lớp ${c.grade}`}):\n👉 Link đăng nhập: ${getChildLink(c.id)}\n\n`;
    });
    text += `💡 Hướng dẫn: Con chỉ cần nhấp vào đường link tương ứng là đăng nhập vào học bài ngay lập tức!`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingleLink = (childId: string) => {
    navigator.clipboard.writeText(getChildLink(childId));
    setCopiedChildId(childId);
    setTimeout(() => setCopiedChildId(null), 2500);
  };

  // Generate random 6-8 char code
  const handleGenerateFamilyCode = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setFamilyCode(String(num));
  };

  // Save parent info
  const handleSaveParentInfo = () => {
    setSettingError('');
    if (!parentName.trim()) {
      setSettingError('Vui lòng nhập tên hiển thị phụ huynh!');
      return;
    }
    if (!parentPin || parentPin.length < 4 || parentPin.length > 8) {
      setSettingError('Mật khẩu PIN phải từ 4 đến 8 ký tự!');
      return;
    }
    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 6 || cleanCode.length > 8) {
      setSettingError('Mã gia đình phải từ 6 đến 8 ký tự!');
      return;
    }

    const updated: FamilyAccount = {
      ...family,
      parentName: parentName.trim(),
      parentPin: parentPin.trim(),
      familyCode: cleanCode,
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
    };
    onUpdateFamily(updated);
    setSettingMsg('Đã lưu cài đặt Phụ Huynh & Mã gia đình thành công!');
    setTimeout(() => setSettingMsg(''), 3000);
  };

  // Verify PIN for Tab 3
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinAuthError('');
    if (inputPin.trim() === family.parentPin) {
      setIsPinAuthenticated(true);
      onSelectParent();
    } else {
      setPinAuthError('Mật khẩu PIN chưa chính xác!');
    }
  };

  // Recover PIN via Security Question
  const handleRecoverPin = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotAnswer.trim()) {
      setForgotError('Vui lòng nhập câu trả lời bí mật!');
      return;
    }
    if (forgotAnswer.trim().toLowerCase() === (family.securityAnswer || '').trim().toLowerCase()) {
      setForgotSuccessPin(family.parentPin);
    } else {
      setForgotError('Câu trả lời bí mật chưa chính xác!');
    }
  };

  const zoomedChild = family.children.find(c => c.id === zoomChildId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-5 animate-in fade-in duration-200">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onImportData} 
        accept=".json" 
        className="hidden" 
      />

      {/* Main Unified Modal: Minimalist iOS 18 design */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-3xl h-[780px] max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 text-slate-900">
        
        {/* Header - Minimalist, clear */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl shadow-sm border border-slate-100">
              🏠
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                Tài Khoản Gia Đình
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Gia đình: <span className="font-semibold text-slate-700">{family.parentName || 'Bố Mẹ'}</span> • Mã: <span className="font-mono font-medium text-slate-600">{activeFamilyCode}</span>
              </p>
            </div>
          </div>

          {/* 3-Tab Selector Bar - iOS Segmented Control style */}
          <div className="flex items-center gap-1 mt-6 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tổng Quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr_cards')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'qr_cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Thẻ Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parent_dashboard')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'parent_dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quản Lý
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-left">

          {/* ==================== TAB 1: TỔNG QUAN & THÀNH VIÊN ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Member Cards Grid */}
              <div className="space-y-2.5">
                <div className="pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    👥 Thành Viên Trong Gia Đình
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {1 + family.children.length} tài khoản
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Parent Card */}
                  <div
                    onClick={() => {
                      if (currentRole !== 'admin') {
                        onSelectParent();
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all select-none relative ${
                      currentRole === 'admin'
                        ? 'border-slate-800 bg-sky-200 text-slate-900'
                        : 'border-slate-300 bg-white hover:border-slate-800 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${currentRole === 'admin' ? 'bg-white border-slate-800 text-slate-800' : 'bg-slate-50 border-slate-300 text-slate-800'} shrink-0`}>
                      🔑
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold truncate text-slate-900">
                        {family.parentName || "Bố Mẹ"}
                      </div>
                      <div className="text-[10px] text-slate-700 font-bold mt-0.5">
                        Phụ huynh (Quản lý)
                      </div>
                    </div>
                    {currentRole === 'admin' && (
                      <span className="text-[10px] text-slate-900 font-black bg-white border-2 border-slate-800 px-2 py-0.5 rounded-full">
                        Hiện tại
                      </span>
                    )}
                  </div>

                  {/* Children Cards */}
                  {family.children.map((child) => {
                    const isActive = currentRole === 'student' && activeChildProfile?.id === child.id;
                    return (
                      <div
                        key={child.id}
                        onClick={() => {
                          if (!isActive) {
                            onSelectChild(child);
                            onClose();
                          }
                        }}
                        className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all select-none relative ${
                          isActive
                            ? 'border-slate-800 bg-emerald-300 text-slate-900'
                            : 'border-slate-300 bg-white hover:border-slate-800 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${isActive ? 'bg-white border-slate-800 text-slate-800' : 'bg-slate-50 border-slate-300 text-slate-800'} shrink-0`}>
                          {child.avatar || '🚀'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-extrabold truncate text-slate-900">
                            {child.name}
                          </div>
                          <div className="text-[10px] text-slate-700 font-bold mt-0.5">
                            {child.className || `Lớp ${child.grade}`}
                          </div>
                        </div>
                        {isActive && (
                          <span className="text-[10px] text-slate-900 font-black bg-white border-2 border-slate-800 px-2 py-0.5 rounded-full">
                            Hiện tại
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Backup & Restore Block */}
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between font-bold border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Sao lưu dữ liệu:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    backupStatus?.status === 'warning'
                      ? 'bg-red-50 text-red-600 border-2 border-red-100'
                      : backupStatus?.status === 'pending'
                      ? 'bg-amber-50 text-amber-600 border-2 border-amber-100'
                      : 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100'
                  }`}>
                    {backupStatus?.status === 'warning'
                      ? '⚠️ CẦN TẢI FILE'
                      : backupStatus?.status === 'pending'
                      ? '💡 CÓ MỤC MỚI'
                      : '✓ ĐÃ AN TOÀN'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                  <span>Lần tải file gần nhất:</span>
                  <span className="font-extrabold text-slate-700">
                    {backupStatus?.lastBackupDateStr || 'Chưa sao lưu'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onExportData();
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Sao Lưu (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Khôi Phục từ file</span>
                  </button>
                </div>
              </div>

              {/* Guest Sync Option */}
              {isGuestMode && onOpenCloudSync && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-200 text-left">
                  <span className="text-xs font-bold text-amber-900 block">🎮 Đang dùng Chế độ Khách</span>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Đồng bộ lên tài khoản Google để bảo vệ thời khóa biểu vĩnh viễn trên đám mây.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCloudSync();
                    }}
                    className="mt-2.5 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>☁️ Lưu Google Drive</span>
                  </button>
                </div>
              )}

              {/* Footer Quick Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs font-bold">
                {onSwitchProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchProfile();
                    }}
                    className="py-1.5 px-3 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đổi Máy Khác</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng Xuất</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ==================== TAB 2: THẺ ĐĂNG NHẬP CON ==================== */}
          {activeTab === 'qr_cards' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Family Code Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">🔑 Mã gia đình:</span>
                  <span className="font-mono font-black text-slate-800 text-sm sm:text-base tracking-wider select-all">
                    {activeFamilyCode}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-600 bg-white border-2 border-slate-200 px-2.5 py-0.5 rounded-lg">
                  Gia đình: <span className="font-black">{family.parentName}</span>
                </div>
              </div>

              <div className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span>Mã QR &amp; Link Đăng Nhập Của Các Con</span>
              </div>

              {/* Children List with QR & Links */}
              <div className="space-y-3">
                {family.children.map((child) => {
                  const childLink = getChildLink(child.id);
                  const isCopied = copiedChildId === child.id;

                  return (
                    <div 
                      key={child.id}
                      className="p-3.5 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      {/* Left: Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-slate-200">
                          {child.avatar || '👦'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <span>{child.name}</span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border-2 border-slate-200">
                              {child.className || `Lớp ${child.grade}`}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Quét QR hoặc bấm "Chép Link" gửi Zalo cho con
                          </p>
                        </div>
                      </div>

                      {/* Right: QR Preview + Copy Link Button */}
                      <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {/* QR Code 76x76 with Zoom trigger */}
                        <div 
                          onClick={() => setZoomChildId(child.id)}
                          className="flex flex-col items-center cursor-pointer group bg-slate-50 p-1.5 rounded-xl border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                          title="Bấm để phóng to mã QR"
                        >
                          <div className="bg-white p-1 rounded-lg border-2 border-slate-200">
                            <QRCodeSVG value={childLink} size={64} />
                          </div>
                          <span className="text-[9px] font-black text-slate-500 mt-1 flex items-center gap-0.5 group-hover:text-blue-600">
                            <Maximize2 className="w-2.5 h-2.5" /> Phóng to
                          </span>
                        </div>

                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopySingleLink(child.id)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Chép Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Instructions Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs text-slate-600 space-y-1.5">
                <span className="font-extrabold text-slate-800 block">💡 Hướng dẫn cho con đăng nhập:</span>
                <p>1. Bố mẹ bấm <b>"Chép Link"</b> gửi qua Zalo/Messenger cho con.</p>
                <p>2. Hoặc con mở camera điện thoại quét trực tiếp <b>Mã QR</b> ở trên.</p>
                <p>3. Con nhấp link hoặc quét QR là hệ thống tự <b>vào thẳng góc học tập</b> vĩnh viễn!</p>
              </div>

              {/* Copy All Button */}
              <button
                type="button"
                onClick={handleCopyAllLinks}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  copiedAll
                    ? 'bg-emerald-500 text-white border-2 border-emerald-600'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200'
                }`}
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ĐÃ SAO CHÉP TOÀN BỘ DANH SÁCH LINK!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép toàn bộ danh sách link gửi con</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* ==================== TAB 3: QUẢN LÝ PHỤ HUYNH ==================== */}
          {activeTab === 'parent_dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Case 1: Need PIN verification first */}
              {!isPinAuthenticated ? (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center text-xl shrink-0">
                      🔐
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm sm:text-base">
                        Xác Thực Mật Khẩu Phụ Huynh
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Vui lòng nhập mật khẩu PIN (4-8 số) để quản lý hồ sơ gia đình
                      </p>
                    </div>
                  </div>

                  {!showForgotPin ? (
                    <form onSubmit={handleVerifyPin} className="space-y-3 pt-1">
                      {pinAuthError && (
                        <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>{pinAuthError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mật khẩu Phụ huynh:
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={8}
                          placeholder="VD: 123456"
                          value={inputPin}
                          onChange={(e) => setInputPin(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 focus:border-slate-500 font-mono text-center text-sm font-bold tracking-widest bg-white outline-hidden transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPin(true)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                        >
                          Quên mật khẩu?
                        </button>

                        <button
                          type="submit"
                          className="py-2.5 px-5 bg-blue-500 border-2 border-black hover:bg-blue-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                        >
                          XÁC THỰC ĐĂNG NHẬP 🚀
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Forgot PIN Form */
                    <form onSubmit={handleRecoverPin} className="space-y-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border-2 border-slate-200 text-xs space-y-2">
                        <span className="font-extrabold text-slate-700 block">❓ Câu hỏi bảo mật của bạn:</span>
                        <p className="font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border-2 border-slate-100">
                          {family.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]}
                        </p>
                      </div>

                      {forgotError && (
                        <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold">
                          {forgotError}
                        </div>
                      )}

                      {forgotSuccessPin ? (
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold space-y-1">
                          <div>✓ Mật khẩu PIN của bạn là: <span className="font-mono text-sm text-emerald-950 font-black">{forgotSuccessPin}</span></div>
                          <button
                            type="button"
                            onClick={() => {
                              setInputPin(forgotSuccessPin);
                              setShowForgotPin(false);
                            }}
                            className="text-blue-700 underline font-black block mt-1 cursor-pointer"
                          >
                            Bấm vào đây để tự động điền &amp; đăng nhập
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Câu trả lời bí mật:
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Nhập câu trả lời bí mật..."
                              value={forgotAnswer}
                              onChange={(e) => setForgotAnswer(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 focus:border-slate-500 text-xs font-bold bg-white outline-hidden transition-colors"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowForgotPin(false)}
                              className="flex-1 py-2 rounded-xl border-2 border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                            >
                              Quay lại
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2 rounded-xl bg-blue-500 border-2 border-black hover:bg-blue-600 text-white text-xs font-black"
                            >
                              XÁC NHẬN KHÔI PHỤC
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                /* Case 2: PIN Authenticated -> Full Parent Management Dashboard */
                <div className="space-y-5">
                  
                  {settingMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{settingMsg}</span>
                    </div>
                  )}

                  {/* Block 1: Children Profiles Management */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span>👦</span> Hồ sơ các con ({family.children.length} bé)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingChild(true)}
                        className="py-1.5 px-3 bg-blue-500 border-2 border-black hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm con</span>
                      </button>
                    </div>

                    {/* Children Items */}
                    <div className="space-y-2">
                      {family.children.map((child) => (
                        <div
                          key={child.id}
                          className="p-3 rounded-xl bg-white border-2 border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{child.avatar || '👦'}</span>
                            <div>
                              <span className="font-extrabold text-slate-900 block">{child.name}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{child.className || `Lớp ${child.grade}`}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChild(child);
                                setEditName(child.name);
                                setEditGrade(child.className || `Lớp ${child.grade}`);
                                setEditAvatar(child.avatar || '🚀');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa thông tin"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingChild(child)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa bé"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectChild(child);
                                onClose();
                              }}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] transition-all cursor-pointer"
                            >
                              Vào học 🚀
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inline Form Add Child */}
                    {isAddingChild && (
                      <div className="p-3 bg-blue-50/70 border-2 border-blue-200 rounded-xl space-y-3 pt-2 text-xs">
                        <span className="font-black text-blue-900 block">➕ Thêm con mới vào gia đình:</span>
                        {addError && <div className="text-red-600 font-bold">{addError}</div>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Tên con..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border-2 border-slate-300 font-bold bg-white"
                          />
                          <select
                            value={newGrade}
                            onChange={(e) => setNewGrade(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border-2 border-slate-300 font-bold bg-white"
                          >
                            {GRADE_PRESETS.map(gr => <option key={gr} value={gr}>{gr}</option>)}
                          </select>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          {AVAILABLE_AVATARS.map(av => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setNewAvatar(av)}
                              className={`p-1 rounded-lg text-base ${newAvatar === av ? 'bg-white border-2 border-blue-500' : ''}`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingChild(false)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddError('');
                              if (!newName.trim()) {
                                setAddError('Vui lòng điền tên con!');
                                return;
                              }
                              const newChildProfile: ChildProfile = {
                                id: 'child_' + Date.now().toString(),
                                name: newName.trim(),
                                grade: newGrade,
                                className: newGrade,
                                avatar: newAvatar,
                                studentCode: newName.trim().slice(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90),
                              };
                              onAddChild?.(newChildProfile);
                              const updatedChildren = [...family.children, newChildProfile];
                              onUpdateFamily({ ...family, children: updatedChildren });
                              setNewName('');
                              setIsAddingChild(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-black"
                          >
                            Thêm Ngay
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Form Edit Child */}
                    {editingChild && (
                      <div className="p-3 bg-amber-50/70 border-2 border-amber-200 rounded-xl space-y-3 pt-2 text-xs">
                        <span className="font-black text-amber-900 block">✏️ Chỉnh sửa hồ sơ của {editingChild.name}:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border-2 border-slate-300 font-bold bg-white"
                          />
                          <select
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border-2 border-slate-300 font-bold bg-white"
                          >
                            {GRADE_PRESETS.map(gr => <option key={gr} value={gr}>{gr}</option>)}
                          </select>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          {AVAILABLE_AVATARS.map(av => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setEditAvatar(av)}
                              className={`p-1 rounded-lg text-base ${editAvatar === av ? 'bg-white border-2 border-amber-500' : ''}`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingChild(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!editName.trim()) return;
                              const updatedChild: ChildProfile = {
                                ...editingChild,
                                name: editName.trim(),
                                grade: editGrade,
                                className: editGrade,
                                avatar: editAvatar,
                              };
                              onEditChild?.(updatedChild);
                              const updatedChildren = family.children.map(c => c.id === updatedChild.id ? updatedChild : c);
                              onUpdateFamily({ ...family, children: updatedChildren });
                              setEditingChild(null);
                            }}
                            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-black"
                          >
                            Lưu Lại
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete Child Confirm Modal */}
                    {deletingChild && (
                      <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl space-y-2 text-xs">
                        <span className="font-extrabold text-red-800 block">⚠️ Bạn có chắc muốn xóa hồ sơ của bé {deletingChild.name}?</span>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setDeletingChild(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold"
                          >
                            Không
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteChild?.(deletingChild.id);
                              const updatedChildren = family.children.filter(c => c.id !== deletingChild.id);
                              onUpdateFamily({ ...family, children: updatedChildren });
                              setDeletingChild(null);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg font-black"
                          >
                            Xóa Ngay
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Block 2: Parent Name, PIN & Family Code Settings */}
                  <div className="space-y-3.5 bg-blue-50/40 p-4 rounded-2xl border-2 border-blue-100 text-xs">
                    <div className="text-xs font-black text-blue-900 uppercase tracking-wider border-b border-blue-100 pb-2 flex items-center justify-between">
                      <span>🔑 Cài đặt Phụ Huynh &amp; Mật khẩu</span>
                      {settingError && <span className="text-red-600 font-bold text-[11px]">{settingError}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tên hiển thị Phụ huynh:
                        </label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 font-bold bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Mật khẩu PIN (4-8 ký tự):
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={parentPin}
                            onChange={(e) => setParentPin(e.target.value)}
                            className="w-full px-3 py-2 pr-9 rounded-xl border-2 border-slate-300 font-mono font-bold tracking-widest bg-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Mã Gia Đình (6-8 ký tự):
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            value={familyCode}
                            onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-300 font-mono font-black text-blue-900 bg-white text-xs tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateFamilyCode}
                            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 rounded-xl font-bold text-[10px] cursor-pointer"
                          >
                            Tạo mới
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Câu hỏi khôi phục:
                        </label>
                        <select
                          value={securityQuestion}
                          onChange={(e) => setSecurityQuestion(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border-2 border-slate-300 font-medium bg-white text-xs"
                        >
                          {DEFAULT_SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Câu trả lời bí mật:
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời bí mật..."
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 font-bold bg-white text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveParentInfo}
                      className="w-full py-2.5 bg-blue-500 border-2 border-black hover:bg-blue-600 text-white rounded-xl font-black text-xs transition-all cursor-pointer"
                    >
                      LƯU CÀI ĐẶT PHỤ HUYNH
                    </button>
                  </div>

                  {/* Block 3: Exit Parent Mode */}
                  {onExitParentMode && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onExitParentMode();
                          onClose();
                        }}
                        className="w-full py-2.5 px-4 bg-rose-400 border-2 border-black hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Thoát chế độ Phụ Huynh (Chuyển sang góc học sinh)</span>
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* ==================== ZOOM QR LIGHTBOX OVERLAY ==================== */}
      {zoomedChild && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomChildId(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-blue-100 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomChildId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                {zoomedChild.avatar || '👦'}
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {zoomedChild.name}
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border-2 border-blue-100">
                  {zoomedChild.className || `Lớp ${zoomedChild.grade}`}
                </span>
              </div>
            </div>

            {/* Giant QR Code */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200">
              <QRCodeSVG value={getChildLink(zoomedChild.id)} size={220} />
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Con cầm điện thoại / iPad đứng từ xa quét mã QR này để vào học ngay lập tức!
            </p>

            <button
              type="button"
              onClick={() => setZoomChildId(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              Đóng hộp phóng to
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
