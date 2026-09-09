@echo off
chcp 65001 > nul
title LOCAL DATA HUB - SERVER MÁY PHỤ HUYNH

echo ====================================================================
echo      CHƯƠNG TRÌNH KHỞI ĐỘNG LOCAL DATA HUB (MÁY CHA)
echo ====================================================================
echo.

:: 1. Kiểm tra xem máy tính đã cài đặt Node.js hay chưa
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI]: Không tìm thấy Node.js trên máy tính của bạn!
    echo.
    echo Để chạy server này rất đơn giản:
    echo 1. Hãy truy cập: https://nodejs.org
    echo 2. Tải bản "LTS (Khuyên dùng)" và cài đặt (chỉ mất 1 phút).
    echo 3. Sau khi cài xong, nhấp đúp lại vào file start-server.bat này!
    echo.
    echo ====================================================================
    pause
    exit /b 1
)

echo [1/2] Đã tìm thấy Node.js trên máy tính.
echo [2/2] Đang khởi động Server trên cổng 9090 (hoặc 9100, 9200)...
echo.

:: 2. Mở trình duyệt web sau 2 giây
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:9090"

echo ====================================================================
echo ⚠️  LƯU Ý QUAN TRỌNG: KHÔNG ĐƯỢC ĐÓNG CỬA SỔ NÀY!
echo 📌  Cửa sổ này đang duy trì Server để nhận bài từ máy của con.
echo 💡  Bạn có thể bấm dấu trừ (-) để thu nhỏ cửa sổ xuống thanh tác vụ.
echo ====================================================================
echo.

:RUN_SERVER
node server.js

:: Nếu server bị dừng vì bất kỳ lý do gì, giữ cửa sổ và tự động khởi động lại
echo.
echo ====================================================================
echo ⚠️  Server đã tạm dừng. Cửa sổ KHÔNG TẮT. Đang khởi động lại sau 3 giây...
echo ====================================================================
timeout /t 3 /nobreak >nul
goto RUN_SERVER

