import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, X } from 'lucide-react';

interface ConfettiCelebrationProps {
  durationMs?: number;
  onComplete?: () => void;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  durationMs = 5000,
  onComplete
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Kích hoạt hiệu ứng xuất hiện (fade-in)
    setShow(true);

    const end = Date.now() + durationMs;
    let frameId: number;

    const frame = () => {
      // Bắn pháo hoa mượt mà từ 2 góc dưới màn hình (School Pride effect)
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        zIndex: 10000,
        colors: ['#ffb703', '#fb8500', '#023047', '#219ebc', '#8ecae6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        zIndex: 10000,
        colors: ['#ffb703', '#fb8500', '#023047', '#219ebc', '#8ecae6']
      });

      if (Date.now() < end) {
        frameId = requestAnimationFrame(frame);
      }
    };
    
    frame();

    // Tự động đóng sau khi kết thúc pháo hoa + 1 khoảng nghỉ
    const timer = setTimeout(() => {
      handleClose();
    }, durationMs + 1500);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [durationMs]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300); // Chờ animation thu nhỏ hoàn tất
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center transition-all duration-300 transform ${
          show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-24 h-24 bg-gradient-to-tr from-amber-200 to-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-amber-50">
          <Award className="w-12 h-12" />
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          Tuyệt vời!
        </h3>
        
        <p className="text-lg text-slate-600 font-medium mb-6">
          Em đã hoàn thành bài học xuất sắc!
        </p>

        <div className="flex items-start text-left gap-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl mb-8 w-full">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Báo cáo học tập đã được lưu và gửi tới Thầy Cô/Ba Mẹ thành công.</span>
        </div>

        <button 
          onClick={handleClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors shadow-sm active:scale-[0.98]"
        >
          Tiếp tục bài học
        </button>
      </div>
    </div>
  );
};
