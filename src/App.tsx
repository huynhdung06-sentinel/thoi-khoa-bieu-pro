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
import { getChildData, saveChildData, auth, signOut } from './lib/firebase';
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
      if (saved && saved.children && saved.children.length > 0) return saved;
    } catch (e) {
      console.error(e);
    }
    const savedPin = getParentPinFromStorage('1234');
    const savedClass = getSafeItemSync<ClassInfo>(`${STORAGE_KEY_PREFIX}class_info`);
    const studentName = savedClass?.studentName || 'Bảo Nam';
    return {
      parentName: 'Bố Mẹ',
      parentPin: savedPin,
      children: [
        { id: 'child-1', name: studentName, grade: 9, className: '9A1', avatar: '🚀' },
        { id: 'child-2', name: 'Hà My', grade: 6, className: '6A2', avatar: '🐱' },
      ]
    };
  });

  useEffect(() => {
    saveSafeItem(`${STORAGE_KEY_PREFIX}family_account`, family);
    if (family.parentPin) {
      setParentPinToStorage(family.parentPin);
    }
  }, [family]);

  // Active child profile
  const [activeChildProfile, setActiveChildProfile] = useState<ChildProfile | null>(() => {
    return family.children[0] || null;
  });

  // Màn hình Intro hiện ra mỗi lần học sinh vào học để tự bấm chọn tài khoản của mình
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(true);

  // 1. Dashboard Tab Navigation
  const [activeTab, setActiveTab] = useState<DashboardTab>('timetable');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedLessonIdForLibrary, setSelectedLessonIdForLibrary] = useState<string | undefined>(undefined);
  const [selectedSubjectForLibrary, setSelectedSubjectForLibrary] = useState<string | undefined>(undefined);

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
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Profile Hydration Effect (Isolation of Schedules & Study Data)
  useEffect(() => {
    if (!activeChildProfile || !currentUser) {
      setIsHydrated(true);
      return;
    }

    let isMounted = true;
    async function hydrateChildData() {
      const id = activeChildProfile!.id;
      isHydratingRef.current = true;
      setIsHydrated(false);

      try {
        const firebaseData = await getChildData(currentUser.uid, id);
        
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
  }, [activeChildProfile?.id, currentUser]);

  // Child-specific Save Effects to Firebase
  useEffect(() => {
    if (isHydratingRef.current || !isHydrated || !activeChildProfile || !currentUser) return;
    
    // Create a debounce timer to avoid too many writes
    const timer = setTimeout(() => {
      saveChildData(currentUser.uid, activeChildProfile.id, {
        classInfo,
        subjects,
        timetableSlots,
        lessons,
        lessonPlans,
        studyRecords,
        documents,
        periods
      }).catch(console.error);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [classInfo, subjects, timetableSlots, lessons, lessonPlans, studyRecords, documents, periods, activeChildProfile?.id, isHydrated, currentUser]);

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
  };

  // Export JSON Data
  const handleExportData = () => {
    const data = {
      classInfo,
      timetableSlots,
      lessons,
      lessonPlans,
      studyRecords,
      documents,
      periods,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = `mindmap_school_${classInfo.className}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Import JSON Data
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.classInfo) setClassInfo(parsed.classInfo);
        if (Array.isArray(parsed.timetableSlots)) setTimetableSlots(parsed.timetableSlots);
        if (Array.isArray(parsed.lessons)) setLessons(parsed.lessons);
        if (Array.isArray(parsed.lessonPlans)) setLessonPlans(parsed.lessonPlans);
        if (Array.isArray(parsed.studyRecords)) setStudyRecords(parsed.studyRecords);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (Array.isArray(parsed.periods)) setPeriods(parsed.periods);
        alert('Đã nhập dữ liệu thành công!');
      } catch (err) {
        alert('File không hợp lệ!');
      }
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

  if (isIntroOpen) {
    return (
      <RegistrationIntro
        family={family}
        onUpdateFamily={(updated) => {
          setFamily(updated);
        }}
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
          setCurrentRole('student');
          setIsIntroOpen(false);
        }}
        onSelectParent={() => {
          setActiveChildProfile(null);
          setClassInfo((prev) => ({
            ...prev,
            studentName: family.parentName,
          }));
          setCurrentRole('admin');
          setIsIntroOpen(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans transition-colors">
      
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
        onSwitchProfile={() => setIsIntroOpen(true)}
        onLogout={() => {
          signOut().then(() => setIsIntroOpen(true));
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

      {/* Modal 8: Parent Dashboard */}
      {showParentDashboard && (
        <ParentDashboardModal
          onClose={() => setShowParentDashboard(false)}
          onExitParentMode={() => {
            setShowParentDashboard(false);
            setCurrentRole('student');
          }}
          family={family}
          onUpdateFamily={setFamily}
          activeChildId={activeChildProfile?.id}
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
        />
      )}

      {/* About Story Lightbox Modal */}
      {showAboutStory && (
        <AboutStoryModal
          onClose={() => setShowAboutStory(false)}
        />
      )}

    </div>
  );
}
