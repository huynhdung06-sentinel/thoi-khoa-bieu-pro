import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Wifi, Laptop, Loader2, X, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SendToParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  getBackupData: () => any;
  studentName?: string;
  className?: string;
}

const STORAGE_KEY_PARENT_URL = 'mindmap_school_parent_hub_url';
const DEFAULT_PARENT_URL = 'http://192.168.1.15:9090/api/upload';

export const SendToParentModal: React.FC<SendToParentModalProps> = ({
  isOpen,
  onClose,
  getBackupData,
  studentName = 'Học sinh',
  className = 'Lớp'
}) => {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PARENT_URL) || DEFAULT_PARENT_URL;
    } catch {
      return DEFAULT_PARENT_URL;
    }
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; fileName?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setSendResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Chuẩn hóa đường link nhập vào
  const normalizeUrl = (input: string): string => {
    let clean = input.trim();
    if (!clean) return '';
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    // Nếu chỉ nhập IP:port (vd: 192.168.1.15:9090) mà chưa có /api/upload
    if (!clean.includes('/api/upload')) {
      clean = clean.replace(/\/+$/, '') + '/api/upload';
    }
    return clean;
  };

  const handleSaveUrl = (url: string) => {
    setServerUrl(url);
    try {
      localStorage.setItem(STORAGE_KEY_PARENT_URL, url);
    } catch (e) {
      console.warn('Không thể lưu URL vào localStorage:', e);
    }
  };

  // 1. Kiểm tra kết nối tới máy cha
  const handleTestConnection = async () => {
    const finalUrl = normalizeUrl(serverUrl);
    if (!finalUrl) {
      setTestResult({ success: false, message: 'Vui lòng nhập địa chỉ máy cha!' });
      return;
    }

    handleSaveUrl(finalUrl);
    setIsTesting(true);
    setTestResult(null);

    try {
      // Dò thử tới API /api/info
      const infoUrl = finalUrl.replace('/api/upload', '/api/info');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(infoUrl, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `✓ Kết nối máy cha thành công! (Cổng ${data.port || 9090})`
        });
      } else {
        setTestResult({
          success: false,
          message: '⚠️ Máy cha phản hồi nhưng gặp lỗi kết nối (HTTP ' + res.status + ')'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: '❌ Không thể kết nối tới máy cha! Hãy kiểm tra xem máy cha đã bật file start-server.bat và cùng mạng Wi-Fi chưa.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 2. Gửi toàn bộ dữ liệu bài học sang máy cha
  const handleSendData = async () => {
    const finalUrl = normalizeUrl(serverUrl);
    if (!finalUrl) {
      setSendResult({ success: false, message: 'Vui lòng nhập địa chỉ máy cha!' });
      return;
    }

    handleSaveUrl(finalUrl);
    setIsSending(true);
    setSendResult(null);

    try {
      // Lấy toàn bộ gói sao lưu đầy đủ
      const backupData = getBackupData();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s cho bài có nhiều ảnh

      const res = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backupData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await res.json();

      if (res.ok && result.success) {
        setSendResult({
          success: true,
          message: result.message || '✓ Đã gửi bài học sang máy cha thành công!',
          fileName: result.fileName
        });

        // Bắn pháo hoa ăn mừng 🎊
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}
      } else {
        setSendResult({
          success: false,
          message: result.error || 'Máy cha từ chối nhận dữ liệu!'
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi bài học sang máy cha:', err);
      setSendResult({
        success: false,
        message: '❌ Không gửi được! Vui lòng kiểm tra lại địa chỉ IP máy cha và đảm bảo cả 2 máy cùng bắt 1 mạng Wi-Fi.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#161f30] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                Gửi Bài Học Sang Máy Cha
              </h2>
              <p className="text-xs text-emerald-100 opacity-90">
                Đồng bộ nhanh qua mạng Wi-Fi nội bộ gia đình (Mạng LAN)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Thông tin học sinh */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Học sinh:</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                {studentName} {className ? `(${className})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cùng Wi-Fi</span>
            </div>
          </div>

          {/* Ô nhập link kết nối máy cha */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              ĐỊA CHỈ SERVER MÁY CHA (IP LAN):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="Ví dụ: http://192.168.1.15:9090/api/upload"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isSending}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                title="Kiểm tra xem máy cha đã bật và kết nối được chưa"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Kiểm tra</span>
              </button>
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              💡 <i>Mẹo: Mở file <b>start-server.bat</b> trên máy cha, bấm nút <b>[📋 Sao chép Link]</b> rồi dán vào đây (chỉ cần nhập 1 lần duy nhất).</i>
            </p>
          </div>

          {/* Kết quả kiểm tra */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Kết quả gửi bài */}
          {sendResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              sendResult.success 
                ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700'
                : 'bg-rose-100/90 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700'
            }`}>
              {sendResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm">{sendResult.message}</p>
                {sendResult.fileName && (
                  <p className="text-[11px] opacity-80 mt-1 font-mono">
                    Tên file đã lưu: {sendResult.fileName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSendData}
            disabled={isSending}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi sang máy cha...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>🚀 Gửi Bài Học Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
