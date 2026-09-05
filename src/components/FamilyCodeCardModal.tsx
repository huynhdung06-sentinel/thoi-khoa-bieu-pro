import React, { useState } from 'react';
import { FamilyAccount } from '../types';
import { Copy, Check, QrCode, X, Laptop, Smartphone, Link as LinkIcon, Maximize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [copiedChildId, setCopiedChildId] = useState<string | null>(null);
  const [zoomChildId, setZoomChildId] = useState<string | null>(null);

  if (!isOpen) return null;

  const familyCode = family.familyCode || 'GD-' + Math.abs(family.parentName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000)).toString().slice(0, 4);

  const getChildLink = (childId: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('family', familyCode);
    url.searchParams.set('child', childId);
    return url.toString();
  };

  const getCopyText = () => {
    let text = `🌟 ĐƯỜNG LINK ĐĂNG NHẬP HỌC TẬP GIA ĐÌNH 🌟\n`;
    text += `🏠 Gia đình: ${family.parentName}\n`;
    text += `🔑 Mã Gia Đình: ${familyCode}\n\n`;
    text += `📚 ĐƯỜNG LINK ĐĂNG NHẬP CỦA CÁC CON:\n`;
    family.children.forEach((c, idx) => {
      text += `${idx + 1}. ${c.avatar || '👦'} ${c.name} (${c.className || `Lớp ${c.grade}`}):\n👉 Link đăng nhập: ${getChildLink(c.id)}\n\n`;
    });
    text += `💡 Hướng dẫn: Con chỉ cần nhấp vào đường link tương ứng là đăng nhập vào học bài ngay lập tức, không cần điền mật khẩu hay mã số!`;
    return text;
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(getCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySingleLink = (childId: string) => {
    navigator.clipboard.writeText(getChildLink(childId));
    setCopiedChildId(childId);
    setTimeout(() => setCopiedChildId(null), 2500);
  };

  const zoomedChild = family.children.find(c => c.id === zoomChildId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      
      {/* Lightbox Container - Set to 50% width on medium screens & above */}
      <div className="relative w-full md:w-[50%] md:max-w-[50%] lg:w-[48%] bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header - Bright, Fresh Blue Solid Tone */}
        <div className="bg-blue-600 px-6 py-4.5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4.5 right-4 p-1.5 rounded-full hover:bg-white/10 text-blue-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight uppercase">
                Thẻ Đăng Nhập Cho Con
              </h3>
              <p className="text-xs text-blue-100 mt-0.5 font-medium">Học tập thông minh bằng Link &amp; Mã QR không cần mật khẩu</p>
            </div>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Micro Family Code Box - Inline and super compact */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-blue-50/50 border border-blue-100/75">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wide">🔑 Mã gia đình:</span>
              <span className="font-mono font-black text-blue-950 text-base tracking-wide select-all">{familyCode}</span>
            </div>
            <div className="text-xs font-bold text-blue-700 bg-white border border-blue-100 px-2 py-0.5 rounded-md">
              Gia đình: <span className="font-extrabold">{family.parentName}</span>
            </div>
          </div>

          {/* Children Profiles List with QR and Copy Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-4 h-4" />
              Mã QR và Link đăng nhập của con:
            </h4>
            
            <div className="space-y-2.5">
              {family.children.map((c) => (
                <div 
                  key={c.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-blue-50/30 border border-blue-100 hover:border-blue-200 transition-all gap-4"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl select-none">{c.avatar || '👦'}</span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-blue-950 text-sm truncate">{c.name}</div>
                      <div className="text-xs text-blue-600 font-bold">{c.className || `Lớp ${c.grade}`}</div>
                    </div>
                  </div>
                  
                  {/* Right: Larger QR Code & Actions */}
                  <div className="flex items-center gap-4 justify-between sm:justify-start shrink-0">
                    {/* QR Code - Enlarged to 76px and interactive Zoom */}
                    <button
                      type="button"
                      onClick={() => setZoomChildId(c.id)}
                      className="group relative bg-white p-1.5 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center justify-center shrink-0 cursor-pointer"
                      title="Nhấp vào để phóng to Mã QR"
                    >
                      <QRCodeSVG 
                        value={getChildLink(c.id)} 
                        size={76}
                        level="M"
                      />
                      <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <Maximize2 className="w-5 h-5 text-blue-600 drop-shadow-sm" />
                      </div>
                      <span className="text-[8px] font-black text-blue-600 mt-1 uppercase tracking-wide flex items-center gap-0.5">
                        🔍 Phóng to
                      </span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopySingleLink(c.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 min-w-[105px] rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        copiedChildId === c.id
                          ? 'bg-emerald-600 text-white shadow-2xs border border-emerald-600'
                          : 'bg-white border border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50 active:scale-95 shadow-2xs'
                      }`}
                      title="Sao chép link đăng nhập nhanh cho bé này"
                    >
                      {copiedChildId === c.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span>Chép Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Steps Guide - Bright Blue Soft Warning Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900 space-y-1.5">
            <div className="font-black flex items-center gap-1.5 text-blue-950">
              <Smartphone className="w-4 h-4 text-blue-600" />
              Cách con đăng nhập học bài:
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-blue-800 leading-relaxed text-[11px] font-medium">
              <li>
                Bố mẹ bấm nút <b>"Chép Link"</b> gửi qua Zalo/Messenger cho con.
              </li>
              <li>
                Hoặc bấm vào hình <b>Mã QR</b> ở trên để phóng to cho con quét trực tiếp.
              </li>
              <li>
                Con nhấp vào Link hoặc quét QR là hệ thống tự <b>vào thẳng phòng học ngay lập tức</b>.
              </li>
              <li>
                🎉 Hệ thống tự ghi nhớ vĩnh viễn, lần sau mở máy con là vào học luôn, không cần nhập lại!
              </li>
            </ol>
          </div>

        </div>

        {/* Footer Actions - Bright Solid Buttons */}
        <div className="p-4 bg-blue-50/30 border-t border-blue-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyAll}
            className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép danh sách link!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép danh sách link gửi con</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* QR ZOOM OVERLAY (LIGHTBOX within LIGHTBOX) */}
      {zoomedChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 animate-in fade-in duration-150">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-blue-200 p-6 max-w-sm w-full text-center space-y-4 animate-in scale-in duration-150">
            <button
              type="button"
              onClick={() => setZoomChildId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-4xl block select-none">{zoomedChild.avatar || '👦'}</span>
              <h3 className="text-lg font-black text-blue-950">{zoomedChild.name}</h3>
              <p className="text-xs text-blue-600 font-bold">{zoomedChild.className || `Lớp ${zoomedChild.grade}`}</p>
            </div>

            {/* Giant QR Code for scanning from far away */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center shadow-inner">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <QRCodeSVG 
                  value={getChildLink(zoomedChild.id)} 
                  size={220}
                  level="H"
                />
              </div>
            </div>

            <div className="text-xs text-blue-800 bg-blue-50/60 py-2.5 px-4 rounded-lg leading-normal font-medium">
              📱 Bố mẹ cho con mở camera điện thoại/iPad quét mã này để <b>đăng nhập học bài ngay lập tức</b>!
            </div>

            <button
              type="button"
              onClick={() => setZoomChildId(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
