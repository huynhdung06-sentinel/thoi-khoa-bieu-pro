import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudUpload, 
  Trash2, 
  Image as ImageIcon, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Layers,
  ZoomIn
} from 'lucide-react';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/dist/photoswipe.css';
import { LessonGalleryImage } from '../../types';

// Danh sách ảnh mẫu khởi tạo theo đúng mẫu HTML người dùng cung cấp
const DEFAULT_SAMPLE_IMAGES: LessonGalleryImage[] = [
  {
    id: 'sample-1',
    url: 'https://picsum.photos/1200/1600?image=1050',
    title: 'Ảnh 1 (Ảnh Tiêu Điểm Lớn)',
    width: 1200,
    height: 1600,
  },
  {
    id: 'sample-2',
    url: 'https://picsum.photos/1600/1000?image=1015',
    title: 'Ảnh 2',
    width: 1600,
    height: 1000,
  },
  {
    id: 'sample-3',
    url: 'https://picsum.photos/1600/1000?image=1039',
    title: 'Ảnh 3',
    width: 1600,
    height: 1000,
  },
  {
    id: 'sample-4',
    url: 'https://picsum.photos/1600/1000?image=1043',
    title: 'Ảnh 4',
    width: 1600,
    height: 1000,
  },
  {
    id: 'sample-5',
    url: 'https://picsum.photos/1600/1000?image=1056',
    title: 'Ảnh 5',
    width: 1600,
    height: 1000,
  },
];

interface CollageImageGalleryPanelProps {
  images: LessonGalleryImage[];
  onUpdateImages: (images: LessonGalleryImage[]) => void;
  workspaceMode: 'edit' | 'view';
  lessonTitle?: string;
  subjectName?: string;
}

