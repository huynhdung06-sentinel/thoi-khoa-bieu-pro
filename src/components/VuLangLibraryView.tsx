import React, { useState, useMemo, useEffect, useRef } from 'react';
import {  
  Lesson, 
  Subject, 
  StudyRecord, 
  DocumentItem, 
  DocumentCategory,
  TimetableSlot, 
  LessonPlan, 
  UserRole 
} from '../types';
import {  getSubjectEmoji, SUBJECTS_LIST } from '../data/mockData';
import {  
  Search, 
  BookOpen, 
  Award, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Star, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit2, Edit3, 
  Layers, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Upload, 
  Check, 
  BookMarked,
  Clock,
  Maximize2,
  Folder,
  FolderOpen,
  FolderTree,
  FolderPlus,
  Settings2,
  Filter,
  Grid,
  List,
  Sparkles,
  ChevronLeft,
  X,
  ExternalLink,
  FileCode,
  ShieldAlert,
  Youtube,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  Video,
  FileUp,
  Camera,
  Play,
  Home,
  Settings,
  RotateCcw
} from 'lucide-react';
import { formatFileSize, triggerFileDownload, readFileAsDataURL, readFileAsText } from '../utils/fileUtils';
import { LessonReference } from '../types';
import { InteractiveLessonWorkspaceModal } from './InteractiveLessonWorkspaceModal';

interface VuLangLibraryViewProps {
  lessons: Lesson[];
  subjects?: Subject[];
  studyRecords: StudyRecord[];
  documents: DocumentItem[];
  timetableSlots: TimetableSlot[];
  lessonPlans: LessonPlan[];
  currentRole: UserRole;
  selectedSubjectParam?: string;
  selectedLessonIdParam?: string;
  selectedVolumeParam?: 1 | 2;
  selectedChapterParam?: string;
  onUpdateLesson: (updated: Lesson) => void;
  onAddLesson: (newLesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onUpdateSubject?: (subj: Subject) => void;
  onAddSubject?: (newSubj: Subject) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onResetSubjects?: () => void;
  onOpenUploadMindmap: (lessonId: string, slot?: TimetableSlot, plan?: LessonPlan) => void;
  onPreviewDocument: (doc: DocumentItem) => void;
  onNavigateToTimetable?: () => void;
  activeTimetableSlotContext?: {
    slot: TimetableSlot;
    plan?: LessonPlan;
    dateStr?: string;
  } | null;
  onClearActiveTimetableSlotContext?: () => void;
  onCompleteLessonWithPhotos?: (lesson: Lesson, images: string[], note?: string) => void;
  onDeleteRecord?: (recordId: string) => void;
  onStateChange?: (state: {
    selectedSubject: string;
    selectedVolume: 1 | 2;
    selectedChapter: string;
    activeLessonTitle?: string;
    activeLessonId?: string;
  }) => void;
}

export const VuLangLibraryView: React.FC<VuLangLibraryViewProps> = ({
  lessons,
  subjects = SUBJECTS_LIST,
  studyRecords,
  documents,
  timetableSlots,
  lessonPlans,
  currentRole,
  selectedSubjectParam,
  selectedLessonIdParam,
  selectedVolumeParam,
  selectedChapterParam,
  onUpdateLesson,
  onAddLesson,
  onDeleteLesson,
  onUpdateSubject,
  onAddSubject,
  onDeleteSubject,
  onResetSubjects,
  onOpenUploadMindmap,
  onPreviewDocument,
  onNavigateToTimetable,
  activeTimetableSlotContext,
  onClearActiveTimetableSlotContext,
  onCompleteLessonWithPhotos,
  onDeleteRecord,
  onStateChange,
}) => {
  // 1. Filter & Subject state (Left Menu)
  const [selectedSubject, setSelectedSubject] = useState<string>(() => selectedSubjectParam || subjects[0]?.name || 'Toán');
  const [selectedVolume, setSelectedVolume] = useState<1 | 2>(() => selectedVolumeParam || 1);
  const [lessonStatusFilter, setLessonStatusFilter] = useState<'all' | 'uncompleted' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>(() => selectedChapterParam || 'all');
  const [activeLessonModal, setActiveLessonModal] = useState<Lesson | null>(() => {
    if (selectedLessonIdParam) {
      const found = lessons.find((l) => l.id === selectedLessonIdParam);
      if (found) return found;
    }
    return null;
  });
  const [activeLessonModalTab, setActiveLessonModalTab] = useState<'html' | 'embedded_html' | 'youtube' | 'homework_image' | 'pdf_page'>(() => {
    try {
      const savedTab = localStorage.getItem('vulang_active_lesson_tab');
      if (savedTab && ['html', 'embedded_html', 'youtube', 'homework_image', 'pdf_page'].includes(savedTab)) {
        return savedTab as any;
      }
    } catch {}
    return 'html';
  });

  useEffect(() => {
    try {
      localStorage.setItem('vulang_active_lesson_tab', activeLessonModalTab);
    } catch {}
  }, [activeLessonModalTab]);

  const [lessonHasUnsaved, setLessonHasUnsaved] = useState(false);
  const [requestExitSignal, setRequestExitSignal] = useState(0);

  // Subject management state
  const [isManageSubjectsModalOpen, setIsManageSubjectsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Inline Editor Mode state (Chế độ Chỉnh sửa trực tiếp trên từng môn & bài học)
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [userCreatedEmptyChapters, setUserCreatedEmptyChapters] = useState<string[]>([]);
  
  // Chapter inline actions
  const [addingLessonToChapter, setAddingLessonToChapter] = useState<string | null>(null);
  const [newLessonTitleInput, setNewLessonTitleInput] = useState('');
  const [isAddingNewChapter, setIsAddingNewChapter] = useState(false);
  const [newChapterTitleInput, setNewChapterTitleInput] = useState('');
  
  // Deletion confirmations
  const [lessonToDeleteConfirm, setLessonToDeleteConfirm] = useState<Lesson | null>(null);
  const [chapterToDeleteConfirm, setChapterToDeleteConfirm] = useState<{
    chapterTitle: string;
    subjectName: string;
    lessonCount: number;
  } | null>(null);

  const lastReportedStateRef = useRef<string>('');
  const lastActiveLessonIdRef = useRef<string | undefined>(selectedLessonIdParam);

  useEffect(() => {
    if (activeLessonModal?.id) {
      lastActiveLessonIdRef.current = activeLessonModal.id;
    }
  }, [activeLessonModal]);

  useEffect(() => {
    const effectiveLessonId = activeLessonModal?.id || lastActiveLessonIdRef.current;
    const newState = {
      selectedSubject,
      selectedVolume,
      selectedChapter,
      activeLessonTitle: activeLessonModal?.title,
      activeLessonId: effectiveLessonId,
    };
    
    const stringifiedState = JSON.stringify(newState);
    
    if (lastReportedStateRef.current !== stringifiedState) {
      lastReportedStateRef.current = stringifiedState;
      onStateChange?.(newState);
    }
  }, [selectedSubject, selectedVolume, selectedChapter, activeLessonModal, onStateChange]);
  const [viewDisplayMode, setViewDisplayMode] = useState<'grid' | 'table'>('table');

  const docFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // PDF Master Upload State (for Subject)
  const [isUploadingMasterPdf, setIsUploadingMasterPdf] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  // Rich Subject Edit Modal States
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjEmoji, setEditSubjEmoji] = useState('');
  const [editSubjTeacher, setEditSubjTeacher] = useState('');
  const [editSubjColor, setEditSubjColor] = useState('#3b82f6');

  // State for 3-input Add Lesson Lightbox Modal (Môn, Chương, Bài)
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [addLessonSubject, setAddLessonSubject] = useState('');
  const [addLessonChapter, setAddLessonChapter] = useState('');
  const [addLessonTitle, setAddLessonTitle] = useState('');
  const [isCustomSubjectInput, setIsCustomSubjectInput] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  const handleSaveNewLesson = () => {
    const finalSubject = (isCustomSubjectInput ? customSubjectName : addLessonSubject).trim();
    const finalChapter = addLessonChapter.trim();
    const finalTitle = addLessonTitle.trim();

    if (!finalSubject || !finalChapter || !finalTitle) {
      alert('Vui lòng nhập đầy đủ thông tin cho cả 3 ô: Môn, Chương và Bài.');
      return;
    }

    const subjLessons = lessons.filter(
      (l) => l.subjectName.toLowerCase() === finalSubject.toLowerCase()
    );
    const maxLessonNum = subjLessons.reduce((max, l) => Math.max(max, l.lessonNumber || 0), 0);

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      lessonNumber: maxLessonNum + 1,
      title: finalTitle,
      subjectName: finalSubject,
      chapter: finalChapter,
      summary: `Nội dung trọng tâm bài ${finalTitle}`,
      keyPoints: [],
      completedHomeworkImages: [],
      sections: [],
      references: [],
    };

    if (onAddLesson) {
      onAddLesson(newLesson);
    }

    setSelectedSubject(finalSubject);
    setSelectedChapter('all');
    setIsAddLessonModalOpen(false);
  };

