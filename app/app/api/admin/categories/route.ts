import { requireStaff } from "@/lib/auth/staff";
import { adminCategories } from "@/lib/admin/categories";

/** Quản lý danh mục (mở rộng UC-15, FR-ADM-03) — chỉ Admin.
 * GET → danh sách danh mục hiện có (tổng hợp từ SanPham.danhMuc) kèm số sản phẩm + doanh thu mỗi danh mục. */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const categories = await adminCategories.list();
  return Response.json({ ok: true, categories });
}
