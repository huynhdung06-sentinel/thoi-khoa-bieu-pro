import confetti from 'canvas-confetti';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClassInfo, 
  TimetableSlot, 
  Lesson, 
  LessonPlan, 
  StudyRecord, 
  UserRole,
  PeriodInfo,
  DashboardTab,
  DocumentItem,
  Subject,
  ChildProfile,
  FamilyAccount
} from './types';
import { 
  INITIAL_CLASS_INFO, 
  STANDARD_PERIODS, 
  INITIAL_TIMETABLE_SLOTS, 
  INITIAL_LESSONS_BANK, 
  INITIAL_DOCUMENTS,
  generateInitialLessonPlans, 
  generateInitialStudyRecords,
  SUBJECTS_LIST 
} from './data/mockData';
import { getVietnamCurrentMondayStr, getVietnamTodayString, getTodayVietnamInfo } from './utils/dateUtils';
import { saveSafeItem, setLocalStorageItemSafe, getSafeItemAsync, getSafeItemSync, clearProfileStorage } from './utils/safeStorage';
import { 
  getChildData, 
  saveChildData, 
  auth, 
  signOut, 
  signInWithGoogle, 
  createFamilyAccount, 
  createChildProfile,
  syncFamilyByCodeToCloud,
  fetchFamilyByCodeFromCloud,
  syncChildDataByCodeToCloud,
  fetchChildDataByCodeFromCloud
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { VictoryLightbox } from './components/VictoryLightbox';
import { ShareModal } from './components/ShareModal';
import html2canvas from 'html2canvas';
import { toPng, toJpeg } from 'html-to-image';
import { HeaderTimetable } from './components/HeaderTimetable';
import { VietnameseTimetableGrid } from './components/VietnameseTimetableGrid';
import { AnalyticsView } from './components/AnalyticsView';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { LessonDetailAndMindmapModal } from './components/LessonDetailAndMindmapModal';
import { MindmapGalleryModal } from './components/MindmapGalleryModal';
import { LessonBankManagerModal } from './components/LessonBankManagerModal';
import { VuLangLibraryView } from './components/VuLangLibraryView';
import { KnowledgeSummaryView } from './components/KnowledgeSummaryView';
import { ClassSettingsModal } from './components/ClassSettingsModal';
import { EditPeriodTimesModal } from './components/EditPeriodTimesModal';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { RegistrationIntro } from './components/RegistrationIntro';
import { ParentPinChallengeModal } from './components/ParentPinChallengeModal';
import { ParentDashboardModal } from './components/ParentDashboardModal';
import { AboutStoryModal } from './components/AboutStoryModal';
import { BackupReminderModal } from './components/BackupReminderModal';
import { FamilyCodeCardModal } from './components/FamilyCodeCardModal';
import { UnifiedFamilyModal } from './components/UnifiedFamilyModal';
import { 
  getBackupStatus, 
  createBackupPackage, 
  validateAndParseBackup, 
  setLastBackupTimestamp, 
  incrementUnsavedChanges, 
  resetUnsavedChanges 
} from './utils/backupManager';
import { BookOpen, ShieldAlert, Sparkles, CheckCircle2, FileText, Award, Calendar, BarChart3, GraduationCap } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'mindmap_school_v2_';

const getParentPinFromStorage = (fallback: string = '1234'): string => {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}parent_pin`) || fallback;
  } catch (e) {
    console.warn('[SafeStorage] localStorage blocked/unavailable:', e);
    return fallback;
  }
};

const setParentPinToStorage = (pin: string) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}parent_pin`, pin);
  } catch (e) {
    console.warn('[SafeStorage] localStorage blocked/unavailable:', e);
  }
};

