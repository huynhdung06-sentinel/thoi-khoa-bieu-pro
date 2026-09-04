import React from 'react';
import { 
  ChevronRight, 
} from 'lucide-react';
import { DashboardTab } from '../types';

export interface BreadcrumbItem {
  id: string;
  label: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbNavProps {
  activeTab: DashboardTab;
  selectedSubject?: string;
  selectedVolume?: 1 | 2;
  selectedChapter?: string;
  currentLessonTitle?: string;
  onNavigateTab: (tab: DashboardTab) => void;
  onSelectSubject?: (subject: string) => void;
  onSelectVolume?: (vol: 1 | 2) => void;
  onSelectChapter?: (chapter: string) => void;
  onResetFilters?: () => void;
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  activeTab,
  selectedSubject,
  selectedVolume,
  selectedChapter,
  currentLessonTitle,
  onNavigateTab,
  onSelectSubject,
  onSelectVolume,
  onSelectChapter,
  onResetFilters,
  className = '',
}) => {
  // Build items array dynamically based on active tab and state
  const items: BreadcrumbItem[] = [
    {
      id: 'home',
      label: 'Trang chủ',
      onClick: () => onNavigateTab('timetable'),
    }
  ];

  // Level 2: Main Menu Tab
  if (activeTab === 'timetable') {
    items.push({
      id: 'timetable',
      label: 'Thời khóa biểu',
      isCurrent: true,
    });
  } else if (activeTab === 'lessons') {
    const hasSubject = Boolean(selectedSubject);
    const hasVolume = false;
    const hasChapter = Boolean(selectedChapter && selectedChapter !== 'all');
    const hasLesson = Boolean(currentLessonTitle);

    items.push({
      id: 'lessons',
      label: 'Thư viện bài học',
      onClick: onResetFilters ? onResetFilters : () => onNavigateTab('lessons'),
      isCurrent: !hasSubject,
    });

    // Level 3: Subject
    if (selectedSubject) {
      items.push({
        id: `subject-${selectedSubject}`,
        label: `Môn ${selectedSubject}`,
        onClick: onSelectSubject ? () => onSelectSubject(selectedSubject) : undefined,
        isCurrent: !hasVolume && !hasChapter && !hasLesson,
      });

      // Level 5: Chapter (if selected and not 'all')
      if (selectedChapter && selectedChapter !== 'all') {
        items.push({
          id: `chapter-${selectedChapter}`,
          label: selectedChapter,
          onClick: onSelectChapter ? () => onSelectChapter(selectedChapter) : undefined,
          isCurrent: !hasLesson,
        });
      }

      // Level 6: Active Lesson if modal is open
      if (currentLessonTitle) {
        items.push({
          id: 'active-lesson',
          label: currentLessonTitle,
          isCurrent: true,
        });
      }
    }
  } else if (activeTab === 'analytics') {
    items.push({
      id: 'analytics',
      label: 'Tiến độ & Thành tích',
      isCurrent: true,
    });
  } else if (activeTab === 'knowledge_summary') {
    items.push({
      id: 'knowledge_summary',
      label: 'Tổng hợp kiến thức cuối kỳ',
      isCurrent: true,
    });
  }

  return (
    <nav 
      aria-label="Breadcrumb"
      className={`inline-flex items-center flex-wrap gap-1 text-[13px] font-medium text-slate-500 dark:text-slate-400 select-none ${className}`}
    >
      <span className="text-slate-400 dark:text-slate-500 mr-0.5 font-normal">Vị trí:</span>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const href = `#${item.id}`;

        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            )}

            {isLast ? (
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) item.onClick();
                }}
                className="inline-flex items-center font-bold text-blue-700 dark:text-blue-300 hover:underline max-w-[180px] sm:max-w-xs truncate cursor-pointer"
                title={`${item.label} (Vị trí hiện tại)`}
              >
                <span className="truncate">{item.label}</span>
              </a>
            ) : (
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) item.onClick();
                }}
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer max-w-[140px] truncate"
                title={`Nhấp để chuyển đến ${item.label}`}
              >
                <span className="truncate">{item.label}</span>
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

