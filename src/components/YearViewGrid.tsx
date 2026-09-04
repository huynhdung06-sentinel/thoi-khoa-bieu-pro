import React from 'react';
import { StudySlot } from '../types';
import { BookOpen, ChevronRight } from 'lucide-react';

interface YearViewGridProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  slots: StudySlot[];
  onSwitchToMonth: () => void;
}

export const YearViewGrid: React.FC<YearViewGridProps> = ({
  currentDate,
  onSelectDate,
  slots,
  onSwitchToMonth,
}) => {
  const year = currentDate.getFullYear();
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-[#161925] border border-[#d2d2d7] dark:border-[#2a2e39] border-t-4 border-t-[#0066cc] dark:border-t-blue-600 rounded-xl shadow-md p-4 sm:p-6 my-4 overflow-y-auto no-scrollbar transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2">
          <span>Tổng Quan Lịch Học Năm {year}</span>
        </h2>
        <span className="text-xs text-[#86868b] dark:text-slate-400">
          Tổng số: {slots.length} buổi học trong hệ thống
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((monthName, monthIndex) => {
          // Count slots in this month
          const monthSlots = slots.filter((slot) => {
            const [sYear, sMonth] = slot.date.split('-').map(Number);
            return sYear === year && sMonth === monthIndex + 1;
          });

          const isCurrentMonth = new Date().getFullYear() === year && new Date().getMonth() === monthIndex;

          return (
            <div
              key={monthName}
              onClick={() => {
                const targetDate = new Date(year, monthIndex, 1);
                onSelectDate(targetDate);
                onSwitchToMonth();
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${
                isCurrentMonth
                  ? 'bg-[#f2f7fc] dark:bg-blue-950/30 border-[#b8daf5] dark:border-blue-700'
                  : 'bg-[#f5f5f7] dark:bg-[#2a2e39]/50 border-[#e8e8ed] dark:border-[#363a45] hover:bg-white dark:hover:bg-[#2a2e39]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-[#1d1d1f] dark:text-white">
                  {monthName}
                </span>
                {isCurrentMonth && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066cc] dark:text-blue-400 bg-[#f2f7fc] dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                    Hiện tại
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e8e8ed] dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-[#515154] dark:text-slate-300">
                  <BookOpen className="w-3.5 h-3.5 text-[#0066cc] dark:text-blue-500" />
                  <span className="font-semibold">{monthSlots.length} buổi học</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86868b]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
