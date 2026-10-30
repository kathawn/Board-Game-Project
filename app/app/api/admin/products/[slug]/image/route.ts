import { requireStaff } from "@/lib/auth/staff";
import { adminProducts } from "@/lib/admin/products";
import { luuAnhSanPham, xoaAnhCu } from "@/lib/admin/image";

/** UC-15: Admin tải ảnh lên cho sản phẩm (multipart, trường `file`). Chỉ Admin. Ảnh cũ do Admin tải trước đó bị xoá. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireStaff(request, ["Admin"]);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "Dữ liệu tải lên không hợp lệ." }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ error: "Chưa chọn file ảnh." }, { status: 400 });

  const saved = await luuAnhSanPham(slug, Buffer.from(await file.arrayBuffer()));
  if (!saved.ok) return Response.json({ error: saved.error }, { status: 400 });

  const result = await adminProducts.setImage(slug, saved.url);
  if (!result.ok) {
    await xoaAnhCu(saved.url); // sản phẩm không tồn tại: bỏ file vừa ghi
    return Response.json({ error: result.error }, { status: result.status });
  }
  await xoaAnhCu(result.anhCu);
  return Response.json({ ok: true, anh: saved.url });
}
