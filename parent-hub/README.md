# 🏠 HƯỚNG DẪN SỬ DỤNG LOCAL DATA HUB (MÁY CHA)

Local Data Hub là trạm tiếp nhận dữ liệu bài học, hình ảnh và kết quả học tập từ máy của học sinh gửi về qua mạng Wi-Fi nội bộ gia đình mà không cần Internet, Gmail hay Zalo.

---

## 🚀 1. Cách Khởi Động (Chỉ 1 Cú Nhấp Chuột)

* **Trên Windows:** Nhấp đúp chuột vào file `start-server.bat`.
* **Hoặc mở Terminal/CMD tại thư mục này và gõ:**
  ```bash
  node server.js
  ```

Server sẽ tự động:
1. Chiếm cổng **9090** (nếu bận sẽ tự động chuyển sang **9100** hoặc **9200**).
2. Dò tìm địa chỉ IP mạng nội bộ của máy bạn (ví dụ: `192.168.1.15`).
3. Mở ngay trình duyệt bảng điều khiển tại: `http://localhost:9090`.

---

## 📡 2. Kết Nối Máy Con Với Máy Cha

1. Mở trang bảng điều khiển máy cha tại `http://localhost:9090`.
2. Bấm nút **[📋 Sao chép Link]** (ví dụ link có dạng: `http://192.168.1.15:9090/api/upload`).
3. Dán link này vào mục **"Gửi máy cha"** trên máy của con (hoặc lưu 1 lần duy nhất trên máy con).

---

## 📥 3. Nhận File & Mở Xem Trên thoikhoabieu.pro.vn

1. Khi học sinh trên máy tính bảng/laptop bấm **[ 📤 Gửi JSON ]**, file sẽ xuất hiện ngay trên Bảng điều khiển máy cha.
2. Tất cả các file JSON được lưu tự động trong thư mục:
   `parent-hub/backups/[Tên_Con]_[Lớp]_[Ngày_Giờ].json`
3. Phụ huynh bấm **[ 🚀 Mở trên thoikhoabieu.pro.vn ]** để xem ngay thời khóa biểu, mục lục bài học và hình ảnh bài làm của con!

---

## 💡 Ưu Điểm Kỹ Thuật

* **100% Node.js nguyên bản:** Không cần cài đặt bất kỳ thư viện npm bên ngoài nào.
* **Hỗ trợ CORS đầy đủ:** Máy con gửi dữ liệu từ bất kỳ thiết bị nào (Chrome, Safari, iPad, điện thoại...) đều thông suốt 100%.
* **Dung lượng lớn:** Hỗ trợ gói dữ liệu kèm ảnh bài tập lên đến 100MB.
