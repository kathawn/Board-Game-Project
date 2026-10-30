import { requireStaff } from "@/lib/auth/staff";
import { adminProducts } from "@/lib/admin/products";
import { validateProductInput } from "@/lib/admin/validate";

/** UC-15 (FR-ADM-03): chỉ Admin. Staff đăng nhập nội bộ nhưng không có quyền quản lý sản phẩm/giá → 403.
 * GET  ?q=&danhMuc=&page= → một trang tóm tắt (10 dòng) + số đếm theo danh mục; tìm kiếm / lọc / phân trang ở SQL.
 * POST { slug, ten, danhMuc, giaNiemYet, moTaNgan, soNguoiMin, soNguoiMax } → thêm sản phẩm. */
export async function GET(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const page = await adminProducts.list({
    q: sp.get("q") ?? "",
    danhMuc: sp.get("danhMuc") ?? "",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ok: true, ...page });
}

export async function POST(request: Request) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const parsed = validateProductInput(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const result = await adminProducts.create(parsed.value);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true }, { status: 201 });
}
