import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  CheckCircle2,
  Plus,
  Trash2,
  X,
  BookOpen,
  RotateCcw,
  Upload,
  ImageIcon,
  Maximize2,
  Loader2,
  Sparkles
} from 'lucide-react';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/dist/photoswipe.css';
import { StudyRecord, TimetableSlot, LessonPlan, Lesson, MindmapSection, LessonMindmapReport } from '../../types';
import { ConfettiCelebration } from './ConfettiCelebration';
import { compressImageToDataUrl } from '../../utils/imageUtils';

// Whimsical color palette for branches
const BRANCH_PALETTE = [
  {
    name: 'blue',
    color: '#2563eb', // blue-600
    textClass: 'text-blue-700 dark:text-blue-300 font-semibold',
    btnClass: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50',
    dotBg: 'bg-blue-600',
  },
  {
    name: 'purple',
    color: '#9333ea', // purple-600
    textClass: 'text-purple-700 dark:text-purple-300 font-semibold',
    btnClass: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50',
    dotBg: 'bg-purple-600',
  },
  {
    name: 'teal',
    color: '#0d9488', // teal-600
    textClass: 'text-teal-700 dark:text-teal-300 font-semibold',
    btnClass: 'text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50',
    dotBg: 'bg-teal-600',
  },
  {
    name: 'amber',
    color: '#d97706', // amber-600
    textClass: 'text-amber-700 dark:text-amber-300 font-semibold',
    btnClass: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50',
    dotBg: 'bg-amber-600',
  },
  {
    name: 'rose',
    color: '#e11d48', // rose-600
    textClass: 'text-rose-700 dark:text-rose-300 font-semibold',
    btnClass: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50',
    dotBg: 'bg-rose-600',
  },
];

interface ConnectionLine {
  id: string;
  d: string;
  color: string;
  strokeWidth: number;
}

interface HomeworkDocumentWorkspacePanelProps {
  lesson: Lesson;
  homeworkImages?: string[];
  lessonTitle: string;
  subjectName: string;
  studyRecord?: StudyRecord;
  onUpdateImages?: (updatedImages: string[]) => void;
  workspaceMode: 'edit' | 'view';
  activeTimetableSlotContext?: {
    slot: TimetableSlot;
    plan?: LessonPlan;
    dateStr?: string;
  } | null;
  onCompleteLessonWithPhotos?: (images: string[], studentNote?: string) => void;
  onDeleteRecord?: (recordId: string) => void;
  onNavigateToTimetable?: () => void;
  onSaveMindmap?: (report: LessonMindmapReport) => void;
}

