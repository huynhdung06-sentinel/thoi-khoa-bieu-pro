import React from 'react';
import { DayInfo, StudySlot } from '../types';
import { isSameDay } from '../utils/dateUtils';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface MonthViewGridProps {
  days: DayInfo[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  slotsMap: Record<string, StudySlot[]>;
  onSlotClick: (slot: StudySlot | null, dateStr: string, hour: string) => void;
  onOpenStudyLink: (e: React.MouseEvent, url: string) => void;
}

export const MonthViewGrid: React.FC<MonthViewGridProps> = ({
  days,
  selectedDate,
  onSelectDate,
  slotsMap,
  onSlotClick,
  onOpenStudyLink,
}) => {
  const weekHeaderNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-[#1E272C] border border-[#E2E8F0] dark:border-[#2C3531] border-t-4 border-t-[var(--light-primary,#C0392B)] dark:border-t-blue-600 rounded-xl shadow-md overflow-y-auto no-scrollbar transition-all duration-300 my-4 p-3">
      {/* Month Days Header */}
      <div className="grid grid-cols-7 text-xs font-bold py-2.5 text-center bg-transparent border-b border-[#E2E8F0] dark:border-[#2C3531] mb-2">
        {weekHeaderNames.map((dayName) => (
          <div 
            key={dayName} 
            className={`uppercase tracking-wider ${
              (dayName === 'T7' || dayName === 'CN') 
                ? 'text-[#7F8C8D] dark:text-[#A4B0BE]' 
                : 'text-[#2F3640] dark:text-[#F5F6FA]'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid Cells (5 or 6 weeks) with gorgeous separate cards */}
      <div className="grid grid-cols-7 gap-2 auto-rows-fr">
        {days.map((day) => {
          const isSelected = isSameDay(day.date, selectedDate);
          const daySlots = slotsMap[day.dateString] || [];

          return (
            <div
              key={day.dateString}
              id={day.isToday ? 'month-today-cell' : undefined}
              onClick={() => {
                onSelectDate(day.date);
              }}
              className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between rounded-xl border transition-all cursor-pointer relative ${
                !day.isCurrentMonth
                  ? 'bg-[#F8F9FA]/40 dark:bg-[#121212]/20 border-[#E2E8F0]/40 dark:border-transparent text-[#7F8C8D] opacity-50'
                  : isSelected
                  ? 'bg-[var(--light-primary-bg,#C0392B18)] dark:bg-blue-500/[0.06] border-[var(--light-primary,#C0392B)]/50 dark:border-blue-500/40 shadow-xs font-bold'
                  : day.isToday
                  ? 'bg-[var(--light-primary-bg,#C0392B18)]/50 dark:bg-[#121212] border-[var(--light-primary,#C0392B)]/60 dark:border-blue-800 shadow-2xs'
                  : 'bg-white dark:bg-[#121212] border-[#E2E8F0] dark:border-[#2C3531] hover:border-[#7F8C8D]/40 shadow-3xs hover:shadow-2xs'
              }`}
            >
              {/* Top Date Header */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`min-w-[22px] h-5 px-1 flex items-center justify-center text-[11px] font-bold transition-transform ${
                    day.isToday
                      ? 'bg-[var(--light-primary,#C0392B)] text-white rounded-md shadow-xs'
                      : isSelected
                      ? 'bg-[#E2E8F0] dark:bg-blue-900/60 text-[#2F3640] dark:text-blue-300 rounded-md font-extrabold'
                      : (day.dayNameShort === 'T7' || day.dayNameShort === 'CN')
                      ? 'text-[#7F8C8D] dark:text-[#A4B0BE]'
                      : 'text-[#2F3640] dark:text-[#F5F6FA]'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {daySlots.length > 0 && (
                  <span className="text-[9px] font-bold text-[var(--light-primary,#C0392B)] dark:text-blue-400 bg-[var(--light-primary-bg,#C0392B18)] dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-[var(--light-primary-border,#C0392B45)] dark:border-blue-950/50 shrink-0">
                    {daySlots.length} môn
                  </span>
                )}
              </div>

              {/* Day Study Slots List */}
              <div className="mt-1 flex-1 space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(slot, day.dateString, slot.startTime);
                    }}
                    style={{ borderLeftColor: slot.color || 'var(--light-primary, #C0392B)' }}
                    className="p-1 rounded-lg bg-[#F8F9FA] dark:bg-[#1E272C] hover:bg-[#E2E8F0]/50 dark:hover:bg-[#2C3531] border border-[#E2E8F0] dark:border-[#2C3531] border-l-2.5 text-[10px] sm:text-[11px] shadow-3xs transition-all group cursor-pointer flex items-center justify-between gap-1"
                  >
                    <div className="truncate flex-1 min-w-0">
                      <div className="font-bold text-[#1d1d1f] dark:text-slate-200 truncate flex items-center gap-0.5">
                        {slot.isCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                        <span className="truncate">{slot.subjectName}</span>
                      </div>
                      {slot.subjectCode && (
                        <div className="text-[9px] font-semibold text-[#86868b] dark:text-slate-400 truncate">
                          {(slot.subjectCode || '').toLowerCase().startsWith('bài') ? slot.subjectCode : `Bài: ${slot.subjectCode}`}
                        </div>
                      )}
                      <div className="text-[8.5px] font-mono text-[#86868b] dark:text-slate-500">
                        {slot.startTime}
                      </div>
                    </div>

                    <button
                      onClick={(e) => onOpenStudyLink(e, slot.studyLink)}
                      className="p-0.5 text-[var(--light-primary,#BC0024)] dark:text-blue-400 hover:bg-[var(--light-primary-bg,#BC002418)] dark:hover:bg-blue-900/40 rounded shrink-0 transition-colors"
                      title="🚀 Đến trang học bài"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Empty placeholder hint (Subtle small dot at center bottom when empty) */}
              {daySlots.length === 0 && day.isCurrentMonth && (
                <div className="flex justify-center items-center py-1.5 mt-auto">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#ff3b30] dark:bg-blue-600' : 'bg-[#c7c7cc] dark:bg-[#2a2e39]'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
