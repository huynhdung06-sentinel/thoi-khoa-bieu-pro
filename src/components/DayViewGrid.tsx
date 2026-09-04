import React from 'react';
import { StudySlot } from '../types';
import { HOURS_LIST, formatDateToYYYYMMDD, parseTimeToMinutes } from '../utils/dateUtils';
import { ExternalLink, MapPin, User, Clock, CheckCircle2, Plus } from 'lucide-react';

interface DayViewGridProps {
  selectedDate: Date;
  slots: StudySlot[];
  onSlotClick: (slot: StudySlot | null, hour: string) => void;
  onOpenStudyLink: (e: React.MouseEvent, url: string) => void;
  appMode?: 'viewer' | 'editor';
}

export const DayViewGrid: React.FC<DayViewGridProps> = ({
  selectedDate,
  slots,
  onSlotClick,
  onOpenStudyLink,
  appMode = 'editor',
}) => {
  const isToday = formatDateToYYYYMMDD(selectedDate) === formatDateToYYYYMMDD(new Date());

  // Real-time date/time state, auto-updating every 30s
  const [currentTime, setCurrentTime] = React.useState<Date>(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current hour row if Today on mount
  React.useEffect(() => {
    if (isToday) {
      const h = new Date().getHours();
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      const el = document.getElementById(`hour-row-${hourStr}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isToday, selectedDate]);

  const currentHourNum = currentTime.getHours();
  const currentMinNum = currentTime.getMinutes();

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-[#1E272C] border border-[#E2E8F0] dark:border-[#2C3531] border-t-4 border-t-[var(--light-primary,#C0392B)] dark:border-t-blue-600 rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 my-4">
      
      {/* Grid Header */}
      <div className="bg-[#F8F9FA] dark:bg-[#121212] border-b border-[#E2E8F0] dark:border-[#2C3531] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#7F8C8D] dark:text-blue-400" />
          <h2 className="text-sm font-bold text-[#2F3640] dark:text-[#F5F6FA] uppercase tracking-wider">
            Khung Giờ Học Tập Ngày {selectedDate.getDate()} Thg {selectedDate.getMonth() + 1}
          </h2>
        </div>
        <span className="text-xs text-[#7F8C8D] dark:text-[#A4B0BE]">
          Click ô giờ để xem/thêm link môn học
        </span>
      </div>

      {/* Hourly Timeline Container */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative divide-y divide-[#E2E8F0] dark:divide-[#2C3531]">

        {HOURS_LIST.map((hour) => {
          const hourStartMins = parseTimeToMinutes(hour);
          const hourEndMins = hourStartMins + 60;
          const rowHourNum = parseInt(hour.split(':')[0], 10);
          const isCurrentHourRow = isToday && currentHourNum === rowHourNum;
          const linePercentage = (currentMinNum / 60) * 100;

          // Find slots starting or spanning this hour
          const hourSlots = slots.filter((slot) => {
            const slotStartMins = parseTimeToMinutes(slot.startTime);
            return slotStartMins >= hourStartMins && slotStartMins < hourEndMins;
          });

          return (
            <div key={hour} id={`hour-row-${hour}`} className="group flex min-h-[72px] hover:bg-[#F8F9FA]/70 dark:hover:bg-[#121212]/30 transition-colors relative">
              
              {/* Real-time Indicator Line inside current hour row */}
              {isCurrentHourRow && (
                <div
                  id="current-time-line"
                  className="absolute left-16 sm:left-20 right-0 border-t-2 border-red-500 z-20 flex items-center pointer-events-none"
                  style={{ top: `${linePercentage}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-sm shrink-0" />
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-md ml-1 shadow-xs whitespace-nowrap">
                    Hiện tại {currentHourNum}:{String(currentMinNum).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Hour Label Column */}
              <div className="w-16 sm:w-20 py-2.5 px-2 sm:px-3 text-right text-xs font-semibold text-[#7F8C8D] dark:text-[#A4B0BE] border-r border-[#E2E8F0] dark:border-[#2C3531] shrink-0 select-none">
                {hour}
              </div>

              {/* Slot Content Area */}
              <div 
                onClick={() => hourSlots.length === 0 && onSlotClick(null, hour)}
                className="flex-1 p-2 flex flex-col justify-center relative cursor-pointer group-hover:bg-[#F8F9FA]/40 dark:group-hover:bg-blue-950/10 transition-colors"
              >
                {hourSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                    {hourSlots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(slot, hour);
                        }}
                        style={{ borderLeftColor: slot.color || 'var(--light-primary, #C0392B)' }}
                        className="bg-white dark:bg-[#121212] hover:bg-[#F8F9FA] dark:hover:bg-[#1E272C] border border-[#E2E8F0] dark:border-[#2C3531] border-l-4 rounded-xl p-3 shadow-xs hover:shadow-md transition-all group/card cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          {/* Subject Header & Badges */}
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#2F3640] dark:text-[#F5F6FA] line-clamp-1 group-hover/card:text-[var(--light-primary,#C0392B)] dark:group-hover/card:text-blue-400 transition-colors">
                                {slot.subjectName}
                              </div>
                              {slot.subjectCode && (
                                <div className="text-[11px] font-semibold text-[var(--light-primary,#C0392B)] dark:text-blue-400 line-clamp-1 mt-0.5">
                                  {(slot.subjectCode || '').toLowerCase().startsWith('bài') ? slot.subjectCode : `Bài: ${slot.subjectCode}`}
                                </div>
                              )}
                            </div>
                            {slot.isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-lg border border-emerald-500/30 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Đã học
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-[#F8F9FA] dark:bg-[#1E272C] text-[#7F8C8D] dark:text-[#A4B0BE] rounded-md shrink-0 border border-[#E2E8F0] dark:border-[#2C3531]">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            )}
                          </div>

                          {/* Code, Teacher, Room */}
                          <div className="space-y-1 text-xs text-[#7F8C8D] dark:text-[#A4B0BE] mb-2.5">
                            {slot.teacher && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="truncate">{slot.teacher}</span>
                              </div>
                            )}
                            {slot.room && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{slot.room}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Study Link Button */}
                        <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#2C3531] flex items-center justify-end">
                          <button
                            onClick={(e) => onOpenStudyLink(e, slot.studyLink)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[var(--light-primary,#C0392B)] hover:opacity-90 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-all shadow-2xs cursor-pointer"
                            title={`Mở link: ${slot.studyLink}`}
                          >
                            <span>Link bài học</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="hidden group-hover:flex items-center gap-1 text-xs text-[#7F8C8D] dark:text-[#A4B0BE] font-medium">
                    {appMode === 'editor' ? (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[var(--light-primary,#C0392B)] dark:text-blue-400" />
                        <span>Click để thêm môn học vào khung giờ {hour}</span>
                      </>
                    ) : (
                      <span>Khung giờ trống ({hour})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
