import React from 'react';
import { DayInfo, StudySlot } from '../types';
import { isSameDay } from '../utils/dateUtils';
import { BookOpen } from 'lucide-react';

interface FilmstripDatePickerProps {
  days: DayInfo[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  slotsMap: Record<string, StudySlot[]>;
}

export const FilmstripDatePicker: React.FC<FilmstripDatePickerProps> = ({
  days,
  selectedDate,
  onSelectDate,
  slotsMap,
}) => {
  const isSevenDays = days.length <= 7;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1E272C] border-b border-[#E2E8F0] dark:border-[#2C3531] py-0.5 px-3 sm:px-6 transition-colors duration-300 shadow-2xs">
      <div className={`max-w-7xl mx-auto ${isSevenDays ? 'grid grid-cols-7 gap-1 sm:gap-2' : 'flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-0'}`}>
        {days.map((day) => {
          const isSelected = isSameDay(day.date, selectedDate);
          const daySlots = slotsMap[day.dateString] || [];
          const slotCount = daySlots.length;

          return (
            <button
              key={day.dateString}
              id={day.isToday ? 'filmstrip-today-button' : undefined}
              onClick={() => onSelectDate(day.date)}
              className={`min-w-0 flex flex-col items-center py-0.5 px-0.5 rounded-lg border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[var(--light-primary,#C0392B)] text-white border-[var(--light-primary,#C0392B)] dark:bg-blue-600 dark:border-blue-600 shadow-sm font-bold scale-[1.01]'
                  : day.isToday
                  ? 'bg-[var(--light-primary-bg,#C0392B18)] text-[var(--light-primary,#C0392B)] dark:text-blue-400 border-[var(--light-primary-border,#C0392B45)] dark:border-blue-800 hover:opacity-90'
                  : 'bg-white dark:bg-[#121212]/50 hover:bg-[#F8F9FA] dark:hover:bg-[#1E272C] text-[#2F3640] dark:text-[#F5F6FA] border-[#E2E8F0] dark:border-[#2C3531]'
              }`}
            >
              {/* Day Name (Thứ 2, Thứ 3...) */}
              <span className={`text-[7px] sm:text-[8px] font-medium tracking-tight ${
                isSelected 
                  ? 'text-white/90' 
                  : day.isToday 
                  ? 'text-[var(--light-primary,#BC0024)] dark:text-blue-400 font-bold' 
                  : (day.dayNameShort === 'T7' || day.dayNameShort === 'CN') 
                  ? 'text-[#8e8e93] dark:text-slate-400' 
                  : 'text-[#1c1c1e] dark:text-slate-300'
              }`}>
                {day.dayNameShort}
              </span>

              {/* Day Number (1, 2, 3...) */}
              <span className={`text-[10px] sm:text-xs font-bold my-0 ${
                isSelected 
                  ? 'text-white' 
                  : day.isToday 
                  ? 'text-[var(--light-primary,#BC0024)] dark:text-blue-400' 
                  : 'text-[#1c1c1e] dark:text-slate-200'
              }`}>
                {day.dayNumber}
              </span>

              {/* Slot Indicator Pills */}
              <div className="flex items-center gap-1 mt-0">
                {slotCount > 0 ? (
                  <span
                    className={`inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0 text-[8px] sm:text-[9px] font-bold rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--light-primary-bg,#BC002418)] dark:bg-blue-900/30 text-[var(--light-primary,#BC0024)] dark:text-blue-300'
                    }`}
                  >
                    <BookOpen className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                    <span>{slotCount}</span>
                  </span>
                ) : (
                  <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-[var(--light-primary,#BC0024)] dark:bg-slate-600'}`} />
                )}
              </div>

              {/* Today marker dot if not selected */}
              {day.isToday && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--light-primary,#BC0024)] dark:bg-amber-400 ring-1 ring-white dark:ring-[#1e222d]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
