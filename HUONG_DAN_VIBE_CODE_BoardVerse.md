# Hướng dẫn Vibe Code BoardVerse — Từ SDD ra web chạy được

> Nguồn sự thật duy nhất: `deliverables/BRD_BoardVerse_v1.0.docx`, `deliverables/SRS_BoardVerse_v1.0.docx`, `deliverables/SDD_BoardVerse_v1.0.docx`.
> **MoMo và Green SM là đối tác GIẢ ĐỊNH — tuyệt đối không gọi API thật, không đăng ký merchant thật.**
> Mỗi phần dưới đây có sẵn 1 khối prompt — copy nguyên khối đó dán cho AI (Cursor/Claude/Copilot...), đi đúng thứ tự, không gộp nhiều phần vào 1 prompt.

---

## 0. Nguyên tắc làm việc với AI khi vibe code

1. Luôn đi theo **lát cắt dọc (vertical slice)**: 1 User Story = 1 prompt = UI → Server Action/API → DB, chạy được ngay rồi mới sang cái tiếp theo.
2. Mỗi prompt đã dán kèm sẵn FR/BR/BRU/schema liên quan — không tự thêm field, không gọi API thật ra ngoài.
3. Sau mỗi prompt, tự chạy thử trên `localhost:3000` trước khi qua prompt kế.
4. Nếu AI đề xuất đổi schema/kiến trúc khác SDD, dừng lại hỏi lý do trước khi đồng ý.
5. Commit Git riêng theo từng slice, message rõ (`feat: UC-04 đặt thuê theo ngày`).

---

## 1. Khởi tạo project (ứng với DEV-01, DEV-02)

```
Khởi tạo một project Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui.

Cấu trúc thư mục mong muốn:
- app/(customer)/...   — các trang dành cho khách hàng
- app/(staff)/...      — các trang dành cho nhân viên kho/quầy
- app/(admin)/...      — các trang dành cho quản lý vận hành
- app/api/...          — route handlers (API nội bộ + webhook mock)
- prisma/              — schema.prisma, seed.ts
- lib/                 — pricing/, state-machine/, mock-partners/
- components/          — UI dùng chung

Dùng Prisma ORM với PostgreSQL. Dùng Auth.js (NextAuth) credentials provider (email/mật khẩu, hash bằng bcrypt) cho đăng nhập, không dùng OAuth Google/Facebook.

Ở bước này CHƯA viết logic nghiệp vụ gì, chỉ tạo khung project, cấu hình Tailwind theme màu:
primary: #0284C7, primary-dark: #0369A1, accent: #059669, ink: #0F172A, surface: #F0F9FF.
Font: "Baloo Tamma 2" cho heading, "Be Vietnam Pro" cho nội dung (đồng bộ với landing page đã có sẵn ở landing/index.html).
```

---

## 2. Schema Prisma (ứng với DEV-02)

```
Tạo file prisma/schema.prisma với datasource PostgreSQL, đúng 100% 11 model và các enum sau — KHÔNG thêm field, KHÔNG đổi tên, KHÔNG tự "tối ưu" lại quan hệ:

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
  vaiTro        VaiTroNhanVien
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
  ngayBatDau   DateTime
  ngayKetThuc  DateTime
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

Enum:
TrangThaiDon { Pending, Confirmed, Active, Overdue, Completed, Closed }
TrangThaiHopGame { Available, Reserved, Rented, Checking, Damaged }
LoaiDonHang { Ban, Thue }
TrangThaiCoc { Held, Refunded, Partially_Refunded }
VaiTroNhanVien { Staff, Admin }
HinhThucNhan { TuDenLay, GiaoVan }
HinhThucTra { TuMangTra, GiaoVan }
ChieuGiaoVan { Nhan, Tra }
KhuVucGiaoVan { NoiThanh, NgoaiThanh, NgoaiTinh }
TrangThaiVanChuyen { DangGiao, DaGiao, DangLay, DaLay }
MucDichThanhToan { TienHang, TienCoc, ThuThem }
TrangThaiThanhToan { ChoThanhToan, DaThanhToan, HetHieuLuc }

Thêm 3 index sau (ảnh hưởng hiệu năng truy vấn tồn kho/webhook):
- ChiTietDonHang: index (sanPhamId, ngayBatDau, ngayKetThuc)
- GiaoVan: maVanDon UNIQUE (đã có @unique, không cần thêm)
- ThanhToan: maQR UNIQUE (đã có), và thêm index (donHangId, trangThai)

Sau khi tạo schema, chạy migrate: npx prisma migrate dev --name init
```

---

## 3. Seed data (ứng với DEV-03)

```
Viết prisma/seed.ts theo đúng kịch bản sau, KHÔNG bịa thêm sản phẩm/account khác ngoài danh sách này:

1. Tạo 3 tài khoản demo: 1 KhachHang (email demo), 1 NhanVien vaiTro=Staff, 1 NhanVien vaiTro=Admin. Mật khẩu demo băm bằng bcrypt.

2. Tạo 5 sản phẩm (SanPham) kèm LinhKien:

- "Cờ Tỷ Phú (Monopoly bản Việt hoá)", danhMuc "Chiến thuật - Kinh doanh", giaNiemYet 450000.
  Linh kiện: Bàn cờ, 2 xúc xắc, 6 quân cờ hình, Bộ tiền giấy (7 mệnh giá), 28 thẻ sở hữu đất, Thẻ Cơ hội, Thẻ Khế ước, 32 nhà + 12 khách sạn gỗ.
- "Ma Sói (Werewolves)", danhMuc "Suy luận - Xã hội", giaNiemYet 220000.
  Linh kiện: Bộ bài vai trò (18 lá), Thẻ Đêm/Ngày, Hướng dẫn luật chơi, Hộp đựng bài.
- "Catan", danhMuc "Chiến thuật - Xây dựng", giaNiemYet 790000.
  Linh kiện: 19 ô địa hình lục giác, Khung viền biển, 18 thẻ cảng, Bộ tài nguyên (gỗ/đất sét/lúa/len/quặng), 25 thẻ phát triển, 95 nhà/đường/thành gỗ (4 màu), 2 xúc xắc, Thẻ cướp biển.
- "UNO", danhMuc "Bài - Gia đình", giaNiemYet 95000.
  Linh kiện: Bộ 108 lá bài UNO, Hộp nhựa đựng bài, Hướng dẫn luật chơi.
- "Cờ Cá Ngựa", danhMuc "Gia đình - Trẻ em", giaNiemYet 85000.
  Linh kiện: Bàn cờ gấp, 4 bộ quân cá ngựa (4 con/màu), 1 xúc xắc, Hộp đựng quân.

3. Với mỗi sản phẩm, tạo 2 bản ghi HopGame trạng thái Available (maHop tự sinh, ví dụ "HG-CATAN-01").

4. Tạo 2 đơn thuê mẫu:
   a. 1 đơn trạng thái Active, hinhThucNhan = TuDenLay (không phí ship).
   b. 1 đơn trạng thái Completed, hinhThucNhan = GiaoVan khu vực NoiThanh, có kèm 1 bản ghi GiaoVan và 1 bản ghi ThanhToan (mucDich=TienCoc, trangThai=DaThanhToan, có maQR) và 1 bản ghi BienBanKiemDem (ketQua = "Đủ linh kiện").

Chạy seed bằng: npx prisma db seed
```

