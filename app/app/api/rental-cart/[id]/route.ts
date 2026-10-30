import { rentalCartStore } from "@/lib/rentals/server";
import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { catalog } from "@/lib/catalog/server";

/** FR-CT-09: sửa ngày thuê của một dòng trong giỏ. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const { startDate, endDate } = await request.json();

  const existingLine = (await rentalCartStore.list(email)).find((l) => l.id === id);
  if (!existingLine) {
    return Response.json({ error: "Không tìm thấy dòng trong giỏ thuê." }, { status: 404 });
  }

  const product = await catalog.get(existingLine.productSlug);
  const result = await rentalCartStore.updateLine(email, id, {
    productName: product?.ten ?? existingLine.productSlug,
    startDate,
    endDate,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json({ ok: true, line: result.line });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  await rentalCartStore.removeLine(email, id);

  return Response.json({ ok: true });
}
