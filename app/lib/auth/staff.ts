import { randomBytes } from "node:crypto";
import { getPrisma } from "../db/client";
import { hashPassword, verifyPassword } from "./auth";

/** UC-13 (FR-ADM-01, BR-11): đăng nhập nội bộ Staff/Admin, xác thực theo bảng NhanVien — hoàn toàn tách khỏi phiên
 * của khách (cookie `session`, bảng KhachHang), nên tài khoản khách không thể vào khu vực nội bộ. Phiên nằm trong bộ
 * nhớ như phiên khách (chưa có bảng Session trong ERD) nhưng LUÔN đối chiếu lại NhanVien ở mỗi request, nhờ đó
 * tài khoản bị khoá (FR-ADM-02) mất quyền ngay lập tức chứ không chờ hết phiên. */

export type VaiTroNhanVien = "Staff" | "Admin";

export interface StaffIdentity {
  id: string;
  email: string;
  hoTen: string;
  vaiTro: VaiTroNhanVien;
}

export const STAFF_COOKIE = "staff_session";
/** NFR-06: phiên tự hết hạn sau 30 phút không hoạt động. */
export const STAFF_IDLE_MS = 30 * 60 * 1000;

interface StaffSession {
  nhanVienId: string;
  lastSeen: number;
}

// Đặt trên globalThis để `next dev` hot-reload không làm mọi người bị đăng xuất.
const g = globalThis as unknown as { __bvStaffSessions?: Map<string, StaffSession> };
const sessions: Map<string, StaffSession> = (g.__bvStaffSessions ??= new Map());

// Băm một mật khẩu giả để email không tồn tại cũng tốn cùng thời gian xác thực như email có thật (chống dò tài khoản).
let dummyHash: string | undefined;

export type StaffLoginResult =
  | { ok: true; token: string; staff: StaffIdentity }
  | { ok: false; status: 401 | 403; error: string };

export async function loginStaff(email: string, password: string): Promise<StaffLoginResult> {
  const row = await getPrisma().nhanVien.findUnique({ where: { email: email.trim().toLowerCase() } });
  const passwordOk = verifyPassword(password, row?.matKhauHash ?? (dummyHash ??= hashPassword("khong-ton-tai")));

  // Cùng một thông báo cho "không có email" và "sai mật khẩu" — kể cả email của khách hàng (FR-ADM-01).
  if (!row || !passwordOk) return { ok: false, status: 401, error: "Email hoặc mật khẩu không đúng." };
  // Chỉ báo "bị khoá" sau khi đã đúng mật khẩu, để người lạ không dò được tài khoản nào bị khoá.
  if (!row.dangHoatDong) return { ok: false, status: 403, error: "Tài khoản đã bị khoá. Vui lòng liên hệ Admin." };

  const token = randomBytes(24).toString("hex");
  sessions.set(token, { nhanVienId: row.id, lastSeen: Date.now() });
  return {
    ok: true,
    token,
    staff: { id: row.id, email: row.email, hoTen: row.hoTen, vaiTro: row.vaiTro as VaiTroNhanVien },
  };
}

export function logoutStaff(token: string | undefined): void {
  if (token) sessions.delete(token);
}

export function getStaffToken(request: Request): string | undefined {
  return request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${STAFF_COOKIE}=([^;]+)`))?.[1];
}

/** Trả về nhân viên của phiên hiện tại, hoặc undefined nếu chưa đăng nhập / phiên hết hạn / tài khoản bị khoá. */
export async function resolveStaff(token: string | undefined, now: number = Date.now()): Promise<StaffIdentity | undefined> {
  if (!token) return undefined;
  const session = sessions.get(token);
  if (!session) return undefined;
  if (now - session.lastSeen > STAFF_IDLE_MS) {
    sessions.delete(token);
    return undefined;
  }

  const row = await getPrisma().nhanVien.findUnique({ where: { id: session.nhanVienId } });
  if (!row || !row.dangHoatDong) {
    sessions.delete(token);
    return undefined;
  }
  session.lastSeen = now;
  return { id: row.id, email: row.email, hoTen: row.hoTen, vaiTro: row.vaiTro as VaiTroNhanVien };
}

export type StaffGuard = { ok: true; staff: StaffIdentity } | { ok: false; response: Response };

/** Dùng ở đầu mọi route /api/staff và /api/admin: 401 nếu chưa đăng nhập nội bộ, 403 nếu sai vai trò. */
export async function requireStaff(
  request: Request,
  roles: VaiTroNhanVien[] = ["Staff", "Admin"],
): Promise<StaffGuard> {
  const staff = await resolveStaff(getStaffToken(request));
  if (!staff) {
    return { ok: false, response: Response.json({ error: "Chưa đăng nhập nội bộ." }, { status: 401 }) };
  }
  if (!roles.includes(staff.vaiTro)) {
    return { ok: false, response: Response.json({ error: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 }) };
  }
  return { ok: true, staff };
}
