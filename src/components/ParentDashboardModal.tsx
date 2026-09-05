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
  Key,
  Copy,
  Link,
  QrCode,
  Dices,
  HelpCircle,
  FileJson,
  Sparkles
} from 'lucide-react';
import { ChildProfile, FamilyAccount } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface ParentDashboardModalProps {
  onClose: () => void;
  onExitParentMode: () => void;
  family: FamilyAccount;
  onUpdateFamily: (updated: FamilyAccount) => void;
  activeChildId?: string;
  onSwitchActiveChild?: (child: ChildProfile) => void;
  onDeleteChild?: (childId: string) => void;
  onEditChild?: (child: ChildProfile) => void;
  onAddChild?: (child: ChildProfile) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

export const ParentDashboardModal: React.FC<ParentDashboardModalProps> = ({ 
  onClose, 
  onExitParentMode, 
  family,
  onUpdateFamily,
  activeChildId,
  onSwitchActiveChild,
  onDeleteChild,
  onEditChild,
  onAddChild,
  onExportData,
  onImportData
}) => {
  // Parent Name, Password & Family Code editing
  const [parentName, setParentName] = useState(family.parentName || 'Bố Mẹ');
  const [parentPin, setParentPin] = useState(family.parentPin || '');
  const [familyCode, setFamilyCode] = useState(family.familyCode || '');
  const [securityQuestion, setSecurityQuestion] = useState(
    family.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState(family.securityAnswer || '');
  const [showPassword, setShowPassword] = useState(false);

  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [settingError, setSettingError] = useState('');
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [qrModalChild, setQrModalChild] = useState<ChildProfile | null>(null);

  // Editing existing child modal state
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editAvatar, setEditAvatar] = useState('🚀');
  const [editStudentCode, setEditStudentCode] = useState('');
  const [editError, setEditError] = useState('');

  // Deleting child confirm state
  const [deletingChild, setDeletingChild] = useState<ChildProfile | null>(null);

  // Add new child modal/form state
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('Lớp 7');
  const [newAvatar, setNewAvatar] = useState('🦊');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [addError, setAddError] = useState('');

  // Random Family Code Generator (6-8 chars)
  const handleGenerateFamilyCode = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setFamilyCode(String(num));
  };

  // Save parent info (Name + Password + Family Code + Security Question)
  const handleSaveParentInfo = () => {
    setSettingError('');
    if (!parentName.trim()) {
      setSettingError('Vui lòng nhập tên hiển thị cho phụ huynh!');
      return;
    }
    if (!parentPin || parentPin.length < 4 || parentPin.length > 8) {
      setSettingError('Mật khẩu phụ huynh phải từ 4 đến 8 ký tự!');
      return;
    }
    const cleanCode = familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 6 || cleanCode.length > 8) {
      setSettingError('Mã gia đình bắt buộc phải có từ 6 đến 8 ký tự chữ cái hoặc chữ số!');
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
    setPinChangeMsg('Đã lưu thành công thông tin phụ huynh, mã gia đình và mật khẩu bảo mật!');
    setTimeout(() => setPinChangeMsg(''), 3500);
  };

  // Open Edit Child
  const handleStartEditChild = (child: ChildProfile) => {
    setEditingChild(child);
    setEditName(child.name);
    setEditGrade(child.className || (child.grade ? String(child.grade) : 'Lớp 7'));
    setEditAvatar(child.avatar || '🚀');
    setEditStudentCode(child.studentCode || '');
    setEditError('');
  };

  // Save Edited Child
  const handleSaveEditedChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    if (!editName.trim()) {
      setEditError('Vui lòng nhập tên người học!');
      return;
    }
    const gradeVal = editGrade.trim() || 'Lớp học';
    const updatedChild: ChildProfile = {
      ...editingChild,
      name: editName.trim(),
      grade: gradeVal,
      className: gradeVal,
      avatar: editAvatar,
      studentCode: editStudentCode.trim().toUpperCase(),
    };

    const updatedChildren = family.children.map((c) => (c.id === editingChild.id ? updatedChild : c));
    const newFamily = { ...family, children: updatedChildren };
    onUpdateFamily(newFamily);

    if (onEditChild) {
      onEditChild(updatedChild);
    }
    setEditingChild(null);
  };

  // Confirm Delete Child
  const handleConfirmDelete = () => {
    if (!deletingChild) return;
    if (family.children.length <= 1) {
      alert('Gia đình cần có ít nhất 1 hồ sơ học sinh! Bạn có thể sửa tên/lớp của hồ sơ này thay vì xóa.');
      setDeletingChild(null);
      return;
    }
    const targetId = deletingChild.id;
    const updatedChildren = family.children.filter((c) => c.id !== targetId);
    const newFamily = { ...family, children: updatedChildren };
    onUpdateFamily(newFamily);

    if (onDeleteChild) {
      onDeleteChild(targetId);
    }
    setDeletingChild(null);
  };

  // Save New Child
  const handleSaveNewChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Vui lòng nhập tên người học!');
      return;
    }
    const gradeVal = newGrade.trim() || 'Lớp học';
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
    const studentCode = newStudentCode.trim().toUpperCase() || fallbackCode;

    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      name: newName.trim(),
      grade: gradeVal,
      className: gradeVal,
      avatar: newAvatar,
      studentCode: studentCode,
    };

    const updatedChildren = [...family.children, newChild];
    const newFamily = { ...family, children: updatedChildren };
    onUpdateFamily(newFamily);

    if (onAddChild) {
      onAddChild(newChild);
    }

    // Reset and close
    setNewName('');
    setNewGrade('Lớp 7');
    setNewAvatar('🦊');
    setNewStudentCode('');
    setAddError('');
    setIsAddingChild(false);
  };

  const formatGrade = (grade?: number | string, className?: string) => {
    const val = (className || (grade ? String(grade) : '')).trim();
    if (!val) return 'Học sinh';
    if (val.toLowerCase().startsWith('lớp') || val.toLowerCase().startsWith('sinh viên') || val.toLowerCase().startsWith('đại học')) {
      return val;
    }
    if (!isNaN(Number(val))) {
      return `Lớp ${val}`;
    }
    return val;
  };

  const handleCopyMagicLink = (child: ChildProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('family', family.familyCode || '');
    url.searchParams.set('child', child.id);
    navigator.clipboard?.writeText(url.toString());
    setCopiedLinkId(child.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const getMagicLink = (child: ChildProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('family', family.familyCode || '');
    url.searchParams.set('child', child.id);
    return url.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full md:w-[50%] md:max-w-[50%] lg:w-[48%] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              👨‍💼
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>Bảng điều khiển Phụ huynh</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Đã xác thực mã PIN
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý hồ sơ các con, phân tách ngăn lưu trữ và bảo vệ dữ liệu gia đình
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* SECTION 1: QUẢN LÝ DANH SÁCH CÁC CON / NGƯỜI HỌC */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                <User className="w-4 h-4 text-purple-600" />
                <span>Hồ sơ các con / Người học trong nhà</span>
                <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {family.children.length} hồ sơ
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingChild(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm con</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mỗi con có <strong>1 ngăn lưu trữ hoàn toàn độc lập 100%</strong> (thời khóa biểu, bài tập và sơ đồ tư duy riêng, không bao giờ lẫn lộn). Tính năng Sửa/Xóa chỉ Bố Mẹ mới có quyền thực hiện tại đây.
            </p>

            {/* List of Children */}
            <div className="space-y-2.5">
              {family.children.map((child) => {
                const isActive = activeChildId === child.id;
                const displayGrade = formatGrade(child.grade, child.className);
                return (
                  <div 
                    key={child.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                      isActive 
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/30' 
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-2xl shrink-0">
                        {child.avatar || '🎓'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {child.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                              Đang xem
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                            {displayGrade}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Ngăn dữ liệu riêng</span>
                          </span>
                          {child.studentCode && (
                            <span className="text-xs font-semibold text-slate-500">
                              Mã HS: {child.studentCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for this child */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => handleCopyMagicLink(child)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          copiedLinkId === child.id
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                        title="Sao chép link kết nối trực tiếp cho bé"
                      >
                        {copiedLinkId === child.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép link!</span>
                          </>
                        ) : (
                          <>
                            <Link className="w-3.5 h-3.5 text-blue-500" />
                            <span className="hidden sm:inline">Sao chép Link</span>
                            <span className="sm:hidden">Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModalChild(child)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Hiển thị mã QR đăng nhập nhanh"
                      >
                        <QrCode className="w-4 h-4 text-slate-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditChild(child)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingChild(child)}
                        className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-700 border border-slate-200 hover:border-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Xóa hồ sơ"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>

                      {!isActive && onSwitchActiveChild && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchActiveChild(child);
                            onClose();
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer ml-auto"
                        >
                          Vào học ➔
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Mẹo: Bấm "Sao chép Link" rồi gửi qua Zalo cho con. Con nhấp vào link là tự động vào thẳng góc học tập!
            </p>
          </section>

          {/* SECTION 2: BẢO VỆ MẬT KHẨU VÀ TÊN PHỤ HUYNH */}
          <section className="space-y-3.5 border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Cài đặt Phụ huynh & Mật khẩu bảo mật</span>
            </h4>

            {pinChangeMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinChangeMsg}</span>
              </div>
            )}

            {settingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{settingError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên hiển thị của Bố/Mẹ:
                </label>
                <input 
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ví dụ: Ba Nam / Mẹ Hương..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mật khẩu Phụ Huynh (4-8 ký tự):
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={parentPin}
                    maxLength={8}
                    onChange={(e) => setParentPin(e.target.value)}
                    placeholder="Nhập 4-8 ký tự"
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-800 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Family Code field with Random button */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Mã Gia Đình (6 - 8 ký tự):
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateFamilyCode}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Tạo mã mới</span>
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={familyCode}
                    maxLength={8}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                      setFamilyCode(clean);
                    }}
                    placeholder="VD: GD8899"
                    className="w-full px-3 py-2 pr-16 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-800 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    familyCode.length >= 6 && familyCode.length <= 8
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {familyCode.length}/8
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Con nhập mã gia đình này trên điện thoại/máy tính khác để tải thời khóa biểu dùng chung.
                </p>
              </div>

              {/* Security Question Setup */}
              <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Câu hỏi bảo mật (Dùng khi quên mật khẩu):</span>
                </div>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-hidden font-medium"
                >
                  {DEFAULT_SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nhập câu trả lời bí mật..."
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveParentInfo}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu cài đặt Phụ huynh</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 3: SAO LƯU & PHỤC HỒI DỮ LIỆU */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <Download className="w-4 h-4 text-purple-600" />
              <span>Bảo vệ Dữ liệu (Sao lưu & Phục hồi toàn bộ gia đình)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={onExportData}
                className="flex flex-col items-center justify-center gap-1.5 p-3.5 border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-2xl transition-colors text-xs font-bold cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Sao lưu toàn bộ gia đình (.json)</span>
                <span className="text-[10px] text-blue-600/80 font-normal">Tải về máy tính để lưu trữ an toàn</span>
              </button>
              
              <label className="flex flex-col items-center justify-center gap-1.5 p-3.5 border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-colors text-xs font-bold cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>Phục hồi từ file sao lưu</span>
                <span className="text-[10px] text-emerald-600/80 font-normal">Nhập lại dữ liệu khi đổi máy tính</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={onImportData} 
                  className="hidden" 
                />
              </label>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            🔒 Khóa an toàn ngăn các con tự xóa hồ sơ
          </span>
          <button 
            type="button"
            onClick={() => {
              onExitParentMode();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer ml-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát chế độ Phụ huynh</span>
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: CHỈNH SỬA HỒ SƠ CON */}
      {editingChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Pencil className="w-4 h-4 text-purple-600" />
                <span>Chỉnh sửa hồ sơ con</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingChild(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedChild} className="space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên người học</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ví dụ: Bé An, Nam, Thu Hà, Khánh..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-sm outline-hidden font-medium"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Khối lớp / Năm học / Trường</label>
                  <span className="text-[10px] text-purple-600 font-medium">Nhập tự do</span>
                </div>
                <input
                  type="text"
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  placeholder="Ví dụ: Lớp 10A1, Sinh viên Năm 2, ĐH Bách Khoa, Lớp 7..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-hidden font-medium mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {GRADE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditGrade(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        editGrade === preset
                          ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Chọn biểu tượng đại diện</label>
                <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {AVAILABLE_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditAvatar(emoji)}
                      className={`h-10 text-xl flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        editAvatar === emoji
                          ? 'bg-purple-100 border-2 border-purple-600 scale-110 shadow-2xs'
                          : 'hover:bg-slate-200/60 border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mã đăng nhập của con (Access Code)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditStudentCode(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
                  >
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  value={editStudentCode}
                  onChange={(e) => setEditStudentCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: 123456 hoặc AN8899"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-hidden font-mono font-bold tracking-wider"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Con có thể dùng Email của cha mẹ + Mã này để đăng nhập ngay trên máy tính/điện thoại riêng.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChild(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: THÊM CON / NGƯỜI HỌC MỚI */}
      {isAddingChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Plus className="w-4 h-4 text-purple-600" />
                <span>Thêm hồ sơ con mới</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingChild(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewChild} className="space-y-4">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên của bé</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Minh Khang, Hà Phương, Đức Anh..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-sm outline-hidden font-medium"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Khối lớp / Năm học</label>
                  <span className="text-[10px] text-purple-600 font-medium">Nhập tự do</span>
                </div>
                <input
                  type="text"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="Ví dụ: Lớp 6, Lớp 8, Lớp 10A2..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-hidden font-medium mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {GRADE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewGrade(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        newGrade === preset
                          ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Chọn biểu tượng đại diện</label>
                <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {AVAILABLE_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`h-10 text-xl flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        newAvatar === emoji
                          ? 'bg-purple-100 border-2 border-purple-600 scale-110 shadow-2xs'
                          : 'hover:bg-slate-200/60 border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mã đăng nhập của con (Access Code)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewStudentCode(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-bold cursor-pointer"
                  >
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: 123456 hoặc AN8899 (bỏ trống hệ thống sẽ tự cấp)"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-xs outline-hidden font-mono font-bold tracking-wider"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mã này cấp cho con để đăng nhập độc lập tại máy tính hoặc điện thoại riêng của con.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>Hồ sơ mới này sẽ được tự động tạo 1 ngăn lưu trữ thời khóa biểu và bài tập hoàn toàn riêng biệt.</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingChild(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo hồ sơ mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: XÁC NHẬN XÓA HỒ SƠ CON */}
      {deletingChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-red-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1.5">
              Xác nhận xóa hồ sơ con?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc muốn xóa hồ sơ của bé <strong className="text-red-600">{deletingChild.name}</strong> ({deletingChild.avatar} {formatGrade(deletingChild.grade, deletingChild.className)}) không?
            </p>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-left mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>Toàn bộ ngăn dữ liệu thời khóa biểu, tài liệu và sơ đồ tư duy riêng của bé này sẽ được dọn dẹp sạch khỏi thiết bị.</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingChild(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: QR CODE */}
      {qrModalChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative text-center">
            <button
              type="button"
              onClick={() => setQrModalChild(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1.5">
              Mã QR Đăng Nhập Nhanh
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Quét mã này bằng Zalo hoặc Camera để bé <strong className="text-blue-600">{qrModalChild.name}</strong> vào thẳng góc học tập!
            </p>
            
            <div className="flex justify-center mb-5 p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-sm">
              <QRCodeSVG 
                value={getMagicLink(qrModalChild)} 
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            
            <button
              type="button"
              onClick={() => {
                handleCopyMagicLink(qrModalChild);
                setQrModalChild(null);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Link className="w-4 h-4" />
              <span>Sao chép Link thay vì quét mã</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
