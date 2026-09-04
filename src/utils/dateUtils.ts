import { DayInfo } from '../types';

export const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const VIETNAMESE_DAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * Returns accurate Vietnam (UTC+7 / Asia/Ho_Chi_Minh) date and time breakdown.
 */
export function getVietnamTimeParts(baseDate: Date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short'
    });
    const parts = formatter.formatToParts(baseDate);
    const dateObj: Record<string, string> = {};
    parts.forEach(p => { dateObj[p.type] = p.value; });

    const year = Number(dateObj.year);
    const month = Number(dateObj.month);
    const day = Number(dateObj.day);
    let hours = Number(dateObj.hour || 0);
    if (hours === 24) hours = 0;
    const minutes = Number(dateObj.minute || 0);
    const seconds = Number(dateObj.second || 0);

    const wd = dateObj.weekday;
    let rawDay = 1;
    if (wd === 'Sun') rawDay = 0;
    else if (wd === 'Mon') rawDay = 1;
    else if (wd === 'Tue') rawDay = 2;
    else if (wd === 'Wed') rawDay = 3;
    else if (wd === 'Thu') rawDay = 4;
    else if (wd === 'Fri') rawDay = 5;
    else if (wd === 'Sat') rawDay = 6;

    const dayOfWeek = rawDay === 0 ? 8 : rawDay + 1; // 2=T2, ..., 7=T7, 8=CN
    const dayName = rawDay === 0 ? 'Chủ Nhật' : `Thứ ${rawDay + 1}`;
    const dayNameShort = rawDay === 0 ? 'CN' : `T${rawDay + 1}`;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const displayDate = `${dayName}, ngày ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      dayOfWeek,
      rawDayOfWeek: rawDay,
      dayName,
      dayNameShort,
      dateStr,
      timeStr,
      displayDate,
      formattedTime: timeStr
    };
  } catch {
    const utc = baseDate.getTime() + baseDate.getTimezoneOffset() * 60000;
    const vnDate = new Date(utc + 3600000 * 7);
    const year = vnDate.getFullYear();
    const month = vnDate.getMonth() + 1;
    const day = vnDate.getDate();
    const hours = vnDate.getHours();
    const minutes = vnDate.getMinutes();
    const seconds = vnDate.getSeconds();
    const rawDay = vnDate.getDay();
    const dayOfWeek = rawDay === 0 ? 8 : rawDay + 1;
    const dayName = rawDay === 0 ? 'Chủ Nhật' : `Thứ ${rawDay + 1}`;
    const dayNameShort = rawDay === 0 ? 'CN' : `T${rawDay + 1}`;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const displayDate = `${dayName}, ngày ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      dayOfWeek,
      rawDayOfWeek: rawDay,
      dayName,
      dayNameShort,
      dateStr,
      timeStr,
      displayDate,
      formattedTime: timeStr
    };
  }
}

export function getVietnamCurrentMondayStr(): string {
  const parts = getVietnamTimeParts();
  const rawDay = parts.rawDayOfWeek;
  const diff = parts.day - rawDay + (rawDay === 0 ? -6 : 1);
  const monday = new Date(parts.year, parts.month - 1, diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getVietnamTodayString(): string {
  const parts = getVietnamTimeParts();
  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = String(parts.month).padStart(2, '0');
  const wdVi = parts.rawDayOfWeek === 0 ? 'chủ nhật' : `thứ ${parts.rawDayOfWeek + 1}`;
  return `Hôm nay ${dayStr}/${monthStr} -- ${wdVi}`;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYYYYMMDD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as 1st day of week in Vietnam
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getWeekDays(currentDate: Date): DayInfo[] {
  const startOfWeek = getStartOfWeek(currentDate);
  const today = new Date();
  const days: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateString = formatDateToYYYYMMDD(d);
    const dayIdx = d.getDay();

    days.push({
      date: d,
      dateString,
      dayOfWeek: VIETNAMESE_DAYS_SHORT[dayIdx],
      dayNameShort: dayIdx === 0 ? 'CN' : `Th ${dayIdx + 1}`,
      dayNameFull: VIETNAMESE_DAYS[dayIdx],
      dayNumber: d.getDate(),
      isToday: isSameDay(d, today),
      isCurrentMonth: d.getMonth() === currentDate.getMonth(),
      slotsCount: 0,
    });
  }

  return days;
}

export function getMonthDays(year: number, month: number): DayInfo[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const today = new Date();

  // Find start date (Monday of first week)
  const startDay = new Date(firstDayOfMonth);
  const dayOfWeek = startDay.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDay.setDate(startDay.getDate() + diffToMonday);

  const days: DayInfo[] = [];
  const current = new Date(startDay);

  // Generates 35 or 42 grid cells
  while (current <= lastDayOfMonth || days.length % 7 !== 0) {
    const d = new Date(current);
    const dateString = formatDateToYYYYMMDD(d);
    const dayIdx = d.getDay();

    days.push({
      date: d,
      dateString,
      dayOfWeek: VIETNAMESE_DAYS_SHORT[dayIdx],
      dayNameShort: dayIdx === 0 ? 'CN' : `Th ${dayIdx + 1}`,
      dayNameFull: VIETNAMESE_DAYS[dayIdx],
      dayNumber: d.getDate(),
      isToday: isSameDay(d, today),
      isCurrentMonth: d.getMonth() === month,
      slotsCount: 0,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function formatVietnameseHeaderDate(date: Date, viewMode: 'day' | 'week' | 'month' | 'year'): string {
  const dayName = VIETNAMESE_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthNum = date.getMonth() + 1;
  const yearNum = date.getFullYear();

  if (viewMode === 'day') {
    return `${dayName}, ${dayNum} tháng ${monthNum}, ${yearNum}`;
  }

  if (viewMode === 'week') {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()} thg ${start.getMonth() + 1} - ${end.getDate()} thg ${end.getMonth() + 1}, ${yearNum}`;
  }

  if (viewMode === 'month') {
    return `Tháng ${monthNum}, ${yearNum}`;
  }

  return `Năm ${yearNum}`;
}

export const HOURS_LIST = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getTodayVietnamInfo() {
  const parts = getVietnamTimeParts();
  return { 
    dayOfWeek: parts.dayOfWeek, 
    dateStr: parts.dateStr, 
    displayDate: parts.displayDate, 
    dayName: parts.dayName, 
    day: parts.day, 
    month: parts.month, 
    year: parts.year,
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: parts.seconds,
    timeStr: parts.timeStr,
    formattedTime: parts.formattedTime
  };
}
