import React, { useState } from 'react';
import { FamilyAccount } from '../types';
import { ShieldCheck, Copy, Check, QrCode, Sparkles, X, Smartphone, Laptop, HeartHandshake } from 'lucide-react';

interface FamilyCodeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: FamilyAccount;
}

export const FamilyCodeCardModal: React.FC<FamilyCodeCardModalProps> = ({
  isOpen,
  onClose,
  family,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const familyCode = family.familyCode || 'GD-' + Math.abs(family.parentName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000)).toString().slice(0, 4);

  const getCopyText = () => {
    let text = `🌟 THẺ ĐĂNG NHẬP HỌC TẬP GIA ĐÌNH 🌟\n`;
    text += `🏠 Gia đình: ${family.parentName}\n`;
    text += `🔑 Mã Gia Đình: ${familyCode}\n\n`;
    text += `📚 HƯỚNG DẪN BÉ ĐĂNG NHẬP TRÊN MÁY RIÊNG:\n`;
    text += `1. Mở trang web Thời Khóa Biểu\n`;
    text += `2. Bấm "Con Đăng Nhập Học Bài"\n`;
    text += `3. Nhập Mã Gia Đình: ${familyCode}\n`;
    text += `4. Chọn tên bé trong danh sách:\n`;
    family.children.forEach((c, idx) => {
      text += `   ${idx + 1}. ${c.avatar || '👦'} ${c.name} (${c.className || `Lớp ${c.grade}`})${c.studentCode ? ` - Mã: ${c.studentCode}` : ''}${c.pin ? ` (Mã PIN: ${c.pin})` : ''}\n`;
    });
    text += `\n💡 Mẹo: Tích chọn "Ghi nhớ trên máy này" để lần sau vào thẳng không cần nhập lại!`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                Thẻ Đăng Nhập Cho Con
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-xs text-white/90">Để con đăng nhập trên máy tính / máy tính bảng riêng</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Family Code Highlight Box */}
          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-center relative overflow-hidden">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              🔑 Mã Gia Đình Dùng Chung
            </div>
            <div className="text-3xl font-black text-indigo-900 tracking-wider font-mono select-all">
              {familyCode}
            </div>
            <p className="text-[11px] text-indigo-600/80 mt-1">
              Gia đình: <span className="font-bold">{family.parentName}</span>
            </p>
          </div>

          {/* Children Profiles List */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-indigo-500" />
              Danh sách tài khoản con:
            </h4>
            <div className="space-y-2">
              {family.children.map((c) => (
                <div 
                  key={c.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.avatar || '👦'}</span>
                    <div>
                      <div className="font-black text-slate-800 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.className || `Lớp ${c.grade}`}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {c.pin ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-mono text-xs font-bold">
                        PIN: {c.pin}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">
                        Không cần PIN
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Steps Guide */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1 text-amber-950">
              <Smartphone className="w-4 h-4 text-amber-600" />
              Cách con đăng nhập trên máy riêng:
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-amber-800 leading-relaxed text-[11px]">
              <li>Mở trang web trên máy con ➔ Chọn <b>"Con Đăng Nhập Học Bài"</b>.</li>
              <li>Nhập Mã Gia Đình: <b className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-950">{familyCode}</b></li>
              <li>Chọn đúng tên con ➔ Tích chọn <b>"Ghi nhớ trên máy này"</b>.</li>
              <li>🎉 Từ lần sau mở máy con là <b>vào thẳng 100%</b> không cần nhập lại!</li>
            </ol>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép thẻ gửi Zalo!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép thông tin gửi cho con</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
