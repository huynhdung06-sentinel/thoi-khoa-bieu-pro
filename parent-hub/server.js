/**
 * LOCAL DATA HUB - PARENT SERVER (MÁY CHA)
 * ----------------------------------------------------
 * Tự động chạy trên cổng 9090 (hoặc tự động đổi sang 9100, 9200 nếu cổng bận).
 * Sử dụng 100% thư viện chuẩn của Node.js (KHÔNG CẦN npm install).
 * 
 * Chức năng:
 * 1. Nhận file JSON từ máy học sinh gửi qua mạng LAN (POST /api/upload)
 * 2. Lưu tự động vào thư mục ./backups/
 * 3. Bảng điều khiển phụ huynh xem danh sách và mở trực tiếp lên thoikhoabieu.pro.vn
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Danh sách các cổng ưu tiên theo yêu cầu
const PREFERRED_PORTS = [9090, 9100, 9200];
const BACKUP_DIR = path.join(__dirname, 'backups');

// Đảm bảo thư mục lưu trữ tồn tại
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Hàm lấy danh sách địa chỉ IP mạng nội bộ (LAN IPv4), ưu tiên mạng Wi-Fi / LAN gia đình
function getLanIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Chỉ lấy địa chỉ IPv4 thực sự không phải loopback (127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  // Ưu tiên đưa dải IP thông dụng của mạng gia đình (192.168.x.x, 10.x.x.x) lên vị trí đầu tiên
  addresses.sort((a, b) => {
    const isHomeA = a.startsWith('192.168.') || a.startsWith('10.');
    const isHomeB = b.startsWith('192.168.') || b.startsWith('10.');
    if (isHomeA && !isHomeB) return -1;
    if (!isHomeA && isHomeB) return 1;
    return 0;
  });

  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

// Xử lý tiêu đề CORS để trình duyệt máy con không bao giờ bị chặn
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Xử lý làm sạch tên file tiếng Việt để lưu trữ an toàn trên ổ đĩa
function sanitizeFileName(str) {
  if (!str) return 'HocSinh';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

// Hàm khởi tạo Server xử lý các yêu cầu
function createServerInstance(port) {
  const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    // Xử lý Preflight CORS Request (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. TRANG GIAO DIỆN CHÍNH CỦA PHỤ HUYNH (GET /)
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const indexPath = path.join(__dirname, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Không tìm thấy file index.html');
      }
      return;
    }

    // 2. API THÔNG TIN SERVER (GET /api/info)
    if (req.method === 'GET' && pathname === '/api/info') {
      const lanIps = getLanIpAddresses();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        status: 'online',
        port: port,
        lanIps: lanIps,
        uploadUrl: `http://${lanIps[0] || 'localhost'}:${port}/api/upload`,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // 3. API NHẬN FILE JSON TỪ MÁY HỌC SINH (POST /api/upload)
    if (req.method === 'POST' && pathname === '/api/upload') {
      const chunks = [];
      let totalSize = 0;
      const MAX_SIZE = 100 * 1024 * 1024; // Hỗ trợ tới 100MB cho dữ liệu có kèm ảnh bài tập

      req.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > MAX_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'File dữ liệu quá lớn (vượt quá 100MB)' }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        try {
          const bodyBuffer = Buffer.concat(chunks);
          const rawText = bodyBuffer.toString('utf-8');
          const jsonData = JSON.parse(rawText);

          // Trích xuất metadata để đặt tên file đẹp và dễ nhận biết
          const studentName = jsonData.classInfo?.studentName || jsonData.studentName || 'HocSinh';
          const className = jsonData.classInfo?.className || jsonData.className || 'LopHoc';
          
          const now = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s`;
          
          const cleanStudent = sanitizeFileName(studentName);
          const cleanClass = sanitizeFileName(className);
          const fileName = `${cleanStudent}_${cleanClass}_${timeStr}.json`;
          const filePath = path.join(BACKUP_DIR, fileName);

          // Ghi file JSON xuống ổ cứng của máy cha
          fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');

          console.log(`\n📥 [NHẬN DỮ LIỆU THÀNH CÔNG]`);
          console.log(`   - Học sinh: ${studentName} (${className})`);
          console.log(`   - Lưu tại: ${fileName}`);
          console.log(`   - Kích thước: ${(totalSize / 1024).toFixed(1)} KB\n`);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            message: 'Đã lưu dữ liệu bài học thành công lên máy cha!',
            fileName: fileName,
            size: totalSize,
            receivedAt: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Lỗi khi phân tích JSON:', err);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Định dạng JSON không hợp lệ: ' + err.message }));
        }
      });
      return;
    }

    // 4. API LẤY DANH SÁCH FILE JSON ĐÃ LƯU (GET /api/backups)
    if (req.method === 'GET' && pathname === '/api/backups') {
      try {
        const files = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => {
            const fullPath = path.join(BACKUP_DIR, f);
            const stats = fs.statSync(fullPath);
            
            let meta = { studentName: '', className: '', lessonCount: 0 };
            try {
              // Đọc lướt phần đầu file để lấy thông tin hiển thị
              const fileContent = fs.readFileSync(fullPath, 'utf-8');
              const parsed = JSON.parse(fileContent);
              meta.studentName = parsed.classInfo?.studentName || parsed.studentName || 'Học sinh';
              meta.className = parsed.classInfo?.className || parsed.className || '';
              meta.lessonCount = Array.isArray(parsed.lessons) ? parsed.lessons.length : 0;
            } catch (e) {
              // Bỏ qua lỗi đọc metadata nếu file lỗi cú pháp
            }

            return {
              fileName: f,
              sizeBytes: stats.size,
              createdAt: stats.mtime.toISOString(),
              studentName: meta.studentName,
              className: meta.className,
              lessonCount: meta.lessonCount
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, files: files }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
      return;
    }

    // 5. API TẢI HOẶC XEM CHI TIẾT FILE JSON (GET /api/backups/:filename)
    if (req.method === 'GET' && pathname.startsWith('/api/backups/')) {
      const fileName = path.basename(pathname.replace('/api/backups/', ''));
      const filePath = path.join(BACKUP_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Không tìm thấy file' }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `inline; filename="${fileName}"`
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 6. API XÓA FILE JSON (DELETE /api/backups/:filename)
    if (req.method === 'DELETE' && pathname.startsWith('/api/backups/')) {
      const fileName = path.basename(pathname.replace('/api/backups/', ''));
      const filePath = path.join(BACKUP_DIR, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: `Đã xóa file ${fileName}` }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'File không tồn tại' }));
      }
      return;
    }

    // Mặc định 404 cho các route khác
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Route không tồn tại');
  });

  return server;
}

// Hàm khởi động có cơ chế tự động thử cổng kế tiếp nếu bị bận
function startServerWithPortFallback(portsIndex = 0) {
  if (portsIndex >= PREFERRED_PORTS.length) {
    console.error(`\n❌ [LỖI]: Toàn bộ các cổng (${PREFERRED_PORTS.join(', ')}) đều đang bận! Vui lòng đóng bớt dịch vụ hoặc kiểm tra lại.`);
    process.exit(1);
  }

  const port = PREFERRED_PORTS[portsIndex];
  const server = createServerInstance(port);

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Cổng ${port} đang bận bởi một chương trình khác. Tự động chuyển sang cổng tiếp theo...`);
      startServerWithPortFallback(portsIndex + 1);
    } else {
      console.error('❌ Lỗi khởi động server:', err);
    }
  });

  server.once('listening', () => {
    const lanIps = getLanIpAddresses();
    const primaryIp = lanIps[0] || '127.0.0.1';

    console.log(`\n================================================================`);
    console.log(`🚀 [LOCAL DATA HUB - MÁY CHA ĐANG CHẠY THÀNH CÔNG]`);
    console.log(`================================================================`);
    console.log(`📍 CỔNG HOẠT ĐỘNG: ${port}`);
    console.log(`🌐 BẢNG ĐIỀU KHIỂN PHỤ HUYNH:`);
    console.log(`   👉 http://localhost:${port}`);
    console.log(`----------------------------------------------------------------`);
    console.log(`📤 ĐỊA CHỈ ĐỂ MÁY CON GỬI DỮ LIỆU QUA MẠNG LAN:`);
    lanIps.forEach(ip => {
      console.log(`   👉 http://${ip}:${port}/api/upload`);
    });
    console.log(`----------------------------------------------------------------`);
    console.log(`📁 Thư mục lưu file JSON: ${BACKUP_DIR}`);
    console.log(`================================================================\n`);
  });

  server.listen(port, '0.0.0.0');
}

// Bắt đầu khởi động
startServerWithPortFallback(0);