---

## 4. UC-01 — Đăng ký / Đăng nhập

```
Code tính năng Đăng ký/Đăng nhập (UC-01) cho app Next.js đã có (schema Prisma model KhachHang: id, hoTen, email, sdt, matKhauHash).

Yêu cầu:
- Route: app/(customer)/register, app/(customer)/login.
- Đăng ký: nhập hoTen, email, sdt, mật khẩu → hash bằng bcrypt lưu vào matKhauHash. Email phải unique, báo lỗi rõ nếu trùng.
- Đăng nhập: dùng Auth.js credentials provider, xác thực email + mật khẩu.
- NFR-05: không bao giờ lưu mật khẩu dạng plain text.
- NFR-06: session tự hết hạn sau 30 phút không hoạt động.
- Sai mật khẩu 5 lần liên tiếp thì tạm khoá đăng nhập tài khoản đó 15 phút (lưu đếm số lần sai + thời điểm khoá, có thể thêm field tạm vào KhachHang nếu cần, báo tôi trước khi đổi schema).
- Sau đăng nhập, redirect khách vào app/(customer)/products.

Giao diện tối giản bằng shadcn/ui (Input, Button, Card), tiếng Việt toàn bộ, theme màu đã cấu hình sẵn ở bước khởi tạo.
```

---

## 5. UC-02 — Xem danh sách & chi tiết sản phẩm

```
Code tính năng Xem danh sách và chi tiết sản phẩm (UC-02).

FR liên quan:
- FR-BH-02: hiển thị danh sách sản phẩm kèm bộ lọc theo danh mục, khoảng giá, trạng thái (bán/thuê).
- FR-BH-03: trang chi tiết sản phẩm phải hiển thị đầy đủ checklist linh kiện đi kèm (model LinhKien liên kết SanPham).
- FR-BH-05: khách đã đăng nhập xem được lịch sử đơn mua/thuê của chính mình.

Route:
- app/(customer)/products — danh sách, có filter danhMuc + khoảng giaNiemYet, hiển thị cả SanPham có HopGame Available (cho thuê) và sản phẩm còn hàng (cho bán).
- app/(customer)/products/[id] — chi tiết: thông tin sản phẩm, danh sách linhKien (checklist), nút "Thêm vào giỏ" (mua) và nút "Đặt thuê" (dẫn sang luồng UC-04 ở prompt sau — chưa code UC-04 ở đây).
- app/(customer)/orders — lịch sử đơn của khách đang đăng nhập (chỉ query DonHang.khachHangId = session hiện tại).

Dùng Server Components để fetch dữ liệu (không cần client-side fetching cho danh sách/chi tiết). Chỉ code UI + query, chưa code logic đặt mua/đặt thuê.
```

---

## 6. UC-03 — Đặt mua (Checkout)

```
Code tính năng Đặt mua sản phẩm / Checkout (UC-03).

FR-BH-04: khách thêm sản phẩm vào giỏ và đặt mua (checkout), tạo đơn hàng loại "bán".

Yêu cầu:
- Giỏ hàng tạm lưu ở client (localStorage hoặc cookie), chưa cần bảng DB riêng cho giỏ.
- Route app/(customer)/cart hiển thị giỏ, cho chọn hình thức nhận hàng: TuDenLay hoặc GiaoVan (nếu GiaoVan thì chọn khu vực NoiThanh/NgoaiThanh/NgoaiTinh).
- Phí ship nếu chọn GiaoVan: NoiThanh 20.000đ, NgoaiThanh 35.000đ, NgoaiTinh 60.000đ (BRU-05). Nếu TuDenLay thì phí ship = 0.
- Server Action createOrder: tạo DonHang (loai=Ban, trangThai=Pending), ChiTietDonHang tương ứng từng sản phẩm trong giỏ (donGia = giaNiemYet lúc đặt, hinhThucNhan theo lựa chọn). Chạy trong 1 transaction Prisma.
- Sau khi tạo đơn, chuyển khách sang trang thanh toán (app/(customer)/checkout/[orderId]/pay) — luồng thanh toán QR sẽ code ở prompt UC-10 riêng, ở đây chỉ cần tạo route trống redirect tới, chưa cần code chi tiết thanh toán.
```

---

## 7. UC-04 — Đặt thuê theo ngày (slice quan trọng nhất)

