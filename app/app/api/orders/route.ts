import { sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";
import { getPrisma } from "@/lib/db/client";
import { toIso } from "@/lib/db/tx";
import type { DonHang, LoaiDon, TrangThaiDon } from "@/lib/orders/store";
import { toShipment } from "@/lib/shipping/service";

/** FR-BH-05 (BR-08): lịch sử đơn mua/thuê của chính khách — đọc thẳng từ bảng DonHang trong SQL Server
 * (gồm cả đơn thuê vừa tạo qua thanh toán QR, UC-10, và đơn mẫu từ seed). */
export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const url = new URL(request.url);
  const loai = url.searchParams.get("loai") as LoaiDon | null;
  const q = url.searchParams.get("q")?.trim().toLowerCase();

  const rows = await getPrisma().donHang.findMany({
    where: { khachHang: { email }, ...(loai ? { loai } : {}) },
    include: {
      chiTiet: { include: { sanPham: { select: { ten: true } }, giaoVan: true } },
      datCoc: true,
      thanhToan: { select: { mucDich: true, trangThai: true, soTien: true, soTienHoan: true } },
    },
    orderBy: { ngayTao: "desc" },
  });

  const orders: DonHang[] = rows.map((row) => {
    const thue = row.loai === "Thue";
    return {
      id: row.maDon,
      loai: row.loai as LoaiDon,
      trangThai: row.trangThai as TrangThaiDon,
      ngayTao: toIso(row.ngayTao),
      sanPham: row.chiTiet.map((c) => c.sanPham.ten).join(", "),
      chiTiet: thue
        ? row.chiTiet.map((c) => `${c.sanPham.ten} ${c.ngayBatDau ? toIso(c.ngayBatDau) : ""} → ${c.ngayKetThuc ? toIso(c.ngayKetThuc) : ""}`).join("; ")
        : row.chiTiet.map((c) => `${c.sanPham.ten} × ${c.soLuong}`).join("; "),
      // Đơn thuê hiển thị tiền cọc đã thu. Đơn mua hiển thị số khách THỰC TRẢ cho đơn này = khoản TienHang đã thanh toán
      // (tiền hàng + phí ship một chiều) trừ phần đã hoàn ví (dòng hết hàng); đơn không có khoản thanh toán gắn kèm
      // (dữ liệu cũ) thì dùng tổng tiền hàng.
      tongTien: thue
        ? Number(row.datCoc?.soTien ?? 0)
        : (() => {
            const khoan = row.thanhToan.find((t) => t.mucDich === "TienHang" && t.trangThai === "DaThanhToan");
            return khoan
              ? Number(khoan.soTien) - Number(khoan.soTienHoan)
              : row.chiTiet.reduce((sum, c) => sum + Number(c.donGia), 0);
          })(),
      // Cả đơn thuê (hai chiều) lẫn đơn mua (một chiều giao) đều trả địa chỉ nhận và vận đơn để khách theo dõi.
      diaChiNhan: row.chiTiet[0]?.diaChiNhan,
      shipments: row.chiTiet.flatMap((c) => c.giaoVan.filter((g) => g.maVanDon).map(toShipment)),
    };
  });

  const filtered = orders.filter(
    (order) => !q || order.sanPham.toLowerCase().includes(q) || order.id.toLowerCase().includes(q),
  );
  return Response.json({ ok: true, orders: filtered });
}
