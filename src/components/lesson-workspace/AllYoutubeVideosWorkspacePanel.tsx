import React, { useState } from 'react';
import { 
  Youtube, 
  Play, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Copy, 
  Check, 
  Grid, 
  List, 
  Layout, 
  Maximize2, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Clock, 
  Sparkles,
  Search,
  CheckCircle2,
  Video,
  ListVideo
} from 'lucide-react';
import { YouTubeVideoItem } from '../InteractiveLessonWorkspaceModal';

interface AllYoutubeVideosWorkspacePanelProps {
  youtubeVideos: YouTubeVideoItem[];
  activeVideoId: string;
  onSetActiveVideoId: (id: string) => void;
  onAddNewVideo: (title: string, url: string, note?: string) => void;
  onUpdateVideo: (id: string, updatedData: Partial<YouTubeVideoItem>) => void;
  onDeleteVideo: (id: string) => void;
  onReorderVideos?: (newVideos: YouTubeVideoItem[]) => void;
  workspaceMode: 'edit' | 'view';
}

export const AllYoutubeVideosWorkspacePanel: React.FC<AllYoutubeVideosWorkspacePanelProps> = ({
  youtubeVideos,
  activeVideoId,
  onSetActiveVideoId,
  onAddNewVideo,
  onUpdateVideo,
  onDeleteVideo,
  onReorderVideos,
  workspaceMode,
}) => {
  // View layout mode: 'all_stream' (danh sách cuộn trình bày tất cả), 'grid' (lưới nhiều video), 'focus' (xem tập trung 1 video)
  const [viewLayout, setViewLayout] = useState<'all_stream' | 'grid' | 'focus'>('all_stream');
  
  // Modal / Form state for adding new video
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isBatchAddingOpen, setIsBatchAddingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [batchUrlsText, setBatchUrlsText] = useState('');
  
  // Search query in video list
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editNote, setEditNote] = useState('');
  
  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper to extract YouTube video ID and embed URL
  const getYoutubeVideoId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    const videoId = getYoutubeVideoId(url);
    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  };

  const getYoutubeThumbnail = (url: string): string => {
    const id = getYoutubeVideoId(url);
    if (id) {
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    return '';
  };

  // Filtered videos
  const filteredVideos = youtubeVideos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.note && v.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
    v.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeVideo = youtubeVideos.find(v => v.id === activeVideoId) || youtubeVideos[0] || null;

  // Handle single add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    onAddNewVideo(
      newTitle.trim() || `Video bài giảng ${youtubeVideos.length + 1}`,
      newUrl.trim(),
      newNote.trim()
    );
    setNewTitle('');
    setNewUrl('');
    setNewNote('');
    setIsAddingOpen(false);
  };

  // Handle batch add
  const handleBatchAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchUrlsText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let addedCount = 0;
    lines.forEach((line, idx) => {
      // Check if format is "Title | URL" or just URL
      let title = `Video ${youtubeVideos.length + idx + 1}`;
      let url = line;
      let note = '';

      if (line.includes('|')) {
        const parts = line.split('|');
        title = parts[0].trim() || title;
        url = parts[1].trim() || url;
        if (parts[2]) note = parts[2].trim();
      }

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        onAddNewVideo(title, url, note);
        addedCount++;
      }
    });

    setBatchUrlsText('');
    setIsBatchAddingOpen(false);
  };

  // Move video up/down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!onReorderVideos) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= youtubeVideos.length) return;

    const copy = [...youtubeVideos];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    onReorderVideos(copy);
  };

  // Copy link
  const handleCopyLink = (video: YouTubeVideoItem) => {
    navigator.clipboard.writeText(video.url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Start inline editing
  const startEditing = (video: YouTubeVideoItem) => {
    setEditingId(video.id);
    setEditTitle(video.title);
    setEditUrl(video.url);
    setEditNote(video.note || '');
  };

  const saveEditing = () => {
    if (editingId) {
      onUpdateVideo(editingId, {
        title: editTitle.trim() || 'Video bài giảng',
        url: editUrl.trim(),
        note: editNote.trim()
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6" id="all-youtube-videos-panel">
      {/* 🌟 TOOLBAR CHÈN LINK & CÀI ĐẶT DÀNH CHO TẤT CẢ (BAO GỒM CHẾ ĐỘ HỌC SINH) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200/80 dark:border-red-900/40">
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>{youtubeVideos.length} Video bài giảng</span>
          </div>

          {youtubeVideos.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm video bài giảng..."
                className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white w-40 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: Chèn Link & Dán Hàng Loạt */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Chèn 1 Link YouTube */}
          <button
            type="button"
            onClick={() => {
              setIsAddingOpen(!isAddingOpen);
              if (isBatchAddingOpen) setIsBatchAddingOpen(false);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
            title="Chèn thêm đường dẫn link YouTube bài giảng mới"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chèn Link YouTube</span>
          </button>

          {/* Nút Dán nhiều link */}
          <button
            type="button"
            onClick={() => {
              setIsBatchAddingOpen(!isBatchAddingOpen);
              if (isAddingOpen) setIsAddingOpen(false);
            }}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors"
            title="Dán nhanh nhiều link bài giảng cùng một lúc"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Dán nhiều link</span>
          </button>

          {/* Layout switcher */}
          {youtubeVideos.length > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewLayout('all_stream')}
                className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'all_stream' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Dạng cuộn đầy đủ"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'grid' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                title="Dạng lưới 2 cột"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ➕ FORM 1: THÊM 1 LINK VIDEO MỚI (DÀNH CHO TẤT CẢ)                       */}
      {/* ========================================================================= */}
      {isAddingOpen && (
        <form onSubmit={handleAddSubmit} className="p-5 bg-red-50/80 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800/80 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-red-900 dark:text-red-200 flex items-center gap-2 uppercase tracking-wide">
              <Youtube className="w-4 h-4 text-red-600" />
              <span>Chèn Video Bài Giảng YouTube Mới</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tiêu đề bài giảng (tùy chọn):
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Bài giảng lý thuyết / Giải bài tập mẫu..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Đường dẫn liên kết YouTube (URL) <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi chú & Mốc thời gian trọng tâm (Timestamps):
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              placeholder="VD: 01:20 - Khái niệm định luật / 05:40 - Công thức tính / 12:30 - Bài tập mẫu trích đề thi"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Lưu & Trình bày Video
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ⚡ FORM 2: DÁN HÀNG LOẠT NHIỀU LINK YOUTUBE (DÀNH CHO TẤT CẢ)            */}
      {/* ========================================================================= */}
      {isBatchAddingOpen && (
        <form onSubmit={handleBatchAddSubmit} className="p-5 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-md space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Dán nhanh danh sách nhiều Link YouTube (Mỗi dòng 1 link)</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsBatchAddingOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              Đóng
            </button>
          </div>

          <p className="text-xs text-amber-800 dark:text-amber-300">
            Mẹo: Bạn có thể dán theo định dạng <code>Tên bài giảng | https://youtube.com/watch?v=... | Ghi chú</code> hoặc chỉ cần dán các đường link YouTube.
          </p>

          <textarea
            value={batchUrlsText}
            onChange={(e) => setBatchUrlsText(e.target.value)}
            rows={4}
            placeholder={`Video 1: Lý thuyết | https://www.youtube.com/watch?v=... | 00:00 Giới thiệu\nVideo 2: Bài tập mẫu | https://www.youtube.com/watch?v=... | 02:00 Giải câu 1`}
            className="w-full p-3 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBatchAddingOpen(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Thêm tất cả các link
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 📺 BỐ CỤC 1: TRÌNH BÀY TẤT CẢ CÁC VIDEO (ALL-STREAM DOCUMENT FLOW)       */}
      {/* ========================================================================= */}
      {viewLayout === 'all_stream' && (
        <div className="space-y-8">
          {filteredVideos.length === 0 ? (
            <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-red-200 dark:border-red-900/60 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                <Youtube className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Chưa có liên kết Video YouTube cho bài học này
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Bạn có thể dán link video bài giảng từ YouTube để vừa học lý thuyết, vừa xem video minh họa trực tiếp ngay trong bài học.
                </p>
              </div>

              {/* Quick Input Bar right in Empty State */}
              <div className="max-w-xl mx-auto pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Dán đường link YouTube vào đây (https://...)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newUrl.trim()) {
                      alert('Vui lòng dán đường link YouTube.');
                      return;
                    }
                    onAddNewVideo(
                      newTitle.trim() || `Video bài giảng ${youtubeVideos.length + 1}`,
                      newUrl.trim(),
                      newNote.trim()
                    );
                    setNewTitle('');
                    setNewUrl('');
                    setNewNote('');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-sm transition-all hover:scale-102 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gắn Video Ngay</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mở form chèn chi tiết</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setIsBatchAddingOpen(true)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dán danh sách nhiều link</span>
                </button>
              </div>
            </div>
          ) : (
            filteredVideos.map((video, idx) => {
              const embedUrl = getYoutubeEmbedUrl(video.url);
              const isEditing = editingId === video.id;

              return (
                <div
                  key={video.id}
                  id={`video-card-${video.id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-red-200 dark:hover:border-red-900/50"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-850 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                        {idx + 1}
                      </span>
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 border rounded-lg w-full max-w-md"
                          placeholder="Tiêu đề video..."
                        />
                      ) : (
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{video.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 rounded-md">
                            YouTube Video
                          </span>
                        </h4>
                      )}
                    </div>

                    {/* Action buttons on card header */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(video)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                        title="Sao chép đường link YouTube"
                      >
                        {copiedId === video.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Đã chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Chép link</span>
                          </>
                        )}
                      </button>

                      {/* Open in YouTube */}
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg flex items-center gap-1 transition-colors"
                        title="Mở video trực tiếp trên tab YouTube mới"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở YouTube</span>
                      </a>

                      {/* Reorder Buttons */}
                      {onReorderVideos && youtubeVideos.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Di chuyển lên trên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === youtubeVideos.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Edit / Delete Buttons (Available in all modes) */}
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs transition-colors"
                        >
                          Lưu
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(video)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Sửa đường link, tiêu đề hoặc mốc thời gian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn gỡ video "${video.title}"?`)) {
                            onDeleteVideo(video.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Gỡ bỏ video bài giảng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline URL Editor */}
                  {isEditing && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-slate-600 dark:text-slate-300 w-24 shrink-0">Link URL:</span>
                        <input
                          type="text"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2">
                        <span className="font-bold text-slate-600 dark:text-slate-300 w-24 shrink-0 pt-1">Ghi chú & mốc giờ:</span>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={2}
                          placeholder="VD: 00:00 Giới thiệu / 03:15 Lý thuyết trọng tâm..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={saveEditing}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs"
                        >
                          Cập nhật video
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Embedded Video Player */}
                  <div className="p-4 sm:p-6 bg-slate-950">
                    <div className="w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800 flex items-center justify-center">
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400 space-y-2">
                          <Youtube className="w-12 h-12 text-red-500 mx-auto opacity-70" />
                          <p className="font-semibold text-sm">Đường dẫn YouTube không hợp lệ hoặc chưa được nạp.</p>
                          <p className="text-xs font-mono text-slate-500">{video.url}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Note & Timestamps section under video */}
                  {(video.note || workspaceMode === 'edit') && (
                    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Ghi chú nội dung & Mốc thời gian bài giảng
                          </h5>
                        </div>

                        {isEditing ? null : (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line border border-slate-200/70 dark:border-slate-700/60">
                            {video.note || (
                              <span className="text-slate-400 italic">
                                Chưa có ghi chú mốc thời gian cho video này. (Bấm nút sửa để bổ sung mốc thời gian giúp học sinh tra cứu nhanh).
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📺 BỐ CỤC 2: LƯỚI ĐA VIDEO (GRID VIEW)                                     */}
      {/* ========================================================================= */}
      {viewLayout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((video, idx) => {
            const embedUrl = getYoutubeEmbedUrl(video.url);

            return (
              <div
                key={video.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-6 h-6 rounded bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate" title={video.title}>
                      {video.title}
                    </h4>
                  </div>

                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded"
                    title="Mở tab mới"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Player */}
                <div className="aspect-video w-full bg-black">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={video.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      Không có video
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                <div className="p-3 bg-white dark:bg-slate-900 flex-1 flex flex-col justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                    {video.note || 'Chưa có ghi chú'}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(video)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === video.id ? 'Đã sao chép!' : 'Chép link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSetActiveVideoId(video.id);
                        setViewLayout('focus');
                      }}
                      className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <span>Xem toàn màn hình</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📺 BỐ CỤC 3: XEM TẬP TRUNG (FOCUS SINGLE PLAYER)                            */}
      {/* ========================================================================= */}
      {viewLayout === 'focus' && activeVideo && (
        <div className="space-y-4">
          {/* Active Player Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  {activeVideo.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeVideo)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === activeVideo.id ? 'Đã chép' : 'Chép link'}</span>
                </button>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở YouTube</span>
                </a>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-black">
              <div className="w-full max-w-5xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                {getYoutubeEmbedUrl(activeVideo.url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeVideo.url)!}
                    title={activeVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400">Không thể phát video.</div>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Ghi chú & Mốc thời gian</span>
              </h5>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {activeVideo.note || 'Không có ghi chú thêm cho video này.'}
              </p>
            </div>
          </div>

          {/* Playlist selector cards below */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chọn video khác trong danh sách bài học:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {youtubeVideos.map((vid, idx) => {
                const isSelected = vid.id === activeVideo.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => onSetActiveVideoId(vid.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/60 border-red-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-red-100 dark:bg-red-950 text-red-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {vid.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{vid.url}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
