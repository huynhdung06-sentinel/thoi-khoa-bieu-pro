import React, { useState, useEffect, useRef } from 'react';
import { FamilyAccount, ChildProfile } from '../types';
import { Users, Lock, ChevronRight, UserCircle2, ArrowRight, GraduationCap, Key, Mail, Sparkles, AlertTriangle, Copy, Check, ExternalLink, PlayCircle } from 'lucide-react';
import { signInWithGoogle, getFamilyData, createFamilyAccount, createChildProfile, updateChildProfile, auth, loginAsStudentWithParentEmail } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface RegistrationIntroProps {
  family: FamilyAccount;
  onUpdateFamily: (family: FamilyAccount) => void;
  onSelectChild: (child: ChildProfile) => void;
  onSelectParent: () => void;
  onAddChild: (child: Omit<ChildProfile, 'id'>) => void;
  onStudentLoginSuccess?: (parentUserId: string, familyData: FamilyAccount, child: ChildProfile) => void;
}

export const RegistrationIntro: React.FC<RegistrationIntroProps> = ({
  family,
  onUpdateFamily,
  onSelectChild,
  onSelectParent,
  onAddChild,
  onStudentLoginSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const isUninitialized = !family.parentPin || family.children.length === 0;
  const [viewMode, setViewMode] = useState<'login' | 'select' | 'setup' | 'add_child' | 'parent_pin'>('login');

  // Login Mode: 'parent' (Google Auth) | 'student' (Parent Email + Student Code)
  const [loginTab, setLoginTab] = useState<'parent' | 'student'>('parent');
  const [studentParentEmail, setStudentParentEmail] = useState('');
  const [studentAccessCode, setStudentAccessCode] = useState('');
  const [studentLoginError, setStudentLoginError] = useState('');
  const [isSubmittingStudentLogin, setIsSubmittingStudentLogin] = useState(false);

  // Unauthorized Domain Handling
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const [parentName, setParentName] = useState(family.parentName || '');
  const [parentPin, setParentPin] = useState('');
  
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('6');
  const [childClassName, setChildClassName] = useState('');
  const [childAvatar, setChildAvatar] = useState('👦');
  const [childStudentCode, setChildStudentCode] = useState('');

  const [activeSlide, setActiveSlide] = useState(0);

  const introSlides = [
    {
      title: "Làm chủ quỹ thời gian",
      description: "Thời khóa biểu thông minh, cá nhân hóa giúp học sinh tổ chức thời gian học tập hiệu quả.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    },
    {
      title: "Học tập trực quan",
      description: "Ghi nhớ sâu hơn và tư duy mạch lạc với hệ thống Sơ đồ tư duy (Mindmap).",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    },
    {
      title: "Quản lý bài học dễ dàng",
      description: "Hệ thống hóa toàn bộ kiến thức, bài tập và tiến độ theo từng môn học.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    }
  ];

  useEffect(() => {
    if (viewMode !== 'login') return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % introSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [viewMode, introSlides.length]);

  const onUpdateFamilyRef = useRef(onUpdateFamily);
  useEffect(() => {
    onUpdateFamilyRef.current = onUpdateFamily;
  }, [onUpdateFamily]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const familyData = await getFamilyData(user.uid);
        if (familyData) {
          onUpdateFamilyRef.current(familyData);
          setViewMode((prev) => (prev === 'login' ? 'select' : prev));
        } else {
          setViewMode((prev) => (prev === 'login' ? 'setup' : prev));
        }
      } else {
        setCurrentUser(null);
        setViewMode('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setUnauthorizedDomainError(false);
      await signInWithGoogle();
    } catch (e: any) {
      console.error('Login error:', e);
      setLoading(false);
      const errMsg = e?.message || '';
      const errCode = e?.code || '';
      if (errCode === 'auth/unauthorized-domain' || errMsg.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomainError(true);
      } else {
        alert('Đăng nhập thất bại: ' + (errMsg || 'Vui lòng thử lại!'));
      }
    }
  };

  const handleStartDemoMode = () => {
    const demoChild: ChildProfile = {
      id: 'child_demo_hoc_sinh',
      name: 'Học sinh Trải nghiệm',
      grade: 6,
      className: 'Lớp 6A',
      avatar: '👦',
      studentCode: '123456'
    };
    const demoFamily: FamilyAccount = {
      parentName: 'Phụ huynh (Bản dùng thử)',
      parentPin: '1234',
      children: [demoChild]
    };
    onUpdateFamily(demoFamily);
    onSelectChild(demoChild);
  };

  const handleCompleteSetup = async () => {
    if (!parentName.trim() || parentPin.length < 4 || !currentUser) return;
    
    setLoading(true);
    try {
      await createFamilyAccount(currentUser.uid, { parentName, parentPin });
      
      const newFamily = { parentName, parentPin, children: [] };
      onUpdateFamily(newFamily);
      setViewMode('add_child');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi tạo tài khoản phụ huynh.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewChild = async () => {
    if (!childName.trim() || !currentUser) return;
    
    setLoading(true);
    try {
      const assignedCode = childStudentCode.trim() 
        ? childStudentCode.trim().toUpperCase() 
        : Math.floor(100000 + Math.random() * 900000).toString();

      const childData = {
        name: childName,
        grade: parseInt(childGrade, 10),
        className: childClassName || `Lớp ${childGrade}`,
        avatar: childAvatar,
        studentCode: assignedCode,
      };
      
      const newChild = await createChildProfile(currentUser.uid, childData);
      
      const updatedFamily = {
        ...family,
        children: [...family.children, newChild]
      };
      
      onUpdateFamily(updatedFamily);
      onSelectChild(newChild);
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi thêm học sinh.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentLoginError('');

    if (!studentParentEmail.trim()) {
      setStudentLoginError('Vui lòng nhập Email của Ba/Mẹ.');
      return;
    }
    if (!studentAccessCode.trim()) {
      setStudentLoginError('Vui lòng nhập Mã đăng nhập của con.');
      return;
    }

    setIsSubmittingStudentLogin(true);
    try {
      const result = await loginAsStudentWithParentEmail(
        studentParentEmail.trim(),
        studentAccessCode.trim()
      );

      if (!result) {
        setStudentLoginError('Email của Ba/Mẹ hoặc Mã học sinh chưa chính xác. Vui lòng kiểm tra lại!');
        return;
      }

      // Thông báo thành công và chuyển ngay vào hồ sơ của học sinh
      onUpdateFamily(result.familyData);
      if (onStudentLoginSuccess) {
        onStudentLoginSuccess(result.parentUserId, result.familyData, result.childProfile);
      } else {
        onSelectChild(result.childProfile);
      }
    } catch (err: any) {
      console.error('Error during student login:', err);
      setStudentLoginError('Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại!');
    } finally {
      setIsSubmittingStudentLogin(false);
    }
  };

  const handleParentPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parentPin === family.parentPin) {
      onSelectParent();
    } else {
      alert('Mã PIN không chính xác!');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (viewMode === 'login') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col md:flex-row z-50 overflow-hidden">
        {/* Left Side: Cinematic Slide (60% on desktop, stacked on mobile) */}
        <div className="relative w-full md:w-[60%] h-[50vh] md:h-full bg-slate-900 overflow-hidden shrink-0">
          {introSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Image Background */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover opacity-60"
              />
              {/* Cinematic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
              
              {/* Text Content */}
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col justify-end h-full">
                <div
                  className={`transition-all duration-1000 delay-300 transform ${
                    index === activeSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                >
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
                    {slide.title}
                  </h2>
                  <p className="text-lg md:text-xl text-slate-200 max-w-xl leading-relaxed drop-shadow">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-6 md:bottom-12 left-8 md:left-16 flex items-center gap-3 z-20">
            {introSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`transition-all duration-500 rounded-full ${
                  index === activeSlide
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Login Form (40% on desktop) */}
        <div className="w-full md:w-[40%] h-full flex items-center justify-center bg-white p-6 md:p-8 shrink-0 overflow-y-auto">
          <div className="w-full max-w-md my-auto py-6">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 transform rotate-3 shadow-sm border border-blue-100">
              <Users className="w-7 h-7" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
              Gia đình Học tập
            </h1>

            {/* Nhãn Phi lợi nhuận */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-5 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Dự án phi lợi nhuận • Miễn phí 100%
            </div>

            {/* Lời tự sự nổi bật (Trích dẫn) */}
            <div className="mb-5">
              <blockquote className="border-l-4 border-indigo-400 pl-3.5 py-1 text-slate-600 italic leading-relaxed text-sm md:text-[15px] bg-slate-50/70 rounded-r-lg">
                &ldquo;Sự ép buộc không bao giờ tạo nên sự tự giác. Hãy trao cho con một xuất phát điểm thông minh và chủ động ngay hôm nay!&rdquo;
              </blockquote>
            </div>

            {/* Danh sách Lợi ích nổi bật */}
            <div className="space-y-3.5 mb-6">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-base shadow-xs border border-emerald-100/60">
                  🌿
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Tự giác học tập</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-0.5">
                    Hệ thống đồng hành nhắc nhở thông minh, giúp con tự học tự lập mà cha mẹ không cần thúc giục mỗi tối.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 text-base shadow-xs border border-indigo-100/60">
                  📚
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Kích hoạt tư duy</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed mt-0.5">
                    Tự sáng tạo Sơ đồ tư duy, xây dựng Thư viện bài học logic theo chương trình cá nhân hóa.
                  </p>
                </div>
              </div>
            </div>

            {/* Chuyển đổi đối tượng Đăng nhập: Phụ huynh vs Học sinh */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('parent');
                  setStudentLoginError('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginTab === 'parent'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cha Mẹ (Google)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('student');
                  setStudentLoginError('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginTab === 'student'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Học sinh vào học 🚀</span>
              </button>
            </div>

            {loginTab === 'parent' ? (
              <>
                {unauthorizedDomainError && (
                  <div className="mb-4 p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-slate-800 space-y-3 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-amber-900">
                          Chưa ủy quyền tên miền trên Firebase
                        </h4>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Tên miền <code className="bg-amber-100 text-amber-950 font-bold px-1.5 py-0.5 rounded text-[11px] select-all">{currentHostname}</code> chưa được thêm vào danh sách <strong>Authorized domains</strong> trong Firebase.
                        </p>
                      </div>
                    </div>

                    {/* Nút sao chép tên miền */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200">
                      <input
                        type="text"
                        readOnly
                        value={currentHostname}
                        className="text-xs font-mono bg-transparent border-0 outline-none flex-1 text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (currentHostname) {
                            navigator.clipboard.writeText(currentHostname);
                            setDomainCopied(true);
                            setTimeout(() => setDomainCopied(false), 2500);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        {domainCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Hướng dẫn 3 bước */}
                    <div className="text-[11px] text-slate-700 space-y-1.5 bg-amber-100/60 p-2.5 rounded-xl">
                      <div className="font-bold text-amber-900 flex items-center gap-1">
                        <span>👉</span> Cách xử lý nhanh trong 1 phút:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-amber-900">
                        <li>
                          Mở <a href="https://console.firebase.google.com/project/thoikhoabieupro/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-indigo-700 font-bold underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3 inline" /></a>
                        </li>
                        <li>Chọn thẻ <strong>Authorized domains</strong> rồi bấm <strong>Add domain</strong></li>
                        <li>Dán tên miền vừa sao chép ở trên và bấm <strong>Save</strong></li>
                      </ol>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleLogin}
                        className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Thử đăng nhập lại</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartDemoMode}
                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Trải nghiệm dùng thử ngay</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lời kêu gọi hành động */}
                <p className="text-slate-600 text-xs md:text-sm font-medium mb-3 flex items-center gap-1.5">
                  <span>👉</span>
                  <span>
                    <strong className="text-indigo-600 font-semibold">Bấm Tiếp tục với Google</strong> bên dưới để quản lý hồ sơ và tiến độ học của các con:
                  </span>
                </p>
                
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-base md:text-lg group cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 group-hover:scale-110 transition-transform">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Tiếp tục với Google
                </button>

                {/* Tùy chọn trải nghiệm dùng thử nếu chưa cấu hình xong Auth */}
                {!unauthorizedDomainError && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                    <button
                      type="button"
                      onClick={handleStartDemoMode}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Hoặc khám phá nhanh bằng Bản dùng thử (Không cần đăng nhập)</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* DÀNH CHO HỌC SINH ĐĂNG NHẬP */
              <form onSubmit={handleStudentLogin} className="space-y-3.5">
                <div className="p-3 bg-purple-50 border border-purple-200/80 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
                  <span>
                    Con chỉ cần nhập <strong>Email của Ba/Mẹ</strong> và <strong>Mã học sinh</strong> do cha mẹ cấp để vào bàn học ngay mà không cần tài khoản riêng!
                  </span>
                </div>

                {studentLoginError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {studentLoginError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email của Ba/Mẹ</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={studentParentEmail}
                    onChange={(e) => setStudentParentEmail(e.target.value)}
                    placeholder="Ví dụ: ba_me@gmail.com"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-xs md:text-sm outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mã đăng nhập của con</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentAccessCode}
                    onChange={(e) => setStudentAccessCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: 123456 hoặc AN8899"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-900 text-sm md:text-base outline-hidden font-mono font-bold tracking-wider"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mã này do Ba/Mẹ tạo trong phần "Góc Phụ Huynh".
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingStudentLogin}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all cursor-pointer text-sm md:text-base disabled:opacity-50"
                >
                  {isSubmittingStudentLogin ? (
                    <span>Đang kiểm tra thông tin...</span>
                  ) : (
                    <>
                      <span>Vào bàn học ngay 🚀</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
            
            <p className="text-xs text-slate-400 mt-6 text-center">
              Bằng cách đăng nhập, bạn đồng ý với các điều khoản bảo mật và lưu trữ an toàn của hệ thống.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SELECT PROFILE SCREEN
  if (viewMode === 'select') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4 z-50">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-3">Ai đang học vậy?</h1>
            <p className="text-lg text-slate-500 font-medium">Chọn hồ sơ của bạn để tiếp tục</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {family.children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelectChild(child)}
                className="w-36 md:w-44 min-h-[180px] group flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {child.avatar || '👦'}
                </div>
                <h3 className="font-bold text-lg text-slate-800 text-center w-full truncate">{child.name}</h3>
                <span className="text-sm text-indigo-500 font-medium bg-indigo-50 px-3 py-1 rounded-full mt-2">
                  {child.className || `Lớp ${child.grade}`}
                </span>
              </button>
            ))}

            <button
              onClick={() => setViewMode('add_child')}
              className="w-36 md:w-44 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 p-6 rounded-3xl transition-all duration-300 group min-h-[180px]"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors mb-3">
                <Users className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <span className="font-semibold text-slate-600 group-hover:text-indigo-700 text-center">Thêm học sinh</span>
            </button>
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setViewMode('parent_pin')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-6 py-3 rounded-xl hover:bg-white/50 transition-colors"
            >
              <UserCircle2 className="w-5 h-5" />
              Khu vực dành cho Phụ huynh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PARENT PIN SCREEN
  if (viewMode === 'parent_pin') {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 relative">
          <button 
            onClick={() => setViewMode('select')}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nhập mã PIN</h2>
            <p className="text-sm text-slate-500">Mã PIN dành cho Phụ huynh để quản lý tài khoản.</p>
          </div>

          <form onSubmit={handleParentPinSubmit} className="space-y-4">
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full text-center text-3xl tracking-[1em] font-mono p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-slate-50 focus:bg-white"
              value={parentPin}
              onChange={(e) => setParentPin(e.target.value)}
              placeholder="••••"
            />
            <button
              type="submit"
              disabled={parentPin.length < 4}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SETUP PARENT SCREEN
  if (viewMode === 'setup') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thiết lập gia đình</h2>
            <p className="text-sm text-slate-500 mb-6">Tạo hồ sơ phụ huynh để quản lý các con.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Ba/Mẹ</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="VD: Mẹ Lan, Ba Hùng..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã PIN bảo mật</label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest"
                  value={parentPin}
                  onChange={(e) => setParentPin(e.target.value)}
                  placeholder="Nhập 4-6 số"
                />
                <p className="text-xs text-slate-400 mt-2">Mã PIN này dùng để bảo vệ quyền chỉnh sửa của phụ huynh.</p>
              </div>

              <button
                onClick={handleCompleteSetup}
                disabled={!parentName || parentPin.length < 4}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4"
              >
                Tiếp tục <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADD CHILD SCREEN
  if (viewMode === 'add_child') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Thêm học sinh</h2>
              {family.children.length > 0 && (
                <button 
                  onClick={() => setViewMode('select')}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
              )}
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên học sinh</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Nhập tên bé..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lớp / Khối</label>
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên lớp học</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={childClassName}
                    onChange={(e) => setChildClassName(e.target.value)}
                    placeholder={`VD: ${childGrade}A1`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mã đăng nhập của con (Tùy chọn)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-wider uppercase font-bold"
                    value={childStudentCode}
                    onChange={(e) => setChildStudentCode(e.target.value.toUpperCase())}
                    placeholder="VD: 123456 (để trống sẽ tự tạo)"
                  />
                  <button
                    type="button"
                    onClick={() => setChildStudentCode(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mã này giúp con đăng nhập nhanh trên máy tính riêng bằng Email của Ba/Mẹ.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Chọn Ảnh đại diện</label>
                <div className="flex justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  {['👦', '👧', '🚀', '🐱', '🦄'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setChildAvatar(emoji)}
                      className={`text-3xl p-2 rounded-xl transition-all ${
                        childAvatar === emoji ? 'bg-white shadow-md scale-110' : 'hover:bg-slate-200 opacity-70'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddNewChild}
                disabled={!childName}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
