import { getPrisma } from "@/lib/db/client";
import { toIso } from "@/lib/db/tx";
import { toShipment } from "@/lib/shipping/service";
import type { Shipment } from "@/lib/shipping/types";

/** UC-03: danh sách đơn MUA cho Staff giao cho vận chuyển. Tìm kiếm / lọc giai đoạn / phân trang ở server để dùng
 * được khi có hàng trăm đơn. Giai đoạn suy ra từ vòng đời đã có (không thêm trạng thái mới): ChoGiao = Confirmed
 * chưa có vận đơn; DangGiao = Confirmed đã có vận đơn; DaGiao = Completed. */
export const SALE_STAGES = ["ChoGiao", "DangGiao", "DaGiao"] as const;
export type SaleStage = (typeof SALE_STAGES)[number];

export interface SaleOrderView {
  id: string;
  email: string;
  ngayTao: string;
  diaChiNhan: string;
  stage: SaleStage;
  lines: { productName: string; soLuong: number; thanhTien: number; maHop: string }[];
  tongTienHang: number;
  shipments: Shipment[];
}

export interface SaleOrderPage {
  orders: SaleOrderView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<SaleStage, number>;
}

const include = {
  khachHang: { select: { email: true } },
  chiTiet: { include: { sanPham: { select: { ten: true } }, giaoVan: true } },
} as const;

function stageOf(trangThai: string, coVanDon: boolean): SaleStage | null {
  if (trangThai === "Completed") return "DaGiao";
  if (trangThai === "Confirmed") return coVanDon ? "DangGiao" : "ChoGiao";
  return null;
}

export async function searchSaleOrders(opts: { q: string; stage: SaleStage; page: number; pageSize: number }): Promise<SaleOrderPage> {
  const db = getPrisma();
  const keyword = opts.q.trim();
  const timKiem = keyword
    ? {
        OR: [
          { maDon: { contains: keyword } },
          { khachHang: { email: { contains: keyword } } },
          { chiTiet: { some: { sanPham: { ten: { contains: keyword } } } } },
        ],
      }
    : {};
  const base = { loai: "Ban", ...timKiem };
  const theoStage = {
    ChoGiao: { trangThai: "Confirmed", chiTiet: { none: { giaoVan: { some: {} } } } },
    DangGiao: { trangThai: "Confirmed", chiTiet: { some: { giaoVan: { some: {} } } } },
    DaGiao: { trangThai: "Completed" },
  } as const;

  const where = { ...base, ...theoStage[opts.stage] };
  const total = await db.donHang.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
  const page = Math.min(totalPages, Math.max(1, opts.page));

  const [rows, c1, c2, c3] = await Promise.all([
    db.donHang.findMany({
      where,
      include,
      orderBy: opts.stage === "DaGiao" ? { ngayTao: "desc" } : { ngayTao: "asc" }, // việc cần làm: đơn cũ nhất trước
      skip: (page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    db.donHang.count({ where: { ...base, ...theoStage.ChoGiao } }),
    db.donHang.count({ where: { ...base, ...theoStage.DangGiao } }),
    db.donHang.count({ where: { ...base, ...theoStage.DaGiao } }),
  ]);

  const orders: SaleOrderView[] = rows.map((r) => {
    const shipments = r.chiTiet.flatMap((c) => c.giaoVan.filter((g) => g.maVanDon).map(toShipment));
    return {
      id: r.maDon,
      email: r.khachHang.email,
      ngayTao: toIso(r.ngayTao),
      diaChiNhan: r.chiTiet[0]?.diaChiNhan ?? "",
      stage: stageOf(r.trangThai, shipments.length > 0) ?? opts.stage,
      lines: r.chiTiet.map((c) => ({
        productName: c.sanPham.ten,
        soLuong: c.soLuong,
        thanhTien: Number(c.donGia),
        maHop: c.maHop ?? "",
      })),
      tongTienHang: r.chiTiet.reduce((s, c) => s + Number(c.donGia), 0),
      shipments,
    };
  });
  return { orders, total, page, pageSize: opts.pageSize, totalPages, counts: { ChoGiao: c1, DangGiao: c2, DaGiao: c3 } };
}
