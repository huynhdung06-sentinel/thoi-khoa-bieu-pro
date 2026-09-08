import React from 'react';
import { X, Calendar, BookOpen, Sparkles, NotebookPen, Send } from 'lucide-react';

interface AboutStoryModalProps {
  onClose: () => void;
}

export const AboutStoryModal: React.FC<AboutStoryModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl border border-blue-100">
              📖
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950 leading-tight">
                Hướng Dẫn & Tính Năng Hệ Thống
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Cẩm nang sử dụng ứng dụng học tập hiệu quả
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800 text-base leading-relaxed">
          <div className="space-y-4">
            
            {/* Item 1 */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/80 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-base">1. Thời khóa biểu online</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Quản lý và cập nhật thời khóa biểu linh hoạt, trực quan ngay trên nền tảng trực tuyến giúp học sinh dễ dàng theo dõi lịch học mỗi ngày.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-base">2. Môn học đính kèm theo môn và ngày thuận tiện</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Mỗi môn học được sắp xếp gọn gàng theo từng ngày trong tuần, đính kèm tài liệu và bài tập tương ứng để dễ dàng ôn tập.
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100/80 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-base">3. Sáng tạo - Lưu trữ các file bài học theo chương trình</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Công cụ hỗ trợ lưu trữ và sáng tạo nội dung bài học phong phú theo đúng chuẩn chương trình học tập hiện hành.
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100/80 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-base">4. Sổ tay học tập chuyên nghiệp</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ghi chép và quản lý tiến độ khoa học, giúp học sinh tập trung tối đa, tránh việc xao nhãng hay quên bài tập.
                </p>
              </div>
            </div>

            {/* Item 5 */}
            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100/80 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Send className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-base">5. Gửi cho cha mẹ xem quá trình học tập</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Dễ dàng chia sẻ hoặc gửi tiến độ, kết quả học tập rèn luyện mỗi ngày để phụ huynh nắm bắt và đồng hành cùng con.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500 font-medium">
            💡 Chúc bạn rèn luyện và đạt kết quả học tập xuất sắc!
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
