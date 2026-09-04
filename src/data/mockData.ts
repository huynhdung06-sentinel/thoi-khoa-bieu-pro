import { PeriodInfo, Subject, Lesson, TimetableSlot, LessonPlan, StudyRecord, ClassInfo, DocumentItem } from '../types';
import { createSampleDocumentPreview } from '../utils/fileUtils';
import { getVietnamCurrentMondayStr } from '../utils/dateUtils';

export const STANDARD_PERIODS: PeriodInfo[] = [
  // SÁNG
  { session: 'morning', period: 1, startTime: '07:00', endTime: '07:45' },
  { session: 'morning', period: 2, startTime: '07:50', endTime: '08:35' },
  { session: 'morning', period: 3, startTime: '09:00', endTime: '09:45' },
  { session: 'morning', period: 4, startTime: '09:50', endTime: '10:35' },
  { session: 'morning', period: 5, startTime: '10:40', endTime: '11:25' },
  // CHIỀU
  { session: 'afternoon', period: 1, startTime: '13:30', endTime: '14:15' },
  { session: 'afternoon', period: 2, startTime: '14:20', endTime: '15:05' },
  { session: 'afternoon', period: 3, startTime: '15:20', endTime: '16:05' },
  { session: 'afternoon', period: 4, startTime: '16:10', endTime: '16:55' },
  { session: 'afternoon', period: 5, startTime: '17:00', endTime: '17:45' },
];

export const INITIAL_CLASS_INFO: ClassInfo = {
  className: '11A1-01',
  teacherName: 'Nguyễn Đức Việt',
  weekStartDate: getVietnamCurrentMondayStr(),
  studentName: 'Nguyễn Minh',
};

