/** Seed theo SDD mục 8 (Kịch bản Seed Data), dùng đúng 16 sản phẩm của app (lib/products.ts) thay vì
 * 5 tựa mẫu của SDD để khớp catalog đang chạy. Số liệu là giả định. Chạy lại được nhiều lần:
 * xoá sạch dữ liệu rồi nạp lại.
 *
 *   npx prisma db seed
 *
 * Tài khoản demo (mật khẩu dùng chung: Demo@12345) — băm bằng đúng thuật toán scrypt của lib/auth/auth.ts. */
import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { parseSqlServerUrl } from "../lib/db/connection";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PRODUCTS, tinhTienThueNgay } from "../lib/products";
import { tinhPhiShip, tinhTienCocSanPham, uocTinhKhoangCachKm } from "../lib/rentals/deposit";

const DEMO_PASSWORD = "Demo@12345";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const prisma = new PrismaClient({
  adapter: new PrismaMssql(parseSqlServerUrl(process.env.DATABASE_URL ?? "")),
});

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const soNgay = (a: string, b: string) => Math.round((d(b).getTime() - d(a).getTime()) / 86_400_000);

async function wipe() {
  // Thứ tự từ bảng con lên bảng cha.
  await prisma.danhGia.deleteMany();
  await prisma.bienBanKiemDem.deleteMany();
  await prisma.giaoVan.deleteMany();
  await prisma.giaoDichThanhToan.deleteMany();
  await prisma.butToanVi.deleteMany();
  await prisma.thanhToan.deleteMany();
  await prisma.datCoc.deleteMany();
  await prisma.chiTietDonHang.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.hopGame.deleteMany();
  await prisma.linhKien.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.viDienTu.deleteMany();
  await prisma.khachHang.deleteMany();
  await prisma.nhanVien.deleteMany();
}

