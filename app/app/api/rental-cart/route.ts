import { rentalCartStore } from "@/lib/rentals/server";
import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getProductBySlug } from "@/lib/products";

export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  return Response.json({ ok: true, lines: rentalCartStore.list(email) });
}

export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { productSlug, startDate, endDate } = await request.json();

  const product = getProductBySlug(productSlug);
  if (!product) {
    return Response.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
  }

  const result = rentalCartStore.addLine(email, {
    productSlug,
    productName: product.ten,
    startDate,
    endDate,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true, line: result.line });
}
