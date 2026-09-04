import React from 'react';
import { TableOfContentsPanel } from './TableOfContentsPanel';
import { TocItem } from '../InteractiveLessonWorkspaceModal';

export interface TocSidebarPanelProps {
  tocItems: TocItem[];
  activeTocAnchorId: string;
  readingProgress?: number;
  onScrollToTocItem: (item: TocItem) => void;
  onUpdateTocItemLevel: (anchorId: string, newLevel: number) => void;
  onRenameTocItem: (anchorId: string, newTitle: string) => void;
  onDeleteTocItem: (item: TocItem) => void;
  onAddNewTocItemWithLevel: (title: string, level: number) => void;
  workspaceMode: 'edit' | 'view';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TocSidebarPanel: React.FC<TocSidebarPanelProps> = (props) => {
  return <TableOfContentsPanel {...props} />;
};

export { TableOfContentsPanel };
