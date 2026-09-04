/**
 * Fast File Utilities for Localhost / Client-side Document Handling
 */

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFileType(fileName: string, mimeType?: string): 'pdf' | 'docx' | 'image' | 'presentation' | 'sheet' | 'text' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType?.toLowerCase() || '';

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
  if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return 'docx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mime.includes('image/')) return 'image';
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'sheet';
  if (['txt', 'md', 'json', 'log'].includes(ext) || mime.includes('text/')) return 'text';
  return 'other';
}

/**
 * Read browser File into Base64 Data URL quickly
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Read browser File into Text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Trigger browser file download directly
 */
export function triggerFileDownload(
  fileNameOrDoc: string | { fileName: string; fileDataUrl?: string; title: string },
  dataUrlOrBlob?: string
) {
  let fileName = '';
  let url = '';

  if (typeof fileNameOrDoc === 'object') {
    fileName = fileNameOrDoc.fileName || `${fileNameOrDoc.title}.pdf`;
    url = fileNameOrDoc.fileDataUrl || `data:text/plain;charset=utf-8,${encodeURIComponent(fileNameOrDoc.title)}`;
  } else {
    fileName = fileNameOrDoc;
    url = dataUrlOrBlob || `data:text/plain;charset=utf-8,${encodeURIComponent(fileNameOrDoc)}`;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Create a mock sample document viewer URL or printable preview
 */
export function createSampleDocumentPreview(title: string, subject: string, category: string, summary: string): string {
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #f8fafc;
    }
    .doc-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1d4ed8;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="doc-card">
    <span class="badge">MÔN ${subject.toUpperCase()} • ${category.toUpperCase()}</span>
    <h1>${title}</h1>
    <div class="meta">Tài liệu học tập Lớp 11A1-01 • Trường THPT • Hệ thống số hóa Localhost</div>
    
    <div class="section-title">1. TÓM TẮT KIẾN THỨC TRỌNG TÂM</div>
    <p>${summary || 'Tài liệu tổng hợp các dạng bài tập, lý thuyết cốt lõi phục vụ ôn tập và làm bài tập trên lớp.'}</p>

    <div class="section-title">2. CÁC NỘI DUNG CHÍNH CẦN NẮM VỮNG</div>
    <ul>
      <li>Nắm chắc các định nghĩa, định lý và công thức biến đổi cơ bản.</li>
      <li>Vận dụng giải các bài tập rèn luyện từ cơ bản đến nâng cao.</li>
      <li>Tổng hợp kiến thức vào Sơ Đồ Tư Duy (Mindmap) để ghi nhớ dài hạn.</li>
    </ul>

    <div class="section-title">3. HƯỚNG DẪN ÔN TẬP & TỰ HỌC</div>
    <p>Học sinh đọc kỹ đề cương trước khi đến lớp. Sau mỗi bài học, hãy vẽ sơ đồ tư duy tóm tắt và nộp bài trên hệ thống để phụ huynh và thầy cô theo dõi tiến độ.</p>

    <div class="footer">Hệ thống Quản lý Tài liệu & Thời Khóa Biểu Học Tập © 2026</div>
  </div>
</body>
</html>
  `.trim();

  return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
}
