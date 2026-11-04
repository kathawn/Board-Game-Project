# CLAUDE.md — BoardVerse

Hướng dẫn cho Claude Code (hoặc agent tương tự) khi làm việc trong repo này.

## Dự án này là gì

**BoardVerse** là đồ án cá nhân giả định (không có doanh nghiệp/khách hàng thật) dùng làm portfolio BA/dev để nộp CV — hệ thống mua bán và cho thuê board game. Lộ trình: **BRD → SRS → code (vibe code) → deploy**. Mọi số liệu nghiệp vụ/tài chính là giả định do tác giả tự bịa, nhất quán nội bộ, không phải dữ liệu thật.

**Bộ tài liệu chỉ có 2 cuốn: BRD và SRS** (trong `deliverables/`). Kiến trúc, schema DB, API endpoint chỉ sống trong code (`app/prisma/schema.prisma`, `app/app/api/`, `app/lib/`). Nguồn sự thật duy nhất về **nghiệp vụ** là BRD + SRS — **không bịa thêm field/luồng/quy tắc nghiệp vụ nào không có trong 2 file này.** Nếu code cần một cột/luồng ngoài SRS (đã xảy ra vài lần, ví dụ `giaNiemYetChot`, `maHop`), ghi chú lý do ngay trong comment code.

## Đọc gì trước khi làm gì — tra nhanh theo việc cần làm

| Việc cần làm | Đọc trước |
|---|---|
| Hiểu bối cảnh/mục tiêu kinh doanh, phạm vi, quy tắc tài chính (BRU-01..07) | `deliverables/BRD_BoardVerse_v1.0.docx` |
| Hiểu 1 feature cụ thể (UC/FR/NFR, actor, luồng, ERD) trước khi code | `deliverables/SRS_BoardVerse_v1.0.docx` — dùng `extract_spec.py` để trích đoạn, đừng đọc cả file (xem "Skills") |
| Hiểu schema DB hiện tại | `app/prisma/schema.prisma` (+ `app/prisma/migrations/`) |
| Quyết định phạm vi code nên cắt/giữ gì | `Danh_Sach_Chuc_Nang_BoardVerse_De_Xuat_MVP.md` (gốc repo, không đưa lên GitHub) |
| Code 1 feature end-to-end đúng quy trình (mockup → gate → TDD → review → test → merge) | Skill `feature-from-srs` — không tự làm tay từng bước |
| Chỉnh nội dung BRD/SRS | "Nguyên tắc khi sửa tài liệu" bên dưới — **không sửa tay file .docx** |
| Chạy / test app | `cd app && npm run dev` / `npm run test` (xem "App code") |

## Cấu trúc repo

```
deliverables/           BRD + SRS (.docx) — bản build ra, không sửa tay
scripts/                Nguồn sinh 2 file trên (gitignore, chỉ có trên máy tác giả):
                        project_data.py (số liệu dùng chung), doc_style.py (helper Word),
                        fill_brd.py, fill_srs.py, build_checklist.py.
diagrams/               Nguồn sinh hình minh hoạ: diagram_kit.py (Pillow),
                        build_{brd,srs}_diagrams.py, gen_srs_36_diagrams.py/gen_erd_drawio.py
                        (sinh .drawio), drawio/ (file .drawio), out/ (PNG đã build).
app/                    App Next.js (App Router) + TypeScript + Prisma + SQL Server + Vitest
docs/superpowers/       plans/ và specs/ về cách thiết kế bộ skill feature-from-srs (nội bộ)
.claude/skills/         Skill project-scoped: feature-from-srs, spec-driven-mockup,
                        ui-mockup-approval-gate, domain-expert-code-review (+ video-shotcraft, không liên quan nghiệp vụ)
Landingpage/            Landing page tĩnh (index-editorial.html) — pattern UI tham khảo
```

## Nguyên tắc khi sửa tài liệu (BRD/SRS)

1. **Không sửa tay file .docx trong `deliverables/`.** Sửa ở nguồn (`scripts/project_data.py` cho số liệu dùng chung, `scripts/fill_brd.py` / `scripts/fill_srs.py` cho nội dung từng cuốn) rồi build lại:
   ```
   python scripts/fill_brd.py     # sinh lại BRD
   python scripts/fill_srs.py     # sinh lại SRS
   ```
   Chạy bằng `python`, **không dùng `python -I`** cho script tự viết này — `-I` bỏ cwd khỏi `sys.path` và gây `ModuleNotFoundError` khi import `doc_style`/`project_data`.
