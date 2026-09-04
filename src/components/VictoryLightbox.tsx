import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface VictoryLightboxProps {
  onClose: () => void;
  onSend: () => void;
}

export const VictoryLightbox: React.FC<VictoryLightboxProps> = ({ onClose, onSend }) => {
  useEffect(() => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    
    // Slow down gravity and velocity for softer effect
    const defaults = { startVelocity: 15, spread: 360, ticks: 120, zIndex: 1000, gravity: 0.6 };

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      // Fewer particles to prevent lagging
      const particleCount = 20 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chúc mừng Bạn!</h2>
        <p className="text-slate-600 dark:text-slate-400">Bạn đã hoàn thành tất cả các bài học hôm nay!</p>
        <button
          onClick={onSend}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Gửi báo cáo cho Ba Mẹ
        </button>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Để sau</button>
      </div>
    </div>
  );
};
