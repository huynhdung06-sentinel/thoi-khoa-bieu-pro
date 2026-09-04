import React, { useState } from 'react';
import { PeriodInfo, TimetableSlot, LessonPlan, StudyRecord, UserRole, DocumentItem, Subject } from '../types';
import { STANDARD_PERIODS, SUBJECTS_LIST } from '../data/mockData';
import { getVietnamCurrentMondayStr, getVietnamTimeParts } from '../utils/dateUtils';
import { Clock, Edit3, Eye, Share2, Loader2 } from 'lucide-react';

interface VietnameseTimetableGridProps {
  periods?: PeriodInfo[];
  timetableSlots: TimetableSlot[];
  lessonPlans: LessonPlan[];
  studyRecords: StudyRecord[];
  documents?: DocumentItem[];
  subjects?: Subject[];
  currentRole: UserRole;
  weekStartDate: string;
  onSlotClick: (
    slot: TimetableSlot,
    plan?: LessonPlan,
    record?: StudyRecord,
    dateStr?: string
  ) => void;
  onEditSlotAdmin?: (slot: TimetableSlot, updatedData: Partial<TimetableSlot> | null) => void;
  onViewSubjectDocuments?: (subjectName: string) => void;
  onOpenEditPeriods?: () => void;
  onShareReport?: () => void;
  isCapturing?: boolean;
}

