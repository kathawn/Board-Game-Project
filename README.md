# BoardVerse
Xem video giới thiệu:


https://github.com/user-attachments/assets/3e41a3f2-5b26-4b24-80af-ad42567c3905


Hệ thống **mua bán và cho thuê board game theo ngày** — đồ án cá nhân giả định dùng làm portfolio BA/dev. Dự án đi trọn lộ trình **BRD → SRS → lập trình**, trong đó phần nghiệp vụ (tính cọc, giá thuê lũy tiến, phạt trễ hạn, đền bù linh kiện, hoàn cọc vào ví, chống tranh chấp khi thanh toán đồng thời) được đặc tả trước rồi mới hiện thực.

> Không có doanh nghiệp hay khách hàng thật. Mọi số liệu nghiệp vụ/tài chính là **giả định**; MoMo, Green SM và Shopee Express đều là **giả lập (mock)**, không gọi API thật.

## Điểm đáng chú ý về nghiệp vụ

| Quy tắc | Nội dung |
|---|---|
| Tiền cọc (BRU-01) | 100% giá niêm yết + phí giao vận chiều giao × 2; khách chịu phí ship thực tế hai chiều, phần chênh lệch được cân đối khi hoàn cọc |
| Giá thuê lũy tiến (BRU-02) | Ngày 1: 10% giá niêm yết, ngày 2–10: 7%/ngày, từ ngày 11: 5%/ngày |
| Phạt trễ hạn (BRU-03) | 15% giá niêm yết mỗi ngày trễ, tối đa 100% |
| Đền bù linh kiện (BRU-04) | Linh kiện độc bản: 100% giá bộ; phụ kiện bán lẻ: giá lẻ; không bán lẻ: 20% giá bộ |
| Chọn đối tác giao vận (BRU-05) | ≤ 20 km: Green SM; > 20 km: Shopee Express |
| Thanh toán & ví (BRU-06) | QR MoMo, chỉ xác nhận khi nhận webhook; hoàn tiền vào Ví điện tử nội bộ, không hoàn trực tiếp |
| Không giữ chỗ trước (BRU-07) | Nhiều khách cùng thanh toán một hộp game/ngày thuê: ai có webhook thành công trước thì thắng, người còn lại được hoàn ví |

## Tính năng đã có

**Khách hàng:** đăng ký/đăng nhập (khoá tạm sau 5 lần sai) · danh sách sản phẩm có tìm kiếm/lọc/phân trang, top 5 bán chạy ở trang chủ · chi tiết sản phẩm kèm checklist linh kiện · giỏ mua và giỏ thuê (chọn ngày riêng cho từng game, chặn trùng lịch) · thanh toán QR · lịch sử đơn, huỷ đơn khi chưa được xác nhận, yêu cầu giao vận đến lấy hàng trả · ví điện tử (lịch sử, tìm kiếm, rút tiền) · hồ sơ cá nhân, đổi mật khẩu · trang Hướng dẫn đặt thuê và Chính sách hoàn cọc.

**Nhân viên (`/staff`):** xác nhận đã thu cọc · bàn giao hộp game cho giao vận · **in phiếu dán đơn** (khổ A6, mã vạch Code 39, in một hoặc cả trang, lọc đơn cần giao gấp) · xử lý đơn mua · nhận hàng trả, kiểm đếm linh kiện, quyết toán hoàn cọc, đổi trạng thái hộp game.

**Quản trị (`/admin`):** quản lý sản phẩm và giá niêm yết, danh mục, báo cáo doanh thu/tồn kho/giao dịch.

**Đang để Phase 2** (đã đặc tả trong SRS, chưa hiện thực): quên mật khẩu qua email, đánh giá sản phẩm, email nhắc hạn trả hàng, quản lý tài khoản nhân viên qua giao diện.

## Tài liệu

Hai tài liệu nghiệp vụ nằm ở [`deliverables/`](deliverables/):

- **BRD** — bối cảnh, mục tiêu kinh doanh (BO), yêu cầu và quy tắc nghiệp vụ (BR/BRU), phạm vi, các bên liên quan, phân tích chi phí – lợi ích.
- **SRS** — use case (UC), yêu cầu chức năng/phi chức năng (FR/NFR), ERD, sơ đồ hoạt động/trạng thái/tuần tự, màn hình.

Mã số được truy vết hai chiều: BO ↔ BR ↔ BRU ↔ FR/NFR ↔ UC. Sơ đồ `.drawio` nguồn ở [`diagrams/drawio/`](diagrams/drawio/). Schema DB nằm ở [`app/prisma/schema.prisma`](app/prisma/schema.prisma), API ở `app/app/api/`.

## Công nghệ

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 · SQL Server · Vitest.

## Chạy thử

Yêu cầu: Node.js 20+ và một instance SQL Server (bản Developer/Express đều được).

```bash
cd app
npm install

# Cấu hình kết nối DB: tạo app/.env
# DATABASE_URL="sqlserver://localhost:1433;database=boardverse;user=sa;password={mat-khau-cua-ban};trustServerCertificate=true"

npx prisma generate        # sinh Prisma client
npx prisma migrate deploy  # tạo bảng
npx prisma db seed         # nạp 16 sản phẩm, tồn kho và đơn mẫu

npm run dev                # http://localhost:3000
```

Tài khoản demo (mật khẩu chung `Demo@12345`, dữ liệu giả định):

| Vai trò | Email | Vào ở đâu |
|---|---|---|
| Khách | `khach@boardverse.local` | `/login` |
| Nhân viên | `staff@boardverse.local` | `/staff/login` |
| Quản trị | `admin@boardverse.local` | `/staff/login` (tự chuyển sang `/admin`) |

Luồng demo gợi ý: đăng nhập khách → chọn một game, thuê vài ngày → thanh toán cọc ở trang QR (có bảng điều khiển giả lập webhook MoMo) → đăng nhập nhân viên xác nhận cọc, in phiếu và bàn giao (có thể bật giả lập Green SM lỗi ở `/mock-green-sm`) → khách yêu cầu lấy hàng trả → nhân viên kiểm đếm, quyết toán → tiền hoàn cọc về ví của khách.

### Kiểm thử

```bash
cd app
npm run test         # Vitest — không cần SQL Server (dùng store in-memory)
npx tsc --noEmit
```

Script tiện ích: `npx tsx scripts/restock.mts [n]` bù tồn kho tối thiểu `n` hộp mỗi game; `npx tsx scripts/seed-wallet-demo.mts` thêm dữ liệu demo cho trang Ví.

## Cấu trúc repo

```
deliverables/   BRD và SRS (.docx)
diagrams/       Sơ đồ nguồn (.drawio) và script sinh hình
app/            Ứng dụng Next.js (code, Prisma schema + migrations, test)
Landingpage/    Landing page tĩnh dùng làm tham chiếu giao diện
docs/           Ghi chú thiết kế quy trình làm việc với Claude Code
CLAUDE.md       Hướng dẫn cho Claude Code khi làm việc trong repo
```
