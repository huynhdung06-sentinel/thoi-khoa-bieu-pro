import React, { useState } from 'react';
import { DayInfo, StudySlot } from '../types';
import { HOURS_LIST, isSameDay, parseTimeToMinutes } from '../utils/dateUtils';
import { ExternalLink, CheckCircle2, BookOpen } from 'lucide-react';

interface WeekViewGridProps {
  days: DayInfo[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  slotsMap: Record<string, StudySlot[]>;
  onSlotClick: (slot: StudySlot | null, dateStr: string, hour: string) => void;
  onOpenStudyLink: (e: React.MouseEvent, url: string) => void;
}

export const WeekViewGrid: React.FC<WeekViewGridProps> = ({
  days,
  selectedDate,
  onSelectDate,
  slotsMap,
  onSlotClick,
  onOpenStudyLink,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Real-time time state
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHourNum = currentTime.getHours();
  const currentMinNum = currentTime.getMinutes();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-[#1E272C] border border-[#E2E8F0] dark:border-[#2C3531] border-t-4 border-t-[var(--light-primary,#C0392B)] dark:border-t-blue-500 rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 my-4">
      <div 
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-auto no-scrollbar relative"
      >
        <div className="min-w-[800px]">
          
          {/* Week Columns Header */}
          <div 
            className="grid sticky top-0 z-20 border-b border-[#E2E8F0] dark:border-[#2C3531] bg-[#F8F9FA] dark:bg-[#121212] text-xs font-semibold select-none transition-all duration-300"
            style={{ gridTemplateColumns: `${isScrolled ? '50px' : '0px'} repeat(7, 1fr)` }}
          >
            {/* Sticky 'Giờ' Column Header */}
            <div 
              className={`sticky left-0 top-0 z-30 py-4 text-center text-[#7F8C8D] dark:text-blue-400 border-r border-[#E2E8F0] dark:border-[#2C3531] bg-[#F8F9FA] dark:bg-[#121212] flex items-center justify-center font-bold text-[10px] uppercase overflow-hidden transition-all duration-300 ${isScrolled ? 'w-[50px] px-2 opacity-100' : 'w-0 px-0 opacity-0'}`}
            >
              Giờ
            </div>

            {/* Day Columns */}
            {days.map((day) => {
              const isSelected = isSameDay(day.date, selectedDate);
              const isToday = day.isToday;
              const daySlots = slotsMap[day.dateString] || [];
              const slotCount = daySlots.length;

              return (
                <div
                  key={day.dateString}
                  onClick={() => onSelectDate(day.date)}
                  className="p-1 sm:p-1.5 border-r border-[#E2E8F0] dark:border-[#2C3531] last:border-r-0 flex items-center justify-center bg-[#F8F9FA] dark:bg-[#121212]"
                >
                  <div
                    className={`w-full min-w-0 flex flex-col items-center py-1 px-1 rounded-lg border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[var(--light-primary,#C0392B)] text-white border-[var(--light-primary,#C0392B)] dark:bg-blue-600 dark:border-blue-600 shadow-sm font-bold scale-[1.01]'
                        : isToday
                        ? 'bg-[var(--light-primary-bg,#C0392B18)] text-[var(--light-primary,#C0392B)] dark:text-blue-400 border-[var(--light-primary-border,#C0392B45)] dark:border-blue-800 hover:opacity-90'
                        : 'bg-white dark:bg-[#1E272C] hover:bg-[#F8F9FA] dark:hover:bg-[#1E272C] text-[#2F3640] dark:text-[#F5F6FA] border-[#E2E8F0] dark:border-[#2C3531]'
                    }`}
                  >
                    {/* Day Name (Thứ 2, Thứ 3...) */}
                    <span className={`text-[7px] sm:text-[8px] font-medium tracking-tight ${isSelected ? 'text-white' : 'text-[#7F8C8D] dark:text-[#A4B0BE]'}`}>
                      {day.dayNameShort}
                    </span>

                    {/* Day Number (1, 2, 3...) */}
                    <span className="text-[10px] sm:text-xs font-bold my-0 leading-tight">
                      {day.dayNumber}
                    </span>

                    {/* Slot Indicator Pills */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {slotCount > 0 ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0 text-[8px] sm:text-[9px] font-bold rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--light-primary-bg,#C0392B18)] dark:bg-blue-900/30 text-[var(--light-primary,#C0392B)] dark:text-blue-300'
                          }`}
                        >
                          <BookOpen className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                          <span>{slotCount}</span>
                        </span>
                      ) : (
                        <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isSelected ? 'bg-white/40' : 'bg-[#E2E8F0] dark:bg-[#2C3531]'}`} />
                      )}
                    </div>

                    {/* Today marker dot if not selected */}
                    {isToday && !isSelected && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--light-primary,#C0392B)] dark:bg-amber-400 ring-1 ring-white dark:ring-[#121212]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hourly Time Slots Body */}
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2C3531]">
            {HOURS_LIST.map((hour) => {
              const hourStartMins = parseTimeToMinutes(hour);
              const hourEndMins = hourStartMins + 60;
              const rowHourNum = parseInt(hour.split(':')[0], 10);
              const isCurrentHourRow = currentHourNum === rowHourNum;
              const linePercentage = (currentMinNum / 60) * 100;

              return (
                <div 
                  key={hour} 
                  id={`hour-row-${hour}`} 
                  className="grid min-h-[60px] group transition-all duration-300 relative"
                  style={{ gridTemplateColumns: `${isScrolled ? '50px' : '0px'} repeat(7, 1fr)` }}
                >
                  {/* Sticky Hour Label */}
                  <div 
                    className={`sticky left-0 z-10 py-2 text-right text-[10px] sm:text-[11px] font-bold text-[#7F8C8D] dark:text-[#A4B0BE] border-r border-[#E2E8F0] dark:border-[#2C3531] bg-[#F8F9FA]/95 dark:bg-[#121212]/95 select-none flex items-center justify-end pr-2 overflow-hidden transition-all duration-300 ${isScrolled ? 'w-[50px] px-2 opacity-100' : 'w-0 px-0 opacity-0'}`}
                  >
                    {hour}
                  </div>

                  {/* 7 Days Cells */}
                  {days.map((day) => {
                    const daySlots = slotsMap[day.dateString] || [];
                    const isToday = day.isToday;
                    const isCurrentHourCell = isToday && isCurrentHourRow;
                    
                    // Filter slots in this hour
                    const hourSlots = daySlots.filter((slot) => {
                      const slotStartMins = parseTimeToMinutes(slot.startTime);
                      return slotStartMins >= hourStartMins && slotStartMins < hourEndMins;
                    });

                    return (
                      <div
                        key={`${day.dateString}-${hour}`}
                        onClick={() => hourSlots.length === 0 && onSlotClick(null, day.dateString, hour)}
                        className={`p-1 border-r border-[#E2E8F0] dark:border-[#2C3531] last:border-r-0 hover:bg-[#F8F9FA] dark:hover:bg-[#121212]/30 transition-colors cursor-pointer relative flex flex-col gap-1 ${isToday ? 'bg-[var(--light-primary-bg,#C0392B10)] dark:bg-blue-900/10' : ''}`}
                      >
                        {/* Real-time Indicator Line in Today's Current Hour Cell */}
                        {isCurrentHourCell && (
                          <div
                            id="current-time-line-week"
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20 flex items-center pointer-events-none"
                            style={{ top: `${linePercentage}%` }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-xs shrink-0" />
                          </div>
                        )}
                        {hourSlots.map((slot) => (
                          <div
                            key={slot.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSlotClick(slot, day.dateString, hour);
                            }}
                            style={{ borderLeftColor: slot.color || 'var(--light-primary,#C0392B)' }}
                            className="bg-white dark:bg-[#121212] hover:bg-[#F8F9FA] dark:hover:bg-[#1E272C] border border-[#E2E8F0] dark:border-[#2C3531] border-l-4 rounded-xl p-2 text-[10px] sm:text-xs shadow-2xs hover:shadow-sm transition-all group/card flex flex-col justify-between w-full relative"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-[#2F3640] dark:text-[#F5F6FA] line-clamp-1 text-[11px] leading-tight">
                                  {slot.subjectName}
                                </div>
                                {slot.subjectCode && (
                                  <div className="text-[9px] font-semibold text-[var(--light-primary,#C0392B)] dark:text-blue-400 line-clamp-1 mt-0.5">
                                    {(slot.subjectCode || '').toLowerCase().startsWith('bài') ? slot.subjectCode : `Bài: ${slot.subjectCode}`}
                                  </div>
                                )}
                              </div>
                              {slot.isCompleted && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                            </div>

                            <div className="text-[9px] text-[#7F8C8D] dark:text-[#A4B0BE] font-mono my-1 leading-none">
                              {slot.startTime} - {slot.endTime}
                            </div>

                            {/* Direct Link Action Button */}
                            {slot.studyLink && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenStudyLink(e, slot.studyLink);
                                }}
                                className="mt-1 flex items-center justify-center gap-0.5 w-full py-0.5 px-1 bg-[var(--light-primary,#C0392B)] hover:opacity-90 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-[8px] sm:text-[9px] font-semibold transition-colors"
                                title={`Mở link bài học: ${slot.studyLink}`}
                              >
                                <span>Vào học</span>
                                <ExternalLink className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