2. **Giữ mã số nhất quán** giữa BO (mục tiêu) ↔ BR (yêu cầu nghiệp vụ) ↔ BRU (quy tắc nghiệp vụ) ↔ FR/NFR (yêu cầu phần mềm) ↔ UC (use case). Không để mã nào "mồ côi" (không có truy vết hai chiều). Đổi BRD thì rà SRS và ngược lại.
3. Sơ đồ UML mới trong SRS: ưu tiên code PlantUML dạng text (`ds.code_block`) hoặc file `.drawio`; không quay lại vẽ Pillow cho UML. Với `.drawio` sinh bằng script: nhãn là `text_label()` toạ độ tuyệt đối và luôn chạy `check_overlap()`, không dùng nhãn tự động của drawio (bị lệch).
4. Toàn bộ số liệu tài chính/nghiệp vụ là **giả định** — khi cần thêm số liệu mới trong phạm vi tài liệu/code local, tự quyết cho nhất quán, không hỏi từng con số nhỏ. Chỉ hỏi lại khi quyết định vượt phạm vi (tạo repo public, deploy, gọi API thật...).
5. Mọi tích hợp bên thứ 3 (MoMo, Green SM, Shopee Express) là **giả lập (mock)** — không gọi API thật, không đăng ký merchant thật. Dùng đúng tên "MoMo" / "Green SM" / "Shopee Express" khi viết nội dung mới.

## Skills — dùng khi code feature thật

Khi implement 1 feature cụ thể từ SRS (ví dụ UC-04 đặt thuê theo ngày), **dùng skill `feature-from-srs`** làm orchestrator — nó đi đúng trình tự 8 bước (branch → mockup → Gate 1 duyệt UI → backend TDD → domain-expert review → acceptance test → screenshot → Gate 2 duyệt merge). Nó tự gọi các skill con:

- `spec-driven-mockup` — trích đúng đoạn SRS bằng `python .claude/skills/spec-driven-mockup/scripts/extract_spec.py <file> <UC-id hoặc từ khoá>`, rồi dựng mockup theo pattern UI đã có trong `app/` hoặc `Landingpage/`.
- `ui-mockup-approval-gate` — hard gate: không tự "duyệt giùm" mockup, phải chờ người dùng xác nhận rõ ràng.
- `domain-expert-code-review` — sau khi code backend xong, dispatch subagent độc lập review đúng FR/BR/UC vừa trích, trước khi viết acceptance test.

**Lưu ý về `extract_spec.py`:** chỉ đọc được heading + văn bản thường, **không đọc được nội dung trong bảng Word** — SRS/BRD để rất nhiều FR/NFR/UC ở dạng bảng. Nếu query không ra đúng đoạn, mở trực tiếp .docx cho phần đó, không coi là lỗi tool.

Việc nhỏ (sửa UI, đổi chữ, thêm tiện ích như in phiếu) không cần cả quy trình 8 bước — làm thẳng, nhưng vẫn phải chạy `tsc`, eslint và test trước khi báo xong.