```
Code tính năng Đặt thuê theo ngày (UC-04) — đây là luồng cốt lõi nhất, làm đúng từng bước.

Đặc tả UC-04 (từ SRS):
- Điều kiện trước: Khách đã đăng nhập; sản phẩm đang ở trạng thái cho thuê được.
- Điều kiện sau: Đơn thuê được tạo ở trạng thái Pending, tiền thuê và tiền cọc (gồm phí ship nếu có) đã tính.
- Luồng chính:
  1. Khách chọn sản phẩm.
  2. Khách chọn ngày bắt đầu và ngày kết thúc thuê.
  3. Hệ thống kiểm tra tồn kho theo khoảng ngày (FR-CT-02).
  4. Khách chọn hình thức nhận hàng: tự đến lấy hoặc giao vận (FR-TTGV-01); nếu chọn giao vận, khách nhập khu vực nhận hàng.
  5. Hệ thống tính tiền thuê (FR-CT-04), phí ship nếu có (FR-TTGV-02) và tiền cọc theo BRU-01 (FR-CT-03).
  6. Khách xác nhận và thanh toán cọc online qua mã QR (dẫn sang UC-10, code ở prompt riêng).
  7. Hệ thống tạo đơn thuê trạng thái Pending.
- Luồng thay thế: 6a. Khách huỷ trước khi thanh toán → không tạo đơn.
- Luồng ngoại lệ: 3a. Sản phẩm không còn trống trong khoảng ngày đã chọn → báo lỗi, gợi ý ngày/sản phẩm khác, kết thúc use case.

Thuật toán kiểm tra tồn kho (SDD mục 13) — viết thành hàm trong lib/inventory/checkAvailability.ts:

function coSanPhamTrongKhoangNgay(sanPhamId, tuNgay, denNgay):
    donTrung = TRUY_VAN ChiTietDonHang
        JOIN DonHang ON ChiTietDonHang.donHangId = DonHang.id
        WHERE ChiTietDonHang.sanPhamId = sanPhamId
          AND DonHang.trangThai IN ('Confirmed', 'Active')
          AND ChiTietDonHang.ngayBatDau <= denNgay
          AND ChiTietDonHang.ngayKetThuc >= tuNgay
    RETURN donTrung.count == 0

Thuật toán tính tiền thuê (BRU-02, SDD mục 14) — lib/pricing/tinhTienThue.ts:

function tinhTienThue(giaNiemYet, soNgay):
    tong = 0
    for ngayThu in 1..soNgay:
        if ngayThu == 1:            donGia = giaNiemYet * 0.10
        elif ngayThu <= 10:         donGia = giaNiemYet * 0.07
        else:                       donGia = giaNiemYet * 0.05
        tong += donGia
    return tong

Thuật toán tính tiền cọc (BRU-01, SDD mục 15) — lib/pricing/tinhTienCoc.ts:

BANG_PHI_SHIP = { NoiThanh: 20000, NgoaiThanh: 35000, NgoaiTinh: 60000 }

function tinhPhiShip(khuVuc, hinhThuc):
    if hinhThuc == 'TuDenLay' or hinhThuc == 'TuMangTra':
        return 0
    return BANG_PHI_SHIP[khuVuc]

function tinhTienCoc(giaNiemYet, hinhThucNhan, khuVucNhan):
    phiShipNhan = tinhPhiShip(khuVucNhan, hinhThucNhan)
    phiShipGiu = phiShipNhan * 2
    tienCoc = giaNiemYet + phiShipGiu
    return { tienCoc, phiShipGiu }

Yêu cầu kỹ thuật:
- Route: app/(customer)/products/[id]/rent.
- Server Action taoDonThue: PHẢI chạy coSanPhamTrongKhoangNgay + tạo DonHang/ChiTietDonHang/DatCoc trong CÙNG 1 prisma.$transaction để tránh 2 khách đặt trùng lịch cùng lúc (race condition).
- Nếu coSanPhamTrongKhoangNgay trả false → throw lỗi rõ ràng, không tạo gì cả, hiển thị thông báo "Sản phẩm không còn trống trong khoảng ngày này, vui lòng chọn ngày hoặc sản phẩm khác."
- Viết 2 hàm pricing trên thành pure function, có thể unit test độc lập không cần DB.
- Sau khi tạo đơn (Pending), redirect sang trang thanh toán cọc (route checkout/[orderId]/pay — sẽ code ở prompt UC-10).
```

---

## 8. UC-10 — Thanh toán QR (MOCK MoMo — đọc kỹ trước khi dán)

```
Code tính năng Thanh toán trực tuyến qua mã QR (UC-10) — MÔ PHỎNG cổng MoMo, KHÔNG dùng SDK MoMo thật, KHÔNG gọi bất kỳ API ra Internet nào của MoMo.

Đặc tả UC-10 (từ SRS):
- Điều kiện trước: có một khoản cần thu xác định (tiền cọc đơn thuê, tiền hàng đơn mua, hoặc tiền còn thiếu khi quyết toán).
- Điều kiện sau: khoản thanh toán được xác nhận thành công, đơn hàng/đơn thuê liên quan chuyển trạng thái tương ứng (ví dụ Pending → Confirmed).
- Luồng chính: (1) hệ thống "gọi API MoMo" sinh mã QR gắn mã đơn + số tiền cần thu; (2) khách quét QR xác nhận; (3) MoMo gửi webhook báo thành công; (4) hệ thống xác nhận thanh toán, cập nhật trạng thái đơn.
- Ngoại lệ: không nhận webhook trong 15 phút → QR hết hiệu lực, báo khách thử lại; webhook báo thất bại → giữ nguyên trạng thái, báo thất bại.

Thiết kế MOCK (thay cho bước 1-3 thật):
- POST /api/payments/qr: nhận { donHangId, mucDich }. Sinh maQR = crypto.randomUUID(). Tạo bản ghi ThanhToan (trangThai=ChoThanhToan, maQR, soTien tương ứng mucDich — TienHang/TienCoc/ThuThem). Dùng lib "qrcode" để encode chuỗi maQR thành ảnh QR thật (ảnh QR là thật để demo trực quan, nội dung bên trong chỉ là ID nội bộ, không phải lệnh chuyển tiền thật). Trả về { maQR, soTien, qrImageDataUrl }.
- Trang app/(customer)/checkout/[orderId]/pay: hiển thị ảnh QR + số tiền + đồng hồ đếm 15 phút hết hiệu lực. Có 1 nút chỉ hiện khi biến env NEXT_PUBLIC_MOCK_MODE=true: "[DEV] Giả lập thanh toán thành công" — bấm vào gọi POST /api/payments/webhook với payload giả { maQR, trangThaiMoMo: 'THANH_CONG', soTien }.
- POST /api/payments/webhook — viết đúng logic sau (SDD mục 16), có xác thực chữ ký HMAC-SHA256 bằng secret lưu trong biến env MOCK_MOMO_SECRET (ký trên JSON.stringify(body) ở phía nút [DEV], verify lại ở route):

function xuLyWebhookThanhToan(request):
    if KHONG xacThucChuKy(request.headers, request.body, MOCK_MOMO_SECRET):
        RETURN HTTP 401
    { maQR, trangThaiMoMo, soTien } = request.body
    thanhToan = TRUY_VAN ThanhToan WHERE maQR = maQR
    if thanhToan == null: RETURN HTTP 404
    if thanhToan.trangThai == 'DaThanhToan': RETURN HTTP 200   // idempotent, webhook gửi lại nhiều lần
    if trangThaiMoMo != 'THANH_CONG' or soTien != thanhToan.soTien:
        thanhToan.trangThai = 'HetHieuLuc'
        RETURN HTTP 200
    BEGIN TRANSACTION
        thanhToan.trangThai = 'DaThanhToan'
        capNhatTrangThaiDonHangLienQuan(thanhToan.donHangId, thanhToan.mucDich)  // ví dụ Pending -> Confirmed
    COMMIT
    RETURN HTTP 200

- Thêm trang debug app/dev/mock-momo (chỉ truy cập được khi NEXT_PUBLIC_MOCK_MODE=true) có form tự nhập maQR/trạng thái để POST thử tới chính webhook này.

Bắt buộc: không tạo biến env nào tên MOMO_PARTNER_CODE/MOMO_ACCESS_KEY hay bất kỳ thứ gợi ý key thật. Chỉ dùng MOCK_MOMO_SECRET tự đặt trong .env.local.
```

---

## 9. UC-05 + UC-06 — Xác nhận đơn & Bàn giao xuất kho

