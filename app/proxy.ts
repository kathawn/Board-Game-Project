import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** UC-13 (FR-ADM-01): khu vực nội bộ /staff/** và /admin/** — chưa có cookie phiên nội bộ thì chuyển thẳng về
 * /staff/login, không hiện cả trang. Đây chỉ là lớp chặn nhanh theo SỰ HIỆN DIỆN của cookie; việc xác thực thật
 * (phiên còn hạn, tài khoản còn hoạt động, đúng vai trò Staff/Admin) luôn nằm ở requireStaff() trong từng API,
 * nên cookie giả vẫn không lấy được dữ liệu nào. API (/api/**) không đi qua proxy này và tự trả 401/403. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/staff/login") return NextResponse.next();

  if (!request.cookies.get("staff_session")?.value) {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*"],
};
