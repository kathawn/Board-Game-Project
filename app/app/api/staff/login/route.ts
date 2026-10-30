import { loginStaff, STAFF_COOKIE } from "@/lib/auth/staff";

/** UC-13 (FR-ADM-01): đăng nhập nội bộ Staff/Admin — chỉ tài khoản thuộc bảng NhanVien. Phiên dùng cookie riêng
 * `staff_session`, không dùng chung với `session` của khách. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return Response.json({ error: "Vui lòng nhập email và mật khẩu." }, { status: 400 });
  }

  const result = await loginStaff(email, password);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  return Response.json(
    { ok: true, vaiTro: result.staff.vaiTro, hoTen: result.staff.hoTen },
    { headers: { "Set-Cookie": `${STAFF_COOKIE}=${result.token}; HttpOnly; Path=/; SameSite=Lax` } },
  );
}
