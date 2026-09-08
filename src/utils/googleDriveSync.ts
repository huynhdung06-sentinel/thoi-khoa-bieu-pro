export interface DriveSyncResult {
  success: boolean;
  message: string;
  fileUrl?: string;
}

/**
 * Syncs the study data package to the user's Google Drive as a pure JSON file.
 * Overwrites the file if it already exists with the same name.
 * 
 * @param accessToken The OAuth2 access token for Google Drive API
 * @param fileName The target filename (e.g. "Tong_Hop_Kien_Thuc_Toan_9.json")
 * @param jsonData The data object to be stored
 */
export const syncDataToGoogleDrive = async (
  accessToken: string,
  fileName: string,
  jsonData: any
): Promise<DriveSyncResult> => {
  try {
    // 1. Search if the file already exists in the user's Drive (excluding trashed files)
    const query = `name='${fileName.replace(/'/g, "\\'")}' and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      if (searchRes.status === 401) {
        return { 
          success: false, 
          message: 'Hết hạn phiên xác thực Google Drive. Vui lòng thử đồng bộ lại để lấy mã truy cập mới.' 
        };
      }
      throw new Error(`Lỗi kiểm tra Google Drive: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    const fileContentString = JSON.stringify(jsonData, null, 2);

    if (existingFile) {
      // 2. File exists: Overwrite (Update contents) using Simple Upload
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: fileContentString,
      });

      if (!updateRes.ok) {
        throw new Error(`Lỗi ghi đè file trên Drive: ${updateRes.statusText}`);
      }

      return {
        success: true,
        message: 'Đã tự động cập nhật và ghi đè dữ liệu học tập mới nhất lên Google Drive của bạn!',
        fileUrl: `https://drive.google.com/file/d/${existingFile.id}/view`,
      };
    } else {
      // 3. File doesn't exist: Create new file using Multipart Upload
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const boundary = 'custom_sync_boundary_marker';
      const multipartBody = 
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=utf-8\r\n\r\n` +
        `${fileContentString}\r\n` +
        `--${boundary}--`;

      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!createRes.ok) {
        throw new Error(`Lỗi tạo file sao lưu mới trên Drive: ${createRes.statusText}`);
      }

      const createData = await createRes.json();
      return {
        success: true,
        message: 'Đã lưu tài liệu học tập của bạn lên Google Drive thành công!',
        fileUrl: `https://drive.google.com/file/d/${createData.id}/view`,
      };
    }
  } catch (error: any) {
    console.error('[Google Drive Sync Service Error]', error);
    return {
      success: false,
      message: `Không thể hoàn tất đồng bộ: ${error.message || 'Lỗi kết nối máy chủ Google'}`,
    };
  }
};