export const HomeworkDocumentWorkspacePanel: React.FC<HomeworkDocumentWorkspacePanelProps> = ({
  lesson,
  homeworkImages,
  lessonTitle: initialLessonTitle,
  subjectName,
  studyRecord,
  onUpdateImages,
  onCompleteLessonWithPhotos,
  onDeleteRecord,
  onSaveMindmap,
}) => {
  // 1. Core State: Lesson Title
  const [lessonTitle, setLessonTitle] = useState<string>(() => {
    return lesson.mindmapReport?.lessonTitle || initialLessonTitle || lesson.title || 'Nội dung bài học';
  });

  // 2. Homework Images & Compression State
  const [images, setImages] = useState<string[]>(() => {
    if (homeworkImages && homeworkImages.length > 0) return homeworkImages;
    if (studyRecord?.homeworkImages && studyRecord.homeworkImages.length > 0) return studyRecord.homeworkImages;
    return [
      'https://picsum.photos/id/1050/1200/1600',
      'https://picsum.photos/id/1015/1600/1000',
      'https://picsum.photos/id/1039/1600/1000',
      'https://picsum.photos/id/1043/1600/1000',
      'https://picsum.photos/id/1056/1600/1000',
    ];
  });
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessImageFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const compressedList: string[] = [];
      for (const file of validFiles) {
        // Tự động nén ảnh client-side siêu nhẹ
        const compressedDataUrl = await compressImageToDataUrl(file, 1400, 0.8);
        compressedList.push(compressedDataUrl);
      }
      const updated = [...images, ...compressedList];
      setImages(updated);
      onUpdateImages?.(updated);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      alert('Không thể nén/tải ảnh. Vui lòng thử lại với file ảnh khác!');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    onUpdateImages?.(updated);
  };

  const [imageMetas, setImageMetas] = useState<{ url: string; width: number; height: number }[]>([]);

  // Tự động đo kích thước ảnh gốc (naturalWidth & naturalHeight) cho PhotoSwipe
  useEffect(() => {
    let isMounted = true;
    if (!images || images.length === 0) {
      setImageMetas([]);
      return;
    }

    const loadAllDimensions = async () => {
      const metas = await Promise.all(
        images.map(
          (url) =>
            new Promise<{ url: string; width: number; height: number }>((resolve) => {
              const img = new Image();
              img.onload = () => {
                resolve({
                  url,
                  width: img.naturalWidth || 1200,
                  height: img.naturalHeight || 900,
                });
              };
              img.onerror = () => {
                resolve({ url, width: 1200, height: 900 });
              };
              img.src = url;
            })
        )
      );
      if (isMounted) {
        setImageMetas(metas);
      }
    };

    loadAllDimensions();

    return () => {
      isMounted = false;
    };
  }, [images]);

  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  // Khởi tạo PhotoSwipeLightbox để kích hoạt hiệu ứng zoom slow-motion chuẩn 100% từ mã nguồn mẫu
  useEffect(() => {
    if (imageMetas.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery',
      children: 'a.pswp-gallery-item',
      pswpModule: PhotoSwipe,
      bgOpacity: 0.9,
      showHideAnimationType: 'zoom',
      showAnimationDuration: 150,
      hideAnimationDuration: 150,
      zoomAnimationDuration: 150,
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [imageMetas]);

  // 2. Sections & Key Points
  const [sections, setSections] = useState<MindmapSection[]>(() => {
    if (lesson.mindmapReport?.sections && lesson.mindmapReport.sections.length > 0) {
      return lesson.mindmapReport.sections;
    }
    if (studyRecord?.mindmapReport?.sections && studyRecord.mindmapReport.sections.length > 0) {
      return studyRecord.mindmapReport.sections;
    }
    if (lesson.keyPoints && lesson.keyPoints.length > 0) {
      return [
        {
          id: 'sec-1',
          title: 'Trọng tâm bài học',
          keyPoints: [...lesson.keyPoints],
        },
      ];
    }
    // Whimsical starter sample
    return [
      {
        id: 'sec-1',
        title: 'Khái niệm & Bản chất',
        keyPoints: [
          'Định nghĩa cốt lõi và ý nghĩa của bài học',
          'Mối liên hệ giữa các thành phần kiến thức',
        ],
      },
      {
        id: 'sec-2',
        title: 'Phương pháp & Áp dụng',
        keyPoints: [
          'Quy tắc vận dụng và các bước giải cụ thể',
          'Các lưu ý đặc biệt và mẹo ghi nhớ nhanh',
        ],
      },
    ];
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const isFirstMount = useRef(true);

  // Canvas and node references for dynamic coordinate tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pointRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // SVG curved lines connecting branches
  const [curves, setCurves] = useState<ConnectionLine[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 1200, height: 600 });

  // Auto-save callback
  const triggerAutoSave = useCallback((newTitle: string, newSections: MindmapSection[]) => {
    if (onSaveMindmap) {
      const report: LessonMindmapReport = {
        lessonTitle: newTitle.trim() || lesson.title,
        sections: newSections,
        submittedAt: new Date().toISOString(),
      };
      onSaveMindmap(report);
    }
  }, [lesson.title, onSaveMindmap]);

  // Debounced auto-save
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      triggerAutoSave(lessonTitle, sections);
    }, 400);

    return () => clearTimeout(timer);
  }, [lessonTitle, sections, triggerAutoSave]);

  // Real-time calculation of organic Bezier curves (S-Curves as in Whimsical)
  const calculateCurves = useCallback(() => {
    if (!containerRef.current || !rootNodeRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rootRect = rootNodeRef.current.getBoundingClientRect();

    // Origin point: Right center of root card
    const rootX = rootRect.right - containerRect.left;
    const rootY = rootRect.top + rootRect.height / 2 - containerRect.top;

    const newCurves: ConnectionLine[] = [];

    sections.forEach((section, sIdx) => {
      const theme = BRANCH_PALETTE[sIdx % BRANCH_PALETTE.length];
      const secEl = sectionRefs.current[section.id];
      if (!secEl) return;

      const secRect = secEl.getBoundingClientRect();
      const secX = secRect.left - containerRect.left;
      const secY = secRect.top + secRect.height / 2 - containerRect.top;

      const dx1 = Math.max(40, (secX - rootX) * 0.55);
      const path1 = `M ${rootX} ${rootY} C ${rootX + dx1} ${rootY}, ${secX - dx1} ${secY}, ${secX} ${secY}`;

      newCurves.push({
        id: `root-to-${section.id}`,
        d: path1,
        color: theme.color,
        strokeWidth: 3,
      });

      const secRightX = secRect.right - containerRect.left;
      const secRightY = secY;

      section.keyPoints.forEach((_, pIdx) => {
        const pointEl = pointRefs.current[`${section.id}-${pIdx}`];
        if (!pointEl) return;

        const pointRect = pointEl.getBoundingClientRect();
        const pointX = pointRect.left - containerRect.left;
        const pointY = pointRect.top + pointRect.height / 2 - containerRect.top;

        const dx2 = Math.max(30, (pointX - secRightX) * 0.5);
        const path2 = `M ${secRightX} ${secRightY} C ${secRightX + dx2} ${secRightY}, ${pointX - dx2} ${pointY}, ${pointX} ${pointY}`;

        newCurves.push({
          id: `sec-${section.id}-point-${pIdx}`,
          d: path2,
          color: theme.color,
          strokeWidth: 2,
        });
      });
    });

    setCurves(newCurves);
    setSvgDimensions({
      width: Math.max(containerRect.width, containerRef.current.scrollWidth),
      height: Math.max(containerRect.height, containerRef.current.scrollHeight),
    });
  }, [sections]);

  useLayoutEffect(() => {
    calculateCurves();
    const handleResize = () => calculateCurves();
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(calculateCurves, 50);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [calculateCurves, sections, lessonTitle]);

  // Handle Add Section
  const handleAddSection = () => {
    const newIdx = sections.length + 1;
    const newSec: MindmapSection = {
      id: `sec-${Date.now()}`,
      title: `Phần ${newIdx}: Nội dung kiến thức mới`,
      keyPoints: ['Ý chính 1 của phần này'],
    };
    const updated = [...sections, newSec];
    setSections(updated);
    triggerAutoSave(lessonTitle, updated);
  };

  // Handle Update Section Title
  const handleUpdateSectionTitle = (secId: string, val: string) => {
    const updated = sections.map(s => (s.id === secId ? { ...s, title: val } : s));
    setSections(updated);
  };

  // Handle Delete Section
  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      alert('Sơ đồ cần có ít nhất 1 phần kiến thức!');
      return;
    }
    const updated = sections.filter(s => s.id !== secId);
    setSections(updated);
    triggerAutoSave(lessonTitle, updated);
  };

  // Handle Add Key Point
  const handleAddPoint = (secId: string) => {
    const updated = sections.map(s => {
      if (s.id === secId) {
        return {
          ...s,
          keyPoints: [...s.keyPoints, `Ý chính ${s.keyPoints.length + 1}`],
        };
      }
      return s;
    });
    setSections(updated);
    triggerAutoSave(lessonTitle, updated);
  };

  // Handle Update Key Point
  const handleUpdatePoint = (secId: string, pIdx: number, val: string) => {
    const updated = sections.map(s => {
      if (s.id === secId) {
        const nextPoints = [...s.keyPoints];
        nextPoints[pIdx] = val;
        return { ...s, keyPoints: nextPoints };
      }
      return s;
    });
    setSections(updated);
  };

  // Handle Delete Key Point
  const handleDeletePoint = (secId: string, pIdx: number) => {
    const updated = sections.map(s => {
      if (s.id === secId) {
        if (s.keyPoints.length <= 1) {
          return s;
        }
        return {
          ...s,
          keyPoints: s.keyPoints.filter((_, idx) => idx !== pIdx),
        };
      }
      return s;
    });
    setSections(updated);
    triggerAutoSave(lessonTitle, updated);
  };

  // Action 1: Chốt học xong Bài Học (ngay lập tức đưa ra Thời khóa biểu)
  const handleCompleteLesson = () => {
    // 1. Tự động lưu bản ghi sơ đồ tư duy mới nhất vào lesson
    if (onSaveMindmap) {
      const report: LessonMindmapReport = {
        lessonTitle: lessonTitle.trim() || lesson.title,
        sections: sections,
        submittedAt: new Date().toISOString(),
      };
      onSaveMindmap(report);
    }

    // 2. Chốt bài học đưa ra Thời Khóa Biểu
    if (onCompleteLessonWithPhotos) {
      onCompleteLessonWithPhotos(images, 'Đã học xong bài học theo sơ đồ tư duy');
    }
    setShowSuccessBanner(true);
    setShowConfetti(true);
  };

  // Action 2: Gỡ khỏi Thời khóa biểu
  const handleRemoveFromTimetable = () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn gỡ bài học "${lessonTitle}" khỏi Thời khóa biểu không?\n\n(Nội dung sơ đồ tư duy vẫn được tự động lưu giữ an toàn)`
      )
    ) {
      return;
    }

    if (studyRecord && onDeleteRecord) {
      onDeleteRecord(studyRecord.id);
    }
    setShowSuccessBanner(false);
  };

  const isCompleted = studyRecord?.status === 'COMPLETED' || studyRecord?.showOnTimetable === true;

  return (
    <div className="w-full space-y-3 pb-6" id="whimsical-mindmap-container">
      {/* 🎆 HIỆU ỨNG PHÁO HOA KHI CHỐT BÀI HỌC (CHUẨN 5 GIÂY) */}
      {showConfetti && <ConfettiCelebration durationMs={5000} onComplete={() => setShowConfetti(false)} />}

      {/* 🎉 THÔNG BÁO CHỐT BÀI HỌC THÀNH CÔNG */}
      {showSuccessBanner && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌳</span>
            <div className="text-xs sm:text-sm font-medium">
              <span className="font-bold">Đã chốt học xong bài học!</span> Bài học đã được hiển thị ra Thời Khóa Biểu.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessBanner(false)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* ========================================================================= */}
      {/* 🌟 THANH ĐIỀU KHIỂN CỐT LÕI: CHỈ ĐÚNG 2 NÚT HÀNH ĐỘNG                       */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Sơ Đồ Tư Duy (Môn {subjectName})
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tự động lưu
          </span>
        </div>

        {/* Cụm 2 nút hành động duy nhất */}
        <div className="flex items-center gap-2">
          {isCompleted && (
            <button
              type="button"
              onClick={handleRemoveFromTimetable}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Hủy trạng thái đã học trên Thời khóa biểu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gỡ khỏi thời khóa biểu</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCompleteLesson}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
            }`}
            title="Đánh dấu hoàn thành và đưa bài học ra Thời khóa biểu"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? '✓ Đã Chốt Ra Thời Khóa Biểu' : 'Chốt học xong Bài Học 🚀'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌳 WHIMSICAL CANVAS: KHÔNG THANH CUỘN LỒNG NHAU, PHẲNG THOÁNG ĐÃNG        */}
      {/* ========================================================================= */}
      <div 
        ref={containerRef}
        className="w-full bg-[#f4f7fa] dark:bg-slate-950 rounded-2xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs relative select-none"
      >
        {/* LỚP SVG VẼ ĐƯỜNG CONG HỮU CƠ MỀM MẠI PHÍA SAU NỘI DUNG */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: svgDimensions.width, height: svgDimensions.height }}
        >
          {curves.map((curve) => (
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
          {/* 1. THẺ GỐC TRUNG TÂM (ROOT NODE - WHIMSICAL CARD)                   */}
          {/* =================================================================== */}
          <div className="shrink-0 relative group mr-12 sm:mr-16">
            <div
              ref={rootNodeRef}
              className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 w-52 sm:w-60 transition-all hover:shadow-lg"
            >
              {/* Tên bài học tự co giãn, không cuộn */}
              <textarea
                rows={2}
                value={lessonTitle}
                onChange={(e) => {
                  setLessonTitle(e.target.value);
                  setTimeout(calculateCurves, 0);
                }}
                placeholder="Tên bài học..."
                className="w-full font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-hidden transition-colors resize-none leading-snug overflow-hidden"
              />
            </div>

            {/* Nút nhỏ + Thêm Phần ngay dưới thẻ Gốc */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleAddSection}
                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-full flex items-center gap-1 transition-colors cursor-pointer border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Thêm Phần</span>
              </button>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 2. CÁC NHÁNH PHẦN (LEVEL 1) VÀ CÁC Ý CHÍNH (LEVEL 2)                */}
          {/* =================================================================== */}
          <div className="flex-1 space-y-10 sm:space-y-12 relative">
            {sections.map((section, sIdx) => {
              const theme = BRANCH_PALETTE[sIdx % BRANCH_PALETTE.length];

              return (
                <div key={section.id || sIdx} className="flex items-center group/section relative">
                  
                  {/* NHÁNH CẤP 1 (SECTION NODE - TEXT ON BRANCH) */}
                  <div
                    ref={(el) => {
                      sectionRefs.current[section.id] = el;
                    }}
                    className="shrink-0 flex items-center gap-1.5 relative group/secItem mr-10 sm:mr-14"
                  >
                    {/* Điểm chấm tròn đầu nhánh */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: theme.color }}
                    />

                    {/* Văn bản tên Phần */}
                    <div className="relative">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          handleUpdateSectionTitle(section.id, e.target.value);
                          setTimeout(calculateCurves, 0);
                        }}
                        placeholder={`Phần ${sIdx + 1}...`}
                        className={`text-xs sm:text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-hidden py-0.5 min-w-[150px] max-w-[260px] ${theme.textClass}`}
                      />
                    </div>

                    {/* Nút hành động nhanh của Phần: + Ý chính / Xóa */}
                    <div className="flex items-center opacity-0 group-hover/section:opacity-100 transition-opacity gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => handleAddPoint(section.id)}
                        className={`p-1 rounded-md ${theme.btnClass} cursor-pointer`}
                        title="Thêm ý chính vào phần này"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded-md cursor-pointer"
                        title="Xóa phần này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* NHÁNH CẤP 2: CÁC Ý CHÍNH (KEY POINTS - TEXT ON CURVES) */}
                  <div className="flex-1 space-y-3 sm:space-y-4 relative">
                    {section.keyPoints.map((point, pIdx) => (
                      <div
                        key={pIdx}
                        ref={(el) => {
                          pointRefs.current[`${section.id}-${pIdx}`] = el;
                        }}
                        className="flex items-center group/point relative"
                      >
                        {/* Điểm tròn nhỏ đầu nhánh ý chính */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mr-2 shadow-2xs"
                          style={{ backgroundColor: theme.color }}
                        />

                        {/* Textarea tự động xuống dòng và co giãn linh hoạt, không cuộn con */}
                        <div className="flex-1 max-w-xl group/pointInput flex items-center gap-1">
                          <textarea
                            rows={Math.max(1, Math.ceil(point.length / 55))}
                            value={point}
                            onChange={(e) => {
                              handleUpdatePoint(section.id, pIdx, e.target.value);
                              setTimeout(calculateCurves, 0);
                            }}
                            placeholder={`Ý chính ${pIdx + 1}...`}
                            className="w-full text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 font-normal bg-transparent hover:bg-white/80 dark:hover:bg-slate-900/80 focus:bg-white dark:focus:bg-slate-900 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:outline-hidden transition-all leading-relaxed resize-none overflow-hidden"
                          />

                          {/* Nút xóa ý chính nhanh */}
                          <button
                            type="button"
                            onClick={() => handleDeletePoint(section.id, pIdx)}
                            className="opacity-0 group-hover/point:opacity-100 text-slate-300 hover:text-rose-500 p-1 rounded cursor-pointer transition-opacity shrink-0"
                            title="Xóa ý này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Nút thêm ý chính tiện lợi */}
                    <div className="pl-4 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleAddPoint(section.id)}
                        className={`text-[11px] font-semibold flex items-center gap-1 ${theme.btnClass} px-2 py-0.5 rounded-md cursor-pointer opacity-70 hover:opacity-100 transition-all`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm ý</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📸 2. KHỐI TẢI ẢNH BÀI TẬP / VỞ GHI (NẰM DƯỚI SƠ ĐỒ TƯ DUY)                */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 📸 2. THƯ VIỆN ẢNH BỐ CỤC COLLAGE & Ô KÉO THẢ (EXACT USER CODE STRUCTURE)    */}
      {/* ========================================================================= */}
      <style>{`
        .gallery-card {
            max-width: 920px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }

        .card-title {
            margin: 0 0 10px 0;
            font-size: 22px;
            font-weight: 700;
            color: #1a202c;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .divider {
            border: 0;
            height: 1px;
            background: #e2e8f0;
            margin: 16px 0;
        }

        .pswp-gallery-grid {
            max-height: 500px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background-color: #f7fafc;
            display: grid;
            grid-template-columns: 1.2fr 1fr 1fr;
            grid-auto-rows: 200px;
            gap: 10px;
        }

        .pswp-gallery-grid a {
            display: block;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            position: relative;
        }

        .pswp-gallery-grid a:first-child {
            grid-column: 1 / 2;
            grid-row: span 2;
        }

        .pswp-gallery-grid img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.25s ease;
        }

        .pswp-gallery-grid a:hover img {
            transform: scale(1.05);
        }

        .dropzone-area {
            border: 2px dashed #3182ce;
            border-radius: 8px;
            padding: 12px 15px;
            text-align: center;
            background-color: #ebf8ff;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .dropzone-area:hover, 
        .dropzone-area.dragover {
            background-color: #e2f2ff;
            border-color: #2b6cb0;
            box-shadow: 0 4px 12px rgba(49, 130, 206, 0.15);
        }

        .dropzone-icon {
            font-size: 22px;
            line-height: 1;
        }

        .dropzone-text {
            font-size: 13.5px;
            font-weight: 600;
            color: #2d3748;
            margin: 0;
        }

        .dropzone-text span {
            color: #3182ce;
            text-decoration: underline;
        }

        .dropzone-hint {
            font-size: 12px;
            color: #718096;
            margin: 0;
        }

        .file-input-hidden {
            display: none;
        }
      `}</style>

      <div className="gallery-card">
        {/* 1. Tiêu đề */}
        <h3 className="card-title">📸 Thư Viện Ảnh Bố Cục Collage</h3>

        {/* Đường gạch ngăn cách */}
        <hr className="divider" />

        {/* 2. 🖼️ Khung Lưới Hiển Thị Gallery (Nằm trên) */}
        {imageMetas.length > 0 && (
          <>
            <div className="pswp-gallery-grid" id="gallery">
              {imageMetas.map((item, idx) => (
                <a
                  key={idx}
                  href="#"
                  data-pswp-src={item.url}
                  data-pswp-width={item.width || 1200}
                  data-pswp-height={item.height || 1600}
                  className="pswp-gallery-item cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (lightboxRef.current) {
                      lightboxRef.current.loadAndOpen(idx);
                    }
                  }}
                >
                  <img src={item.url} alt={`Ảnh ${idx + 1}`} />

                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-md transition-transform hover:scale-110 cursor-pointer"
                    title="Xóa trang ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </a>
              ))}
            </div>

            {/* Đường gạch ngăn cách */}
            <hr className="divider" />
          </>
        )}

        {/* 3. ☁️ Khung Kéo & Thả Upload Ảnh (Nhỏ gọn - Nằm dưới) */}
        <div
          id="dropzone"
          className={`dropzone-area ${isDragging ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files) handleProcessImageFiles(e.dataTransfer.files);
          }}
        >
          {isCompressing ? (
            <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý & nén ảnh...</span>
            </div>
          ) : (
            <>
              <span className="dropzone-icon">☁️</span>
              <p className="dropzone-text">
                Kéo & thả hình vào đây, hoặc <span>chọn từ máy tính</span>
              </p>
              <span className="dropzone-hint">(PNG, JPG, WEBP)</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            id="imageUploader"
            className="file-input-hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleProcessImageFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
};
