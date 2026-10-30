import { deleteProduct, getProduct, saveProduct, type AdminProduct } from "@/lib/admin/mock-products";

// MOCKUP UC-15 — xem app/api/admin/products/route.ts.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? Response.json({ product }) : Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const existing = getProduct(slug);
  if (!existing) return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  const body = (await request.json()) as AdminProduct;
  saveProduct({ ...existing, ...body, slug }, false);
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = deleteProduct(slug);
  return result.ok ? Response.json({ ok: true }) : Response.json(result, { status: 409 });
}
