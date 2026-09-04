import http.server
import socketserver
import webbrowser
from threading import Timer
import os
import shutil

PORT = 3000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve index_local.html as the index page
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index_local.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def log_message(self, format, *args):
        # Mute console logs to keep terminal clean
        pass

if __name__ == "__main__":
    # Ensure index_local.html exists by copying it from dist/index.html if needed
    if not os.path.exists("index_local.html"):
        if os.path.exists("dist/index.html"):
            shutil.copy("dist/index.html", "index_local.html")
            print("Đã sao chép file giao diện dist/index.html thành index_local.html")
        elif os.path.exists("index.html") and os.path.getsize("index.html") > 10000:
            # If the user renamed/moved something
            shutil.copy("index.html", "index_local.html")
        else:
            print("LỖI: Không tìm thấy file index_local.html hoặc dist/index.html. Vui lòng build dự án trước!")
            
    print(f"==================================================")
    print(f"   STUDY SCHEDULE - CHƯƠNG TRÌNH LỊCH HỌC TẬP      ")
    print(f"==================================================")
    print(f" Đang khởi chạy server tại: http://localhost:{PORT}")
    print(f" Đang tự động mở trình duyệt web...")
    print(f" Nhấn Ctrl+C để dừng server.")
    print(f"==================================================")
    
    # Automatically open web browser after 1 second
    Timer(1.0, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    
    # Allow port reuse to avoid 'Address already in use' errors
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nĐã dừng server.")
