import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lesson, 
  LessonSection, 
  Subject, 
  UserRole, 
  StudyRecord, 
  TimetableSlot, 
  LessonPlan 
} from '../types';
import { getSubjectEmoji, SUBJECTS_LIST } from '../data/mockData';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { 
  saveLargePdfBlob, 
  getLargePdfBlobUrl, 
  getStoredPdfMetadata, 
  deleteLargePdfBlob,
  StoredPdfRecord 
} from '../utils/pdfStorageUtils';
import { formatFileSize } from '../utils/fileUtils';
import { 
  X, 
  ArrowLeft,
  BookOpen, 
  Globe, 
  Youtube, 
  Camera, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Edit3, 
  Check, 
  Save, 
  ExternalLink, 
  Eye, 
  Code, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ListTree,
  Upload, 
  Maximize2, 
  RotateCw, 
  Download, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Bold, 
  Italic, 
  Underline, 
  Table as TableIcon, 
  Quote, 
  List, 
  Palette, 
  FileCheck, 
  Share2, 
  Copy, 
  BookMarked,
  ArrowUp,
  ArrowDown,
  Bookmark,
  Hash,
  Search,
  CheckSquare,
  Image as ImageIcon,
  HardDrive,
  Database,
  RefreshCw,
  Sliders,
  Tv,
  Film,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlertCircle,
  Calendar,
  Cloud,
  Link2,
  FolderArchive,
  ArrowUpRight
} from 'lucide-react';
import { TableOfContentsPanel } from './lesson-workspace/TableOfContentsPanel';
import { TocSidebarPanel } from './lesson-workspace/TocSidebarPanel';
import { EmbeddedHtmlWorkspacePanel } from './lesson-workspace/EmbeddedHtmlWorkspacePanel';
import { AllYoutubeVideosWorkspacePanel } from './lesson-workspace/AllYoutubeVideosWorkspacePanel';
import { HomeworkDocumentWorkspacePanel } from './lesson-workspace/HomeworkDocumentWorkspacePanel';

export interface TocItem {
  id: string;
  anchorId: string;
  title: string;
  level: number; // 1 (H1 lớn), 2 (H2 vừa), 3 (H3 nhỏ)
  tagName: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  url: string;
  note?: string;
}

export interface TextbookLinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  platform?: 'drive' | 'cloud' | 'onedrive' | 'hanhtrangso' | 'other';
}

interface InteractiveLessonWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  subject?: Subject;
  currentRole: UserRole;
  onSaveLesson: (updated: Lesson) => void;
  onOpenUploadMindmap?: (lessonId: string, slot?: TimetableSlot, plan?: LessonPlan) => void;
  studyRecord?: StudyRecord;
  onNavigateToTimetable?: () => void;
  isEmbedded?: boolean;
  activeTimetableSlotContext?: {
    slot: TimetableSlot;
    plan?: LessonPlan;
    dateStr?: string;
  } | null;
  onCompleteLessonWithPhotos?: (lesson: Lesson, images: string[], note?: string) => void;
  onDeleteRecord?: (recordId: string) => void;
  initialSourceType?: 'html' | 'embedded_html' | 'youtube' | 'homework_image' | 'pdf_page';
  onUnsavedChangesChange?: (hasUnsaved: boolean) => void;
  requestExitSignal?: number;
}

