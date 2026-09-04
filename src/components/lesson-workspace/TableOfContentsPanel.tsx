import React, { useRef, useEffect } from 'react';
import { TocItem } from '../InteractiveLessonWorkspaceModal';

interface TableOfContentsPanelProps {
  tocItems: TocItem[];
  activeTocAnchorId: string;
  onScrollToTocItem: (item: TocItem) => void;
  onUpdateTocItemLevel?: (anchorId: string, newLevel: number) => void;
  onRenameTocItem?: (anchorId: string, newTitle: string) => void;
  onDeleteTocItem?: (item: TocItem) => void;
  workspaceMode?: 'edit' | 'view';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  readingProgress?: number;
}

export const TableOfContentsPanel: React.FC<TableOfContentsPanelProps> = ({
  tocItems,
  activeTocAnchorId,
  onScrollToTocItem,
  isCollapsed = false,
  onToggleCollapse,
  readingProgress = 0,
}) => {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isCollapsed && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onToggleCollapse?.();
      }
    };

    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, onToggleCollapse]);

  if (tocItems.length === 0) {
    return null;
  }

  if (isCollapsed) {
    return (
      <div className="fixed top-1/2 -translate-y-1/2 right-0 sm:right-2 z-40 animate-in fade-in slide-in-from-right-3 duration-200">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex flex-col items-center gap-1 p-2 bg-white/95 dark:bg-slate-900/95 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 rounded-l-md sm:rounded-md shadow-sm border-y border-l sm:border border-slate-200 dark:border-slate-800 backdrop-blur-xs cursor-pointer transition-all select-none"
          title="Mở mục lục"
        >
          <div className="w-1 h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 w-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-150"
              style={{ height: `${readingProgress}%` }}
            />
          </div>
        </button>
      </div>
    );
  }

  return (
    <aside 
      ref={panelRef}
      className="fixed top-1/2 -translate-y-1/2 right-2 sm:right-6 z-40 w-64 max-h-[75vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all duration-200 select-none animate-in fade-in slide-in-from-right-3 overflow-hidden"
    >
      <div className="flex flex-col pt-3 px-4">
        {/* Thanh tiến trình (Progress Bar) */}
        <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800/60 relative mb-2.5">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 transition-all duration-150 ease-out"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 relative">
        {/* Đường kẻ dọc cho danh sách */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800/60 z-0" />

        
        <ol className="relative z-10 m-0 p-0 list-none flex flex-col gap-0.5">
          {tocItems.map((item) => {
            const isActive = activeTocAnchorId === item.anchorId;
            const isH1 = item.level === 1;
            const isH2 = item.level === 2;

            return (
              <li 
                key={item.id || item.anchorId}
                className="relative"
              >
                <a
                  href={`#${item.anchorId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onScrollToTocItem(item);
                  }}
                  style={{
                    paddingLeft: isH1 ? '16px' : isH2 ? '24px' : '32px',
                  }}
                  className={`block py-1.5 pr-2 w-full text-left transition-colors cursor-pointer group ${
                    isActive 
                      ? 'text-blue-700 dark:text-blue-400 font-semibold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={item.title}
                >
                  {/* Dấu tick báo hiệu item đang active */}
                  <span 
                    className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all ${
                      isActive
                        ? 'w-[3px] h-3.5 bg-blue-600 dark:bg-blue-400 rounded-r-sm'
                        : 'w-0 h-3.5 bg-transparent group-hover:w-[2px] group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                    }`}
                  />
                  
                  <span className={`block truncate ${
                    isH1 ? 'text-[13px]' : isH2 ? 'text-[12px]' : 'text-[11.5px]'
                  }`}>
                    {item.title}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
};
