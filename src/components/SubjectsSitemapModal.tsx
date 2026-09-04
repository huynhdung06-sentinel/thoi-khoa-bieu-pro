import React, { useMemo, useState } from 'react';
import { StudySlot } from '../types';
import { 
  X, 
  ExternalLink, 
  User, 
  MapPin, 
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Check
} from 'lucide-react';
import { SubjectMenuBar } from './SubjectMenuBar';

interface SubjectsSitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: StudySlot[];
  customSubjects: string[];
  subjectList: string[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string | null) => void;
  onAddSubject: (name: string) => void;
  onEditSubject: (oldName: string, newName: string) => void;
  onDeleteSubject: (name: string) => void;
  onOpenAddModalForSubject: (subjectName?: string) => void;
  onEditSlot: (slot: StudySlot) => void;
  onDeleteSlot?: (id: string) => void;
  onDeleteAllSlotsForSubject?: (subjectName: string) => void;
  onNavigateToSlot?: (slot: StudySlot) => void;
  appMode?: 'viewer' | 'editor';
}

interface SubjectGroup {
  name: string;
  code?: string;
  teacher?: string;
  room?: string;
  color?: string;
  slots: StudySlot[];
}

export const SubjectsSitemapModal: React.FC<SubjectsSitemapModalProps> = ({
  isOpen,
  onClose,
  slots,
  customSubjects,
  subjectList,
  selectedSubject,
  onSelectSubject,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onOpenAddModalForSubject,
  onEditSlot,
  onDeleteSlot,
  onDeleteAllSlotsForSubject,
  onNavigateToSlot,
  appMode = 'editor',
}) => {
  // Group slots and custom subjects into a clean sitemap by subject name
  const subjectGroups = useMemo(() => {
    const groupsMap = new Map<string, SubjectGroup>();

    // First add all custom subject names
    customSubjects.forEach((name) => {
      if (name.trim() && !groupsMap.has(name.trim())) {
        groupsMap.set(name.trim(), {
          name: name.trim(),
          slots: [],
        });
      }
    });

    // Then process all study slots
    slots.forEach((slot) => {
      const name = slot.subjectName.trim();
      if (!name) return;

      if (!groupsMap.has(name)) {
        groupsMap.set(name, {
          name,
          code: slot.subjectCode,
          teacher: slot.teacher,
          room: slot.room,
          color: slot.color,
          slots: [slot],
        });
      } else {
        const group = groupsMap.get(name)!;
        if (slot.subjectCode && !group.code) group.code = slot.subjectCode;
        if (slot.teacher && !group.teacher) group.teacher = slot.teacher;
        if (slot.room && !group.room) group.room = slot.room;
        if (slot.color && !group.color) group.color = slot.color;
        group.slots.push(slot);
      }
    });

    return Array.from(groupsMap.values());
  }, [slots, customSubjects]);

  const [editingSubjectName, setEditingSubjectName] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState<string>('');
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const filteredGroups = subjectGroups;

  React.useEffect(() => {
    if (isOpen && selectedSubject) {
      setTimeout(() => {
        const element = document.getElementById(`sitemap-subject-${selectedSubject}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [selectedSubject, isOpen]);

  if (!isOpen) return null;

  const handleOpenLink = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    let url = link.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSlotClick = (slot: StudySlot) => {
    onClose();
    if (onNavigateToSlot) {
      onNavigateToSlot(slot);
    } else {
      onEditSlot(slot);
    }
  };

  // Format YYYY-MM-DD -> DD/MM/YYYY
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="bg-[#f5f5f7] dark:bg-[#161617] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-[1300px] h-[88vh] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Apple Style Header & Breadcrumb */}
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between bg-white/70 dark:bg-[#1d1d1f]/70 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-700 dark:text-slate-200 font-bold">Môn Học</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-semibold">Site Map</span>
            <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
              {filteredGroups.length} môn học
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded Subject Menu Bar inside the sitemap modal */}
        <SubjectMenuBar
          subjectList={subjectList}
          selectedSubject={selectedSubject}
          onSelectSubject={onSelectSubject}
          onAddSubject={onAddSubject}
          onEditSubject={onEditSubject}
          onDeleteSubject={onDeleteSubject}
          onOpenAddModal={() => onOpenAddModalForSubject(selectedSubject || undefined)}
          appMode={appMode}
        />

        {/* Content Sitemap Index in 4 Columns (Apple Site Map Style) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Chưa có môn học nào khớp với bộ lọc
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-0">
              {filteredGroups.map((group, index) => {
                const groupColor = group.color || '#0071e3';
                const isNotLastColLg = (index + 1) % 4 !== 0;
                const isNotLastColSm = (index + 1) % 2 !== 0;

                return (
                  <div 
                    key={group.name} 
                    id={`sitemap-subject-${group.name}`}
                    className={`flex flex-col space-y-3 px-2 sm:px-5 lg:px-6 transition-all duration-355 rounded-2xl ${
                      selectedSubject === group.name
                        ? 'ring-2 ring-blue-500 bg-blue-500/5 dark:bg-blue-500/10 p-3 -m-3 shadow-sm'
                        : ''
                    } ${
                      isNotLastColLg 
                        ? 'lg:border-r lg:border-slate-200/80 lg:dark:border-slate-800/80' 
                        : 'lg:border-r-0'
                    } ${
                      isNotLastColSm 
                        ? 'sm:border-r sm:border-slate-200/80 sm:dark:border-slate-800/80' 
                        : 'sm:border-r-0'
                    }`}
                  >
                    {/* Subject Header with Action Menu */}
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: groupColor }}
                          />
                          {editingSubjectName === group.name ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (tempSubjectName.trim() && tempSubjectName.trim() !== group.name) {
                                  onEditSubject(group.name, tempSubjectName.trim());
                                }
                                setEditingSubjectName(null);
                              }}
                              className="flex items-center gap-1 flex-1"
                            >
                              <input
                                type="text"
                                autoFocus
                                value={tempSubjectName}
                                onChange={(e) => setTempSubjectName(e.target.value)}
                                className="w-full px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 border border-blue-500 rounded-md text-slate-900 dark:text-white focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="p-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                                title="Lưu"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubjectName(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </form>
                          ) : (
                            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 tracking-tight uppercase truncate">
                              {group.name}
                            </h3>
                          )}
                        </div>

                        {/* Subject Action Menu Icons */}
                        {appMode === 'editor' && editingSubjectName !== group.name && (
                          <div className="flex items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => onOpenAddModalForSubject(group.name)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-semibold"
                              title={`Thêm bài/giờ học cho môn ${group.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubjectName(group.name);
                                setTempSubjectName(group.name);
                              }}
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              title={`Đổi tên môn ${group.name}`}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            {group.slots.length > 0 && onDeleteAllSlotsForSubject && (
                              confirmDeleteKey === `ALL_${group.name}` ? (
                                <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950/90 px-1.5 py-0.5 rounded-md text-[10px] text-red-600 dark:text-red-300 font-bold animate-in fade-in duration-100" onClick={(e) => e.stopPropagation()}>
                                  <span>Xóa tất cả?</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteAllSlotsForSubject(group.name);
                                      setConfirmDeleteKey(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteKey(null);
                                    }}
                                    className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteKey(`ALL_${group.name}`);
                                  }}
                                  className="p-1 text-amber-600 hover:text-red-600 dark:text-amber-400 dark:hover:text-red-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-md transition-colors cursor-pointer"
                                  title={`Xóa tất cả ${group.slots.length} bài học của môn ${group.name}`}
                                >
                                  <Trash2 className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              )
                            )}

                            {confirmDeleteKey === `SUBJ_${group.name}` ? (
                              <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950/90 px-1.5 py-0.5 rounded-md text-[10px] text-red-600 dark:text-red-300 font-bold animate-in fade-in duration-100" onClick={(e) => e.stopPropagation()}>
                                <span>Xóa môn?</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSubject(group.name);
                                    setConfirmDeleteKey(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                                >
                                  Xóa
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteKey(null);
                                  }}
                                  className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteKey(`SUBJ_${group.name}`);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-md transition-colors cursor-pointer"
                                title={`Xóa môn ${group.name}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {(group.teacher || group.room) && (
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                          {group.teacher && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{group.teacher}</span>
                            </span>
                          )}
                          {group.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              <span>{group.room}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Minimalist Vertical Link List */}
                    <div className="flex flex-col space-y-1.5 pl-4">
                      {group.slots.length > 0 ? (
                        group.slots.map((s) => {
                          const eventLink = s.meetingUrl || s.studyLink;
                          const formattedDate = formatDateVN(s.date);
                          const lessonTitle = s.subjectCode
                            ? ((s.subjectCode || '').toLowerCase().startsWith('bài') ? s.subjectCode : `Bài: ${s.subjectCode}`)
                            : (s.title || 'Buổi học');

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSlotClick(s)}
                              className="group flex items-center justify-between gap-2 text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-400 hover:text-blue-800 dark:hover:text-blue-400 cursor-pointer transition-colors py-1 px-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                              title="Bấm để xem chi tiết hoặc di chuyển tới vị trí bài học này trên lịch"
                            >
                              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                <span className="hover:underline font-normal group-hover:font-medium leading-snug break-words">
                                  {lessonTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                <span>{formattedDate}</span>
                                {eventLink && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenLink(e, eventLink)}
                                    className="text-slate-400 hover:text-blue-800 dark:hover:text-blue-400 transition-colors ml-0.5 p-0.5"
                                    title="Mở link bài học"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {appMode === 'editor' && onDeleteSlot && (
                                  confirmDeleteKey === s.id ? (
                                    <div 
                                      className="flex items-center gap-1 bg-red-100 dark:bg-red-950/90 px-1.5 py-0.5 rounded-md text-[10px] text-red-600 dark:text-red-300 font-bold animate-in fade-in duration-100 shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span>Xóa bài này?</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteSlot(s.id);
                                          setConfirmDeleteKey(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer font-bold shadow-2xs"
                                      >
                                        Xóa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteKey(null);
                                        }}
                                        className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded cursor-pointer font-medium"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteKey(s.id);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/80 rounded transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                      title="Xóa bài học này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-[12px] text-slate-400 dark:text-slate-500 italic py-1">
                          Chưa có bài học
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Minimal Apple Style Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-[#1d1d1f]/70 backdrop-blur-md flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Tất cả môn học và lịch học được đồng bộ theo thời gian thực</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/60 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
