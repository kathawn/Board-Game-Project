/** Dữ liệu demo cho UC-07/08/09 (trả hàng → kiểm đếm → phạt → hoàn cọc). Idempotent, KHÔNG xoá dữ liệu có sẵn:
 *   - vá soLuong/giaLe cho LinhKien theo lib/products.ts;
 *   - tạo (nếu chưa có) các đơn thuê (DT-9000x) đã có vận đơn chiều trả "Đã lấy": DT-90001 (trễ 2 ngày, có linh kiện độc bản) và
 *     DT-90002 (đúng hạn).
 *
 *   npx tsx prisma/seed-returns.ts      (chạy riêng)  — hoặc được `prisma db seed` gọi cuối cùng. */
import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { parseSqlServerUrl } from "../lib/db/connection";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PRODUCTS } from "../lib/products";
import { tinhPhiShip, tinhTienCocSanPham, uocTinhKhoangCachKm } from "../lib/rentals/deposit";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export async function seedReturnsDemo(prisma: PrismaClient): Promise<void> {
  // 1. Vá linh kiện của DB đã có.
  for (const p of PRODUCTS) {
    for (const lk of p.linhKien) {
      await prisma.linhKien.updateMany({
        where: { sanPham: { slug: p.slug }, tenLinhKien: lk.ten },
        data: { soLuong: lk.soLuong ?? 1, giaLe: lk.giaLe ?? null },
      });
    }
  }

  // 2. Hai đơn demo.
  const khach = await prisma.khachHang.findUnique({ where: { email: "khach@boardverse.local" } });
  const khach2 = await prisma.khachHang.findUnique({ where: { email: "khach2@boardverse.local" } });
  if (!khach || !khach2) {
    console.log("Bỏ qua đơn demo trả hàng: chưa có tài khoản demo (chạy `npx prisma db seed` trước).");
    return;
  }

  const demos = [
    {
      maDon: "DT-90001", khach: khach2, slug: "catan", maHop: "CATAN-002", maVanDon: "SPX-290001", maVanDonNhan: "SPX-290000",
      diaChi: "Thôn 3, xã Đông Hội, huyện Đông Anh, Hà Nội", start: "2026-10-22", end: "2026-10-26", veKho: "2026-10-28T03:00:00.000Z",
    },
    {
      maDon: "DT-90003", khach: khach2, slug: "catan", maHop: "", maVanDon: "SPX-290013", maVanDonNhan: "SPX-290012",
      diaChi: "Thôn 3, xã Đông Hội, huyện Đông Anh, Hà Nội", start: "2026-10-22", end: "2026-10-26", veKho: "2026-10-28T03:00:00.000Z",
    },
    {
      maDon: "DT-90004", khach, slug: "ticket-to-ride", maHop: "", maVanDon: "GSM-290014", maVanDonNhan: "GSM-290011",
      diaChi: "12 Hàng Bài, Hoàn Kiếm, Hà Nội", start: "2026-10-27", end: "2026-10-30", veKho: "2026-10-30T03:00:00.000Z",
    },
    {
      maDon: "DT-90005", khach: khach2, slug: "catan", maHop: "", maVanDon: "SPX-290025", maVanDonNhan: "SPX-290024",
      diaChi: "Thôn 3, xã Đông Hội, huyện Đông Anh, Hà Nội", start: "2026-10-22", end: "2026-10-26", veKho: "2026-10-28T03:00:00.000Z",
    },
    {
      maDon: "DT-90006", khach, slug: "ticket-to-ride", maHop: "", maVanDon: "GSM-290026", maVanDonNhan: "GSM-290023",
      diaChi: "12 Hàng Bài, Hoàn Kiếm, Hà Nội", start: "2026-10-27", end: "2026-10-30", veKho: "2026-10-30T03:00:00.000Z",
    },
    {
      maDon: "DT-90002", khach, slug: "ticket-to-ride", maHop: "TICKET-TO-RIDE-001", maVanDon: "GSM-290002", maVanDonNhan: "GSM-290001",
      diaChi: "12 Hàng Bài, Hoàn Kiếm, Hà Nội", start: "2026-10-27", end: "2026-10-30", veKho: "2026-10-30T03:00:00.000Z",
    },
  ];

  for (const demo of demos) {
    if (await prisma.donHang.findUnique({ where: { maDon: demo.maDon } })) continue;
    const sp = await prisma.sanPham.findUnique({ where: { slug: demo.slug } });
    // maHop trống = lấy hộp Available đầu tiên của sản phẩm (để chạy lại seed khi hộp cũ đã dùng hết).
    const hop = sp
      ? demo.maHop
        ? await prisma.hopGame.findUnique({ where: { maHop: demo.maHop } })
        : await prisma.hopGame.findFirst({ where: { sanPhamId: sp.id, trangThai: "Available" }, orderBy: { maHop: "asc" } })
      : null;
    if (!sp || !hop || hop.trangThai !== "Available") {
      console.log(`Bỏ qua ${demo.maDon}: không có sản phẩm hoặc không có hộp ${demo.maHop || demo.slug} đang Available.`);
      continue;
    }
    const gia = Number(sp.giaNiemYet);
    const km = uocTinhKhoangCachKm(demo.diaChi);
    const ship = tinhPhiShip(km);
    const coc = tinhTienCocSanPham(gia, km);

    const don = await prisma.donHang.create({
      data: { maDon: demo.maDon, khachHangId: demo.khach.id, loai: "Thue", trangThai: "Active", ngayTao: d(demo.start) },
    });
    const dong = await prisma.chiTietDonHang.create({
      data: {
        donHangId: don.id, sanPhamId: sp.id, soLuong: 1, ngayBatDau: d(demo.start), ngayKetThuc: d(demo.end),
        tienThue: 0, tienCoc: coc, donGia: 0, diaChiNhan: demo.diaChi, diaChiTra: demo.diaChi, maHop: hop.maHop,
      },
    });
    await prisma.datCoc.create({
      data: { donHangId: don.id, soTien: coc, phiShipGiu: ship.phiShip * 2, trangThai: "Held" },
    });
    await prisma.giaoVan.createMany({
      data: [
        { chiTietDonId: dong.id, chieu: "Nhan", doiTac: ship.doiTac, khoangCachKm: km, phiShip: ship.phiShip, maVanDon: demo.maVanDonNhan, trangThaiVanChuyen: "DaGiao", hoanTatLuc: d(demo.start) },
        { chiTietDonId: dong.id, chieu: "Tra", doiTac: ship.doiTac, khoangCachKm: km, phiShip: ship.phiShip, maVanDon: demo.maVanDon, trangThaiVanChuyen: "DaLay", hoanTatLuc: new Date(demo.veKho) },
      ],
    });
    await prisma.thanhToan.create({
      data: {
        maThanhToan: `PAY-${demo.maDon}`, donHangId: don.id, khachHangId: demo.khach.id, soTien: coc, mucDich: "TienCoc",
        trangThai: "DaThanhToan", ketQua: "ThanhCong", maQR: `momo://pay?orderId=PAY-${demo.maDon}`,
        hetHanLuc: new Date(`${demo.start}T00:15:00Z`), snapshot: "[]",
      },
    });
    await prisma.hopGame.update({ where: { id: hop.id }, data: { trangThai: "Rented" } });
    console.log(`Đã tạo đơn demo ${demo.maDon} (${sp.ten}, hộp ${hop.maHop}).`);
  }
}

// Chạy riêng: npx tsx prisma/seed-returns.ts
if (process.argv[1]?.split("\\").join("/").endsWith("prisma/seed-returns.ts")) {
  const prisma = new PrismaClient({ adapter: new PrismaMssql(parseSqlServerUrl(process.env.DATABASE_URL ?? "")) });
  seedReturnsDemo(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