```
Code 2 tính năng liên tiếp: Xác nhận đặt cọc (UC-05) và Bàn giao xuất kho (UC-06), dành cho Staff.

UC-05 (rút gọn): Nhân viên xem đơn thuê mới (trạng thái Pending, đã có ThanhToan trangThai=DaThanhToan cho mucDich=TienCoc), xác nhận đã thu cọc → hệ thống chuyển DonHang sang Confirmed.

UC-06 — Bàn giao xuất kho, đặc tả đầy đủ:
- Điều kiện trước: Đơn thuê ở trạng thái Confirmed (đã xác nhận, đã thu cọc).
- Điều kiện sau: Hộp game chuyển trạng thái Rented; đơn thuê chuyển trạng thái Active.
- Luồng chính:
  1. Nhân viên tra cứu đơn thuê theo mã đơn.
  2. Hệ thống hiển thị hình thức nhận hàng khách đã chọn (FR-TTGV-01).
  3a. Nếu tự đến lấy: nhân viên xác nhận bàn giao trực tiếp tại quầy.
  3b. Nếu giao vận: hệ thống "gọi API Green SM" tạo yêu cầu giao hàng (FR-TTGV-03) — MOCK, xem chi tiết ở phần dưới.
  4. Hệ thống cập nhật trạng thái hộp game thành Rented (FR-KHO-02).
  5. Hệ thống cập nhật đơn thuê thành Active.
- Ngoại lệ: 1a. Không tìm thấy mã đơn → báo lỗi, kết thúc. 3ba. API Green SM lỗi/không khả dụng → báo nhân viên tạm chuyển hình thức tự đến lấy hoặc thử lại sau.

MOCK Green SM cho bước 3b (KHÔNG gọi API hãng vận chuyển thật nào):
- POST /api/shipments: nhận { chiTietDonId, chieu: 'Nhan', khuVuc }. Tính phiShip theo bảng BANG_PHI_SHIP (NoiThanh 20000 / NgoaiThanh 35000 / NgoaiTinh 60000). Tạo bản ghi GiaoVan với maVanDon = 'MOCK-' + randomUUID().slice(0,8), trangThaiVanChuyen = DangGiao. Trả về { maVanDon, phiShip }.
- Nếu API này "lỗi" (giả lập bằng 1 checkbox debug hoặc cố tình không cần làm thật — ưu tiên để route luôn thành công trong bản demo, chỉ cần try/catch bọc sẵn để không crash UI).

Route: app/(staff)/orders — danh sách đơn cần xử lý; app/(staff)/orders/[id] — chi tiết đơn, 2 nút hành động: "Xác nhận đặt cọc" (UC-05) và "Bàn giao xuất kho" (UC-06, chỉ hiện khi đơn đã Confirmed).

Validate state machine DonHang (Pending→Confirmed→Active...) và HopGame (Available→Rented...) bằng 1 hàm thuần trong lib/state-machine/, không set trạng thái tự do ở route khác.
```

---

## 10. UC-08 + UC-09 — Kiểm đếm nhập kho & cập nhật trạng thái hộp game

```
Code tính năng Kiểm đếm linh kiện nhập kho (UC-08) và Cập nhật trạng thái hộp game (UC-09), dành cho Staff.

UC-08, đặc tả đầy đủ:
- Điều kiện trước: Sản phẩm đã về đến quầy (khách tự mang trả hoặc shipper giao vận chiều trả bàn giao lại).
- Điều kiện sau: Biên bản kiểm đếm được lưu; trạng thái hộp game cập nhật theo kết quả kiểm đếm.
- Luồng chính:
  1. Nhân viên mở checklist linh kiện của sản phẩm (FR-KHO-01) — lấy từ model LinhKien theo sanPhamId.
  2. Nhân viên đánh dấu từng linh kiện đủ/thiếu/hư hỏng.
  3. Hệ thống lưu biên bản kiểm đếm (model BienBanKiemDem, field ketQua — có thể lưu dạng JSON string tóm tắt kết quả từng linh kiện).
  4. Hệ thống cập nhật trạng thái hộp game (FR-KHO-02) — Available nếu đủ, Damaged nếu thiếu/hư hỏng.
- Ngoại lệ: 2a. Linh kiện không có trong checklist gốc → nhân viên ghi chú thủ công, hệ thống vẫn lưu biên bản.

UC-09 (rút gọn): Nhân viên chọn hộp game và trạng thái mới; hệ thống kiểm tra hợp lệ theo State Machine (Available→Reserved→Rented→Checking→Available/Damaged) trước khi cập nhật, từ chối nếu chuyển trạng thái không hợp lệ.

Route: app/(staff)/inventory/[chiTietDonId]/checkin — hiển thị checklist linh kiện (checkbox đủ/thiếu/hư hỏng từng item), nút "Lưu biên bản" gọi Server Action ghiNhanKiemDem, dùng chung hàm validate state machine đã viết ở prompt UC-05/06.
```

---

## 11. UC-11 — Yêu cầu giao vận lấy hàng trả (MOCK Green SM chiều trả)

```
Code tính năng Yêu cầu giao vận lấy hàng trả (UC-11), dành cho Customer. MÔ PHỎNG Green SM, không gọi API vận chuyển thật.

Đặc tả UC-11:
- Điều kiện trước: Đơn thuê đang ở trạng thái Active hoặc Overdue.
- Điều kiện sau: Yêu cầu lấy hàng trả được tạo với mã vận đơn; đơn thuê ghi nhận hình thức trả hàng là giao vận.
- Luồng chính:
  1. Khi đến hạn trả, hệ thống hiển thị 2 lựa chọn: tự mang ra quán hoặc bấm nút gọi Green SM đến lấy (FR-TTGV-01).
  2. Khách chọn gọi giao vận và xác nhận khu vực lấy hàng.
  3. Hệ thống tính phí ship chiều trả theo khu vực (FR-TTGV-02, dùng lại hàm tinhPhiShip đã viết ở prompt UC-04).
  4. Hệ thống "gọi API Green SM" tạo yêu cầu lấy hàng (FR-TTGV-04) — MOCK.
  5. Hệ thống ghi nhận hình thức trả hàng = giao vận cho đơn thuê (ChiTietDonHang.hinhThucTra = GiaoVan).
- Luồng thay thế: 1a. Khách chọn tự mang ra quán → ghi nhận hinhThucTra = TuMangTra, kết thúc tại đây.
- Ngoại lệ: 4a. API Green SM lỗi/không khả dụng → báo khách thử lại sau hoặc chọn tự mang ra quán.

MOCK cho bước 4 — tái dùng route /api/shipments đã tạo ở prompt UC-05/06, lần này gọi với { chiTietDonId, chieu: 'Tra', khuVuc }, trangThaiVanChuyen khởi tạo = DangLay.

Đồng thời code luôn webhook cập nhật trạng thái vận chuyển (UC-12, dùng chung cho cả chiều Nhận và Trả) — SDD mục 16:

function xuLyWebhookVanChuyen(request):
    if KHONG xacThucChuKy(request.headers, request.body, MOCK_GREENSM_SECRET):
        RETURN HTTP 401
    { maVanDon, trangThaiMoi } = request.body
    giaoVan = TRUY_VAN GiaoVan WHERE maVanDon = maVanDon
    if giaoVan == null: RETURN HTTP 404
    giaoVan.trangThaiVanChuyen = trangThaiMoi
    RETURN HTTP 200

Route POST /api/shipments/webhook theo đúng pseudocode trên, verify chữ ký bằng biến env MOCK_GREENSM_SECRET (không phải key Green SM thật).

Thêm trang debug app/dev/mock-greensm (chỉ hiện khi NEXT_PUBLIC_MOCK_MODE=true) có nút đổi trạng thái vận chuyển qua từng bước (DangLay→DaLay, DangGiao→DaGiao) để test webhook này bằng tay, mô phỏng Green SM gửi cập nhật.

Route khách hàng: app/(customer)/orders/[id]/return — 2 nút "Tự mang ra quán" / "Gọi giao vận đến lấy".
```

