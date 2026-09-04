import React, { useState, useRef } from 'react';
import { 
  Code, 
  Upload, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  FileCode, 
  Sparkles, 
  Trash2, 
  Eye, 
  FileText, 
  Check, 
  SlidersHorizontal,
  Layers,
  HelpCircle
} from 'lucide-react';
import { formatFileSize } from '../../utils/fileUtils';

interface EmbeddedHtmlWorkspacePanelProps {
  embeddedHtmlCode: string;
  embeddedHtmlFileName?: string;
  onUpdateEmbeddedHtml: (code: string, fileName?: string) => void;
  workspaceMode: 'edit' | 'view';
  onExtractHeadingsToToc?: (headings: { title: string; level: number }[]) => void;
}

// Sample interactive simulation HTML for physics/math/chemistry
const SAMPLE_SIMULATION_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mô phỏng Thí nghiệm Vật Lý 11 - Con Lắc Đơn Dao Động</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      max-width: 900px;
      width: 100%;
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 8px;
      text-align: center;
    }
    p.subtitle {
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .canvas-wrapper {
      position: relative;
      background: #020617;
      border: 2px solid #334155;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    canvas {
      display: block;
      width: 100%;
      height: 320px;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #1e293b;
      padding: 16px;
      border-radius: 14px;
      border: 1px solid #334155;
      margin-bottom: 20px;
    }
    .control-item label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 6px;
    }
    .control-item input[type=range] {
      width: 100%;
      cursor: pointer;
      accent-color: #38bdf8;
    }
    .control-val {
      font-size: 0.85rem;
      font-weight: bold;
      color: #f1f5f9;
      float: right;
    }
    .btn-group {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    button {
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; transform: scale(1.02); }
    .btn-secondary { background: #475569; color: white; }
    .btn-secondary:hover { background: #334155; }
    .metrics-bar {
      display: flex;
      justify-content: space-around;
      background: #0f172a;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #1e293b;
      text-align: center;
    }
    .metric-box div:first-child { font-size: 0.75rem; color: #64748b; font-weight: bold; }
    .metric-box div:last-child { font-size: 1.1rem; color: #4ade80; font-weight: 800; }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="sec-simulation-title">⚡ Mô Phỏng Tương Tác: Dao Động Con Lắc Đơn</h1>
    <p class="subtitle">Khảo sát chu kỳ T = 2π√(l/g) và động năng, thế năng trong trường trọng lực</p>

    <div class="canvas-wrapper">
      <canvas id="simCanvas" width="700" height="320"></canvas>
    </div>

    <div class="controls-grid">
      <div class="control-item">
        <label>Chiều dài dây l (m): <span id="lenVal" class="control-val">1.0 m</span></label>
        <input type="range" id="lenInput" min="0.3" max="2.0" step="0.05" value="1.0">
      </div>
      <div class="control-item">
        <label>Góc lệch ban đầu α₀ (°): <span id="angleVal" class="control-val">30°</span></label>
        <input type="range" id="angleInput" min="5" max="75" step="1" value="30">
      </div>
      <div class="control-item">
        <label>Gia tốc trọng trường g (m/s²): <span id="gVal" class="control-val">9.8 m/s²</span></label>
        <input type="range" id="gInput" min="1.6" max="24.8" step="0.2" value="9.8">
      </div>
    </div>

    <div class="btn-group">
      <button id="toggleBtn" class="btn-primary">▶ Bắt đầu Dao Động</button>
      <button id="resetBtn" class="btn-secondary">↺ Đặt lại vị trí</button>
    </div>

    <div class="metrics-bar">
      <div class="metric-box">
        <div>CHU KỲ LÝ THUYẾT (T)</div>
        <div id="metricT">2.01 s</div>
      </div>
      <div class="metric-box">
        <div>TẦN SỐ (f)</div>
        <div id="metricF">0.50 Hz</div>
      </div>
      <div class="metric-box">
        <div>VẬN TỐC CỰC ĐẠI (v_max)</div>
        <div id="metricV">1.62 m/s</div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    let isRunning = true;
    let lengthMeters = 1.0;
    let initialAngleDeg = 30;
    let gravity = 9.8;
    let currentAngle = initialAngleDeg * (Math.PI / 180);
    let angularVelocity = 0;
    let angularAcceleration = 0;
    const originX = 350;
    const originY = 30;
    const pixelsPerMeter = 120;
    let lastTime = performance.now();

    function updateMetrics() {
      const T = 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
      const f = 1 / T;
      const alpha0Rad = initialAngleDeg * (Math.PI / 180);
      const vmax = Math.sqrt(2 * gravity * lengthMeters * (1 - Math.cos(alpha0Rad)));
      
      document.getElementById('metricT').textContent = T.toFixed(2) + ' s';
      document.getElementById('metricF').textContent = f.toFixed(2) + ' Hz';
      document.getElementById('metricV').textContent = vmax.toFixed(2) + ' m/s';
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Ceiling Support
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(originX - 50, originY);
      ctx.lineTo(originX + 50, originY);
      ctx.stroke();

      // Anchor dot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(originX, originY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Bob Position
      const pixelLength = lengthMeters * pixelsPerMeter;
      const bobX = originX + pixelLength * Math.sin(currentAngle);
      const bobY = originY + pixelLength * Math.cos(currentAngle);

      // Rod
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Pendulum Bob
      const gradient = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, 18);
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(1, '#0284c7');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function animate(currentTime) {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isRunning && dt > 0 && dt < 0.1) {
        angularAcceleration = (-gravity / lengthMeters) * Math.sin(currentAngle);
        angularVelocity += angularAcceleration * dt;
        angularVelocity *= 0.9995; // light damping
        currentAngle += angularVelocity * dt;
      }

      draw();
      requestAnimationFrame(animate);
    }

    // Input Listeners
    document.getElementById('lenInput').addEventListener('input', (e) => {
      lengthMeters = parseFloat(e.target.value);
      document.getElementById('lenVal').textContent = lengthMeters.toFixed(2) + ' m';
      updateMetrics();
    });

    document.getElementById('angleInput').addEventListener('input', (e) => {
      initialAngleDeg = parseFloat(e.target.value);
      document.getElementById('angleVal').textContent = initialAngleDeg + '°';
      currentAngle = initialAngleDeg * (Math.PI / 180);
      angularVelocity = 0;
      updateMetrics();
    });

    document.getElementById('gInput').addEventListener('input', (e) => {
      gravity = parseFloat(e.target.value);
      document.getElementById('gVal').textContent = gravity.toFixed(1) + ' m/s²';
      updateMetrics();
    });

    document.getElementById('toggleBtn').addEventListener('click', () => {
      isRunning = !isRunning;
      document.getElementById('toggleBtn').textContent = isRunning ? '⏸ Tạm Dừng' : '▶ Tiếp Tục';
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      currentAngle = initialAngleDeg * (Math.PI / 180);
      angularVelocity = 0;
      isRunning = true;
      document.getElementById('toggleBtn').textContent = '⏸ Tạm Dừng';
    });

    updateMetrics();
    requestAnimationFrame(animate);
  </script>
</body>
</html>`;

export const EmbeddedHtmlWorkspacePanel: React.FC<EmbeddedHtmlWorkspacePanelProps> = ({
  embeddedHtmlCode,
  embeddedHtmlFileName,
  onUpdateEmbeddedHtml,
  workspaceMode,
  onExtractHeadingsToToc,
}) => {
  const [htmlViewMode, setHtmlViewMode] = useState<'preview' | 'code'>('preview');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [rawCodeInput, setRawCodeInput] = useState<string>(embeddedHtmlCode);
  const [showExtractedToast, setShowExtractedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop changes
  React.useEffect(() => {
    setRawCodeInput(embeddedHtmlCode);
  }, [embeddedHtmlCode]);

  // Handle Drag & Drop of .html / .htm file
  const handleHtmlFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type.includes('html')) {
      readAndSetHtmlFile(file);
    } else {
      alert('Vui lòng kéo thả file có định dạng .html hoặc .htm');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndSetHtmlFile(e.target.files[0]);
    }
  };

  const readAndSetHtmlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onUpdateEmbeddedHtml(content, file.name);
        setRawCodeInput(content);
        setIframeKey(Date.now());
      }
    };
    reader.readAsText(file);
  };

  // Load sample simulation HTML demo
  const handleLoadSampleSimulation = () => {
    if (embeddedHtmlCode && !confirm('Bạn có chắc muốn nạp mẫu Thí nghiệm Mô phỏng tương tác HTML5?')) {
      return;
    }
    onUpdateEmbeddedHtml(SAMPLE_SIMULATION_HTML, 'thi_nghiem_con_lac_don_mo_phong.html');
    setRawCodeInput(SAMPLE_SIMULATION_HTML);
    setIframeKey(Date.now());
  };

  // Download HTML file to computer
  const handleDownloadHtmlFile = () => {
    if (!embeddedHtmlCode) return;
    const blob = new Blob([embeddedHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = embeddedHtmlFileName || 'bai-hoc-tuong-tac.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Extract headings (H1, H2, H3) and send to TOC
  const handleExtractHeadings = () => {
    if (!embeddedHtmlCode || !onExtractHeadingsToToc) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(embeddedHtmlCode, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3, h4');
      const list: { title: string; level: number }[] = [];

      headings.forEach(h => {
        const text = h.textContent?.trim();
        if (text) {
          const tag = h.tagName.toLowerCase();
          const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
          list.push({ title: text, level });
        }
      });

      if (list.length > 0) {
        onExtractHeadingsToToc(list);
        setShowExtractedToast(true);
        setTimeout(() => setShowExtractedToast(false), 2400);
      } else {
        alert('Không tìm thấy thẻ tiêu đề <h1>, <h2> hoặc <h3> trong file HTML này.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`h-full flex flex-col space-y-3 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4' : ''}`}>
      
      {/* 🌟 1. TOOLBAR THANH CÔNG CỤ NHÚNG HTML */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: File Info & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <Code className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                {embeddedHtmlFileName || (embeddedHtmlCode ? 'File HTML nhúng tùy chỉnh' : 'Chưa có file HTML nào được nhúng')}
              </h4>
              {embeddedHtmlCode && (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                  {formatFileSize(new Blob([embeddedHtmlCode]).size)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Kéo thả trực tiếp file <code className="text-emerald-500 font-mono">.html</code> vào khung bên dưới để nhúng bài giảng tương tác / thí nghiệm mô phỏng.
            </p>
          </div>
        </div>

        {/* Right: Actions & View Modes */}
        <div className="flex items-center flex-wrap gap-2">
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Nút Tải file HTML lên */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
            title="Tải lên file HTML (.html) từ máy tính hoặc thiết bị của bạn"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải file HTML lên</span>
          </button>

          {embeddedHtmlCode && (
            <>
              {/* Switch Preview vs Code */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setHtmlViewMode('preview')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    htmlViewMode === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Trình bày</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlViewMode('code')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    htmlViewMode === 'code'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Mã nguồn</span>
                </button>
              </div>

              {/* Reload Iframe */}
              <button
                type="button"
                onClick={() => setIframeKey(Date.now())}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                title="Làm mới trình chiếu"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Download HTML */}
              <button
                type="button"
                onClick={handleDownloadHtmlFile}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                title="Tải file HTML về máy"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Clear / Delete */}
              {workspaceMode === 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa file HTML nhúng này?')) {
                      onUpdateEmbeddedHtml('', '');
                      setRawCodeInput('');
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  title="Xóa file HTML này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🌟 2. KHUNG TRÌNH BÀY HOẶC KÉO THẢ FILE HTML */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleHtmlFileDrop}
        className={`flex-1 rounded-2xl border overflow-hidden flex flex-col relative transition-all min-h-[460px] ${
          isDragOver 
            ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/20' 
            : 'border-slate-300 dark:border-slate-800 bg-slate-900'
        }`}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 bg-emerald-500/15 backdrop-blur-[2px] border-2 border-dashed border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-emerald-300 pointer-events-none space-y-2">
            <Upload className="w-12 h-12 animate-bounce text-emerald-400" />
            <p className="font-extrabold text-base text-white">Thả file .html vào đây để nhúng và trình bày ngay lập tức!</p>
          </div>
        )}

        {/* Case 1: Has HTML and Preview mode */}
        {embeddedHtmlCode && htmlViewMode === 'preview' ? (
          <iframe
            key={iframeKey}
            srcDoc={embeddedHtmlCode}
            title="Embedded HTML Interactive Presentation"
            className="w-full h-full border-0 bg-white dark:bg-slate-950 flex-1 min-h-[460px]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : embeddedHtmlCode && htmlViewMode === 'code' ? (
          /* Case 2: Has HTML and Code View / Edit mode */
          <div className="flex-1 flex flex-col bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <FileCode className="w-4 h-4" /> Mã nguồn HTML ({rawCodeInput.length} ký tự)
              </span>
              {workspaceMode === 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateEmbeddedHtml(rawCodeInput, embeddedHtmlFileName || 'custom.html');
                    setHtmlViewMode('preview');
                    setIframeKey(Date.now());
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Cập nhật & Xem ngay</span>
                </button>
              )}
            </div>
            <textarea
              value={rawCodeInput}
              onChange={(e) => setRawCodeInput(e.target.value)}
              disabled={workspaceMode !== 'edit'}
              className="w-full flex-1 font-mono text-xs p-4 bg-slate-900 text-emerald-300 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[380px] leading-relaxed resize-none"
              placeholder="Dán hoặc chỉnh sửa mã HTML tại đây..."
            />
          </div>
        ) : (
          /* Case 3: Empty state - Drag & drop prompt */
          <div 
            onClick={() => workspaceMode === 'edit' && fileInputRef.current?.click()}
            className={`h-full flex flex-col items-center justify-center p-8 text-center space-y-4 ${
              workspaceMode === 'edit' ? 'cursor-pointer hover:bg-slate-800/50' : ''
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Code className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="font-extrabold text-base text-slate-100">
                Kéo thả file .html hoặc Bấm để tải lên
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hỗ trợ các file bài giảng web, mô phỏng thí nghiệm tương tác (HTML5/Canvas/JavaScript), tài liệu HTML chuẩn hóa.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-102"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn file .html từ máy</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showExtractedToast && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4" />
          <span>Đã trích xuất & gán các tiêu đề vào Mục Lục bên trái!</span>
        </div>
      )}
    </div>
  );
};
