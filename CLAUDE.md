# CLAUDE.md — BoardVerse

Hướng dẫn cho Claude Code (hoặc agent tương tự) khi làm việc trong repo này.

## Dự án này là gì

**BoardVerse** là đồ án cá nhân giả định (không có doanh nghiệp/khách hàng thật) dùng làm portfolio BA/dev để nộp CV — hệ thống mua bán và cho thuê board game. Lộ trình: **BRD → SRS → SDD → code (vibe code) → deploy**. Mọi số liệu nghiệp vụ/tài chính trong tài liệu là giả định do tác giả tự bịa, nhất quán nội bộ, không phải dữ liệu thật.

Nguồn sự thật duy nhất về nghiệp vụ nằm trong 3 tài liệu ở `deliverables/` — **không bịa thêm field/luồng/quy tắc nghiệp vụ nào không có trong 3 file này.**

## Đọc gì trước khi làm gì — tra nhanh theo việc cần làm

| Việc cần làm | Đọc trước |
|---|---|
| Hiểu bối cảnh/mục tiêu kinh doanh, phạm vi, quy tắc tài chính | `deliverables/BRD_BoardVerse_v1.0.docx` |
| Hiểu 1 feature cụ thể (UC/FR/NFR, actor, luồng, ERD) trước khi code | `deliverables/SRS_BoardVerse_v1.0.docx` — dùng `extract_spec.py` để trích đoạn, đừng đọc cả file (xem bên dưới) |
| Hiểu schema DB, kiến trúc, wireframe, API endpoint | `deliverables/SDD_BoardVerse_v1.0.docx` |
| Quyết định phạm vi code thật nên cắt/giữ gì để kịp nộp CV | `Danh_Sach_Chuc_Nang_BoardVerse_De_Xuat_MVP.md` (ở gốc repo) |
| Code 1 feature end-to-end theo đúng quy trình (mockup → gate → TDD → review → test → merge) | Dùng skill `feature-from-srs` (xem "Skills" bên dưới) — không tự làm tay từng bước |
| Chỉnh lại nội dung BRD/SRS/SDD (không phải code) | Xem "Cách sửa tài liệu" bên dưới — **không sửa tay file .docx** |
| Chạy app Next.js đang code trong `app/` | `cd app && npm run dev` |

## Cấu trúc repo

```
deliverables/           3 file .docx cuối cùng (BRD/SRS/SDD) — bản build ra, không sửa tay
scripts/                Nguồn sinh 3 file trên: project_data.py (số liệu dùng chung),
                        doc_style.py (helper trình bày Word), fill_brd.py, fill_srs.py,
                        build_sdd.py, build_checklist.py
diagrams/               Nguồn sinh hình minh hoạ: diagram_kit.py (vẽ bằng Pillow),
                        build_{brd,srs,sdd}_diagrams.py, gen_srs_36_diagrams.py/
                        gen_erd_drawio.py (sinh .drawio), out/ (PNG đã build), *.drawio
app/                    App Next.js (App Router) + TypeScript + Vitest — code thật của
                        feature đang vibe-code (xem app/package.json cho script dev/test)
docs/superpowers/       plans/ và specs/ cho việc xây bộ skill feature-from-srs — tài liệu
                        nội bộ về cách skill được thiết kế, không phải tài liệu nghiệp vụ
.claude/skills/         4 skill project-scoped: feature-from-srs, spec-driven-mockup,
                        ui-mockup-approval-gate, domain-expert-code-review
Landingpage/            Landing page tĩnh (index-editorial.html) — pattern UI tham khảo
                        khi dựng mockup frontend
Sơ đồ drawio/           (hiện trống)
```

## Nguyên tắc khi sửa nghiệp vụ/tài liệu