---

## 12. UC-07 — Quyết toán hoàn cọc (slice phức tạp nhất, làm sau cùng)

```
Code tính năng Quyết toán hoàn cọc (UC-07), dành cho Staff — đây là slice tổng hợp nhiều công thức, làm sau khi đã xong UC-08 (kiểm đếm) và UC-11 (giao vận trả).

Đặc tả UC-07:
- Điều kiện trước: Biên bản kiểm đếm (UC-08) đã hoàn tất cho đơn thuê liên quan; hình thức trả hàng thực tế đã xác định (UC-11 hoặc tự mang trả).
- Điều kiện sau: Số tiền hoàn cọc cuối cùng được tính và hoàn lại cho khách (hoặc thu thêm nếu còn thiếu); đơn thuê chuyển Completed rồi Closed.
- Luồng chính:
  1. Hệ thống tính phạt trễ hạn nếu có (FR-CT-06).
  2. Hệ thống tính đền bù nếu thiếu/hư hỏng linh kiện (FR-CT-07, theo BRU-04: linh kiện độc bản đền 100% giá trị nguyên bộ, phụ kiện thay thế được đền theo giá lẻ hoặc 20% giá trị nguyên bộ nếu không bán lẻ).
  3. Hệ thống tính chênh lệch phí ship giữa số đã giữ trong cọc và số thực tế phát sinh (FR-TTGV-08).
  4. Hệ thống tính số tiền hoàn cọc cuối cùng.
  5. Nhân viên xác nhận hoàn cọc; nếu còn thiếu tiền, hệ thống sinh mã QR để thu thêm (tái dùng route /api/payments/qr đã code ở UC-10, mucDich=ThuThem).
  6. Hệ thống cập nhật đơn thuê thành Completed.
- Luồng thay thế: 5a. Số tiền hoàn cọc = 0 → vẫn lập phiếu xác nhận hoàn cọc 0đ để lưu vết.
- Ngoại lệ: 4a. Tổng phạt/đền bù/ship vượt quá tiền cọc đã thu → báo số tiền khách còn phải trả thêm, KHÔNG tự trừ âm.

3 công thức cần viết thành pure function trong lib/pricing/ (SDD mục 14 + 15):

function tinhPhatTreHan(giaNiemYet, soNgayTre):
    phat = giaNiemYet * 0.15 * soNgayTre   // BRU-03
    return MIN(phat, giaNiemYet)           // trần phạt = tiền cọc gốc (chưa gồm phí ship)

function tinhChenhLechShipLucHoanCoc(phiShipGiu, hinhThucTra, khuVucTra):
    phiShipTraThucTe = tinhPhiShip(khuVucTra, hinhThucTra)   // hàm đã viết ở prompt UC-04
    phiShipDaGiuChoChieuTra = phiShipGiu / 2
    chenhLech = phiShipDaGiuChoChieuTra - phiShipTraThucTe
    // chenhLech > 0 => hoàn thêm cho khách; chenhLech < 0 => thu thêm từ khách
    return chenhLech

function tinhDenBu(bienBanKiemDem, danhSachLinhKien):
    // với mỗi linh kiện bị đánh dấu thiếu/hư hỏng trong biên bản (UC-08):
    //   nếu linhKien.laDocBan == true -> đền 100% giaNiemYet của sản phẩm
    //   nếu không -> đền theo giá linh kiện lẻ (nếu có dữ liệu) hoặc 20% giaNiemYet nếu không bán lẻ linh kiện đó
    // tổng hợp lại thành 1 số tiền đền bù

Route: app/(staff)/orders/[id]/settle — hiển thị breakdown rõ ràng từng khoản (tiền cọc gốc, - phạt trễ hạn, - đền bù, +/- chênh lệch ship, = số tiền hoàn/thu thêm), nút "Xác nhận quyết toán" gọi Server Action quyetToanHoanCoc trong 1 transaction: cập nhật DatCoc (trangThai=Refunded hoặc Partially_Refunded), nếu còn thiếu thì tạo ThanhToan mucDich=ThuThem và sinh QR, cập nhật DonHang=Completed.

Nếu tổng phạt+đền bù+chênh lệch ship vượt quá tienCoc gốc: không trừ âm, hiển thị rõ số tiền khách cần trả thêm và bắt buộc có khoản ThuThem trước khi cho phép chuyển Completed.
```

---

## 13. Báo cáo doanh thu (Admin)

```
Code tính năng Báo cáo doanh thu cơ bản theo tháng (FR-KHO-04), dành cho Admin.

Route: app/(admin)/reports — chọn tháng/năm, hiển thị:
- Tổng doanh thu bán (sum DonHang.loai=Ban đã hoàn tất, theo ChiTietDonHang.donGia).
- Tổng doanh thu thuê (sum tiền thuê đã thu, trừ phần hoàn cọc — không tính tiền cọc gốc vào doanh thu).
- Số đơn theo trạng thái trong tháng.

Chỉ cần 1 Server Component query tổng hợp bằng Prisma groupBy/aggregate theo khoảng ngày của tháng được chọn, hiển thị bằng bảng đơn giản, không cần chart phức tạp ở bản demo đầu tiên.
```

---

## 14. Kiểm thử nghiệm thu tay (ứng với DEV-09/10)

```
Dựa trên toàn bộ code đã viết, hãy liệt kê cho tôi danh sách các bước tôi cần tự tay thử trên localhost để xác nhận 4 kịch bản sau đạt đúng tiêu chí nghiệm thu, không cần viết test tự động, chỉ cần hướng dẫn click-through:

1. Đặt 2 đơn thuê trùng ngày cho cùng 1 sản phẩm (2 tab/2 tài khoản khác nhau) → đơn thứ 2 phải bị chặn với thông báo rõ ràng (FR-CT-02).
2. Đặt thuê chọn hình thức nhận hàng = GiaoVan, khu vực NoiThanh → tiền cọc hiển thị phải đúng = giaNiemYet + 20000*2 (BRU-01).
3. Ở trang /dev/mock-momo, gọi webhook thanh toán 2 lần liên tiếp với cùng maQR → lần 2 phải trả về 200 nhưng KHÔNG cộng tiền/đổi trạng thái lần nữa (idempotency, FR-TTGV-07).
4. Một đơn trả hàng trễ hạn + đổi hình thức trả khác với hình thức nhận lúc đặt cọc → vào trang settle kiểm tra số hoàn cọc phải trừ đúng tiền phạt và cộng/trừ đúng chênh lệch ship.

Liệt kê rõ từng bước bấm, dữ liệu mẫu nên dùng (lấy từ seed data), và kết quả mong đợi ở mỗi bước.
```

