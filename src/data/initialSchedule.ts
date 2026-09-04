import { StudySlot } from '../types';
import { formatDateToYYYYMMDD, getStartOfWeek } from '../utils/dateUtils';

export function generateInitialSchedule(): StudySlot[] {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);

  const getRelativeDate = (dayOffset: number): string => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayOffset);
    return formatDateToYYYYMMDD(d);
  };

  // Monday = 0, Tuesday = 1, Wednesday = 2, Thursday = 3, Friday = 4, Saturday = 5, Sunday = 6
  return [
    {
      id: 'slot-1',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '07:30',
      endTime: '09:00',
      subjectName: 'TOÁN 2',
      subjectCode: 'gfgfdgfdg',
      teacher: '',
      room: '',
      studyLink: '',
      platform: 'other',
      color: '#3b82f6',
      description: '',
      homework: '',
      isCompleted: false,
    },
    {
      id: 'slot-2',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '09:30',
      endTime: '11:00',
      subjectName: 'VĂN',
      subjectCode: 'bài 8',
      teacher: '',
      room: '',
      studyLink: 'https://meet.google.com/',
      platform: 'google-meet',
      color: '#8b5cf6',
      description: '',
      homework: '',
      isCompleted: false,
    },
    {
      id: 'slot-3',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '11:30',
      endTime: '13:00',
      subjectName: 'VĂN',
      subjectCode: 'ghgfhfgh',
      teacher: '',
      room: '',
      studyLink: '',
      platform: 'other',
      color: '#8b5cf6',
      description: '',
      homework: '',
      isCompleted: false,
    },
    {
      id: 'slot-4',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '14:00',
      endTime: '16:00',
      subjectName: 'VĂN',
      subjectCode: 'klklkjlkbgfdghfhrtytrytryt rytrytrytrytryhfggfhfngfh tyuyiusdfdgfmjhkhdgfhf gh',
      teacher: '',
      room: '',
      studyLink: 'https://meet.google.com/',
      platform: 'google-meet',
      color: '#8b5cf6',
      description: '',
      homework: '',
      isCompleted: false,
    },
    {
      id: 'slot-5',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '16:30',
      endTime: '18:00',
      subjectName: 'TIN HỌC',
      subjectCode: 'gfhgfhfg',
      teacher: '',
      room: '',
      studyLink: '',
      platform: 'other',
      color: '#10b981',
      description: '',
      homework: '',
      isCompleted: false,
    },
    {
      id: 'slot-6',
      date: getRelativeDate(3), // Thursday (06/08/2026)
      startTime: '18:30',
      endTime: '20:00',
      subjectName: 'KHOA HỌC',
      subjectCode: 'fgfdgfdgfd',
      teacher: '',
      room: '',
      studyLink: '',
      platform: 'other',
      color: '#f59e0b',
      description: '',
      homework: '',
      isCompleted: false,
    }
  ];
}

export const PRESET_PLATFORMS = [
  { id: 'google-meet', name: 'Google Meet', iconName: 'Video', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  { id: 'zoom', name: 'Zoom Meeting', iconName: 'Video', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  { id: 'teams', name: 'MS Teams', iconName: 'Users', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  { id: 'lms', name: 'LMS / Portal Trường', iconName: 'GraduationCap', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  { id: 'notion', name: 'Notion / Vở Ghi', iconName: 'FileText', color: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30' },
  { id: 'youtube', name: 'YouTube Video', iconName: 'PlayCircle', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  { id: 'drive', name: 'Google Drive / PDF', iconName: 'Folder', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  { id: 'other', name: 'Liên kết Khác', iconName: 'ExternalLink', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' },
];

export const COLOR_PALETTE = [
  { hex: '#3b82f6', label: 'Xanh Dương', bg: 'bg-blue-500' },
  { hex: '#10b981', label: 'Xanh Lá', bg: 'bg-emerald-500' },
  { hex: '#8b5cf6', label: 'Tím', bg: 'bg-purple-500' },
  { hex: '#f59e0b', label: 'Cam Vàng', bg: 'bg-amber-500' },
  { hex: '#ef4444', label: 'Đỏ Huyết', bg: 'bg-red-500' },
  { hex: '#06b6d4', label: 'Xanh Ngọc', bg: 'bg-cyan-500' },
  { hex: '#ec4899', label: 'Hồng', bg: 'bg-pink-500' },
  { hex: '#6366f1', label: 'Chàm', bg: 'bg-indigo-500' },
];
