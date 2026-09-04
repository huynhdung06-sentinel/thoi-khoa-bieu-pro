import React from 'react';
import { DocumentItem } from '../types';
import { 
  X, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink,
  BookOpen,
  Eye
} from 'lucide-react';
import { formatFileSize, triggerFileDownload } from '../utils/fileUtils';

interface DocumentPreviewModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !doc) return null;

  const handleDownload = () => {
    if (doc.fileDataUrl || doc.fileUrl) {
      triggerFileDownload(doc.fileName, doc.fileDataUrl || doc.fileUrl || '');
    }
  };

  const isImage = doc.fileType === 'image';
  const isHtmlOrPdf = doc.fileType === 'pdf' || doc.fileDataUrl?.startsWith('data:text/html');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1b1f2b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#181b24] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  {doc.subjectName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                  {doc.category === 'lecture' ? 'Bài giảng' : doc.category === 'assignment' ? 'Bài tập' : doc.category === 'exam' ? 'Đề cương' : 'Tài liệu'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  • {formatFileSize(doc.fileSize)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate" title={doc.title}>
                {doc.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Viewer & Metadata */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Viewer Area */}
          <div className="flex-1 bg-slate-100 dark:bg-[#12141c] p-2 sm:p-4 overflow-auto flex items-center justify-center">
            {isImage && doc.fileDataUrl ? (
              <img 
                src={doc.fileDataUrl} 
                alt={doc.title} 
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
            ) : isHtmlOrPdf && doc.fileDataUrl ? (
              <iframe 
                src={doc.fileDataUrl} 
                title={doc.title}
                className="w-full h-full min-h-[500px] border-0 rounded-xl bg-white shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-white dark:bg-[#1f2430] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {doc.fileName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Định dạng ({doc.fileType.toUpperCase()}) có thể được tải về và mở trên máy tính qua Word, PowerPoint hoặc ứng dụng mặc định.
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp về máy tính ({formatFileSize(doc.fileSize)})</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Details & Metadata */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181b24] p-4 overflow-y-auto space-y-4 shrink-0 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-[11px] text-slate-500">
                Thông tin tài liệu
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Tên tệp: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{doc.fileName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Người đăng: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.uploaderName || 'Giáo viên'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Ngày tải lên: </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {doc.lessonTitle && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                    <span className="block text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                      Bài học liên kết
                    </span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {doc.lessonTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {doc.description && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-[11px] text-slate-500">
                  Mô tả & Ghi chú
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                  {doc.description}
                </p>
              </div>
            )}

            {doc.tags && doc.tags.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Thẻ từ khóa</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
