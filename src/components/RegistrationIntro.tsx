import React, { useState, useEffect } from 'react';
import { FamilyAccount, ChildProfile } from '../types';
import { 
  Users, 
  Lock, 
  ArrowRight, 
  GraduationCap, 
  Key, 
  Sparkles, 
  Check, 
  Upload, 
  Laptop, 
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  BookOpen,
  X,
  Trash2,
  Edit2,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Dices,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  FileJson,
  Loader2,
  Cloud
} from 'lucide-react';
import { fetchFamilyByCodeFromCloud, syncFamilyByCodeToCloud } from '../lib/firebase';

interface RegistrationIntroProps {
  family: FamilyAccount;
  onUpdateFamily: (family: FamilyAccount) => void;
  onSelectChild: (child: ChildProfile) => void;
  onSelectParent: () => void;
  onAddChild: (child: Omit<ChildProfile, 'id'>) => void;
  onImportBackupData?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartDemo?: () => void;
}

const AVATAR_OPTIONS = ['👦', '👧', '🚀', '🐱', '🦁', '🦊', '⭐', '🦄', '⚽', '🎮', '📚', '🎨'];

const GRADE_PRESETS = [
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 
  'Lớp 10', 'Lớp 11', 'Lớp 12', 
  'Sinh viên Năm 1', 'Sinh viên', 'Đại học'
];

export const DEFAULT_SECURITY_QUESTIONS = [
  'Năm sinh của Mẹ (hoặc Bố)?',
  'Tên trường tiểu học đầu tiên của con?',
  'Tên thành phố / quê hương của gia đình?',
  'Tên thú cưng đầu tiên của gia đình?',
  'Biệt danh thuở nhỏ của Mẹ (hoặc Bố)?',
  'Món ăn yêu thích nhất của cả gia đình?',
];

const SLIDES = [
  {
    id: 1,
    title: 'Học tập trực quan',
    subtitle: 'Ghi nhớ sâu hơn và tư duy mạch lạc với hệ thống Sơ đồ tư duy (Mindmap).',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
    tag: 'Tư Duy Sáng Tạo'
  },
  {
    id: 2,
    title: 'Làm chủ thời gian',
    subtitle: 'Quản lý thời khóa biểu khoa học, nhắc nhở thông minh và học tập hiệu quả.',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80',
    tag: 'Thời Khóa Biểu Thông Minh'
  },
  {
    id: 3,
    title: 'Đồng hành tri thức',
    subtitle: 'Không gian học tập độc lập cho học sinh & sinh viên, kết nối nhẹ nhàng cùng gia đình.',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80',
    tag: 'Đồng Hành & Phát Triển'
  }
];