1. **Không sửa tay file .docx trong `deliverables/`.** Mọi thay đổi nội dung phải sửa ở nguồn (`scripts/project_data.py` cho số liệu dùng chung, `scripts/fill_brd.py` / `scripts/fill_srs.py` / `scripts/build_sdd.py` cho nội dung từng cuốn) rồi build lại:
   ```
   python scripts/fill_brd.py     # sinh lại BRD
   python scripts/fill_srs.py     # sinh lại SRS
   python diagrams/build_sdd_diagrams.py && python scripts/build_sdd.py   # sinh lại SDD + hình
   ```
   Chạy bằng `python`, **không dùng `python -I`** cho các script tự viết này — `-I` bỏ cwd khỏi `sys.path` và gây `ModuleNotFoundError` khi import `doc_style`/`project_data`.
2. **BRD/SRS/SDD là 3 bước tách rời.** Khi sửa SRS, KHÔNG tự động lan thay đổi sang SDD trong cùng lượt — chỉ cập nhật SDD khi được yêu cầu riêng, sau khi SRS đã chốt.
3. **Giữ mã số liệu nhất quán** giữa BO (mục tiêu) ↔ BR (yêu cầu nghiệp vụ) ↔ BRU (quy tắc nghiệp vụ) ↔ FR/NFR (yêu cầu phần mềm) ↔ UC (use case). Không để mã nào "mồ côi" (không có truy vết hai chiều).
4. Toàn bộ số liệu tài chính/nghiệp vụ là **giả định** — khi cần thêm số liệu mới trong phạm vi tài liệu/code local, tự quyết đoán viết cho nhất quán, không cần hỏi lại từng con số nhỏ. Chỉ hỏi lại khi quyết định vượt phạm vi tài liệu/code (tạo repo public, deploy, gọi API thật...).
5. Mọi tích hợp đối tác thứ 3 (MoMo, Green SM, Shopee Express) là **giả lập (mock)** — không gọi API thật, không đăng ký merchant thật.

## Skills — dùng khi code feature thật

Khi implement 1 feature cụ thể từ SRS (ví dụ UC-04 đặt thuê theo ngày), **dùng skill `feature-from-srs`** làm orchestrator thay vì tự làm tay — nó tự đi đúng trình tự 8 bước (branch → mockup → Gate 1 duyệt UI → backend TDD → domain-expert review → acceptance test → screenshot → Gate 2 duyệt merge) và có checklist tiến độ post lại sau mỗi bước. Orchestrator này tự gọi các skill con khi cần:

- `spec-driven-mockup` — trích đúng đoạn SRS liên quan bằng `python .claude/skills/spec-driven-mockup/scripts/extract_spec.py <file> <UC-id hoặc từ khoá>` (không đọc cả file .docx), rồi dựng mockup đúng pattern UI đã có trong `app/` hoặc `Landingpage/`.
- `ui-mockup-approval-gate` — hard gate: không được tự ý "duyệt giùm" mockup, phải chờ người dùng xác nhận rõ ràng.
- `domain-expert-code-review` — sau khi code backend xong, dispatch 1 subagent độc lập review đúng FR/BR/UC vừa trích, trước khi viết acceptance test.

**Lưu ý về `extract_spec.py`:** chỉ đọc được heading + văn bản thường trong .docx, **không đọc được nội dung trong bảng Word** — SRS/BRD để rất nhiều FR/NFR/UC ở dạng bảng, nên nếu query không trả ra đúng đoạn cần, mở trực tiếp file .docx cho phần đó thay vì coi là lỗi của tool.

## App code (`app/`)

Next.js App Router + TypeScript + Vitest, đang code dần theo từng UC (hiện có UC-01 đăng ký/đăng nhập). Chạy `cd app && npm run dev` để xem, `npm run test` để chạy test. Theme màu/font tham khảo `Landingpage/` để đồng bộ giao diện khi dựng mockup mới.

## Phạm vi MVP khi code (quan trọng cho giai đoạn vibe-code)

Xem `Danh_Sach_Chuc_Nang_BoardVerse_De_Xuat_MVP.md` ở gốc repo trước khi bắt đầu code một feature mới ngoài UC-01 — file này liệt kê toàn bộ FR theo 5 phân hệ và đề xuất nhóm nào PHẢI giữ (luồng thuê/trả/cọc/webhook), nhóm nào nên rút gọn, nhóm nào để Phase 2 — để tránh code lan man vượt quá khả năng hoàn thành trước khi nộp CV.
