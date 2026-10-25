#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh SDD_BoardVerse_v1.0.docx - Tai lieu thiet ke he thong, 19 muc ky thuat
ke thua truc tiep ERD/UC/FR da chot o SRS_BoardVerse_v1.0 (bao gom giao van hai
chieu BR-09/BRU-05 va thanh toan QR BR-10/BRU-06). Chua co Template_SDD_Claude.docx
nen tai lieu duoc dung moi hoan toan, dung chung phong cach voi BRD/SRS qua doc_style.py."""

import os

import doc_style as ds
import project_data as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIAG = os.path.join(ROOT, "diagrams", "out") + os.sep
OUT_PATH = os.path.join(ROOT, "deliverables", "SDD_BoardVerse_v1.0.docx")

doc = ds.new_document()

ds.title_page(
    doc,
    "TÀI LIỆU THIẾT KẾ HỆ THỐNG",
    "System Design Document – SDD",
    f"Dự án: {pd.PROJECT_NAME} – Hệ thống mua bán và cho thuê board game",
    pd.AUTHOR,
    "SDD-BV-01",
)

ds.version_history(doc, [
    ["0.1", "03/11/2026", pd.AUTHOR, "Khởi tạo bản nháp, viết mục 1-8 dựa trên SRS_BoardVerse_v1.0 (bao gồm 11 model theo ERD mới nhất)."],
    ["0.5", "08/11/2026", pd.AUTHOR, "Hoàn thiện mục 9-16 (Sitemap, Wireframe, thuật toán tồn kho/giá/phạt/phí ship/webhook)."],
    ["0.9", "11/11/2026", pd.AUTHOR, "Hoàn thiện mục 17-18 (API Endpoints, Design Class Diagram v2 dạng PlantUML), rà soát khả thi kỹ thuật."],
    ["1.0", "14/11/2026", pd.AUTHOR, "Phê duyệt kỹ thuật (Technical Sign-off)."],
])

ds.toc_placeholder(doc)

ds.para(doc, "Tài liệu này kế thừa trực tiếp ERD (Hình 3.3), Use Case và yêu cầu chức năng (FR, bao gồm nhóm "
             "FR-TTGV về thanh toán & giao vận) đã chốt tại SRS_BoardVerse_v1.0 (mã SRS-BV-01) để thiết kế chi "
             "tiết kỹ thuật cho giai đoạn Vibe Code.")

# ===========================================================================
# 1. KIEN TRUC
# ===========================================================================
ds.heading(doc, "1. Kiến trúc phần mềm tổng thể", level=1)
ds.para(doc, "Áp dụng kiến trúc phân lớp (Layered Architecture) đơn giản, phù hợp quy mô đồ án cá nhân nhưng vẫn "
             "tách rõ trách nhiệm từng lớp để dễ bảo trì (khớp NFR-09 của SRS).")
ds.picture(doc, DIAG + "sdd_1_architecture.png", width_cm=15)
ds.bullets(doc, [
    "Presentation: các trang Next.js (App Router), React Server Components cho trang đọc dữ liệu (danh sách sản phẩm), Client Components cho phần tương tác (chọn ngày thuê, giỏ hàng, theo dõi mã QR/trạng thái giao vận).",
    "Application/Service: Server Actions và Route Handlers chứa toàn bộ logic nghiệp vụ — nơi hiện thực các quy tắc BRU-01..06, gồm cả tính phí ship và xử lý webhook từ MoMo/Green SM.",
    "Data Access: Prisma Client, mỗi entity ở ERD (SRS mục 3.5) tương ứng một Prisma model (11 model, mục 3).",
    "Database: PostgreSQL, triển khai trên dịch vụ PaaS (Railway/Supabase) theo Tech Stack mục 2.",
    "Integration: lớp gọi API/webhook ra ngoài tới MoMo (thanh toán) và Green SM (giao vận), đặt trong Application/Service, không để Presentation gọi trực tiếp đối tác bên thứ ba.",
])

# ===========================================================================
# 2. TECH STACK
# ===========================================================================
ds.heading(doc, "2. Tech Stack", level=1)
ds.table(doc, ["Thành phần", "Lựa chọn", "Lý do"], pd.TECH_STACK, col_widths_cm=[3.0, 5.0, 7.0])

# ===========================================================================
# 3. SCHEMA PRISMA
# ===========================================================================
ds.heading(doc, "3. Thiết kế Schema Prisma", level=1)
ds.para(doc, "Chuyển đổi trực tiếp từ ERD đã chốt ở SRS mục 3.5 (Hình 3.3): đầy đủ 11 model, khớp 1-1 với 11 "
             "thực thể của ERD và với Từ điển dữ liệu ở SRS mục 7.1. Trong ChiTietDonHang, soLuong chỉ có ý nghĩa với "
             "đơn mua (loai = Ban, mặc định 1, có thể > 1 — FR-BH-08); ngayBatDau/ngayKetThuc là NULL với đơn mua và "
             "bắt buộc với đơn thuê (loai = Thue).")
ds.code_block(doc, '''
model KhachHang {
  id            String   @id @default(uuid())
  hoTen         String
  email         String   @unique
  sdt           String
  matKhauHash   String
  donHang       DonHang[]
}

model SanPham {
  id            String   @id @default(uuid())
  ten           String
  moTa          String
  giaNiemYet    Decimal
  danhMuc       String
  anhUrl        String?
  hopGame       HopGame[]
  linhKien      LinhKien[]
  chiTietDon    ChiTietDonHang[]
}

model HopGame {
  id            String          @id @default(uuid())
  sanPhamId     String
  sanPham       SanPham         @relation(fields: [sanPhamId], references: [id])
  maHop         String          @unique
  trangThai     TrangThaiHopGame @default(Available)
}

model LinhKien {
  id            String   @id @default(uuid())
  sanPhamId     String
  sanPham       SanPham  @relation(fields: [sanPhamId], references: [id])
  tenLinhKien   String
  laDocBan      Boolean  @default(false)
}

model NhanVien {
  id            String   @id @default(uuid())
  hoTen         String
  email         String   @unique
  matKhauHash   String
  vaiTro        VaiTroNhanVien
  dangHoatDong  Boolean  @default(true)
  bienBanKiemDem BienBanKiemDem[]
}

model DonHang {
  id           String   @id @default(uuid())
  khachHangId  String
  khachHang    KhachHang @relation(fields: [khachHangId], references: [id])
  loai         LoaiDonHang
  trangThai    TrangThaiDon  @default(Pending)
  ngayTao      DateTime  @default(now())
  chiTiet      ChiTietDonHang[]
  datCoc       DatCoc?
  thanhToan    ThanhToan[]
}

model ChiTietDonHang {
  id           String   @id @default(uuid())
  donHangId    String
  donHang      DonHang  @relation(fields: [donHangId], references: [id])
  sanPhamId    String
  sanPham      SanPham  @relation(fields: [sanPhamId], references: [id])
  soLuong      Int      @default(1)
  ngayBatDau   DateTime?
  ngayKetThuc  DateTime?
  donGia       Decimal
  hinhThucNhan HinhThucNhan  @default(TuDenLay)
  hinhThucTra  HinhThucTra?
  giaoVan      GiaoVan[]
  bienBan      BienBanKiemDem[]
}

model DatCoc {
  id          String   @id @default(uuid())
  donHangId   String   @unique
  donHang     DonHang  @relation(fields: [donHangId], references: [id])
  soTien      Decimal
  phiShipGiu  Decimal  @default(0)
  trangThai   TrangThaiCoc  @default(Held)
  ngayHoan    DateTime?
}

model GiaoVan {
  id                  String   @id @default(uuid())
  chiTietDonId        String
  chiTietDon          ChiTietDonHang @relation(fields: [chiTietDonId], references: [id])
  chieu               ChieuGiaoVan
  khuVuc               KhuVucGiaoVan
  phiShip              Decimal
  maVanDon             String?  @unique
  trangThaiVanChuyen   TrangThaiVanChuyen
}

model ThanhToan {
  id          String   @id @default(uuid())
  donHangId   String
  donHang     DonHang  @relation(fields: [donHangId], references: [id])
  soTien      Decimal
  mucDich     MucDichThanhToan
  trangThai   TrangThaiThanhToan  @default(ChoThanhToan)
  maQR        String?  @unique
}

model BienBanKiemDem {
  id             String   @id @default(uuid())
  chiTietDonId   String
  chiTietDon     ChiTietDonHang @relation(fields: [chiTietDonId], references: [id])
  nhanVienId     String
  nhanVien       NhanVien @relation(fields: [nhanVienId], references: [id])
  ketQua         String
  ngayLap        DateTime @default(now())
}
''')

# ===========================================================================
# 4. ENUM / TYPES
# ===========================================================================
ds.heading(doc, "4. PostgreSQL Types & Enum", level=1)
ds.table(doc, ["Enum", "Giá trị", "Dùng ở Model"], [
    ["TrangThaiDon", "Pending, Confirmed, Active, Overdue, Completed, Closed", "DonHang (khớp State Machine SRS Hình 3.6)"],
    ["TrangThaiHopGame", "Available, Reserved, Rented, Checking, Damaged, Sold", "HopGame (khớp State Machine SRS Hình 3.7)"],
    ["LoaiDonHang", "Ban, Thue", "DonHang"],
    ["TrangThaiCoc", "Held, Refunded, Partially_Refunded", "DatCoc"],
    ["VaiTroNhanVien", "Staff, Admin", "NhanVien"],
    ["HinhThucNhan", "TuDenLay, GiaoVan", "ChiTietDonHang.hinhThucNhan (BR-09)"],
    ["HinhThucTra", "TuMangTra, GiaoVan", "ChiTietDonHang.hinhThucTra (BR-09)"],
    ["ChieuGiaoVan", "Nhan, Tra", "GiaoVan.chieu"],
    ["KhuVucGiaoVan", "NoiThanh, NgoaiThanh, NgoaiTinh", "GiaoVan.khuVuc (BRU-05)"],
    ["TrangThaiVanChuyen", "DangGiao, DaGiao, DangLay, DaLay", "GiaoVan.trangThaiVanChuyen (FR-TTGV-05)"],
    ["MucDichThanhToan", "TienHang, TienCoc, ThuThem", "ThanhToan.mucDich (FR-TTGV-06)"],
    ["TrangThaiThanhToan", "ChoThanhToan, DaThanhToan, HetHieuLuc", "ThanhToan.trangThai (BRU-06)"],
], col_widths_cm=[3.5, 7.0, 4.5])

# ===========================================================================
# 5. INDEX
# ===========================================================================
ds.heading(doc, "5. Thiết kế Index", level=1)
ds.table(doc, ["Bảng", "Cột lập chỉ mục", "Mục đích"], [
    ["ChiTietDonHang", "(san_pham_id, ngay_bat_dau, ngay_ket_thuc)", "Tăng tốc truy vấn kiểm tra tồn kho theo khoảng ngày (FR-CT-02, thuật toán mục 13)."],
    ["DonHang", "khach_hang_id", "Tăng tốc tra cứu lịch sử đơn theo khách hàng (FR-BH-05)."],
    ["DonHang", "trang_thai", "Tăng tốc lọc đơn theo trạng thái trên POS nội bộ (SCR-04)."],
    ["HopGame", "trang_thai", "Tăng tốc tra cứu sản phẩm theo trạng thái khi xuất/nhập kho."],
    ["LinhKien", "san_pham_id", "Tăng tốc lấy checklist linh kiện khi hiển thị chi tiết sản phẩm (FR-BH-03)."],
    ["GiaoVan", "ma_van_don (UNIQUE)", "Tra cứu O(1) lượt giao vận theo mã vận đơn khi xử lý webhook Green SM (FR-TTGV-05, mục 16)."],
    ["ThanhToan", "ma_qr (UNIQUE)", "Tra cứu O(1) khoản thanh toán theo mã QR khi xử lý webhook MoMo (FR-TTGV-07, mục 16)."],
    ["ThanhToan", "(don_hang_id, trang_thai)", "Tăng tốc kiểm tra các khoản còn chờ thanh toán của một đơn (ví dụ khi quyết toán hoàn cọc, UC-07)."],
    ["BienBanKiemDem", "chi_tiet_don_id", "Tăng tốc tra cứu biên bản kiểm đếm theo dòng đơn khi quyết toán (UC-08)."],
], col_widths_cm=[3.0, 5.5, 6.5])

# ===========================================================================
# 6. DU LIEU MAU
# ===========================================================================
ds.heading(doc, "6. Dữ liệu mẫu — 5 tựa board game", level=1)
ds.table(doc, ["Tên", "Danh mục", "Số người chơi", "Giá niêm yết", "Số linh kiện"],
          [[name, cat, f"{lo}-{hi}", f"{price:,} VNĐ".replace(",", "."), str(len(comps))]
           for name, cat, lo, hi, price, comps in pd.SAMPLE_GAMES],
          col_widths_cm=[4.5, 3.5, 2.5, 3.0, 2.0])

ds.heading(doc, "7. Checklist linh kiện theo từng game", level=1)
for name, _cat, _lo, _hi, _price, comps in pd.SAMPLE_GAMES:
    ds.para(doc, name, bold=True)
    ds.bullets(doc, comps)

ds.heading(doc, "8. Kịch bản Seed Data", level=1)
ds.numbered(doc, [
    "Tạo 3 tài khoản demo: 1 Customer (bảng KhachHang), 1 Staff và 1 Admin (bảng NhanVien, có email/matKhauHash riêng, dangHoatDong = true) — mật khẩu demo đã băm.",
    "Nạp 5 sản phẩm mẫu ở mục 6 kèm danh sách linh kiện tương ứng ở mục 7 vào bảng SanPham/LinhKien.",
    "Với mỗi sản phẩm, tạo 2 bản ghi HopGame ở trạng thái Available để có dữ liệu thử nghiệm đặt thuê, riêng 2 sản phẩm (UNO, Cờ Cá Ngựa) tạo thêm mỗi sản phẩm 2 bản ghi HopGame ở trạng thái Sold để kiểm thử giỏ hàng nhiều sản phẩm/số lượng.",
    "Tạo 2 đơn thuê mẫu: 1 đơn Active với hinhThucNhan = TuDenLay (không phí ship), 1 đơn Completed đã hoàn cọc với hinhThucNhan = GiaoVan khu vực NoiThanh (có GiaoVan + ThanhToan mẫu) để kiểm thử cả hai nhánh BRU-01/BRU-05.",
    "Với đơn Completed, tạo kèm 1 bản ghi ThanhToan (mucDich = TienCoc, trangThai = DaThanhToan, có maQR) và 1 bản ghi BienBanKiemDem (ketQua = 'Đủ linh kiện') để kiểm thử luồng hoàn cọc đầy đủ.",
    "Tạo 1 đơn mua mẫu (loai = Ban) đã Confirmed, gồm 2 dòng ChiTietDonHang: UNO soLuong = 2 và Cờ Cá Ngựa soLuong = 1, gắn với các bản ghi HopGame trạng thái Sold ở trên, để kiểm thử luồng giỏ hàng nhiều sản phẩm (UC-03/FR-BH-08/09).",
])

# ===========================================================================
# 9-10. SITEMAP, NAVIGATION
# ===========================================================================
ds.heading(doc, "9. Sitemap", level=1)
ds.picture(doc, DIAG + "sdd_sitemap.png", width_cm=16)

ds.heading(doc, "10. Luồng điều hướng (Navigation Flow)", level=1)
ds.picture(doc, DIAG + "sdd_navigation_flow.png", width_cm=11)

# ===========================================================================
# 11-12. WIREFRAME
# ===========================================================================
ds.heading(doc, "11. Wireframe UI phía Khách hàng", level=1)
ds.para(doc, "Kế thừa và giữ nguyên 4 wireframe đã thiết kế ở SRS Phụ lục A (SCR-01 Danh sách sản phẩm, SCR-02 "
             "Chi tiết sản phẩm & Đặt thuê, SCR-06 Thanh toán mã QR, SCR-07 Yêu cầu giao vận lấy hàng trả); không "
             "lặp lại hình tại đây để tránh trùng lặp tài liệu. SCR-03 (Giỏ hàng / Thanh toán) và SCR-10 (Quên/đặt "
             "lại mật khẩu) chưa có wireframe ở SRS nên được bổ sung dưới đây:")
ds.picture(doc, DIAG + "sdd_wireframe_cart.png", width_cm=9)
ds.picture(doc, DIAG + "sdd_wireframe_forgot_password.png", width_cm=9)

ds.heading(doc, "12. Wireframe UI phía POS/Admin", level=1)
ds.picture(doc, DIAG + "sdd_wireframe_pos.png", width_cm=9)
ds.picture(doc, DIAG + "sdd_wireframe_report.png", width_cm=9)
ds.picture(doc, DIAG + "sdd_wireframe_staff_login.png", width_cm=9)
ds.picture(doc, DIAG + "sdd_wireframe_staff_admin.png", width_cm=9)

# ===========================================================================
# 13. THUAT TOAN KIEM TRA TON KHO
# ===========================================================================
ds.heading(doc, "13. Thuật toán kiểm tra tồn kho theo khoảng ngày", level=1)
ds.para(doc, "Một sản phẩm được coi là còn trống trong khoảng [từ, đến] nếu KHÔNG tồn tại đơn thuê nào đang hiệu "
             "lực (trạng thái Confirmed hoặc Active) có khoảng ngày giao với [từ, đến] (khớp FR-CT-02, BR-05).")
ds.code_block(doc, '''
function coSanPhamTrongKhoangNgay(sanPhamId, tuNgay, denNgay):
    donTrung = TRUY_VAN ChiTietDonHang
        JOIN DonHang ON ChiTietDonHang.donHangId = DonHang.id
        WHERE ChiTietDonHang.sanPhamId = sanPhamId
          AND DonHang.trangThai IN ('Confirmed', 'Active')
          AND ChiTietDonHang.ngayBatDau <= denNgay
          AND ChiTietDonHang.ngayKetThuc >= tuNgay
    RETURN donTrung.count == 0
''')
ds.para(doc, "Độ phức tạp: O(log n) nhờ index (san_pham_id, ngay_bat_dau, ngay_ket_thuc) đã thiết kế ở mục 5. "
             "Hàm này được gọi trong Server Action tạo đơn thuê (FR-CT-01) trước khi ghi dữ liệu, trong một "
             "transaction để tránh race condition khi 2 khách đặt cùng lúc.")

# ===========================================================================
# 14. MODULE TINH GIA / PHAT
# ===========================================================================
ds.heading(doc, "14. Module tính toán giá thuê và phạt trễ hạn", level=1)
ds.para(doc, "Hiện thực trực tiếp quy tắc BRU-02 (giá thuê lũy tiến) và BRU-03 (phạt trễ hạn) đã định nghĩa ở BRD mục 8.2.")
ds.code_block(doc, '''
function tinhTienThue(giaNiemYet, soNgay):
    tong = 0
    for ngayThu in 1..soNgay:
        if ngayThu == 1:            donGia = giaNiemYet * 0.10
        elif ngayThu <= 10:         donGia = giaNiemYet * 0.07
        else:                       donGia = giaNiemYet * 0.05
        tong += donGia
    return tong

function tinhPhatTreHan(giaNiemYet, soNgayTre):
    phat = giaNiemYet * 0.15 * soNgayTre   // BRU-03
    return MIN(phat, giaNiemYet)           // tran phat = tien coc da giu (phan goc, chua gom phi ship)
''')

# ===========================================================================
# 15. THUAT TOAN PHI GIAO VAN & CHENH LECH HOAN COC (MOI)
# ===========================================================================
ds.heading(doc, "15. Thuật toán tính phí giao vận và chênh lệch hoàn cọc", level=1)
ds.para(doc, "Hiện thực trực tiếp quy tắc BRU-01 (tiền cọc có cộng phí ship) và BRU-05 (phí ship theo khu vực), "
             "đồng thời giải quyết FR-TTGV-08 (chênh lệch phí ship giữa lúc giữ cọc và lúc quyết toán).")
ds.code_block(doc, '''
BANG_PHI_SHIP = { NoiThanh: 20000, NgoaiThanh: 35000, NgoaiTinh: 60000 }   // BRU-05

function tinhPhiShip(khuVuc, hinhThuc):
    if hinhThuc == 'TuDenLay' or hinhThuc == 'TuMangTra':
        return 0
    return BANG_PHI_SHIP[khuVuc]

function tinhTienCoc(giaNiemYet, hinhThucNhan, khuVucNhan):
    // BRU-01: coc = gia niem yet + phi ship chieu nhan x 2 (du tru ca 2 chieu), neu co giao van o chieu nhan
    phiShipNhan = tinhPhiShip(khuVucNhan, hinhThucNhan)
    phiShipGiu = phiShipNhan * 2
    tienCoc = giaNiemYet + phiShipGiu
    return { tienCoc, phiShipGiu }

function tinhChenhLechShipLucHoanCoc(phiShipGiu, hinhThucTra, khuVucTra):
    // FR-TTGV-08: so sanh phi da giu (BRU-01) voi phi thuc te phat sinh o chieu tra
    phiShipTraThucTe = tinhPhiShip(khuVucTra, hinhThucTra)
    phiShipDaGiuChoChieuTra = phiShipGiu / 2
    chenhLech = phiShipDaGiuChoChieuTra - phiShipTraThucTe
    // chenhLech > 0  => hoan them cho khach (da giu nhieu hon thuc te)
    // chenhLech < 0  => thu them tu khach (thuc te nhieu hon da giu)
    return chenhLech
''')
ds.para(doc, "Hàm tinhTienCoc được gọi trong luồng đặt thuê (FR-CT-03, UC-04); hàm tinhChenhLechShipLucHoanCoc "
             "được gọi trong luồng quyết toán hoàn cọc (FR-CT-07, UC-07), cộng dồn kết quả với tinhPhatTreHan và "
             "quy chế đền bù BRU-04 để ra số tiền hoàn cọc cuối cùng.")

# ===========================================================================
# 16. LUONG XU LY WEBHOOK (MOI)
# ===========================================================================
ds.heading(doc, "16. Luồng xử lý webhook xác nhận thanh toán & vận chuyển", level=1)
ds.para(doc, "Hiện thực BRU-06 (chỉ xác nhận thanh toán qua webhook, không cho xác nhận thủ công — FR-TTGV-07) và "
             "FR-TTGV-05 (cập nhật trạng thái vận chuyển qua webhook Green SM). Hai webhook endpoint này là bề mặt "
             "tấn công bên ngoài duy nhất không yêu cầu đăng nhập, nên phải xác thực chữ ký trước khi xử lý (khớp NFR-07).")
ds.code_block(doc, '''
function xuLyWebhookThanhToan(request):
    // 1. Xac thuc nguon goc request
    if KHONG xacThucChuKy(request.headers, request.body, MOMO_SECRET_KEY):
        RETURN HTTP 401

    { maQR, trangThaiMoMo, soTien } = request.body
    thanhToan = TRUY_VAN ThanhToan WHERE maQR = maQR

    if thanhToan == null:
        RETURN HTTP 404

    // 2. Idempotency: webhook co the duoc MoMo gui lai nhieu lan
    if thanhToan.trangThai == 'DaThanhToan':
        RETURN HTTP 200   // da xu ly truoc do, tra OK de MoMo ngung gui lai

    if trangThaiMoMo != 'THANH_CONG' or soTien != thanhToan.soTien:
        thanhToan.trangThai = 'HetHieuLuc'
        RETURN HTTP 200

    // 3. Cap nhat trang thai trong 1 transaction
    BEGIN TRANSACTION
        thanhToan.trangThai = 'DaThanhToan'
        capNhatTrangThaiDonHangLienQuan(thanhToan.donHangId, thanhToan.mucDich)  // vi du: Pending -> Confirmed
    COMMIT
    RETURN HTTP 200

function xuLyWebhookVanChuyen(request):
    if KHONG xacThucChuKy(request.headers, request.body, GREENSM_SECRET_KEY):
        RETURN HTTP 401

    { maVanDon, trangThaiMoi } = request.body
    giaoVan = TRUY_VAN GiaoVan WHERE maVanDon = maVanDon
    if giaoVan == null:
        RETURN HTTP 404

    giaoVan.trangThaiVanChuyen = trangThaiMoi
    RETURN HTTP 200
''')

# ===========================================================================
# 17. API ENDPOINTS
# ===========================================================================
ds.heading(doc, "17. Đặc tả API Endpoints", level=1)
ds.table(doc, ["Method", "Path", "Request body", "Response body", "Status"], [
    ["GET", "/api/products", "— (query: danhMuc, giaMin, giaMax, q)", "SanPham[]", "200"],
    ["GET", "/api/products/:id", "—", "SanPham + linhKien[] + hopGame[]", "200 / 404"],
    ["POST", "/api/auth/forgot-password", "{email}", "{sent: true}", "200"],
    ["POST", "/api/auth/reset-password", "{token, matKhauMoi}", "{reset: true}", "200 / 400 (token hết hiệu lực)"],
    ["GET", "/api/cart", "—", "{items: [{sanPhamId, soLuong, donGia}]}", "200"],
    ["POST", "/api/cart/items", "{sanPhamId, soLuong}", "{items: [...]}", "200 / 409 (vượt số lượng còn hàng)"],
    ["PATCH", "/api/cart/items/:sanPhamId", "{soLuong}", "{items: [...]}", "200 / 409"],
    ["DELETE", "/api/cart/items/:sanPhamId", "—", "{items: [...]}", "200"],
    ["POST", "/api/orders", "{hinhThucNhan, khuVucNhan?} (tạo đơn từ giỏ hàng hiện tại)", "{donHangId, tienHang, phiShip}", "201 / 409 (hết hàng)"],
    ["POST", "/api/orders/:id/cancel", "—", "{trangThai: 'Cancelled'}", "200 / 409 (đơn không ở Pending)"],
    ["POST", "/api/rentals", "{sanPhamId, ngayBatDau, ngayKetThuc, hinhThucNhan, khuVucNhan?}", "{donHangId, tienThue, phiShip, tienCoc}", "201 / 409 (trùng lịch)"],
    ["POST", "/api/rentals/:id/confirm", "{nhanVienId}", "{trangThai: 'Confirmed'}", "200 / 404"],
    ["POST", "/api/rentals/:id/checkin", "{ketQuaKiemDem[]}", "{bienBanId, trangThaiHopGame}", "200"],
    ["POST", "/api/rentals/:id/return-request", "{hinhThucTra, khuVucTra?}", "{maVanDon?, phiShipTra}", "200 / 409"],
    ["POST", "/api/rentals/:id/settle", "{ngayTra}", "{tienPhat, tienDenBu, chenhLechShip, tienHoanCoc}", "200"],
    ["POST", "/api/payments/qr", "{donHangId, mucDich}", "{maQR, soTien}", "201"],
    ["POST", "/api/payments/webhook", "(từ MoMo) {maQR, trangThaiMoMo, soTien}", "{received: true}", "200 / 401 / 404"],
    ["POST", "/api/shipments", "{chiTietDonId, chieu, khuVuc}", "{maVanDon, phiShip}", "201"],
    ["POST", "/api/shipments/webhook", "(từ Green SM) {maVanDon, trangThaiMoi}", "{received: true}", "200 / 401 / 404"],
    ["POST", "/api/staff/login", "{email, matKhau}", "{token, vaiTro}", "200 / 401"],
    ["GET", "/api/staff", "— (chỉ Admin)", "NhanVien[]", "200 / 403"],
    ["POST", "/api/staff", "{hoTen, email, vaiTro} (chỉ Admin)", "NhanVien", "201 / 403"],
    ["PATCH", "/api/staff/:id", "{hoTen?, vaiTro?, dangHoatDong?} (chỉ Admin)", "NhanVien", "200 / 403 / 404"],
    ["GET", "/api/reports/revenue", "— (query: thang, nam)", "{doanhThuBan, doanhThuThue}", "200"],
    ["GET", "/api/reports/operations", "— (query: thang, nam)", "{tonKhoTheoTrangThai, donTheoTrangThai}", "200 / 403"],
], col_widths_cm=[1.8, 3.6, 4.4, 3.6, 2.6])

# ===========================================================================
# 18. DESIGN CLASS DIAGRAM V2
# ===========================================================================
ds.heading(doc, "18. Design Class Diagram v2 (Service/Controller)", level=1)
ds.para(doc, "Nâng cấp Sơ đồ lớp Domain v1 (chỉ thuộc tính, ở SRS mục 3.5, Hình 3.2) thành Sơ đồ lớp thiết kế "
             "phiên bản 2, bổ sung đầy đủ Methods và các lớp Service/Controller theo kiến trúc phân lớp ở mục 1. "
             "Trình bày bằng code PlantUML, đồng bộ cách làm với mọi sơ đồ UML ở SRS.")
ds.code_block(doc, """@startuml
hide circle
skinparam classAttributeIconSize 0