export const RegistrationIntro: React.FC<RegistrationIntroProps> = ({
  family,
  onUpdateFamily,
  onSelectChild,
  onSelectParent,
  onAddChild,
  onImportBackupData,
  onStartDemo,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Is initialized
  const hasExistingFamily = Boolean(family.parentPin && family.children && family.children.length > 0);

  // Active form mode inside right column
  // 'main' -> The 2 clean buttons (Phụ huynh / Học sinh)
  // 'student_login' -> Học sinh nhập mã gia đình & ghi nhớ máy
  // 'parent_panel' -> Phụ huynh (Nhập PIN hoặc Tạo mới)
  // 'add_child' -> Thêm hồ sơ người học
  const [formMode, setFormMode] = useState<'main' | 'student_login' | 'parent_panel' | 'add_child'>('main');

  // Student Form State
  const [studentFamilyCode, setStudentFamilyCode] = useState('');
  const [studentChildId, setStudentChildId] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [studentError, setStudentError] = useState('');
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);

  // Parent Form State
  const [parentName, setParentName] = useState(family.parentName || '');
  const [parentPin, setParentPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customFamilyCode, setCustomFamilyCode] = useState(() => {
    if (family.familyCode) {
      return family.familyCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    }
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `GD${digits}`;
  });
  const [parentSecurityQuestion, setParentSecurityQuestion] = useState(family.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]);
  const [parentSecurityAnswer, setParentSecurityAnswer] = useState(family.securityAnswer || '');
  const [parentError, setParentError] = useState('');

  // Child Info (for Parent Create)
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('Lớp 10');
  const [childAvatar, setChildAvatar] = useState('👦');

  // Forgot Password Modal State (2-tier recovery)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotTab, setForgotTab] = useState<'question' | 'backup'>('question');
  const [forgotAnswerInput, setForgotAnswerInput] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [isAnswerVerified, setIsAnswerVerified] = useState(false);

  // Lightbox Parent Management State
  const [isParentLightboxOpen, setIsParentLightboxOpen] = useState(false);
  const [activeLightboxTab, setActiveLightboxTab] = useState<'children' | 'add_child' | 'settings'>('children');

  // Add child form state
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState('Lớp 7');
  const [newChildAvatar, setNewChildAvatar] = useState('👦');
  const [childFormError, setChildFormError] = useState('');
  const [childSuccessMessage, setChildSuccessMessage] = useState('');

  // Edit child state
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [editChildGrade, setEditChildGrade] = useState('Lớp 7');
  const [editChildAvatar, setEditChildAvatar] = useState('👦');

  // Check if student family code matches
  const isFamilyCodeValid = Boolean(
    studentFamilyCode.trim() &&
    family.familyCode &&
    studentFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === family.familyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  );

  // Auto query Firestore when student types a Family Code that is not in local state
  useEffect(() => {
    const cleanInput = studentFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const localCode = (family.familyCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleanInput.length >= 4 && cleanInput !== localCode) {
      let isCancelled = false;
      setIsSearchingCloud(true);
      const timer = setTimeout(async () => {
        try {
          const cloudFamily = await fetchFamilyByCodeFromCloud(cleanInput);
          if (!isCancelled && cloudFamily) {
            onUpdateFamily(cloudFamily);
            if (cloudFamily.children && cloudFamily.children.length > 0) {
              setStudentChildId(cloudFamily.children[0].id);
            }
            setStudentError('');
          }
        } catch (err) {
          console.error('Error fetching family from cloud:', err);
        } finally {
          if (!isCancelled) setIsSearchingCloud(false);
        }
      }, 500);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [studentFamilyCode, family.familyCode, onUpdateFamily]);

  // Auto select first child when family code valid and no child selected
  useEffect(() => {
    if (isFamilyCodeValid && family.children && family.children.length > 0) {
      if (!studentChildId || !family.children.some(c => c.id === studentChildId)) {
        setStudentChildId(family.children[0].id);
      }
    }
  }, [isFamilyCodeValid, family.children, studentChildId]);

  // Parent Settings in Lightbox
  const [lightboxParentName, setLightboxParentName] = useState(family.parentName || 'Phụ Huynh');
  const [lightboxParentPin, setLightboxParentPin] = useState(family.parentPin || '1234');
  const [lightboxFamilyCode, setLightboxFamilyCode] = useState(family.familyCode || 'GD8899');
  const [lightboxSecurityQuestion, setLightboxSecurityQuestion] = useState(family.securityQuestion || DEFAULT_SECURITY_QUESTIONS[0]);
  const [lightboxSecurityAnswer, setLightboxSecurityAnswer] = useState(family.securityAnswer || '');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Sync settings when family changes
  useEffect(() => {
    if (family.parentName) setLightboxParentName(family.parentName);
    if (family.parentPin) setLightboxParentPin(family.parentPin);
    if (family.familyCode) setLightboxFamilyCode(family.familyCode);
    if (family.securityQuestion) setLightboxSecurityQuestion(family.securityQuestion);
    if (family.securityAnswer) setLightboxSecurityAnswer(family.securityAnswer);
  }, [family]);

  // Generate random 6-character family code
  const handleGenerateRandomFamilyCode = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    const newCode = `GD${digits}`;
    setCustomFamilyCode(newCode);
    setLightboxFamilyCode(newCode);
  };

  // Handle Add New Child
  const handleAddNewChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      setChildFormError('Vui lòng nhập tên của con / người học!');
      return;
    }
    const createdChild: ChildProfile = {
      id: 'student_' + Date.now().toString(),
      name: newChildName.trim(),
      grade: newChildGrade,
      className: newChildGrade,
      avatar: newChildAvatar,
      studentCode: (newChildName.trim() || 'HS').slice(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90),
    };
    const updatedChildren = [...(family.children || []), createdChild];
    const updatedFam: FamilyAccount = {
      ...family,
      children: updatedChildren,
    };
    onUpdateFamily(updatedFam);
    onAddChild(createdChild);
    setNewChildName('');
    setChildFormError('');
    setChildSuccessMessage(`Đã tạo tài khoản cho "${createdChild.name}" thành công!`);
    setTimeout(() => {
      setChildSuccessMessage('');
      setActiveLightboxTab('children');
    }, 1200);
  };

  // Start editing child
  const handleStartEditChild = (child: ChildProfile) => {
    setEditingChild(child);
    setEditChildName(child.name);
    setEditChildGrade(child.className || (child.grade ? String(child.grade) : 'Lớp 7'));
    setEditChildAvatar(child.avatar || '👦');
  };

  // Save edit child
  const handleSaveEditChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild || !editChildName.trim()) return;
    const updatedChildren = (family.children || []).map(c => {
      if (c.id === editingChild.id) {
        return {
          ...c,
          name: editChildName.trim(),
          grade: editChildGrade,
          className: editChildGrade,
          avatar: editChildAvatar,
        };
      }
      return c;
    });
    onUpdateFamily({
      ...family,
      children: updatedChildren,
    });
    setEditingChild(null);
  };

  // Delete child
  const handleDeleteChild = (childId: string) => {
    if ((family.children || []).length <= 1) {
      alert('Cần có ít nhất 1 hồ sơ học sinh trong gia đình!');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa hồ sơ học sinh này?')) {
      return;
    }
    const updatedChildren = (family.children || []).filter(c => c.id !== childId);
    onUpdateFamily({
      ...family,
      children: updatedChildren,
    });
  };

  // Save parent settings
  const handleSaveParentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lightboxParentName.trim()) {
      alert('Vui lòng nhập tên phụ huynh!');
      return;
    }
    if (lightboxParentPin.length < 4 || lightboxParentPin.length > 8) {
      alert('Mật khẩu cần từ 4 đến 8 ký tự!');
      return;
    }
    const cleanCode = lightboxFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 6 || cleanCode.length > 8) {
      alert('Mã Gia Đình cần đúng từ 6 đến 8 ký tự (chữ in hoa và số)!');
      return;
    }
    const updatedFam: FamilyAccount = {
      ...family,
      parentName: lightboxParentName.trim(),
      parentPin: lightboxParentPin.trim(),
      familyCode: cleanCode,
      securityQuestion: lightboxSecurityQuestion,
      securityAnswer: lightboxSecurityAnswer.trim(),
    };
    onUpdateFamily(updatedFam);
    syncFamilyByCodeToCloud(updatedFam);
    setSettingsSavedMsg('Đã cập nhật cài đặt Phụ huynh & Đồng bộ đám mây thành công!');
    setTimeout(() => setSettingsSavedMsg(''), 2500);
  };

  // Handle Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const inputCode = studentFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    let currentFam = family;
    let currentCode = (currentFam.familyCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (inputCode && inputCode !== currentCode) {
      setIsSearchingCloud(true);
      const cloudFam = await fetchFamilyByCodeFromCloud(inputCode);
      setIsSearchingCloud(false);
      if (cloudFam) {
        currentFam = cloudFam;
        currentCode = (cloudFam.familyCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        onUpdateFamily(cloudFam);
      }
    }

    if (currentCode && inputCode === currentCode && currentFam.children && currentFam.children.length > 0) {
      const selectedChild = currentFam.children.find(c => c.id === studentChildId) || currentFam.children[0];

      if (rememberDevice) {
        try {
          localStorage.setItem('mindmap_remembered_student_id', selectedChild.id);
          localStorage.setItem('mindmap_remembered_family_code', currentCode);
        } catch (e) {
          console.error(e);
        }
      }

      onSelectChild(selectedChild);
      return;
    }

    setStudentError('Không tìm thấy Mã Gia Đình trên hệ thống đám mây hoặc gia đình chưa có hồ sơ học sinh!');
  };

  // Handle Parent Action (Login or Create)
  const handleParentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentError('');

    // If already has parent pin, verify pin & open lightbox directly
    if (family.parentPin) {
      if (parentPin.trim() === family.parentPin) {
        if (parentName.trim() && parentName.trim() !== family.parentName) {
          const updated = {
            ...family,
            parentName: parentName.trim(),
          };
          onUpdateFamily(updated);
          syncFamilyByCodeToCloud(updated);
        }
        setLightboxParentName(family.parentName || 'Phụ Huynh');
        setLightboxParentPin(family.parentPin);
        setLightboxFamilyCode(family.familyCode || 'GD8899');
        setIsParentLightboxOpen(true);
        return;
      } else {
        setParentError('Mật khẩu Phụ huynh chưa chính xác!');
        return;
      }
    }

    // If creating new
    if (!parentName.trim()) {
      setParentError('Vui lòng nhập tên Phụ Huynh!');
      return;
    }
    if (parentPin.length < 4 || parentPin.length > 8) {
      setParentError('Mật khẩu Phụ huynh phải từ 4 đến 8 ký tự!');
      return;
    }
    const cleanFamCode = customFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanFamCode.length < 6 || cleanFamCode.length > 8) {
      setParentError('Mã Gia Đình phải đúng từ 6 đến 8 ký tự (chữ in hoa và số)!');
      return;
    }

    const firstChild: ChildProfile = {
      id: 'student_' + Date.now().toString(),
      name: childName.trim() || 'Người học',
      grade: childGrade,
      className: childGrade,
      avatar: childAvatar,
      studentCode: (childName.trim() || 'HS').slice(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90),
    };

    const newFamily: FamilyAccount = {
      familyCode: cleanFamCode,
      parentName: parentName.trim(),
      parentPin: parentPin.trim(),
      securityQuestion: parentSecurityQuestion,
      securityAnswer: parentSecurityAnswer.trim(),
      children: [firstChild],
    };

    onUpdateFamily(newFamily);
    syncFamilyByCodeToCloud(newFamily);
    setIsParentLightboxOpen(true);
  };

  // Handle Verify Security Question in Forgot Password Modal
  const handleVerifySecurityQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccessMsg('');

    const savedAnswer = (family.securityAnswer || '').trim().toLowerCase();
    const inputAnswer = forgotAnswerInput.trim().toLowerCase();

    if (!savedAnswer) {
      setForgotError('Gia đình chưa thiết lập câu hỏi bí mật. Vui lòng chuyển sang tab "Tệp sao lưu" để khôi phục.');
      return;
    }

    if (inputAnswer === savedAnswer) {
      setIsAnswerVerified(true);
      setForgotSuccessMsg('Xác thực câu hỏi bảo mật thành công! Bạn hãy nhập mật khẩu mới bên dưới.');
    } else {
      setForgotError('Câu trả lời bí mật chưa chính xác. Vui lòng thử lại hoặc sử dụng tệp sao lưu gia đình.');
    }
  };

  // Handle Reset Password after answering security question
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPin.length < 4 || forgotNewPin.length > 8) {
      setForgotError('Mật khẩu mới phải từ 4 đến 8 ký tự!');
      return;
    }
    if (forgotNewPin !== forgotConfirmPin) {
      setForgotError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    const updatedFam: FamilyAccount = {
      ...family,
      parentPin: forgotNewPin.trim()
    };
    onUpdateFamily(updatedFam);
    setParentPin(forgotNewPin.trim());
    setForgotSuccessMsg('🎉 Đặt lại mật khẩu thành công! Đang chuyển hướng...');
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setIsAnswerVerified(false);
      setForgotAnswerInput('');
      setForgotNewPin('');
      setForgotConfirmPin('');
      setForgotSuccessMsg('');
    }, 1200);
  };

  // Quick Guest Trial (10-minute demo)
  const handleQuickGuest = () => {
    if (onStartDemo) {
      onStartDemo();
      return;
    }

    const guestChild: ChildProfile = {
      id: 'guest_student_' + Date.now().toString().slice(-4),
      name: 'Học viên',
      grade: 'Lớp 10',
      className: 'Lớp 10A1',
      avatar: '🚀',
      studentCode: 'HV8899',
    };

    const guestFamily: FamilyAccount = {
      familyCode: 'GD-DEMO',
      parentName: 'Phụ Huynh',
      parentPin: '1234',
      children: [guestChild]
    };

    onUpdateFamily(guestFamily);
    onSelectChild(guestChild);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 font-sans text-slate-800 overflow-hidden select-none">
      
      {/* -------------------- LEFT COLUMN (60%): 3 SLIDES CAROUSEL -------------------- */}
      <div className="relative w-full md:w-[60%] h-64 sm:h-80 md:h-screen bg-slate-950 overflow-hidden flex flex-col justify-end p-6 sm:p-12 md:p-16">
        
        {/* Slide Images */}
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
            {/* Dark gradient overlay matching the reference screenshot */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
          </div>
        ))}

        {/* Slide Content (Text & Indicators) */}
        <div className="relative z-20 space-y-3 max-w-xl animate-in fade-in duration-500">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
            {SLIDES[currentSlide].title}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-normal leading-relaxed drop-shadow-sm">
            {SLIDES[currentSlide].subtitle}
          </p>

          {/* Slide Indicator Bars (— · ·) */}
          <div className="flex items-center gap-2 pt-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* -------------------- RIGHT COLUMN (40%): CLEAN WHITE FORM -------------------- */}
      <div className="w-full md:w-[40%] min-h-full md:h-screen bg-white flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 lg:p-14 z-20 overflow-y-auto">
        
        {/* Main Center Area */}
        <div className="w-full max-w-sm mx-auto space-y-8 my-auto">
          
          {/* Top Icon + Header */}
          <div className="text-left space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Gia đình học tập
              </h1>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Dự án phi lợi nhuận • Hoàn toàn miễn phí.</span>
              </div>
            </div>

            {/* Quote Box */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border-l-4 border-indigo-500 text-slate-700 text-xs sm:text-sm italic leading-relaxed shadow-2xs">
              “Sự ép buộc không bao giờ tạo nên sự tự giác. Hãy trao cho con một xuất phát điểm thông minh và chủ động ngay hôm nay!”
            </div>

            {/* 2 Core Feature Highlights */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  🌿
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Tự giác học tập
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                    Hệ thống đồng hành nhắc nhở thông minh, giúp con tự học tự lập mà cha mẹ không cần thúc giục mỗi tối.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  📚
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Kích hoạt tư duy
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                    Tự sáng tạo Sơ đồ tư duy, xây dựng Thư viện bài học logic theo chương trình cá nhân hóa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------- SUB-VIEW: 2 MAIN BUTTONS ----------------- */}
          {formMode === 'main' && (
            <div className="space-y-3.5 pt-2">
              
              {/* Option 1: Dành cho Phụ Huynh */}
              <button
                type="button"
                onClick={() => setFormMode('parent_panel')}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-800 font-semibold text-sm transition-all duration-200 shadow-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold text-base">
                    👨‍👩‍👧
                  </div>
                  <span className="text-slate-800 group-hover:text-blue-700 font-bold">
                    Phụ huynh
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 2: Dành cho Học Sinh & Sinh Viên */}
              <button
                type="button"
                onClick={() => setFormMode('student_login')}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-slate-800 font-semibold text-sm transition-all duration-200 shadow-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-base">
                    🎓
                  </div>
                  <span className="text-slate-800 group-hover:text-emerald-700 font-bold">
                    Học sinh & Sinh viên
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Secondary Options */}
              <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickGuest}
                  className="hover:text-blue-600 font-medium transition-colors cursor-pointer"
                >
                  Trải nghiệm nhanh
                </button>

                {onImportBackupData && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={onImportBackupData}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-blue-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Nạp tệp sao lưu</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ----------------- SUB-VIEW: STUDENT LOGIN ----------------- */}
          {formMode === 'student_login' && (
            <form onSubmit={handleStudentLogin} className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('main');
                    setStudentError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/80 font-bold text-xs shadow-2xs transition-all cursor-pointer group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Quay lại</span>
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 uppercase tracking-wider">
                  Học sinh & Sinh viên
                </span>
              </div>

              {studentError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* Family Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mã Gia Đình:
                  </label>
                  {isSearchingCloud && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang tìm trên máy chủ...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nhập mã gia đình (VD: GD8899)"
                    value={studentFamilyCode}
                    onChange={(e) => {
                      setStudentFamilyCode(e.target.value.toUpperCase());
                      setStudentError('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-center text-base font-bold uppercase outline-hidden bg-white text-slate-900"
                  />
                  {isSearchingCloud && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Family -> Show Child Account Tiles */}
              {isFamilyCodeValid ? (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* Family Greeting Badge */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Gia đình: {family.parentName}
                    </span>
                    <span className="text-emerald-700 font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-500" />
                      {family.familyCode}
                    </span>
                  </div>

                  {/* Square Profile Cards */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Chọn tài khoản của bạn:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {family.children && family.children.length > 0 ? (
                        family.children.map((child) => {
                          const isSelected = (studentChildId || family.children?.[0]?.id) === child.id;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setStudentChildId(child.id)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-emerald-600 bg-emerald-50 text-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="text-3xl mb-1.5 transform hover:scale-110 transition-transform">
                                {child.avatar || '👦'}
                              </div>
                              <span className="text-xs font-bold text-slate-900 truncate w-full">
                                {child.name}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                                {child.className || (child.grade ? `Lớp ${child.grade}` : 'Học sinh')}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                          Chưa có tài khoản con nào trong gia đình này.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remember on this device */}
                  <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">
                      Ghi nhớ trên máy này (Lần sau vào thẳng)
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>VÀO HỌC NGAY</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Prompt when code not valid yet */
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    💡 Nhập mã gia đình do Bố Mẹ cung cấp (Ví dụ: <b className="font-mono text-slate-700">{family.familyCode || 'GD-DEMO'}</b>) để hiển thị các tài khoản học sinh.
                  </p>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Kiểm tra & Mở khóa tài khoản
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ----------------- SUB-VIEW: PARENT PANEL ----------------- */}
          {formMode === 'parent_panel' && (
            <form onSubmit={handleParentAction} className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setFormMode('main')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200/80 font-bold text-xs shadow-2xs transition-all cursor-pointer group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Quay lại</span>
                </button>
                <span className="text-xs font-bold text-blue-700 bg-blue-50/60 px-2.5 py-1 rounded-lg border border-blue-200/60 uppercase tracking-wider">
                  Góc Phụ Huynh
                </span>
              </div>

              {parentError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{parentError}</span>
                </div>
              )}

              {/* If family already exists, ask for Password */}
              {family.parentPin ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tên Phụ Huynh:
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Ba Nam / Mẹ Hương"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white"
                    />
                  </div>

                  {family.familyCode && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800 font-mono font-bold flex items-center justify-between">
                      <span className="font-sans font-semibold">Mã Gia Đình:</span>
                      <span className="text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200 font-mono tracking-wider">
                        {family.familyCode}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600">
                        Mật khẩu Phụ Huynh:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotModalOpen(true);
                          setForgotTab('question');
                          setIsAnswerVerified(false);
                          setForgotError('');
                          setForgotSuccessMsg('');
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={8}
                        placeholder="Nhập mật khẩu (4-8 ký tự)"
                        value={parentPin}
                        onChange={(e) => setParentPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-blue-500 font-mono text-center text-base tracking-widest outline-hidden bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>MỞ GÓC QUẢN LÝ</span>
                  </button>
                </div>
              ) : (
                /* If new, create family account with 6-8 char code & security question */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tên Phụ Huynh:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Ba Nam / Mẹ Hương"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600">
                        Mã Gia Đình (6 - 8 ký tự):
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateRandomFamilyCode}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Tự động tạo mã ngẫu nhiên 6 chữ số"
                      >
                        <Dices className="w-3.5 h-3.5" />
                        <span>Tạo ngẫu nhiên</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="VD: GD8899 hoặc NAM123"
                        value={customFamilyCode}
                        onChange={(e) => {
                          const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                          setCustomFamilyCode(clean);
                        }}
                        className="w-full px-3 py-2 pr-16 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-mono font-bold tracking-wider outline-hidden bg-white uppercase"
                      />
                      <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        customFamilyCode.length >= 6 && customFamilyCode.length <= 8
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {customFamilyCode.length}/8
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mã gồm 6-8 chữ cái/số giúp các con đăng nhập nhanh trên máy riêng.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Mật khẩu Phụ Huynh (4 - 8 ký tự):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={8}
                        placeholder="VD: 123456"
                        value={parentPin}
                        onChange={(e) => setParentPin(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:border-blue-500 font-mono text-center text-xs tracking-wider outline-hidden bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Question Setup */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Câu hỏi bảo mật (Dùng khi quên mật khẩu):</span>
                    </div>
                    <select
                      value={parentSecurityQuestion}
                      onChange={(e) => setParentSecurityQuestion(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 outline-hidden font-medium"
                    >
                      {DEFAULT_SECURITY_QUESTIONS.map((q, idx) => (
                        <option key={idx} value={q}>{q}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Nhập câu trả lời bí mật của bạn..."
                      value={parentSecurityAnswer}
                      onChange={(e) => setParentSecurityAnswer(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Hồ sơ người học (Con / Học sinh đầu tiên):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên học sinh"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Lớp / Khối"
                        value={childGrade}
                        onChange={(e) => setChildGrade(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    HOÀN TẤT & BẮT ĐẦU
                  </button>
                </div>
              )}
            </form>
          )}

        </div>

      </div>

      {/* ----------------- 2-TIER FORGOT PASSWORD MODAL ----------------- */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Khôi phục Mật khẩu Phụ huynh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setIsAnswerVerified(false);
                  setForgotError('');
                  setForgotSuccessMsg('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-Tier Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setForgotTab('question');
                  setForgotError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  forgotTab === 'question'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tầng 1: Câu hỏi bí mật</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotTab('backup');
                  setForgotError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  forgotTab === 'backup'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Tầng 2: Tệp sao lưu (.json)</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              {/* TẦNG 1: CÂU HỎI BÍ MẬT */}
              {forgotTab === 'question' && (
                <div>
                  {!isAnswerVerified ? (
                    <form onSubmit={handleVerifySecurityQuestion} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Câu hỏi bí mật đã cài đặt:
                        </label>
                        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900">
                          {family.securityQuestion || 'Năm sinh của Mẹ (hoặc Bố)?'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Nhập câu trả lời chính xác:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nhập câu trả lời bạn đã lưu..."
                          value={forgotAnswerInput}
                          onChange={(e) => setForgotAnswerInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden"
                          autoFocus
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Xác thực câu trả lời
                      </button>
                    </form>
                  ) : (
                    /* Sau khi xác thực đúng -> Nhập mật khẩu mới */
                    <form onSubmit={handleSaveResetPassword} className="space-y-3.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Mật khẩu mới (4-8 ký tự):
                        </label>
                        <div className="relative">
                          <input
                            type={forgotShowPassword ? 'text' : 'password'}
                            required
                            maxLength={8}
                            placeholder="Nhập mật khẩu mới"
                            value={forgotNewPin}
                            onChange={(e) => setForgotNewPin(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-mono outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setForgotShowPassword(!forgotShowPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {forgotShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Xác nhận lại mật khẩu mới:
                        </label>
                        <input
                          type={forgotShowPassword ? 'text' : 'password'}
                          required
                          maxLength={8}
                          placeholder="Nhập lại mật khẩu mới"
                          value={forgotConfirmPin}
                          onChange={(e) => setForgotConfirmPin(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-mono outline-hidden"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Lưu mật khẩu mới & Đăng nhập
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TẦNG 2: NẠP TỆP SAO LƯU */}
              {forgotTab === 'backup' && (
                <div className="space-y-3.5 text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Khôi phục từ tệp sao lưu gia đình
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Nếu không nhớ câu hỏi bảo mật, bạn chỉ cần chọn tệp sao lưu <b className="font-mono text-slate-700">.json</b> đã tải về trước đây để khôi phục 100% dữ liệu và mật khẩu.
                    </p>
                  </div>

                  <label className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                    <FileJson className="w-4 h-4" />
                    <span>Chọn tệp sao lưu (.json) từ máy tính</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        if (onImportBackupData) {
                          onImportBackupData(e);
                          setIsForgotModalOpen(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PARENT MANAGEMENT LIGHTBOX MODAL (FLAT MINIMALIST) ----------------- */}
      {isParentLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
            
            {/* Lightbox Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                  👨‍👩‍👧
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Góc Quản Lý Phụ Huynh
                  </h2>
                  <p className="text-xs text-slate-500">
                    Gia đình: <b className="text-slate-700">{family.parentName}</b> • Mã: <span className="font-mono font-bold text-blue-600">{family.familyCode}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsParentLightboxOpen(false);
                  setEditingChild(null);
                }}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flat Sub-Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveLightboxTab('children');
                  setEditingChild(null);
                }}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeLightboxTab === 'children'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh sách con ({family.children?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLightboxTab('add_child');
                  setEditingChild(null);
                }}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeLightboxTab === 'add_child'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo tài khoản con mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveLightboxTab('settings');
                  setEditingChild(null);
                }}
                className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeLightboxTab === 'settings'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Cài đặt & Mật khẩu
              </button>
            </div>

            {/* Lightbox Body Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* ---------------- TAB 1: DANH SÁCH CON ---------------- */}
              {activeLightboxTab === 'children' && (
                <div className="space-y-4">
                  {editingChild ? (
                    /* EDIT CHILD FORM */
                    <form onSubmit={handleSaveEditChild} className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900">
                          Chỉnh sửa hồ sơ: {editingChild.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingChild(null)}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Tên con / Người học:
                          </label>
                          <input
                            type="text"
                            required
                            value={editChildName}
                            onChange={(e) => setEditChildName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:border-blue-500 outline-hidden bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Lớp / Trình độ:
                          </label>
                          <input
                            type="text"
                            required
                            value={editChildGrade}
                            onChange={(e) => setEditChildGrade(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:border-blue-500 outline-hidden bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Biểu tượng đại diện:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {AVATAR_OPTIONS.map((av) => (
                            <button
                              key={av}
                              type="button"
                              onClick={() => setEditChildAvatar(av)}
                              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                editChildAvatar === av 
                                  ? 'bg-blue-600 text-white shadow-xs' 
                                  : 'bg-white border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingChild(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* LIST OF CHILDREN */
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Các tài khoản con đang học trong gia đình:
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveLightboxTab('add_child')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm con mới
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {family.children && family.children.length > 0 ? (
                          family.children.map((child) => (
                            <div
                              key={child.id}
                              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between transition-colors shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl">
                                  {child.avatar || '👦'}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    {child.name}
                                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                      {child.className || (child.grade ? `Lớp ${child.grade}` : 'Học sinh')}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Mã HS: <span className="font-mono text-slate-700">{child.studentCode || 'HS' + child.id.slice(-3)}</span>
                                    {child.pin && ` • Mật khẩu: ${child.pin}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditChild(child)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Chỉnh sửa hồ sơ"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChild(child.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa hồ sơ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsParentLightboxOpen(false);
                                    onSelectChild(child);
                                  }}
                                  className="ml-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                                >
                                  Vào học
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-400">
                            Chưa có hồ sơ con nào. Vui lòng bấm &quot;Tạo tài khoản con mới&quot;.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- TAB 2: TẠO CON MỚI ---------------- */}
              {activeLightboxTab === 'add_child' && (
                <form onSubmit={handleAddNewChild} className="space-y-4">
                  {childSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {childSuccessMessage}
                    </div>
                  )}

                  {childFormError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      {childFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên con / Người học:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Minh Anh / Tuấn Kiệt"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lớp / Trình độ:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Lớp 7 / Lớp 10 / Đại học"
                        value={newChildGrade}
                        onChange={(e) => setNewChildGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {GRADE_PRESETS.slice(0, 6).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setNewChildGrade(g)}
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-medium cursor-pointer"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Chọn biểu tượng Avatar đại diện:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setNewChildAvatar(av)}
                          className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                            newChildAvatar === av
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      LƯU VÀ TẠO TÀI KHOẢN CON
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- TAB 3: CÀI ĐẶT & MẬT KHẨU PHỤ HUYNH ---------------- */}
              {activeLightboxTab === 'settings' && (
                <form onSubmit={handleSaveParentSettings} className="space-y-4">
                  {settingsSavedMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {settingsSavedMsg}
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên hiển thị của Phụ Huynh:
                      </label>
                      <input
                        type="text"
                        required
                        value={lightboxParentName}
                        onChange={(e) => setLightboxParentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu Phụ Huynh (4-8 ký tự):
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={lightboxParentPin}
                        onChange={(e) => setLightboxParentPin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-mono font-bold outline-hidden bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Mã Gia Đình (6 - 8 ký tự):
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomFamilyCode}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Tạo mã mới</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={8}
                          value={lightboxFamilyCode}
                          onChange={(e) => {
                            const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                            setLightboxFamilyCode(clean);
                          }}
                          className="w-full px-3 py-2 pr-16 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-mono font-bold outline-hidden bg-white uppercase"
                        />
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          lightboxFamilyCode.length >= 6 && lightboxFamilyCode.length <= 8
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lightboxFamilyCode.length}/8
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Con dùng mã gia đình này để đăng nhập nhanh trên các thiết bị khác.
                      </p>
                    </div>

                    {/* Security Question Settings */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Cài đặt Câu hỏi bảo mật:</span>
                      </div>
                      <select
                        value={lightboxSecurityQuestion}
                        onChange={(e) => setLightboxSecurityQuestion(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 outline-hidden font-medium"
                      >
                        {DEFAULT_SECURITY_QUESTIONS.map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Nhập câu trả lời bí mật..."
                        value={lightboxSecurityAnswer}
                        onChange={(e) => setLightboxSecurityAnswer(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      LƯU CÀI ĐẶT PHỤ HUYNH
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Lightbox Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsParentLightboxOpen(false);
                  onSelectParent();
                }}
                className="text-xs text-slate-600 hover:text-blue-700 font-bold underline cursor-pointer"
              >
                Vào giao diện Thời khóa biểu (Chế độ Phụ huynh)
              </button>

              <button
                type="button"
                onClick={() => setIsParentLightboxOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
