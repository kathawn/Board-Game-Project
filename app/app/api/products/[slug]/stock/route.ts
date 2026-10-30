import { checkStock } from "@/lib/products";
import { catalog } from "@/lib/catalog/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await catalog.get(slug);

  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const soLuong = Number(searchParams.get("soLuong") ?? "1");

  const result = checkStock(product, soLuong);

  return Response.json(result, { status: result.ok ? 200 : 409 });
}