export default function App() {
  const [showParentPin, setShowParentPin] = useState(false);
  const [parentPinCallback, setParentPinCallback] = useState<(() => void) | null>(null);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showAboutStory, setShowAboutStory] = useState(false);

  // 0. Family Account Profiles state
  const [family, setFamily] = useState<FamilyAccount>(() => {
    try {
      const saved = getSafeItemSync<FamilyAccount>(`${STORAGE_KEY_PREFIX}family_account`);
      if (saved && saved.children && saved.children.length > 0) {
        if (!saved.familyCode) {
          saved.familyCode = 'GD' + Math.floor(1000 + Math.random() * 9000);
        }
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    const savedPin = getParentPinFromStorage('1234');
    const savedClass = getSafeItemSync<ClassInfo>(`${STORAGE_KEY_PREFIX}class_info`);
    const studentName = savedClass?.studentName || 'Bảo Nam';
    const defaultFamilyCode = 'GD' + Math.floor(1000 + Math.random() * 9000);
    return {
      familyCode: defaultFamilyCode,
      parentName: 'Bố Mẹ',
      parentPin: savedPin,
      children: [
        { id: 'child-1', name: studentName, grade: 9, className: '9A1', avatar: '🚀' },
        { id: 'child-2', name: 'Hà My', grade: 6, className: '6A2', avatar: '🐱' },
      ]
    };
  });

  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return Boolean(urlParams.get('family') && urlParams.get('child'));
  });

  useEffect(() => {
    saveSafeItem(`${STORAGE_KEY_PREFIX}family_account`, family);
    if (family.parentPin) {
      setParentPinToStorage(family.parentPin);
    }
    if (family.familyCode) {
      syncFamilyByCodeToCloud(family).catch(err => console.error('Cloud family sync error:', err));
    }
  }, [family]);

  // Sync latest family data & Handle Magic Direct Link on startup
  useEffect(() => {
    let isCancelled = false;
    const checkCloudFamily = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlFamilyCode = urlParams.get('family');
        const urlChildId = urlParams.get('child');
        
        const targetFamilyCode = urlFamilyCode || localStorage.getItem('mindmap_remembered_family_code') || family.familyCode;
        
        if (targetFamilyCode) {
          const cloudFam = await fetchFamilyByCodeFromCloud(targetFamilyCode);
          if (!isCancelled && cloudFam) {
            setFamily(prev => {
              const updatedFam = {
                ...prev,
                ...cloudFam,
                children: cloudFam.children && cloudFam.children.length > 0 ? cloudFam.children : prev.children
              };
              
              // Handle Magic Direct Link Auto-login
              if (urlFamilyCode && urlChildId) {
                const targetChild = updatedFam.children.find(c => c.id === urlChildId) || updatedFam.children[0];
                if (targetChild) {
                  setActiveChildProfile(targetChild);
                  localStorage.setItem('mindmap_remembered_student_id', targetChild.id);
                  localStorage.setItem('mindmap_remembered_family_code', targetFamilyCode);
                  setIsIntroOpen(false);
                  
                  // Clean URL to keep it pretty
                  const url = new URL(window.location.href);
                  url.searchParams.delete('family');
                  url.searchParams.delete('child');
                  window.history.replaceState({}, '', url.toString());
                }
              }
              return updatedFam;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching initial cloud family:', err);
      } finally {
        if (!isCancelled) {
          setIsCloudLoading(false);
        }
      }
    };
    checkCloudFamily();
    return () => { isCancelled = true; };
  }, []);

  // Active child profile & Auto-login for remembered device
  const [activeChildProfile, setActiveChildProfile] = useState<ChildProfile | null>(() => {
    try {
      const rememberedId = localStorage.getItem('mindmap_remembered_student_id');
      if (rememberedId && family.children && family.children.length > 0) {
        const found = family.children.find(c => c.id === rememberedId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return family.children[0] || null;
  });

  // Màn hình Intro: Nếu máy con đã được ghi nhớ -> vào thẳng! Nếu chưa -> mở màn hình chọn hồ sơ / đăng nhập
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(() => {
    try {
      const rememberedId = localStorage.getItem('mindmap_remembered_student_id');
      if (rememberedId && family.children && family.children.length > 0) {
        const found = family.children.find(c => c.id === rememberedId);
        if (found) return false; // Auto skip intro into student app
      }
    } catch (e) {
      console.error(e);
    }
    return true;
  });

  const [showFamilyCodeModal, setShowFamilyCodeModal] = useState<boolean>(false);

  // Chế độ Khách (Play as Guest) & Trải nghiệm nhanh 10 phút
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY_PREFIX}is_guest`) === 'true';
    } catch {
      return false;
    }
  });

  // Demo 10-minute countdown state
  const [demoTimeRemaining, setDemoTimeRemaining] = useState<number | null>(() => {
    try {
      const expiresStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}demo_expires_at`);
      if (expiresStr) {
        const expiresAt = parseInt(expiresStr, 10);
        const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (diff > 0) return diff;
      }
    } catch {}
    return null;
  });
  const [showDemoExpiredModal, setShowDemoExpiredModal] = useState<boolean>(false);
  const [showAccountLinkingModal, setShowAccountLinkingModal] = useState<boolean>(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState<boolean>(false);
  const [linkingError, setLinkingError] = useState<string>('');

  // 1. Dashboard Tab Navigation
  const [activeTab, setActiveTab] = useState<DashboardTab>('timetable');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedLessonIdForLibrary, setSelectedLessonIdForLibrary] = useState<string | undefined>(undefined);
  const [selectedSubjectForLibrary, setSelectedSubjectForLibrary] = useState<string | undefined>(undefined);

  // Local-First Backup Sentinel
  const [backupStatus, setBackupStatus] = useState(() => getBackupStatus());
  const [showBackupReminderModal, setShowBackupReminderModal] = useState<boolean>(false);

  // Periodic and change-based backup status refresh
  const refreshBackupStatus = () => {
    const updated = getBackupStatus();
    setBackupStatus(updated);
    if (updated.status === 'warning' && (updated.unsavedCount >= 5 || updated.daysSinceLastBackup >= 5)) {
      // Auto trigger gentle reminder if not currently in intro
      if (!isIntroOpen) {
        setShowBackupReminderModal(true);
      }
    }
  };

  // Check backup status on mount and periodically
  useEffect(() => {
    refreshBackupStatus();
    const interval = setInterval(refreshBackupStatus, 60000); // every 1 min
    return () => clearInterval(interval);
  }, [isIntroOpen]);

  // Beforeunload warning if user has multiple unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const current = getBackupStatus();
      if (current.unsavedCount >= 3) {
        e.preventDefault();
        e.returnValue = 'Bạn có dữ liệu mới chưa tải file sao lưu về máy. Bạn có chắc muốn rời đi?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Always ensure light mode on html tag
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}dark_mode`);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 3. User Role: 'student' | 'admin'
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}role`);
      if (saved === 'student' || saved === 'admin') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'student';
  });

  useEffect(() => {
    setLocalStorageItemSafe(`${STORAGE_KEY_PREFIX}role`, currentRole);
  }, [currentRole]);

  // Hydration state for child-specific data isolation
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratingRef = useRef<boolean>(false);

  // 4. Class Info
  const [classInfo, setClassInfo] = useState<ClassInfo>(() => {
    return {
      ...INITIAL_CLASS_INFO,
      weekStartDate: getVietnamCurrentMondayStr()
    };
  });

  // 5. Subjects
  const [subjects, setSubjects] = useState<Subject[]>(() => SUBJECTS_LIST);

  // 6. Timetable Slots
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => INITIAL_TIMETABLE_SLOTS);

  // 7. Lessons Bank
  const [lessons, setLessons] = useState<Lesson[]>(() => INITIAL_LESSONS_BANK);

  // 8. Lesson Plans
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(() => {
    return generateInitialLessonPlans(INITIAL_TIMETABLE_SLOTS, getVietnamCurrentMondayStr());
  });

  // 9. Study Records (Mindmap Proof of Work)
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>(() => {
    const plans = generateInitialLessonPlans(INITIAL_TIMETABLE_SLOTS, getVietnamCurrentMondayStr());
    return generateInitialStudyRecords(plans, INITIAL_CLASS_INFO.studentName);
  });

  // 10. Document Hub Items (Upload & Share fast localhost files)
  const [documents, setDocuments] = useState<DocumentItem[]>(() => INITIAL_DOCUMENTS);

  // 11. Period Times State (Khung giờ các tiết học)
  const [periods, setPeriods] = useState<PeriodInfo[]>(() => STANDARD_PERIODS);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentParentUserId, setStudentParentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY_PREFIX}student_parent_uid`);
    } catch {
      return null;
    }
  });

  const effectiveUserId = currentUser?.uid || studentParentUserId;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setStudentParentUserId(user.uid);
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}student_parent_uid`, user.uid);
        } catch {}
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile Hydration Effect (Isolation of Schedules & Study Data)
  useEffect(() => {
    if (!activeChildProfile) {
      setIsHydrated(true);
      return;
    }

    let isMounted = true;
    async function hydrateChildData() {
      const id = activeChildProfile!.id;
      isHydratingRef.current = true;
      setIsHydrated(false);

      try {
        let firebaseData = null;
        if (effectiveUserId) {
          firebaseData = await getChildData(effectiveUserId, id);
        }
        if (!firebaseData && family.familyCode) {
          firebaseData = await fetchChildDataByCodeFromCloud(family.familyCode, id);
        }
        
        if (!isMounted) return;

        if (firebaseData) {
          setClassInfo(firebaseData.classInfo || { ...INITIAL_CLASS_INFO, weekStartDate: getVietnamCurrentMondayStr() });
          setTimetableSlots(firebaseData.timetableSlots || INITIAL_TIMETABLE_SLOTS);
          setSubjects(firebaseData.subjects || SUBJECTS_LIST);
          setPeriods(firebaseData.periods || STANDARD_PERIODS);
          setLessons(firebaseData.lessons || INITIAL_LESSONS_BANK);
          setLessonPlans(firebaseData.lessonPlans || generateInitialLessonPlans(firebaseData.timetableSlots || INITIAL_TIMETABLE_SLOTS, getVietnamCurrentMondayStr()));
          setStudyRecords(firebaseData.studyRecords || []);
          setDocuments(firebaseData.documents || INITIAL_DOCUMENTS);
        } else {
          // Initialize new child state
          const rawGrade = activeChildProfile.className || (activeChildProfile.grade ? String(activeChildProfile.grade) : '7');
          const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
            ? rawGrade
            : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
          
          setClassInfo({
            ...INITIAL_CLASS_INFO,
            studentName: activeChildProfile.name,
            className: finalClass,
            weekStartDate: getVietnamCurrentMondayStr()
          });
          setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
          setSubjects(SUBJECTS_LIST);
          setPeriods(STANDARD_PERIODS);
          setLessons(INITIAL_LESSONS_BANK);
          const activeSlots = INITIAL_TIMETABLE_SLOTS;
          const currentMonday = getVietnamCurrentMondayStr();
          const defaultPlans = generateInitialLessonPlans(activeSlots, currentMonday);
          setLessonPlans(defaultPlans);
          setStudyRecords(generateInitialStudyRecords(defaultPlans, activeChildProfile.name));
          setDocuments(INITIAL_DOCUMENTS);
        }

      } catch (err) {
        console.error('Failed to hydrate profile', err);
      } finally {
        if (isMounted) {
          isHydratingRef.current = false;
          setIsHydrated(true);
        }
      }
    }

    hydrateChildData();
    return () => { isMounted = false; };
  }, [activeChildProfile?.id, effectiveUserId, family.familyCode]);

  // Child-specific Save Effects to Firebase & Cloud by Family Code
  useEffect(() => {
    if (isHydratingRef.current || !isHydrated || !activeChildProfile) return;
    
    // Create a debounce timer to avoid too many writes
    const timer = setTimeout(() => {
      const payload = {
        classInfo,
        subjects,
        timetableSlots,
        lessons,
        lessonPlans,
        studyRecords,
        documents,
        periods
      };

      if (effectiveUserId) {
        saveChildData(effectiveUserId, activeChildProfile.id, payload).catch(console.error);
      }
      if (family.familyCode) {
        syncChildDataByCodeToCloud(family.familyCode, activeChildProfile.id, payload).catch(console.error);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [classInfo, subjects, timetableSlots, lessons, lessonPlans, studyRecords, documents, periods, activeChildProfile?.id, isHydrated, effectiveUserId, family.familyCode]);

  const [isEditPeriodsOpen, setIsEditPeriodsOpen] = useState(false);

  // Document Preview Modal State
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentItem | null>(null);

  // Active Timetable Slot Context for Library Binding
  const [activeTimetableSlotContext, setActiveTimetableSlotContext] = useState<{
    slot: TimetableSlot;
    plan?: LessonPlan;
    dateStr?: string;
  } | null>(null);

  // Library Breadcrumb State tracking active subject, volume, chapter & lesson title
  const [libraryBreadcrumb, setLibraryBreadcrumb] = useState<{
    selectedSubject?: string;
    selectedVolume?: 1 | 2;
    selectedChapter?: string;
    currentLessonTitle?: string;
  }>({});

  // Hidden File input ref for import
  const fileImportInputRef = useRef<HTMLInputElement | null>(null);

  // Modals state
  const [activeSlotForModal, setActiveSlotForModal] = useState<TimetableSlot | null>(null);
  const [activePlanForModal, setActivePlanForModal] = useState<LessonPlan | undefined>(undefined);
  const [activeRecordForModal, setActiveRecordForModal] = useState<StudyRecord | undefined>(undefined);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLessonBankOpen, setIsLessonBankOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Link Guest Account to Google Cloud
  const handleExecuteAccountLinking = async () => {
    setIsLinkingAccount(true);
    setLinkingError('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        const childId = activeChildProfile?.id || 'child_1';
        const childToSave: ChildProfile = activeChildProfile || {
          id: childId,
          name: classInfo.studentName || 'Học sinh',
          grade: 6,
          className: classInfo.className || 'Lớp 6A',
          avatar: '🚀',
        };

        const updatedFamily: FamilyAccount = {
          parentName: user.displayName || family.parentName || 'Bố Mẹ',
          parentPin: family.parentPin || '1234',
          children: family.children && family.children.length > 0 ? family.children : [childToSave]
        };

        await createFamilyAccount(user.uid, {
          parentName: updatedFamily.parentName,
          parentPin: updatedFamily.parentPin
        });

        await createChildProfile(user.uid, childToSave);

        await saveChildData(user.uid, childId, {
          classInfo,
          subjects,
          timetableSlots,
          lessons,
          lessonPlans,
          studyRecords,
          documents,
          periods
        });

        setFamily(updatedFamily);
        setIsGuestMode(false);
        try {
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}is_guest`);
        } catch {}

        setShowAccountLinkingModal(false);
        alert('🎉 Chúc mừng! Thời khóa biểu của bạn đã được sao lưu an toàn lên tài khoản Google.');
      }
    } catch (err: any) {
      console.error('Error linking account:', err);
      const errMsg = err?.message || '';
      if (err?.code === 'auth/unauthorized-domain' || errMsg.includes('auth/unauthorized-domain')) {
        setLinkingError('Tên miền máy chủ chưa được thêm vào Firebase Authorized Domains. Bạn có thể tiếp tục sử dụng bình thường trên thiết bị này!');
      } else {
        setLinkingError('Đăng nhập không thành công: ' + (errMsg || 'Vui lòng thử lại sau.'));
      }
    } finally {
      setIsLinkingAccount(false);
    }
  };

  // Week navigation
  const normalizeToMonday = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const day = date.getDay();
      const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(y, m - 1, diffToMonday);
      const monY = monday.getFullYear();
      const monM = String(monday.getMonth() + 1).padStart(2, '0');
      const monD = String(monday.getDate()).padStart(2, '0');
      return `${monY}-${monM}-${monD}`;
    } catch {
      return getVietnamCurrentMondayStr();
    }
  };

  const handlePrevWeek = () => {
    try {
      const baseMonday = normalizeToMonday(classInfo.weekStartDate);
      const [y, m, d] = baseMonday.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      current.setDate(current.getDate() - 7);
      const newY = current.getFullYear();
      const newM = String(current.getMonth() + 1).padStart(2, '0');
      const newD = String(current.getDate()).padStart(2, '0');
      const newDateStr = `${newY}-${newM}-${newD}`;

      setClassInfo((prev) => ({ ...prev, weekStartDate: newDateStr }));
      setLessonPlans(generateInitialLessonPlans(timetableSlots, newDateStr));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextWeek = () => {
    try {
      const baseMonday = normalizeToMonday(classInfo.weekStartDate);
      const [y, m, d] = baseMonday.split('-').map(Number);
      const current = new Date(y, m - 1, d);
      current.setDate(current.getDate() + 7);
      const newY = current.getFullYear();
      const newM = String(current.getMonth() + 1).padStart(2, '0');
      const newD = String(current.getDate()).padStart(2, '0');
      const newDateStr = `${newY}-${newM}-${newD}`;

      setClassInfo((prev) => ({ ...prev, weekStartDate: newDateStr }));
      setLessonPlans(generateInitialLessonPlans(timetableSlots, newDateStr));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetWeek = () => {
    const currentMonday = getVietnamCurrentMondayStr();
    setClassInfo((prev) => ({ ...prev, weekStartDate: currentMonday }));
    setLessonPlans(generateInitialLessonPlans(timetableSlots, currentMonday));
  };

  // Slot click handler
  const handleSlotClick = (
    slot: TimetableSlot,
    plan?: LessonPlan,
    record?: StudyRecord,
    dateStr?: string
  ) => {
    const targetSubject = (slot.subjectName || plan?.subjectName || '').trim();
    
    // Strict Lock: Do not react if slot is empty or has no subject assigned
    if (!targetSubject || targetSubject === '—' || targetSubject === 'Trống') {
      return;
    }

    // Save timetable selection context
    setActiveTimetableSlotContext({ slot, plan, dateStr });
    setSelectedSubjectForLibrary(targetSubject);

    // Direct link to lesson ONLY if a specific lesson record is completed/displayed on this slot
    let targetLessonId: string | undefined = undefined;
    if (record) {
      targetLessonId =
        record.lessonId ||
        lessons.find(
          (l) =>
            l.subjectName.toLowerCase() === targetSubject.toLowerCase() &&
            l.title === record.lessonTitle
        )?.id;
    }

    if (targetLessonId) {
      // Direct Link: Navigate to Library and immediately open the lesson modal
      setSelectedLessonIdForLibrary(targetLessonId);
    } else {
      // No lesson completed on this slot: Just open the Subject category in the Library
      setSelectedLessonIdForLibrary(undefined);
    }

    setActiveTab('lessons');
  };

  // Submit Mindmap handler (Học sinh nộp bài)
  const handleSubmitMindmap = (
    lessonPlanId: string,
    slot: TimetableSlot,
    imageDataUrl: string,
    studentNote: string,
    showOnTimetable?: boolean
  ) => {
    const existingIndex = studyRecords.findIndex(
      (r) => r.lessonPlanId === lessonPlanId || (r.date === activePlanForModal?.date && r.session === slot.session && r.period === slot.period)
    );

    const newRecord: StudyRecord = {
      id: existingIndex >= 0 ? studyRecords[existingIndex].id : `record-${Date.now()}`,
      lessonPlanId,
      studentName: classInfo.studentName,
      subjectName: slot.subjectName,
      lessonTitle: activePlanForModal?.lessonTitle || `Tiết ${slot.subjectName}`,
      date: activePlanForModal?.date || classInfo.weekStartDate,
      session: slot.session,
      period: slot.period,
      mindmapImageUrl: imageDataUrl,
      studentNote,
      submittedAt: new Date().toISOString(),
      status: 'COMPLETED',
      showOnTimetable: showOnTimetable ?? false,
    };

    setStudyRecords((prev) => {
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });

    setActiveRecordForModal(newRecord);
    setIsSlotModalOpen(false);
    setActiveTimetableSlotContext(null);
    incrementUnsavedChanges();
    refreshBackupStatus();
  };

  // Parent review handler
  const handleParentReview = (
    recordId: string,
    status: 'COMPLETED' | 'NEEDS_REVISION',
    feedback: string
  ) => {
    setStudyRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status,
              parentFeedback: feedback,
              parentReviewedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  // Delete study record
  const handleDeleteRecord = (recordId: string) => {
    setStudyRecords((prev) => prev.filter((r) => r.id !== recordId));
    setActiveRecordForModal(undefined);
  };

  const handleToggleShowOnTimetable = (recordId: string, show: boolean) => {
    setStudyRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, showOnTimetable: show } : r))
    );
    setActiveRecordForModal((prev) =>
      prev && prev.id === recordId ? { ...prev, showOnTimetable: show } : prev
    );
  };

  // Update Plan Admin
  const handleUpdatePlanAdmin = (planId: string, updatedData: Partial<LessonPlan>) => {
    setLessonPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === planId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedData };
        return copy;
      }
      return prev;
    });
  };

  // Update Slot Admin
  const handleUpdateSlotAdmin = (slotId: string, updatedData: Partial<TimetableSlot> | null) => {
    setTimetableSlots((prev) => {
      if (updatedData === null) {
        return prev.filter((s) => s.id !== slotId);
      }
      const idx = prev.findIndex((s) => s.id === slotId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedData };
        return copy;
      } else {
        // Create new slot
        return [...prev, { id: slotId, ...updatedData } as TimetableSlot];
      }
    });
  };

  // Auto distribute lessons engine
  const handleAutoDistributeLessons = (targetSubject?: string) => {
    setLessonPlans((prevPlans) => {
      const updatedPlans = [...prevPlans];
      const allSubjectNames = Array.from(new Set(timetableSlots.map((s) => s.subjectName))).filter(
        (s): s is string => Boolean(s) && s !== 'Chào cờ' && s !== 'SHL'
      );
      const subjectsToDistribute: string[] = targetSubject ? [targetSubject] : allSubjectNames;

      subjectsToDistribute.forEach((subj) => {
        const sLower = (subj || '').toLowerCase();
        const subjLessons = lessons
          .filter((l) => (l.subjectName || '').toLowerCase() === sLower)
          .sort((a, b) => a.lessonNumber - b.lessonNumber);

        if (subjLessons.length === 0) return;

        const matchedPlanIndices = updatedPlans
          .map((p, idx) => ({ p, idx }))
          .filter(
            (item) => (item.p.subjectName || '').toLowerCase() === sLower
          )
          .sort((a, b) => {
            if (a.p.dayOfWeek !== b.p.dayOfWeek) return a.p.dayOfWeek - b.p.dayOfWeek;
            if (a.p.session !== b.p.session) return a.p.session === 'morning' ? -1 : 1;
            return a.p.period - b.p.period;
          });

        matchedPlanIndices.forEach((item, i) => {
          const lessonIndex = i % subjLessons.length;
          const assignedLesson = subjLessons[lessonIndex];
          updatedPlans[item.idx] = {
            ...updatedPlans[item.idx],
            lessonId: assignedLesson.id,
            lessonTitle: assignedLesson.title,
            summary: assignedLesson.summary,
            keyPoints: assignedLesson.keyPoints,
          };
        });
      });

      return updatedPlans;
    });
  };

  // Document actions
  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (activePreviewDoc?.id === docId) {
      setActivePreviewDoc(null);
    }
  };

  const handlePinDocumentToLesson = (doc: DocumentItem, lessonId: string, pageNumber: number = 1) => {
    // 1. Update the lesson in lessons bank to point to this document & page
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === lessonId) {
          return {
            ...l,
            masterDocumentUrl: doc.fileDataUrl || doc.fileUrl,
            pdfPageNumber: pageNumber,
          };
        }
        return l;
      })
    );

    // 2. Update the document's linked lesson title
    const targetLesson = lessons.find((l) => l.id === lessonId);
    if (targetLesson) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, lessonTitle: targetLesson.title } : d))
      );
    }
  };

  // Lesson Bank Management actions
  const handleAddLesson = (newLesson: Lesson) => {
    setLessons((prev) => [...prev, newLesson]);
  };

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    );
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    setSubjects((prev) => {
      const oldSubject = prev.find((s) => s.id === updatedSubject.id);
      if (oldSubject && oldSubject.name !== updatedSubject.name) {
        // Cascade rename to other collections
        setLessons((prevLessons) => prevLessons.map((l) => l.subjectName === oldSubject.name ? { ...l, subjectName: updatedSubject.name } : l));
        setDocuments((prevDocs) => prevDocs.map((d) => d.subjectName === oldSubject.name ? { ...d, subjectName: updatedSubject.name } : d));
        setTimetableSlots((prevSlots) => prevSlots.map((s) => s.subjectName === oldSubject.name ? { ...s, subjectName: updatedSubject.name } : s));
        setLessonPlans((prevPlans) => prevPlans.map((p) => p.subjectName === oldSubject.name ? { ...p, subjectName: updatedSubject.name } : p));
      }
      return prev.map((s) => s.id === updatedSubject.id ? updatedSubject : s);
    });
  };

  const handleAddSubject = (newSubject: Subject) => {
    setSubjects((prev) => {
      if (prev.some((s) => s.name.toLowerCase() === newSubject.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newSubject];
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  const handleResetSubjects = () => {
    setSubjects(SUBJECTS_LIST);
  };

  // Helper to find the best matching timetable slot and target date for a given lesson
  const getTargetSlotForLesson = (lesson: Lesson): { targetSlot: TimetableSlot; targetDateStr: string; targetPlanId: string } => {
    const lessonSubj = (lesson.subjectName || '').toLowerCase();
    
    // Check if we have an active context and the subjects match exactly
    const hasActiveContextAndMatches = 
      activeTimetableSlotContext && 
      (activeTimetableSlotContext.slot.subjectName || '').toLowerCase() === lessonSubj;

    if (hasActiveContextAndMatches) {
      const slot = activeTimetableSlotContext!.slot;
      const dateStr = activeTimetableSlotContext!.dateStr || classInfo.weekStartDate;
      const planId = activeTimetableSlotContext!.plan?.id || `plan-${slot.id}-${Date.now()}`;
      return { targetSlot: slot, targetDateStr: dateStr, targetPlanId: planId };
    }

    // Solution 2: Link by subject
    const today = getTodayVietnamInfo();
    
    const matchingSlots = timetableSlots.filter(
      (s) => (s.subjectName || '').toLowerCase() === lessonSubj
    );

    let foundSlot: TimetableSlot | undefined;
    let foundDateStr = classInfo.weekStartDate;

    // Helper to calculate target date string for a given dayOfWeek
    const getTargetDateStrForDay = (dayOfWeek: number): string => {
      const [y, m, d] = classInfo.weekStartDate.split('-').map(Number);
      const monday = new Date(y, m - 1, d);
      const dayOffset = dayOfWeek - 2; // T2 -> offset 0
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + dayOffset);
      const yearStr = targetDate.getFullYear();
      const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    };

    if (matchingSlots.length > 0) {
      // 1. Search in today's slots first for an uncompleted one of this subject
      const todaySlotsOfSubj = matchingSlots.filter(s => s.dayOfWeek === today.dayOfWeek);
      if (todaySlotsOfSubj.length > 0) {
        const uncompletedToday = todaySlotsOfSubj.find(slot => {
          const isCompleted = studyRecords.some(r => 
            r.status === 'COMPLETED' && 
            r.date === today.dateStr && 
            r.session === slot.session && 
            r.period === slot.period
          );
          return !isCompleted;
        });

        if (uncompletedToday) {
          foundSlot = uncompletedToday;
          foundDateStr = today.dateStr || classInfo.weekStartDate;
        } else {
          foundSlot = todaySlotsOfSubj[0];
          foundDateStr = today.dateStr || classInfo.weekStartDate;
        }
      }

      // 2. If not found today (or today doesn't have this subject), search the rest of the week's slots
      if (!foundSlot) {
        const uncompletedInWeek = matchingSlots.find(slot => {
          const slotDateStr = getTargetDateStrForDay(slot.dayOfWeek);
          const isCompleted = studyRecords.some(r => 
            r.status === 'COMPLETED' && 
            r.date === slotDateStr && 
            r.session === slot.session && 
            r.period === slot.period
          );
          return !isCompleted;
        });

        if (uncompletedInWeek) {
          foundSlot = uncompletedInWeek;
          foundDateStr = getTargetDateStrForDay(uncompletedInWeek.dayOfWeek);
        } else {
          foundSlot = matchingSlots[0];
          foundDateStr = getTargetDateStrForDay(foundSlot.dayOfWeek);
        }
      }
    }

    if (foundSlot) {
      const existingPlan = lessonPlans.find(
        (p) => p.date === foundDateStr && p.dayOfWeek === foundSlot!.dayOfWeek && p.session === foundSlot!.session && p.period === foundSlot!.period
      );
      const planId = existingPlan?.id || `plan-${foundSlot.id}-${Date.now()}`;
      return { targetSlot: foundSlot, targetDateStr: foundDateStr, targetPlanId: planId };
    }

    // Ultimate fallback if no slot of this subject exists at all
    const defaultSlot = timetableSlots[0];
    return {
      targetSlot: defaultSlot,
      targetDateStr: classInfo.weekStartDate,
      targetPlanId: `plan-lib-${lesson.id}`
    };
  };

  // Open Mindmap Submission from Library Workspace
  const handleOpenUploadMindmapFromLibrary = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const { targetSlot, targetDateStr, targetPlanId } = getTargetSlotForLesson(lesson);

    const targetPlan = lessonPlans.find((p) => p.id === targetPlanId) || {
      id: targetPlanId,
      date: targetDateStr,
      dayOfWeek: targetSlot.dayOfWeek,
      session: targetSlot.session,
      period: targetSlot.period,
      subjectName: targetSlot.subjectName || lesson.subjectName,
      teacher: targetSlot.teacher || 'Cô Linh',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      summary: lesson.summary,
      keyPoints: lesson.keyPoints,
    };

    const targetRecord = studyRecords.find(
      (r) =>
        r.lessonPlanId === targetPlanId ||
        r.lessonId === lesson.id ||
        (r.date === targetDateStr && r.session === targetSlot.session && r.period === targetSlot.period)
    );

    setActiveSlotForModal(targetSlot);
    setActivePlanForModal(targetPlan);
    setActiveRecordForModal(targetRecord);
    setIsSlotModalOpen(true);
  };

  // Complete Lesson with Mindmap/Photos (Học sinh chốt học xong bài học & xuất ra thời khóa biểu)
  const handleCompleteLessonWithPhotos = (
    lesson: Lesson,
    images: string[] = [],
    studentNote?: string
  ) => {
    // 1. Update lesson with completed photos & status
    const updatedLesson: Lesson = {
      ...lesson,
      completedHomeworkImages: images,
    };
    handleUpdateLesson(updatedLesson);

    // 2. Identify target timetable slot and plan
    const { targetSlot, targetDateStr, targetPlanId } = getTargetSlotForLesson(lesson);

    // 3. Create or update LessonPlan
    setLessonPlans((prevPlans) => {
      const existingIdx = prevPlans.findIndex(
        (p) => p.id === targetPlanId || (p.date === targetDateStr && p.dayOfWeek === targetSlot.dayOfWeek && p.session === targetSlot.session && p.period === targetSlot.period)
      );
      const updatedPlan: LessonPlan = {
        id: targetPlanId,
        date: targetDateStr,
        dayOfWeek: targetSlot.dayOfWeek,
        session: targetSlot.session,
        period: targetSlot.period,
        subjectName: targetSlot.subjectName || lesson.subjectName,
        teacher: targetSlot.teacher || 'Giáo viên',
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        summary: lesson.summary,
        keyPoints: lesson.keyPoints,
      };

      if (existingIdx >= 0) {
        const copy = [...prevPlans];
        copy[existingIdx] = updatedPlan;
        return copy;
      }
      return [...prevPlans, updatedPlan];
    });

    // 4. Create or update StudyRecord with showOnTimetable: true
    const existingRecordIdx = studyRecords.findIndex(
      (r) =>
        r.lessonPlanId === targetPlanId ||
        r.lessonId === lesson.id ||
        (r.date === targetDateStr && r.session === targetSlot.session && r.period === targetSlot.period)
    );

    const newRecord: StudyRecord = {
      id: existingRecordIdx >= 0 ? studyRecords[existingRecordIdx].id : `record-${Date.now()}`,
      studentName: classInfo.studentName,
      lessonPlanId: targetPlanId,
      lessonId: lesson.id,
      date: targetDateStr,
      dayOfWeek: targetSlot.dayOfWeek,
      session: targetSlot.session,
      period: targetSlot.period,
      subjectName: targetSlot.subjectName || lesson.subjectName,
      lessonTitle: lesson.title,
      mindmapImageUrl: images[0] || '',
      completedImages: images,
      mindmapReport: lesson.mindmapReport,
      studentNote: studentNote || 'Đã chốt học xong bài học và hiển thị ra thời khóa biểu',
      submittedAt: new Date().toISOString(),
      status: 'COMPLETED',
      showOnTimetable: true,
    };

    setStudyRecords((prev) => {
      if (existingRecordIdx >= 0) {
        const updated = [...prev];
        updated[existingRecordIdx] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });

    setActiveRecordForModal(newRecord);
    incrementUnsavedChanges();
    refreshBackupStatus();
  };

  // Export JSON Data (Local-First Backup Package)
  const handleExportData = () => {
    try {
      const backupPackage = createBackupPackage({
        family,
        classInfo,
        timetableSlots,
        subjects: SUBJECTS_LIST,
        periods,
        lessons,
        lessonPlans,
        studyRecords,
        documents
      });

      const fileName = `TKB_Cap2_${(classInfo.className || 'LopHoc').replace(/\s+/g, '_')}_${(classInfo.studentName || 'HocSinh').replace(/\s+/g, '_')}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
      const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupPackage, null, 2))}`;
      
      const a = document.createElement('a');
      a.href = jsonStr;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Reset unsaved count and mark backup timestamp
      setLastBackupTimestamp();
      refreshBackupStatus();
      setShowBackupReminderModal(false);
    } catch (err: any) {
      alert(`Không thể xuất dữ liệu: ${err?.message || 'Đã xảy ra lỗi'}`);
    }
  };

  // Import JSON Data
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { isValid, error, data, summary } = validateAndParseBackup(text);

      if (!isValid || !data) {
        alert(error || 'Tệp sao lưu không hợp lệ!');
        return;
      }

      if (window.confirm(`Xác nhận khôi phục dữ liệu từ tệp?\n\n📊 Tóm tắt:\n${summary}\n\nDữ liệu hiện tại sẽ được thay thế bằng dữ liệu trong tệp.`)) {
        if (data.classInfo) setClassInfo(data.classInfo as ClassInfo);
        if (Array.isArray(data.timetableSlots)) setTimetableSlots(data.timetableSlots as TimetableSlot[]);
        if (Array.isArray(data.lessons)) setLessons(data.lessons as Lesson[]);
        if (Array.isArray(data.lessonPlans)) setLessonPlans(data.lessonPlans as LessonPlan[]);
        if (Array.isArray(data.studyRecords)) setStudyRecords(data.studyRecords as StudyRecord[]);
        if (Array.isArray(data.documents)) setDocuments(data.documents as DocumentItem[]);
        if (Array.isArray(data.periods)) setPeriods(data.periods as PeriodInfo[]);
        if (data.family && typeof data.family === 'object') {
          setFamily(data.family as FamilyAccount);
          if (Array.isArray(data.family.children) && data.family.children.length > 0) {
            setActiveChildProfile(data.family.children[0]);
          }
        }

        setLastBackupTimestamp();
        refreshBackupStatus();
        alert('🎉 Đã khôi phục dữ liệu học tập thành công!');
      }

      // Reset input value so user can upload same file again if needed
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Reset all to sample
  const handleResetAllData = () => {
    if (window.confirm('Khôi phục toàn bộ Thời khóa biểu, kho tài liệu, kho bài học và sơ đồ mẫu theo ảnh gốc 11A1-01?')) {
      const currentMonday = getVietnamCurrentMondayStr();
      setClassInfo({
        ...INITIAL_CLASS_INFO,
        weekStartDate: currentMonday
      });
      setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
      setLessons(INITIAL_LESSONS_BANK);
      setDocuments(INITIAL_DOCUMENTS);
      const plans = generateInitialLessonPlans(INITIAL_TIMETABLE_SLOTS, currentMonday);
      setLessonPlans(plans);
      setStudyRecords(generateInitialStudyRecords(plans, INITIAL_CLASS_INFO.studentName));
      alert('Đã khôi phục dữ liệu gốc!');
    }
  };

  // Calculate statistics
  const totalStudySlots = useMemo(() => {
    return timetableSlots.filter(
      (s) => s.subjectName && s.subjectName !== 'Chào cờ' && s.subjectName !== 'SHL'
    ).length;
  }, [timetableSlots]);

  const completedCount = useMemo(() => {
    return studyRecords.filter((r) => r.status === 'COMPLETED').length;
  }, [studyRecords]);

  // Calculate today's pending / uncompleted subjects count (strictly for today's date)
  const todayInfo = useMemo(() => getTodayVietnamInfo(), []);

  const todayStudySlots = useMemo(() => {
    return timetableSlots.filter(
      (s) =>
        s.dayOfWeek === todayInfo.dayOfWeek &&
        s.subjectName &&
        s.subjectName !== '—' &&
        s.subjectName !== 'Trống' &&
        s.subjectName !== 'Chào cờ' &&
        s.subjectName !== 'SHL'
    );
  }, [timetableSlots, todayInfo.dayOfWeek]);

  const todayCompletedCount = useMemo(() => {
    return todayStudySlots.filter((slot) => {
      // Find matching lesson plan for today
      const plan = lessonPlans.find(
        (lp) =>
          (lp.date === todayInfo.dateStr || lp.dayOfWeek === slot.dayOfWeek) &&
          lp.session === slot.session &&
          lp.period === slot.period
      );

      // Check if a record exists specifically for today's date or plan and is COMPLETED
      return studyRecords.some((r) => {
        if (r.status !== 'COMPLETED') return false;
        
        // Exact plan match
        if (plan && r.lessonPlanId === plan.id) {
          // If the record has a date, it must match today's date
          if (r.date && todayInfo.dateStr && r.date !== todayInfo.dateStr) return false;
          return true;
        }

        // Slot date match
        if (r.date && todayInfo.dateStr && r.date === todayInfo.dateStr) {
          if (r.session === slot.session && r.period === slot.period) return true;
        }

        return false;
      });
    }).length;
  }, [todayStudySlots, lessonPlans, studyRecords, todayInfo.dateStr]);

  const handleOpenSettings = () => {
    if (currentRole === 'admin') {
      setShowParentDashboard(true);
    } else {
      setParentPinCallback(() => () => {
        setCurrentRole('admin');
        setShowParentDashboard(true);
      });
      setShowParentPin(true);
    }
  };

  // ----------------- DEMO 10-MINUTE SESSION CONTROLLER -----------------
  // Start a fresh 10-minute trial session with default sample data
  const startDemoSession = () => {
    const durationSeconds = 10 * 60; // 10 minutes = 600s
    const expiresAt = Date.now() + durationSeconds * 1000;

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}demo_expires_at`, expiresAt.toString());
      localStorage.setItem(`${STORAGE_KEY_PREFIX}is_guest`, 'true');
    } catch (e) {
      console.error(e);
    }

    // Reset everything to sample dataset
    const currentMonday = getVietnamCurrentMondayStr();
    setClassInfo({
      ...INITIAL_CLASS_INFO,
      studentName: 'Học viên Trải nghiệm',
      className: 'Lớp 10A1',
      weekStartDate: currentMonday,
    });
    setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
    setLessons(INITIAL_LESSONS_BANK);
    setDocuments(INITIAL_DOCUMENTS);
    const plans = generateInitialLessonPlans(INITIAL_TIMETABLE_SLOTS, currentMonday);
    setLessonPlans(plans);
    setStudyRecords(generateInitialStudyRecords(plans, 'Học viên Trải nghiệm'));

    const demoGuestChild: ChildProfile = {
      id: 'demo_guest_student',
      name: 'Học viên Trải nghiệm',
      grade: '10',
      className: 'Lớp 10A1',
      avatar: '🚀',
      studentCode: 'DEMO10',
    };

    setActiveChildProfile(demoGuestChild);
    setIsGuestMode(true);
    setDemoTimeRemaining(durationSeconds);
    setCurrentRole('student');
    setIsIntroOpen(false);
  };

  // Reset and Exit Demo -> Back to clean Intro and pristine default data
  const handleResetAndExitDemo = (showExpiredAlert = false) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}demo_expires_at`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}is_guest`);
      localStorage.removeItem('mindmap_remembered_student_id');
    } catch (e) {
      console.error(e);
    }

    // Revert all internal state to clean defaults
    const currentMonday = getVietnamCurrentMondayStr();
    setClassInfo({
      ...INITIAL_CLASS_INFO,
      weekStartDate: currentMonday,
    });
    setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
    setLessons(INITIAL_LESSONS_BANK);
    setDocuments(INITIAL_DOCUMENTS);
    const plans = generateInitialLessonPlans(INITIAL_TIMETABLE_SLOTS, currentMonday);
    setLessonPlans(plans);
    setStudyRecords(generateInitialStudyRecords(plans, INITIAL_CLASS_INFO.studentName));

    setIsGuestMode(false);
    setDemoTimeRemaining(null);
    setActiveChildProfile(family.children[0] || null);
    setIsIntroOpen(true);

    if (showExpiredAlert) {
      setShowDemoExpiredModal(true);
    }
  };

  // 10-Minute Demo countdown tick
  useEffect(() => {
    if (demoTimeRemaining === null || isIntroOpen) return;

    const timer = setInterval(() => {
      try {
        const expiresStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}demo_expires_at`);
        if (!expiresStr) {
          setDemoTimeRemaining(null);
          return;
        }
        const expiresAt = parseInt(expiresStr, 10);
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

        if (remaining <= 0) {
          clearInterval(timer);
          setDemoTimeRemaining(0);
          handleResetAndExitDemo(true);
        } else {
          setDemoTimeRemaining(remaining);
        }
      } catch {
        setDemoTimeRemaining((prev) => (prev && prev > 1 ? prev - 1 : 0));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [demoTimeRemaining, isIntroOpen]);

  const handleSelectChild = (child: ChildProfile) => {
    setActiveChildProfile(child);
    const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
    const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
      ? rawGrade
      : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
    setClassInfo((prev) => ({
      ...prev,
      studentName: child.name,
      className: finalClass,
    }));
    setCurrentRole('student');
    setIsIntroOpen(false);
  };

  const handleSwitchToParent = () => {
    if (currentRole === 'admin') return;
    
    const savedPin = getParentPinFromStorage(family.parentPin || '');
    if (savedPin) {
      setParentPinCallback(() => () => {
        setActiveChildProfile(null);
        setClassInfo((prev) => ({
          ...prev,
          studentName: family.parentName,
        }));
        setCurrentRole('admin');
      });
      setShowParentPin(true);
    } else {
      setActiveChildProfile(null);
      setClassInfo((prev) => ({
        ...prev,
        studentName: family.parentName,
      }));
      setCurrentRole('admin');
    }
  };

  const todayPendingCount = Math.max(0, todayStudySlots.length - todayCompletedCount);
  const todayTotalSlots = todayStudySlots.length;
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isCapturingReport, setIsCapturingReport] = useState(false);

  const captureTimetable = async () => {
    if (isCapturingReport) return;
    setIsCapturingReport(true);

    try {
      let element = document.getElementById('timetable-container');
      if (!element) {
        element = document.getElementById('report-container') || document.querySelector('main') || document.body;
      }

      if (!element) {
        alert('Không tìm thấy giao diện thời khóa biểu để chụp ảnh.');
        return;
      }

      let dataUrl: string | null = null;

      try {
        dataUrl = await toPng(element as HTMLElement, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });
      } catch (err1) {
        console.warn('toPng failed, trying toJpeg:', err1);
        try {
          dataUrl = await toJpeg(element as HTMLElement, {
            pixelRatio: 1.5,
            backgroundColor: '#ffffff',
            quality: 0.95,
          });
        } catch (err2) {
          console.warn('toJpeg failed, trying html2canvas fallback:', err2);
          const canvas = await html2canvas(element as HTMLElement, { scale: 2 });
          dataUrl = canvas.toDataURL('image/png');
        }
      }

      if (dataUrl) {
        setCapturedImageUrl(dataUrl);
        setShowShareModal(true);
        setShowVictoryModal(false);
      } else {
        alert('Không thể tạo ảnh báo cáo. Bạn vui lòng thử lại nhé!');
      }
    } catch (error) {
      console.error('Error capturing timetable image:', error);
      alert('Có lỗi xảy ra khi tạo ảnh báo cáo. Bạn hãy thử lại nhé!');
    } finally {
      setIsCapturingReport(false);
    }
  };

  useEffect(() => {
    // Reset celebration flag when date changes
    setHasCelebratedToday(false);
  }, [todayInfo.dateStr]);

  useEffect(() => {
    if (todayTotalSlots > 0 && todayPendingCount === 0 && !hasCelebratedToday) {
      setHasCelebratedToday(true);
      setActiveTab('timetable');
      setShowVictoryModal(true);
    }
  }, [todayPendingCount, todayTotalSlots, hasCelebratedToday]);


  const handleDeleteChild = async (childId: string) => {
    // Clean up any storage keys tied to this child
    await clearProfileStorage(childId);
    
    // If the active profile was this child, switch to another child or clear active profile
    if (activeChildProfile?.id === childId) {
      const remaining = family.children.filter((c) => c.id !== childId);
      if (remaining.length > 0) {
        const firstChild = remaining[0];
        setActiveChildProfile(firstChild);
        const rawGrade = firstChild.className || (firstChild.grade ? String(firstChild.grade) : 'Lớp học');
        const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
          ? rawGrade
          : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
        setClassInfo((prev) => ({
          ...prev,
          studentName: firstChild.name,
          className: finalClass,
        }));
      } else {
        setActiveChildProfile(null);
      }
    }
  };

  const handleEditChild = (updatedChild: ChildProfile) => {
    if (activeChildProfile?.id === updatedChild.id) {
      setActiveChildProfile(updatedChild);
      const rawGrade = updatedChild.className || (updatedChild.grade ? String(updatedChild.grade) : 'Lớp học');
      const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
        ? rawGrade
        : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
      setClassInfo((prev) => ({
        ...prev,
        studentName: updatedChild.name,
        className: finalClass,
      }));
    }
  };

  const handleAddChild = (child: ChildProfile) => {
    if (!activeChildProfile) {
      setActiveChildProfile(child);
      const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
      const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
        ? rawGrade
        : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
      setClassInfo((prev) => ({
        ...prev,
        studentName: child.name,
        className: finalClass,
      }));
    }
  };

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-sky-800 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-4xl animate-bounce">
            ☁️
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">Đang kết nối không gian học tập...</h2>
            <p className="text-sm text-blue-100 font-medium">Hệ thống đang đồng bộ dữ liệu gia đình và tiến độ học tập từ đám mây (Cloud Firestore)...</p>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full animate-pulse w-3/4"></div>
          </div>
          <div className="text-xs text-blue-200 font-mono">⚡ Đang tải dữ liệu thiết bị từ xa...</div>
        </div>
      </div>
    );
  }

  if (isIntroOpen) {
    return (
      <RegistrationIntro
        family={family}
        onUpdateFamily={(updated) => {
          setFamily(updated);
          saveSafeItem(`${STORAGE_KEY_PREFIX}family_account`, updated);
        }}
        onSelectChild={(child) => {
          setIsGuestMode(false);
          setActiveChildProfile(child);
          const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
          const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
            ? rawGrade
            : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
          setClassInfo((prev) => ({
            ...prev,
            studentName: child.name,
            className: finalClass,
          }));
          setCurrentRole('student');
          setIsIntroOpen(false);
        }}
        onAddChild={(newChildData) => {
          const newChild: ChildProfile = {
            ...newChildData,
            id: 'child_' + Date.now().toString(),
          };
          const updatedFamily: FamilyAccount = {
            ...family,
            children: [...family.children, newChild],
          };
          setFamily(updatedFamily);
          saveSafeItem(`${STORAGE_KEY_PREFIX}family_account`, updatedFamily);
          setActiveChildProfile(newChild);
        }}
        onSelectParent={() => {
          setActiveChildProfile(null);
          setClassInfo((prev) => ({
            ...prev,
            studentName: family.parentName,
          }));
          setCurrentRole('admin');
          setIsIntroOpen(false);
          setShowParentDashboard(true);
        }}
        onImportBackupData={handleImportData}
        onStartDemo={startDemoSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans transition-colors">
      
      {/* ⏱️ 10-Minute Demo Mode Live Floating Bar */}
      {demoTimeRemaining !== null && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50 border-b border-amber-500/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-900"></span>
            </span>
            <span>
              ⏱️ Chế độ Trải nghiệm nhanh: Còn lại{' '}
              <span className="font-mono text-sm bg-amber-500/40 px-1.5 py-0.5 rounded text-slate-950 font-black">
                {String(Math.floor(demoTimeRemaining / 60)).padStart(2, '0')}:
                {String(demoTimeRemaining % 60).padStart(2, '0')}
              </span>
            </span>
            <span className="hidden sm:inline text-amber-950/80 font-medium">
              • Tự động đặt lại dữ liệu gốc sau 10 phút.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleResetAndExitDemo(false)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-950 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>Thoát & Đặt lại</span>
          </button>
        </div>
      )}

      {/* Hidden File Input for Data Restore */}
      <input 
        type="file" 
        ref={fileImportInputRef} 
        className="hidden" 
        accept=".json"
        onChange={handleImportData}
      />

      {/* Top Header Navigation */}
      <HeaderTimetable
        classInfo={classInfo}
        onUpdateClassInfo={(updated) => setClassInfo((prev) => ({ ...prev, ...updated }))}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onResetWeek={handleResetWeek}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenLessonBank={() => setIsLessonBankOpen(true)}
        onOpenSettings={handleOpenSettings}
        onOpenAboutStory={() => setShowAboutStory(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetAllData={handleResetAllData}
        onSwitchProfile={() => {
          try {
            localStorage.removeItem('mindmap_remembered_student_id');
          } catch {}
          setIsIntroOpen(true);
        }}
        onLogout={() => {
          try {
            localStorage.removeItem('mindmap_remembered_student_id');
          } catch {}
          setIsIntroOpen(true);
        }}
        currentChildAvatar={activeChildProfile?.avatar}
        onShareReport={captureTimetable}
        isCapturing={isCapturingReport}
        isVictory={hasCelebratedToday}
        completedCount={completedCount}
        totalStudySlots={totalStudySlots}
        todayPendingCount={todayPendingCount}
        todayTotalSlots={todayStudySlots.length}
        documentsCount={documents.length}
        activeTab={activeTab}
        family={family}
        activeChildProfile={activeChildProfile}
        onSelectChild={handleSelectChild}
        onSelectParent={handleSwitchToParent}
        isGuestMode={isGuestMode}
        onOpenCloudSync={() => setShowAccountLinkingModal(true)}
        backupStatus={backupStatus}
        onOpenBackupReminder={() => setShowBackupReminderModal(true)}
        onOpenFamilyCodeCard={() => setShowFamilyCodeModal(true)}
        onSelectTab={(tab) => {
          if (tab === 'mindmap_gallery') {
            setIsGalleryOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        breadcrumbElement={
          <BreadcrumbNav
            activeTab={activeTab}
            selectedSubject={libraryBreadcrumb.selectedSubject || selectedSubjectForLibrary}
            selectedVolume={libraryBreadcrumb.selectedVolume}
            selectedChapter={libraryBreadcrumb.selectedChapter}
            currentLessonTitle={libraryBreadcrumb.currentLessonTitle}
            onNavigateTab={(tab) => {
              if (tab === 'mindmap_gallery') {
                setIsGalleryOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onSelectSubject={(subj) => {
              setSelectedSubjectForLibrary(subj);
              setSelectedLessonIdForLibrary(undefined);
              setLibraryBreadcrumb((prev) => ({
                ...prev,
                selectedSubject: subj,
                selectedChapter: 'all',
                currentLessonTitle: undefined,
              }));
              setActiveTab('lessons');
            }}
            onSelectVolume={(vol) => {
              setLibraryBreadcrumb((prev) => ({
                ...prev,
                selectedVolume: vol,
                currentLessonTitle: undefined,
              }));
              setActiveTab('lessons');
            }}
            onSelectChapter={(chap) => {
              setLibraryBreadcrumb((prev) => ({
                ...prev,
                selectedChapter: chap,
                currentLessonTitle: undefined,
              }));
              setActiveTab('lessons');
            }}
            onResetFilters={() => {
              setSelectedSubjectForLibrary(undefined);
              setSelectedLessonIdForLibrary(undefined);
              setLibraryBreadcrumb({
                selectedSubject: undefined,
                selectedVolume: 1,
                selectedChapter: 'all',
                currentLessonTitle: undefined,
              });
              setActiveTab('lessons');
            }}
          />
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        
        {/* Tab View Container (Strict 90% - 92% Width) */}
        <main className="flex-1 w-[95%] sm:w-[92%] mx-auto p-2.5 sm:p-4 md:p-6 space-y-4 pb-24 md:pb-6">

          {/* TAB 1: TIMETABLE & MINDMAP MATRIX */}
          {activeTab === 'timetable' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* The Classical Timetable Grid (No horizontal scrolling) */}
              <VietnameseTimetableGrid
                periods={periods}
                timetableSlots={timetableSlots}
                lessonPlans={lessonPlans}
                studyRecords={studyRecords}
                documents={documents}
                subjects={subjects}
                currentRole={currentRole}
                weekStartDate={classInfo.weekStartDate}
                onSlotClick={handleSlotClick}
                onEditSlotAdmin={(slot, updatedData) => handleUpdateSlotAdmin(slot.id, updatedData)}
                onOpenEditPeriods={() => setIsEditPeriodsOpen(true)}
                onShareReport={captureTimetable}
                isCapturing={isCapturingReport}
                onViewSubjectDocuments={(subj) => {
                  setSelectedSubjectForLibrary(subj);
                  setSelectedLessonIdForLibrary(undefined);
                  setActiveTab('lessons');
                }}
              />
            </div>
          )}

          {/* TAB 2: CENTRAL LIBRARY & STUDENT WORKSPACE */}
          {activeTab === 'lessons' && (
            <VuLangLibraryView
              lessons={lessons}
              subjects={subjects}
              studyRecords={studyRecords}
              documents={documents}
              timetableSlots={timetableSlots}
              lessonPlans={lessonPlans}
              currentRole={currentRole}
              selectedSubjectParam={selectedSubjectForLibrary}
              selectedLessonIdParam={selectedLessonIdForLibrary}
              selectedVolumeParam={libraryBreadcrumb.selectedVolume}
              selectedChapterParam={libraryBreadcrumb.selectedChapter}
              onStateChange={(st) => {
                if (st.selectedSubject && st.selectedSubject !== 'all') {
                  setSelectedSubjectForLibrary(st.selectedSubject);
                }
                if (st.activeLessonId) {
                  setSelectedLessonIdForLibrary(st.activeLessonId);
                } else if (st.activeLessonId === undefined) {
                  setSelectedLessonIdForLibrary(undefined);
                }
                setLibraryBreadcrumb((prev) => {
                  if (
                    prev.selectedSubject === st.selectedSubject &&
                    prev.selectedVolume === st.selectedVolume &&
                    prev.selectedChapter === st.selectedChapter &&
                    prev.currentLessonTitle === st.activeLessonTitle
                  ) {
                    return prev;
                  }
                  return {
                    selectedSubject: st.selectedSubject,
                    selectedVolume: st.selectedVolume,
                    selectedChapter: st.selectedChapter,
                    currentLessonTitle: st.activeLessonTitle,
                  };
                });
              }}
              onUpdateLesson={handleUpdateLesson}
              onAddLesson={handleAddLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onPinDocumentToLesson={handlePinDocumentToLesson}
              onUpdateSubject={handleUpdateSubject}
              onAddSubject={handleAddSubject}
              onDeleteSubject={handleDeleteSubject}
              onResetSubjects={handleResetSubjects}
              onOpenUploadMindmap={(lessonId) => handleOpenUploadMindmapFromLibrary(lessonId)}
              onPreviewDocument={(doc) => setActivePreviewDoc(doc)}
              onNavigateToTimetable={() => {
                setActiveTab('timetable');
              }}
              activeTimetableSlotContext={activeTimetableSlotContext}
              onClearActiveTimetableSlotContext={() => setActiveTimetableSlotContext(null)}
              onCompleteLessonWithPhotos={handleCompleteLessonWithPhotos}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {/* TAB 4: ANALYTICS & PROGRESS */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              studyRecords={studyRecords}
              lessonPlans={lessonPlans}
              timetableSlots={timetableSlots}
              documents={documents}
              currentRole={currentRole}
              weekStartDate={classInfo.weekStartDate}
              subjects={subjects}
              onNavigateTab={(tab) => {
                if (tab === 'mindmap_gallery') {
                  setIsGalleryOpen(true);
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectSubject={(subjName) => {
                setSelectedSubjectForLibrary(subjName);
                setSelectedLessonIdForLibrary(undefined);
                setActiveTab('lessons');
              }}
            />
          )}

          {/* TAB 5: KNOWLEDGE SUMMARY & END-OF-TERM EXAM REVISION EXPORT */}
          {activeTab === 'knowledge_summary' && (
            <KnowledgeSummaryView
              lessons={lessons}
              subjects={subjects}
              studyRecords={studyRecords}
              initialSubject={selectedSubjectForLibrary && selectedSubjectForLibrary !== 'all' ? selectedSubjectForLibrary : subjects[0]?.name}
              initialActiveLessonId={selectedLessonIdForLibrary}
              onSelectSubject={(subj) => {
                if (subj && subj !== 'all') setSelectedSubjectForLibrary(subj);
              }}
              onSelectLesson={(lessonId) => setSelectedLessonIdForLibrary(lessonId)}
              onUpdateLesson={handleUpdateLesson}
              onNavigateToLessons={(subj, lessonId) => {
                if (subj && subj !== 'all') setSelectedSubjectForLibrary(subj);
                if (lessonId) setSelectedLessonIdForLibrary(lessonId);
                setActiveTab('lessons');
              }}
            />
          )}

        </main>

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md px-3 py-2 flex justify-around items-center shadow-lg text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'timetable' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Thời khóa biểu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'lessons' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Bài học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer relative ${
              activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Tiến độ</span>
            {todayPendingCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knowledge_summary')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'knowledge_summary' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span>Ôn tập</span>
          </button>
        </nav>
      </div>

      {/* Modal 1: Document Previewer */}
      <DocumentPreviewModal
        document={activePreviewDoc}
        isOpen={Boolean(activePreviewDoc)}
        onClose={() => setActivePreviewDoc(null)}
      />

      {/* Modal 2: Lesson Detail & Mindmap Upload */}
      <LessonDetailAndMindmapModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        slot={activeSlotForModal}
        plan={activePlanForModal}
        record={activeRecordForModal}
        currentRole={currentRole}
        allLessons={lessons}
        onSubmitMindmap={handleSubmitMindmap}
        onParentReview={handleParentReview}
        onDeleteRecord={handleDeleteRecord}
        onToggleShowOnTimetable={handleToggleShowOnTimetable}
        onUpdatePlanAdmin={handleUpdatePlanAdmin}
        onUpdateSlotAdmin={handleUpdateSlotAdmin}
      />

      {/* Modal 3: Mindmap Gallery */}
      <MindmapGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        studyRecords={studyRecords}
      />

      {/* Modal 4: Lesson Bank & Auto Distribution */}
      <LessonBankManagerModal
        isOpen={isLessonBankOpen}
        onClose={() => setIsLessonBankOpen(false)}
        lessons={lessons}
        timetableSlots={timetableSlots}
        onAddLesson={(newLesson) => setLessons((prev) => [...prev, newLesson])}
        onUpdateLesson={(updated) => setLessons((prev) => prev.map((l) => l.id === updated.id ? updated : l))}
        onDeleteLesson={(id) => setLessons((prev) => prev.filter((l) => l.id !== id))}
        onAutoDistributeLessons={handleAutoDistributeLessons}
      />

      {/* Modal 5: Class Settings */}
      <ClassSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        classInfo={classInfo}
        onSaveClassInfo={setClassInfo}
        onResetToDefaults={handleResetAllData}
      />

      {/* Modal 6: Edit Period Times */}
      <EditPeriodTimesModal
        isOpen={isEditPeriodsOpen}
        onClose={() => setIsEditPeriodsOpen(false)}
        periods={periods}
        onSavePeriods={(updatedPeriods) => setPeriods(updatedPeriods)}
      />

      {/* Modal 7: Parent PIN Challenge */}
      {showParentPin && (
        <ParentPinChallengeModal
          savedPin={getParentPinFromStorage(family.parentPin || '')}
          onClose={() => {
            setShowParentPin(false);
            setParentPinCallback(null);
          }}
          onSuccess={() => {
            setShowParentPin(false);
            if (parentPinCallback) {
              parentPinCallback();
              setParentPinCallback(null);
            } else {
              setCurrentRole('admin');
              setShowParentDashboard(true);
            }
          }}
        />
      )}

      {/* Modal 9: Victory Lightbox */}
      {showVictoryModal && (
        <VictoryLightbox
          onClose={() => setShowVictoryModal(false)}
          onSend={captureTimetable}
        />
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          imageUrl={capturedImageUrl}
        />
      )}

      {/* Modal 8: Parent Dashboard (Unified Family Modal) */}
      {showParentDashboard && (
        <UnifiedFamilyModal
          isOpen={showParentDashboard}
          onClose={() => setShowParentDashboard(false)}
          defaultTab="parent_dashboard"
          family={family}
          onUpdateFamily={setFamily}
          currentRole={currentRole}
          activeChildProfile={activeChildProfile}
          onSelectChild={(child) => {
            setActiveChildProfile(child);
            const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
            const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
              ? rawGrade
              : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
            setClassInfo((prev) => ({
              ...prev,
              studentName: child.name,
              className: finalClass,
            }));
            setShowParentDashboard(false);
            setCurrentRole('student');
          }}
          onSelectParent={() => {
            setCurrentRole('admin');
          }}
          onSwitchActiveChild={(child) => {
            setActiveChildProfile(child);
            const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
            const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
              ? rawGrade
              : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
            setClassInfo((prev) => ({
              ...prev,
              studentName: child.name,
              className: finalClass,
            }));
          }}
          onDeleteChild={handleDeleteChild}
          onEditChild={handleEditChild}
          onAddChild={handleAddChild}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onSwitchProfile={() => {
            try {
              localStorage.removeItem('mindmap_remembered_student_id');
            } catch {}
            setIsIntroOpen(true);
          }}
          onLogout={() => {
            try {
              localStorage.removeItem('mindmap_remembered_student_id');
            } catch {}
            setIsIntroOpen(true);
          }}
          backupStatus={backupStatus}
          isGuestMode={isGuestMode}
          onOpenCloudSync={() => setShowAccountLinkingModal(true)}
          onExitParentMode={() => {
            setShowParentDashboard(false);
            setCurrentRole('student');
          }}
        />
      )}

      {/* About Story Lightbox Modal */}
      {showAboutStory && (
        <AboutStoryModal
          onClose={() => setShowAboutStory(false)}
        />
      )}

      {/* Modal: Account Linking (Guest Mode -> Google Cloud Sync) */}
      {showAccountLinkingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl border border-amber-200 shrink-0">
                ☁️
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800">
                  Lưu thời khóa biểu lên Google
                </h3>
                <p className="text-xs text-slate-500">
                  Chuyển từ Tài khoản Khách sang Đám mây vĩnh viễn
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Toàn bộ thời khóa biểu, môn học, sơ đồ tư duy đã soạn sẽ <strong>được giữ nguyên 100%</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Mở xem và chỉnh sửa dễ dàng trên điện thoại, máy tính bảng hay máy tính khác.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>An tâm không lo mất dữ liệu nếu lỡ dọn dẹp trình duyệt.</span>
              </div>
            </div>

            {linkingError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed">
                {linkingError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={isLinkingAccount}
                onClick={handleExecuteAccountLinking}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLinkingAccount ? (
                  <span>Đang kết nối Google...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Tiếp tục với Google để Lưu</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowAccountLinkingModal(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Để sau (Tiếp tục dùng trên máy này)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Local-First Smart Backup Reminder */}
      <BackupReminderModal
        isOpen={showBackupReminderModal}
        onClose={() => setShowBackupReminderModal(false)}
        onExecuteExport={handleExportData}
        unsavedCount={backupStatus.unsavedCount}
        daysSinceLastBackup={backupStatus.daysSinceLastBackup}
        lastBackupDateStr={backupStatus.lastBackupDateStr}
        studentName={classInfo.studentName || 'Học sinh'}
        className={classInfo.className || 'Lớp học'}
      />

      {/* Modal: Family Code & Login Card for Children (Unified Family Modal) */}
      {showFamilyCodeModal && (
        <UnifiedFamilyModal
          isOpen={showFamilyCodeModal}
          onClose={() => setShowFamilyCodeModal(false)}
          defaultTab="qr_cards"
          family={family}
          onUpdateFamily={setFamily}
          currentRole={currentRole}
          activeChildProfile={activeChildProfile}
          onSelectChild={(child) => {
            setActiveChildProfile(child);
            const rawGrade = child.className || (child.grade ? String(child.grade) : 'Lớp học');
            const finalClass = (rawGrade.toLowerCase().startsWith('lớp') || rawGrade.toLowerCase().startsWith('sinh viên') || rawGrade.toLowerCase().startsWith('đại học'))
              ? rawGrade
              : (!isNaN(Number(rawGrade)) ? `Lớp ${rawGrade}` : rawGrade);
            setClassInfo((prev) => ({
              ...prev,
              studentName: child.name,
              className: finalClass,
            }));
            setShowFamilyCodeModal(false);
            setCurrentRole('student');
          }}
          onSelectParent={() => {
            setCurrentRole('admin');
          }}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onSwitchProfile={() => {
            try {
              localStorage.removeItem('mindmap_remembered_student_id');
            } catch {}
            setIsIntroOpen(true);
          }}
          onLogout={() => {
            try {
              localStorage.removeItem('mindmap_remembered_student_id');
            } catch {}
            setIsIntroOpen(true);
          }}
          backupStatus={backupStatus}
          isGuestMode={isGuestMode}
          onOpenCloudSync={() => setShowAccountLinkingModal(true)}
        />
      )}

      {/* Modal: Demo 10 Minutes Expired Notification */}
      {showDemoExpiredModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-4 font-bold shadow-xs">
              ⏱️
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Hết thời gian trải nghiệm nhanh!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Phiên trải nghiệm demo <b>10 phút</b> đã kết thúc. Toàn bộ dữ liệu tạm thời đã được tự động làm mới và đặt lại mặc định an toàn.
            </p>
            <button
              type="button"
              onClick={() => setShowDemoExpiredModal(false)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            >
              Đã hiểu & Về màn hình chính
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
