import React, { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { 
  Subject, 
  Lesson, 
  StudyRecord 
} from '../types';
import { saveSafeItem, getSafeItemSync } from '../utils/safeStorage';
import { 
  GraduationCap, 
  Download, 
  ExternalLink, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Eye, 
  ListTree, 
  Layers, 
  HelpCircle, 
  Lightbulb, 
  BookMarked, 
  Youtube, 
  ArrowLeft, 
  ArrowRight,
  Maximize2,
  Minimize2,
  FileCode2,
  ImageIcon,
  RotateCw,
  X,
  ZoomIn
} from 'lucide-react';
import { getSubjectEmoji } from '../data/mockData';

/**
 * Sanitizes rich text content to remove layout-distorting iframe, style, link and script tags,
 * and strip raw HTML documents if the type is 'embedded_html'.
 */
const sanitizeAndFormatSectionContent = (content: string | undefined, type: string): string => {
  if (!content) return '';
  
  // If the section is of type 'embedded_html' or looks like a full raw HTML file, we do not render its markup
  if (type === 'embedded_html' || content.toLowerCase().includes('<!doctype') || content.toLowerCase().includes('<html')) {
    return `<div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-200 flex flex-col gap-1.5 my-2">
      <div class="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
        <span>🔬 Mô phỏng tương tác HTML5 / File nhúng</span>
      </div>
      <p class="text-slate-600 dark:text-slate-400 font-medium">Bài học này đi kèm một mô phỏng tương tác HTML5 đặc sắc. Để xem và thao tác trực tiếp với mô phỏng này, em hãy nhấn nút <strong>"Mở trong Thư viện"</strong> ở góc phải phía trên để chuyển tới không gian thực hành nhé!</p>
    </div>`;
  }

  // Otherwise, sanitize standard HTML sections so they don't break the layout
  let clean = content;
  
  // Strip out layout-breaking iframes, styles, links, and scripts
  clean = clean.replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '');
  clean = clean.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  clean = clean.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  clean = clean.replace(/<link[^>]*>/gi, '');
  
  // Strip absolute pixel widths from tables, divs, images, etc. to make them responsive
  clean = clean.replace(/width\s*=\s*["']?\d{3,4}px?["']?/gi, 'width="100%"');
  clean = clean.replace(/height\s*=\s*["']?\d{3,4}px?["']?/gi, 'height="auto"');
  
  // Wrap any tables in overflow-x-auto container so they don't force stretch columns
  clean = clean.replace(/<table/gi, '<div class="overflow-x-auto w-full my-3"><table class="w-full border-collapse"');
  clean = clean.replace(/<\/table>/gi, '</table></div>');
  
  return clean;
};


interface KnowledgeSummaryViewProps {
  lessons: Lesson[];
  subjects: Subject[];
  studyRecords: StudyRecord[];
  initialSubject?: string;
  initialActiveLessonId?: string;
  onNavigateToLessons?: (subject?: string, lessonId?: string) => void;
  onSelectSubject?: (subjectName: string) => void;
  onSelectLesson?: (lessonId: string) => void;
  onUpdateLesson?: (updatedLesson: Lesson) => void;
}

export const KnowledgeSummaryView: React.FC<KnowledgeSummaryViewProps> = ({
  lessons,
  subjects,
  studyRecords,
  initialSubject,
  initialActiveLessonId,
  onNavigateToLessons,
  onSelectSubject,
  onSelectLesson,
  onUpdateLesson,
}) => {
  // 1. Selection states
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(() => {
    if (initialSubject && initialSubject !== 'all') return initialSubject;
    return subjects[0]?.name || 'Toán';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'interactive' | 'landing'>('interactive');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialActiveLessonId || null);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeLessonTab, setActiveLessonTab] = useState<'notes' | 'homework'>('notes');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);

  // Get current active subject object
  const currentSubject = useMemo(() => {
    return subjects.find(
      (s) => s.name.toLowerCase() === selectedSubjectName.toLowerCase() ||
             (s.shortName && s.shortName.toLowerCase() === selectedSubjectName.toLowerCase())
    ) || {
      id: 'default',
      name: selectedSubjectName,
      shortName: selectedSubjectName,
      color: '#2563eb',
      bgColor: 'bg-blue-50 text-blue-800',
      defaultTeacher: 'Giáo viên',
      emoji: getSubjectEmoji(selectedSubjectName)
    };
  }, [subjects, selectedSubjectName]);

  // Comprehensive Auto-Scanner: Scans and merges Lesson and StudyRecord data
  const scanLessonData = useCallback((lesson: Lesson) => {
    const record = studyRecords.find(
      (r) => r.lessonId === lesson.id || 
      (r.lessonTitle && lesson.title && r.lessonTitle.trim().toLowerCase() === lesson.title.trim().toLowerCase() && 
       r.subjectName.toLowerCase() === (lesson.subjectName || '').toLowerCase())
    );

    const homeworkImages = [
      ...(lesson.completedHomeworkImages || []),
      ...(record?.completedImages || []),
      ...(record?.mindmapImageUrl ? [record.mindmapImageUrl] : [])
    ].filter((img, idx, arr) => Boolean(img) && arr.indexOf(img) === idx);

    const lessonContent = lesson.htmlBody || lesson.personalNote || lesson.summary || '';
    const studentNote = (record?.studentNote && record.studentNote !== 'Đã học xong bài học và nộp ảnh báo cáo') ? record.studentNote : '';
    const primaryNote = lessonContent || studentNote || '';
    const summaryText = lesson.summary || '';
    const keyPointsList = lesson.keyPoints || [];
    const sectionsList = lesson.sections || [];
    const referencesList = lesson.references || [];
    const embeddedCode = lesson.embeddedHtmlCode || '';
    const mindmapReport = lesson.mindmapReport || record?.mindmapReport;

    const isCompleted = homeworkImages.length > 0 || !!record;

    return {
      lesson,
      record,
      primaryNote,
      summaryText,
      keyPointsList,
      sectionsList,
      referencesList,
      embeddedCode,
      homeworkImages,
      studentNote,
      mindmapReport,
      isCompleted
    };
  }, [studyRecords]);

  // Filter lessons for the selected subject
  const subjectLessons = useMemo(() => {
    return lessons
      .filter((l) => {
        const matchSubj = (l.subjectName || '').trim().toLowerCase() === (selectedSubjectName || '').trim().toLowerCase();
        return matchSubj;
      })
      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
  }, [lessons, selectedSubjectName]);

  // Group lessons by Chapter
  const groupedByChapter = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    subjectLessons.forEach((lesson) => {
      const chapterKey = (lesson.chapter || 'Chương I: Kiến thức nền tảng').trim();
      if (!map.has(chapterKey)) {
        map.set(chapterKey, []);
      }
      map.get(chapterKey)!.push(lesson);
    });
    return Array.from(map.entries()).map(([chapterName, chapterLessons]) => ({
      chapterName,
      lessons: chapterLessons.sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0)),
    }));
  }, [subjectLessons]);

  // Filter grouped chapters by search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return groupedByChapter;
    const q = searchQuery.toLowerCase().trim();

    return groupedByChapter
      .map((ch) => {
        const matchesChapter = ch.chapterName.toLowerCase().includes(q);
        const matchedLessons = ch.lessons.filter((l) => {
          return (
            l.title.toLowerCase().includes(q) ||
            (l.summary && l.summary.toLowerCase().includes(q)) ||
            (l.keyPoints && l.keyPoints.some((k) => k.toLowerCase().includes(q))) ||
            (l.personalNote && l.personalNote.toLowerCase().includes(q)) ||
            (l.sections && l.sections.some((s) => (s.title && s.title.toLowerCase().includes(q)) || (s.content && s.content.toLowerCase().includes(q))))
          );
        });

        if (matchesChapter) {
          return ch;
        }
        if (matchedLessons.length > 0) {
          return {
            ...ch,
            lessons: matchedLessons,
          };
        }
        return null;
      })
      .filter(Boolean) as { chapterName: string; lessons: Lesson[] }[];
  }, [groupedByChapter, searchQuery]);

  // 1. Sync selectedSubjectName immediately when initialSubject prop changes from parent tabs
  React.useEffect(() => {
    if (initialSubject && initialSubject !== 'all' && initialSubject.toLowerCase() !== selectedSubjectName.toLowerCase()) {
      setSelectedSubjectName(initialSubject);
    }
  }, [initialSubject]);

  // 2. Sync activeLessonId with initialActiveLessonId prop or fallback cleanly without resetting
  React.useEffect(() => {
    if (subjectLessons.length > 0) {
      const initialValid = initialActiveLessonId && subjectLessons.some((l) => l.id === initialActiveLessonId);
      const currentValid = activeLessonId && subjectLessons.some((l) => l.id === activeLessonId);

      if (initialValid && activeLessonId !== initialActiveLessonId) {
        setActiveLessonId(initialActiveLessonId);
      } else if (!currentValid) {
        const firstLessonId = subjectLessons[0].id;
        setActiveLessonId(firstLessonId);
        onSelectLesson?.(firstLessonId);
      }
    } else {
      setActiveLessonId(null);
    }
  }, [subjectLessons, initialActiveLessonId]);

  // Handler for selecting a lesson - immediately keeps parent in sync
  const handleSelectLesson = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    onSelectLesson?.(lesson.id);
    onSelectSubject?.(lesson.subjectName);
    if (viewMode === 'landing') {
      const el = document.getElementById(`landing-lesson-${lesson.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for selecting a subject
  const handleSelectSubject = (subjName: string) => {
    setSelectedSubjectName(subjName);
    onSelectSubject?.(subjName);
    const subjLessons = lessons.filter(l => l.subjectName.toLowerCase() === subjName.toLowerCase());
    if (subjLessons.length > 0) {
      const firstId = subjLessons[0].id;
      setActiveLessonId(firstId);
      onSelectLesson?.(firstId);
    }
  };

  // Expand all chapters by default if not set
  React.useEffect(() => {
    const initialExp: Record<string, boolean> = {};
    groupedByChapter.forEach((ch) => {
      initialExp[ch.chapterName] = true;
    });
    setExpandedChapters(initialExp);
  }, [selectedSubjectName, groupedByChapter.length]);

  // Active Lesson Object
  const currentActiveLesson = useMemo(() => {
    return subjectLessons.find((l) => l.id === activeLessonId) || subjectLessons[0] || null;
  }, [subjectLessons, activeLessonId]);

  // Refs and states for rendering the beautiful read-only Mindmap tree branches
  const mindmapContainerRef = useRef<HTMLDivElement>(null);
  const mindmapRootNodeRef = useRef<HTMLDivElement>(null);
  const mindmapSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mindmapPointRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [mindmapCurves, setMindmapCurves] = useState<any[]>([]);
  const [mindmapSvgDimensions, setMindmapSvgDimensions] = useState({ width: 1200, height: 600 });

  const calculateMindmapCurves = useCallback(() => {
    if (!mindmapContainerRef.current || !mindmapRootNodeRef.current) return;

    const containerRect = mindmapContainerRef.current.getBoundingClientRect();
    const rootRect = mindmapRootNodeRef.current.getBoundingClientRect();

    // Origin point: Right center of root card
    const rootX = rootRect.right - containerRect.left;
    const rootY = rootRect.top + rootRect.height / 2 - containerRect.top;

    const newCurves: any[] = [];

    if (!currentActiveLesson) return;
    const scanned = scanLessonData(currentActiveLesson);
    const mindmapReport = scanned.mindmapReport;
    const sections = mindmapReport?.sections || (
      currentActiveLesson.keyPoints && currentActiveLesson.keyPoints.length > 0
        ? [{ id: 'sec-kp', title: 'Trọng tâm bài học', subPoints: currentActiveLesson.keyPoints || [], keyPoints: currentActiveLesson.keyPoints || [] }]
        : (currentActiveLesson.sections && currentActiveLesson.sections.length > 0
          ? currentActiveLesson.sections.map((s, idx) => ({
              id: `sec-${idx}`,
              title: s.title || `Phần ${idx + 1}`,
              subPoints: s.content ? [s.content.replace(/<[^>]+>/g, '').trim().slice(0, 150)] : [],
              keyPoints: s.content ? [s.content.replace(/<[^>]+>/g, '').trim().slice(0, 150)] : []
            }))
          : [])
    );

    const BRANCH_COLORS = ['#2563eb', '#9333ea', '#0d9488', '#d97706', '#e11d48'];

    sections.forEach((section: any, sIdx: number) => {
      const color = section.colorHex || BRANCH_COLORS[sIdx % BRANCH_COLORS.length];
      const secEl = mindmapSectionRefs.current[section.id];
      if (!secEl) return;

      const secRect = secEl.getBoundingClientRect();
      const secX = secRect.left - containerRect.left;
      const secY = secRect.top + secRect.height / 2 - containerRect.top;

      const dx1 = Math.max(40, (secX - rootX) * 0.55);
      const path1 = `M ${rootX} ${rootY} C ${rootX + dx1} ${rootY}, ${secX - dx1} ${secY}, ${secX} ${secY}`;

      newCurves.push({
        id: `root-to-${section.id}`,
        d: path1,
        color: color,
        strokeWidth: 3,
      });

      const secRightX = secRect.right - containerRect.left;
      const secRightY = secY;

      const pts = section.subPoints || section.keyPoints || [];
      pts.forEach((_: any, pIdx: number) => {
        const pointEl = mindmapPointRefs.current[`${section.id}-${pIdx}`];
        if (!pointEl) return;

        const pointRect = pointEl.getBoundingClientRect();
        const pointX = pointRect.left - containerRect.left;
        const pointY = pointRect.top + pointRect.height / 2 - containerRect.top;

        const dx2 = Math.max(30, (pointX - secRightX) * 0.5);
        const path2 = `M ${secRightX} ${secRightY} C ${secRightX + dx2} ${secRightY}, ${pointX - dx2} ${pointY}, ${pointX} ${pointY}`;

        newCurves.push({
          id: `sec-${section.id}-point-${pIdx}`,
          d: path2,
          color: color,
          strokeWidth: 2,
        });
      });
    });

    setMindmapCurves(newCurves);
    setMindmapSvgDimensions({
      width: Math.max(containerRect.width, mindmapContainerRef.current.scrollWidth),
      height: Math.max(containerRect.height, mindmapContainerRef.current.scrollHeight),
    });
  }, [currentActiveLesson, scanLessonData]);

  // Recalculate curves on window resize or when layout changes
  useLayoutEffect(() => {
    if (activeLessonTab === 'homework') {
      calculateMindmapCurves();
      const handleResize = () => calculateMindmapCurves();
      window.addEventListener('resize', handleResize);
      const timer = setTimeout(calculateMindmapCurves, 100);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
      };
    }
  }, [calculateMindmapCurves, activeLessonTab, activeLessonId]);

  // Prev & Next lesson handlers
  const currentLessonIndex = useMemo(() => {
    if (!currentActiveLesson) return -1;
    return subjectLessons.findIndex((l) => l.id === currentActiveLesson.id);
  }, [subjectLessons, currentActiveLesson]);

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLessonId(subjectLessons[currentLessonIndex - 1].id);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < subjectLessons.length - 1) {
      setActiveLessonId(subjectLessons[currentLessonIndex + 1].id);
    }
  };

  const toggleChapter = (chapterName: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterName]: !prev[chapterName],
    }));
  };

  const handleExpandAll = () => {
    const updated: Record<string, boolean> = {};
    groupedByChapter.forEach((c) => {
      updated[c.chapterName] = true;
    });
    setExpandedChapters(updated);
  };

  const handleCollapseAll = () => {
    const updated: Record<string, boolean> = {};
    groupedByChapter.forEach((c) => {
      updated[c.chapterName] = false;
    });
    setExpandedChapters(updated);
  };

  // ----------------------------------------------------
  // GENERATE STANDALONE OFFLINE HTML DOCUMENT (80% WIDTH, LIGHT THEME, FRESH CSS, RAW TITLES)
  // ----------------------------------------------------
  const generateStandaloneHtml = (): string => {
    const totalLessons = subjectLessons.length;
    const totalChapters = groupedByChapter.length;
    const emoji = getSubjectEmoji(selectedSubjectName);
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const jsonLessonData = JSON.stringify(
      groupedByChapter.map(ch => ({
        chapterName: ch.chapterName,
        lessons: ch.lessons.map(l => {
          const scanned = scanLessonData(l);
          const sections = scanned.mindmapReport?.sections || (
            l.keyPoints && l.keyPoints.length > 0
              ? [{ id: 'sec-kp', title: 'Trọng tâm bài học', subPoints: l.keyPoints, colorHex: '#2563eb' }]
              : (l.sections && l.sections.length > 0
                ? l.sections.map((s, idx) => ({
                    id: `sec-${idx}`,
                    title: s.title || `Phần ${idx + 1}`,
                    subPoints: s.content ? [s.content.replace(/<[^>]+>/g, '').trim().slice(0, 150)] : [],
                    colorHex: ['#2563eb', '#9333ea', '#0d9488', '#d97706', '#e11d48'][idx % 5]
                  }))
                : [])
          );

          return {
            id: l.id,
            lessonNumber: l.lessonNumber,
            title: l.title,
            chapter: l.chapter || ch.chapterName,
            volume: l.volume || 1,
            primaryNote: scanned.primaryNote || '',
            summary: scanned.summaryText || l.summary || '',
            keyPoints: scanned.keyPointsList || l.keyPoints || [],
            personalNote: l.personalNote || '',
            examples: l.examples || [],
            htmlBody: l.htmlBody || '',
            embeddedHtmlCode: l.embeddedHtmlCode || '',
            completedHomeworkImages: scanned.homeworkImages || [],
            studentNote: scanned.studentNote || scanned.record?.studentNote || '',
            submittedAt: scanned.record?.submittedAt || '',
            mindmapSections: sections,
            isCompleted: scanned.isCompleted
          };
        })
      }))
    ).replace(/<\/script/gi, '<\\/script');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VỞ BÀI TẬP & SOẠN BÀI: MÔN ${selectedSubjectName.toUpperCase()}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
          boxShadow: {
            '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
            'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }
        }
      }
    }
  </script>
  <style>
    /* Custom Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #64748b; }

    ::selection {
      background-color: #bfdbfe;
      color: #1e3a8a;
    }

    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        font-size: 11pt !important;
        line-height: 1.5 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      .app-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #main-content-pane {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        width: 100% !important;
      }
      /* Expand full textarea content during print */
      .student-note-textarea {
        display: none !important;
      }
      .student-note-print-block {
        display: block !important;
        white-space: pre-wrap !important;
        word-break: break-word !important;
        border: 1px solid #cbd5e1 !important;
        padding: 10px 14px !important;
        border-radius: 8px !important;
        background: #fafafa !important;
        font-size: 11pt !important;
        line-height: 1.6 !important;
        color: #0f172a !important;
      }
    }
  </style>
</head>
<body class="bg-slate-100/70 text-slate-800 font-sans antialiased min-h-screen flex flex-col text-[15px]">

  <!-- TOP APPBAR -->
  <header class="no-print sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-blue-100 shadow-xs">
    <div class="w-[94%] sm:w-[88%] lg:w-[82%] mx-auto py-3 px-2 flex items-center justify-between gap-4">
      
      <!-- Subject Title & Icon -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20 shrink-0">
          ${emoji}
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Môn ${selectedSubjectName}
            </h1>
            <span class="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-sky-100 text-blue-800 border border-sky-200">
              ${totalChapters} Chương • ${totalLessons} Bài học
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium">Hồ sơ bài học: Soạn bài & Nộp ảnh vở học bài</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <button onclick="printAllLessons()" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="In toàn bộ nội dung các bài học (PDF)">
          <span>In tất cả bài học</span>
        </button>
        <button onclick="window.print()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="In hoặc lưu file PDF A4 bài đang chọn">
          <span>In bài hiện tại</span>
        </button>
      </div>

    </div>
  </header>

  <!-- MAIN APP CONTAINER -->
  <div class="app-wrapper flex-1 w-[94%] sm:w-[88%] lg:w-[82%] mx-auto py-5 flex flex-col md:flex-row gap-6 items-start">
    
    <!-- LEFT SIDEBAR: DANH SÁCH BÀI HỌC (NO-PRINT) -->
    <aside id="sidebar-pane" class="no-print w-full md:w-[320px] shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-85px)] sticky top-[76px]">
      <!-- Chapter Tree Navigation -->
      <div id="tree-container" class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        <!-- Dynamic Chapter Accordions -->
      </div>

      <!-- Sidebar Footer -->
      <div id="sidebar-footer" class="p-2.5 px-3 bg-slate-50/90 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span>Tổng: <strong id="total-lessons-count">0</strong> bài</span>
        <span class="text-emerald-600 font-bold flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</span>
          <span>Đã học: <span id="done-lessons-count">0</span></span>
        </span>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT PANE -->
    <main id="main-content-pane" class="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7 flex flex-col">
      <!-- Dynamic Lesson Workspace Content -->
      <div id="lesson-content-container">
        <!-- Rendered via JS -->
      </div>
    </main>

  </div>

  <!-- EMBEDDED DATA & CONTROLLER -->
  <script>
    const CHAPTER_DATA = ${jsonLessonData};
    const SUBJECT_NAME = ${JSON.stringify(selectedSubjectName)};
    let currentActiveId = ${JSON.stringify(activeLessonId)} || CHAPTER_DATA[0]?.lessons[0]?.id || null;

    // Local storage key for in-browser student notes and photos
    const STORAGE_KEY_PREFIX = 'study_doc_' + SUBJECT_NAME + '_';

    function getLocalLessonData(lessonId) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + lessonId);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    }

    function saveLocalLessonData(lessonId, data) {
      try {
        const existing = getLocalLessonData(lessonId) || {};
        const merged = Object.assign({}, existing, data, { updatedAt: new Date().toISOString() });
        localStorage.setItem(STORAGE_KEY_PREFIX + lessonId, JSON.stringify(merged));
      } catch(e) {}
    }

    function init() {
      renderSidebar();
      renderContent();
    }

    let collapsedChapters = {};

    function findLesson(id) {
      for (const ch of CHAPTER_DATA) {
        const found = ch.lessons.find(l => l.id === id);
        if (found) return found;
      }
      return CHAPTER_DATA[0]?.lessons[0] || null;
    }

    function renderSidebar() {
      const container = document.getElementById('tree-container');
      if (!container) return;
      let html = '';
      let totalLessons = 0;
      let doneLessons = 0;

      CHAPTER_DATA.forEach((ch, chIdx) => {
        totalLessons += ch.lessons.length;
        const isExpanded = !collapsedChapters[chIdx];

        html += \`
          <div class="space-y-1">
            <!-- CHƯƠNG -->
            <button 
              type="button"
              onclick="toggleChapterAccordion('\${chIdx}')" 
              class="w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer group rounded-xl border shadow-2xs \${
                isExpanded
                  ? 'bg-slate-100/90 border-slate-200 text-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
              }"
              title="\${ch.chapterName}"
            >
              <div class="flex items-center gap-2 min-w-0 pr-1">
                <span class="transition-colors shrink-0 \${isExpanded ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}">
                  \${isExpanded ? \`
                    <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
                  \` : \`
                    <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
                  \`}
                </span>
                <span class="truncate font-bold text-xs sm:text-[13px] tracking-tight">\${ch.chapterName}</span>
              </div>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-1.5 bg-slate-200/70 text-slate-600">
                \${ch.lessons.length} bài
              </span>
            </button>

            <!-- DANH SÁCH BÀI -->
            <div id="ch-body-\${chIdx}" class="pl-3.5 pr-1 py-0.5 space-y-1 \${isExpanded ? '' : 'hidden'}">
              \${ch.lessons.map(l => {
                const isActive = (currentActiveId === l.id);
                const localData = getLocalLessonData(l.id);
                const hasPhotos = (l.completedHomeworkImages && l.completedHomeworkImages.length > 0) || (localData?.photos && localData.photos.length > 0);
                const hasNotes = !!l.studentNote || !!localData?.note;
                const isDone = hasPhotos || hasNotes || l.isCompleted;
                if (isDone) doneLessons++;

                return \`
                  <button 
                    type="button"
                    onclick="selectLesson('\${l.id}')"
                    class="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer \${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-blue-50/70 hover:text-blue-700 font-medium'
                    }"
                    title="\${isDone ? l.title + ' (Đã học)' : l.title}"
                  >
                    <div class="flex items-center gap-2 truncate min-w-0">
                      \${isDone ? \`
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 \${
                          isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
                        }" title="Đã học">
                          ✓
                        </span>
                      \` : \`
                        <span class="w-4 h-4 flex items-center justify-center text-sm font-bold shrink-0 \${
                          isActive ? 'text-blue-200' : 'text-slate-300'
                        }">
                          •
                        </span>
                      \`}
                      <span class="truncate">\${l.title}</span>
                    </div>
                  </button>
                \`;
              }).join('')}
            </div>
          </div>
        \`;
      });

      if (!html) {
        html = '<div class="p-4 text-center text-xs text-slate-400">Không có bài học nào.</div>';
      }

      container.innerHTML = html;

      const totalEl = document.getElementById('total-lessons-count');
      const doneEl = document.getElementById('done-lessons-count');
      if (totalEl) totalEl.textContent = totalLessons;
      if (doneEl) doneEl.textContent = doneLessons;
    }

    function toggleChapterAccordion(chIdx) {
      collapsedChapters[chIdx] = !collapsedChapters[chIdx];
      renderSidebar();
    }

    let currentLessonTab = 'notes'; // 'notes' | 'homework'

    function switchLessonTab(tab) {
      currentLessonTab = tab;
      renderContent();
    }

    function selectLesson(lessonId) {
      currentActiveId = lessonId;
      renderSidebar();
      renderContent();
    }

    function renderContent() {
      const container = document.getElementById('lesson-content-container');
      if (!container) return;

      const lesson = findLesson(currentActiveId);
      if (!lesson) {
        container.innerHTML = '<div class="p-12 text-center text-slate-400">Vui lòng chọn một bài học từ danh mục bên trái.</div>';
        return;
      }

      const savedStudentNote = lesson.primaryNote || lesson.htmlBody || lesson.studentNote || lesson.personalNote || '';
      const homeworkImages = lesson.completedHomeworkImages || [];
      const mindmapSections = lesson.mindmapSections || [];
      const studentNote = lesson.studentNote || '';

      // 2 TABS CHÍNH
      const tabsHtml = \`
        <div class="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <button 
            type="button" 
            onclick="switchLessonTab('notes')" 
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition \${
              currentLessonTab === 'notes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }"
          >
            <span>📝 Soạn Bài</span>
          </button>
          <button 
            type="button" 
            onclick="switchLessonTab('homework')" 
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition \${
              currentLessonTab === 'homework'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }"
          >
            <span>📤 Nộp báo cáo Học Bài</span>
            \${homeworkImages.length > 0 ? \`
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold \${
                currentLessonTab === 'homework' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }">
                \${homeworkImages.length} ảnh
              </span>
            \` : ''}
          </button>
        </div>
      \`;

      let mainTabBody = '';
      if (currentLessonTab === 'notes') {
        if (savedStudentNote) {
          mainTabBody = \`
            <div class="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div class="prose max-w-none text-sm sm:text-base text-slate-800 leading-relaxed font-normal [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-blue-700 [&>h1]:mb-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-3 [&>h3]:mb-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>p]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:bg-blue-50/50 [&>blockquote]:py-1.5 [&>blockquote]:rounded-r-lg">
                \${savedStudentNote}
              </div>
            </div>
          \`;
        } else {
          mainTabBody = \`
            <div class="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <p class="text-sm sm:text-base text-slate-500 font-medium">
                Chưa có nội dung soạn bài cho bài học này.
              </p>
            </div>
          \`;
        }
      } else {
        // Tab: Nộp báo cáo Học Bài
        let reportCards = [];

        // 1. Sơ đồ tư duy dạng cây tỏa phải
        if (mindmapSections.length > 0) {
          reportCards.push(\`
            <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div class="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                <span>🌳 Sơ Đồ Tư Duy Bài Học (Mindmap Cây Tỏa Phải)</span>
              </div>
              <div class="overflow-x-auto pb-4">
                <div 
                  id="mindmap-container"
                  class="min-w-[850px] w-full bg-[#f4f7fa] rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-2xs relative select-none overflow-hidden"
                >
                  <!-- LỚP SVG VẼ ĐƯỜNG CONG HỮU CƠ MỀM MẠI PHÍA SAU NỘI DUNG -->
                  <svg
                    id="mindmap-svg"
                    class="absolute inset-0 pointer-events-none z-0"
                  ></svg>

                  <!-- LỚP HTML NỘI DUNG NẰM TRÊN CÁC ĐẦU NHÁNH CONG (Z-INDEX 10) -->
                  <div class="relative z-10 flex items-center w-full max-w-5xl mx-auto py-2">
                    
                    <!-- 1. THẺ GỐC TRUNG TÂM (ROOT NODE) -->
                    <div class="shrink-0 relative group mr-12 sm:mr-16">
                      <div
                        id="mindmap-root-node"
                        class="p-4 sm:p-5 bg-white rounded-xl shadow-md border border-slate-200/90 w-52 sm:w-60"
                      >
                        <div class="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                          \${lesson.title}
                        </div>
                      </div>
                    </div>

                    <!-- 2. CÁC NHÁNH PHẦN (LEVEL 1) VÀ CÁC Ý CHÍNH (LEVEL 2) -->
                    <div class="flex-1 space-y-10 sm:space-y-12 relative">
                      \${mindmapSections.map((sec, sIdx) => {
                        const themeColor = sec.colorHex || ['#2563eb', '#9333ea', '#0d9488', '#d97706', '#e11d48'][sIdx % 5];
                        const keyPoints = sec.subPoints || sec.keyPoints || [];
                        const secId = sec.id || \`sec-\${sIdx}\`;

                        return \`
                          <div class="flex items-center relative">
                            
                            <!-- NHÁNH CẤP 1 (SECTION NODE) -->
                            <div
                              class="mindmap-section-node p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-xs sm:text-sm w-44 sm:w-52 shrink-0 mr-8 sm:mr-10 relative z-10"
                              data-section-id="\${secId}"
                              data-color="\${themeColor}"
                            >
                              <div class="font-bold" style="color: \${themeColor}">
                                \${sec.title}
                              </div>
                            </div>

                            <!-- NHÁNH CẤP 2 (KEY POINT NODES) -->
                            <div class="flex-1 flex flex-col gap-3 relative z-10">
                              \${keyPoints.map((point, pIdx) => \`
                                <div
                                  class="mindmap-point-node p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 w-48 sm:w-56 leading-relaxed shadow-3xs"
                                  data-parent-section-id="\${secId}"
                                  data-point-idx="\${pIdx}"
                                >
                                  \${point}
                                </div>
                              \`).join('')}
                            </div>
                          </div>
                        \`;
                      }).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          \`);
        }

        // 2. Ghi chú & Tóm tắt báo cáo
        if (studentNote && studentNote.trim()) {
          reportCards.push(\`
            <div class="p-5 sm:p-6 rounded-2xl bg-blue-50/70 border border-blue-200/80 shadow-xs space-y-2">
              <div class="font-bold text-xs sm:text-sm text-blue-900 flex items-center gap-2">
                <span>📝 Ghi Chú & Tóm Tắt Của Học Sinh</span>
              </div>
              <p class="text-xs sm:text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">\${studentNote}</p>
            </div>
          \`);
        }

        // 3. Ảnh bài nộp của học sinh
        if (homeworkImages.length > 0) {
          reportCards.push(\`
            <div class="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <span class="font-bold text-xs sm:text-sm text-slate-900">📸 Ảnh Bài Nộp Của Học Sinh (\${homeworkImages.length} ảnh)</span>
                <span class="text-[11px] text-slate-500 font-medium">Bấm vào ảnh để phóng to</span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                \${homeworkImages.map((imgSrc) => \`
                  <div class="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4] cursor-pointer hover:shadow-md transition" onclick="openLightbox('\${imgSrc.replace(/'/g, "\\\\'")}')">
                    <img src="\${imgSrc}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="Ảnh bài nộp" loading="lazy" />
                    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                      <span>🔍 Phóng to</span>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`);
        }

        if (reportCards.length === 0) {
          mainTabBody = \`
            <div class="py-12 px-4 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <p class="text-sm sm:text-base text-slate-700 font-bold">
                Chưa có báo cáo học bài cho bài học này.
              </p>
              <p class="text-xs text-slate-500">
                Học sinh nộp ảnh bài tập hoặc tạo sơ đồ tư duy trong Thư viện bài học để hiển thị tại đây nhé!
              </p>
            </div>
          \`;
        } else {
          mainTabBody = reportCards.join('');
        }
      }

      container.innerHTML = \`
        <div class="space-y-5 animate-in fade-in duration-200">
          <!-- Header of Active Lesson -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2 text-xs font-bold text-blue-600">
                <span>\${lesson.chapter || 'Chương I: Kiến thức nền tảng'}</span>
                <span>•</span>
                <span>Tập \${lesson.volume || 1}</span>
              </div>
              <h2 class="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                \${lesson.title}
              </h2>
            </div>
          </div>

          <!-- 2 TABS ĐƠN GIẢN: SOẠN BÀI & NỘP BÁO CÁO HỌC BÀI -->
          \${tabsHtml}

          <!-- KHUNG NỘI DUNG THEO TAB -->
          <div class="space-y-4">
            \${mainTabBody}
          </div>
        </div>
      \`;

      if (currentLessonTab === 'homework') {
        setTimeout(drawExportMindmapCurves, 80);
      }
    }

    function printAllLessons() {
      const container = document.getElementById('lesson-content-container');
      if (!container) return;

      let allHtml = '';
      CHAPTER_DATA.forEach((ch, chIdx) => {
        allHtml += \`<div class="mt-8 mb-4 border-b-2 border-slate-800 pb-2"><h1 class="text-xl sm:text-2xl font-black text-slate-900 uppercase">\${ch.chapterName}</h1></div>\`;
        
        ch.lessons.forEach(lesson => {
          const savedStudentNote = lesson.primaryNote || lesson.htmlBody || lesson.studentNote || lesson.personalNote || '';
          let noteHtml = '';
          if (savedStudentNote) {
            noteHtml = \`
              <div class="prose max-w-none text-sm sm:text-base text-slate-800 leading-relaxed font-normal [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-blue-700 [&>h1]:mb-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-3 [&>h3]:mb-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>p]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:bg-blue-50/50 [&>blockquote]:py-1.5 [&>blockquote]:rounded-r-lg">
                \${savedStudentNote}
              </div>
            \`;
          } else {
            noteHtml = \`<p class="text-xs text-slate-400 italic py-2">Chưa có nội dung soạn bài hoặc ghi chép.</p>\`;
          }

          allHtml += \`
            <div class="space-y-6 mb-12 break-inside-avoid">
              <div class="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2 text-xs font-bold text-blue-600">
                    <span>\${lesson.chapter || ch.chapterName}</span>
                    <span>•</span>
                    <span>Tập \${lesson.volume || 1}</span>
                  </div>
                  <h2 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Bài \${lesson.lessonNumber || ''}: \${lesson.title}</h2>
                </div>
              </div>
              <div class="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs">
                \${noteHtml}
              </div>
            </div>
          \`;
        });
      });

      container.innerHTML = allHtml;
      
      // Delay to allow DOM update then print
      setTimeout(() => {
        window.print();
        // Restore single lesson view
        renderContent();
      }, 500);
    }

    function drawExportMindmapCurves() {
      const container = document.getElementById('mindmap-container');
      const rootNode = document.getElementById('mindmap-root-node');
      const svg = document.getElementById('mindmap-svg');
      if (!container || !rootNode || !svg) return;

      const containerRect = container.getBoundingClientRect();
      const rootRect = rootNode.getBoundingClientRect();

      // Origin point: Right center of root card
      const rootX = rootRect.right - containerRect.left + container.scrollLeft;
      const rootY = rootRect.top + rootRect.height / 2 - containerRect.top + container.scrollTop;

      let pathsHtml = '';
      const sectionNodes = container.querySelectorAll('.mindmap-section-node');
      
      sectionNodes.forEach((secNode) => {
        const secId = secNode.getAttribute('data-section-id');
        const color = secNode.getAttribute('data-color') || '#2563eb';
        const secRect = secNode.getBoundingClientRect();
        
        const secX = secRect.left - containerRect.left + container.scrollLeft;
        const secY = secRect.top + secRect.height / 2 - containerRect.top + container.scrollTop;

        // Path from root to section
        const dx1 = Math.max(40, (secX - rootX) * 0.55);
        const path1 = 'M ' + rootX + ' ' + rootY + ' C ' + (rootX + dx1) + ' ' + rootY + ', ' + (secX - dx1) + ' ' + secY + ', ' + secX + ' ' + secY;

        pathsHtml += '<path d="' + path1 + '" stroke="' + color + '" stroke-width="3" fill="none" stroke-linecap="round" />';

        const secRightX = secRect.right - containerRect.left + container.scrollLeft;
        const secRightY = secY;

        // Find child points
        const pointNodes = container.querySelectorAll('.mindmap-point-node[data-parent-section-id="' + secId + '"]');
        pointNodes.forEach((pointNode) => {
          const pointRect = pointNode.getBoundingClientRect();
          const pointX = pointRect.left - containerRect.left + container.scrollLeft;
          const pointY = pointRect.top + pointRect.height / 2 - containerRect.top + container.scrollTop;

          const dx2 = Math.max(30, (pointX - secRightX) * 0.5);
          const path2 = 'M ' + secRightX + ' ' + secRightY + ' C ' + (secRightX + dx2) + ' ' + secRightY + ', ' + (pointX - dx2) + ' ' + pointY + ', ' + pointX + ' ' + pointY;

          pathsHtml += '<path d="' + path2 + '" stroke="' + color + '" stroke-width="2" fill="none" stroke-linecap="round" />';
        });
      });

      svg.innerHTML = pathsHtml;
      svg.style.width = Math.max(containerRect.width, container.scrollWidth) + 'px';
      svg.style.height = Math.max(containerRect.height, container.scrollHeight) + 'px';
    }

    window.addEventListener('resize', () => {
      if (currentLessonTab === 'homework') {
        drawExportMindmapCurves();
      }
    });

    let currentZoomedRotation = 0;
    function openLightbox(src) {
      currentZoomedRotation = 0;
      const modal = document.getElementById('lightbox-modal');
      const img = document.getElementById('lightbox-img');
      if (modal && img) {
        img.src = src;
        img.style.transform = 'rotate(0deg)';
        modal.classList.remove('hidden');
      }
    }

    function closeLightbox() {
      const modal = document.getElementById('lightbox-modal');
      if (modal) modal.classList.add('hidden');
    }

    function rotateLightbox() {
      currentZoomedRotation = (currentZoomedRotation + 90) % 360;
      const img = document.getElementById('lightbox-img');
      if (img) img.style.transform = 'rotate(' + currentZoomedRotation + 'deg)';
    }

    function handleSearch(val) {
      renderSidebar(val);
    }

    function clearSearch() {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      renderSidebar('');
    }

    // Block accidental link-clicks for inline images
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (target && (target.tagName === 'IMG' || target.closest('a')?.querySelector('img'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    window.onload = init;
  </script>

  <!-- LIGHTBOX MODAL FOR IMAGES -->
  <div id="lightbox-modal" class="hidden fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onclick="closeLightbox()">
    <div class="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700" onclick="event.stopPropagation()">
      <button type="button" onclick="rotateLightbox()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer">
        <span>🔄 Xoay ảnh</span>
      </button>
      <button type="button" onclick="closeLightbox()" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer">
        <span>Đóng (✕)</span>
      </button>
    </div>
    <img id="lightbox-img" src="" class="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl transition-transform duration-200" onclick="event.stopPropagation()" alt="Ảnh phóng to" />
  </div>
</body>
</html>`;
  };

  // ----------------------------------------------------
  // GENERATE STANDALONE MARKDOWN (.MD) DOCUMENT FOR AI / SUMMARY
  // ----------------------------------------------------
  const generateMarkdownDocument = (): string => {
    const totalLessons = subjectLessons.length;
    const totalChapters = groupedByChapter.length;
    const dateStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let md = `<!-- ========================================================================== -->
<!-- 🤖 PROMPT MẪU DÀNH CHO AI (Gemini, ChatGPT, Claude):                         -->
<!-- "Bạn là chuyên gia giáo dục THCS. Hãy đọc toàn bộ nội dung giáo khoa, câu hỏi  -->
<!-- trọng tâm, ví dụ và bài soạn của học sinh bên dưới để tạo ra một bản           -->
<!-- ĐẠI CƯƠNG ÔN TẬP CỐT LÕI với:                                                   -->
<!-- 1. Bảng tóm tắt công thức / kiến thức theo từng chương                          -->
<!-- 2. Bảng phân loại các dạng bài tập và các bẫy sai lầm thường gặp                -->
<!-- 3. Bộ 10 câu hỏi tự luận / trắc nghiệm chọn lọc kèm lời giải mẫu để ôn thi"     -->
<!-- ========================================================================== -->

# 📚 TỔNG HỢP TOÀN BỘ KIẾN THỨC & BÀI SOẠN MÔN ${selectedSubjectName.toUpperCase()}
- **Môn học:** ${selectedSubjectName}
- **Quy mô:** ${totalChapters} Chương • ${totalLessons} Bài học
- **Thời gian xuất bản:** ${dateStr}

---

`;

    groupedByChapter.forEach((ch, chIdx) => {
      md += `\n# 📖 ${ch.chapterName.toUpperCase()}\n\n`;

      ch.lessons.forEach((l, lIdx) => {
        const record = studyRecords.find(r => r.lessonId === l.id || (r.lessonTitle === l.title && r.subjectName === selectedSubjectName));
        const studentNote = record?.studentNote || l.htmlBody || l.personalNote || '';
        const homeworkImages = [
          ...(l.completedHomeworkImages || []),
          ...(record?.completedImages || []),
          ...(record?.mindmapImageUrl ? [record.mindmapImageUrl] : [])
        ].filter((img, idx, arr) => Boolean(img) && arr.indexOf(img) === idx);

        md += `## 📝 Bài ${l.lessonNumber || (lIdx + 1)}: ${l.title}\n\n`;

        // Soạn bài & Ghi chép
        if (studentNote.trim()) {
          md += `${studentNote}\n\n`;
        } else {
          md += `*(Chưa có nội dung soạn bài)*\n\n`;
        }

        md += `---\n\n`;
      });
    });

    return md;
  };

  // Download Markdown (.md) Handler
  const handleDownloadMarkdown = () => {
    const mdContent = generateMarkdownDocument();
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tong_Hop_Kien_Thuc_${selectedSubjectName.replace(/\s+/g, '_')}_Nguyen_Tap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Handler
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tong_Hop_Kien_Thuc_${selectedSubjectName.replace(/\s+/g, '_')}_On_Thi_Cuoi_Ky.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Preview in new tab handler
  const handleOpenPreviewNewTab = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Copy HTML source
  const handleCopyHtml = () => {
    const htmlContent = generateStandaloneHtml();
    navigator.clipboard.writeText(htmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-135px)] gap-3.5 animate-in fade-in duration-200 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-900 p-3.5 sm:p-4 h-screen' : ''}`}>
      
      {/* 1. TOP APPBAR & NAVIGATION: LOCKED FRAME */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand Info & Subject Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  Tổng Hợp Kiến Thức Ôn Thi Cuối Kỳ
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center">
                  <span>Môn {selectedSubjectName}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Cấu trúc phân cấp Chương &gt; Bài học • Xuất file HTML học offline không cần mạng • Tự tin làm chủ đề cương
              </p>
            </div>
          </div>

          {/* Action Tools: Download HTML / Preview / Print */}
          <div className="flex flex-wrap items-center gap-1.5 lg:self-center">
            {/* Preview New Tab */}
            <button
              type="button"
              onClick={handleOpenPreviewNewTab}
              className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer border border-orange-500 shadow-sm shadow-orange-500/20"
              title="Mở file HTML độc lập trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
              <span>Xem tổng quan Môn Học</span>
            </button>

            {/* DOWNLOAD STANDALONE HTML (HIGHLIGHT ACTION) */}
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer border border-emerald-500"
              title="Tải trang web ôn tập độc lập .html (Mở offline xem trên máy tính/điện thoại mọi lúc mọi nơi)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file HTML (.html)</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-200/90 dark:border-slate-700 shadow-3xs"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Subjects Switcher & Volume Filter Row */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          
          {/* Subject Pills (Clean, uniform tags without count numbers) */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-full">
            {subjects.map((subj, sIdx) => {
              const isSelected = subj.name.toLowerCase() === selectedSubjectName.toLowerCase();

              return (
                <button
                  key={subj.id ? `subj-${subj.id}` : `subj-${subj.name}-${sIdx}`}
                  type="button"
                  onClick={() => handleSelectSubject(subj.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {subj.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: LOCKED FRAMES WITH FOCUSED INTERNAL TEXT SCROLLING */}
      <div className="app-wrapper flex-1 min-h-0 w-full mx-auto flex flex-col md:flex-row gap-4 items-stretch overflow-hidden">
        
        {/* LEFT SIDEBAR: LOCKED FRAME WITH INTERNAL CHAPTER LIST SCROLL (NO-PRINT) */}
        <aside id="sidebar-pane" className="no-print w-full md:w-[290px] lg:w-[320px] shrink-0 h-[240px] md:h-full bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {/* Chapter Tree Navigation */}
          <div id="tree-container" className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {filteredChapters.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>Không có bài học nào khớp với bộ lọc</span>
              </div>
            ) : (
              filteredChapters.map((chGroup, idx) => {
                const isExpanded = expandedChapters[chGroup.chapterName] !== false;

                return (
                  <div key={`ch-group-${chGroup.chapterName}-${idx}`} className="space-y-1">
                    {/* CHƯƠNG */}
                    <button
                      type="button"
                      onClick={() => toggleChapter(chGroup.chapterName)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer group rounded-xl border shadow-2xs ${
                        isExpanded
                          ? 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-750 text-slate-700 dark:text-slate-200'
                      }`}
                      title={chGroup.chapterName}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className={`transition-colors shrink-0 ${isExpanded ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600'}`}>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                          )}
                        </span>
                        <span className="truncate font-bold text-xs sm:text-[13px] tracking-tight">
                          {chGroup.chapterName}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-1.5 bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                        {chGroup.lessons.length} bài
                      </span>
                    </button>

                    {/* DANH SÁCH BÀI */}
                    {isExpanded && (
                      <div id={`ch-body-${idx}`} className="pl-3.5 pr-1 py-0.5 space-y-1">
                        {chGroup.lessons.map((lesson, lIdx) => {
                          const isSelected = activeLessonId === lesson.id;
                          const scanned = scanLessonData(lesson);
                          const isDone = scanned.isCompleted;

                          return (
                            <button
                              key={`sidebar-lesson-${lesson.id || lesson.title}-${lIdx}`}
                              type="button"
                              onClick={() => handleSelectLesson(lesson)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected && viewMode === 'interactive'
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 hover:text-blue-700 dark:hover:text-blue-300 font-medium'
                              }`}
                              title={isDone ? `${lesson.title} (Đã học)` : lesson.title}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0">
                                {isDone ? (
                                  <span 
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                                      isSelected && viewMode === 'interactive'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                                    }`}
                                    title="Đã học"
                                  >
                                    ✓
                                  </span>
                                ) : (
                                  <span 
                                    className={`w-4 h-4 flex items-center justify-center text-sm font-bold shrink-0 ${
                                      isSelected && viewMode === 'interactive' ? 'text-blue-200' : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  >
                                    •
                                  </span>
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2.5 px-3 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
            <span>Tổng: <strong>{subjectLessons.length}</strong> bài</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
              <span>Đã học: {subjectLessons.filter(l => scanLessonData(l).isCompleted).length}</span>
            </span>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT PANE: LOCKED CARD FRAME WITH SMOOTH INTERNAL READING SCROLL */}
        <main id="main-content-pane" className="flex-1 min-w-0 h-full bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 flex flex-col overflow-hidden">
          <div id="lesson-content-container" className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            {viewMode === 'interactive' && currentActiveLesson && (
              <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Header of Active Lesson */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>{currentActiveLesson.chapter || 'Chương I: Kiến thức nền tảng'}</span>
                    <span>•</span>
                    <span>Tập {currentActiveLesson.volume || 1}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {currentActiveLesson.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  {onNavigateToLessons && (
                    <button
                      type="button"
                      onClick={() => onNavigateToLessons(currentActiveLesson.subjectName, currentActiveLesson.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Mở bài học này trong Thư viện để chỉnh sửa / bổ sung tài liệu"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>Mở trong Thư viện</span>
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const scanned = scanLessonData(currentActiveLesson);
                const hasNotes = Boolean(scanned.primaryNote && scanned.primaryNote.trim().length > 0);
                const homeworkImages = scanned.homeworkImages || [];
                const mindmapReport = scanned.mindmapReport;
                const mindmapSections = mindmapReport?.sections || (
                  currentActiveLesson.keyPoints && currentActiveLesson.keyPoints.length > 0
                    ? [{ id: 'sec-kp', title: 'Trọng tâm bài học', subPoints: currentActiveLesson.keyPoints, colorHex: '#2563eb' }]
                    : (currentActiveLesson.sections && currentActiveLesson.sections.length > 0
                      ? currentActiveLesson.sections.map((s, idx) => ({
                          id: `sec-${idx}`,
                          title: s.title || `Phần ${idx + 1}`,
                          subPoints: s.content ? [s.content.replace(/<[^>]+>/g, '').trim().slice(0, 150)] : [],
                          colorHex: ['#2563eb', '#9333ea', '#0d9488', '#d97706', '#e11d48'][idx % 5]
                        }))
                      : [])
                );
                const studentNote = scanned.studentNote || '';

                return (
                  <div className="space-y-4">
                    {/* 2 TABS CHÍNH: SOẠN BÀI & NỘP BÁO CÁO HỌC BÀI */}
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <button
                        type="button"
                        onClick={() => setActiveLessonTab('notes')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition ${
                          activeLessonTab === 'notes'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Soạn Bài</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveLessonTab('homework')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition ${
                          activeLessonTab === 'homework'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Nộp báo cáo Học Bài</span>
                        {homeworkImages.length > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeLessonTab === 'homework'
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          }`}>
                            {homeworkImages.length} ảnh
                          </span>
                        )}
                      </button>
                    </div>

                    {/* TAB 1: SOẠN BÀI */}
                    {activeLessonTab === 'notes' && (
                      <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                        {hasNotes ? (
                          <div 
                            className="prose dark:prose-invert max-w-none text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-blue-700 dark:[&>h1]:text-blue-400 [&>h1]:mb-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-slate-900 dark:[&>h2]:text-white [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-800 dark:[&>h3]:text-slate-200 [&>h3]:mt-3 [&>h3]:mb-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>p]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:bg-blue-50/50 dark:[&>blockquote]:bg-blue-950/30 [&>blockquote]:py-1.5 [&>blockquote]:rounded-r-lg"
                            dangerouslySetInnerHTML={{ __html: scanned.primaryNote }}
                          />
                        ) : (
                          <div className="py-12 px-4 text-center space-y-3">
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
                              Chưa có nội dung soạn bài cho bài học này.
                            </p>
                            {onNavigateToLessons && (
                              <button
                                type="button"
                                onClick={() => onNavigateToLessons(currentActiveLesson.subjectName, currentActiveLesson.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                              >
                                <BookMarked className="w-4 h-4" />
                                <span>Mở Thư viện để soạn bài ngay</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: NỘP BÁO CÁO HỌC BÀI */}
                    {activeLessonTab === 'homework' && (
                      <div className="space-y-4">
                        {/* 1. Sơ đồ tư duy bài học (Mindmap Cây tỏa phải) */}
                        {mindmapSections.length > 0 && (
                          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
                              <span>🌳 Sơ Đồ Tư Duy Bài Học (Mindmap Cây Tỏa Phải)</span>
                            </div>
                            <div className="overflow-x-auto pb-4">
                              <div 
                                ref={mindmapContainerRef}
                                className="min-w-[850px] w-full bg-[#f4f7fa] dark:bg-slate-950 rounded-2xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs relative select-none overflow-hidden"
                              >
                                {/* LỚP SVG VẼ ĐƯỜNG CONG HỮU CƠ MỀM MẠI PHÍA SAU NỘI DUNG */}
                                <svg
                                  className="absolute inset-0 pointer-events-none z-0"
                                  style={{ width: mindmapSvgDimensions.width, height: mindmapSvgDimensions.height }}
                                >
                                  {mindmapCurves.map((curve) => (
                                    <path
                                      key={curve.id}
                                      d={curve.d}
                                      stroke={curve.color}
                                      strokeWidth={curve.strokeWidth}
                                      fill="none"
                                      strokeLinecap="round"
                                      className="transition-all duration-150"
                                    />
                                  ))}
                                </svg>

                                {/* LỚP HTML NỘI DUNG NẰM TRÊN CÁC ĐẦU NHÁNH CONG (Z-INDEX 10) */}
                                <div className="relative z-10 flex items-center w-full max-w-5xl mx-auto py-2">
                                  
                                  {/* =================================================================== */}
                                  {/* 1. THẺ GỐC TRUNG TÂM (ROOT NODE)                                     */}
                                  {/* =================================================================== */}
                                  <div className="shrink-0 relative group mr-12 sm:mr-16">
                                    <div
                                      ref={mindmapRootNodeRef}
                                      className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 w-52 sm:w-60 transition-all"
                                    >
                                      <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                                        {currentActiveLesson?.title}
                                      </div>
                                    </div>
                                  </div>

                                  {/* =================================================================== */}
                                  {/* 2. CÁC NHÁNH PHẦN (LEVEL 1) VÀ CÁC Ý CHÍNH (LEVEL 2)                */}
                                  {/* =================================================================== */}
                                  <div className="flex-1 space-y-10 sm:space-y-12 relative">
                                    {mindmapSections.map((section: any, sIdx: number) => {
                                      const themeColor = section.colorHex || ['#2563eb', '#9333ea', '#0d9488', '#d97706', '#e11d48'][sIdx % 5];
                                      const keyPoints = section.subPoints || section.keyPoints || [];

                                      return (
                                        <div key={section.id || `sec-${sIdx}`} className="flex items-center group/section relative">
                                          
                                          {/* NHÁNH CẤP 1 (SECTION NODE) */}
                                          <div
                                            ref={(el) => {
                                              mindmapSectionRefs.current[section.id] = el;
                                            }}
                                            className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-xs sm:text-sm w-44 sm:w-52 transition-all hover:shadow-md shrink-0 mr-8 sm:mr-10 relative z-10"
                                          >
                                            <div className="font-bold" style={{ color: themeColor }}>
                                              {section.title}
                                            </div>
                                          </div>

                                          {/* NHÁNH CẤP 2 (KEY POINT NODES) */}
                                          <div className="flex-1 flex flex-col gap-3 relative z-10">
                                            {keyPoints.map((point: string, pIdx: number) => (
                                              <div
                                                key={`${section.id}-${pIdx}`}
                                                ref={(el) => {
                                                  mindmapPointRefs.current[`${section.id}-${pIdx}`] = el;
                                                }}
                                                className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 w-48 sm:w-56 leading-relaxed shadow-3xs"
                                              >
                                                {point}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Ghi chú & Tóm tắt báo cáo */}
                        {studentNote && studentNote.trim() && (
                          <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 shadow-xs space-y-2">
                            <div className="font-bold text-xs sm:text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              <span>Ghi Chú & Tóm Tắt Của Học Sinh</span>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">{studentNote}</p>
                          </div>
                        )}

                        {/* 3. Ảnh bài nộp của học sinh */}
                        {homeworkImages.length > 0 ? (
                          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-emerald-600" />
                                <span>Ảnh Bài Nộp Của Học Sinh ({homeworkImages.length} ảnh)</span>
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Bấm vào ảnh để phóng to</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {homeworkImages.map((imgSrc, imgIdx) => (
                                <div 
                                  key={`hw-img-${imgIdx}`}
                                  className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-[3/4] cursor-pointer hover:shadow-md transition"
                                  onClick={() => {
                                    setZoomedImage(imgSrc);
                                    setImageRotation(0);
                                  }}
                                >
                                  <img src={imgSrc} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="Ảnh bài nộp" loading="lazy" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <ZoomIn className="w-4 h-4" />
                                    <span>Phóng to</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          (!mindmapSections || mindmapSections.length === 0) && !studentNote && (
                            <div className="py-12 px-4 text-center space-y-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-bold">
                                Chưa có báo cáo học bài cho bài học này.
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                Học sinh nộp ảnh bài tập hoặc tạo sơ đồ tư duy trong Thư viện bài học để hiển thị tại đây nhé!
                              </p>
                              {onNavigateToLessons && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToLessons(currentActiveLesson.subjectName, currentActiveLesson.id)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                                >
                                  <BookMarked className="w-4 h-4" />
                                  <span>Mở Thư viện để nộp bài</span>
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

          {/* VIEW MODE 2: CONTINUOUS LANDING PAGE / BOOKLET VIEW (WORD / MARKDOWN DOCUMENT STYLE) */}
          {viewMode === 'landing' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Document Header */}
              <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
                  TỔNG HỢP KIẾN THỨC MÔN {selectedSubjectName.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đề cương ôn tập toàn bộ {groupedByChapter.length} Chương • {subjectLessons.length} Bài học • Quét tự động đồng bộ theo thời gian thực
                </p>
              </div>

              {/* Chapters in Pure Document Format */}
              {groupedByChapter.map((chGroup, chIdx) => (
                <section key={`landing-ch-${chGroup.chapterName}-${chIdx}`} className="space-y-6">
                  {/* Chapter Heading (Word Heading 1) */}
                  <div className="pb-1.5 border-b-2 border-slate-800 dark:border-slate-200 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {chGroup.chapterName}
                    </h3>
                  </div>

                  {/* Lessons in this Chapter */}
                  <div className="space-y-6 pl-1 sm:pl-2">
                    {chGroup.lessons.map((lesson, lIdx) => {
                      const scanned = scanLessonData(lesson);
                      const hasNotes = Boolean(scanned.primaryNote && scanned.primaryNote.trim().length > 0);

                      return (
                        <article
                          id={`landing-lesson-${lesson.id}`}
                          key={`landing-lesson-${lesson.id || lesson.title}-${lIdx}`}
                          className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3"
                        >
                          {/* Lesson Title */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                              {lesson.title}
                            </h4>
                          </div>

                          <div className="space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                            {/* Nội dung Soạn bài */}
                            {hasNotes ? (
                              <div 
                                className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal [&>h1]:text-lg [&>h1]:font-bold [&>h1]:text-blue-700 dark:[&>h1]:text-blue-400 [&>h1]:mb-2.5 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-slate-900 dark:[&>h2]:text-white [&>h2]:mt-3 [&>h2]:mb-1.5 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-2.5"
                                dangerouslySetInnerHTML={{ __html: scanned.primaryNote }}
                              />
                            ) : (
                              <p className="text-sm text-slate-400 italic">Chưa có nội dung soạn bài.</p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}

            </div>
          )}

        </div>

      </main>

    </div>

      {/* Lightbox Zoom for Homework Images */}
      {zoomedImage && zoomedImage.trim() !== '' && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              className="p-2 text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Xoay ảnh 90 độ"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <a
              href={zoomedImage}
              download="anh-bai-nop-hoc-sinh.jpg"
              className="p-2 text-white hover:bg-slate-800 rounded-lg"
              title="Tải ảnh gốc về máy"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="p-2 text-white hover:bg-rose-600 rounded-lg cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="max-w-full max-h-[85vh] flex items-center justify-center overflow-hidden transition-transform duration-200"
            style={{ transform: `rotate(${imageRotation}deg)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomedImage} 
              alt="Bài làm học sinh" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
};
