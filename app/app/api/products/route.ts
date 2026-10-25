import { PRODUCTS, filterProducts } from "@/lib/products";

function parsePrice(raw: string | null): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loai = searchParams.get("loai");

  const result = filterProducts(PRODUCTS, {
    q: searchParams.get("q") ?? undefined,
    danhMuc: searchParams.get("danhMuc") ?? undefined,
    loai: loai === "thue" ? "thue" : "ban",
    giaMin: parsePrice(searchParams.get("giaMin")),
    giaMax: parsePrice(searchParams.get("giaMax")),
  });

  return Response.json(result);
}