export const InteractiveLessonWorkspaceModal: React.FC<InteractiveLessonWorkspaceModalProps> = ({
  isOpen,
  onClose,
  lesson,
  subject,
  currentRole,
  onSaveLesson,
  onOpenUploadMindmap,
  studyRecord,
  onNavigateToTimetable,
  isEmbedded = false,
  activeTimetableSlotContext,
  onCompleteLessonWithPhotos,
  onDeleteRecord,
  initialSourceType = 'html',
  onUnsavedChangesChange,
  requestExitSignal,
}) => {
  // Working state of the lesson
  const [currentLesson, setCurrentLesson] = useState<Lesson>(lesson);
  
  // 1. HTML Content for rich text editor (Soạn bài viết)
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  // 2. Embedded HTML File state (Nhúng file HTML kéo thả riêng biệt)
  const [embeddedHtmlCode, setEmbeddedHtmlCode] = useState<string>('');
  const [embeddedHtmlFileName, setEmbeddedHtmlFileName] = useState<string>('');

  // 3. YouTube multi-video cards state
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoItem[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoNote, setNewVideoNote] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // 4. Homework images state
  const [homeworkImages, setHomeworkImages] = useState<string[]>([]);
  
  // 5. Large PDF IndexedDB Storage Stream State
  const [pdfPageStart, setPdfPageStart] = useState<number>(1);
  const [pdfPageEnd, setPdfPageEnd] = useState<number>(5);
  const [pdfCurrentViewPage, setPdfCurrentViewPage] = useState<number>(1);
  const [largePdfBlobUrl, setLargePdfBlobUrl] = useState<string | null>(null);
  const [pdfStorageInfo, setPdfStorageInfo] = useState<{ fileName: string; size: number; updatedAt: string } | null>(null);
  const [isPdfLoadingStream, setIsPdfLoadingStream] = useState(false);
  const [pdfStreamStatus, setPdfStreamStatus] = useState<string>('');
  const [pdfZoomLevel, setPdfZoomLevel] = useState<number>(100);
  const [pdfScopeMode, setPdfScopeMode] = useState<'subject' | 'lesson'>('subject');
  
  // Textbook Links State (Google Drive, Cloud, OneDrive, Hành Trang Số...)
  const [textbookLinks, setTextbookLinks] = useState<TextbookLinkItem[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [newLinkPlatform, setNewLinkPlatform] = useState<'drive' | 'cloud' | 'onedrive' | 'hanhtrangso' | 'other'>('drive');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  
  // Active TOC Anchor in Left Menu
  const [activeTocAnchorId, setActiveTocAnchorId] = useState<string>('');
  
  // Workspace Mode: 'edit' (Nhập liệu / Soạn thảo) vs 'view' (Học sinh học bài)
  // Mặc định là 'view' (chế độ tập trung học bài cho học sinh)
  const [workspaceMode, setWorkspaceMode] = useState<'edit' | 'view'>('view');
  
  // 🌟 TOP HEADER SOURCE SELECTION TABS:
  // 'html': Soạn bài viết | 'embedded_html': Nhúng File HTML | 'youtube': Video YT | 'homework_image': Ảnh bài nộp | 'pdf_page': SGK PDF
  const [selectedSourceType, setSelectedSourceType] = useState<'html' | 'embedded_html' | 'youtube' | 'homework_image' | 'pdf_page'>('html');
  
  // HTML Editor Sub-mode: 'visual' (WYSIWYG) vs 'code' (Raw HTML)
  const [htmlEditorMode, setHtmlEditorMode] = useState<'visual' | 'code'>('visual');
  
  // Inline editing for Lesson Title
  const [editingTitle, setEditingTitle] = useState('');
  
  // Selected Image for size manipulation in editor
  const [selectedImageElement, setSelectedImageElement] = useState<HTMLImageElement | null>(null);
  const [imageSizePreset, setImageSizePreset] = useState<'100%' | '75%' | '50%' | '30%'>('100%');

  // DOM References
  const richTextCanvasRef = useRef<HTMLDivElement>(null);
  const rawHtmlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const homeworkImageUploadInputRef = useRef<HTMLInputElement>(null);
  const largePdfFileInputRef = useRef<HTMLInputElement>(null);
  const viewContentContainerRef = useRef<HTMLDivElement>(null);

  // Lightbox for photos
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  
  // Save feedback state
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditorDragOver, setIsEditorDragOver] = useState(false);
  const [isHomeworkDragOver, setIsHomeworkDragOver] = useState(false);
  const [isPdfDragOver, setIsPdfDragOver] = useState(false);

  // Track changes & Lock state for safety
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isFirstRender = useRef(true);
  const justSavedRef = useRef(false);

  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  useEffect(() => {
    if (requestExitSignal && requestExitSignal > 0) {
      if (hasUnsavedChanges) {
        handleSaveAll(true);
      }
      onClose();
    }
  }, [requestExitSignal]);

  // Prevent accidental tab closing (will still auto-save if they close normally, but browser prompt acts as a safety)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Attempt a quick synchronous-like local storage save before unload
        handleSaveAll(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Global click interception to automatically save and close when clicking outside the modal
  const modalRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (hasUnsavedChanges && modalRootRef.current) {
        // If the click is OUTSIDE the workspace modal, auto-save and close!
        if (!modalRootRef.current.contains(e.target as Node)) {
          handleSaveAll(true);
          onClose();
        }
      }
    };
    // Use capture phase to intercept before other elements handle the click
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [hasUnsavedChanges]);

  // Collapsible TOC & Dropdown Menu States
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const [isTocDropdownOpen, setIsTocDropdownOpen] = useState(false);
  const [tocSearchQuery, setTocSearchQuery] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const tocDropdownRef = useRef<HTMLDivElement>(null);
  const loadedLessonIdRef = useRef<string | null>(null);
  const prevInitialSourceTypeRef = useRef<string>(initialSourceType);

  const sanitizeHtmlLinksForImages = (html: string): string => {
    if (!html) return '';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = doc.querySelectorAll('img');
      let changed = false;
      images.forEach(img => {
        const parentA = img.closest('a');
        if (parentA) {
          parentA.replaceWith(img);
          changed = true;
        }
      });
      return changed ? doc.body.innerHTML : html;
    } catch (e) {
      return html;
    }
  };

  // Calculate reading progress and auto-detect active heading on scroll
  const handleMainContentScroll = () => {
    const container = mainScrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 
      ? Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100))) 
      : 0;
    setReadingProgress(progress);

    // ScrollSpy: auto-detect current active heading
    if (tocItems.length > 0) {
      const headings = container.querySelectorAll('h1, h2, h3, h4, [data-toc="true"]');
      let currentActiveId = '';
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top - containerRect.top <= 140) {
          currentActiveId = h.id || '';
        }
      });
      if (currentActiveId) {
        setActiveTocAnchorId(currentActiveId);
      }
    }
  };

  // Close TOC dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tocDropdownRef.current && !tocDropdownRef.current.contains(event.target as Node)) {
        setIsTocDropdownOpen(false);
      }
    };
    if (isTocDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTocDropdownOpen]);

  // Block any image-related link clicks from navigating or opening a new tab globally inside the workspace modal
  useEffect(() => {
    const handleCaptureEvent = (event: Event) => {
      let target = event.target as HTMLElement | null;
      while (target) {
        if (target.tagName === 'A') {
          const hasImg = target.querySelector('img') || (event.target instanceof HTMLImageElement);
          if (hasImg) {
            event.preventDefault();
            event.stopPropagation();
            
            // Try to unwrap image from the link
            const img = target.querySelector('img');
            if (img) {
              try {
                target.replaceWith(img);
              } catch (e) {
                // Ignore fallback
              }
            }
          }
          break;
        }
        target = target.parentElement;
      }
    };

    const events = ['click', 'mousedown', 'mouseup', 'pointerdown'];
    events.forEach(evt => {
      document.addEventListener(evt, handleCaptureEvent, true);
    });
    
    return () => {
      events.forEach(evt => {
        document.removeEventListener(evt, handleCaptureEvent, true);
      });
    };
  }, []);

  // Helper to construct Storage Key for Large PDF
  const getPdfStorageKey = (scope: 'subject' | 'lesson' = pdfScopeMode) => {
    if (scope === 'subject') {
      return `pdf_master_subject_${currentLesson.subjectName.trim()}`;
    }
    return `pdf_lesson_${currentLesson.id}`;
  };

  // Initialize Lesson Data & Large PDF Stream
  useEffect(() => {
    if (!lesson) return;

    // Check if switching to a completely new lesson vs updating current lesson
    const isNewLesson = loadedLessonIdRef.current !== lesson.id;

    if (isNewLesson) {
      loadedLessonIdRef.current = lesson.id;
      prevInitialSourceTypeRef.current = initialSourceType;

      // Construct default HTML body if empty
      let initialHtml = lesson.htmlBody || '';
      
      if (!initialHtml && lesson.sections && lesson.sections.length > 0) {
        const htmlSec = lesson.sections.find(s => s.type === 'html');
        if (htmlSec && htmlSec.content) {
          initialHtml = htmlSec.content;
        }
      }

      if (!initialHtml) {
        initialHtml = '';
      }

      // Initialize Embedded HTML from lesson or section
      let initialEmbeddedHtml = lesson.embeddedHtmlCode || '';
      let initialEmbeddedFileName = lesson.embeddedHtmlFileName || '';
      if (!initialEmbeddedHtml && lesson.sections) {
        const embSec = lesson.sections.find(s => s.type === 'embedded_html');
        if (embSec && embSec.content) {
          initialEmbeddedHtml = embSec.content;
          initialEmbeddedFileName = embSec.fileName || '';
        }
      }
      setEmbeddedHtmlCode(initialEmbeddedHtml);
      setEmbeddedHtmlFileName(initialEmbeddedFileName);

      setCurrentLesson(lesson);
      setEditingTitle(lesson.title);
      setHtmlContent(initialHtml);

      // Initialize YouTube multi-videos
      let initialVideos: YouTubeVideoItem[] = [];
      if (lesson.youtubeVideos && lesson.youtubeVideos.length > 0) {
        initialVideos = lesson.youtubeVideos;
      } else if (lesson.youtubeUrl) {
        initialVideos.push({
          id: 'yt-1',
          title: 'Video bài giảng chính',
          url: lesson.youtubeUrl,
          note: lesson.sections?.find(s => s.type === 'youtube')?.content || ''
        });
      } else if (lesson.sections) {
        const ytSecs = lesson.sections.filter(s => s.type === 'youtube');
        ytSecs.forEach((sec, idx) => {
          if (sec.url) {
            initialVideos.push({
              id: `yt-sec-${idx + 1}`,
              title: sec.title || `Video bài giảng ${idx + 1}`,
              url: sec.url,
              note: sec.content || ''
            });
          }
        });
      }

      if (initialVideos.length === 0) {
        initialVideos = [];
      }

      setYoutubeVideos(initialVideos);
      setActiveVideoId(initialVideos[0]?.id || '');

      const startP = lesson.pdfPageNumber || 1;
      setPdfPageStart(startP);
      setPdfPageEnd(lesson.pdfEndPage || startP + 4);
      setPdfCurrentViewPage(startP);
      setHomeworkImages(lesson.completedHomeworkImages || []);
      
      // Initialize Textbook Links (Drive, Cloud, OneDrive, Hành Trang Số...)
      let initialLinks: TextbookLinkItem[] = [];
      if (lesson.textbookLinks && lesson.textbookLinks.length > 0) {
        initialLinks = [...lesson.textbookLinks];
      } else if (lesson.masterDocumentUrl) {
        initialLinks = [{
          id: 'tbl-init-1',
          title: `Sách Giáo Khoa ${lesson.subjectName || ''}`,
          url: lesson.masterDocumentUrl,
          platform: lesson.masterDocumentUrl.includes('drive.google') ? 'drive' : (lesson.masterDocumentUrl.includes('cloud') ? 'cloud' : 'other'),
          description: 'Liên kết đọc sách giáo khoa trực tuyến'
        }];
      }
      setTextbookLinks(initialLinks);

      if (initialSourceType) {
        setSelectedSourceType(initialSourceType);
      }

      // Load Large PDF Stream from IndexedDB
      loadPdfStreamFromStorage(lesson.subjectName, lesson.id);

      // Reset change tracking for the newly loaded lesson
      setHasUnsavedChanges(false);
      isFirstRender.current = true;
      justSavedRef.current = false;
    } else {
      // Same lesson updated: sync currentLesson & homeworkImages without resetting active tab or unsaved editor content
      setCurrentLesson(lesson);
      if (lesson.completedHomeworkImages) {
        setHomeworkImages(lesson.completedHomeworkImages);
      }
      if (lesson.textbookLinks) {
        setTextbookLinks(lesson.textbookLinks);
      }
      // If initialSourceType prop explicitly changed from parent
      if (initialSourceType && initialSourceType !== prevInitialSourceTypeRef.current) {
        prevInitialSourceTypeRef.current = initialSourceType;
        setSelectedSourceType(initialSourceType);
      }
    }
  }, [lesson, studyRecord, initialSourceType]);

  // Function to load Large PDF Stream from IndexedDB
  const loadPdfStreamFromStorage = async (subjectName: string, lessonId: string) => {
    try {
      setIsPdfLoadingStream(true);
      setPdfStreamStatus('Đang kiểm tra luồng dữ liệu PDF lớn...');
      
      const subjectKey = `pdf_master_subject_${subjectName.trim()}`;
      const lessonKey = `pdf_lesson_${lessonId}`;

      let meta = await getStoredPdfMetadata(subjectKey);
      let blobUrl = await getLargePdfBlobUrl(subjectKey);

      if (!blobUrl) {
        meta = await getStoredPdfMetadata(lessonKey);
        blobUrl = await getLargePdfBlobUrl(lessonKey);
      }

      if (blobUrl && meta) {
        setLargePdfBlobUrl(blobUrl);
        setPdfStorageInfo(meta);
        setPdfStreamStatus(`Đã kết nối luồng PDF: ${meta.fileName} (${formatFileSize(meta.size)})`);
      } else {
        setLargePdfBlobUrl(null);
        setPdfStorageInfo(null);
        setPdfStreamStatus('Chưa có file SGK lớn trong bộ nhớ đệm.');
      }
    } catch (err) {
      console.error('Error loading PDF stream:', err);
      setPdfStreamStatus('Lỗi khi nạp luồng dữ liệu PDF lớn.');
    } finally {
      setIsPdfLoadingStream(false);
    }
  };

  // Synchronize richTextCanvasRef when htmlContent changes, switching to visual editor or workspaceMode toggling
  useEffect(() => {
    if (richTextCanvasRef.current && htmlEditorMode === 'visual') {
      const cleanHtml = sanitizeHtmlLinksForImages(htmlContent);
      if (richTextCanvasRef.current.innerHTML !== cleanHtml) {
        richTextCanvasRef.current.innerHTML = cleanHtml;
      }
    }
  }, [htmlContent, htmlEditorMode, selectedSourceType, workspaceMode]);

  // Extract Table of Contents (TOC) with Hierarchical Levels (1: H1, 2: H2, 3: H3)
  const tocItems = useMemo<TocItem[]>(() => {
    if (!htmlContent) return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, [data-toc="true"]');
      
      const list: TocItem[] = [];
      let index = 1;

      headingElements.forEach((el) => {
        const title = el.textContent?.trim() || '';
        if (!title) return;
        
        const anchorId = el.getAttribute('id') || `toc-heading-${index}`;
        const tag = el.tagName.toLowerCase();
        
        // Level parsing: H1 -> 1 (Lớn), H2 -> 2 (Vừa), H3/H4 -> 3 (Nhỏ)
        const customLevelAttr = el.getAttribute('data-level');
        let level = 2;
        if (customLevelAttr) {
          level = parseInt(customLevelAttr, 10) || 2;
        } else if (tag === 'h1') {
          level = 1;
        } else if (tag === 'h2') {
          level = 2;
        } else if (tag === 'h3' || tag === 'h4') {
          level = 3;
        }

        list.push({
          id: `toc-${index}`,
          anchorId: anchorId,
          title: title,
          level: Math.min(3, Math.max(1, level)),
          tagName: tag
        });
        index++;
      });

      return list;
    } catch (e) {
      return [];
    }
  }, [htmlContent]);

  if (!isOpen) return null;

  const currentSubjectObj = subject || SUBJECTS_LIST.find(s => s.name === currentLesson.subjectName);
  const subjectEmoji = currentSubjectObj?.emoji || getSubjectEmoji(currentLesson.subjectName);

  // Helper to extract YouTube video ID or Embed URL
  const getYoutubeEmbedUrl = (rawUrl: string): string | null => {
    if (!rawUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = rawUrl.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    if (rawUrl.includes('youtube.com/embed/')) return rawUrl;
    return null;
  };

  // Rich Text ExecCommand Formatter
  const formatDoc = (cmd: string, val: string = '') => {
    if (richTextCanvasRef.current) {
      richTextCanvasRef.current.focus();
      document.execCommand(cmd, false, val);
      const newHtml = richTextCanvasRef.current.innerHTML;
      setHtmlContent(newHtml);
    }
  };

  // Insert Image into HTML Editor with Drop Size
  const insertImageIntoHtmlEditor = (imageUrl: string, sizePercent: string = '100%') => {
    const widthStyle = sizePercent === '100%' ? 'width: 100%; max-width: 100%;' : `width: ${sizePercent}; max-width: 100%;`;
    const imageHtml = `
      <div style="text-align: center; margin: 16px 0;">
        <img 
          src="${imageUrl}" 
          alt="Hình ảnh bài học" 
          class="lesson-inline-img"
          data-size="${sizePercent}"
          style="${widthStyle} height: auto; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(0,0,0,0.12); cursor: default; transition: all 0.2s ease;"
        />
      </div>
      <p><br></p>
    `;

    if (htmlEditorMode === 'visual') {
      formatDoc('insertHTML', imageHtml);
    } else {
      setHtmlContent(prev => prev + '\n' + imageHtml);
    }
  };

  // Handle Drag & Drop Images onto HTML Editor
  const handleEditorImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditorDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const compressedDataUrl = await compressImageToDataUrl(file);
          insertImageIntoHtmlEditor(compressedDataUrl, imageSizePreset);
        } catch (err) {
          console.error('Error compressing dropped image:', err);
        }
      }
    }
  };

  // Handle Pasting Images & Formatted Text from Clipboard
  const handleEditorPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imagePasted = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imagePasted = true;
        const blob = items[i].getAsFile();
        if (blob) {
          const compressedDataUrl = await compressImageToDataUrl(blob);
          insertImageIntoHtmlEditor(compressedDataUrl, imageSizePreset);
        }
      }
    }

    if (imagePasted) {
      e.preventDefault();
    }
  };

  // Handle File Input select for Images
  const handleInlineImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const compressedDataUrl = await compressImageToDataUrl(file);
        insertImageIntoHtmlEditor(compressedDataUrl, imageSizePreset);
      }
    }

    if (inlineImageInputRef.current) inlineImageInputRef.current.value = '';
  };

  // Adjust size of selected or all inline images
  const handleAdjustImageSizeInEditor = (size: '100%' | '75%' | '50%' | '30%') => {
    setImageSizePreset(size);
    if (!richTextCanvasRef.current) return;

    const widthVal = size === '100%' ? '100%' : size;
    const images = richTextCanvasRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.style.width = widthVal;
      img.style.maxWidth = '100%';
      img.setAttribute('data-size', size);
    });

    setHtmlContent(richTextCanvasRef.current.innerHTML);
  };

  // Insert HTML Table
  const handleInsertTable = () => {
    const rows = 3;
    const cols = 3;
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;">';
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr style="${r === 0 ? 'background-color: #f1f5f9; font-weight: bold;' : ''}">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">${r === 0 ? `Cột ${c + 1}` : `Ô (${r}, ${c + 1})`}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><p><br></p>';
    formatDoc('insertHTML', tableHtml);
  };

  // Assign selection as new Table of Contents item with chosen level (1: H1, 2: H2, 3: H3)
  const handleAddNewTocItemWithLevel = (title: string, level: number = 2) => {
    const anchorId = `toc-heading-${Date.now()}`;
    const tagName = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
    const tagClass = level === 1 
      ? 'toc-heading font-extrabold text-xl text-blue-900 dark:text-blue-200 border-b-2 border-slate-300 dark:border-slate-700 pb-1.5 my-4 scroll-mt-6'
      : level === 2
        ? 'toc-heading font-bold text-lg text-indigo-900 dark:text-indigo-300 border-b border-slate-200 dark:border-slate-700 pb-1 my-3 scroll-mt-6'
        : 'toc-heading font-semibold text-base text-slate-800 dark:text-slate-300 my-2.5 scroll-mt-6';

    const snippet = `<${tagName} id="${anchorId}" data-toc="true" data-level="${level}" class="${tagClass}">${title}</${tagName}><p>Nội dung phần ${title}...</p>`;

    if (htmlEditorMode === 'code') {
      setHtmlContent(prev => prev + '\n' + snippet);
    } else {
      formatDoc('insertHTML', snippet);
    }

    setTimeout(() => {
      if (richTextCanvasRef.current) {
        setHtmlContent(richTextCanvasRef.current.innerHTML);
      }
      handleScrollToTocItem({
        id: `toc-${tocItems.length + 1}`,
        anchorId: anchorId,
        title: title,
        level: level,
        tagName: tagName
      });
    }, 100);
  };

  // Scroll to TOC Item in Editor / Viewer
  const handleScrollToTocItem = (item: TocItem) => {
    setActiveTocAnchorId(item.anchorId);
    
    if (selectedSourceType !== 'html') {
      setSelectedSourceType('html');
    }

    setTimeout(() => {
      let targetEl = document.getElementById(item.anchorId);
      
      if (!targetEl && richTextCanvasRef.current) {
        const headings = richTextCanvasRef.current.querySelectorAll('h1, h2, h3, h4, [data-toc="true"]');
        headings.forEach(h => {
          if (h.textContent?.trim() === item.title) {
            h.setAttribute('id', item.anchorId);
            targetEl = h as HTMLElement;
          }
        });
      }

      if (!targetEl && viewContentContainerRef.current) {
        const headings = viewContentContainerRef.current.querySelectorAll('h1, h2, h3, h4, [data-toc="true"]');
        headings.forEach(h => {
          if (h.textContent?.trim() === item.title) {
            targetEl = h as HTMLElement;
          }
        });
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  // Update TOC Item Level (1 -> 2 -> 3)
  const handleUpdateTocItemLevel = (anchorId: string, newLevel: number) => {
    const targetTag = newLevel === 1 ? 'h1' : newLevel === 2 ? 'h2' : 'h3';

    if (richTextCanvasRef.current) {
      const el = richTextCanvasRef.current.querySelector(`[id="${anchorId}"]`);
      if (el) {
        const newEl = document.createElement(targetTag);
        newEl.id = anchorId;
        newEl.setAttribute('data-toc', 'true');
        newEl.setAttribute('data-level', String(newLevel));
        newEl.className = newLevel === 1 
          ? 'toc-heading font-extrabold text-xl text-blue-900 dark:text-blue-200 border-b-2 border-slate-300 pb-1.5 my-4 scroll-mt-6'
          : newLevel === 2
            ? 'toc-heading font-bold text-lg text-indigo-900 dark:text-indigo-300 border-b border-slate-200 pb-1 my-3 scroll-mt-6'
            : 'toc-heading font-semibold text-base text-slate-800 dark:text-slate-300 my-2.5 scroll-mt-6';
        newEl.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(newEl, el);
        setHtmlContent(richTextCanvasRef.current.innerHTML);
      }
    } else {
      const regex = new RegExp(`(<)(h[1-4]|div)([^>]*id=["']${anchorId}["'][^>]*>)(.*?)(<\\/\\2>)`, 'i');
      const updated = htmlContent.replace(regex, `<${targetTag}$3 data-level="${newLevel}">$4</${targetTag}>`);
      setHtmlContent(updated);
    }
  };

  // Rename TOC Heading directly from Left Menu
  const handleRenameTocItem = (anchorId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    if (richTextCanvasRef.current) {
      const el = richTextCanvasRef.current.querySelector(`[id="${anchorId}"]`);
      if (el) {
        el.textContent = newTitle.trim();
        const updated = richTextCanvasRef.current.innerHTML;
        setHtmlContent(updated);
      }
    } else {
      const regex = new RegExp(`(<(h[1-4]|div)[^>]*id=["']${anchorId}["'][^>]*>)(.*?)(<\\/\\2>)`, 'i');
      const updated = htmlContent.replace(regex, `$1${newTitle.trim()}$4`);
      setHtmlContent(updated);
    }
  };

  // Delete a TOC Item / Heading
  const handleDeleteTocItem = (item: TocItem) => {
    if (!confirm(`Bạn có chắc muốn xóa mục lục "${item.title}" khỏi bài soạn?`)) return;

    if (richTextCanvasRef.current) {
      const el = richTextCanvasRef.current.querySelector(`[id="${item.anchorId}"]`);
      if (el) {
        el.remove();
        setHtmlContent(richTextCanvasRef.current.innerHTML);
      }
    } else {
      const regex = new RegExp(`<(h[1-4]|div)[^>]*id=["']${item.anchorId}["'][^>]*>.*?<\\/\\1>`, 'gi');
      const updated = htmlContent.replace(regex, '');
      setHtmlContent(updated);
    }
  };

  // Extract headings from Embedded HTML and append to TOC
  const handleExtractEmbeddedHeadingsToToc = (headings: { title: string; level: number }[]) => {
    let appendedHtml = '';
    headings.forEach((h, idx) => {
      const anchorId = `toc-emb-${Date.now()}-${idx + 1}`;
      const tag = h.level === 1 ? 'h1' : h.level === 2 ? 'h2' : 'h3';
      appendedHtml += `\n<${tag} id="${anchorId}" data-toc="true" data-level="${h.level}">${h.title}</${tag}>\n<p>Nội dung từ file HTML nhúng...</p>\n`;
    });
    setHtmlContent(prev => prev + '\n' + appendedHtml);
  };

  // YouTube Multi-Video Handlers
  const handleAddNewYouTubeVideo = () => {
    if (!newVideoUrl.trim()) {
      alert('Vui lòng nhập đường link YouTube.');
      return;
    }

    const newVideo: YouTubeVideoItem = {
      id: `yt-${Date.now()}`,
      title: newVideoTitle.trim() || `Video bài giảng ${youtubeVideos.length + 1}`,
      url: newVideoUrl.trim(),
      note: newVideoNote.trim()
    };

    const updated = [...youtubeVideos, newVideo];
    setYoutubeVideos(updated);
    setActiveVideoId(newVideo.id);

    setNewVideoTitle('');
    setNewVideoUrl('');
    setNewVideoNote('');
    setIsAddingVideo(false);
  };

  const handleUpdateVideo = (id: string, updatedData: Partial<YouTubeVideoItem>) => {
    const updated = youtubeVideos.map(v => v.id === id ? { ...v, ...updatedData } : v);
    setYoutubeVideos(updated);
  };

  const handleDeleteVideo = (id: string) => {
    const updated = youtubeVideos.filter(v => v.id !== id);
    setYoutubeVideos(updated);
    if (activeVideoId === id) {
      setActiveVideoId(updated[0]?.id || '');
    }
  };

  const activeVideo = useMemo(() => {
    return youtubeVideos.find(v => v.id === activeVideoId) || youtubeVideos[0] || null;
  }, [youtubeVideos, activeVideoId]);

  // Large PDF Handlers
  const handleUploadLargePdf = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Vui lòng chọn file định dạng PDF.');
      return;
    }

    try {
      setIsPdfLoadingStream(true);
      setPdfStreamStatus(`Đang nạp luồng lưu trữ lớn: ${file.name} (${formatFileSize(file.size)})...`);

      const key = getPdfStorageKey(pdfScopeMode);

      await saveLargePdfBlob(key, file, {
        fileName: file.name,
        subjectName: currentLesson.subjectName,
        lessonId: currentLesson.id
      });

      const blobUrl = await getLargePdfBlobUrl(key);
      const meta = await getStoredPdfMetadata(key);

      setLargePdfBlobUrl(blobUrl);
      setPdfStorageInfo(meta);
      setPdfStreamStatus(`Đã nạp thành công luồng SGK lớn (${formatFileSize(file.size)})`);
    } catch (err) {
      console.error('Error saving large PDF:', err);
      alert('Lỗi khi nạp file PDF lớn.');
      setPdfStreamStatus('Lỗi khi lưu trữ luồng PDF.');
    } finally {
      setIsPdfLoadingStream(false);
    }
  };

  const handleClearLargePdfStorage = async () => {
    if (!confirm('Bạn có chắc muốn xóa bộ nhớ đệm của file PDF SGK này?')) return;
    try {
      const key = getPdfStorageKey(pdfScopeMode);
      await deleteLargePdfBlob(key);
      setLargePdfBlobUrl(null);
      setPdfStorageInfo(null);
      setPdfStreamStatus('Đã xóa bộ nhớ đệm PDF.');
    } catch (err) {
      console.error('Error deleting PDF:', err);
    }
  };

  // Image Upload handler for homework
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const compressed = await compressImageToDataUrl(files[i]);
          newUrls.push(compressed);
        }
      }
      const combined = [...homeworkImages, ...newUrls];
      setHomeworkImages(combined);
      setCurrentLesson(prev => ({
        ...prev,
        completedHomeworkImages: combined
      }));
    } catch (err) {
      alert('Không thể xử lý ảnh tải lên. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
      if (homeworkImageUploadInputRef.current) homeworkImageUploadInputRef.current.value = '';
    }
  };

  const handleHomeworkImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHomeworkDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const compressed = await compressImageToDataUrl(files[i]);
          newUrls.push(compressed);
        }
      }
      if (newUrls.length > 0) {
        const combined = [...homeworkImages, ...newUrls];
        setHomeworkImages(combined);
        setCurrentLesson(prev => ({
          ...prev,
          completedHomeworkImages: combined
        }));
      }
    } catch (err) {
      alert('Lỗi khi tải ảnh kéo thả.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = (imgIdx: number) => {
    const updated = homeworkImages.filter((_, idx) => idx !== imgIdx);
    setHomeworkImages(updated);
    setCurrentLesson(prev => ({
      ...prev,
      completedHomeworkImages: updated
    }));
  };

  // Handle Textbook Links Management (Google Drive, Cloud, OneDrive, Hành Trang Số...)
  const handleAddOrUpdateTextbookLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLinkUrl.trim()) return;

    let formattedUrl = newLinkUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    let detectedPlatform: 'drive' | 'cloud' | 'onedrive' | 'hanhtrangso' | 'other' = newLinkPlatform;
    if (formattedUrl.includes('drive.google.com')) detectedPlatform = 'drive';
    else if (formattedUrl.includes('onedrive') || formattedUrl.includes('1drv.ms') || formattedUrl.includes('sharepoint')) detectedPlatform = 'onedrive';
    else if (formattedUrl.includes('hanhtrangso.nxbgd.vn')) detectedPlatform = 'hanhtrangso';
    else if (formattedUrl.includes('dropbox') || formattedUrl.includes('icloud') || formattedUrl.includes('cloud')) detectedPlatform = 'cloud';

    const itemToSave: TextbookLinkItem = {
      id: editingLinkId || 'tbl-' + Date.now(),
      title: newLinkTitle.trim() || `Sách Giáo Khoa ${currentLesson.subjectName || ''}`,
      url: formattedUrl,
      description: newLinkDescription.trim() || undefined,
      platform: detectedPlatform
    };

    if (editingLinkId) {
      setTextbookLinks(prev => prev.map(item => item.id === editingLinkId ? itemToSave : item));
      setEditingLinkId(null);
    } else {
      setTextbookLinks(prev => [...prev, itemToSave]);
    }

    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkDescription('');
    setNewLinkPlatform('drive');
    setIsAddingLink(false);
    setHasUnsavedChanges(true);
  };

  const handleEditTextbookLink = (item: TextbookLinkItem) => {
    setEditingLinkId(item.id);
    setNewLinkTitle(item.title);
    setNewLinkUrl(item.url);
    setNewLinkDescription(item.description || '');
    setNewLinkPlatform(item.platform || 'drive');
    setIsAddingLink(true);
  };

  const handleDeleteTextbookLink = (id: string) => {
    setTextbookLinks(prev => prev.filter(item => item.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => {
      setCopiedLinkId(null);
    }, 2000);
  };

  // Save All Changes
  const handleSaveAll = (silent = false) => {
    let finalHtml = htmlContent;
    if (richTextCanvasRef.current && htmlEditorMode === 'visual') {
      finalHtml = richTextCanvasRef.current.innerHTML;
    }

    const generatedSections: LessonSection[] = [];
    
    // 1. HTML Primary section
    generatedSections.push({
      id: 'sec-html-' + Date.now(),
      title: '1. Nội dung bài soạn HTML',
      type: 'html',
      content: finalHtml,
      order: 1
    });

    // 2. Embedded HTML dedicated file section
    if (embeddedHtmlCode) {
      generatedSections.push({
        id: 'sec-emb-html-' + Date.now(),
        title: `2. File HTML nhúng (${embeddedHtmlFileName || 'Tương tác'})`,
        type: 'embedded_html',
        content: embeddedHtmlCode,
        fileName: embeddedHtmlFileName,
        order: 2
      });
    }

    // 3. Multi-Youtube videos
    youtubeVideos.forEach((vid, idx) => {
      generatedSections.push({
        id: `sec-yt-${idx + 1}-${Date.now()}`,
        title: vid.title,
        type: 'youtube',
        url: vid.url,
        content: vid.note,
        order: 3 + idx
      });
    });

    // 4. Homework images
    if (homeworkImages.length > 0) {
      generatedSections.push({
        id: 'sec-img-' + Date.now(),
        title: '4. Ảnh bài làm & Vở ghi chép',
        type: 'homework_image',
        imageUrls: homeworkImages,
        order: 10
      });
    }

    // 5. SGK PDF & Textbook Links
    if (textbookLinks.length > 0 || pdfPageStart) {
      generatedSections.push({
        id: 'sec-pdf-' + Date.now(),
        title: `5. Sách giáo khoa & Tài liệu (${textbookLinks.length} liên kết)`,
        type: 'pdf_page',
        pdfPageNumber: pdfPageStart,
        pdfEndPage: pdfPageEnd,
        url: textbookLinks[0]?.url || largePdfBlobUrl || currentLesson.masterDocumentUrl || subject?.masterPdfUrl,
        order: 20
      });
    }

    const finalLesson: Lesson = {
      ...currentLesson,
      title: editingTitle.trim() || currentLesson.title,
      htmlBody: finalHtml,
      embeddedHtmlCode: embeddedHtmlCode,
      embeddedHtmlFileName: embeddedHtmlFileName,
      youtubeUrl: youtubeVideos[0]?.url || undefined,
      youtubeVideos: youtubeVideos,
      textbookLinks: textbookLinks,
      pdfPageNumber: pdfPageStart,
      pdfEndPage: pdfPageEnd,
      pdfStorageKey: getPdfStorageKey(pdfScopeMode),
      masterDocumentUrl: textbookLinks[0]?.url || largePdfBlobUrl || currentLesson.masterDocumentUrl,
      completedHomeworkImages: homeworkImages,
      sections: generatedSections
    };

    setCurrentLesson(finalLesson);
    onSaveLesson(finalLesson);

    // Update save status tracking
    justSavedRef.current = true;
    setHasUnsavedChanges(false);

    if (!silent) {
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2200);
    }
  };

  // Track any unsaved changes in lesson content or metadata
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (justSavedRef.current) {
      justSavedRef.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [htmlContent, embeddedHtmlCode, youtubeVideos, homeworkImages, editingTitle, textbookLinks]);

  // Auto-save and close handler
  const handleCloseClick = () => {
    if (hasUnsavedChanges) {
      handleSaveAll(true);
    }
    onClose();
  };

  // Autosave when important data changes
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSaveAll(true);
    }, 1500);
    return () => clearTimeout(handler);
  }, [htmlContent, embeddedHtmlCode, youtubeVideos, homeworkImages, editingTitle, textbookLinks]);

  return (
    <div ref={modalRootRef} className={isEmbedded ? "w-full h-full flex flex-col animate-in fade-in duration-200 min-h-0 relative z-10" : "min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in duration-200"}>
      
      {/* Container */}
      <div className={isEmbedded ? "w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#161f30] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-0" : "flex-1 w-full flex flex-col overflow-hidden bg-white dark:bg-[#161f30]"}>
        
        {/* ========================================================================= */}
        {/* 📌 1. HEADER CỦA TRANG BÀI HỌC: HIỆN ĐẠI, GỌN GÀNG, MÀU SẮC HÀI HÒA        */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#161f30] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shrink-0">
          
          {/* Left: Subject Info & Lesson Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {currentLesson.subjectName} • Bài {currentLesson.lessonNumber}
                </span>
                {currentRole === 'admin' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Giáo viên / Phụ huynh
                  </span>
                )}
              </div>

              {workspaceMode === 'edit' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="text-sm sm:text-base font-bold bg-transparent text-slate-900 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-60 sm:w-80 truncate hover:border-slate-400 transition-colors"
                    placeholder="Tên bài học..."
                  />
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ) : (
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-md mt-0.5">
                  {currentLesson.title}
                </h2>
              )}
            </div>
          </div>

          {/* Center: Source Format Selector (Clean segmented pill tabs) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold gap-0.5 overflow-x-auto">
            
            {/* 1. Soạn Bài Học */}
            <button
              type="button"
              onClick={() => setSelectedSourceType('html')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                selectedSourceType === 'html'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 font-medium'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Soạn Bài</span>
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            {/* 2. Tải lên HTML */}
            <button
              type="button"
              onClick={() => setSelectedSourceType('embedded_html')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                selectedSourceType === 'embedded_html'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 font-medium'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>File HTML {embeddedHtmlCode ? '⚡' : ''}</span>
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            {/* 3. Tải Video Bài Giảng (youtube) */}
            <button
              type="button"
              onClick={() => setSelectedSourceType('youtube')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                selectedSourceType === 'youtube'
                  ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-2xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-medium'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Video YouTube</span>
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            {/* 4. Tải SGK */}
            <button
              type="button"
              onClick={() => setSelectedSourceType('pdf_page')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                selectedSourceType === 'pdf_page'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sách Giáo Khoa</span>
              {textbookLinks.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 rounded-full font-bold">
                  {textbookLinks.length}
                </span>
              )}
            </button>

            <span className="w-px h-3.5 bg-blue-300/70 dark:bg-blue-600/50 self-center shrink-0 mx-0.5" aria-hidden="true" />

            {/* 5. Nộp Báo Cáo Học Bài */}
            <button
              type="button"
              onClick={() => setSelectedSourceType('homework_image')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                selectedSourceType === 'homework_image'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 font-medium'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Nộp báo cáo Học Bài</span>
              {homeworkImages.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-teal-100 dark:bg-teal-900/70 text-teal-800 dark:text-teal-200 rounded-full font-bold">
                  {homeworkImages.length}
                </span>
              )}
            </button>
          </div>

          {/* Right: Mode & Actions */}
          <div className="flex items-center gap-2">
            
            {/* Toggle Mode: Soạn thảo vs Học sinh */}
            <div className="flex items-center bg-amber-100/90 dark:bg-amber-950/60 p-0.5 rounded-lg border border-amber-300/80 dark:border-amber-800/70 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setWorkspaceMode('edit')}
                className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  workspaceMode === 'edit'
                    ? 'bg-orange-500 text-white shadow-xs font-extrabold ring-1 ring-orange-600/30'
                    : 'text-amber-900 dark:text-amber-200 hover:text-orange-800 dark:hover:text-amber-100 hover:bg-orange-200/80 dark:hover:bg-amber-900/60 font-bold'
                }`}
                title="Chế độ nhập liệu, copy dán và gán mục lục"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Soạn bài</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('view')}
                className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  workspaceMode === 'view'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold ring-1 ring-emerald-700/30'
                    : 'text-amber-900 dark:text-amber-200 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-200/80 dark:hover:bg-amber-900/60 font-bold'
                }`}
                title="Chế độ xem tập trung cho học sinh học bài"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Học bài</span>
              </button>
            </div>

            {/* Real-time Auto-Save Status Badge */}
            <div className="flex items-center">
              {hasUnsavedChanges ? (
                <div 
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-amber-200/50 dark:border-amber-900/30 shadow-3xs"
                  title="Có thay đổi mới, hệ thống sẽ tự động lưu sau giây lát!"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Đang ghi nhận...</span>
                </div>
              ) : (
                <div 
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/50 dark:border-emerald-900/30 shadow-3xs"
                  title="Mọi chỉnh sửa của bạn đã được lưu tự động thành công!"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Đã tự động lưu</span>
                </div>
              )}
            </div>

            {/* Back to Library Button */}
            <button
              type="button"
              onClick={handleCloseClick}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Quay lại danh sách thư viện bài học"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📌 2. THÂN CHÍNH: KHU VỰC TRÌNH BÀY TOÀN DIỆN & BONG BÓNG MỤC LỤC LƠ LỬNG */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
          
          {/* --------------------------------------------------------------------- */}
          {/* 👈 KHU VỰC TRÌNH BÀY & SOẠN THẢO TƯƠNG TÁC (100% DIỆN TÍCH KHÔNG BỊ CHIA CỘT) */}
          {/* --------------------------------------------------------------------- */}
          <div className="flex-1 w-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-all duration-200">
            
            {/* Nội dung Canvas theo từng loại (Tràn viền, không rào chắn) */}
            <div 
              ref={mainScrollContainerRef}
              onScroll={handleMainContentScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
            >
              
              {/* =================================================================== */}
              {/* 📝 A. DẠNG SOẠN BÀI VIẾT (HỖ TRỢ KÉO THẢ ẢNH & DROP SIZE)            */}
              {/* =================================================================== */}
              {selectedSourceType === 'html' && (
                <div className="h-full flex flex-col space-y-3 max-w-[1550px] mx-auto w-full">
                  
                  {workspaceMode === 'edit' ? (
                    <>
                      {/* Rich Text Editor Toolbar (Chỉ hiện khi ở chế độ Soạn bài) */}
                      <div className="flex items-center justify-between flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
                        <div className="flex items-center flex-wrap gap-1">
                          {htmlEditorMode === 'visual' && (
                            <>
                              <button
                                type="button"
                                onClick={() => formatDoc('bold')}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-bold transition-colors"
                                title="In đậm (Ctrl+B)"
                              >
                                <Bold className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('italic')}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md italic transition-colors"
                                title="In nghiêng (Ctrl+I)"
                              >
                                <Italic className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('underline')}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md underline transition-colors"
                                title="Gạch chân (Ctrl+U)"
                              >
                                <Underline className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-0.5" />
                              
                              <button
                                type="button"
                                onClick={() => formatDoc('formatBlock', '<h1>')}
                                className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-bold text-[11px] text-blue-600 dark:text-blue-400"
                                title="Tiêu đề lớn H1"
                              >
                                H1
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('formatBlock', '<h2>')}
                                className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-bold text-[11px] text-indigo-600 dark:text-indigo-400"
                                title="Tiêu đề vừa H2"
                              >
                                H2
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('formatBlock', '<h3>')}
                                className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-bold text-[11px] text-amber-600 dark:text-amber-400"
                                title="Ý nhỏ H3"
                              >
                                H3
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('insertUnorderedList')}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="Danh sách gạch đầu dòng"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => formatDoc('insertOrderedList')}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="Danh sách số 1, 2, 3"
                              >
                                <ListOrdered className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleInsertTable}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="Chèn bảng dữ liệu"
                              >
                                <TableIcon className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-0.5" />

                              <input
                                ref={inlineImageInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleInlineImageSelect}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => inlineImageInputRef.current?.click()}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-emerald-600"
                                title="Chèn ảnh minh họa"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (htmlEditorMode === 'visual') {
                              if (richTextCanvasRef.current) {
                                setHtmlContent(richTextCanvasRef.current.innerHTML);
                              }
                              setHtmlEditorMode('code');
                            } else {
                              setHtmlEditorMode('visual');
                            }
                          }}
                          className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
                        >
                          <Code className="w-3 h-3" />
                          <span>{htmlEditorMode === 'visual' ? 'HTML' : 'Trực quan'}</span>
                        </button>
                      </div>

                      {htmlEditorMode === 'visual' ? (
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsEditorDragOver(true); }}
                          onDragLeave={() => setIsEditorDragOver(false)}
                          onDrop={handleEditorImageDrop}
                          className={`flex-1 bg-white dark:bg-slate-900 border rounded-2xl p-6 sm:p-8 shadow-2xs overflow-y-auto focus-within:ring-2 focus-within:ring-blue-500/50 min-h-[440px] transition-all relative ${
                            isEditorDragOver 
                              ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-50/20' 
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {isEditorDragOver && (
                            <div className="absolute inset-0 z-20 bg-blue-500/10 backdrop-blur-[1px] border-2 border-dashed border-blue-500 rounded-2xl flex flex-col items-center justify-center text-blue-700 dark:text-blue-300 pointer-events-none">
                              <ImageIcon className="w-10 h-10 mb-2 animate-bounce" />
                              <p className="font-bold text-sm">Thả ảnh vào đây để tự động chèn!</p>
                            </div>
                          )}

                          <div
                            ref={richTextCanvasRef}
                            contentEditable
                            onInput={(e) => {
                              const cleaned = sanitizeHtmlLinksForImages(e.currentTarget.innerHTML);
                              if (cleaned !== e.currentTarget.innerHTML) {
                                e.currentTarget.innerHTML = cleaned;
                              }
                              setHtmlContent(cleaned);
                            }}
                            onPaste={(e) => {
                              handleEditorPaste(e);
                              setTimeout(() => {
                                if (richTextCanvasRef.current) {
                                  const cleaned = sanitizeHtmlLinksForImages(richTextCanvasRef.current.innerHTML);
                                  if (cleaned !== richTextCanvasRef.current.innerHTML) {
                                    richTextCanvasRef.current.innerHTML = cleaned;
                                    setHtmlContent(cleaned);
                                  }
                                }
                              }, 50);
                            }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'IMG' || target.closest('a')?.querySelector('img')) {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                            className="prose dark:prose-invert max-w-none focus:outline-none min-h-[380px] text-[17px] leading-[1.75] text-slate-800 dark:text-slate-200"
                            style={{ minHeight: '380px', fontSize: '17px', lineHeight: '1.75' }}
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col">
                          <textarea
                            ref={rawHtmlTextareaRef}
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            className="w-full flex-1 font-mono text-sm p-4 bg-slate-900 text-blue-300 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[440px]"
                            placeholder="Dán mã HTML bài viết tại đây..."
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div 
                      ref={viewContentContainerRef}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'IMG' || target.closest('a')?.querySelector('img')) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs"
                    >
                      <div 
                        className="prose dark:prose-invert max-w-none text-[17px] leading-[1.75] text-slate-800 dark:text-slate-200"
                        style={{ fontSize: '17px', lineHeight: '1.75' }}
                        dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-slate-400 italic">Chưa có nội dung cho bài học này.</p>' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* 🌐 B. 🌟 MENU TÁCH RIÊNG: NHÚNG FILE HTML (KÉO THẢ .HTML VÀO)         */}
              {/* =================================================================== */}
              {selectedSourceType === 'embedded_html' && (
                <EmbeddedHtmlWorkspacePanel
                  embeddedHtmlCode={embeddedHtmlCode}
                  embeddedHtmlFileName={embeddedHtmlFileName}
                  onUpdateEmbeddedHtml={(code, fileName) => {
                    setEmbeddedHtmlCode(code);
                    if (fileName) setEmbeddedHtmlFileName(fileName);
                  }}
                  workspaceMode={workspaceMode}
                  onExtractHeadingsToToc={handleExtractEmbeddedHeadingsToToc}
                />
              )}

              {/* =================================================================== */}
              {/* ▶️ C. DẠNG YOUTUBE VIDEO: TRÌNH BÀY TẤT CẢ CÁC LINKS YOUTUBE        */}
              {/* =================================================================== */}
              {selectedSourceType === 'youtube' && (
                <AllYoutubeVideosWorkspacePanel
                  youtubeVideos={youtubeVideos}
                  activeVideoId={activeVideoId}
                  onSetActiveVideoId={setActiveVideoId}
                  onAddNewVideo={(title, url, note) => {
                    const newVideo: YouTubeVideoItem = {
                      id: `yt-${Date.now()}`,
                      title,
                      url,
                      note
                    };
                    const updated = [...youtubeVideos, newVideo];
                    setYoutubeVideos(updated);
                    setActiveVideoId(newVideo.id);
                  }}
                  onUpdateVideo={handleUpdateVideo}
                  onDeleteVideo={handleDeleteVideo}
                  onReorderVideos={(newVideos) => setYoutubeVideos(newVideos)}
                  workspaceMode={workspaceMode}
                />
              )}

              {/* =================================================================== */}
              {/* 🌳 D. 🌟 MENU MỚI: BÁO CÁO HỌC BÀI & SƠ ĐỒ TƯ DUY DẠNG CÂY TỎA PHẢI */}
              {/* =================================================================== */}
              {selectedSourceType === 'homework_image' && (
                <HomeworkDocumentWorkspacePanel
                  lesson={currentLesson}
                  homeworkImages={homeworkImages}
                  lessonTitle={editingTitle || currentLesson.title}
                  subjectName={currentLesson.subjectName}
                  studyRecord={studyRecord}
                  onUpdateImages={(updatedImages) => {
                    setHomeworkImages(updatedImages);
                    const updated = {
                      ...currentLesson,
                      completedHomeworkImages: updatedImages,
                    };
                    setCurrentLesson(updated);
                    onSaveLesson(updated);
                  }}
                  onSaveMindmap={(report) => {
                    const updated = {
                      ...currentLesson,
                      mindmapReport: report,
                    };
                    setCurrentLesson(updated);
                    onSaveLesson(updated);
                  }}
                  workspaceMode={workspaceMode}
                  activeTimetableSlotContext={activeTimetableSlotContext}
                  onCompleteLessonWithPhotos={(images, note) => {
                    const updated = {
                      ...currentLesson,
                      completedHomeworkImages: images,
                    };
                    setCurrentLesson(updated);
                    onSaveLesson(updated);
                    if (onCompleteLessonWithPhotos) {
                      onCompleteLessonWithPhotos(updated, images, note);
                    }
                  }}
                  onDeleteRecord={onDeleteRecord}
                  onNavigateToTimetable={() => {
                    onClose();
                    if (onNavigateToTimetable) {
                      onNavigateToTimetable();
                    }
                  }}
                />
              )}

              {/* =================================================================== */}
              {/* 📖 E. DẠNG SGK LIÊN KẾT (DANH SÁCH TINH GỌN - MINIMALIST LIST)        */}
              {/* =================================================================== */}
              {selectedSourceType === 'pdf_page' && (
                <div className="space-y-3">
                  
                  {/* Compact Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                        <BookMarked className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            Danh sách Sách Giáo Khoa & Tài Liệu
                          </h4>
                          <span className="px-2 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-[10px] font-bold rounded-full">
                            {textbookLinks.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Bấm nút để mở xem trực tiếp trên Google Drive, OneDrive hoặc Hành Trang Số
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isAddingLink) {
                          setIsAddingLink(false);
                          setEditingLinkId(null);
                        } else {
                          setEditingLinkId(null);
                          setNewLinkTitle(`Sách Giáo Khoa ${currentLesson.subjectName || ''}`);
                          setNewLinkUrl('');
                          setNewLinkDescription('');
                          setNewLinkPlatform('drive');
                          setIsAddingLink(true);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <Plus className={`w-3.5 h-3.5 transition-transform ${isAddingLink ? 'rotate-45' : ''}`} />
                      <span>{isAddingLink ? 'Đóng' : '+ Thêm link sách'}</span>
                    </button>
                  </div>

                  {/* Inline Compact Form (Add/Edit) */}
                  {isAddingLink && (
                    <form 
                      onSubmit={handleAddOrUpdateTextbookLink}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{editingLinkId ? '✏️ Chỉnh sửa liên kết' : '➕ Thêm sách mới'}</span>
                        <span className="text-[11px] text-slate-400 font-normal">Dán đường link để học sinh bấm đọc ngay</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Tên sách / Bộ tài liệu *</label>
                          <input
                            type="text"
                            required
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="VD: SGK Toán 7 - Tập 1 (Kết nối tri thức)..."
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Đường dẫn liên kết (URL) *</label>
                          <input
                            type="url"
                            required
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://drive.google.com/... hoặc https://hanhtrangso.nxbgd.vn/..."
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Ghi chú thêm (tùy chọn)</label>
                          <input
                            type="text"
                            value={newLinkDescription}
                            onChange={(e) => setNewLinkDescription(e.target.value)}
                            placeholder="VD: Đọc từ trang 15 đến trang 30..."
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingLink(false);
                            setEditingLinkId(null);
                          }}
                          className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{editingLinkId ? 'Cập nhật' : 'Lưu sách'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Clean List View */}
                  {textbookLinks.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs overflow-hidden">
                      {textbookLinks.map((item, idx) => {
                        const isDrive = item.platform === 'drive' || item.url.includes('drive.google');
                        const isOneDrive = item.platform === 'onedrive' || item.url.includes('onedrive') || item.url.includes('sharepoint');
                        const isHanhTrangSo = item.platform === 'hanhtrangso' || item.url.includes('hanhtrangso');

                        let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                        let platformName = 'Web';
                        let IconComp = Globe;

                        if (isDrive) {
                          badgeColor = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
                          platformName = 'Google Drive';
                          IconComp = HardDrive;
                        } else if (isOneDrive) {
                          badgeColor = 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300';
                          platformName = 'OneDrive';
                          IconComp = Cloud;
                        } else if (isHanhTrangSo) {
                          badgeColor = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300';
                          platformName = 'Hành Trang Số';
                          IconComp = BookOpen;
                        }

                        return (
                          <div 
                            key={item.id || idx}
                            className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* Book Info */}
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 flex items-center gap-1 ${badgeColor}`}>
                                <IconComp className="w-3 h-3" />
                                <span className="hidden sm:inline">{platformName}</span>
                              </span>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                                  {item.title}
                                </h5>

                                {item.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    💬 {item.description}
                                  </p>
                                )}

                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {item.url}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                title="Mở trang sách đọc ngay"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Mở đọc ↗</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(item.url, item.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                title="Sao chép liên kết"
                              >
                                {copiedLinkId === item.id ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đã copy</span>
                                ) : (
                                  <span>Copy</span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditTextbookLink(item)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Sửa tên / link"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteTextbookLink(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Chưa có liên kết Sách Giáo Khoa nào trong danh sách.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLinkId(null);
                          setNewLinkTitle(`Sách Giáo Khoa ${currentLesson.subjectName || ''}`);
                          setNewLinkUrl('');
                          setNewLinkDescription('');
                          setNewLinkPlatform('drive');
                          setIsAddingLink(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Bấm để thêm liên kết đầu tiên</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* 👉 TREE TABLE OF CONTENTS (NẰM Ở GIỮA MÀN HÌNH CẠNH PHẢI)              */}
          {/* --------------------------------------------------------------------- */}
          <TableOfContentsPanel
            tocItems={tocItems}
            activeTocAnchorId={activeTocAnchorId}
            readingProgress={readingProgress}
            onScrollToTocItem={handleScrollToTocItem}
            onUpdateTocItemLevel={handleUpdateTocItemLevel}
            onRenameTocItem={handleRenameTocItem}
            onDeleteTocItem={handleDeleteTocItem}
            onAddNewTocItemWithLevel={handleAddNewTocItemWithLevel}
            workspaceMode={workspaceMode}
            isCollapsed={isTocCollapsed}
            onToggleCollapse={() => setIsTocCollapsed(prev => !prev)}
          />
        </div>
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
              className="p-2 text-white hover:bg-slate-800 rounded-lg"
              title="Xoay ảnh 90 độ"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <a
              href={zoomedImage}
              download="bai-lam-hoc-sinh.jpg"
              className="p-2 text-white hover:bg-slate-800 rounded-lg"
              title="Tải ảnh gốc về máy"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="p-2 text-white hover:bg-rose-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <img
            src={zoomedImage}
            alt="Phóng to bài làm"
            style={{ transform: `rotate(${imageRotation}deg)` }}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          />
        </div>
      )}
    </div>
  );
};