## App code (`app/`)

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Prisma 7 (adapter SQL Server) + Vitest. **Next.js bản này có breaking changes so với kiến thức cũ** — đọc `app/AGENTS.md` và hướng dẫn trong `app/node_modules/next/dist/docs/` trước khi viết code Next.
- **Lệnh:** `cd app` rồi `npm run dev` (http://localhost:3000), `npm run test` (Vitest), `npx tsc --noEmit`, `npx eslint`. `npm run lint` hiện còn 1 lỗi + vài cảnh báo có sẵn (Reveal.tsx, staff-client.ts…) — không phải do thay đổi mới thì đừng sửa lan.
- **DB:** SQL Server, cấu hình qua `app/.env` (`DATABASE_URL` dạng `sqlserver://host:1433;database=...;user=...;password={...};trustServerCertificate=true`; file `.env*` bị gitignore). Lệnh: `npx prisma generate` (client sinh ra ở `lib/generated/prisma`, gitignore), `npx prisma migrate deploy`, `npx prisma db seed` (xoá sạch rồi nạp lại 16 sản phẩm + đơn mẫu). Script tiện ích: `npx tsx scripts/restock.mts [n]` (nhập kho), `npx tsx scripts/seed-wallet-demo.mts` (dữ liệu demo ví).
- **Tài khoản seed** (mật khẩu chung `Demo@12345`, giả định): khách `khach@boardverse.local`, `khach2@boardverse.local`; nhân viên `staff@boardverse.local`; quản trị `admin@boardverse.local`.
- **Hai kiểu store:** có `DATABASE_URL` và không chạy test → đọc SQL Server; ngược lại (kể cả dưới Vitest, `NODE_ENV=test`) dùng store in-memory để test đơn vị không cần DB. Logic tính tiền là hàm thuần ở `lib/` (`lib/rentals/deposit.ts`, `settlement.ts`, `lib/products.ts`) — sửa quy tắc nghiệp vụ thì sửa ở đây và cập nhật test.
- **Phiên đăng nhập tách đôi:** khách (cookie khách, `/api/profile`) và nhân viên (cookie `staff_session`, `/api/staff/me`). `proxy.ts` chặn `/staff/**` và `/admin/**` khi thiếu cookie nội bộ; xác thực thật nằm ở `requireStaff()` trong từng API. `/admin/**` có layout sidebar riêng; `/staff/**` dùng chung `components/layout/Header.tsx` nhưng ở chế độ nội bộ (menu + tài khoản nhân viên, không giỏ hàng/đăng nhập khách).
- **Hiện đã có:** đăng ký/đăng nhập, danh sách + chi tiết sản phẩm, giỏ mua + giỏ thuê, thanh toán QR MoMo giả lập (webhook, ưu tiên theo thời điểm thanh toán — BRU-07), ví điện tử + rút tiền, lịch sử đơn + huỷ đơn Pending, hồ sơ/đổi mật khẩu; Staff: xác nhận cọc, bàn giao, in phiếu dán đơn (A6, mã vạch Code 39), đơn mua, nhận hàng trả/kiểm đếm/quyết toán hoàn cọc/trạng thái hộp game; Admin: sản phẩm & giá, danh mục, báo cáo; trang hỗ trợ (hướng dẫn đặt thuê, chính sách hoàn cọc); mock Green SM / MoMo. **Chưa làm:** quên mật khẩu qua email (UC-17), đánh giá sản phẩm (UC-19), email nhắc hạn trả (FR-CT-08), quản lý tài khoản Staff qua UI (FR-ADM-02) — xem phạm vi MVP.
- **Quy ước UI:**
  - Theme/màu/font theo `Landingpage/` và `app/globals.css` (nền cream/paper, nhấn wine/gold, font heading + script).
  - Màn hình danh sách phải thiết kế cho dữ liệu lớn từ mockup đầu tiên: list + detail, tìm kiếm/lọc/phân trang chạy ở server, tab có số đếm, chiều cao cố định để không giật layout.
  - **Không hiển thị mã nội bộ (BRU-xx, UC-xx, FR-xx, BR-xx) trong chữ hiện trên giao diện** hoặc lời nhắn lưu vào DB (ví dụ lý do bút toán ví). Mã truy vết chỉ để trong comment code.
  - Chữ trên giao diện bằng tiếng Việt có dấu; tên biến/hàm nghiệp vụ giữ tiếng Việt không dấu như code hiện có (`giaNiemYet`, `donHang`...).
- **Test:** test đơn vị cạnh file (`*.test.ts`) và test nghiệm thu theo UC (`*.acceptance.test.ts`). Mọi thay đổi logic nghiệp vụ phải có test; chạy đủ `npm run test` trước khi báo xong.

## Phạm vi MVP khi code (quan trọng cho giai đoạn vibe-code)

Xem `Danh_Sach_Chuc_Nang_BoardVerse_De_Xuat_MVP.md` ở gốc repo trước khi bắt đầu một feature mới — file liệt kê toàn bộ FR theo 5 phân hệ và đề xuất nhóm nào PHẢI giữ (luồng thuê/trả/cọc/webhook), nhóm nào rút gọn, nhóm nào để Phase 2 — để tránh code lan man vượt khả năng hoàn thành trước khi nộp CV.

## Quy trình git

- Không commit thẳng lên `main`: tạo nhánh `feature/...` (hoặc `fix/...`), commit, rồi merge `--no-ff` vào `main` khi người dùng đồng ý. Chỉ commit/push khi được yêu cầu.
- Thông điệp commit tiếng Việt không dấu theo kiểu hiện có (`feat: ...`, `fix: ...`, `docs: ...`).
- Không bao giờ commit `app/.env*`; `scripts/`, file checklist `.docx` và file đề xuất MVP đang nằm trong `.gitignore` có chủ đích.
- Shell trên máy tác giả là Windows: Git Bash hoặc PowerShell; `curl`, `python`, `npx` đều dùng được.