export const SUBJECTS_LIST: Subject[] = [
  { id: 'toan', name: 'Toán', shortName: 'Toán', defaultTeacher: 'Việt', color: '#2563eb', bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300', emoji: '📐' },
  { id: 'van', name: 'Văn', shortName: 'Văn', defaultTeacher: 'Hường', color: '#7c3aed', bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300', emoji: '📖' },
  { id: 'nngu', name: 'NNgữ', shortName: 'Anh', defaultTeacher: 'Trân', color: '#059669', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300', emoji: '🇬🇧' },
  { id: 'ly', name: 'Lý', shortName: 'Lý', defaultTeacher: 'Sự', color: '#d97706', bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300', emoji: '⚡' },
  { id: 'hoa', name: 'Hóa', shortName: 'Hóa', defaultTeacher: 'Châm', color: '#dc2626', bgColor: 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300', emoji: '🧪' },
  { id: 'sinh', name: 'Sinh', shortName: 'Sinh', defaultTeacher: 'Trúc', color: '#16a34a', bgColor: 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300', emoji: '🧬' },
  { id: 'su', name: 'Sử', shortName: 'Sử', defaultTeacher: 'Hằng-SU', color: '#ea580c', bgColor: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300', emoji: '📜' },
  { id: 'dia', name: 'Địa', shortName: 'Địa', defaultTeacher: 'Liên', color: '#0891b2', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300', emoji: '🌍' },
  { id: 'tin', name: 'Tin', shortName: 'Tin', defaultTeacher: 'Nga', color: '#4f46e5', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300', emoji: '💻' },
  { id: 'gdcd', name: 'GDCD', shortName: 'GDCD', defaultTeacher: 'H-Thanh', color: '#9333ea', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-800 dark:text-fuchsia-300', emoji: '⚖️' },
  { id: 'cn', name: 'CNghệ', shortName: 'Công nghệ', defaultTeacher: 'Trang-VL', color: '#0284c7', bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300', emoji: '🛠️' },
  { id: 'gdqp', name: 'GDQP', shortName: 'GDQP', defaultTeacher: 'Phú', color: '#65a30d', bgColor: 'bg-lime-50 dark:bg-lime-950/40 text-lime-800 dark:text-lime-300', emoji: '🛡️' },
  { id: 'nghe', name: 'Nghề', shortName: 'Nghề', defaultTeacher: 'X-Sơn', color: '#475569', bgColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200', emoji: '👔' },
  { id: 'nk', name: 'NK', shortName: 'Năng khiếu', defaultTeacher: 'Quang', color: '#db2777', bgColor: 'bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300', emoji: '🎨' },
  { id: 'td', name: 'TD', shortName: 'Thể dục', defaultTeacher: 'Lịch', color: '#14b8a6', bgColor: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300', emoji: '🏃' },
  { id: 'chao-co', name: 'Chào cờ', shortName: 'Chào cờ', defaultTeacher: '', color: '#b91c1c', bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300', emoji: '🚩' },
  { id: 'shl', name: 'SHL', shortName: 'Sinh hoạt lớp', defaultTeacher: 'Việt', color: '#4338ca', bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300', emoji: '💬' },
];

export const getSubjectEmoji = (subjectName?: string): string => {
  if (!subjectName) return '📝';
  const sLower = subjectName.toLowerCase();
  const found = SUBJECTS_LIST.find(
    (s) => (s.name || '').toLowerCase() === sLower || (s.shortName || '').toLowerCase() === sLower
  );
  return found?.emoji || '📝';
};

export const INITIAL_LESSONS_BANK: Lesson[] = [
  // TOÁN
  { 
    id: 'toan-1', 
    subjectName: 'Toán', 
    lessonNumber: 1, 
    volume: 1,
    chapter: 'Chương I: Hàm số lượng giác',
    title: 'Bài 1: Hàm số lượng giác', 
    summary: 'Nghiên cứu định nghĩa các hàm số sin, cos, tan, cot; tập xác định, tính tuần hoàn, chu kỳ và đồ thị đặc trưng.', 
    keyPoints: [
      'Tập xác định & Tập giá trị: y = sin x và y = cos x có TXĐ: D = R, TGT: [-1; 1]',
      'Chu kỳ: y = sin x và y = cos x tuần hoàn chu kỳ T = 2π; y = tan x và y = cot x tuần hoàn chu kỳ T = π',
      'Tính chẵn lẻ: y = cos x là hàm chẵn, y = sin x, y = tan x, y = cot x là hàm lẻ'
    ],
    examples: [
      { question: 'Tìm tập xác định của hàm số y = (1 + cos x) / sin x', answer: 'Điều kiện: sin x ≠ 0 <=> x ≠ kπ (k ∈ Z). Vậy D = R \\ {kπ | k ∈ Z}.', tip: 'Nhớ mẫu số phải khác 0' },
      { question: 'Xét tính chẵn lẻ của hàm số y = f(x) = sin 2x + tan x', answer: 'TXĐ: D đối xứng. f(-x) = sin(-2x) + tan(-x) = -sin 2x - tan x = -f(x). Hàm lẻ.', tip: 'sin(-α) = -sin α' }
    ],
    flashcards: [
      { question: 'Chu kỳ của hàm số y = sin(ax + b) là gì?', answer: 'T = 2π / |a|' },
      { question: 'Tập xác định của hàm số y = tan x là gì?', answer: 'D = R \\ {π/2 + kπ, k ∈ Z}' },
      { question: 'Hàm số lượng giác nào duy nhất là hàm chẵn?', answer: 'Hàm số y = cos x (và các biến thể cos(ax))' }
    ],
    pdfPageNumber: 1
  },
  { 
    id: 'toan-2', 
    subjectName: 'Toán', 
    lessonNumber: 2, 
    volume: 1,
    chapter: 'Chương I: Hàm số lượng giác & Phương trình lượng giác',
    title: 'Bài 2: Phương trình lượng giác cơ bản', 
    summary: 'Phương pháp giải phương trình lượng giác cơ bản sin x = m, cos x = m, tan x = m, cot x = m và điều kiện có nghiệm.', 
    keyPoints: [
      'Điều kiện có nghiệm của sin x = m và cos x = m là -1 ≤ m ≤ 1',
      'sin x = sin α <=> x = α + k2π hoặc x = π - α + k2π (k ∈ Z)',
      'cos x = cos α <=> x = ±α + k2π (k ∈ Z)',
      'tan x = tan α <=> x = α + kπ (k ∈ Z)'
    ],
    examples: [
      { question: 'Giải phương trình sin(2x - π/3) = 1/2', answer: 'sin(2x - π/3) = sin(π/6) <=> 2x - π/3 = π/6 + k2π hoặc 2x - π/3 = 5π/6 + k2π. Kết quả: x = π/4 + kπ hoặc x = 7π/12 + kπ (k ∈ Z).' }
    ],
    flashcards: [
      { question: 'Nghiệm của phương trình cos x = 0 là gì?', answer: 'x = π/2 + kπ (k ∈ Z)' },
      { question: 'Nghiệm của phương trình sin x = 0 là gì?', answer: 'x = kπ (k ∈ Z)' },
      { question: 'Phương trình sin x = 1.5 có nghiệm không?', answer: 'Vô nghiệm vì |1.5| > 1' }
    ],
    pdfPageNumber: 3
  },
  { 
    id: 'toan-3', 
    subjectName: 'Toán', 
    lessonNumber: 3, 
    volume: 1,
    chapter: 'Chương II: Dãy số - Cấp số cộng & Cấp số nhân',
    title: 'Bài 3: Cấp số cộng', 
    summary: 'Định nghĩa dãy số cấp số cộng, công sai d, số hạng tổng quát và công thức tính tổng n số hạng đầu tiên.', 
    keyPoints: [
      'Định nghĩa: u_{n+1} = u_n + d (d là công sai)',
      'Số hạng tổng quát: u_n = u_1 + (n - 1)d',
      'Tính chất: u_k = (u_{k-1} + u_{k+1}) / 2',
      'Tổng n số hạng đầu: S_n = n(u_1 + u_n)/2 = n[2u_1 + (n - 1)d]/2'
    ],
    examples: [
      { question: 'Cho cấp số cộng (u_n) có u_1 = 3, d = 4. Tìm u_{15} và S_{15}?', answer: 'u_{15} = 3 + 14*4 = 59. S_{15} = 15*(3 + 59)/2 = 465.' }
    ],
    flashcards: [
      { question: 'Công thức số hạng tổng quát của cấp số cộng?', answer: 'u_n = u_1 + (n - 1)d' },
      { question: 'Công thức tính tổng S_n của cấp số cộng?', answer: 'S_n = n * (u_1 + u_n) / 2' }
    ]
  },
  { 
    id: 'toan-4', 
    subjectName: 'Toán', 
    lessonNumber: 4, 
    volume: 2,
    chapter: 'Chương III: Cấp số nhân & Giới hạn (Tập 2)',
    title: 'Bài 4: Cấp số nhân', 
    summary: 'Định nghĩa cấp số nhân u_{n+1} = u_n * q, công bội q, số hạng tổng quát và tổng n số hạng.', 
    keyPoints: [
      'Định nghĩa: u_{n+1} = u_n * q (q là công bội)',
      'Số hạng tổng quát: u_n = u_1 * q^(n-1)',
      'Tổng n số hạng đầu (q ≠ 1): S_n = u_1 * (1 - q^n) / (1 - q)'
    ],
    flashcards: [
      { question: 'Công thức số hạng tổng quát cấp số nhân?', answer: 'u_n = u_1 * q^(n - 1)' }
    ]
  },
  { 
    id: 'toan-5', 
    subjectName: 'Toán', 
    lessonNumber: 5, 
    volume: 2,
    chapter: 'Chương III: Cấp số nhân & Giới hạn (Tập 2)',
    title: 'Bài 5: Giới hạn của dãy số', 
    summary: 'Khái niệm giới hạn dãy số lim u_n và các định lý mở rộng, tổng cấp số nhân lùi vô hạn.', 
    keyPoints: [
      'Các giới hạn đặc biệt: lim(1/n) = 0, lim(1/n^k) = 0, lim(q^n) = 0 (|q| < 1)',
      'Định lý kẹp và các quy tắc tìm giới hạn vô cực',
      'Tổng cấp số nhân lùi vô hạn (|q| < 1): S = u_1 / (1 - q)'
    ] 
  },
  
  // VĂN
  { 
    id: 'van-1', 
    subjectName: 'Văn', 
    lessonNumber: 1, 
    chapter: 'Văn học trung đại Việt Nam',
    title: 'Bài 1: Tự tình II (Hồ Xuân Hương)', 
    summary: 'Bi kịch duyên phận và khát vọng hạnh phúc mãnh liệt cùng tinh thần phản kháng bất khuất của người phụ nữ.', 
    keyPoints: [
      'Không gian & thời gian: Đêm khuya vắng lặng, tiếng trống canh dồn dập bi thương',
      'Tâm trạng trơ trọi, bẽ bàng trước duyên phận lỡ làng ("trơ cái hồng nhan")',
      'Sự phản kháng kiêu hãnh: "Xiên ngang mặt đất, rêu từng đám / Đâm toạc chân mây, đá mấy hòn"',
      'Nghệ thuật đối, từ ngữ sắc nhọn, cá tính thơ độc đáo'
    ],
    flashcards: [
      { question: 'Tác giả Hồ Xuân Hương được mệnh danh là gì?', answer: 'Bà chúa Thơ Nôm' },
      { question: 'Ý nghĩa của hai câu luận "Xiên ngang mặt đất..."?', answer: 'Thể hiện sức sống quật cường, sự phẫn uất và thái độ phản kháng mạnh mẽ trước số phận' }
    ]
  },
  { 
    id: 'van-2', 
    subjectName: 'Văn', 
    lessonNumber: 2, 
    chapter: 'Văn học trung đại Việt Nam',
    title: 'Bài 2: Câu cá mùa thu (Nguyễn Khuyến)', 
    summary: 'Bức tranh mùa thu thanh sơ, tĩnh lặng của đồng quê Bắc Bộ và nỗi u hoài thầm kín của cụ Tam Nguyên Yên Đổ.', 
    keyPoints: [
      'Điểm nhìn: Từ thuyền câu nhìn ra mặt ao, bầu trời, ngõ trúc',
      'Gam màu lạnh: Ao thu lạnh lẽo, nước trong veo, sóng biếc, lá vàng',
      'Nghệ thuật lấy động tả tĩnh ("Cá đâu đớp động dưới chân bèo")',
      'Tấm lòng yêu nước thầm kín, nỗi buồn thế sự trước thời cuộc mất nước'
    ]
  },
  { 
    id: 'van-3', 
    subjectName: 'Văn', 
    lessonNumber: 3, 
    chapter: 'Văn học trung đại Việt Nam',
    title: 'Bài 3: Thương vợ (Trần Tế Xương)', 
    summary: 'Bức chân dung bà Tú tần tảo chịu thương chịu khó và tấm lòng yêu thương, kính trọng sâu sắc của nhà thơ Tú Xương.', 
    keyPoints: [
      'Hoàn cảnh: "Quanh năm buôn bán ở mom sông / Nuôi đủ năm con với một chồng"',
      'Đức hy sinh: "Lặn lội thân cò khi quãng vắng / Eo sèo mặt nước buổi đò đông"',
      'Nỗi lòng tự trách bản thân và tiếng chửi xã hội phong kiến bất công'
    ]
  },
  { 
    id: 'van-4', 
    subjectName: 'Văn', 
    lessonNumber: 4, 
    chapter: 'Văn học trung đại Việt Nam',
    title: 'Bài 4: Bài ca ngất ngưởng (Nguyễn Công Trứ)', 
    summary: 'Lối sống ngất ngưởng, bản lĩnh kiên cường, vượt lên định kiến thế tục của nhà nho tài hoa uyên bác.', 
    keyPoints: [
      'Ý thức về tài năng và món nợ công danh với đất nước',
      'Thái độ sống ngất ngưởng, phóng khoáng khi làm quan lẫn khi về hưu',
      'Nhân cách trong sạch: "Chẳng Phật, chẳng Tiên, chẳng vướng tục"'
    ]
  },
  { 
    id: 'van-5', 
    subjectName: 'Văn', 
    lessonNumber: 5, 
    chapter: 'Văn học hiện thực 1930-1945',
    title: 'Bài 5: Chí Phèo (Nam Cao)', 
    summary: 'Tác phẩm hiện thực xuất sắc về tấn bi kịch bị tha hóa, lưu manh hóa và bị cự tuyệt quyền làm người của nông dân.', 
    keyPoints: [
      'Con đường tha hóa: Từ anh nông dân hiền lành thành con quỷ dữ làng Vũ Đại',
      'Bát cháo hành của Thị Nở: Khơi dậy bản tính người và khát khao lương thiện',
      'Bi kịch cuối cùng: "Ai cho tao lương thiện?" và hành động đâm chết Bá Kiến'
    ]
  },

  // NGOẠI NGỮ
  { 
    id: 'nngu-1', 
    subjectName: 'NNgữ', 
    lessonNumber: 1, 
    chapter: 'Theme: Family & Relationships',
    title: 'Unit 1: The Generation Gap', 
    summary: 'Explore differences in beliefs, behaviors, and values between family generations.', 
    keyPoints: [
      'Grammar: Modal verbs (should / ought to for advice, must for strong obligation, have to for external rules)',
      'Vocabulary: extended family, nuclear family, traditional views, conflicts, open communication',
      'Skills: Expressing agreement, disagreement and polite suggestions'
    ],
    flashcards: [
      { question: 'What is the difference between "must" and "have to"?', answer: '"Must" expresses internal feelings/obligation from the speaker; "have to" comes from external rules/laws.' },
      { question: 'Meaning of "generation gap"?', answer: 'The difference in opinions or behaviors between older and younger people.' }
    ]
  },
  { 
    id: 'nngu-2', 
    subjectName: 'NNgữ', 
    lessonNumber: 2, 
    chapter: 'Theme: Family & Relationships',
    title: 'Unit 2: Relationships', 
    summary: 'Master vocabulary and syntax around friendship, romantic relationships and conflict resolutions.', 
    keyPoints: [
      'Grammar: Linking verbs (seem, appear, look, sound, taste, smell, become) followed by Adjectives',
      'Cleft sentences: "It is / was + Focus element + that / who ..."',
      'Collocations: break up with, be on good terms with, lend a sympathetic ear'
    ]
  },
  { 
    id: 'nngu-3', 
    subjectName: 'NNgữ', 
    lessonNumber: 3, 
    chapter: 'Theme: Self-Reliance',
    title: 'Unit 3: Becoming Independent', 
    summary: 'Learn essential skills, time management, and self-reliance techniques for modern youth.', 
    keyPoints: [
      'Grammar: To-infinitive clauses after certain nouns (ability, chance, decision) and adjectives (determined, ready, able)',
      'Life skills: Money management, coping with stress, prioritizing tasks'
    ]
  },

  // VẬT LÝ
  { 
    id: 'ly-1', 
    subjectName: 'Lý', 
    lessonNumber: 1, 
    chapter: 'Chương I: Điện tích - Điện trường',
    title: 'Bài 1: Điện tích - Định luật Cu-lông', 
    summary: 'Quy luật tương tác tĩnh điện giữa hai điện tích điểm đứng yên trong chân không và môi trường điện môi.', 
    keyPoints: [
      'Điện tích cùng dấu thì đẩy nhau, trái dấu thì hút nhau',
      'Định luật Cu-lông: F = k * |q1 * q2| / (ε * r^2) với k = 9.10^9 N.m^2/C^2',
      'Hằng số điện môi ε: Chân không ε = 1, không khí ε ≈ 1, nước cất ε = 81'
    ],
    examples: [
      { question: 'Hai điện tích điểm q1 = 2.10^-8 C, q2 = -2.10^-8 C đặt cách nhau 3 cm trong chân không. Tính lực tương tác?', answer: 'F = 9.10^9 * |2.10^-8 * (-2.10^-8)| / (0.03)^2 = 4.10^-3 N (Lực hút).' }
    ],
    flashcards: [
      { question: 'Công thức định luật Cu-lông?', answer: 'F = k * |q1*q2| / (ε * r^2)' },
      { question: 'Hằng số k trong định luật Cu-lông có giá trị là bao nhiêu?', answer: '9 * 10^9 (N.m^2 / C^2)' }
    ]
  },
  { 
    id: 'ly-2', 
    subjectName: 'Lý', 
    lessonNumber: 2, 
    chapter: 'Chương I: Điện tích - Điện trường',
    title: 'Bài 2: Thuyết Electron & Định luật bảo toàn điện tích', 
    summary: 'Cấu tạo nguyên tử, electron tự do, các hiện tượng nhiễm điện và định luật bảo toàn điện tích.', 
    keyPoints: [
      '3 hiện tượng nhiễm điện: Cọ xát, Tiếp xúc, Hưởng ứng',
      'Định luật bảo toàn điện tích: Trong một hệ cô lập về điện, tổng đại số các điện tích không đổi',
      'Nguyên tử mất electron trở thành ion dương, nhận electron trở thành ion âm'
    ]
  },
  { 
    id: 'ly-3', 
    subjectName: 'Lý', 
    lessonNumber: 3, 
    chapter: 'Chương I: Điện tích - Điện trường',
    title: 'Bài 3: Điện trường & Cường độ điện trường', 
    summary: 'Khái niệm điện trường, vectơ cường độ điện trường E = F/q và nguyên lý chồng chất điện trường.', 
    keyPoints: [
      'Cường độ điện trường gây bởi điện tích điểm Q: E = k * |Q| / (ε * r^2)',
      'Vectơ E hướng ra xa điện tích dương, hướng lại gần điện tích âm',
      'Nguyên lý chồng chất: E_tong = E1 + E2 + ...'
    ]
  },

  // HÓA HỌC
  { 
    id: 'hoa-1', 
    subjectName: 'Hóa', 
    lessonNumber: 1, 
    chapter: 'Chương I: Sự điện li',
    title: 'Bài 1: Sự điện li', 
    summary: 'Bản chất quá trình phân li ra ion của các chất khi tan trong nước và phân loại chất điện li.', 
    keyPoints: [
      'Chất điện li mạnh: Axit mạnh (HCl, HNO3, H2SO4), Bazơ mạnh (NaOH, KOH, Ba(OH)2), hầu hết các muối tan',
      'Chất điện li yếu: Axit yếu (CH3COOH, HF, H2S), Bazơ yếu (NH3, Mg(OH)2)',
      'Chất không điện li: Đường, rượu etylic, benzen'
    ],
    flashcards: [
      { question: 'Chất điện li mạnh phân li như thế nào?', answer: 'Phân li hoàn toàn 100% ra ion (dùng mũi tên 1 chiều →)' },
      { question: 'CH3COOH là chất điện li mạnh hay yếu?', answer: 'Chất điện li yếu (phân li thuận nghịch ⇌)' }
    ]
  },
  { 
    id: 'hoa-2', 
    subjectName: 'Hóa', 
    lessonNumber: 2, 
    chapter: 'Chương I: Sự điện li',
    title: 'Bài 2: Axit, Bazơ và Muối', 
    summary: 'Thuyết A-rê-ni-út và thuyết Bron-xtet, hợp chất lưỡng tính và phản ứng trao đổi ion trong dung dịch.', 
    keyPoints: [
      'Theo Bron-xtet: Axit là chất nhường proton H+, Bazơ là chất nhận proton H+',
      'Hợp chất lưỡng tính: Al(OH)3, Zn(OH)2, HCO3-, HSO3-',
      'Điều kiện xảy ra phản ứng trao đổi ion: Có kết tủa, có chất khí, hoặc có chất điện li yếu (H2O)'
    ]
  },
  { 
    id: 'hoa-3', 
    subjectName: 'Hóa', 
    lessonNumber: 3, 
    chapter: 'Chương I: Sự điện li',
    title: 'Bài 3: Sự điện li của nước - pH', 
    summary: 'Tích số ion của nước, khái niệm và thang đo pH, chất chỉ thị axit-bazơ.', 
    keyPoints: [
      'Tích số ion của nước ở 25°C: K_H2O = [H+] * [OH-] = 10^-14',
      'pH = -log[H+]; Môi trường axit: pH < 7, Trung tính: pH = 7, Bazơ: pH > 7',
      'Chất chỉ thị: Quỳ tím hóa đỏ (axit), hóa xanh (bazơ); Phenolphthalein hóa hồng trong môi trường bazơ'
    ]
  },

  // SINH HỌC
  { 
    id: 'sinh-1', 
    subjectName: 'Sinh', 
    lessonNumber: 1, 
    chapter: 'Chuyển hóa vật chất & năng lượng ở thực vật',
    title: 'Bài 1: Trao đổi nước ở thực vật', 
    summary: 'Quá trình hấp thụ nước và ion khoáng ở rễ, vận chuyển trong thân và thoát hơi nước ở lá.', 
    keyPoints: [
      'Hấp thụ ở rễ: Qua tế bào lông hút theo cơ chế thẩm thấu',
      'Hai con đường: Con đường gian bào và con đường qua tế bào chất (bị đai Caspary chặn lại)',
      '3 động lực của dòng mạch gỗ: Áp suất rễ (động lực đầu dưới), Lực hút do thoát hơi nước (động lực đầu trên), Lực liên kết giữa các phân tử nước'
    ]
  },

  // LỊCH SỬ
  { 
    id: 'su-1', 
    subjectName: 'Sử', 
    lessonNumber: 1, 
    chapter: 'Lịch sử thế giới cận đại',
    title: 'Bài 1: Nhật Bản nửa sau thế kỷ XIX', 
    summary: 'Cuộc Duy tân Minh Trị (1868) toàn diện về kinh tế, chính trị, giáo dục và sự chuyển biến lên Chủ nghĩa đế quốc.', 
    keyPoints: [
      'Bối cảnh: Khủng hoảng chế độ Mạc phủ, nguy cơ bị phương Tây xâm lược',
      'Nội dung cải cách Minh Trị: Thống nhất tiền tệ, phát triển công thương nghiệp, giáo dục bắt buộc',
      'Ý nghĩa: Đưa Nhật Bản thoát khỏi số phận thuộc địa, trở thành cường quốc tư bản châu Á'
    ]
  },

  // ĐỊA LÝ
  { 
    id: 'dia-1', 
    subjectName: 'Địa', 
    lessonNumber: 1, 
    chapter: 'Địa lý kinh tế - xã hội thế giới',
    title: 'Bài 1: Sự tương phản về trình độ phát triển KT-XH', 
    summary: 'Phân loại các nhóm nước phát triển và đang phát triển dựa trên chỉ số GDP/người, HDI và cơ cấu kinh tế.', 
    keyPoints: [
      'Chỉ số phân loại: GDP bình quân đầu người, Chỉ số phát triển con người (HDI), Cơ cấu GDP theo ngành',
      'Nhóm nước phát triển: GDP cao, HDI > 0.8, ngành dịch vụ chiếm tỉ trọng áp đảo',
      'Nhóm nước đang phát triển: Nợ nước ngoài lớn, nông nghiệp còn chiếm tỉ trọng cao, HDI trung bình hoặc thấp'
    ]
  },

  // TIN HỌC
  { 
    id: 'tin-1', 
    subjectName: 'Tin', 
    lessonNumber: 1, 
    chapter: 'Thuật toán & Ngôn ngữ lập trình',
    title: 'Bài 1: Khái niệm thuật toán và lập trình', 
    summary: 'Cấu trúc thuật toán, các tính chất cơ bản, biểu diễn thuật toán bằng sơ đồ khối và mã giả.', 
    keyPoints: [
      '3 tính chất cốt lõi: Tính xác định, Tính dừng, Tính đúng đắn',
      'Các cấu trúc cơ bản: Cấu trúc tuần tự, Rẽ nhánh (if/else), Vòng lặp (for/while)',
      'Quy trình giải bài toán: Xác định Input/Output -> Xây dựng thuật toán -> Viết chương trình -> Kiểm thử'
    ]
  },

  // GDCD
  { 
    id: 'gdcd-1', 
    subjectName: 'GDCD', 
    lessonNumber: 1, 
    chapter: 'Công dân với kinh tế',
    title: 'Bài 1: Công dân với sự phát triển kinh tế', 
    summary: 'Vai trò của sản xuất của cải vật chất và ba yếu tố cấu thành cơ bản của quá trình sản xuất.', 
    keyPoints: [
      'Sản xuất của cải vật chất là cơ sở tồn tại và phát triển của xã hội',
      '3 yếu tố: Sức lao động, Đối tượng lao động, Tư liệu lao động',
      'Ý thức công dân: Nâng cao tay nghề, áp dụng khoa học kỹ thuật, tiết kiệm tài nguyên'
    ]
  },

  // CÔNG NGHỆ
  { 
    id: 'cn-1', 
    subjectName: 'CNghệ', 
    lessonNumber: 1, 
    chapter: 'Vẽ kỹ thuật cơ sở',
    title: 'Bài 1: Tiêu chuẩn trình bày bản vẽ kỹ thuật', 
    summary: 'Quy chuẩn về khổ giấy, tỉ lệ, nét vẽ và cách ghi kích thước chuẩn TCVN.', 
    keyPoints: [
      'Các khổ giấy: A0 (841x1189mm), A1, A2, A3, A4 (210x297mm)',
      'Tỉ lệ: Nguyên hình (1:1), Thu nhỏ (1:2, 1:5), Phóng to (2:1, 5:1)',
      'Các nét vẽ: Nét liền đậm (đường bao thấy), Nét đứt mảnh (đường bao khuất), Nét gạch chấm mảnh (đường tâm)'
    ]
  },

  // GDQP
  { 
    id: 'gdqp-1', 
    subjectName: 'GDQP', 
    lessonNumber: 1, 
    chapter: 'Điều lệnh đội ngũ',
    title: 'Bài 1: Đội ngũ từng người không có súng', 
    summary: 'Các động tác quay tại chỗ, đi đều, đứng lại, đổi chân khi đi đều sai nhịp.', 
    keyPoints: [
      'Động tác nghiêm, nghỉ: Giữ tư thế thẳng, mắt nhìn thẳng, tác phong nhanh gọn',
      'Quay tại chỗ: Quay phải, quay trái (dùng gót chân làm trụ), quay đằng sau (180 độ theo chiều kim đồng hồ)',
      'Khẩu lệnh: Gồm Dự lệnh và Động lệnh rõ ràng, dứt khoát'
    ]
  },

  // THỂ DỤC
  { 
    id: 'td-1', 
    subjectName: 'TD', 
    lessonNumber: 1, 
    chapter: 'Điền kinh & Thể lực',
    title: 'Bài 1: Thể dục nhịp điệu & Chạy cự ly ngắn', 
    summary: 'Kỹ thuật xuất phát thấp, chạy lao, chạy giữa quãng và về đích trong cự ly 100m.', 
    keyPoints: [
      '4 giai đoạn chạy ngắn: Xuất phát -> Chạy lao -> Chạy giữa quãng -> Về đích',
      'Kỹ thuật xuất phát thấp: 3 khẩu lệnh "Vào chỗ" -> "Sẵn sàng" -> "Chạy!"',
      'Đánh tay nhịp nhàng theo nhịp thở và guồng chân'
    ]
  },

  // NGHỀ
  { 
    id: 'nghe-1', 
    subjectName: 'Nghề', 
    lessonNumber: 1, 
    chapter: 'An toàn nghề nghiệp',
    title: 'Bài 1: An toàn lao động trong nghề Điện/Tin', 
    summary: 'Các quy tắc phòng chống điện giật, sử dụng dụng cụ đo điện an toàn và xử lý sự cố.', 
    keyPoints: [
      'Nguyên tắc vàng: Ngắt aptomat và kiểm tra bút thử điện trước khi chạm vào mạch',
      'Trang bị bảo hộ: Giày cách điện, găng tay cao su, kìm cách điện',
      'Quy trình sơ cứu người bị điện giật: Tách nạn nhân khỏi nguồn điện an toàn -> Hô hấp nhân tạo'
    ]
  },

  // NĂNG KHIẾU (NK)
  { 
    id: 'nk-1', 
    subjectName: 'NK', 
    lessonNumber: 1, 
    chapter: 'Phương pháp học tập thông minh',
    title: 'Bài 1: Phương pháp tư duy sáng tạo Mindmap', 
    summary: 'Kỹ thuật xây dựng sơ đồ tư duy bằng hình ảnh, màu sắc, từ khóa và các nhánh liên kết đa chiều.', 
    keyPoints: [
      'Chủ đề trung tâm (Central Idea): Nằm ở giữa trang, sử dụng ít nhất 3 màu sắc nổi bật',
      'Nhánh chính (Main Branches): Dày ở gốc, thuôn về ngọn, gắn liền với từ khóa then chốt',
      'Nhánh phụ (Sub-branches): Tỏa ra 360 độ theo chiều kim đồng hồ',
      'Hình ảnh & Biểu tượng (Icons): Kích thích não bộ ghi nhớ sâu gấp 5 lần chữ viết đơn thuần'
    ],
    flashcards: [
      { question: 'Ai là cha đẻ của phương pháp Sơ đồ tư duy (Mindmap)?', answer: 'Tony Buzan' },
      { question: 'Nguyên tắc vàng khi chọn từ khóa trên nhánh mindmap?', answer: 'Chỉ nên dùng 1 từ khóa (keyword) ngắn gọn hoặc 1 hình biểu tượng trên mỗi nhánh.' }
    ]
  },
];

/**
 * 60 slots for the entire week matching the exact timetable in image.png
 */
export const INITIAL_TIMETABLE_SLOTS: TimetableSlot[] = [
  // === THỨ 2 (dayOfWeek: 2) ===
  { id: 't2-m-1', dayOfWeek: 2, session: 'morning', period: 1, subjectName: 'Chào cờ', teacher: '', room: 'Sân trường' },
  { id: 't2-m-2', dayOfWeek: 2, session: 'morning', period: 2, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't2-m-3', dayOfWeek: 2, session: 'morning', period: 3, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't2-m-4', dayOfWeek: 2, session: 'morning', period: 4, subjectName: 'Hóa', teacher: 'Châm', room: 'P.101' },
  { id: 't2-m-5', dayOfWeek: 2, session: 'morning', period: 5, subjectName: 'Sử', teacher: 'Hằng-SU', room: 'P.101' },
  { id: 't2-a-1', dayOfWeek: 2, session: 'afternoon', period: 1, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't2-a-2', dayOfWeek: 2, session: 'afternoon', period: 2, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't2-a-3', dayOfWeek: 2, session: 'afternoon', period: 3, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't2-a-4', dayOfWeek: 2, session: 'afternoon', period: 4, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't2-a-5', dayOfWeek: 2, session: 'afternoon', period: 5, subjectName: '', teacher: '' },

  // === THỨ 3 (dayOfWeek: 3) ===
  { id: 't3-m-1', dayOfWeek: 3, session: 'morning', period: 1, subjectName: 'GDCD', teacher: 'H-Thanh', room: 'P.101' },
  { id: 't3-m-2', dayOfWeek: 3, session: 'morning', period: 2, subjectName: 'CNghệ', teacher: 'Trang-VL', room: 'P.101' },
  { id: 't3-m-3', dayOfWeek: 3, session: 'morning', period: 3, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't3-m-4', dayOfWeek: 3, session: 'morning', period: 4, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't3-m-5', dayOfWeek: 3, session: 'morning', period: 5, subjectName: 'Sinh', teacher: 'Trúc', room: 'P.101' },
  { id: 't3-a-1', dayOfWeek: 3, session: 'afternoon', period: 1, subjectName: 'GDQP', teacher: 'Phú', room: 'Sân tập' },
  { id: 't3-a-2', dayOfWeek: 3, session: 'afternoon', period: 2, subjectName: 'Nghề', teacher: 'X-Sơn', room: 'Xưởng nghề' },
  { id: 't3-a-3', dayOfWeek: 3, session: 'afternoon', period: 3, subjectName: 'Nghề', teacher: 'X-Sơn', room: 'Xưởng nghề' },
  { id: 't3-a-4', dayOfWeek: 3, session: 'afternoon', period: 4, subjectName: 'Nghề', teacher: 'X-Sơn', room: 'Xưởng nghề' },
  { id: 't3-a-5', dayOfWeek: 3, session: 'afternoon', period: 5, subjectName: '', teacher: '' },

  // === THỨ 4 (dayOfWeek: 4) ===
  { id: 't4-m-1', dayOfWeek: 4, session: 'morning', period: 1, subjectName: 'Tin', teacher: 'Nga', room: 'Lab Tin 1' },
  { id: 't4-m-2', dayOfWeek: 4, session: 'morning', period: 2, subjectName: 'Tin', teacher: 'Nga', room: 'Lab Tin 1' },
  { id: 't4-m-3', dayOfWeek: 4, session: 'morning', period: 3, subjectName: 'Lý', teacher: 'Sự', room: 'P.101' },
  { id: 't4-m-4', dayOfWeek: 4, session: 'morning', period: 4, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't4-m-5', dayOfWeek: 4, session: 'morning', period: 5, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't4-a-1', dayOfWeek: 4, session: 'afternoon', period: 1, subjectName: 'NK', teacher: 'Quang', room: 'P.Âm nhạc' },
  { id: 't4-a-2', dayOfWeek: 4, session: 'afternoon', period: 2, subjectName: 'NK', teacher: 'Quang', room: 'P.Âm nhạc' },
  { id: 't4-a-3', dayOfWeek: 4, session: 'afternoon', period: 3, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't4-a-4', dayOfWeek: 4, session: 'afternoon', period: 4, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't4-a-5', dayOfWeek: 4, session: 'afternoon', period: 5, subjectName: '', teacher: '' },

  // === THỨ 5 (dayOfWeek: 5) ===
  { id: 't5-m-1', dayOfWeek: 5, session: 'morning', period: 1, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't5-m-2', dayOfWeek: 5, session: 'morning', period: 2, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't5-m-3', dayOfWeek: 5, session: 'morning', period: 3, subjectName: 'Lý', teacher: 'Sự', room: 'P.101' },
  { id: 't5-m-4', dayOfWeek: 5, session: 'morning', period: 4, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't5-m-5', dayOfWeek: 5, session: 'morning', period: 5, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't5-a-1', dayOfWeek: 5, session: 'afternoon', period: 1, subjectName: 'Lý', teacher: 'Sự', room: 'P.101' },
  { id: 't5-a-2', dayOfWeek: 5, session: 'afternoon', period: 2, subjectName: 'Lý', teacher: 'Sự', room: 'P.101' },
  { id: 't5-a-3', dayOfWeek: 5, session: 'afternoon', period: 3, subjectName: 'NNgữ', teacher: 'VIETMY3', room: 'Lab Ngoại ngữ' },
  { id: 't5-a-4', dayOfWeek: 5, session: 'afternoon', period: 4, subjectName: 'NNgữ', teacher: 'VIETMY3', room: 'Lab Ngoại ngữ' },
  { id: 't5-a-5', dayOfWeek: 5, session: 'afternoon', period: 5, subjectName: '', teacher: '' },

  // === THỨ 6 (dayOfWeek: 6) ===
  { id: 't6-m-1', dayOfWeek: 6, session: 'morning', period: 1, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't6-m-2', dayOfWeek: 6, session: 'morning', period: 2, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't6-m-3', dayOfWeek: 6, session: 'morning', period: 3, subjectName: 'Địa', teacher: 'Liên', room: 'P.101' },
  { id: 't6-m-4', dayOfWeek: 6, session: 'morning', period: 4, subjectName: '', teacher: '' },
  { id: 't6-m-5', dayOfWeek: 6, session: 'morning', period: 5, subjectName: '', teacher: '' },
  { id: 't6-a-1', dayOfWeek: 6, session: 'afternoon', period: 1, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't6-a-2', dayOfWeek: 6, session: 'afternoon', period: 2, subjectName: 'Văn', teacher: 'Hường', room: 'P.101' },
  { id: 't6-a-3', dayOfWeek: 6, session: 'afternoon', period: 3, subjectName: 'TD', teacher: 'Lịch', room: 'Sân bóng' },
  { id: 't6-a-4', dayOfWeek: 6, session: 'afternoon', period: 4, subjectName: 'TD', teacher: 'Lịch', room: 'Sân bóng' },
  { id: 't6-a-5', dayOfWeek: 6, session: 'afternoon', period: 5, subjectName: '', teacher: '' },

  // === THỨ 7 (dayOfWeek: 7) ===
  { id: 't7-m-1', dayOfWeek: 7, session: 'morning', period: 1, subjectName: 'SHL', teacher: 'Việt', room: 'P.101' },
  { id: 't7-m-2', dayOfWeek: 7, session: 'morning', period: 2, subjectName: 'Toán', teacher: 'Việt', room: 'P.101' },
  { id: 't7-m-3', dayOfWeek: 7, session: 'morning', period: 3, subjectName: 'Hóa', teacher: 'Châm', room: 'P.101' },
  { id: 't7-m-4', dayOfWeek: 7, session: 'morning', period: 4, subjectName: 'Lý', teacher: 'Sự', room: 'P.101' },
  { id: 't7-m-5', dayOfWeek: 7, session: 'morning', period: 5, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't7-a-1', dayOfWeek: 7, session: 'afternoon', period: 1, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't7-a-2', dayOfWeek: 7, session: 'afternoon', period: 2, subjectName: 'NNgữ', teacher: 'Trân', room: 'P.101' },
  { id: 't7-a-3', dayOfWeek: 7, session: 'afternoon', period: 3, subjectName: 'Hóa', teacher: 'Châm', room: 'P.101' },
  { id: 't7-a-4', dayOfWeek: 7, session: 'afternoon', period: 4, subjectName: 'Hóa', teacher: 'Châm', room: 'P.101' },
  { id: 't7-a-5', dayOfWeek: 7, session: 'afternoon', period: 5, subjectName: '', teacher: '' },
];

/**
 * Generate default lesson plans for a given week start date and optional timetable slots
 */
export function generateInitialLessonPlans(
  weekStartDateOrSlots: string | TimetableSlot[],
  weekStartDateStr?: string
): LessonPlan[] {
  let weekStartDate = typeof weekStartDateOrSlots === 'string' ? weekStartDateOrSlots : (weekStartDateStr || '2016-12-19');
  let slotsToUse = Array.isArray(weekStartDateOrSlots) ? weekStartDateOrSlots : INITIAL_TIMETABLE_SLOTS;

  const [y, m, d] = weekStartDate.split('-').map(Number);
  const monday = new Date(y, m - 1, d);

  // Subject counters for auto sequential lesson assignment
  const counters: Record<string, number> = {};

  return slotsToUse.filter(s => !!s.subjectName).map(slot => {
    const dayOffset = slot.dayOfWeek - 2; // T2 -> offset 0
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayOffset);

    const yearStr = targetDate.getFullYear();
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    // Find lesson in bank
    const subjName = slot.subjectName;
    if (!counters[subjName]) counters[subjName] = 1;
    const currentNum = counters[subjName];
    
    // Increment for main academic subjects
    if (!['Chào cờ', 'SHL'].includes(subjName)) {
      counters[subjName] += 1;
    }

    const subjLower = (subjName || '').toLowerCase();
    const matchedLesson = INITIAL_LESSONS_BANK.find(
      l => (l.subjectName || '').toLowerCase() === subjLower && l.lessonNumber === currentNum
    ) || INITIAL_LESSONS_BANK.find(
      l => (l.subjectName || '').toLowerCase() === subjLower
    );

    const planId = `plan-${dateStr}-${slot.session[0]}-${slot.period}`;

    return {
      id: planId,
      date: dateStr,
      dayOfWeek: slot.dayOfWeek,
      session: slot.session,
      period: slot.period,
      subjectName: slot.subjectName,
      teacher: slot.teacher,
      lessonId: matchedLesson?.id,
      lessonTitle: matchedLesson?.title || (subjName === 'Chào cờ' ? 'Chào cờ đầu tuần' : subjName === 'SHL' ? 'Sinh hoạt lớp cuối tuần' : `Tiết học ${subjName}`),
      summary: matchedLesson?.summary,
      keyPoints: matchedLesson?.keyPoints,
    };
  });
}

/**
 * High-quality sample mindmap SVG generator for instant test & beautiful demo
 */
export function createSampleMindmapSvg(title: string, subject: string, color: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSubj = subject.replace(/&/g, '&amp;');
  
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.1"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="550" rx="16" fill="url(#bg)"/>
  <rect width="784" height="534" x="8" y="8" rx="12" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6,6"/>

  <!-- Watermark badge -->
  <g transform="translate(620, 25)">
    <rect width="150" height="28" rx="14" fill="#e2e8f0"/>
    <text x="75" y="18" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">SƠ ĐỒ TƯ DUY 🧠</text>
  </g>

  <!-- Connectors from Center -->
  <path d="M 400 275 Q 300 200 200 160" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
  <path d="M 400 275 Q 500 200 600 160" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
  <path d="M 400 275 Q 300 350 200 390" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
  <path d="M 400 275 Q 500 350 600 390" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>

  <!-- Sub-branch lines -->
  <path d="M 200 160 Q 140 120 100 110" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  <path d="M 200 160 Q 140 180 100 190" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>

  <path d="M 600 160 Q 660 120 700 110" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
  <path d="M 600 160 Q 660 180 700 190" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>

  <path d="M 200 390 Q 140 360 100 350" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  <path d="M 200 390 Q 140 430 100 440" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>

  <path d="M 600 390 Q 660 360 700 350" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>
  <path d="M 600 390 Q 660 430 700 440" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>

  <!-- Sub-branch nodes (Leaf Nodes) -->
  <g transform="translate(40, 95)"><rect width="110" height="30" rx="8" fill="#eff6ff" stroke="${color}" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#1e3a8a" text-anchor="middle">Định nghĩa &amp; Ý nghĩa</text></g>
  <g transform="translate(40, 175)"><rect width="110" height="30" rx="8" fill="#eff6ff" stroke="${color}" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#1e3a8a" text-anchor="middle">Công thức trọng tâm</text></g>

  <g transform="translate(650, 95)"><rect width="110" height="30" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#065f46" text-anchor="middle">Dạng toán thường gặp</text></g>
  <g transform="translate(650, 175)"><rect width="110" height="30" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#065f46" text-anchor="middle">Phương pháp giải</text></g>

  <g transform="translate(40, 335)"><rect width="110" height="30" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#92400e" text-anchor="middle">Ví dụ minh họa</text></g>
  <g transform="translate(40, 425)"><rect width="110" height="30" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#92400e" text-anchor="middle">Lưu ý bẫy đề thi</text></g>

  <g transform="translate(650, 335)"><rect width="110" height="30" rx="8" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#5b21b6" text-anchor="middle">Ứng dụng thực tế</text></g>
  <g transform="translate(650, 425)"><rect width="110" height="30" rx="8" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="1.5"/><text x="55" y="19" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#5b21b6" text-anchor="middle">Tóm tắt ôn tập</text></g>

  <!-- Primary Branch Nodes -->
  <g transform="translate(130, 140)" filter="url(#shadow)">
    <rect width="140" height="40" rx="20" fill="${color}"/>
    <text x="70" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">1. LÝ THUYẾT GỐC</text>
  </g>

  <g transform="translate(530, 140)" filter="url(#shadow)">
    <rect width="140" height="40" rx="20" fill="#10b981"/>
    <text x="70" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">2. PHƯƠNG PHÁP</text>
  </g>

  <g transform="translate(130, 370)" filter="url(#shadow)">
    <rect width="140" height="40" rx="20" fill="#f59e0b"/>
    <text x="70" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">3. VÍ DỤ &amp; BẪY</text>
  </g>

  <g transform="translate(530, 370)" filter="url(#shadow)">
    <rect width="140" height="40" rx="20" fill="#8b5cf6"/>
    <text x="70" y="24" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">4. KẾT LUẬN</text>
  </g>

  <!-- Center Hub / Topic Node -->
  <g transform="translate(280, 220)" filter="url(#shadow)">
    <rect width="240" height="110" rx="24" fill="#ffffff" stroke="${color}" stroke-width="4"/>
    <rect width="70" height="22" x="85" y="12" rx="11" fill="${color}"/>
    <text x="120" y="27" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeSubj.toUpperCase()}</text>
    <text x="120" y="60" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a" text-anchor="middle">${safeTitle}</text>
    <text x="120" y="86" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="#64748b" text-anchor="middle">Tóm tắt kiến thức trọng tâm</text>
  </g>

  <!-- Student Signature Footer -->
  <text x="400" y="525" font-family="system-ui, sans-serif" font-size="11" font-style="italic" fill="#94a3b8" text-anchor="middle">Sơ đồ vẽ bởi học sinh Nguyễn Minh - Lớp 11A1-01</text>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Pre-generate some sample completed StudyRecords
 */
export function generateInitialStudyRecords(plans: LessonPlan[], customStudentName?: string): StudyRecord[] {
  const samplePlans = plans.filter(p => ['Toán', 'Văn', 'NNgữ', 'Lý', 'Hóa', 'Tin'].includes(p.subjectName)).slice(0, 6);

  return samplePlans.map((plan, idx) => {
    const color = idx % 2 === 0 ? '#2563eb' : '#7c3aed';
    return {
      id: `record-${plan.id}`,
      studentId: 'hs-101',
      studentName: customStudentName || 'Nguyễn Minh',
      lessonPlanId: plan.id,
      date: plan.date,
      dayOfWeek: plan.dayOfWeek,
      session: plan.session,
      period: plan.period,
      subjectName: plan.subjectName,
      lessonTitle: plan.lessonTitle || `Bài học ${plan.subjectName}`,
      mindmapImageUrl: createSampleMindmapSvg(plan.lessonTitle || plan.subjectName, plan.subjectName, color),
      mindmapTitle: `Sơ đồ tư duy ${plan.lessonTitle || plan.subjectName}`,
      studentNote: idx === 0 
        ? 'Em đã tóm tắt đầy đủ các công thức chính và lưu ý các dạng bài hay ra trong đề thi.' 
        : 'Em đã vẽ đủ 4 nhánh chính, phân biệt rõ các khái niệm và ví dụ minh họa.',
      submittedAt: new Date(Date.now() - (idx + 1) * 3600 * 1000 * 8).toISOString(),
      status: 'COMPLETED',
      parentFeedback: idx === 0 ? 'Con vẽ sơ đồ rất rõ ràng, logic tốt. Cố gắng phát huy nhé!' : undefined,
      parentReviewedAt: idx === 0 ? new Date().toISOString() : undefined,
    };
  });
}

/**
 * Initial sample documents for Document Hub
 */
export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-toan-1',
    title: 'Đề cương ôn tập Đại số & Giải tích 11 - Chương 1',
    subjectName: 'Toán',
    fileName: 'De_cuong_Dai_so_11_Chuong_1.pdf',
    fileSize: 1258291, // ~1.2 MB
    fileType: 'pdf',
    fileDataUrl: createSampleDocumentPreview(
      'Đề cương ôn tập Đại số & Giải tích 11 - Chương 1',
      'Toán',
      'Đề cương',
      'Tổng hợp lý thuyết Hàm số lượng giác, Phương trình lượng giác cơ bản, bảng công thức biến đổi và 50 bài tập trắc nghiệm có đáp án chi tiết.'
    ),
    category: 'exam',
    uploadedAt: '2026-08-20T08:30:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Thầy Nguyễn Đức Việt',
    description: 'Tài liệu ôn tập chính thức cho kỳ kiểm tra 1 tiết và thi giữa kỳ 1.',
    tags: ['Đại số', 'Lượng giác', 'Đề cương ôn tập', 'Kiểm tra 1 tiết'],
    lessonTitle: 'Bài 1: Hàm số lượng giác',
    downloadsCount: 42,
  },
  {
    id: 'doc-van-1',
    title: 'Slide phân tích văn bản: Bài ca ngất ngưởng (Nguyễn Công Trứ)',
    subjectName: 'Văn',
    fileName: 'Slide_Bai_ca_ngat_nguong.pptx',
    fileSize: 3450000,
    fileType: 'presentation',
    fileDataUrl: createSampleDocumentPreview(
      'Slide phân tích văn bản: Bài ca ngất ngưởng',
      'Văn',
      'Bài giảng',
      'Trình bày cấu trúc bài thơ, phong cách sống ngất ngưởng, hình ảnh nhà nho tài hoa và bản lĩnh phi thường của Nguyễn Công Trứ.'
    ),
    category: 'lecture',
    uploadedAt: '2026-08-22T09:15:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Cô Hường',
    description: 'Slide bài giảng điện tử hỗ trợ học sinh học trước và tóm tắt sơ đồ tư duy.',
    tags: ['Văn học trung đại', 'Nguyễn Công Trứ', 'Slide bài giảng'],
    lessonTitle: 'Bài 4: Bài ca ngất ngưởng (Nguyễn Công Trứ)',
    downloadsCount: 38,
  },
  {
    id: 'doc-nngu-1',
    title: 'Unit 1: The Generation Gap - Vocabulary & Grammar Mindmap',
    subjectName: 'NNgữ',
    fileName: 'Unit_1_Generation_Gap_Handout.pdf',
    fileSize: 840000,
    fileType: 'pdf',
    fileDataUrl: createSampleDocumentPreview(
      'Unit 1: The Generation Gap - Handout & Vocabulary List',
      'NNgữ',
      'Tài liệu tham khảo',
      'Full vocabulary list of Unit 1, modal verbs should/ought to/must/have to, and reading comprehension exercises.'
    ),
    category: 'handout',
    uploadedAt: '2026-08-23T14:00:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Cô Trân',
    description: 'Từ vựng trọng tâm và bài tập củng cố ngữ pháp Unit 1 Tiếng Anh 11.',
    tags: ['English 11', 'Unit 1', 'Generation Gap', 'Modal Verbs'],
    lessonTitle: 'Unit 1: The Generation Gap (Reading & Vocab)',
    downloadsCount: 56,
  },
  {
    id: 'doc-ly-1',
    title: 'Sổ tay công thức Điện tích & Điện trường (Vật lý 11)',
    subjectName: 'Lý',
    fileName: 'So_tay_cong_thuc_Vat_ly_11.pdf',
    fileSize: 2100000,
    fileType: 'pdf',
    fileDataUrl: createSampleDocumentPreview(
      'Sổ tay công thức Điện tích & Điện trường (Vật lý 11)',
      'Lý',
      'Tài liệu tham khảo',
      'Hệ thống toàn bộ công thức Định luật Cu-lông, Cường độ điện trường, Công của lực điện, Điện thế và Tụ điện.'
    ),
    category: 'reference',
    uploadedAt: '2026-08-24T10:00:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Thầy Sự',
    description: 'Sổ tay tra cứu nhanh phục vụ giải bài tập Vật lý.',
    tags: ['Vật lý 11', 'Điện trường', 'Công thức nhanh'],
    lessonTitle: 'Bài 1: Điện tích. Định luật Cu-lông',
    downloadsCount: 49,
  },
  {
    id: 'doc-hoa-1',
    title: 'Phiếu bài tập Sự điện li & Phản ứng trao đổi ion trong dung dịch',
    subjectName: 'Hóa',
    fileName: 'Phieu_bai_tap_Su_dien_li_Hoa_11.docx',
    fileSize: 450000,
    fileType: 'docx',
    fileDataUrl: createSampleDocumentPreview(
      'Phiếu bài tập Sự điện li & Phản ứng trao đổi ion trong dung dịch',
      'Hóa',
      'Bài tập về nhà',
      '30 bài tập tự luận và trắc nghiệm tính pH, xác định chất điện li mạnh/yếu, phương trình ion rút gọn.'
    ),
    category: 'assignment',
    uploadedAt: '2026-08-25T16:20:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Cô Châm',
    description: 'Bài tập bắt buộc hoàn thành trước thứ 6 tuần này.',
    tags: ['Hóa học 11', 'Sự điện li', 'Bài tập về nhà'],
    lessonTitle: 'Bài 1: Sự điện li',
    downloadsCount: 31,
  },
  {
    id: 'doc-tin-1',
    title: 'Giáo trình Lập trình Pascal / Python cơ bản Lớp 11',
    subjectName: 'Tin',
    fileName: 'Giao_trinh_Lap_trinh_Tin_11.pdf',
    fileSize: 4200000,
    fileType: 'pdf',
    fileDataUrl: createSampleDocumentPreview(
      'Giáo trình Lập trình Pascal / Python cơ bản Lớp 11',
      'Tin',
      'Bài giảng',
      'Cấu trúc rẽ nhánh if-else, vòng lặp for/while, mảng một chiều và các thuật toán sắp xếp tìm kiếm cơ bản.'
    ),
    category: 'lecture',
    uploadedAt: '2026-08-25T11:00:00.000Z',
    uploaderRole: 'admin',
    uploaderName: 'Cô Nga',
    description: 'Tài liệu hướng dẫn thực hành phòng máy tính.',
    tags: ['Tin học 11', 'Lập trình', 'Python', 'Cấu trúc lặp'],
    lessonTitle: 'Bài 1: Khái niệm về lập trình và ngôn ngữ lập trình',
    downloadsCount: 27,
  },
];

