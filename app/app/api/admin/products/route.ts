import { queryProducts, saveProduct, allCategories, type AdminProduct } from "@/lib/admin/mock-products";

// MOCKUP UC-15: dữ liệu giả trong bộ nhớ, chưa kiểm tra phiên Admin. Bản thật sẽ ghi bảng SanPham (FR-ADM-03).
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const page = queryProducts({
    q: sp.get("q") ?? "",
    danhMuc: sp.get("danhMuc") ?? "",
    page: Number(sp.get("page")) || 1,
  });
  return Response.json({ ...page, categories: allCategories() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AdminProduct;
  const result = saveProduct({ ...body, soHopSan: 0, soHopTong: 0, soDonLienQuan: 0 }, true);
  return result.ok ? Response.json({ ok: true }, { status: 201 }) : Response.json(result, { status: 409 });
}
