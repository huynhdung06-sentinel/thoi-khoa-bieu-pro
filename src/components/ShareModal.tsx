import React from 'react';
import { X, Mail, Download, MessageCircle, Send, Share2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, imageUrl }) => {
  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'bao-cao-hoc-tap.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const [copiedStatus, setCopiedStatus] = React.useState<string | null>(null);

  const handleShare = async (platformName: string, webUrl: string) => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Copy image to clipboard
      let isCopied = false;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          isCopied = true;
        }
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }

      if (isCopied) {
        setCopiedStatus(`Đã copy ảnh! Đang chuyển tới ${platformName}... (Hãy nhấn Ctrl+V / Dán vào khung chat)`);
      } else {
        setCopiedStatus(`Đang mở ${platformName}... (Nếu chưa có ảnh, bạn bấm "Tải ảnh báo cáo về máy" nhé)`);
      }

      // Mở ngay liên kết ứng dụng
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 350);

      // Tự động tắt thông báo sau 4 giây
      setTimeout(() => {
        setCopiedStatus(null);
      }, 4500);

    } catch (error) {
      console.error('Error preparing share:', error);
      window.open(webUrl, '_blank');
    }
  };

  // Get formatted current Vietnam date for banner
  const getFormattedDateStr = () => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[now.getDay()];
    const dateNum = String(now.getDate()).padStart(2, '0');
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const yearNum = now.getFullYear();
    return `Báo cáo thành tích ngày ${dayName}, ngày ${dateNum}/${monthNum}/${yearNum}`;
  };

  const shareChannels = [
    {
      id: 'zalo',
      name: 'Mở Zalo Chat',
      subtitle: 'Tự động chép ảnh & ...',
      bgClass: 'bg-blue-50/90 hover:bg-blue-100/90 border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-800 dark:hover:bg-blue-900/60',
      titleColor: 'text-blue-950 dark:text-blue-100',
      subtitleColor: 'text-blue-600/90 dark:text-blue-300',
      iconLinkColor: 'text-blue-500',
      iconBadge: (
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-[13px] tracking-tight shrink-0 shadow-xs">
          Zalo
        </div>
      ),
      action: () => handleShare('Zalo', 'https://chat.zalo.me/'),
    },
    {
      id: 'messenger',
      name: 'Messenger',
      subtitle: 'Mở Messenger gửi nh...',
      bgClass: 'bg-indigo-50/90 hover:bg-indigo-100/90 border-indigo-200/80 dark:bg-indigo-950/40 dark:border-indigo-800 dark:hover:bg-indigo-900/60',
      titleColor: 'text-indigo-950 dark:text-indigo-100',
      subtitleColor: 'text-indigo-600/90 dark:text-indigo-300',
      iconLinkColor: 'text-indigo-500',
      iconBadge: (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <MessageCircle className="w-5 h-5 fill-current" />
        </div>
      ),
      action: () => handleShare('Messenger', 'https://www.messenger.com/'),
    },
    {
      id: 'gmail',
      name: 'Gmail',
      subtitle: 'Soạn email kèm ảnh b...',
      bgClass: 'bg-rose-50/90 hover:bg-rose-100/90 border-rose-200/80 dark:bg-rose-950/40 dark:border-rose-800 dark:hover:bg-rose-900/60',
      titleColor: 'text-rose-950 dark:text-rose-100',
      subtitleColor: 'text-rose-600/90 dark:text-rose-300',
      iconLinkColor: 'text-rose-500',
      iconBadge: (
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Mail className="w-5 h-5" />
        </div>
      ),
      action: () => handleShare('Gmail', 'https://mail.google.com/mail/?view=cm&fs=1&su=Báo%20cáo%20Học%20tập'),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      subtitle: 'Chia sẻ qua Telegram',
      bgClass: 'bg-sky-50/90 hover:bg-sky-100/90 border-sky-200/80 dark:bg-sky-950/40 dark:border-sky-800 dark:hover:bg-sky-900/60',
      titleColor: 'text-sky-950 dark:text-sky-100',
      subtitleColor: 'text-sky-600/90 dark:text-sky-300',
      iconLinkColor: 'text-sky-500',
      iconBadge: (
        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Send className="w-5 h-5" />
        </div>
      ),
      action: () => handleShare('Telegram', 'https://web.telegram.org/'),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Gửi Báo Cáo Cho Ba Mẹ
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Status Alert if copied */}
          {copiedStatus && (
            <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs p-3 rounded-2xl leading-relaxed text-center font-semibold animate-fadeIn">
              ✨ {copiedStatus}
            </div>
          )}

          {/* Image Preview Card with Date Banner */}
          {imageUrl && (
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 group">
              <img
                src={imageUrl}
                alt="Thời khóa biểu Báo cáo"
                className="w-full max-h-[220px] object-cover object-top block"
              />
              {/* Bottom Translucent Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-900/60 to-transparent pt-6 pb-2.5 px-3.5 flex items-center gap-2 text-white text-xs sm:text-sm font-semibold">
                <span className="text-base">📸</span>
                <span className="truncate drop-shadow-xs">{getFormattedDateStr()}</span>
              </div>
            </div>
          )}

          {/* Channel Selection Label */}
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 pt-1">
            Chọn kênh bạn muốn gửi báo cáo học tập cho Ba Mẹ:
          </p>

          {/* 2x2 Channel Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {shareChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={channel.action}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 text-left shadow-2xs group hover:scale-[1.02] active:scale-98 ${channel.bgClass}`}
              >
                {channel.iconBadge}
                <div className="min-w-0 flex-1">
                  <div className={`text-xs sm:text-sm font-bold flex items-center justify-between ${channel.titleColor}`}>
                    <span className="truncate">{channel.name}</span>
                    <ExternalLink className={`w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 ${channel.iconLinkColor}`} />
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${channel.subtitleColor}`}>
                    {channel.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Download Button */}
          <button
            type="button"
            onClick={downloadImage}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-98 mt-2"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Tải Ảnh Báo Cáo Về Máy (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