class SanPhamController {
  +layDanhSach(filter) : SanPham[]
  +layChiTiet(id) : SanPham
}
class GioHangController {
  +xemGioHang() : GioHang
  +themSanPham(sanPhamId, soLuong) : GioHang
  +suaSoLuong(sanPhamId, soLuong) : GioHang
  +xoaSanPham(sanPhamId) : GioHang
}
class DonMuaController {
  +taoDonMua(dto) : DonHang
  +huyDon(id) : DonHang
}
class DonThueController {
  +taoDonThue(dto) : DonHang
  +xacNhanDon(id, nhanVienId) : DonHang
  +ghiNhanKiemDem(id, ketQua[]) : BienBanKiemDem
  +yeuCauTraHang(id, hinhThucTra, khuVuc) : GiaoVan
  +quyetToanHoanCoc(id) : DatCoc
}
class ThanhToanController {
  +sinhMaQR(donHangId, mucDich) : ThanhToan
  +xuLyWebhookThanhToan(payload) : void
}
class GiaoVanController {
  +taoYeuCauGiaoVan(chiTietDonId, chieu, khuVuc) : GiaoVan
  +xuLyWebhookVanChuyen(payload) : void
}
class AuthController {
  +dangKy(dto) : KhachHang
  +dangNhap(email, matKhau) : token
  +quenMatKhau(email) : void
  +datLaiMatKhau(token, matKhauMoi) : void
}
class AdminController {
  +dangNhapNoiBo(email, matKhau) : token
  +taoNhanVien(dto) : NhanVien
  +capNhatNhanVien(id, dto) : NhanVien
  +layBaoCaoDoanhThu(thang, nam) : BaoCaoDoanhThu
  +layBaoCaoVanHanh(thang, nam) : BaoCaoVanHanh
}

