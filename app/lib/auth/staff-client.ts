/** Dùng ở các màn hình nội bộ (client): gọi API như fetch thường, nhưng 401 (chưa đăng nhập nội bộ hoặc phiên hết hạn
 * sau 30 phút không hoạt động — NFR-06) thì chuyển về /staff/login. Trả về phản hồi gốc để trang tự xử lý các lỗi khác. */
export async function staffFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/staff/login");
  }
  return response;
}
