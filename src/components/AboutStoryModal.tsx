import React, { useState } from 'react';
import { X, Heart, ShieldCheck, Coffee, Mail, CheckCircle2, Copy, Send, HardDrive } from 'lucide-react';

interface AboutStoryModalProps {
  onClose: () => void;
}

export const AboutStoryModal: React.FC<AboutStoryModalProps> = ({ onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'privacy' | 'coffee'>('story');

  const feedbackEmail = 'huynhdung06@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(feedbackEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Simple & Clean Modal Header */}
        <div className="relative px-6 py-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Cute Flower Mascot Icon */}
            <div className="w-11 h-11 shrink-0 bg-amber-100 dark:bg-amber-950/60 rounded-2xl p-1.5 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M50 15 C55 2, 65 2, 68 15 C71 28, 59 38, 50 38 C41 38, 29 28, 32 15 C35 2, 45 2, 50 15 Z" fill="#FF4D4D" />
                <path d="M50 85 C55 98, 65 98, 68 85 C71 72, 59 62, 50 62 C41 62, 29 72, 32 85 C35 98, 45 98, 50 85 Z" fill="#FF4D4D" />
                <path d="M15 50 C2 55, 2 65, 15 68 C28 71, 38 59, 38 50 C38 41, 28 29, 15 32 C2 35, 2 45, 15 50 Z" fill="#FF4D4D" />
                <path d="M85 50 C98 55, 98 65, 85 68 C72 71, 62 59, 62 50 C62 41, 72 29, 85 32 C98 35, 98 45, 85 50 Z" fill="#FF4D4D" />
                <path d="M25 25 C15 15, 23 5, 34 16 C42 24, 38 36, 29 38 C23 39, 17 33, 25 25 Z" fill="#FF5E3A" />
                <path d="M75 25 C85 15, 77 5, 66 16 C58 24, 62 36, 71 38 C77 39, 83 33, 75 25 Z" fill="#FF5E3A" />
                <path d="M25 75 C15 85, 23 95, 34 84 C42 76, 38 64, 29 62 C23 61, 17 67, 25 75 Z" fill="#FF5E3A" />
                <path d="M75 75 C85 85, 77 95, 66 84 C58 76, 62 64, 71 62 C77 61, 83 67, 75 75 Z" fill="#FF5E3A" />
                <circle cx="50" cy="50" r="22" fill="#FFC72C" stroke="#E69500" strokeWidth="2" />
                <ellipse cx="42" cy="45" rx="3" ry="4" fill="#222" />
                <ellipse cx="58" cy="45" rx="3" ry="4" fill="#222" />
                <circle cx="43" cy="44" r="1" fill="#FFF" />
                <circle cx="59" cy="44" r="1" fill="#FFF" />
                <ellipse cx="37" cy="51" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.8" />
                <ellipse cx="63" cy="51" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.8" />
                <path d="M42 52 Q50 60 58 52" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Gửi Các Bạn & Quý Phụ Huynh 🌸
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chặng đường rèn luyện tính tự học & nuôi dưỡng tình yêu kiến thức
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-6 pt-2 gap-3 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`pb-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'story'
                ? 'text-orange-600 dark:text-orange-400 border-orange-500 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Câu chuyện & Mục đích</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bảo mật 100%</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coffee')}
            className={`pb-3 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'coffee'
                ? 'text-amber-600 dark:text-amber-400 border-amber-500 font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>Ủng hộ & Gửi Phản Hồi 💬</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'story' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Section 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  <span>💔</span>
                  <h3>1. Nỗi trăn trở của người làm cha mẹ</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Là một người phụ huynh, tôi từng trải qua khoảng thời gian bất lực khi thấy con bước vào năm học mới: con rất khó tập trung, học trước quên sau, kiến thức bị phân mảnh và rời rạc. Mỗi tối, căn nhà lại căng thẳng vì cha mẹ phải <strong>nhắc nhở, thúc giục con học bài liên tục</strong>. Tôi nhận ra rằng: Sự ép buộc không thể tạo nên sự tự giác, và học tập xao nhãng chỉ làm con thêm kiệt sức.
                </p>
              </div>

              {/* Section 2 */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">
                  <span>💡</span>
                  <h3>2. Ứng dụng này ra đời để làm gì?</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  Tôi tạo ra web app này với ba mục đích lớn nhất:
                </p>
                <ul className="space-y-2 pt-1 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">🌿</span>
                    <div>
                      <strong>Giải phóng cha mẹ:</strong> Cha mẹ không cần phải đóng vai "giám thị" thúc giục con mỗi tối. Ứng dụng tự động nhắc nhở, theo dõi và tạo thói quen tự giác học tập cho người dùng.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">📚</span>
                    <div>
                      <strong>Thư viện học tập cá nhân hóa:</strong> Nơi người học tự xây dựng kho kiến thức của riêng mình. Bằng công cụ <strong>tự sáng tạo HTML cá nhân hóa</strong>, người dùng có thể linh hoạt tích hợp các phương pháp học tập đỉnh cao như <strong>Pomodoro</strong> (học tập trung), <strong>Feynman</strong> (giải thích lại) hay <strong>Cornell</strong> (ghi chép thông minh).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">🗂️</span>
                    <div>
                      <strong>Truy xuất tài liệu cá nhân:</strong> Tìm kiếm, sắp xếp và quản lý tài liệu học tập một cách logic - trực quan nhất.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm sm:text-base">
                  <span>🎯</span>
                  <h3>3. Ai có thể sử dụng?</h3>
                </div>
                <p>Ứng dụng được thiết kế tối giản, linh hoạt và phù hợp với mọi lứa tuổi:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                    <span className="font-bold text-blue-600 dark:text-blue-400">🎒 Học sinh Cấp 1, 2, 3</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Rèn thói quen tự giác, quản lý thời khóa biểu và lưu giữ bài học cô đọng.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                    <span className="font-bold text-purple-600 dark:text-purple-400">🎓 Sinh viên Đại học</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Quản lý lịch trình, đồ án môn học và tài liệu nghiên cứu cá nhân chuyên nghiệp.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-base">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3>Cam kết Bảo mật & Tính riêng tư 100%</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Một điểm đặc biệt: <strong>Web app này chỉ cung cấp giao diện và công cụ xử lý.</strong>
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Toàn bộ dữ liệu (thời khóa biểu, ghi chú, tài liệu, bài giảng...) <strong>100% nằm trực tiếp trên thiết bị cá nhân của bạn</strong> (không lưu trữ trên bất kỳ máy chủ trung gian nào). Do đó, tính riêng tư và an toàn dữ liệu của bạn được đảm bảo tuyệt đối 100%.
                </p>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300/80 dark:border-emerald-800 flex items-start gap-3 mt-3">
                  <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200">💡 Lời khuyên quan trọng cho người dùng:</span>
                    <p>
                      Vì dữ liệu lưu hoàn toàn ở thiết bị của bạn, quý phụ huynh và các bạn hãy nhớ <strong>thường xuyên chủ động sao lưu (dùng nút Tải file dự phòng trong Cài đặt) về máy hoặc đưa lên Google Drive</strong>, để dễ dàng khôi phục lại khi cần cài lại máy hay chuyển sang thiết bị mới nhé!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coffee' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 space-y-4 text-center">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Coffee className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                    Tặng Tôi Một Ly Cà Phê ☕ – Duy Trì Tên Miền & Hosting
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sự ủng hộ nhỏ bé của bạn chính là nguồn động lực to lớn giúp tôi duy trì và phát triển trang web lâu dài.
                  </p>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto text-xs sm:text-sm">
                  Ứng dụng được cung cấp <strong>HOÀN TOÀN MIỄN PHÍ</strong>. Tuy nhiên, để duy trì <strong>Tên miền (Domain)</strong> và <strong>Hosting</strong> cho trang web hoạt động ổn định mỗi năm, hệ thống vẫn cần một khoản chi phí duy trì nhỏ.
                </p>

                {/* Email Feedback Contact Box */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto shadow-xs space-y-3 mt-4 text-left">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Gửi Phản Hồi & Ý Kiến Đóng Góp Của Bạn</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Mọi ý kiến đóng góp, thắc mắc hoặc câu hỏi về ứng dụng, bạn có thể gửi trực tiếp qua email:
                  </p>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="truncate font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {feedbackEmail}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                        title="Sao chép địa chỉ email"
                      >
                        {copiedEmail ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>

                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=huynhdung06@gmail.com&su=Ph%E1%BA%A3n%20h%E1%BB%93i%20v%E1%BB%81%20%E1%BB%A0ng%20d%E1%BB%A5ng%20Th%E1%BB%9Di%20kh%C3%B3a%20bi%E1%BB%83u"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Mail</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span>🌸</span>
            <span>Chúc bạn & gia đình luôn tìm thấy niềm vui trong học tập!</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-98 shrink-0"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

