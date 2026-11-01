import { requireStaff } from "@/lib/auth/staff";
import { adminCategories } from "@/lib/admin/categories";

/** Đổi tên một danh mục (mở rộng UC-15, FR-ADM-03) — chỉ Admin. Client dựng URL bằng encodeURIComponent vì tên
 * danh mục có dấu cách/dấu tiếng Việt; Next.js tự decode lại nên `ten` ở đây đã là chuỗi gốc. Đổi tên thành tên
 * của một danh mục đã có sẵn tức là gộp hai danh mục làm một (UPDATE hàng loạt, không có khái niệm "trùng" cần chặn). */
export async function PUT(request: Request, { params }: { params: Promise<{ ten: string }> }) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const { ten } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const tenMoi = (body as { ten?: unknown })?.ten;
  if (typeof tenMoi !== "string") return Response.json({ error: "Thiếu tên danh mục mới." }, { status: 400 });

  const result = await adminCategories.rename(ten, tenMoi);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, soSanPhamDaDoi: result.soSanPhamDaDoi });
}