export const VietnameseTimetableGrid: React.FC<VietnameseTimetableGridProps> = ({
  periods = STANDARD_PERIODS,
  timetableSlots,
  lessonPlans,
  studyRecords,
  subjects = [],
  currentRole,
  weekStartDate,
  onSlotClick,
  onEditSlotAdmin,
  onOpenEditPeriods,
  onShareReport,
  isCapturing,
}) => {
  // Mode switch: 'viewer' (Chế độ xem) vs 'editor' (Chế độ chỉnh sửa)
  const [timetableMode, setTimetableMode] = useState<'viewer' | 'editor'>('viewer');

  const DAYS_OF_WEEK = [2, 3, 4, 5, 6, 7];

  const DAY_NAMES: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
  };

  // Calculate calendar date for each day of week based on weekStartDate
  const getDayDateInfo = (dayNum: number) => {
    try {
      const rawDateStr = weekStartDate || getVietnamCurrentMondayStr();
      const [y, m, d] = rawDateStr.split('-').map(Number);
      const inputDate = new Date(y, m - 1, d);
      
      const day = inputDate.getDay();
      const diffToMonday = inputDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(y, m - 1, diffToMonday);

      const offset = dayNum - 2;
      const target = new Date(monday);
      target.setDate(monday.getDate() + offset);

      const todayParts = getVietnamTimeParts();
      const targetYear = target.getFullYear();
      const targetMonth = target.getMonth() + 1;
      const targetDay = target.getDate();

      const isToday = 
        targetDay === todayParts.day &&
        targetMonth === todayParts.month &&
        targetYear === todayParts.year;

      const dayStr = String(targetDay).padStart(2, '0');
      const monthStr = String(targetMonth).padStart(2, '0');

      return {
        dateStr: `${targetYear}-${monthStr}-${dayStr}`,
        displayDate: `${dayStr}/${monthStr}`,
        dayName: DAY_NAMES[dayNum] || `Thứ ${dayNum}`,
        isToday,
      };
    } catch {
      const nowParts = getVietnamTimeParts();
      return { 
        dateStr: '', 
        displayDate: '', 
        dayName: DAY_NAMES[dayNum] || `Thứ ${dayNum}`, 
        isToday: dayNum === nowParts.dayOfWeek 
      };
    }
  };

  const morningPeriods = periods.filter((p) => p.session === 'morning');
  const afternoonPeriods = periods.filter((p) => p.session === 'afternoon');

  const getCellData = (dayOfWeek: number, session: 'morning' | 'afternoon', period: number) => {
    const slot = timetableSlots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.session === session && s.period === period
    );

    const { dateStr } = getDayDateInfo(dayOfWeek);
    const todayParts = getVietnamTimeParts();
    const todayStr = todayParts.dateStr;
    const isFuture = dateStr > todayStr;

    const plan = lessonPlans.find(
      (p) => p.date === dateStr && p.session === session && p.period === period
    ) || (slot ? lessonPlans.find((p) => p.dayOfWeek === dayOfWeek && p.session === session && p.period === period) : undefined);

    const record = isFuture
      ? undefined
      : studyRecords.find(
          (r) =>
            r.status === 'COMPLETED' &&
            r.showOnTimetable === true &&
            (
              (plan && r.lessonPlanId === plan.id) ||
              (r.date === dateStr && r.session === session && r.period === period) ||
              (slot && r.dayOfWeek === dayOfWeek && r.session === session && r.period === period)
            )
        );

    return { slot, plan, record };
  };

  // Determine effective editor mode
  const isEditor = timetableMode === 'editor';

  // Render an individual cell
  const renderCell = (dayOfWeek: number, session: 'morning' | 'afternoon', period: number) => {
    const { slot, plan, record } = getCellData(dayOfWeek, session, period);
    const { isToday, dateStr } = getDayDateInfo(dayOfWeek);
    const subjectText = (slot?.subjectName || '').trim();
    const hasSubject = Boolean(subjectText && subjectText !== '—' && subjectText !== 'Trống');
    const isCompleted = record?.status === 'COMPLETED';
    const isRevision = record?.status === 'NEEDS_REVISION';

    const subjectList = subjects.length > 0 ? subjects : SUBJECTS_LIST;

    if (isEditor) {
      return (
        <td
          key={`cell-${dayOfWeek}-${session}-${period}`}
          className={`p-1 transition-all text-center relative h-[66px] align-middle border border-slate-200 dark:border-slate-700/60 ${
            isToday ? 'border-x-2 border-blue-500 dark:border-blue-500' : ''
          } bg-white dark:bg-[#161922]`}
        >
          <div className="w-full h-full flex items-center justify-center">
            <select
              value={subjectText}
              onChange={(e) => {
                const val = e.target.value;
                if (onEditSlotAdmin) {
                  const targetSlot = slot || {
                    id: `slot-${dayOfWeek}-${session}-${period}`,
                    dayOfWeek,
                    session,
                    period,
                    subjectName: '',
                    teacher: '',
                    room: '',
                  };
                  if (!val) {
                    onEditSlotAdmin(targetSlot, null);
                  } else {
                    onEditSlotAdmin(targetSlot, { subjectName: val });
                  }
                }
              }}
              className={`w-full bg-transparent text-center font-medium text-[13.5px] sm:text-[14px] outline-none border-none cursor-pointer text-slate-900 dark:text-slate-100 py-2 rounded-md antialiased ${
                subjectText === 'Chào cờ'
                  ? 'text-red-600 dark:text-red-400 font-bold'
                  : subjectText === 'SHL'
                  ? 'text-blue-700 dark:text-blue-400 font-bold'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              <option value="">— Trống —</option>
              {subjectList.map((subj) => (
                <option key={subj.id || subj.name} value={subj.name}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>
        </td>
      );
    }

    return (
      <td
        key={`cell-${dayOfWeek}-${session}-${period}`}
        onClick={() => {
          if (hasSubject && slot) {
            onSlotClick(slot, plan, record, dateStr);
          }
        }}
        className={`p-1.5 sm:p-2.5 text-center relative select-none h-[66px] align-middle ${
          isToday
            ? 'border-x-2 border-blue-500 dark:border-blue-500 border-y border-slate-200 dark:border-slate-700'
            : 'border border-slate-200 dark:border-slate-700/60'
        } ${
          hasSubject
            ? record
              ? isToday
                ? 'bg-emerald-100/90 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/70 cursor-pointer transition-colors'
                : 'bg-emerald-50/80 hover:bg-emerald-200/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/60 cursor-pointer transition-colors'
              : isToday
              ? 'bg-blue-50/90 hover:bg-sky-200 dark:bg-blue-950/40 dark:hover:bg-sky-900/70 cursor-pointer transition-colors'
              : 'bg-white hover:bg-sky-100 dark:bg-[#161922] dark:hover:bg-sky-950/70 cursor-pointer transition-colors'
            : isToday
            ? 'bg-blue-50/25 dark:bg-blue-950/10 cursor-default opacity-80'
            : 'bg-slate-50/50 dark:bg-[#131720] cursor-default opacity-75'
        }`}
      >
        {hasSubject ? (
          <div className="flex flex-col justify-center items-center h-full gap-1 max-w-full overflow-hidden px-0.5">
            <span
              className={`text-[13.5px] sm:text-[14px] md:text-[14.5px] tracking-normal leading-snug truncate max-w-full antialiased ${
                slot?.subjectName === 'Chào cờ'
                  ? 'text-red-600 dark:text-red-400 font-bold'
                  : slot?.subjectName === 'SHL'
                  ? 'text-blue-700 dark:text-blue-400 font-bold'
                  : record
                  ? 'text-emerald-900 dark:text-emerald-200 font-medium'
                  : isToday
                  ? 'text-blue-950 dark:text-blue-100 font-semibold'
                  : 'text-slate-900 dark:text-slate-100 font-medium'
              }`}
              title={subjectText}
            >
              {subjectText}
            </span>
            {record && record.lessonTitle ? (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate max-w-full px-1.5 py-0.5 bg-emerald-50/95 dark:bg-emerald-950/70 rounded border border-emerald-300 dark:border-emerald-700/80 flex items-center gap-1 shadow-2xs" title={`Đã học: ${record.lessonTitle}`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span className="truncate">{record.lessonTitle}</span>
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-300 dark:text-slate-600 text-[13px] font-light select-none">—</span>
        )}
      </td>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Nút chuyển đổi qua lại chế độ Viewer và Editor trên tab Thời khóa biểu */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161922] p-2.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Chế độ hiển thị:</span>
          <span className={`px-2 py-0.5 rounded-md font-extrabold ${
            isEditor 
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
          }`}>
            {isEditor ? 'Chỉnh sửa (Editor)' : 'Chỉ xem (Viewer)'}
          </span>
        </div>

        {/* Nút Gửi báo cáo cho Ba Mẹ & Nút chuyển đổi Toggle Viewer / Editor */}
        <div className="flex items-center gap-2.5">
          {onShareReport && (
            <button
              type="button"
              onClick={onShareReport}
              disabled={isCapturing}
              className={`flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md cursor-pointer shrink-0 ${isCapturing ? 'opacity-70 cursor-wait' : ''}`}
              title="Chụp ảnh thời khóa biểu và gửi báo cáo cho Ba Mẹ qua Zalo, Messenger, Gmail..."
            >
              {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span>{isCapturing ? 'Đang tạo ảnh...' : 'Gửi báo cáo cho Ba Mẹ'}</span>
            </button>
          )}

          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTimetableMode('viewer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                !isEditor
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Chuyển sang chế độ chỉ xem: hiển thị thời khóa biểu rõ ràng, chống vô tình chỉnh sửa"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Viewer (Xem)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimetableMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isEditor
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title="Chuyển sang chế độ chỉnh sửa: cho phép thay đổi môn học, xếp lịch và sửa giờ"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor (Chỉnh sửa)</span>
            </button>
          </div>
        </div>
      </div>

      <div id="timetable-container" className="w-full rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-md bg-white dark:bg-[#161922] overflow-x-auto transition-colors">
        {isEditor && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border-b border-blue-200 dark:border-blue-800/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px] min-w-[620px] md:min-w-full">
          <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-semibold">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <span>Chế độ chỉnh sửa: Cho phép cấu hình môn học trực tiếp từng ô & sửa khung giờ học</span>
          </div>

          {onOpenEditPeriods && (
            <button
              type="button"
              onClick={onOpenEditPeriods}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-extrabold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sửa Khung Giờ Học</span>
            </button>
          )}
        </div>
      )}

      <table className="table-fixed w-full min-w-[620px] md:min-w-full border-collapse text-slate-800 dark:text-slate-200">
        <colgroup>
          <col className="w-[11%] min-w-[72px]" />
          <col className="w-[6%] min-w-[36px]" />
          <col className="w-[13.8%]" />
          <col className="w-[13.8%]" />
          <col className="w-[13.8%]" />
          <col className="w-[13.8%]" />
          <col className="w-[13.8%]" />
          <col className="w-[13.8%]" />
        </colgroup>

        <thead>
          <tr className="bg-slate-200/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700 font-bold">
            {/* Header: Cột Giờ Học */}
            <th className="border border-slate-300 dark:border-slate-700 px-1.5 py-2.5 text-center tracking-tight text-xs sm:text-[13px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="font-extrabold text-slate-900 dark:text-slate-100">Giờ học</span>
                {isEditor && onOpenEditPeriods && (
                  <button
                    type="button"
                    onClick={onOpenEditPeriods}
                    className="text-[11px] text-blue-700 dark:text-blue-400 hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer underline"
                    title="Nhấp để thay đổi khung giờ học từng tiết"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Sửa giờ</span>
                  </button>
                )}
              </div>
            </th>

            {/* Header: Cột Tiết */}
            <th className="border border-slate-300 dark:border-slate-700 px-1 py-2.5 text-center tracking-wide text-xs sm:text-[13px] bg-slate-200 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-center gap-1">
                <span>Tiết</span>
                {isEditor && onOpenEditPeriods && (
                  <button
                    type="button"
                    onClick={onOpenEditPeriods}
                    className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                    title="Thêm / Sửa / Xóa tiết học"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </th>

            {/* Header: Các cột Thứ trong tuần */}
            {DAYS_OF_WEEK.map((dayNum) => {
              const { displayDate, dayName, isToday } = getDayDateInfo(dayNum);
              return (
                <th
                  key={`th-day-${dayNum}`}
                  className={`px-1.5 py-2.5 text-center transition-colors ${
                    isToday
                      ? 'bg-blue-600 dark:bg-blue-600 text-white border-x-2 border-blue-600 border-b-2 border-blue-700 shadow-sm'
                      : 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-[13px] sm:text-[14.5px] ${isToday ? 'font-black text-white' : 'font-extrabold text-slate-900 dark:text-slate-100'}`}>
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 bg-amber-300 text-blue-950 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase leading-none shadow-xs">
                          ⭐ Hôm nay
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] sm:text-[12px] mt-0.5 ${isToday ? 'text-blue-100 font-bold' : 'text-slate-600 dark:text-slate-400 font-semibold'}`}>
                      {displayDate}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* ================= MORNING SECTION (SÁNG) ================= */}
          {morningPeriods.map((periodInfo) => (
            <tr key={`morning-row-${periodInfo.period}`} className="bg-sky-50/20 dark:bg-sky-950/10">
              <td className="border border-slate-300 dark:border-slate-700/80 px-1 py-1.5 text-center bg-slate-100/80 dark:bg-slate-800/60 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-300 font-bold">
                <div className="whitespace-nowrap tracking-tight">
                  {periodInfo.startTime} - {periodInfo.endTime}
                </div>
              </td>
              <td 
                className="border border-slate-300 dark:border-slate-700/80 px-1 py-1.5 text-center font-extrabold text-[13px] sm:text-[14px] text-sky-950 dark:text-sky-200 bg-sky-100/80 dark:bg-sky-900/50 group relative cursor-pointer"
                onClick={() => {
                  if ((currentRole === 'admin' || currentRole === 'parent') && onOpenEditPeriods) {
                    onOpenEditPeriods();
                  }
                }}
                title={currentRole === 'admin' || currentRole === 'parent' ? "Nhấn để Sửa / Xóa / Thêm tiết học" : undefined}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{periodInfo.period}</span>
                  {(currentRole === 'admin' || currentRole === 'parent') && onOpenEditPeriods && (
                    <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-sky-700 dark:text-sky-300 transition-opacity" />
                  )}
                </div>
              </td>
              {DAYS_OF_WEEK.map((dayNum) => renderCell(dayNum, 'morning', periodInfo.period))}
            </tr>
          ))}

          {/* ================= DIVIDER SÁNG / CHIỀU ================= */}
          <tr className="bg-slate-200 dark:bg-slate-800 border-y-2 border-slate-300 dark:border-slate-700 h-3">
            <td colSpan={8} className="p-0"></td>
          </tr>

          {/* ================= AFTERNOON SECTION (CHIỀU) ================= */}
          {afternoonPeriods.map((periodInfo) => (
            <tr key={`afternoon-row-${periodInfo.period}`} className="bg-amber-50/20 dark:bg-amber-950/10">
              <td className="border border-slate-300 dark:border-slate-700/80 px-1 py-1.5 text-center bg-slate-100/80 dark:bg-slate-800/60 text-[10.5px] sm:text-[11.5px] text-slate-700 dark:text-slate-300 font-bold">
                <div className="whitespace-nowrap tracking-tight">
                  {periodInfo.startTime} - {periodInfo.endTime}
                </div>
              </td>
              <td 
                className="border border-slate-300 dark:border-slate-700/80 px-1 py-1.5 text-center font-extrabold text-[13px] sm:text-[14px] text-amber-950 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/50 group relative cursor-pointer"
                onClick={() => {
                  if ((currentRole === 'admin' || currentRole === 'parent') && onOpenEditPeriods) {
                    onOpenEditPeriods();
                  }
                }}
                title={currentRole === 'admin' || currentRole === 'parent' ? "Nhấn để Sửa / Xóa / Thêm tiết học" : undefined}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>{periodInfo.period}</span>
                  {(currentRole === 'admin' || currentRole === 'parent') && onOpenEditPeriods && (
                    <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-800 dark:text-amber-300 transition-opacity" />
                  )}
                </div>
              </td>
              {DAYS_OF_WEEK.map((dayNum) => renderCell(dayNum, 'afternoon', periodInfo.period))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      {currentRole === 'student' && (
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/30 font-medium text-[11px] sm:text-[12px]">
            <span>💡</span>
            <span>Học sinh muốn thay đổi thời khóa biểu ➔ Hãy chuyển qua chế độ Editor (Chỉnh Sửa) nhé.</span>
          </div>
        </div>
      )}
    </div>
  );
};
