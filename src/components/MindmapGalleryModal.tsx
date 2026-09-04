import React, { useState } from 'react';
import { StudyRecord } from '../types';
import { 
  X, 
  Image as ImageIcon, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ZoomIn, 
  Calendar, 
  BookOpen 
} from 'lucide-react';

interface MindmapGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyRecords: StudyRecord[];
  onSelectRecord?: (record: StudyRecord) => void;
}

export const MindmapGalleryModal: React.FC<MindmapGalleryModalProps> = ({
  isOpen,
  onClose,
  studyRecords,
  onSelectRecord,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRecord, setPreviewRecord] = useState<StudyRecord | null>(null);

  if (!isOpen) return null;

  // Extract unique subjects from records
  const subjects = Array.from(new Set(studyRecords.map((r) => r.subjectName))).filter(Boolean);

  const filteredRecords = studyRecords.filter((r) => {
    if (!r.mindmapImageUrl || !r.mindmapImageUrl.trim()) return false;
    const matchesSubj = selectedSubject === 'all' || r.subjectName === selectedSubject;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.subjectName || '').toLowerCase().includes(q) ||
      (r.lessonTitle || '').toLowerCase().includes(q) ||
      (r.studentNote && r.studentNote.toLowerCase().includes(q));
    return matchesSubj && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-white dark:bg-[#1b1f2b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
              🖼️
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Bộ Sưu Tập Sơ Đồ Tư Duy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tổng hợp {studyRecords.length} sơ đồ tư duy đã hoàn thành của học sinh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/30">
          
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo môn hoặc bài học..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              Tất cả ({studyRecords.length})
            </button>
            {subjects.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

        </div>

        {/* Gallery Grid Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setPreviewRecord(rec)}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-700">
                    <img
                      src={rec.mindmapImageUrl}
                      alt={rec.lessonTitle}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-blue-600 shadow-md">
                        <ZoomIn className="w-5 h-5" />
                      </span>
                    </div>

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                      {rec.subjectName}
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {rec.lessonTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ngày học: {rec.date}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã xác nhận
                      </span>
                      {rec.parentFeedback && (
                        <span className="text-purple-600 dark:text-purple-400 font-medium truncate max-w-[100px]" title={rec.parentFeedback}>
                          💬 Đã duyệt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ImageIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">Chưa có sơ đồ tư duy nào phù hợp</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* Full Image Zoom Modal */}
      {previewRecord && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewRecord(null)}
        >
          <div className="max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center w-full mb-3 text-white">
              <div>
                <h4 className="font-extrabold text-base sm:text-lg">
                  {previewRecord.subjectName} — {previewRecord.lessonTitle}
                </h4>
                <p className="text-xs text-slate-400">
                  Học sinh: {previewRecord.studentName} • Ngày nộp: {new Date(previewRecord.submittedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewRecord.mindmapImageUrl}
                  download={`mindmap-${previewRecord.subjectName}-${previewRecord.lessonTitle}.png`}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
                  title="Tải ảnh về"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden p-2 max-h-[75vh] w-full flex items-center justify-center border border-slate-800">
              {previewRecord.mindmapImageUrl && (
                <img
                  src={previewRecord.mindmapImageUrl}
                  alt="Sơ đồ tư duy"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