---

## 15. Deploy (ứng với DEV-11..14)

```
Hướng dẫn tôi deploy project Next.js + Prisma + PostgreSQL này lên Vercel (app) và Supabase hoặc Railway (database), theo các bước:

1. Tạo database PostgreSQL miễn phí trên Supabase/Railway, lấy connection string.
2. Cấu hình biến môi trường trên Vercel: DATABASE_URL, NEXTAUTH_SECRET, MOCK_MOMO_SECRET, MOCK_GREENSM_SECRET, NEXT_PUBLIC_MOCK_MODE=true.
3. Chạy npx prisma migrate deploy và seed trên database production.
4. Deploy qua GitHub integration của Vercel.
5. Viết cho tôi nội dung README.md gồm: giới thiệu ngắn BoardVerse, Tech Stack, link Live Demo, hướng dẫn chạy local, và một dòng ghi chú bắt buộc: "MoMo và Green SM trong demo là mô phỏng (mock), phục vụ mục đích minh họa luồng nghiệp vụ, không có giao dịch tiền thật."

Không đặt biến env nào gợi ý là key thật của MoMo/Green SM. Nhắc tôi nếu trang /dev/mock-momo và /dev/mock-greensm cần chặn truy cập công khai khi demo cho nhà tuyển dụng xem.
```

---

# PHẦN B — FRONTEND (dựng UI chi tiết đúng Wireframe)

Mục 1-15 ở Phần A đã tạo route và UI "tối giản" đủ chạy (shadcn/ui mặc định). Phần B này dựng lại giao diện cho đúng layout đã vẽ ở **SRS Phụ lục A** (SCR-01, 02, 06, 07) và **SDD mục 11-12** (SCR-03, 04, 05), cộng thêm Sitemap/Navigation Flow ở **SDD mục 9-10**. Ảnh wireframe gốc nằm ở `diagrams/out/srs_appA_wireframe_*.png` và `diagrams/out/sdd_wireframe_*.png` — mở xem trước nếu muốn, nhưng mỗi prompt dưới đây đã mô tả đủ chi tiết vị trí từng khối để AI code trực tiếp không cần xem ảnh.

Thứ tự dán: làm xong backend của UC nào ở Phần A thì dán prompt UI tương ứng ngay sau, theo bảng:

| Prompt Phần B | Màn hình | Dán sau khi xong Phần A mục |
|---|---|---|
| 16 | Design System & khung chung (Header/Footer/Sitemap) | 1 |
| 17 | SCR-01 Danh sách sản phẩm | 5 |
| 18 | SCR-02 Chi tiết sản phẩm & Đặt thuê | 5, 7 |
| 19 | SCR-03 Giỏ hàng / Thanh toán | 6 |
| 20 | SCR-06 Thanh toán mã QR | 8 |
| 21 | SCR-07 Yêu cầu giao vận lấy hàng trả | 11 |
| 22 | SCR-04 POS nội bộ (Staff) | 9, 10 |
| 23 | SCR-05 Báo cáo doanh thu (Admin) | 13 |
| 24 | Responsive + Accessibility pass cuối cùng | sau khi xong hết 17-23 |

---

## 16. Design System & khung chung (Header/Footer/Sitemap)

```
Dựng Design System và layout khung chung cho app, trước khi vào từng trang cụ thể.

Theme (đồng bộ với landing/index.html đã có):
- Màu: primary #0284C7, primary-dark #0369A1, accent #059669, ink #0F172A, muted #475569, surface #F0F9FF, border #BAE6FD, danger #DC2626.
- Font: "Baloo Tamma 2" cho heading (font-display), "Be Vietnam Pro" cho nội dung (font-body).
- Bo góc lớn (rounded-2xl/3xl), shadow mềm, giống phong cách landing page.

Sitemap tổng thể (SDD mục 9) — tạo đúng các route group sau:
- Trang chủ → Danh sách sản phẩm (SCR-01), Chi tiết sản phẩm & Đặt thuê (SCR-02), Giỏ hàng/Thanh toán (SCR-03), Thanh toán mã QR (SCR-06), Giao vận lấy hàng trả (SCR-07), Đăng nhập/Đăng ký.
- POS nội bộ (Staff/Admin): Kho (SCR-04), Báo cáo (SCR-05).

Component dùng chung (components/):
- Header.tsx cho layout (customer): Logo "BoardVerse" (icon cube) | nav Danh mục/Sản phẩm nổi bật/Cách hoạt động | icon Giỏ hàng (có badge số lượng) | nút Tài khoản (Đăng nhập hoặc tên khách nếu đã đăng nhập).
- Footer.tsx: giống cấu trúc footer ở landing/index.html (cột Sản phẩm, Hỗ trợ, Đối tác — ghi rõ "Giao vận: Green SM (giả định)" / "Thanh toán: MoMo (giả định)").
- StaffSidebar.tsx cho layout (staff)/(admin): menu dọc "Đơn thuê | Kho | Kiểm đếm | Báo cáo" (ẩn "Báo cáo" nếu vaiTro=Staff, chỉ Admin thấy).
- Breadcrumb.tsx dùng cho các trang sâu (chi tiết sản phẩm, settle đơn...).

Navigation Flow phía khách hàng (SDD mục 10, dựng bằng middleware/redirect logic, CHƯA cần code UI trang đích, chỉ cần đúng luồng chuyển hướng):
Trang chủ/Danh sách sản phẩm → Chi tiết sản phẩm & chọn ngày thuê → [đã đăng nhập?] → (chưa) chuyển hướng Đăng nhập/Đăng ký kèm redirect back sau khi login → (rồi) Giỏ hàng/Chọn hình thức nhận hàng (SCR-03) → Thanh toán mã QR (SCR-06) → Trang theo dõi đơn hàng/Yêu cầu giao vận trả (SCR-07).

Áp dụng layout.tsx riêng cho 3 route group (customer)/(staff)/(admin), mỗi group dùng đúng Header/Sidebar tương ứng. Chưa code nội dung các trang SCR-xx cụ thể ở bước này.
```

---

## 17. UI — SCR-01 Danh sách sản phẩm

