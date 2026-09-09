import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trash2, 
  Image as ImageIcon, 
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react';
import { LessonGalleryImage } from '../../types';
import { compressImageToDataUrl } from '../../utils/imageUtils';

interface CollageImageGalleryPanelProps {
  images: LessonGalleryImage[];
  onUpdateImages: (images: LessonGalleryImage[]) => void;
  workspaceMode: 'edit' | 'view';
  lessonTitle?: string;
  subjectName?: string;
}

const filterValidGalleryImages = (list: LessonGalleryImage[] | undefined): LessonGalleryImage[] => {
  if (!Array.isArray(list)) return [];
  return list.filter(img => 
    img && 
    typeof img.url === 'string' && 
    img.url.trim() !== '' &&
    !img.id?.startsWith('sample-') &&
    !img.url.includes('picsum.photos') &&
    !img.title?.includes('Ảnh Tiêu Điểm Lớn') &&
    !img.title?.includes('Ảnh 1 (Ảnh Tiêu Điểm Lớn)')
  );
};

export const CollageImageGalleryPanel: React.FC<CollageImageGalleryPanelProps> = ({
  images,
  onUpdateImages,
  lessonTitle = '',
}) => {
  const [imageList, setImageList] = useState<LessonGalleryImage[]>(() => {
    return filterValidGalleryImages(images);
  });

  // State xem ảnh phóng to (Pure React - Không phụ thuộc thư viện ngoài)
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ khi prop images từ ngoài thay đổi và tự động dọn sạch ảnh mẫu cũ
  useEffect(() => {
    const cleaned = filterValidGalleryImages(images);
    setImageList(cleaned);
    // Nếu trong dữ liệu truyền vào có ảnh mẫu cũ, tự động lưu lại danh sách sạch
    if (Array.isArray(images) && images.length > cleaned.length) {
      onUpdateImages(cleaned);
    }
  }, [images]);

  // Cập nhật danh sách ảnh và đẩy ra ngoài lưu trữ
  const updateAndPropagateImages = (newList: LessonGalleryImage[]) => {
    setImageList(newList);
    onUpdateImages(newList);
  };

  // Điều hướng ảnh phóng to
  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => {
      if (prev === null) return null;
      return prev > 0 ? prev - 1 : imageList.length - 1;
    });
  }, [imageList.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => {
      if (prev === null) return null;
      return prev < imageList.length - 1 ? prev + 1 : 0;
    });
  }, [imageList.length]);

  const handleCloseViewer = useCallback(() => {
    setActiveIdx(null);
  }, []);

  // Bắt phím bấm bàn phím (Mũi tên trái/phải và phím Esc)
  useEffect(() => {
    if (activeIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseViewer();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIdx, handleCloseViewer, handlePrev, handleNext]);

  // Xử lý nạp ảnh từ máy tính (Tự động nén dung lượng cao trước khi lưu vào JSON)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const newItems: LessonGalleryImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        // Nén ảnh với kích thước tối ưu (max width 1280px, chất lượng 0.8)
        const compressedDataUrl = await compressImageToDataUrl(file, 1280, 0.8);

        // Lấy kích thước thực tế của ảnh nén
        await new Promise<void>((resolve) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            newItems.push({
              id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
              url: compressedDataUrl,
              title: file.name.replace(/\.[^/.]+$/, ''),
              width: tempImg.naturalWidth || 1200,
              height: tempImg.naturalHeight || 900,
            });
            resolve();
          };
          tempImg.onerror = () => {
            newItems.push({
              id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
              url: compressedDataUrl,
              title: file.name.replace(/\.[^/.]+$/, ''),
              width: 1200,
              height: 900,
            });
            resolve();
          };
          tempImg.src = compressedDataUrl;
        });
      }

      if (newItems.length > 0) {
        updateAndPropagateImages([...imageList, ...newItems]);
      }
    } catch (err) {
      console.error('Lỗi khi nén ảnh:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xóa 1 ảnh
  const handleDeleteImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = imageList.filter(item => item.id !== id);
    updateAndPropagateImages(updated);
    if (activeIdx !== null && activeIdx >= updated.length) {
      setActiveIdx(updated.length > 0 ? updated.length - 1 : null);
    }
  };

  // Tải ảnh về máy
  const handleDownloadActiveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIdx === null || !imageList[activeIdx]) return;
    const current = imageList[activeIdx];
    const link = document.createElement('a');
    link.href = current.url;
    link.download = `${current.title || 'hinh-anh-bai-hoc'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeImage = activeIdx !== null ? imageList[activeIdx] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Khung nội dung chính */}
      <div className="bg-white dark:bg-[#151923] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs">
        
        {/* Thanh tiêu đề */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Thư Viện Ảnh Bố Cục Collage
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/80 dark:border-blue-800/80">
              {imageList.length} ảnh
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tự động nén siêu nhẹ (~100KB)</span>
          </div>
        </div>

        {lessonTitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Tư liệu hình ảnh & sơ đồ học tập: <strong className="text-slate-700 dark:text-slate-200">{lessonTitle}</strong>
          </p>
        )}

        {/* Khung Kéo Thả Upload - Tích hợp nén tự động */}
        <div
          id="dropzone"
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); if (!isCompressing) setIsDragOver(true); }}
          onDragOver={(e) => { e.preventDefault(); if (!isCompressing) setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (!isCompressing && e.dataTransfer) handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl py-5 px-4 text-center cursor-pointer transition-all mb-4 ${
            isCompressing
              ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 cursor-wait'
              : isDragOver
                ? 'border-blue-600 bg-blue-100/70 dark:bg-blue-950/50 scale-[1.01]'
                : 'border-blue-300 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400'
          }`}
        >
          {isCompressing ? (
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang nén &amp; tối ưu dung lượng ảnh...</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                ☁️ Kéo &amp; thả hình ảnh vào đây, hoặc <span className="text-blue-600 dark:text-blue-400 underline font-bold">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hệ thống tự động nén tối ưu dung lượng • Nhấp vào ảnh để phóng to
              </p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Lưới Ảnh Collage Grid */}
        {imageList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Chưa có hình ảnh nào trong bài học này.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Hãy bấm vào khung đám mây ở trên để tải ảnh lên (dung lượng sẽ được tự động nén siêu nhẹ).
            </p>
          </div>
        ) : (
          <div className="max-h-[580px] overflow-y-auto p-2.5 sm:p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr] auto-rows-[220px] gap-3">
            {imageList.map((img, index) => {
              const isFirst = index === 0;

              return (
                <div
                  key={img.id}
                  className={`relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 shadow-2xs ${
                    isFirst ? 'md:col-start-1 md:col-end-2 md:row-span-2' : ''
                  }`}
                >
                  {/* Khung ảnh - Click mở phóng to tức thì */}
                  <div
                    onClick={() => setActiveIdx(index)}
                    className="w-full h-full cursor-pointer relative select-none"
                    title="Bấm để xem ảnh phóng to"
                  >
                    <img
                      src={img.url}
                      alt={img.title || `Ảnh ${index + 1}`}
                      className="w-full h-full object-cover block transition-transform duration-200 ease-out group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Hiệu ứng hover phủ nhẹ */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-150 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/60 text-white rounded-full p-2 backdrop-blur-xs">
                        <ZoomIn className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-red-600 text-slate-600 hover:text-white dark:bg-slate-900/90 dark:hover:bg-red-600 dark:text-slate-300 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer z-10 active:scale-90"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Tiêu đề ảnh */}
                  {img.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-3 py-2 pointer-events-none">
                      <p className="text-[11px] font-semibold text-white truncate drop-shadow-xs">
                        {img.title}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ghi chú chân trang */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-blue-500" />
            <span>Nhấp vào bất kỳ bức ảnh nào để phóng to xem chi tiết rõ nét.</span>
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Dùng phím ← / → để chuyển ảnh, Esc để đóng
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🌟 PURE REACT LIGHTBOX - SIÊU NHANH, ĐƠN GIẢN, 100% KHÔNG BAO GIỜ KẸT     */}
      {/* ========================================================================= */}
      {activeImage && activeIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-9999 bg-black/92 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-150"
          onClick={handleCloseViewer}
        >
          {/* Thanh trên cùng: Tiêu đề + Đếm số ảnh + Nút Tải + Nút Đóng */}
          <div
            className="w-full px-4 py-3 flex items-center justify-between text-white bg-black/40 backdrop-blur-xs border-b border-white/10 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 truncate max-w-[70%]">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white font-mono">
                {activeIdx + 1} / {imageList.length}
              </span>
              <p className="text-sm font-semibold truncate text-slate-100">
                {activeImage.title || `Ảnh tư liệu ${activeIdx + 1}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadActiveImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-colors"
                title="Tải ảnh này về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tải về</span>
              </button>

              <button
                type="button"
                onClick={handleCloseViewer}
                className="p-2 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer active:scale-95"
                title="Đóng (Phím Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Vùng giữa: Nút Prev + Ảnh Phóng To + Nút Next */}
          <div className="relative flex-1 w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Nút Prev */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 z-20 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-xs transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
                title="Ảnh trước (Mũi tên trái ←)"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Ảnh Phóng To Chính */}
            <div
              className="max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage.url}
                alt={activeImage.title || 'Ảnh bài học'}
                className="max-w-[92vw] max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-150 select-none pointer-events-auto"
                draggable={false}
              />
            </div>

            {/* Nút Next */}
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 sm:right-6 z-20 p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-xs transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
                title="Ảnh tiếp theo (Mũi tên phải →)"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Dải ảnh nhỏ bên dưới (Thumbnail Strip) - Bấm chọn nhanh ảnh */}
          {imageList.length > 1 && (
            <div
              className="w-full py-2.5 px-4 bg-black/50 backdrop-blur-xs border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {imageList.map((thumb, idx) => (
                <button
                  key={thumb.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`h-12 w-16 sm:h-14 sm:w-20 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === activeIdx 
                      ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30' 
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumb.url}
                    alt={thumb.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