class SanPhamService {
  +layDanhSach(filter) : SanPham[]
  +kiemTraTonKho(sanPhamId, tuNgay, denNgay) : boolean
  +kiemTraConHang(sanPhamId, soLuong) : boolean
  +themSuaXoaSanPham(dto) : SanPham
}
class GioHangService {
  +layGioHang(khachHangId) : GioHang
  +themSanPham(khachHangId, sanPhamId, soLuong) : GioHang
  +suaSoLuong(khachHangId, sanPhamId, soLuong) : GioHang
  +xoaSanPham(khachHangId, sanPhamId) : GioHang
}
class DonMuaService {
  +taoDonMua(khachHangId, hinhThucNhan, khuVucNhan) : DonHang
  +huyDon(id) : void
}
class DonThueService {
  +taoDonThue(dto) : DonHang
  +xacNhanDon(id) : void
  +tinhTienThue(giaNiemYet, soNgay) : Decimal
}
class KhoService {
  +ghiNhanKiemDem(dto) : BienBanKiemDem
  +capNhatTrangThaiHopGame(id, trangThai) : void
}
class CocService {
  +tinhTienCoc(giaNiemYet, hinhThucNhan, khuVuc) : {tienCoc, phiShipGiu}
  +tinhPhatTreHan(donId) : Decimal
  +tinhDenBu(donId) : Decimal
  +tinhChenhLechShipLucHoanCoc(phiShipGiu, hinhThucTra, khuVuc) : Decimal
  +hoanCoc(donId) : DatCoc
}
class ThanhToanService {
  +sinhMaQR(donHangId, mucDich, soTien) : ThanhToan
  +xacThucChuKy(headers, body, secretKey) : boolean
  +xuLyWebhook(payload) : void
}
class GiaoVanService {
  +tinhPhiShip(khuVuc, hinhThuc) : Decimal
  +taoYeuCauGiaoNhan(chiTietDonId, chieu, khuVuc) : GiaoVan
  +xuLyWebhook(payload) : void
}
class AuthService {
  +dangKy(dto) : KhachHang
  +xacThuc(email, matKhau) : KhachHang
  +taoTokenDatLaiMatKhau(email) : String
  +datLaiMatKhau(token, matKhauMoi) : void
}
class NhanVienService {
  +xacThucNoiBo(email, matKhau) : NhanVien
  +taoNhanVien(dto) : NhanVien
  +capNhatNhanVien(id, dto) : NhanVien
}
class BaoCaoService {
  +tinhDoanhThu(thang, nam) : BaoCaoDoanhThu
  +tongHopTonKho() : Map
  +tongHopDonTheoTrangThai() : Map
}