```
Dựng lại UI trang Danh sách sản phẩm (route app/(customer)/products, đã có data/filter từ Phần A mục 5) đúng theo wireframe sau:

- Header: dùng component Header đã tạo ở prompt 16 (logo, tìm kiếm, giỏ hàng, tài khoản).
- Dải bộ lọc ngay dưới header: 3 nhóm filter — Danh mục (dropdown/segmented các danhMuc có trong DB), Giá (range slider hoặc 2 input min-max theo giaNiemYet), Trạng thái (toggle "Bán" / "Thuê" — Thuê nghĩa là sản phẩm có ít nhất 1 HopGame Available).
- Lưới sản phẩm dạng card, responsive: 1 cột (mobile) / 2 cột (tablet) / 3 cột (desktop). Mỗi card gồm: ảnh placeholder (chưa có ảnh thật, dùng khối màu + icon ph-cube), tên sản phẩm, giá (hiển thị cả giá bán và giá thuê/ngày nếu có), badge danh mục, nút "Xem chi tiết" dẫn sang SCR-02.
- Footer: dùng component Footer đã tạo.
- Trạng thái rỗng: nếu filter không ra kết quả, hiển thị khối "Không tìm thấy sản phẩm phù hợp" giữa trang, kèm nút "Xoá bộ lọc".

Dùng URL search params (?danhMuc=&giaMin=&giaMax=&loai=) để filter chạy qua Server Component re-fetch, không cần client state phức tạp.
```

---

## 18. UI — SCR-02 Chi tiết sản phẩm & Đặt thuê

```
Dựng lại UI trang Chi tiết sản phẩm (route app/(customer)/products/[id], ghép cả phần đặt thuê từ Phần A mục 7 UC-04) đúng theo wireframe 2 cột sau:

Cột trái (khoảng 45% chiều ngang trên desktop, full width trên mobile):
- Ảnh sản phẩm lớn (placeholder nếu chưa có ảnh thật).
- Khối "Checklist linh kiện đi kèm" — danh sách linhKien dạng list có icon check, đặt ngay dưới ảnh.
- Khối "Mô tả chi tiết sản phẩm" (field moTa).

Cột phải:
- Tên sản phẩm (heading lớn), giá bán và giá thuê/ngày hiển thị song song (2 khối giá, có thể dùng segmented toggle "Mua" / "Thuê" giống landing page `.segmented` để chuyển qua lại 2 chế độ hiển thị giá và nút hành động).
- Nếu đang ở chế độ "Thuê": hiện date range picker chọn ngày bắt đầu/kết thúc, ngay khi chọn xong gọi kiểm tra tồn kho (coSanPhamTrongKhoangNgay) hiển thị trạng thái "Còn trống" (xanh) hoặc "Đã có người thuê trong khoảng này" (đỏ, kèm gợi ý đổi ngày).
- Radio chọn hình thức nhận hàng: "Tự đến lấy" / "Giao vận" — nếu chọn Giao vận thì hiện thêm select khu vực (Nội thành/Ngoại thành/Ngoài tỉnh) và hiển thị ngay phí ship + tiền cọc dự kiến (gọi hàm tinhTienCoc, cập nhật real-time khi đổi lựa chọn, không cần submit mới thấy).
- Nút hành động lớn cuối cột: "Thêm vào giỏ" (nếu Mua) hoặc "Đặt thuê ngay" (nếu Thuê, disabled nếu đang kiểm tra tồn kho hoặc không còn trống).

Toàn bộ phần tính phí ship/cọc hiển thị real-time dùng Client Component gọi lại 2 hàm pure function tinhPhiShip/tinhTienCoc đã viết ở lib/pricing (import trực tiếp, không cần gọi API riêng vì là hàm thuần không chạm DB).
```

---

## 19. UI — SCR-03 Giỏ hàng / Thanh toán

```
Dựng lại UI trang Giỏ hàng (route app/(customer)/cart, backend ở Phần A mục 6 UC-03) đúng theo wireframe sau:

- Header: "Giỏ hàng".
- Khối danh sách sản phẩm đã chọn: mỗi dòng gồm tên sản phẩm, loại (mua/thuê + ngày thuê nếu có), đơn giá, phí ship dự kiến cho dòng đó, nút xoá khỏi giỏ.
- Khối tổng kết: "Tổng tiền hàng" + "Tổng tiền cọc" (nếu có sản phẩm thuê) hiển thị riêng, rõ ràng, cỡ chữ lớn hơn các dòng chi tiết.
- Khối chọn hình thức nhận hàng chung cho cả đơn: radio "Tự đến lấy" / "Giao vận" (+ select khu vực nếu chọn Giao vận) — áp dụng cho toàn bộ sản phẩm trong giỏ cùng lúc để đơn giản hoá (không cần chọn riêng từng sản phẩm).
- Nút lớn cuối trang: "Tiến hành thanh toán" — gọi Server Action createOrder rồi chuyển sang SCR-06 (route checkout/[orderId]/pay).
- Trạng thái giỏ rỗng: hiển thị khối "Giỏ hàng đang trống" + nút "Khám phá sản phẩm" dẫn về SCR-01.

Layout 1 cột trên mobile, có thể chia 2 cột (danh sách bên trái, tổng kết + nút thanh toán dính cố định bên phải) trên desktop.
```

---

## 20. UI — SCR-06 Thanh toán mã QR

```
Dựng lại UI trang Thanh toán mã QR (route app/(customer)/checkout/[orderId]/pay, backend ở Phần A mục 8 UC-10) đúng theo wireframe sau:

- Khối tóm tắt đơn ở trên cùng: tên sản phẩm/số lượng, tiền thuê hoặc tiền hàng, phí ship (nếu có), tiền cọc — liệt kê rõ từng dòng.
- Khối chính giữa trang: ảnh mã QR lớn (qrImageDataUrl trả về từ /api/payments/qr), đặt giữa khung viền bo góc, có đồng hồ đếm ngược 15 phút ngay dưới QR (hết giờ thì disable QR, hiện nút "Tạo lại mã QR").
- Dòng trạng thái ngay dưới QR: "Đang chờ thanh toán..." với icon loading xoay (pulse animation), tự động chuyển thành "✅ Thanh toán thành công" (và redirect sau 2 giây) khi polling phát hiện ThanhToan.trangThai đổi thành DaThanhToan — dùng polling đơn giản (setInterval gọi API kiểm tra trạng thái mỗi 3 giây), không cần WebSocket.
- Khối hướng dẫn: "Quét mã QR bằng ví MoMo hoặc app ngân hàng hỗ trợ VietQR" kèm icon ví MoMo.
- Nếu NEXT_PUBLIC_MOCK_MODE=true: hiện thêm 1 khối riêng viền nét đứt màu cảnh báo, ghi rõ "[DEV ONLY]" với nút "Giả lập thanh toán thành công" (đã code logic ở Phần A mục 8) — tách biệt rõ về mặt hình ảnh với phần UI thật để không gây hiểu nhầm khi demo.

Màu chủ đạo của trang này nên theo tông "đang xử lý" (primary + accent), tránh dùng màu đỏ (danger) trừ khi QR hết hiệu lực hoặc thanh toán lỗi.
```

---

## 21. UI — SCR-07 Yêu cầu giao vận lấy hàng trả

