import React, { useState } from 'react';

interface LoginModalProps {
  onGoogleLogin: () => Promise<void>;
  isLoggingIn?: boolean;
}

const SLIDES = [
  {
    id: 1,
    title: 'Học tập trực quan',
    subtitle: 'Ghi nhớ sâu hơn và tư duy mạch lạc với hệ thống Sơ đồ tư duy (Mindmap).',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 2,
    title: 'Làm chủ thời gian',
    subtitle: 'Quản lý thời khóa biểu khoa học, nhắc nhở thông minh và học tập hiệu quả.',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 3,
    title: 'Đồng hành tri thức',
    subtitle: 'Không gian học tập độc lập cho học sinh, kết nối nhẹ nhàng và minh bạch.',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80',
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({
  onGoogleLogin,
  isLoggingIn = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 font-sans text-slate-800 overflow-hidden select-none">
      
      {/* -------------------- LEFT COLUMN (58%): VISUAL CAROUSEL -------------------- */}
      <div className="relative w-full md:w-[58%] h-64 sm:h-80 md:h-screen bg-slate-950 overflow-hidden flex flex-col justify-end p-6 sm:p-12 md:p-16">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
          </div>
        ))}

        <div className="relative z-20 space-y-3 max-w-xl animate-in fade-in duration-500">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            {SLIDES[currentSlide].title}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-normal leading-relaxed drop-shadow-sm">
            {SLIDES[currentSlide].subtitle}
          </p>

          <div className="flex items-center gap-2 pt-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* -------------------- RIGHT COLUMN (42%): AUTH ACTION BOX -------------------- */}
      <div className="w-full md:w-[42%] min-h-full md:h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 lg:p-16 z-20 overflow-y-auto relative">
        <div className="w-full max-w-sm mx-auto space-y-8 my-auto animate-in fade-in duration-300">
          
          {/* Header Title */}
          <div className="text-left space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-100 text-2xl font-bold">
              📚
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Không Gian Học Tập
              </h1>
              <p className="text-sm sm:text-base font-semibold text-indigo-700 leading-relaxed">
                Thời Khóa Biểu &amp; Thư Viện Học Tập
              </p>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Đăng nhập bằng Gmail học sinh để lưu trữ bài học, sơ đồ tư duy và đồng bộ dữ liệu an toàn.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-2">
            {/* Google Login */}
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={onGoogleLogin}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group disabled:opacity-75"
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang kết nối Google...</span>
                </div>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-1 shrink-0 shadow-xs">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span>Đăng nhập với Google (Gmail)</span>
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Dành riêng cho học sinh • Tài khoản Google là ID duy nhất của bạn
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
