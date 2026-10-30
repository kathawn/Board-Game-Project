import { requireStaff } from "@/lib/auth/staff";

/** Màn hình nội bộ gọi route này để biết đã đăng nhập chưa và vai trò là gì (để ẩn/hiện menu Admin). */
export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { email, hoTen, vaiTro } = auth.staff;
  return Response.json({ ok: true, email, hoTen, vaiTro });
}
