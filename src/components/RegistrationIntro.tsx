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
  Cloud,
  Link,
  QrCode
} from 'lucide-react';
import { fetchFamilyByCodeFromCloud, syncFamilyByCodeToCloud } from '../lib/firebase';
import { QRCodeSVG } from 'qrcode.react';

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
  const [parentSubMode, setParentSubMode] = useState<'login' | 'register'>(() => {
    return family.parentPin ? 'login' : 'register';
  });
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
  const [isRegistrationLightboxOpen, setIsRegistrationLightboxOpen] = useState(false);
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
  
  // Magic link state
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [qrModalChild, setQrModalChild] = useState<ChildProfile | null>(null);

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
              setStudentChildId(prev => {
                // If we already have a childId that matches one of the children in the loaded family, keep it!
                if (prev && cloudFamily.children.some(c => c.id === prev)) {
                  return prev;
                }
                return cloudFamily.children[0].id;
              });
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
  const [isSyncing, setIsSyncing] = useState(false);

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
  const handleSaveParentSettings = async (e: React.FormEvent) => {
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
    setIsSyncing(true);
    try {
      await syncFamilyByCodeToCloud(updatedFam);
      setSettingsSavedMsg('Đã lưu & đồng bộ tài khoản lên đám mây thành công!');
    } catch (err) {
      console.error(err);
      setSettingsSavedMsg('Lỗi đồng bộ đám mây, vui lòng thử lại!');
    } finally {
      setIsSyncing(false);
    }
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

    // If in login mode and family already has parent pin
    if (parentSubMode === 'login' && family.parentPin) {
      if (parentPin.trim() === family.parentPin) {
        if (parentName.trim() && parentName.trim() !== family.parentName) {
          const updated = {
            ...family,
            parentName: parentName.trim(),
          };
          onUpdateFamily(updated);
          await syncFamilyByCodeToCloud(updated);
        }
        // Go directly to parent mode inside the app
        onSelectParent();
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
    
    // Auto-generate clean family code if needed (GD + 4 digits)
    let cleanFamCode = customFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanFamCode.length < 6 || cleanFamCode.length > 8) {
      cleanFamCode = `GD${Math.floor(1000 + Math.random() * 9000)}`;
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

    setIsSyncing(true);
    try {
      onUpdateFamily(newFamily);
      await syncFamilyByCodeToCloud(newFamily);
      setIsParentLightboxOpen(true);
    } catch (err) {
      console.error(err);
      setParentError('Không thể đồng bộ lên đám mây, vui lòng kiểm tra kết nối!');
    } finally {
      setIsSyncing(false);
    }
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

  const handleCopyMagicLink = (child: ChildProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('family', family.familyCode || '');
    url.searchParams.set('child', child.id);
    navigator.clipboard?.writeText(url.toString());
    setCopiedLinkId(child.id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const getMagicLink = (child: ChildProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('family', family.familyCode || '');
    url.searchParams.set('child', child.id);
    return url.toString();
  };

  const handlePasteMagicLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setStudentError('');
    
    if (!val) {
      setStudentFamilyCode('');
      return;
    }

    try {
      let urlObj: URL;
      if (val.startsWith('http://') || val.startsWith('https://')) {
        urlObj = new URL(val);
      } else {
        // Fallback for relative urls or raw query strings
        const testUrl = val.startsWith('?') ? val : '?' + val;
        urlObj = new URL(testUrl, window.location.href);
      }

      const famCode = urlObj.searchParams.get('family');
      const childId = urlObj.searchParams.get('child');

      if (famCode) {
        setStudentFamilyCode(famCode.toUpperCase());
        if (childId) {
          setStudentChildId(childId);
        }
      } else {
        setStudentError('Đường link không đúng định dạng Magic Link. Hãy dán đúng Link Kích Hoạt được gửi từ Góc Phụ Huynh nhé!');
      }
    } catch (err) {
      setStudentError('Đường link không hợp lệ. Hãy dán đúng Link Kích Hoạt được gửi từ Góc Phụ Huynh nhé!');
    }
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
        <div className={`w-full max-w-sm mx-auto space-y-6 sm:space-y-8 ${formMode === 'main' ? 'mt-2 sm:mt-6 mb-auto' : 'my-auto'}`}>
          
          {/* Top Icon + Header (Chỉ hiển thị khi ở màn hình chọn chính) */}
          {formMode === 'main' && (
            <div className="text-left space-y-3.5 animate-in fade-in duration-200">
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
          )}

          {/* ----------------- SUB-VIEW: 2 MAIN BUTTONS ----------------- */}
          {formMode === 'main' && (
            <div className="space-y-3.5 pt-1">
              
              {/* Option 1: Dành cho Phụ Huynh */}
              <button
                type="button"
                onClick={() => {
                  if (family.parentPin) {
                    setFormMode('parent_panel');
                    setParentSubMode('login');
                    setParentError('');
                  } else {
                    setIsRegistrationLightboxOpen(true);
                    setParentError('');
                  }
                }}
                className="w-full py-3.5 px-4 rounded-xl border border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-slate-800 font-semibold text-sm transition-all duration-200 shadow-2xs flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base group-hover:bg-blue-100 transition-colors">
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
                className="w-full py-3.5 px-4 rounded-xl border border-emerald-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-slate-800 font-semibold text-sm transition-all duration-200 shadow-2xs flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base group-hover:bg-emerald-100 transition-colors">
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
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
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
                  Kích Hoạt TKB
                </span>
              </div>

              {studentError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* Verified Family -> Show Activation Confirmation Card */}
              {isFamilyCodeValid ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  {/* Premium Success Badge */}
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-900 font-extrabold text-sm block">
                      Đã Kết Nối Thành Công!
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      Đã nhận diện bàn học của bạn trên hệ thống đám mây
                    </span>
                  </div>

                  {/* Highlighted active child card */}
                  {(() => {
                    const activeChild = family.children?.find(c => c.id === studentChildId) || family.children?.[0];
                    if (!activeChild) return null;
                    return (
                      <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 text-center relative overflow-hidden shadow-md">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {activeChild.className || (activeChild.grade ? `Lớp ${activeChild.grade}` : 'Học sinh')}
                        </div>
                        <div className="text-5xl mb-3 transform hover:scale-110 transition-transform select-none">
                          {activeChild.avatar || '👦'}
                        </div>
                        <h4 className="text-lg font-black text-slate-900">
                          {activeChild.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Chào mừng con quay lại góc học tập nhé!
                        </p>
                      </div>
                    );
                  })()}

                  {/* Remember Device Checkbox */}
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs text-slate-600 select-none border border-slate-100 bg-white">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">
                      Ghi nhớ trên máy này (Lần sau tự động vào học)
                    </span>
                  </label>

                  {/* Submit Button to enter */}
                  <button
                    type="button"
                    onClick={handleStudentLogin}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                  >
                    <span>BẮT ĐẦU VÀO HỌC NGAY</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Unactivated State - Paste Link UI only */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-800 mb-2">
                      <span>🔗 Dán Link Kích Hoạt (Magic Link) vào đây:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Bấm chuột phải -> Chọn Dán (Paste) đường link..."
                        onChange={handlePasteMagicLink}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-dashed border-emerald-500 hover:border-emerald-600 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 text-center text-xs md:text-sm font-bold outline-hidden bg-emerald-50/80 text-slate-900 placeholder:text-emerald-700/80 shadow-md shadow-emerald-600/10 transition-all"
                      />
                      {isSearchingCloud && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Help Card */}
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-left space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      Làm sao để lấy Link Kích Hoạt?
                    </h4>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Bố Mẹ vào mục <b>Phụ Huynh</b> và Đăng nhập bằng mật khẩu gia đình.</li>
                      <li>Tại thẻ tên của con, bấm nút <b>🔗 Sao chép Link</b> hoặc nút <b>📱 Mã QR</b>.</li>
                      <li>Bố Mẹ gửi link đó qua Zalo/Messenger cho con hoặc con quét mã QR trên màn hình.</li>
                    </ul>
                    <div className="pt-1.5 border-t border-blue-200/60 text-[10px] text-blue-700 font-semibold leading-relaxed">
                      🔒 Bảo mật: Việc đăng nhập không dùng mật khẩu giúp góc học tập của con an toàn tuyệt đối khỏi kẻ xấu!
                    </div>
                  </div>
                </div>
              )}
            </div>
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

              {/* Tab Selector for Parent: Login vs Register */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-4 text-xs font-extrabold border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setParentSubMode('login');
                    setParentError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    parentSubMode === 'login'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02] ring-2 ring-blue-400/50'
                      : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="text-sm">🔑</span>
                  <span>Đăng Nhập</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParentSubMode('register');
                    setParentError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    parentSubMode === 'register'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/50'
                      : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-bold'
                  }`}
                >
                  <span className="text-sm">✨</span>
                  <span>Tạo Gia Đình Mới</span>
                </button>
              </div>

              {/* If in login mode and family already has PIN */}
              {parentSubMode === 'login' && family.parentPin ? (
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

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistrationLightboxOpen(true);
                        setParentError('');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                    >
                      Chưa có tài khoản? Tạo gia đình mới ngay
                    </button>
                  </div>
                </div>
              ) : (
                /* If register mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tên của bạn (Phụ Huynh / Thầy Cô):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Ba Nam / Mẹ Hương"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Mật khẩu quản lý (4 - 8 chữ số PIN):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={8}
                        placeholder="VD: 123456"
                        value={parentPin}
                        onChange={(e) => setParentPin(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 focus:border-blue-500 font-mono text-center text-xs tracking-wider outline-hidden bg-white"
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

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Hồ sơ người học (Con / Học sinh đầu tiên):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên học sinh (VD: Minh)"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Lớp / Khối (VD: Lớp 7)"
                        value={childGrade}
                        onChange={(e) => setChildGrade(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs outline-hidden bg-white font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>KHỞI TẠO GÓC GIA ĐÌNH 🚀</span>
                  </button>

                  {family.parentPin && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setParentSubMode('login');
                          setParentError('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                      >
                        Đã có tài khoản gia đình? Quay lại Đăng Nhập
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

        </div>

      </div>

      {/* ----------------- REGISTRATION LIGHTBOX MODAL: GÓC QUẢN LÝ PHỤ HUYNH (50% WIDTH) ----------------- */}
      {isRegistrationLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full md:w-[50%] md:max-w-[50%] lg:w-[48%] max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
            
            {/* Header - Bright Blue Solid Style */}
            <div className="px-6 py-5 bg-blue-600 text-white flex items-center justify-between shrink-0 relative">
              <button
                type="button"
                onClick={() => setIsRegistrationLightboxOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-blue-100 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-400">
                  👨‍👩‍👧
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                    Góc Quản Lý Phụ Huynh
                  </h2>
                  <p className="text-xs text-blue-100 font-medium">Khởi tạo không gian gia đình học tập thông minh &amp; bảo mật</p>
                </div>
              </div>
            </div>

            {/* Scrollable Registration Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setParentError('');

                if (!parentName.trim()) {
                  setParentError('Vui lòng nhập tên Phụ Huynh!');
                  return;
                }
                if (parentPin.length < 4 || parentPin.length > 8) {
                  setParentError('Mật khẩu PIN phải từ 4 đến 8 ký tự!');
                  return;
                }
                if (!parentSecurityAnswer.trim()) {
                  setParentError('Vui lòng điền câu trả lời bí mật để tự khôi phục khi quên mật khẩu!');
                  return;
                }
                if (!childName.trim()) {
                  setParentError('Vui lòng điền tên con / người học đầu tiên!');
                  return;
                }

                // Generate family code
                let cleanFamCode = customFamilyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (cleanFamCode.length < 6 || cleanFamCode.length > 8) {
                  cleanFamCode = `GD${Math.floor(1000 + Math.random() * 9000)}`;
                }

                const firstChild: ChildProfile = {
                  id: 'student_' + Date.now().toString(),
                  name: childName.trim(),
                  grade: childGrade,
                  className: childGrade,
                  avatar: childAvatar,
                  studentCode: (childName.trim()).slice(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90),
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
                await syncFamilyByCodeToCloud(newFamily);

                // Close and enter parent mode instantly!
                setIsRegistrationLightboxOpen(false);
                onSelectParent();
              }}
              className="p-6 overflow-y-auto space-y-4 flex-1 text-left"
            >
              {parentError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{parentError}</span>
                </div>
              )}

              {/* Block 1: Bố Mẹ */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="text-[11px] font-black text-blue-600 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <span>👤</span> Thông tin của Phụ Huynh / Thầy Cô
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên của bạn:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Ba Nam / Mẹ Hương"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu PIN quản lý (4-8 ký tự):
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        maxLength={8}
                        placeholder="VD: 123456"
                        value={parentPin}
                        onChange={(e) => setParentPin(e.target.value)}
                        className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-300 focus:border-blue-500 font-mono text-center text-xs tracking-wider outline-hidden bg-white shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Ẩn' : 'Hiện'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2: Mã gia đình & Bảo mật */}
              <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3.5">
                <div className="text-[11px] font-black text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-1.5">
                  <span>🔐</span> Bảo mật gia đình &amp; khôi phục
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã gia đình dùng chung (tự động):
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      required
                      value={customFamilyCode}
                      onChange={(e) => setCustomFamilyCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 font-mono font-bold text-center text-xs tracking-widest outline-hidden bg-white text-blue-900 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Câu hỏi khôi phục:
                    </label>
                    <select
                      value={parentSecurityQuestion}
                      onChange={(e) => setParentSecurityQuestion(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-medium bg-white outline-hidden shadow-2xs"
                    >
                      {DEFAULT_SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Câu trả lời bí mật (Không dấu, ghi nhớ để khôi phục mật khẩu):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: nam 1982 / banh mi"
                    value={parentSecurityAnswer}
                    onChange={(e) => setParentSecurityAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs font-semibold outline-hidden bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Block 3: Con đầu tiên */}
              <div className="bg-emerald-50/15 p-4 rounded-xl border border-emerald-100 space-y-3.5">
                <div className="text-[11px] font-black text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <span>👦</span> Hồ sơ con / học sinh đầu tiên
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên hiển thị của con:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Minh / Lan"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-semibold outline-hidden bg-white shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lớp / Khối học:
                    </label>
                    <select
                      value={childGrade}
                      onChange={(e) => setChildGrade(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs font-medium bg-white outline-hidden shadow-2xs"
                    >
                      {GRADE_PRESETS.map((gr) => (
                        <option key={gr} value={gr}>{gr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chọn nhanh ảnh đại diện của con:
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setChildAvatar(av)}
                        className={`text-lg p-1.5 rounded-lg hover:bg-white active:scale-90 transition-all cursor-pointer ${
                          childAvatar === av ? 'bg-white border border-blue-400 shadow-xs ring-2 ring-blue-100' : 'border border-transparent'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons inside form */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegistrationLightboxOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>KHỞI TẠO GIA ĐÌNH 🚀</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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

                              <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMagicLink(child)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    copiedLinkId === child.id
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                  }`}
                                  title="Sao chép link kết nối trực tiếp cho bé"
                                >
                                  {copiedLinkId === child.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Đã chép link!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Link className="w-3.5 h-3.5 text-blue-500" />
                                      <span className="hidden sm:inline">Sao chép Link</span>
                                      <span className="sm:hidden">Link</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setQrModalChild(child)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Hiển thị mã QR đăng nhập nhanh"
                                >
                                  <QrCode className="w-4 h-4 text-slate-600" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleStartEditChild(child)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa hồ sơ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChild(child.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 border border-slate-200 bg-white hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Xóa hồ sơ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

      {/* SUB-MODAL: QR CODE */}
      {qrModalChild && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative text-center">
            <button
              type="button"
              onClick={() => setQrModalChild(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1.5">
              Mã QR Đăng Nhập Nhanh
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Quét mã này bằng Zalo hoặc Camera để bé <strong className="text-blue-600">{qrModalChild.name}</strong> vào thẳng góc học tập!
            </p>
            
            <div className="flex justify-center mb-5 p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-sm">
              <QRCodeSVG 
                value={getMagicLink(qrModalChild)} 
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            
            <button
              type="button"
              onClick={() => {
                handleCopyMagicLink(qrModalChild);
                setQrModalChild(null);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Link className="w-4 h-4" />
              <span>Sao chép Link thay vì quét mã</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