async function main() {
  await wipe();

  // --- 1. Tài khoản demo + ví (SDD 8.1, BRU-06) ---
  const matKhauHash = hashPassword(DEMO_PASSWORD);
  const diaChiNoiThanh = "12 Hàng Bài, Hoàn Kiếm, Hà Nội";
  const diaChiNgoaiThanh = "Thôn 3, xã Đông Hội, huyện Đông Anh, Hà Nội";

  const khach = await prisma.khachHang.create({
    data: {
      hoTen: "Nguyễn Văn An",
      email: "khach@boardverse.local",
      sdt: "0912345678",
      diaChi: diaChiNoiThanh,
      matKhauHash,
      viDienTu: { create: { soDu: 0 } },
    },
  });
  const khach2 = await prisma.khachHang.create({
    data: {
      hoTen: "Trần Thị Bình",
      email: "khach2@boardverse.local",
      sdt: "0987654321",
      diaChi: diaChiNgoaiThanh,
      matKhauHash,
      viDienTu: { create: { soDu: 0 } },
    },
  });
  const staff = await prisma.nhanVien.create({
    data: { hoTen: "Lê Nhân Viên", email: "staff@boardverse.local", matKhauHash, vaiTro: "Staff", dangHoatDong: true },
  });
  await prisma.nhanVien.create({
    data: { hoTen: "Phạm Quản Trị", email: "admin@boardverse.local", matKhauHash, vaiTro: "Admin", dangHoatDong: true },
  });

  // --- 2. Sản phẩm + linh kiện + hộp game (SDD 8.2, 8.3) ---
  // Mỗi sản phẩm: soLuongTon hộp Available (khớp catalog đang hiển thị), UNO và Cờ Cá Ngựa/Ma Sói... thêm hộp Sold.
  const sp: Record<string, string> = {};
  for (const p of PRODUCTS) {
    const created = await prisma.sanPham.create({
      data: {
        slug: p.slug,
        ten: p.ten,
        moTa: p.moTaNgan,
        giaNiemYet: p.giaNiemYet,
        danhMuc: p.danhMuc,
        anhUrl: p.anh,
        linhKien: { create: p.linhKien.map((l) => ({ tenLinhKien: l.ten, laDocBan: l.docBan })) },
        hopGame: {
          create: Array.from({ length: p.soLuongTon }, (_, i) => ({
            maHop: `${p.slug.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
            trangThai: "Available",
          })),
        },
      },
    });
    sp[p.slug] = created.id;
  }
  // Hộp đã bán (để kiểm thử đơn mua nhiều sản phẩm/số lượng).
  for (const [slug, n] of [["uno", 3], ["codenames", 1]] as const) {
    await prisma.hopGame.createMany({
      data: Array.from({ length: n }, (_, i) => ({
        sanPhamId: sp[slug],
        maHop: `${slug.toUpperCase()}-SOLD-${String(i + 1).padStart(3, "0")}`,
        trangThai: "Sold",
      })),
    });
  }

  const gia = (slug: string) => PRODUCTS.find((p) => p.slug === slug)!.giaNiemYet;

  // --- 3. Đơn thuê Active, nội thành -> Green SM (SDD 8.4) ---
  const kmNoi = uocTinhKhoangCachKm(diaChiNoiThanh);
  const shipNoi = tinhPhiShip(kmNoi);
  const catan = { start: "2026-10-20", end: "2026-10-23" };
  const tienThueCatan = tinhTienThueNgay(gia("catan"), soNgay(catan.start, catan.end));
  const tienCocCatan = tinhTienCocSanPham(gia("catan"), kmNoi);
  const donActive = await prisma.donHang.create({
    data: { maDon: "DT-00001", khachHangId: khach.id, loai: "Thue", trangThai: "Active", ngayTao: d("2026-10-19") },
  });
  const dongActive = await prisma.chiTietDonHang.create({
    data: {
      donHangId: donActive.id, sanPhamId: sp["catan"], soLuong: 1,
      ngayBatDau: d(catan.start), ngayKetThuc: d(catan.end),
      tienThue: tienThueCatan, tienCoc: tienCocCatan, donGia: tienThueCatan, diaChiNhan: diaChiNoiThanh,
    },
  });
  await prisma.datCoc.create({
    data: { donHangId: donActive.id, soTien: tienCocCatan, phiShipGiu: shipNoi.phiShip * 2, trangThai: "Held" },
  });
  await prisma.giaoVan.create({
    data: {
      chiTietDonId: dongActive.id, chieu: "Nhan", doiTac: shipNoi.doiTac, khoangCachKm: kmNoi,
      phiShip: shipNoi.phiShip, maVanDon: "GSM-100001", trangThaiVanChuyen: "DaGiao",
    },
  });
  await prisma.thanhToan.create({
    data: {
      maThanhToan: "PAY-SEED-1", donHangId: donActive.id, khachHangId: khach.id, soTien: tienCocCatan,
      mucDich: "TienCoc", trangThai: "DaThanhToan", ketQua: "ThanhCong", maQR: "momo://pay?orderId=PAY-SEED-1",
      hetHanLuc: new Date("2026-10-19T00:15:00Z"), snapshot: "[]",
    },
  });
  await prisma.hopGame.updateMany({ where: { maHop: "CATAN-001" }, data: { trangThai: "Rented" } });

  // --- 4. Đơn thuê Completed đã hoàn cọc, ngoại thành -> Shopee Express (SDD 8.5) ---
  const kmNgoai = uocTinhKhoangCachKm(diaChiNgoaiThanh);
  const shipNgoai = tinhPhiShip(kmNgoai);
  const azul = { start: "2026-09-02", end: "2026-09-04" };
  const tienThueAzul = tinhTienThueNgay(gia("azul"), soNgay(azul.start, azul.end));
  const tienCocAzul = tinhTienCocSanPham(gia("azul"), kmNgoai);
  const donDone = await prisma.donHang.create({
    data: { maDon: "DT-00002", khachHangId: khach2.id, loai: "Thue", trangThai: "Completed", ngayTao: d("2026-09-01") },
  });
  const dongDone = await prisma.chiTietDonHang.create({
    data: {
      donHangId: donDone.id, sanPhamId: sp["azul"], soLuong: 1,
      ngayBatDau: d(azul.start), ngayKetThuc: d(azul.end),
      tienThue: tienThueAzul, tienCoc: tienCocAzul, donGia: tienThueAzul,
      diaChiNhan: diaChiNgoaiThanh, diaChiTra: diaChiNgoaiThanh,
    },
  });
  await prisma.datCoc.create({
    data: {
      donHangId: donDone.id, soTien: tienCocAzul, phiShipGiu: shipNgoai.phiShip * 2,
      trangThai: "Refunded", ngayHoan: d("2026-09-08"),
    },
  });
  await prisma.giaoVan.createMany({
    data: [
      { chiTietDonId: dongDone.id, chieu: "Nhan", doiTac: shipNgoai.doiTac, khoangCachKm: kmNgoai, phiShip: shipNgoai.phiShip, maVanDon: "SPX-200001", trangThaiVanChuyen: "DaGiao" },
      { chiTietDonId: dongDone.id, chieu: "Tra", doiTac: shipNgoai.doiTac, khoangCachKm: kmNgoai, phiShip: shipNgoai.phiShip, maVanDon: "SPX-200002", trangThaiVanChuyen: "DaLay" },
    ],
  });
  const ttDone = await prisma.thanhToan.create({
    data: {
      maThanhToan: "PAY-SEED-2", donHangId: donDone.id, khachHangId: khach2.id, soTien: tienCocAzul,
      mucDich: "TienCoc", trangThai: "DaThanhToan", ketQua: "ThanhCong", maQR: "momo://pay?orderId=PAY-SEED-2",
      hetHanLuc: new Date("2026-09-01T00:15:00Z"), snapshot: "[]",
    },
  });
  await prisma.giaoDichThanhToan.create({
    data: { thanhToanId: ttDone.id, maGiaoDich: "MOMO-SEED-2", soTien: tienCocAzul, ketQuaMa: 0 },
  });
  await prisma.bienBanKiemDem.create({
    data: { chiTietDonId: dongDone.id, nhanVienId: staff.id, ketQua: "Đủ linh kiện", ngayLap: d("2026-09-06") },
  });
  await prisma.danhGia.create({
    data: {
      sanPhamId: sp["azul"], khachHangId: khach2.id, donHangId: donDone.id,
      soSao: 5, nhanXet: "Hộp game sạch, đủ linh kiện, giao đúng hẹn.", ngayDanhGia: d("2026-09-09"),
    },
  });

  // --- 5. Đơn mua Confirmed, 2 dòng: UNO x2 + Codenames x1 (SDD 8.6, FR-BH-08/09) ---
  const donBan = await prisma.donHang.create({
    data: { maDon: "DH-00231", khachHangId: khach.id, loai: "Ban", trangThai: "Confirmed", ngayTao: d("2026-10-12") },
  });
  await prisma.chiTietDonHang.createMany({
    data: [
      { donHangId: donBan.id, sanPhamId: sp["uno"], soLuong: 2, donGia: gia("uno") * 2, diaChiNhan: diaChiNoiThanh },
      { donHangId: donBan.id, sanPhamId: sp["codenames"], soLuong: 1, donGia: gia("codenames"), diaChiNhan: diaChiNoiThanh },
    ],
  });
  await prisma.thanhToan.create({
    data: {
      maThanhToan: "PAY-SEED-3", donHangId: donBan.id, khachHangId: khach.id,
      soTien: gia("uno") * 2 + gia("codenames"), mucDich: "TienHang", trangThai: "DaThanhToan",
      ketQua: "ThanhCong", maQR: "momo://pay?orderId=PAY-SEED-3", hetHanLuc: new Date("2026-10-12T00:15:00Z"), snapshot: "[]",
    },
  });

  const dem = {
    khachHang: await prisma.khachHang.count(), nhanVien: await prisma.nhanVien.count(),
    sanPham: await prisma.sanPham.count(), linhKien: await prisma.linhKien.count(), hopGame: await prisma.hopGame.count(),
    donHang: await prisma.donHang.count(), chiTiet: await prisma.chiTietDonHang.count(),
    giaoVan: await prisma.giaoVan.count(), thanhToan: await prisma.thanhToan.count(), danhGia: await prisma.danhGia.count(),
  };
  console.log("Seed xong:", dem);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
