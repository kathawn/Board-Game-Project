import { catalog } from "@/lib/catalog/server";

function parsePrice(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loai = searchParams.get("loai");

  // FR-ADM-03: danh mục đọc từ bảng SanPham nên sản phẩm Admin thêm/sửa giá hiện ra ngay.
  const result = await catalog.list({
    q: searchParams.get("q") ?? undefined,
    danhMuc: searchParams.get("danhMuc") ?? undefined,
    loai: loai === "thue" ? "thue" : "ban",
    giaMin: parsePrice(searchParams.get("giaMin")),
    giaMax: parsePrice(searchParams.get("giaMax")),
  });

  return Response.json(result);
}