```
Dựng lại UI trang Yêu cầu giao vận lấy hàng trả (route app/(customer)/orders/[id]/return, backend ở Phần A mục 11 UC-11) đúng theo wireframe sau:

- Khối đầu trang: "Đơn thuê #<mã đơn ngắn> — Hạn trả: <ngày>" (đổi màu chữ sang danger nếu đã quá hạn/Overdue).
- Khối chọn hình thức trả hàng: 2 lựa chọn dạng card lớn song song (không phải radio nhỏ) — "Tự mang ra quán" và "Gọi giao vận đến lấy", mỗi card có icon riêng (ph-storefront / ph-truck).
- Nếu chọn "Gọi giao vận đến lấy": hiện thêm select khu vực lấy hàng, và ngay bên dưới hiển thị "Phí ship dự kiến: <số tiền>" tính real-time bằng hàm tinhPhiShip.
- Nút "Xác nhận yêu cầu" — disabled nếu chưa chọn hình thức.
- Sau khi xác nhận (nếu chọn giao vận): hiện khối "Trạng thái vận chuyển" với mã vận đơn (maVanDon) và badge trạng thái (Đang lấy/Đã lấy, đổi màu theo trạng thái — vàng cho Đang, xanh cho Đã), badge này nên tự cập nhật bằng polling giống SCR-06.

Giữ tông màu giống phần "logistics" trong landing/index.html (gradient primary-dark → primary) cho khối trạng thái vận chuyển để nhất quán thương hiệu.
```

---

## 22. UI — SCR-04 POS nội bộ (Staff: Đơn thuê, Kho, Kiểm đếm)

```
Dựng lại UI khu vực POS nội bộ cho Staff (các route app/(staff)/orders, app/(staff)/orders/[id], app/(staff)/inventory/[chiTietDonId]/checkin — backend đã có ở Phần A mục 9 và 10) đúng theo wireframe sau:

Layout chung: 2 cột cố định — StaffSidebar bên trái (đã tạo ở prompt 16, menu "Đơn thuê | Kho | Kiểm đếm | Báo cáo"), vùng nội dung bên phải chiếm phần còn lại, có thanh tìm kiếm đơn/sản phẩm ngay đầu vùng nội dung.

Trang app/(staff)/orders (danh sách "Đơn thuê đang xử lý"):
- Bảng danh sách: mã đơn, tên khách, trạng thái (badge màu theo TrangThaiDon), hình thức nhận/trả hàng, ngày hết hạn, nút "Xem chi tiết".
- Lọc nhanh theo trạng thái bằng tab ngang trên đầu bảng (Tất cả | Pending | Confirmed | Active | Overdue | Completed).

Trang app/(staff)/orders/[id] (chi tiết đơn):
- Khối thông tin đơn: khách hàng, sản phẩm, ngày thuê, hình thức nhận/trả hàng, trạng thái hiện tại (badge lớn).
- 2 nút hành động theo trạng thái: "Xác nhận đặt cọc" (hiện khi Pending), "Bàn giao xuất kho" (hiện khi Confirmed) — đã code logic ở Phần A mục 9.
- Nếu đơn đã Active/Overdue và đã có biên bản kiểm đếm: hiện nút "Quyết toán hoàn cọc" dẫn sang route settle (UI riêng ở prompt khác, không cần code ở đây).

Trang app/(staff)/inventory/[chiTietDonId]/checkin (checklist kiểm đếm, UC-08):
- Danh sách linh kiện dạng bảng/list, mỗi dòng có 3 nút chọn trạng thái: "Đủ" / "Thiếu" / "Hư hỏng" (dùng button group, không dùng checkbox đơn vì có 3 trạng thái).
- Ô ghi chú thủ công cuối danh sách cho linh kiện ngoài checklist gốc.
- Nút "Lưu biên bản" cuối trang, disabled nếu chưa đánh dấu hết toàn bộ linh kiện trong checklist.

Badge màu trạng thái dùng nhất quán: Pending=vàng, Confirmed=xanh dương nhạt, Active=xanh dương đậm, Overdue=đỏ, Completed=xanh lá, Closed=xám.
```

---

## 23. UI — SCR-05 Báo cáo doanh thu (Admin)

```
Dựng lại UI trang Báo cáo doanh thu (route app/(admin)/reports, backend ở Phần A mục 13) đúng theo wireframe sau:

- Header Admin: bộ lọc tháng/năm (2 select hoặc 1 month-picker) ở góc phải trên.
- 2 khối biểu đồ song song (desktop) / xếp dọc (mobile): biểu đồ doanh thu BÁN theo ngày trong tháng (bên trái), biểu đồ doanh thu THUÊ theo ngày trong tháng (bên phải) — dùng 1 lib chart nhẹ (ví dụ Recharts), dạng bar chart hoặc line chart đơn giản.
- Bảng chi tiết giao dịch trong tháng ngay dưới 2 biểu đồ: mã đơn, loại (Bán/Thuê), ngày, số tiền, trạng thái.
- 3 ô thống kê nhanh (stat card) phía trên biểu đồ: Tổng doanh thu bán, Tổng doanh thu thuê, Tổng số đơn trong tháng.

Chỉ Admin truy cập được route này (vaiTro=Admin) — nếu Staff cố vào thì redirect về app/(staff)/orders kèm thông báo không có quyền.
```

---

## 24. (Frontend) Responsive & Accessibility pass cuối cùng

```
Rà soát lại toàn bộ UI đã dựng ở các route app/(customer), app/(staff), app/(admin):

1. Responsive: kiểm tra và sửa để chạy tốt ở 3 breakpoint — mobile (< 640px), tablet (640-1024px), desktop (> 1024px). Đặc biệt layout 2 cột ở SCR-02, SCR-03, SCR-04 phải sập xuống 1 cột trên mobile.
2. Accessibility cơ bản: mọi input có label, mọi nút icon-only có aria-label tiếng Việt, contrast màu chữ/nền đạt tối thiểu AA, focus-visible ring rõ ràng cho mọi phần tử bấm được được (giống style focus-visible đã có ở landing/index.html).
3. Loading & error state: mọi Server Action/API call đều có trạng thái loading (disable nút + spinner) và hiển thị lỗi rõ ràng bằng tiếng Việt nếu thất bại (không để lỗi kỹ thuật/raw JSON hiện ra cho người dùng — khớp NFR-04).
4. Trang 404 và trang lỗi chung (error.tsx) bằng tiếng Việt, có nút quay về trang chủ.

Báo cáo lại cho tôi danh sách những gì đã sửa, không cần đổi logic nghiệp vụ ở bước này.
```

---

## Việc KHÔNG làm trong lần vibe code này

- Không tích hợp OAuth Google/Facebook thật.
- Không build app mobile riêng (đã loại ở OS-05).
- Không cần bảo hiểm sản phẩm, đa tiền tệ (OS-02, OS-03).
- Không mở webhook mock ra domain thật của MoMo/Green SM, không đăng ký merchant thật dưới bất kỳ hình thức nào.