  // State for Chapter Collapse & Chapter Rename
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [editingChapterTitle, setEditingChapterTitle] = useState<string | null>(null);
  const [editingChapterNewName, setEditingChapterNewName] = useState<string>('');

  const toggleChapterCollapse = (chTitle: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chTitle]: !prev[chTitle],
    }));
  };

  const handleStartEditChapter = (chTitle: string) => {
    setEditingChapterTitle(chTitle);
    setEditingChapterNewName(chTitle);
  };

  const handleSaveChapterRename = (oldTitle: string) => {
    const trimmed = editingChapterNewName.trim();
    if (!trimmed || trimmed === oldTitle) {
      setEditingChapterTitle(null);
      return;
    }

    const affectedLessons = lessons.filter(
      (l) => (l.chapter || 'Bài học') === oldTitle
    );

    affectedLessons.forEach((l) => {
      onUpdateLesson({
        ...l,
        chapter: trimmed,
      });
    });

    if (selectedChapter === oldTitle) {
      setSelectedChapter(trimmed);
    }

    if (collapsedChapters[oldTitle] !== undefined) {
      setCollapsedChapters((prev) => {
        const next = { ...prev };
        next[trimmed] = next[oldTitle];
        delete next[oldTitle];
        return next;
      });
    }

    setUserCreatedEmptyChapters((prev) =>
      prev.map((c) => (c === oldTitle ? trimmed : c))
    );

    setEditingChapterTitle(null);
  };

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState('');

  // Reference materials & PDF states
  const [showAddRefModal, setShowAddRefModal] = useState(false);
  const [refType, setRefType] = useState<'youtube' | 'html' | 'image' | 'link'>('youtube');
  const [refTitle, setRefTitle] = useState('');
  const [refUrl, setRefUrl] = useState('');
  const [refContent, setRefContent] = useState('');
  const [previewRef, setPreviewRef] = useState<LessonReference | null>(null);
  const [activeRefFilter, setActiveRefFilter] = useState<'all' | 'youtube' | 'image' | 'html' | 'link'>('all');

  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);
  const refFileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper for Youtube embed
  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // PDF Upload Handler
  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeLessonModal) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const updated = {
        ...activeLessonModal,
        masterDocumentUrl: dataUrl,
        pdfPageNumber: activeLessonModal.pdfPageNumber || 1
      };
      onUpdateLesson(updated);
      setActiveLessonModal(updated);
    } catch (err) {
      alert('Không thể đọc file PDF. Vui lòng thử lại!');
    }
  };

  // Prompt or choose PDF source
  const handlePromptPdfUrl = () => {
    if (!activeLessonModal) return;
    const choice = confirm('Bạn muốn tải file PDF từ máy tính (Nhấn OK) hay Nhập đường link web URL (Nhấn Cancel)?');
    if (choice) {
      pdfFileInputRef.current?.click();
    } else {
      const newUrl = prompt('Nhập URL của file PDF Sách Giáo Khoa (Ví dụ: https://example.com/sgk.pdf):', activeLessonModal.masterDocumentUrl || '');
      if (newUrl !== null) {
        const updated = {
          ...activeLessonModal,
          masterDocumentUrl: newUrl,
          pdfPageNumber: activeLessonModal.pdfPageNumber || 1
        };
        onUpdateLesson(updated);
        setActiveLessonModal(updated);
      }
    }
  };

  // Reference material submit
  const handleAddReferenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLessonModal || !refTitle) return;

    const newRef: LessonReference = {
      id: `ref-${Date.now()}`,
      type: refType,
      title: refTitle,
      url: refUrl || refContent,
      htmlContent: refType === 'html' ? refContent : undefined,
    };

    const existingRefs = activeLessonModal.references || [];
    const updatedLesson = {
      ...activeLessonModal,
      references: [...existingRefs, newRef],
    };

    onUpdateLesson(updatedLesson);
    setActiveLessonModal(updatedLesson);
    setShowAddRefModal(false);
    setRefTitle('');
    setRefUrl('');
    setRefContent('');
  };

  const handleDeleteReference = (refId: string) => {
    if (!activeLessonModal) return;
    const updatedRefs = (activeLessonModal.references || []).filter(r => r.id !== refId);
    const updatedLesson = {
      ...activeLessonModal,
      references: updatedRefs,
    };
    onUpdateLesson(updatedLesson);
    setActiveLessonModal(updatedLesson);
  };

  const handleRefFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (refType === 'image') {
      const dataUrl = await readFileAsDataURL(file);
      setRefUrl(dataUrl);
      if (!refTitle) setRefTitle(file.name);
    } else if (refType === 'html') {
      const text = await readFileAsText(file);
      setRefContent(text);
      if (!refTitle) setRefTitle(file.name);
    }
  };

  // Rich Subject Editing Handlers
  const handleOpenEditSubjectModal = (subj: Subject) => {
    setSubjectToEdit(subj);
    setEditSubjName(subj.name);
    setEditSubjEmoji(subj.emoji || '');
    setEditSubjTeacher(subj.defaultTeacher || '');
    setEditSubjColor(subj.color || '#3b82f6');
  };

  const handleSaveSubjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !onUpdateSubject) return;
    
    const updatedSubj = {
      ...subjectToEdit,
      name: editSubjName.trim() || subjectToEdit.name,
      emoji: editSubjEmoji.trim() || undefined,
      defaultTeacher: editSubjTeacher.trim() || subjectToEdit.defaultTeacher,
      color: editSubjColor,
      bgColor: `${editSubjColor}15`,
    };
    
    onUpdateSubject(updatedSubj);
    
    if (selectedSubject.toLowerCase() === subjectToEdit.name.toLowerCase()) {
      setSelectedSubject(updatedSubj.name);
    }
    
    setSubjectToEdit(null);
  };

  // Sync when param changes (e.g. from Timetable direct link or Breadcrumb)
  useEffect(() => {
    if (selectedSubjectParam) {
      setSelectedSubject(selectedSubjectParam);
    }
  }, [selectedSubjectParam]);

  useEffect(() => {
    if (selectedVolumeParam !== undefined) {
      setSelectedVolume(selectedVolumeParam);
    }
  }, [selectedVolumeParam]);

  useEffect(() => {
    if (selectedChapterParam !== undefined) {
      setSelectedChapter(selectedChapterParam);
    }
  }, [selectedChapterParam]);

  useEffect(() => {
    if (selectedLessonIdParam) {
      const target = lessons.find((l) => l.id === selectedLessonIdParam);
      if (target) {
        setSelectedSubject(target.subjectName);
        setActiveLessonModal(target);
      }
    }
  }, [selectedLessonIdParam]);

  // Sync activeLessonModal with updated lessons array without closing it on updates
  useEffect(() => {
    if (activeLessonModal) {
      const updated = lessons.find((l) => l.id === activeLessonModal.id);
      if (updated && updated !== activeLessonModal) {
        setActiveLessonModal(updated);
      }
    }
  }, [lessons]);

  // Clean academic subject list
  const academicSubjects = useMemo(() => {
    return subjects.filter((s) => s.name !== 'Chào cờ' && s.name !== 'SHL');
  }, [subjects]);

  // Count lessons per subject
  const subjectLessonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    lessons.forEach((l) => {
      counts[l.subjectName] = (counts[l.subjectName] || 0) + 1;
    });
    return counts;
  }, [lessons]);

  // Chapters of current subject
  const chaptersOfCurrentSubject = useMemo(() => {
    if (selectedSubject === 'all') return [];
    const chSet = new Set<string>();
    lessons
      .filter((l) => l.subjectName.toLowerCase() === selectedSubject.toLowerCase())
      .forEach((l) => {
        if (l.chapter) chSet.add(l.chapter);
      });
    return Array.from(chSet);
  }, [lessons, selectedSubject]);

  // Filtered lessons with status categorization (Bài đã học & Bài chưa học)
  const subjectLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      return (
        selectedSubject === 'all' ||
        lesson.subjectName.toLowerCase() === selectedSubject.toLowerCase()
      );
    });
  }, [lessons, selectedSubject]);

  const completedCount = useMemo(() => {
    return subjectLessons.filter((l) =>
      studyRecords.some(
        (r) => r.lessonId === l.id || (r.lessonTitle || '').toLowerCase() === (l.title || '').toLowerCase()
      )
    ).length;
  }, [subjectLessons, studyRecords]);

  const uncompletedCount = useMemo(() => {
    return subjectLessons.length - completedCount;
  }, [subjectLessons, completedCount]);

  const getLessonVolume = (lesson: Lesson): number => {
    if (typeof lesson.volume === 'number') return lesson.volume;
    if (lesson.term === '2' || (lesson.chapter && (lesson.chapter.includes('Tập 2') || lesson.chapter.includes('HK2')))) return 2;
    return 1;
  };

  const filteredLessons = useMemo(() => {
    return lessons
      .filter((lesson) => {
        const matchSubject =
          selectedSubject === 'all' ||
          lesson.subjectName.toLowerCase() === selectedSubject.toLowerCase();

        const matchVolume = true;

        const matchChapter =
          selectedChapter === 'all' ||
          !lesson.chapter ||
          lesson.chapter === selectedChapter;

        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          lesson.title.toLowerCase().includes(q) ||
          (lesson.summary && lesson.summary.toLowerCase().includes(q)) ||
          (lesson.chapter && lesson.chapter.toLowerCase().includes(q)) ||
          lesson.subjectName.toLowerCase().includes(q) ||
          (lesson.keyPoints && lesson.keyPoints.some((kp) => kp.toLowerCase().includes(q)));

        return matchSubject && matchVolume && matchChapter && matchQuery;
      })
      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
  }, [lessons, selectedSubject, selectedVolume, selectedChapter, searchQuery]);

  // Reset editor mode when switching subjects
  useEffect(() => {
    setIsEditorMode(false);
    setAddingLessonToChapter(null);
    setIsAddingNewChapter(false);
  }, [selectedSubject]);

  // Group lessons by Chapter for presentation view
  const lessonsByChapter = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    filteredLessons.forEach((l) => {
      const ch = l.chapter || 'Bài học';
      if (!map[ch]) map[ch] = [];
      map[ch].push(l);
    });
    // Include user-created empty chapters for current subject
    if (selectedSubject !== 'all') {
      userCreatedEmptyChapters.forEach((ch) => {
        if (!map[ch]) {
          map[ch] = [];
        }
      });
    }
    return map;
  }, [filteredLessons, userCreatedEmptyChapters, selectedSubject]);

  const allChapterTitles = useMemo(() => {
    return Object.keys(lessonsByChapter);
  }, [lessonsByChapter]);

  const isAllChaptersCollapsed = useMemo(() => {
    if (allChapterTitles.length === 0) return false;
    return allChapterTitles.every((t) => collapsedChapters[t]);
  }, [allChapterTitles, collapsedChapters]);

  const toggleAllChaptersCollapse = () => {
    if (isAllChaptersCollapsed) {
      setCollapsedChapters({});
    } else {
      const next: Record<string, boolean> = {};
      allChapterTitles.forEach((t) => {
        next[t] = true;
      });
      setCollapsedChapters(next);
    }
  };

  const handleSelectSubject = (subjName: string) => {
    setIsEditorMode(false);
    setAddingLessonToChapter(null);
    setIsAddingNewChapter(false);
    setSelectedSubject(subjName);
    setSelectedChapter('all');
    setActiveLessonModal(null);
  };

  const handleMasterPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, subjectName: string) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSubject) return;

    setIsUploadingMasterPdf(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const targetSubj = subjects.find(s => s.name === subjectName);
      if (targetSubj) {
        onUpdateSubject({
          ...targetSubj,
          masterPdfUrl: dataUrl,
          masterPdfName: file.name
        });
        alert(`Đã tải SGK thành công cho môn ${subjectName}!`);
      }
    } catch (err) {
      alert('Có lỗi khi đọc tệp PDF. Vui lòng thử lại.');
    } finally {
      setIsUploadingMasterPdf(false);
    }
  };

  const currentSubjectObj = subjects.find(s => s.name === selectedSubject);

  // Subject Management Helper Functions
  const handleAddNewSubject = () => {
    const trimmed = newSubjectName.trim();
    if (!trimmed) return;
    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      name: trimmed,
      defaultTeacher: 'Giáo viên',
      color: 'bg-blue-500',
    };
    if (onAddSubject) {
      onAddSubject(newSubj);
    }
    setNewSubjectName('');
  };

  const handleSaveEditSubject = (subj: Subject) => {
    const trimmed = editingSubjectName.trim();
    if (!trimmed || trimmed === subj.name) {
      setEditingSubjectId(null);
      return;
    }
    if (onUpdateSubject) {
      onUpdateSubject({
        ...subj,
        name: trimmed,
      });
    }
    if (selectedSubject.toLowerCase() === subj.name.toLowerCase()) {
      setSelectedSubject(trimmed);
    }
    setEditingSubjectId(null);
    setEditingSubjectName('');
  };

  const handleDeleteSubjectConfirm = (subj: Subject) => {
    const count = subjectLessonCounts[subj.name] || 0;
    let msg = `Bạn có chắc chắn muốn xóa môn "${subj.name}" khỏi danh mục menu không?`;
    if (count > 0) {
      msg = `Môn "${subj.name}" hiện đang có ${count} bài học trong thư viện. Bạn vẫn muốn xóa môn này khỏi danh mục chứ?`;
    }
    if (confirm(msg)) {
      if (onDeleteSubject) {
        onDeleteSubject(subj.id);
      }
      if (selectedSubject.toLowerCase() === subj.name.toLowerCase()) {
        const remaining = academicSubjects.filter((s) => s.id !== subj.id);
        if (remaining.length > 0) {
          setSelectedSubject(remaining[0].name);
        }
      }
    }
  };

  // Active subject being managed in editor mode
  const activeManageSubject = selectedSubject === 'all' ? (academicSubjects[0]?.name || 'Toán') : selectedSubject;

  const handleAddNewLessonToChapter = (chapterTitle: string) => {
    const trimmedTitle = newLessonTitleInput.trim();
    if (!trimmedTitle) return;

    const subjLessons = lessons.filter(
      (l) => l.subjectName.toLowerCase() === activeManageSubject.toLowerCase()
    );
    const maxLessonNum = subjLessons.reduce((max, l) => Math.max(max, l.lessonNumber || 0), 0);

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      lessonNumber: maxLessonNum + 1,
      title: trimmedTitle,
      subjectName: activeManageSubject,
      chapter: chapterTitle,
      summary: `Nội dung bài ${trimmedTitle}`,
      keyPoints: [],
      completedHomeworkImages: [],
      sections: [],
      references: [],
    };

    if (onAddLesson) {
      onAddLesson(newLesson);
    }

    setNewLessonTitleInput('');
    setAddingLessonToChapter(null);
  };

  const handleDeleteChapterConfirmAction = (chapterTitle: string) => {
    const affectedLessons = lessons.filter(
      (l) => (l.chapter || 'Bài học') === chapterTitle && l.subjectName.toLowerCase() === activeManageSubject.toLowerCase()
    );

    affectedLessons.forEach((l) => {
      if (onDeleteLesson) {
        onDeleteLesson(l.id);
      }
    });

    setUserCreatedEmptyChapters((prev) => prev.filter((c) => c !== chapterTitle));
    setChapterToDeleteConfirm(null);
  };

  const handleAddNewChapter = () => {
    const trimmed = newChapterTitleInput.trim();
    if (!trimmed) return;
    if (!userCreatedEmptyChapters.includes(trimmed)) {
      setUserCreatedEmptyChapters((prev) => [...prev, trimmed]);
    }
    setNewChapterTitleInput('');
    setIsAddingNewChapter(false);
    setAddingLessonToChapter(trimmed);
    setCollapsedChapters((prev) => ({ ...prev, [trimmed]: false }));
  };

  const leftSubjectSidebar = (
    <div 
      className="space-y-3 w-full h-full shrink-0 overflow-y-auto overflow-x-hidden pr-1"
    >
      
      {/* Menu Môn Học Header */}
      <div 
        className="bg-white dark:bg-[#161f30] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs w-full shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            if (activeLessonModal) {
              setActiveLessonModal(null);
            }
          }}
          className="w-full text-left px-3.5 py-2.5 bg-blue-700 dark:bg-blue-800 text-white font-bold text-[14px] uppercase tracking-wider flex items-center justify-between cursor-pointer hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors"
          title="Nhấp để trở lại Thư Viện Bài Học"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>Danh Mục Môn Học</span>
          </span>
        </button>

        {/* Subject List */}
        <div className="p-1.5 space-y-1 text-[14px] font-medium">
          {academicSubjects.map((subj) => {
            const isSelected = selectedSubject.toLowerCase() === subj.name.toLowerCase();
            const count = subjectLessonCounts[subj.name] || 0;

            return (
              <button
                key={subj.id || subj.name}
                type="button"
                onClick={() => handleSelectSubject(subj.name)}
                className={`relative group w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-200 ease-out text-left cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold border-l-4 border-emerald-500 shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-sky-100 dark:hover:bg-sky-950/50 hover:text-blue-700 dark:hover:text-sky-300 font-medium'
                }`}
                title={`Nhấp để xem danh sách bài học môn ${subj.name}`}
              >
                <div className="flex-1 flex items-center gap-2 truncate text-left py-0.5 text-[14px]">
                  {/* Chấm tròn tinh tế */}
                  <span className="relative flex items-center justify-center shrink-0 w-2 h-2">
                    {isSelected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span 
                      className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                        isSelected 
                          ? 'bg-emerald-500 ring-2 ring-emerald-400/50 scale-110' 
                          : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-sky-500 group-hover:scale-110'
                      }`} 
                    />
                  </span>

                  <span className="truncate">Môn {subj.name}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[12px] px-2 py-0.5 rounded-md font-bold block transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-200/80 dark:group-hover:bg-sky-900 group-hover:text-blue-800 dark:group-hover:text-sky-200'
                  }`}>
                    {count} bài
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nút Tính năng Sửa / Xóa / Thêm Menu Môn Học nằm ĐỘC LẬP phía dưới menu trái */}
      <button
        type="button"
        onClick={() => setIsManageSubjectsModalOpen(true)}
        className="w-full py-2.5 px-3 rounded-xl border border-dashed border-blue-400/80 dark:border-blue-700/80 bg-white dark:bg-[#161f30] hover:bg-blue-50/80 dark:hover:bg-slate-800/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
        title="Sửa tên, xóa môn học hoặc thêm môn học mới vào danh mục"
      >
        <Settings className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>⚙️ Quản Lý / Sửa Môn Học</span>
      </button>
    </div>
  );

  if (activeLessonModal) {
    return (
      <div className="animate-in fade-in duration-200 h-[calc(100vh-125px)] min-h-[580px] flex flex-col w-full">
        <div className="flex flex-col lg:flex-row gap-4 items-start flex-1 min-h-0 h-full w-full">
          {/* LEFT COLUMN: MENU CÁC MÔN HỌC (Giữ nguyên menu trái để truy xuất các môn nhanh) */}
          <div className="w-full lg:w-[280px] shrink-0 h-[220px] lg:h-full overflow-hidden relative">
            {leftSubjectSidebar}
            
            {/* Blocking Overlay for Left Sidebar when there are unsaved changes */}
            {lessonHasUnsaved && (
              <div 
                className="absolute inset-0 z-50 cursor-not-allowed bg-transparent"
                title="Vui lòng lưu bài học trước khi chuyển trang!"
                onClickCapture={(e) => {
                  e.stopPropagation();
                  setRequestExitSignal(s => s + 1);
                }}
              />
            )}
          </div>

          {/* RIGHT COLUMN: KHÔNG GIAN NỘI DUNG BÀI HỌC */}
          <div className="flex-1 min-w-0 w-full h-full flex flex-col min-h-0 overflow-hidden">
            <InteractiveLessonWorkspaceModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => setActiveLessonModal(null)}
              onUnsavedChangesChange={setLessonHasUnsaved}
              requestExitSignal={requestExitSignal}
              lesson={activeLessonModal}
              subject={currentSubjectObj}
              currentRole={currentRole}
              initialSourceType={activeLessonModalTab}
              onSaveLesson={(updated) => {
                onUpdateLesson(updated);
                setActiveLessonModal(updated);
              }}
              onOpenUploadMindmap={onOpenUploadMindmap}
              studyRecord={studyRecords.find(
                (r) => r.lessonId === activeLessonModal.id || (r.lessonTitle || '').toLowerCase() === (activeLessonModal.title || '').toLowerCase()
              )}
              onNavigateToTimetable={onNavigateToTimetable}
              onCompleteLessonWithPhotos={onCompleteLessonWithPhotos}
              onDeleteRecord={onDeleteRecord}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200 h-[calc(100vh-125px)] min-h-[580px] flex flex-col">
      
      {/* 2. Main 2-Column Architecture (Strict Vũ Lăng Library Pattern) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start flex-1 min-h-0 h-full">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: MENU CÁC MÔN HỌC                            */}
        {/* ======================================================== */}
        <div className="w-full lg:w-[300px] shrink-0 h-full overflow-hidden">
          {leftSubjectSidebar}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: NỘI DUNG TRÌNH BÀY CÁC CHƯƠNG & BÀI HỌC    */}
        {/* ======================================================== */}
        <div className="flex-1 min-w-0 w-full h-full flex flex-col min-h-0 space-y-3">
          
          {/* Header Bar: Compact & Simple single-row header */}
          <div className="bg-white dark:bg-[#161f30] px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Left side: Title */}
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-[16px] sm:text-[18px] text-slate-900 dark:text-white shrink-0">
                {selectedSubject === 'all'
                  ? 'Thư Viện Bài Học'
                  : `Môn ${selectedSubject}`}
              </h2>
            </div>

            {/* Right side: Editor Mode Toggle Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(currentRole === 'admin' || currentRole === 'teacher' || currentRole === 'parent' || currentRole === 'student') && (
                isEditorMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorMode(false);
                      setAddingLessonToChapter(null);
                      setIsAddingNewChapter(false);
                      setEditingChapterTitle(null);
                      setEditingLessonId(null);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ring-2 ring-emerald-400/40"
                    title="Lưu tất cả thay đổi và quay về chế độ xem bài học"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Hoàn tất (Đã lưu)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorMode(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95"
                    title={`Bật chế độ chỉnh sửa trực tiếp chương và bài học`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chế độ Chỉnh sửa</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Subtle Banner khi đang ở Chế độ Chỉnh sửa */}
          {isEditorMode && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-lg px-3.5 py-2 flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 text-xs animate-fadeIn shrink-0 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 shrink-0 font-bold text-[11px]">
                  ✏️ Chế độ Chỉnh sửa trực tiếp
                </span>
                <span className="truncate">
                  Bấm trực tiếp vào tên để sửa, bấm <strong>[+ Thêm bài]</strong> để thêm bài mới. Mọi thao tác được <strong>tự động lưu</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditorMode(false);
                  setAddingLessonToChapter(null);
                  setIsAddingNewChapter(false);
                  setEditingChapterTitle(null);
                  setEditingLessonId(null);
                }}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-bold rounded-md text-[11px] cursor-pointer shrink-0 transition-colors"
              >
                Đóng Editor
              </button>
            </div>
          )}

          {/* TAB 1: DANH SÁCH BÀI HỌC */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
            {filteredLessons.length === 0 ? (
              <div className="bg-white dark:bg-[#161f30] p-10 rounded-lg border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Không tìm thấy bài học nào phù hợp
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thử đổi từ khóa tìm kiếm hoặc chọn &quot;Tất cả môn học&quot; từ danh mục bên trái.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedChapter('all');
                  }}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Xem tất cả bài học
                </button>
              </div>
            ) : viewDisplayMode === 'grid' ? (
                /* TRÌNH BÀY DẠNG CHƯƠNG BÀI HỌC TRỰC QUAN (CARDS BY CHAPTER) */
                <div className="space-y-4">
                  {(Object.entries(lessonsByChapter) as [string, Lesson[]][]).map(([chapterTitle, chLessons]) => {
                    return (
                      <div 
                        key={chapterTitle}
                        className="bg-white dark:bg-[#161f30] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
                      >
                        {/* Lessons Grid */}
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {chLessons.map((lesson, lIdx) => {
                          const hasRecord = studyRecords.some(
                            (r) => r.lessonId === lesson.id || (r.lessonTitle || '').toLowerCase() === (lesson.title || '').toLowerCase()
                          );

                          return (
                            <div
                              key={lesson.id ? `grid-${lesson.id}` : `grid-${lesson.subjectName}-${lesson.lessonNumber || lIdx}-${lesson.title}`}
                              className="rounded-lg transition-all p-3 flex flex-col justify-between group relative bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-xs"
                            >
                              <div className="space-y-2">
                                {/* Top badge */}
                                <div className="flex items-center justify-between text-[13.5px] gap-1">
                                  <span className="px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800 text-[13.5px]">
                                    {lesson.subjectName} • Bài {lesson.lessonNumber}
                                  </span>
                                  {hasRecord ? (
                                    <span className="inline-flex items-center gap-1 text-[13.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Bài Đã Học</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[13.5px] text-slate-400 dark:text-slate-500 font-medium">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Bài Chưa Học</span>
                                    </span>
                                  )}
                                </div>

                                {/* Lesson Title */}
                                {editingLessonId === lesson.id ? (
                                  <input
                                    type="text"
                                    value={editingLessonTitle}
                                    onChange={(e) => setEditingLessonTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingLessonTitle.trim()) {
                                          onUpdateLesson({ ...lesson, title: editingLessonTitle.trim() });
                                        }
                                        setEditingLessonId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingLessonId(null);
                                      }
                                    }}
                                    onBlur={() => {
                                      if (editingLessonTitle.trim()) {
                                        onUpdateLesson({ ...lesson, title: editingLessonTitle.trim() });
                                      }
                                      setEditingLessonId(null);
                                    }}
                                    autoFocus
                                    className="font-bold text-[17px] sm:text-[18px] text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 border border-blue-500 rounded px-1.5 py-0.5 outline-none w-full"
                                  />
                                ) : (
                                  <h3 
                                    onClick={() => setActiveLessonModal(lesson)}
                                    className="font-bold text-[17px] sm:text-[18px] text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer min-h-[44px] flex items-start gap-1 leading-snug"
                                    title={lesson.title}
                                  >
                                    <span className="flex-1">{lesson.title}</span>
                                    {(currentRole === 'admin' || currentRole === 'parent' || currentRole === 'teacher') && (
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLessonId(lesson.id);
                                            setEditingLessonTitle(lesson.title);
                                          }}
                                          className="text-slate-400 hover:text-blue-500 transition-colors p-0.5"
                                          title="Đổi tên bài học"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLessonToDeleteConfirm(lesson);
                                          }}
                                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                          title="Xóa bài học"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </h3>
                                )}

                                {/* Key Summary Preview */}
                                <p className="text-[15px] sm:text-[15.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {lesson.summary || 'Trọng tâm kiến thức chuẩn SGK và phương pháp giải bài tập nhanh.'}
                                </p>
                              </div>

                              {/* Action Footer */}
                              <div className="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1.5 text-[14px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveLessonModalTab('homework_image');
                                    setActiveLessonModal(lesson);
                                  }}
                                  className={`flex-1 py-2 rounded-lg font-bold text-[13.5px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                    hasRecord
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 active:scale-95'
                                  }`}
                                  title={hasRecord ? "Xem / Cập nhật ảnh bài đã nộp" : "Nộp ảnh bài học để hoàn thành"}
                                >
                                  {hasRecord && <Camera className="w-4 h-4" />}
                                  <span>{hasRecord ? "✓ Đã nộp bài" : "Bài chưa học"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                          </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TRÌNH BÀY DẠNG BẢNG DANH MỤC (TABLE VIEW GROUPED BY CHAPTER) */
                <div className="bg-white dark:bg-[#161f30] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] border-collapse">
                      <thead>
                        <tr className="bg-[#005fc0] text-white font-bold text-[13px] tracking-wide shadow-xs">
                          <th className="py-3 px-4 text-left text-white border-r border-blue-400/30">Tên Bài Học &amp; Nội Dung</th>
                          <th className="py-3 px-3 w-28 text-white/95 border-r border-blue-400/30">Môn Học</th>
                          <th className="py-3 px-3 w-36 text-center text-white/95 border-r border-blue-400/30">Trạng Thái</th>
                          <th className="py-3 px-3 w-44 text-center text-white/95">
                            {isEditorMode ? 'Quản lý' : 'Thao Tác'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(Object.entries(lessonsByChapter) as [string, Lesson[]][]).map(([chapterTitle, chLessons]) => {
                          const isCollapsed = Boolean(collapsedChapters[chapterTitle]);

                          return (
                            <React.Fragment key={chapterTitle}>
                              {/* Chapter Header Row */}
                              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y border-slate-200 dark:border-slate-700/80 font-bold text-[13.5px] text-slate-800 dark:text-slate-100">
                                <td colSpan={4} className="py-2.5 px-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => toggleChapterCollapse(chapterTitle)}
                                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                                        title={isCollapsed ? 'Mở rộng chương' : 'Thu gọn chương'}
                                      >
                                        {isCollapsed ? (
                                          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        )}
                                      </button>

                                      {editingChapterTitle === chapterTitle ? (
                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="text"
                                            value={editingChapterNewName}
                                            onChange={(e) => setEditingChapterNewName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveChapterRename(chapterTitle);
                                              if (e.key === 'Escape') setEditingChapterTitle(null);
                                            }}
                                            className="px-2 py-0.5 text-[14px] font-bold bg-white dark:bg-slate-900 border border-blue-500 rounded outline-none text-slate-900 dark:text-white"
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleSaveChapterRename(chapterTitle)}
                                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer shrink-0"
                                            title="Lưu tên chương"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingChapterTitle(null)}
                                            className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 cursor-pointer shrink-0"
                                            title="Hủy"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span
                                            onClick={() => toggleChapterCollapse(chapterTitle)}
                                            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[14px] text-slate-900 dark:text-slate-100"
                                            title="Bấm để thu gọn/mở rộng"
                                          >
                                            {chapterTitle}
                                          </span>

                                          {(isEditorMode || currentRole === 'admin' || currentRole === 'teacher' || currentRole === 'parent') && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEditChapter(chapterTitle);
                                              }}
                                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer shrink-0"
                                              title="Đổi tên chương"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {isEditorMode && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setAddingLessonToChapter(chapterTitle);
                                              setNewLessonTitleInput('');
                                              setCollapsedChapters((prev) => ({ ...prev, [chapterTitle]: false }));
                                            }}
                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                            title="Thêm bài học mới vào chương này"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>+ Thêm bài</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setChapterToDeleteConfirm({
                                                chapterTitle,
                                                subjectName: activeManageSubject,
                                                lessonCount: chLessons.length,
                                              });
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer shrink-0"
                                            title="Xóa toàn bộ chương này"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => toggleChapterCollapse(chapterTitle)}
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                                          isCollapsed
                                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                            : 'bg-white/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                                        }`}
                                      >
                                        <span>{chLessons.length} bài</span>
                                        <span>{isCollapsed ? '• Đã thu gọn' : '• Thu gọn'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>

                              {/* Inline add lesson row */}
                              {addingLessonToChapter === chapterTitle && (
                                <tr className="bg-blue-50/80 dark:bg-blue-950/40 border-y border-blue-200 dark:border-blue-800 animate-fadeIn">
                                  <td colSpan={4} className="py-2.5 px-4 pl-8 sm:pl-10">
                                    <div className="flex items-center gap-2 max-w-xl">
                                      <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <input
                                        type="text"
                                        value={newLessonTitleInput}
                                        onChange={(e) => setNewLessonTitleInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleAddNewLessonToChapter(chapterTitle);
                                          if (e.key === 'Escape') setAddingLessonToChapter(null);
                                        }}
                                        placeholder="Nhập tên bài học mới rồi nhấn Enter..."
                                        className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-blue-500 rounded-lg outline-none text-slate-900 dark:text-white"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddNewLessonToChapter(chapterTitle)}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                                      >
                                        Lưu bài
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAddingLessonToChapter(null)}
                                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer transition-colors shrink-0"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* Empty Chapter Notice */}
                              {!isCollapsed && chLessons.length === 0 && addingLessonToChapter !== chapterTitle && (
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                  <td colSpan={4} className="py-3 px-4 pl-8 sm:pl-10 text-xs italic text-slate-400 dark:text-slate-500">
                                    Chương này hiện chưa có bài học.{' '}
                                    {isEditorMode && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddingLessonToChapter(chapterTitle);
                                          setNewLessonTitleInput('');
                                        }}
                                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer ml-1"
                                      >
                                        + Bấm vào đây để thêm bài
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )}

                              {/* Lesson Rows */}
                              {!isCollapsed && chLessons.map((lesson, lIdx) => {
                              const hasRecord = studyRecords.some(
                                (r) => r.lessonId === lesson.id || (r.lessonTitle || '').toLowerCase() === (lesson.title || '').toLowerCase()
                              );

                              return (
                                <tr
                                  key={lesson.id ? `tbl-${lesson.id}` : `tbl-${lesson.subjectName}-${lesson.lessonNumber || lIdx}-${lesson.title}`}
                                  className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/50 group"
                                >
                                  <td className="py-2.5 px-4 pl-8 sm:pl-10 font-normal">
                                    {editingLessonId === lesson.id ? (
                                      <input
                                        type="text"
                                        value={editingLessonTitle}
                                        onChange={(e) => setEditingLessonTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            if (editingLessonTitle.trim()) {
                                              onUpdateLesson({ ...lesson, title: editingLessonTitle.trim() });
                                            }
                                            setEditingLessonId(null);
                                          } else if (e.key === 'Escape') {
                                            setEditingLessonId(null);
                                          }
                                        }}
                                        onBlur={() => {
                                          if (editingLessonTitle.trim()) {
                                            onUpdateLesson({ ...lesson, title: editingLessonTitle.trim() });
                                          }
                                          setEditingLessonId(null);
                                        }}
                                        autoFocus
                                        className="font-normal text-[14.5px] sm:text-[15px] text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 border border-blue-500 rounded px-2 py-1 outline-none w-full max-w-md"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500/80 dark:bg-blue-400/80 shrink-0 transition-all group-hover:scale-125 group-hover:bg-blue-600 dark:group-hover:bg-blue-300" />
                                        <span 
                                          onClick={() => {
                                            if (isEditorMode) {
                                              setEditingLessonId(lesson.id);
                                              setEditingLessonTitle(lesson.title);
                                            } else {
                                              setActiveLessonModal(lesson);
                                            }
                                          }}
                                          className="text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-normal cursor-pointer text-[14.5px] sm:text-[15px] transition-colors"
                                          title={isEditorMode ? "Bấm để sửa tên bài học" : "Bấm để xem chi tiết bài học"}
                                        >
                                          {lesson.title}
                                        </span>
                                        {(isEditorMode || currentRole === 'admin' || currentRole === 'parent' || currentRole === 'teacher') && (
                                          <div className={`${isEditorMode ? 'flex' : 'opacity-0 group-hover:opacity-100'} items-center gap-0.5 shrink-0 transition-opacity`}>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingLessonId(lesson.id);
                                                setEditingLessonTitle(lesson.title);
                                              }}
                                              className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                              title="Đổi tên bài học"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLessonToDeleteConfirm(lesson);
                                              }}
                                              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                              title="Xóa bài học"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 text-[14px]">
                                    {lesson.subjectName}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {hasRecord ? (
                                      <span className="inline-flex items-center gap-1 text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Bài Đã Học</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span>Bài Chưa Học</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isEditorMode ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingLessonId(lesson.id);
                                            setEditingLessonTitle(lesson.title);
                                          }}
                                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                          title="Đổi tên bài học"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                          <span>Sửa</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLessonToDeleteConfirm(lesson);
                                          }}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                          title="Xóa bài học"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Xóa</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveLessonModalTab('homework_image');
                                            setActiveLessonModal(lesson);
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                            hasRecord
                                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 active:scale-95'
                                          }`}
                                          title={hasRecord ? "Xem / Cập nhật ảnh bài đã nộp" : "Nộp ảnh bài học để hoàn thành"}
                                        >
                                          {hasRecord && <Camera className="w-3.5 h-3.5" />}
                                          <span>{hasRecord ? "✓ Đã nộp bài" : "Bài chưa học"}</span>
                                        </button>
                                        {(currentRole === 'admin' || currentRole === 'parent' || currentRole === 'teacher') && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLessonToDeleteConfirm(lesson);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded cursor-pointer transition-colors"
                                            title="Xóa bài học"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline Add Chapter Bar when in Editor Mode */}
                  {isEditorMode && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                      {isAddingNewChapter ? (
                        <div className="flex items-center gap-2 max-w-md w-full">
                          <input
                            type="text"
                            value={newChapterTitleInput}
                            onChange={(e) => setNewChapterTitleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddNewChapter();
                              if (e.key === 'Escape') setIsAddingNewChapter(false);
                            }}
                            placeholder="Ví dụ: Chương V - Thống kê và Xác suất..."
                            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-blue-500 rounded-lg outline-none text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddNewChapter}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
                          >
                            Tạo chương
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewChapter(false)}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer transition-colors shrink-0"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewChapter(true);
                            setNewChapterTitleInput('');
                          }}
                          className="px-3.5 py-1.5 border border-dashed border-blue-400 dark:border-blue-600 hover:border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Thêm Chương Mới</span>
                        </button>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Đang sửa danh mục môn: <strong>{activeManageSubject}</strong> • Tự động lưu tức thì
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* MODAL: KHÔNG GIAN HỌC TẬP & NHẬP LIỆU BÀI HỌC TƯƠNG TÁC (TOC 20% + NỘI DUNG 80%) */}
      {activeLessonModal && (
        <InteractiveLessonWorkspaceModal
          isOpen={!!activeLessonModal}
          onClose={() => setActiveLessonModal(null)}
          onUnsavedChangesChange={setLessonHasUnsaved}
          requestExitSignal={requestExitSignal}
          lesson={activeLessonModal}
          subject={currentSubjectObj}
          currentRole={currentRole}
          initialSourceType={activeLessonModalTab}
          onSaveLesson={(updated) => {
            onUpdateLesson(updated);
            setActiveLessonModal(updated);
          }}
          onOpenUploadMindmap={onOpenUploadMindmap}
          studyRecord={studyRecords.find(
            (r) => r.lessonId === activeLessonModal.id || (r.lessonTitle || '').toLowerCase() === (activeLessonModal.title || '').toLowerCase()
          )}
          onNavigateToTimetable={onNavigateToTimetable}
          activeTimetableSlotContext={activeTimetableSlotContext}
          onCompleteLessonWithPhotos={onCompleteLessonWithPhotos}
          onDeleteRecord={onDeleteRecord}
        />
      )}

      {/* MODAL 1: THÊM TÀI LIỆU THAM KHẢO (YOUTUBE, HTML, HÌNH ẢNH, LINK) */}
      {showAddRefModal && activeLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Thêm tài liệu tham khảo cho bài học</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRefModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReferenceSubmit} className="p-5 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Loại tài liệu:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRefType('youtube'); setRefUrl(''); setRefContent(''); }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      refType === 'youtube'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Youtube className="w-5 h-5 text-red-500" />
                    <span>Youtube</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRefType('html'); setRefUrl(''); setRefContent(''); }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      refType === 'html'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-emerald-500" />
                    <span>File HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRefType('image'); setRefUrl(''); setRefContent(''); }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      refType === 'image'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRefType('link'); setRefUrl(''); setRefContent(''); }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      refType === 'link'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="w-5 h-5 text-indigo-500" />
                    <span>Đường link</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên / Tựa đề tài liệu:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Video bài giảng môn Toán, Sơ đồ thí nghiệm, Trang mô phỏng..."
                  value={refTitle}
                  onChange={(e) => setRefTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Inputs based on type */}
              {refType === 'youtube' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đường link Youtube:
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={refUrl}
                    onChange={(e) => setRefUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              {refType === 'link' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ đường link website (URL):
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/tai-lieu"
                    value={refUrl}
                    onChange={(e) => setRefUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}

              {(refType === 'image' || refType === 'html') && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tải file từ máy tính hoặc dán URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={refFileInputRef}
                      type="file"
                      accept={refType === 'image' ? 'image/*' : '.html,.htm,text/html'}
                      onChange={handleRefFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => refFileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn file {refType.toUpperCase()}</span>
                    </button>
                    <input
                      type="text"
                      placeholder={refType === 'image' ? 'Hoặc dán URL ảnh ở đây...' : 'Hoặc dán URL HTML ở đây...'}
                      value={refUrl}
                      onChange={(e) => setRefUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {refType === 'html' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Hoặc dán mã HTML trực tiếp:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="<div><h1>Nội dung bài học HTML</h1></div>"
                        value={refContent}
                        onChange={(e) => setRefContent(e.target.value)}
                        className="w-full p-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRefModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm"
                >
                  Lưu tài liệu tham khảo ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM PREVIEW TÀI LIỆU (HTML / HÌNH ẢNH) */}
      {previewRef && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                {previewRef.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                {previewRef.type === 'html' && <Globe className="w-4 h-4 text-emerald-500" />}
                <span>{previewRef.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewRef(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[400px]">
              {previewRef.type === 'image' && previewRef.url && previewRef.url.trim() !== '' && (
                <img
                  src={previewRef.url}
                  alt={previewRef.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                />
              )}

              {previewRef.type === 'html' && (
                <iframe
                  srcDoc={previewRef.htmlContent || undefined}
                  src={(!previewRef.htmlContent && previewRef.url && previewRef.url.trim() !== '') ? previewRef.url : undefined}
                  title={previewRef.title}
                  className="w-full h-[70vh] bg-white rounded-lg border border-slate-700"
                />
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* MODAL 3: SỬA THÔNG TIN MÔN HỌC */}
      {subjectToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Cấu hình môn: {subjectToEdit.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSubjectToEdit(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectEdit} className="p-5 space-y-4">
              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên môn học:
                </label>
                <input
                  type="text"
                  required
                  value={editSubjName}
                  onChange={(e) => setEditSubjName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Default Teacher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Giáo viên phụ trách:
                </label>
                <input
                  type="text"
                  required
                  value={editSubjTeacher}
                  onChange={(e) => setEditSubjTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Emoji Representation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emoji biểu tượng:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={editSubjEmoji}
                    onChange={(e) => setEditSubjEmoji(e.target.value)}
                    className="w-16 px-3 py-2 text-xs text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['📚', '📐', '🧪', '🎨', '⚽', '📝', '🗣️', '💻', '🎼', '🌍'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEditSubjEmoji(em)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          editSubjEmoji === em ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 font-bold' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Theme Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Màu sắc đại diện trên TKB:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { hex: '#3b82f6', label: 'Xanh Dương', bg: 'bg-blue-500' },
                    { hex: '#10b981', label: 'Xanh Lá', bg: 'bg-emerald-500' },
                    { hex: '#8b5cf6', label: 'Tím', bg: 'bg-purple-500' },
                    { hex: '#f59e0b', label: 'Cam', bg: 'bg-amber-500' },
                    { hex: '#ef4444', label: 'Đỏ', bg: 'bg-red-500' },
                    { hex: '#06b6d4', label: 'Xanh Ngọc', bg: 'bg-cyan-500' },
                    { hex: '#ec4899', label: 'Hồng', bg: 'bg-pink-500' },
                    { hex: '#6366f1', label: 'Chàm', bg: 'bg-indigo-500' },
                  ].map((colorObj) => {
                    const isActive = editSubjColor.toLowerCase() === colorObj.hex.toLowerCase();
                    return (
                      <button
                        key={colorObj.hex}
                        type="button"
                        onClick={() => setEditSubjColor(colorObj.hex)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer hover:border-slate-400 text-[10px]"
                        style={{ borderColor: isActive ? colorObj.hex : undefined }}
                      >
                        <div className={`w-5 h-5 rounded-full ${colorObj.bg} flex items-center justify-center text-white`}>
                          {isActive && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`font-semibold ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                          {colorObj.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubjectToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-INPUT ADD LESSON LIGHTBOX MODAL (MÔN, CHƯƠNG, BÀI) */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161922] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-4 text-slate-900 dark:text-slate-100">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Thêm Bài Học Mới
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nhập 3 ô thông tin bên dưới (Môn, Chương, Bài)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with 3 inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveNewLesson();
              }}
              className="space-y-4"
            >
              {/* Ô 1: MÔN HỌC */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Ô Môn học <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={isCustomSubjectInput ? '__custom__' : addLessonSubject}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSubjectInput(true);
                        setCustomSubjectName('');
                      } else {
                        setIsCustomSubjectInput(false);
                        setAddLessonSubject(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="__custom__">➕ Nhập môn học mới...</option>
                  </select>

                  {isCustomSubjectInput && (
                    <input
                      type="text"
                      value={customSubjectName}
                      onChange={(e) => {
                        setCustomSubjectName(e.target.value);
                        setAddLessonSubject(e.target.value);
                      }}
                      placeholder="Nhập tên môn học mới (VD: Tiếng Anh 11)..."
                      className="w-full px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus
                      required
                    />
                  )}
                </div>
              </div>

              {/* Ô 2: CHƯƠNG */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Ô Chương <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addLessonChapter}
                  onChange={(e) => setAddLessonChapter(e.target.value)}
                  placeholder="VD: Chương I: Mệnh đề và tập hợp"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                {/* Quick chapter pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Chương I', 'Chương II', 'Chương III', 'Chương IV'].map((chap) => (
                    <button
                      key={chap}
                      type="button"
                      onClick={() => setAddLessonChapter(chap)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors ${
                        addLessonChapter === chap
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-300 dark:border-blue-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {chap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ô 3: BÀI */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  3. Ô Bài / Tên bài học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addLessonTitle}
                  onChange={(e) => setAddLessonTitle(e.target.value)}
                  placeholder="VD: Bài 1: Hàm số lượng giác và phương trình"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  autoFocus={!isCustomSubjectInput}
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo bài học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ / SỬA / XÓA MÔN HỌC */}
      {isManageSubjectsModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    ⚙️ Quản Lý Danh Mục Môn Học
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Thêm mới, sửa tên hoặc xóa các môn học trên menu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManageSubjectsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              
              {/* Form Thêm Môn Mới */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
                <label className="font-bold text-blue-900 dark:text-blue-200 block text-xs uppercase tracking-wider">
                  ➕ Thêm Môn Học Mới
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Nhập tên môn mới (VD: Khoa Học Tự Nhiên)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewSubject();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewSubject}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Môn</span>
                  </button>
                </div>
              </div>

              {/* Danh Sách Các Môn Học Hiện Tại */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  <span>DANH SÁCH MÔN HỌC HIỆN CÓ ({academicSubjects.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn khôi phục danh sách môn học mặc định ban đầu không?')) {
                        if (onResetSubjects) onResetSubjects();
                      }
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Khôi phục mặc định</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {academicSubjects.map((subj) => {
                    const count = subjectLessonCounts[subj.name] || 0;
                    const isEditing = editingSubjectId === subj.id;

                    return (
                      <div
                        key={subj.id || subj.name}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingSubjectName}
                              onChange={(e) => setEditingSubjectName(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEditSubject(subj);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditSubject(subj)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shrink-0"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubjectId(null);
                                setEditingSubjectName('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer shrink-0"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                                Môn {subj.name}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                                {count} bài
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubjectId(subj.id);
                                  setEditingSubjectName(subj.name);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Sửa tên môn"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSubjectConfirm(subj)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Xóa môn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                💡 Thay đổi sẽ tự động đồng bộ trên hệ thống.
              </span>
              <button
                type="button"
                onClick={() => setIsManageSubjectsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL XÁC NHẬN XÓA TOÀN BỘ CHƯƠNG */}
      {chapterToDeleteConfirm && (
        <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Xác nhận xóa Chương?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tất cả các bài học trong chương này sẽ bị xóa khỏi thư viện.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Chương được chọn:
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-[14.5px] block leading-snug">
                {chapterToDeleteConfirm.chapterTitle}
              </span>
              <div className="mt-2 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
                  Môn {chapterToDeleteConfirm.subjectName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-semibold">
                  {chapterToDeleteConfirm.lessonCount} bài học sẽ bị xóa
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setChapterToDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteChapterConfirmAction(chapterToDeleteConfirm.chapterTitle)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa chương</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA BÀI HỌC (HOẠT ĐỘNG CHUẨN XÁC TRONG MỌI TRÌNH DUYỆT & KHÔNG BỊ CHẶN BỞI IFRAME) */}
      {lessonToDeleteConfirm && (
        <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Xác nhận xóa bài học?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bài học sẽ bị xóa khỏi kho thư viện bài học.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Bài học được chọn:
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-[14.5px] block leading-snug">
                {lessonToDeleteConfirm.title}
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
                  {lessonToDeleteConfirm.subjectName}
                </span>
                {lessonToDeleteConfirm.chapter && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {lessonToDeleteConfirm.chapter}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLessonToDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = lessonToDeleteConfirm.id;
                  if (onDeleteLesson) {
                    onDeleteLesson(targetId);
                  }
                  if (activeLessonModal?.id === targetId) {
                    setActiveLessonModal(null);
                  }
                  setLessonToDeleteConfirm(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