export const CollageImageGalleryPanel: React.FC<CollageImageGalleryPanelProps> = ({
  images,
  onUpdateImages,
  workspaceMode,
  lessonTitle = '',
  subjectName = '',
}) => {
  const [imageList, setImageList] = useState<LessonGalleryImage[]>(() => {
    if (images && images.length > 0) return images;
    return DEFAULT_SAMPLE_IMAGES;
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  // Đồng bộ khi prop images từ ngoài thay đổi
  useEffect(() => {
    if (images && images.length > 0) {
      setImageList(images);
    }
  }, [images]);

  // 🟢 1. Khởi tạo PhotoSwipe (Tốc độ mở nhanh 150ms) - Theo đúng mẫu HTML chuẩn
  useEffect(() => {
    if (imageList.length === 0) return;

    const lightbox = new PhotoSwipeLightbox({
      gallery: '#gallery',
      children: 'a',
      pswpModule: () => import('photoswipe'),
      showAnimationDuration: 150,
      hideAnimationDuration: 150,
      zoomAnimationDuration: 150,
      // Đảm bảo background đủ mờ và hỗ trợ zoom chuẩn
      bgOpacity: 0.94,
      wheelToZoom: true,
    });

    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightbox.destroy();
      lightboxRef.current = null;
    };
  }, [imageList]);

  // Hàm cập nhật danh sách ảnh và đẩy ra ngoài lưu trữ
  const updateAndPropagateImages = (newList: LessonGalleryImage[]) => {
    setImageList(newList);
    onUpdateImages(newList);
  };

  // 🟢 2. Xử lý đọc tệp ảnh và tự động lấy kích thước tự nhiên naturalWidth / naturalHeight
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: LessonGalleryImage[] = [];
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    let processedCount = 0;

    validFiles.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        if (!imgUrl) return;

        const tempImg = new Image();
        tempImg.onload = () => {
          newItems.push({
            id: `img-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            url: imgUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
            width: tempImg.naturalWidth || 1200,
            height: tempImg.naturalHeight || 900,
          });

          processedCount++;
          if (processedCount === validFiles.length) {
            updateAndPropagateImages([...imageList, ...newItems]);
          }
        };

        tempImg.src = imgUrl;
      };

      reader.readAsDataURL(file);
    });
  };

  // Xóa 1 ảnh khỏi thư viện
  const handleDeleteImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = imageList.filter(item => item.id !== id);
    updateAndPropagateImages(updated);
  };

  // Khôi phục về bộ ảnh mẫu ban đầu
  const handleResetToDefaultSamples = () => {
    updateAndPropagateImages(DEFAULT_SAMPLE_IMAGES);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* 📦 Khung bọc ứng dụng (Theo đúng CSS .gallery-card) */}
      <div className="bg-white dark:bg-[#151923] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        
        {/* Tiêu đề & Công cụ phụ trợ */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <span>📸</span>
            <span>Thư Viện Ảnh Bố Cục Collage</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/80 dark:border-blue-800/80">
              {imageList.length} bức ảnh
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaultSamples}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer transition-all active:scale-95 shadow-2xs"
              title="Khôi phục lại 5 ảnh mẫu của thư viện Collage"
            >
              <RotateCcw className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>Nạp lại ảnh mẫu</span>
            </button>
          </div>
        </div>

        {lessonTitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Tư liệu minh họa, bản đồ & sơ đồ trực quan cho bài học: <strong className="text-slate-700 dark:text-slate-200">{lessonTitle}</strong>
          </p>
        )}

        {/* ➖ Đường gạch ngăn cách (divider) */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-4" />

        {/* ☁️ Khung Kéo & Thả Upload Ảnh (Dropzone Area) */}
        <div
          id="dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (e.dataTransfer) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          className={`border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition-all duration-200 mb-5 ${
            isDragOver
              ? 'border-blue-600 bg-blue-100/70 dark:bg-blue-950/50 scale-[1.01] shadow-md'
              : 'border-blue-400/80 dark:border-blue-700/80 bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-500 hover:-translate-y-0.5 hover:shadow-xs'
          }`}
        >
          <div className="text-4xl mb-2 select-none">☁️</div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0">
            Kéo &amp; thả hình ảnh vào đây, hoặc <span className="text-blue-600 dark:text-blue-400 underline font-bold">chọn từ máy tính</span>
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hỗ trợ các định dạng: PNG, JPG, WEBP (Tự động canh chỉnh kích thước sắc nét khi phóng to)
          </div>
          <input
            type="file"
            ref={fileInputRef}
            id="imageUploader"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* ➖ Đường gạch ngăn cách (divider) */}
        <hr className="border-t border-slate-200 dark:border-slate-800 my-4" />

        {/* 🖼️ Khung Lưới Hiển Thị Gallery (Collage Grid: 1 ô lớn bên trái + các ô nhỏ bên phải) */}
        {imageList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Chưa có hình ảnh nào trong thư viện bài học này.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Hãy bấm vào khung đám mây ở trên để tải ảnh lên hoặc bấm &quot;Nạp lại ảnh mẫu&quot;.
            </p>
          </div>
        ) : (
          <div
            id="gallery"
            className="pswp-gallery-grid max-h-[540px] overflow-y-auto p-2.5 sm:p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr] auto-rows-[220px] gap-3"
          >
            {imageList.map((img, index) => {
              // 👑 Ảnh đầu tiên: Ô lớn bên trái chiếm 2 hàng
              const isFirst = index === 0;

              return (
                <a
                  key={img.id}
                  href={img.url}
                  data-pswp-width={img.width || 1200}
                  data-pswp-height={img.height || 900}
                  target="_blank"
                  rel="noreferrer"
                  className={`relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 shadow-2xs block cursor-zoom-in ${
                    isFirst ? 'md:col-start-1 md:col-end-2 md:row-span-2' : ''
                  }`}
                  title={img.title || `Ảnh ${index + 1} - Bấm để phóng to`}
                >
                  <img
                    src={img.url}
                    alt={img.title || `Ảnh ${index + 1}`}
                    className="w-full h-full object-cover block transition-transform duration-300 ease-out group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Lớp phủ biểu tượng kính lúp phóng to khi hover */}
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="p-2 rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-xs flex items-center gap-1.5 text-xs font-bold">
                      <ZoomIn className="w-4 h-4 text-blue-600" />
                      <span className="hidden sm:inline">Phóng to</span>
                    </div>
                  </div>

                  {/* Nhãn tiêu đề ảnh góc dưới */}
                  {img.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 via-black/30 to-transparent px-2.5 py-1.5 pointer-events-none">
                      <p className="text-[11px] font-semibold text-white truncate drop-shadow-xs">
                        {img.title}
                      </p>
                    </div>
                  )}
                  
                  {/* Nút xóa ảnh (Chỉ hiển thị ở chế độ edit) */}
                  {workspaceMode === 'edit' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteImage(img.id, e);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 hover:bg-red-600 text-slate-600 hover:text-white dark:bg-slate-900/90 dark:hover:bg-red-600 dark:text-slate-300 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer z-10 active:scale-90"
                      title="Xóa bức ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* Hướng dẫn thao tác cho học sinh */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-blue-500" />
            <span>Bấm vào bất kỳ ảnh nào để mở chế độ phóng to, cuộn chuột hoặc vuốt để xem chi tiết.</span>
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
            Powered by PhotoSwipe v5
          </span>
        </div>

      </div>

    </div>
  );
};