SanPhamController --> SanPhamService : gọi
GioHangController --> GioHangService : gọi
DonMuaController --> DonMuaService : gọi
DonMuaController --> ThanhToanService : gọi
DonThueController --> DonThueService : gọi
DonThueController --> KhoService : gọi
DonThueController --> CocService : gọi
DonThueController --> GiaoVanService : gọi
ThanhToanController --> ThanhToanService : gọi
GiaoVanController --> GiaoVanService : gọi
AuthController --> AuthService : gọi
AdminController --> NhanVienService : gọi
AdminController --> SanPhamService : gọi
AdminController --> BaoCaoService : gọi
GioHangService --> SanPhamService : gọi (kiểm tra còn hàng)
DonMuaService --> GioHangService : gọi (chốt đơn từ giỏ hàng)
DonMuaService --> SanPhamService : gọi (kiểm tra còn hàng)
DonThueService --> CocService : gọi
DonThueService --> GiaoVanService : gọi
CocService --> GiaoVanService : gọi (tính chênh lệch ship)
@enduml""")
ds.caption(doc, "Hình 1 – Design Class Diagram v2 (Service/Controller)")

# ===========================================================================
# 19. KY DUYET
# ===========================================================================
ds.heading(doc, "19. Phê duyệt kỹ thuật", level=1)
ds.para(doc, "Tài liệu thiết kế hệ thống được xem là chốt kỹ thuật (Technical Sign-off) khi có đầy đủ xác nhận dưới đây; "
             "sau khi ký, mọi thay đổi kiến trúc/schema phải tuân theo quy trình thay đổi yêu cầu đã nêu ở SRS Phụ lục C.")
ds.sign_off_table(doc, pd.APPROVERS)

doc.save(OUT_PATH)
print("DONE: SDD_BoardVerse_v1.0.docx")
