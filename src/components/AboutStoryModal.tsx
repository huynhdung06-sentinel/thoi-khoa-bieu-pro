import React, { useState } from 'react';
import { X, Heart, ShieldCheck, Coffee, Mail, CheckCircle2, Copy, Send, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";

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
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-6xl h-[900px] max-h-[90vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
              🌸
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Gửi Các Bạn & Quý Phụ Huynh
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Chặng đường rèn luyện tính tự học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-8 gap-8 text-sm font-semibold text-slate-500 shrink-0">
          {[
            { id: 'story', label: 'Câu chuyện', icon: Heart },
            { id: 'privacy', label: 'Bảo mật', icon: ShieldCheck },
            { id: 'coffee', label: 'Ủng hộ', icon: Coffee },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 pt-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-slate-950 border-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-950'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-lg">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-950 text-base leading-relaxed">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'story' && (
                <div className="space-y-6">
                  {/* Section 1 */}
                  <div className="space-y-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 font-bold text-slate-950 text-xl">
                      <Heart className="w-6 h-6 text-indigo-600" />
                      <h3>1. Nỗi trăn trở của người làm cha mẹ</h3>
                    </div>
                    <p className="text-slate-950 max-w-4xl leading-relaxed">
                      Là một người phụ huynh, tôi từng trải qua khoảng thời gian bất lực khi thấy con bước vào năm học mới: con rất khó tập trung, học trước quên sau, kiến thức bị phân mảnh và rời rạc. Mỗi tối, căn nhà lại căng thẳng vì cha mẹ phải <strong>nhắc nhở, thúc giục con học bài liên tục</strong>. Tôi nhận ra rằng: Sự ép buộc không thể tạo nên sự tự giác, và học tập xao nhãng chỉ làm con thêm kiệt sức.
                    </p>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-2 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 font-bold text-slate-950 text-xl">
                      <Coffee className="w-6 h-6 text-indigo-600" />
                      <h3>2. Ứng dụng này ra đời để làm gì?</h3>
                    </div>
                    <p className="text-slate-950 max-w-4xl leading-relaxed">
                      Tôi tạo ra web app này với ba mục đích lớn nhất:
                    </p>
                    <ul className="space-y-3 pt-1">
                      <li className="flex items-start gap-4">
                        <span className="text-indigo-600 shrink-0 text-xl">🌿</span>
                        <div>
                          <strong className="text-slate-950">Giải phóng cha mẹ:</strong> Cha mẹ không cần phải đóng vai "giám thị" thúc giục con mỗi tối. Ứng dụng tự động nhắc nhở, theo dõi và tạo thói quen tự giác học tập cho người dùng.
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="text-indigo-600 shrink-0 text-xl">📚</span>
                        <div>
                          <strong className="text-slate-950">Thư viện học tập cá nhân hóa:</strong> Nơi người học tự xây dựng kho kiến thức của riêng mình. Bằng công cụ <strong>tự sáng tạo HTML cá nhân hóa</strong>, người dùng có thể linh hoạt tích hợp các phương pháp học tập đỉnh cao.
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="text-indigo-600 shrink-0 text-xl">🗂️</span>
                        <div>
                          <strong className="text-slate-950">Truy xuất tài liệu cá nhân:</strong> Tìm kiếm, sắp xếp và quản lý tài liệu học tập một cách logic - trực quan nhất.
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 font-bold text-slate-950 text-xl">
                      <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                      <h3>3. Ai có thể sử dụng?</h3>
                    </div>
                    <p className="text-slate-950 leading-relaxed">Ứng dụng được thiết kế tối giản, linh hoạt và phù hợp với mọi lứa tuổi:</p>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-bold text-indigo-950 text-lg">🎒 Học sinh Cấp 1, 2, 3</span>
                        <p className="text-base text-slate-950 mt-1">Rèn thói quen tự giác, quản lý thời khóa biểu.</p>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-bold text-indigo-950 text-lg">🎓 Sinh viên Đại học</span>
                        <p className="text-base text-slate-950 mt-1">Quản lý lịch trình, đồ án nghiên cứu.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-4 font-bold text-slate-950 text-2xl">
                      <ShieldCheck className="w-8 h-8 text-indigo-600" />
                      <h3>Cam kết Bảo mật & Tính riêng tư 100%</h3>
                    </div>
                    <p className="text-slate-950 leading-relaxed text-lg">
                      Một điểm đặc biệt: <strong>Web app này chỉ cung cấp giao diện và công cụ xử lý.</strong>
                    </p>
                    <p className="text-slate-950 leading-relaxed text-lg">
                      Toàn bộ dữ liệu <strong>100% nằm trực tiếp trên thiết bị cá nhân của bạn</strong> (không lưu trữ trên máy chủ).
                    </p>

                    <div className="p-6 bg-white rounded-2xl border border-slate-100 flex items-start gap-4 mt-4">
                      <HardDrive className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="text-lg text-slate-950 space-y-2">
                        <span className="font-bold text-indigo-950">💡 Lời khuyên quan trọng:</span>
                        <p>
                          Hãy nhớ <strong>thường xuyên chủ động sao lưu</strong> (dùng nút Tải file dự phòng trong Cài đặt) về máy hoặc đưa lên Google Drive, để dễ dàng khôi phục khi cần!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'coffee' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
                      <Coffee className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-950 text-2xl">
                        Tặng Tôi Một Ly Cà Phê ☕
                      </h3>
                      <p className="text-lg text-slate-600">
                        Sự ủng hộ của bạn giúp tôi duy trì trang web lâu dài.
                      </p>
                    </div>

                    <p className="text-slate-950 leading-relaxed max-w-xl mx-auto text-lg">
                      Ứng dụng hoàn toàn miễn phí. Tuy nhiên, để duy trì <strong>Tên miền & Hosting</strong> hàng năm, hệ thống vẫn cần một khoản chi phí nhỏ.
                    </p>

                    {/* Email Feedback Contact Box */}
                    <div className="p-6 bg-white rounded-3xl border border-slate-100 max-w-lg mx-auto space-y-4 mt-4 text-left">
                      <div className="flex items-center gap-3 font-bold text-slate-950 text-lg">
                        <Mail className="w-6 h-6 text-indigo-500" />
                        <span>Gửi Phản Hồi</span>
                      </div>

                      <p className="text-lg text-slate-600">
                        Mọi ý kiến đóng góp xin gửi về:
                      </p>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="truncate font-mono text-lg font-semibold text-slate-950">
                          {feedbackEmail}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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

