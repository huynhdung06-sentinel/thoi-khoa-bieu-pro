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
  Key,
  Copy
} from 'lucide-react';
import { ChildProfile, FamilyAccount } from '../types';

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
  // Parent Name & PIN editing
  const [parentName, setParentName] = useState(family.parentName || 'Bố Mẹ');
  const [parentPin, setParentPin] = useState(family.parentPin || '');
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);

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

  // Save parent info (Name + PIN)
  const handleSaveParentInfo = () => {
    if (!parentName.trim()) {
      alert('Vui lòng nhập tên hiển thị cho phụ huynh!');
      return;
    }
    if (!parentPin || parentPin.length < 4) {
      alert('Mã PIN cần ít nhất 4 chữ số!');
      return;
    }
    const updated: FamilyAccount = {
      ...family,
      parentName: parentName.trim(),
      parentPin: parentPin.trim(),
    };
    onUpdateFamily(updated);
    setPinChangeMsg('Đã lưu thông tin phụ huynh và mã PIN mới!');
    setTimeout(() => setPinChangeMsg(''), 3000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] border border-slate-200">
        
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
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(child.studentCode || '');
                                setCopiedChildId(child.id);
                                setTimeout(() => setCopiedChildId(null), 2000);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                              title="Bấm để sao chép mã đăng nhập của con"
                            >
                              <Key className="w-3 h-3 text-purple-600" />
                              <span>Mã: {child.studentCode}</span>
                              {copiedChildId === child.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-purple-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions for this child */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {!isActive && onSwitchActiveChild && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchActiveChild(child);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title={`Xem thời khóa biểu của ${child.name}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem TKB</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEditChild(child)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Chỉnh sửa tên, khối lớp, biểu tượng"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingChild(child)}
                        className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Xóa hồ sơ và dọn dẹp dữ liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span className="hidden sm:inline">Xóa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: BẢO VỆ MÃ PIN VÀ TÊN PHỤ HUYNH */}
          <section className="space-y-3.5 border-t border-slate-100 pt-5">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Cài đặt Phụ huynh & Mã PIN bảo mật</span>
            </h4>

            {pinChangeMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinChangeMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Tên hiển thị của Bố/Mẹ</label>
                <input 
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ví dụ: Bố Minh, Mẹ Thảo, Phụ huynh..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Mã PIN bí mật (ít nhất 4 số)</label>
                <input 
                  type="text"
                  value={parentPin}
                  maxLength={6}
                  onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 1234, 8888..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold tracking-widest text-slate-800 outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveParentInfo}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lưu thông tin Phụ huynh</span>
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

    </div>
  );
};
