import { requireStaff } from "@/lib/auth/staff";
import { adminProducts } from "@/lib/admin/products";
import { validateProductInput } from "@/lib/admin/validate";

/** UC-15 (FR-ADM-03): chi tiết / sửa / xoá một sản phẩm — chỉ Admin. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const product = await adminProducts.get(slug);
  if (!product) return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  return Response.json({ ok: true, product });
}

/** Sửa thông tin + giá. Slug lấy từ URL, không đổi được. Giá mới áp dụng ngay cho đơn tạo sau đó (BR-12). */
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const parsed = validateProductInput({ ...(body as object), slug });
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const result = await adminProducts.update(slug, parsed.value);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}

/** Xoá chỉ được khi sản phẩm chưa có dòng đơn / đánh giá nào; ngược lại 409 để bảo toàn lịch sử đơn. */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const result = await adminProducts.remove(slug);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true });
}
