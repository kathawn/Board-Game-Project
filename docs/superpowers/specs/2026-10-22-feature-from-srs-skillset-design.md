# Design: bộ skill "feature-from-srs" (code tính năng mới từ SRS có sẵn)

## Intent và lý do

Người dùng là BA, đang xây dự án portfolio giả định BoardVerse (BRD → SRS → SDD →
vibe code). Giai đoạn vibe-code sắp tới sẽ lặp lại nhiều lần: mỗi lần implement
1 tính năng (ví dụ UC-04 đăng nhập, UC-07 đặt cọc...) theo đúng quy trình 7 bước.
Thay vì nhắc lại quy trình này bằng tay mỗi lần, cần đóng gói thành một bộ skill
Claude Code có thể gọi lặp lại, để agent tự đi đúng thứ tự, đúng mức chi tiết,
và dừng lại đúng chỗ cần người duyệt.

Bộ skill này generic — dùng được cho bất kỳ dự án nào có (a) tài liệu đặc tả
(SRS dạng .docx/.md/.pdf) mô tả tính năng bằng UC/FR, và (b) ít nhất một trang
FE đã có để làm pattern tham khảo (landing page tĩnh, hoặc trang đã code trước
đó). BoardVerse (`D:\Brd`) là nơi dùng và kiểm thử đầu tiên, nhưng skill không
hardcode tên file hay stack của riêng BoardVerse.

## Goals

- Một quy trình lặp lại được, gọi bằng 1 skill orchestrator, chạy tuần tự 7 bước:
  tìm spec → mockup FE → gate duyệt UI người → code BE theo spec (TDD) →
  domain-expert review → sinh & tự chạy test → Playwright screenshot bàn giao.
- Tách 3 phần có failure-mode riêng biệt thành sub-skill độc lập, test được riêng:
  `spec-driven-mockup`, `ui-mockup-approval-gate`, `domain-expert-code-review`.
- Tái dùng skill đã có thay vì viết lại: `superpowers:test-driven-development`
  cho vòng code BE + test, skill `run` cho việc launch app + chụp màn hình cuối.
- Tự động hoá trích đoạn SRS liên quan đến 1 tính năng bằng script Python nhỏ
  (hỗ trợ .docx qua python-docx, .md qua parse heading, .pdf qua pypdf) thay vì
  dựa agent tự đọc nguyên văn mọi lần.
- Xử lý được cả trường hợp repo đích CHƯA có app code (chỉ có landing tĩnh):
  tự bootstrap khung app tối thiểu trước khi dựng mockup, trong cùng 1 lần chạy.
- Gate duyệt UI là dạng nhẹ: agent báo bằng text + đường link localhost, không
  tự chụp ảnh ở bước này (ảnh Playwright chỉ chụp ở bước cuối cùng, trên luồng
  đã có backend thật).

## Non-goals

- Không viết lại TDD, không viết lại hướng dẫn chạy app (`run` skill) — chỉ
  gọi tới.
- Không tự động deploy, không tự ý tạo repo Git/GitHub, không gọi API đối tác
  thật (đồng bộ với ràng buộc đã ghi trong `HUONG_DAN_VIBE_CODE_BoardVerse.md`:
  MoMo/Green SM là giả định, không gọi API thật).
- Không ép buộc một stack FE/BE cụ thể (không hardcode Next.js/Prisma) — việc
  chọn stack nằm trong bước bootstrap, hỏi người dùng 1 câu nếu chưa rõ, mặc
  định theo quy ước đã thấy trong repo nếu có.
- Không parse mọi định dạng SRS trên đời — chỉ .docx, .md, .pdf (3 định dạng
  thực tế có khả năng gặp).

## Anti-goals

- Agent tự "duyệt giùm" mockup rồi đi tiếp mà không chờ người dùng phản hồi —
  đây là anti-goal quan trọng nhất, vì đây là hard gate.
- Agent tự ý merge branch feature vào `main` khi chưa có xác nhận rõ ràng của
  người dùng ở gate cuối (gate 2) — cùng mức độ nghiêm trọng như anti-goal
  trên, vì merge là hành động khó đảo ngược hơn một gate UI thuần tuý.
- Agent bịa thêm field/luồng nghiệp vụ không có trong SRS khi code backend.
- Domain-expert review chỉ review hình thức (lint, style) thay vì đối chiếu
  đúng FR/BR/UC.

## Constraints

- Chạy trên Claude Code (Windows, bash shell) — script phụ trợ phải chạy được
  qua `python` trên Windows, dùng `python-docx`/`pypdf` nếu có sẵn, fallback
  báo lỗi rõ ràng nếu thiếu dependency thay vì tự ý `pip install` không hỏi.
- Lưu trong `D:\Brd\.claude\skills\` (project-scoped) theo quyết định của
  người dùng — không lưu ở `~/.claude/skills/`.
- Phải tuân thủ `superpowers:writing-skills`: mỗi skill có description dạng
  "Use when...", test trước khi coi là xong, không bơm nội dung chưa qua RED/GREEN.
- `ui-mockup-approval-gate` là discipline skill (hard gate) — theo nguyên tắc
  "Match the Form to the Failure", phải viết dạng prohibition + rationalization
  table + red flags, không phải soft guidance.

## Approaches đã cân nhắc

1. **Một skill độc nhất gộp cả 7 bước** — đơn giản nhất nhưng không tách được
   discipline-skill (gate) khỏi technique-skill (mockup, review), khó test độc
   lập, description không thể nêu 1 trigger rõ ràng. Loại.
2. **Orchestrator + 6 sub-skill cho từng bước** — tối đa khả năng tái sử dụng
   nhưng dư thừa: "tìm file SRS" và "code backend" đã có cách làm tốt sẵn
   (script nhỏ, và `superpowers:test-driven-development`) không cần bọc thêm
   1 lớp skill. Loại vì thừa.
3. **Orchestrator + 3 sub-skill trọng yếu** (đã chọn) — chỉ tách riêng phần có
   failure-mode khác biệt thật sự đáng test riêng: trích spec + dựng mockup
   theo pattern (`spec-driven-mockup`), hard gate chờ duyệt
   (`ui-mockup-approval-gate`), và phản biện nghiệp vụ bằng subagent độc lập
   (`domain-expert-code-review`). Phần code backend + test tái dùng thẳng
   `superpowers:test-driven-development`; phần screenshot cuối tái dùng skill
   `run`. Người dùng đã chọn approach này.

## Các quyết định đã chốt (qua hỏi người dùng)

- **Phạm vi**: generic, đa dự án — không hardcode theo BoardVerse.
- **Kiến trúc**: Approach C (orchestrator + 3 sub-skill).
- **Chưa có app FE/BE**: skill tự phát hiện (không thấy package.json/app code),
  tự bootstrap khung app tối thiểu (hỏi 1 câu về stack nếu không suy ra được
  từ các tài liệu/README trong repo) rồi mới dựng mockup — tất cả trong cùng
  một lần gọi orchestrator, không dừng giữa chừng bắt người dùng tự chạy lệnh
  khởi tạo.
- **Đọc SRS**: viết script Python nhỏ trong
  `spec-driven-mockup/scripts/extract_spec.py`, nhận vào đường dẫn file +
  keyword/mã UC (ví dụ "UC-04" hoặc "đăng nhập") làm tham số, hỗ trợ .docx
  (python-docx), .md (tách theo heading), .pdf (pypdf) — trả về đoạn văn bản
  liên quan nhất kèm số trang/mục nếu có.
- **Vị trí lưu**: `D:\Brd\.claude\skills\` (project-scoped).
- **Cơ chế gate duyệt UI**: agent KHÔNG chụp ảnh ở bước mockup — chỉ mô tả
  bằng text (những gì đã dựng, khác/giống pattern cũ ra sao) + đưa đường dẫn
  `localhost:xxxx/...` để người dùng tự mở trình duyệt xem, rồi hỏi qua
  AskUserQuestion dạng "duyệt / cần sửa gì". Playwright screenshot chỉ chạy ở
  bước 7 (cuối cùng), sau khi có backend thật, để người dùng "catch up" tổng
  thể.
- **Domain-expert review**: dispatch 1 fresh subagent (không phải fork, vì cần
  góc nhìn độc lập không nhiễm bởi context code vừa viết), cấp cho nó đoạn SRS
  đã trích ở bước 1 + diff code vừa viết, yêu cầu phản biện dưới góc nhìn
  nghiệp vụ (đúng FR/BR/UC chưa, thiếu case nào SRS có nhưng code bỏ sót).
  Subagent trả kết quả qua `ReportFindings` — đây là tool built-in có sẵn
  trong môi trường (không phải skill/plugin phải tự cài), subagent loại
  `general-purpose` (và các loại có `Tools: *`) đều gọi được trực tiếp; prompt
  dispatch phải nói rõ "gọi ReportFindings để báo kết quả" để subagent không tự
  bịa format khác. Nếu có finding mức nghiêm trọng, quay lại sửa code trước khi
  sang bước 6.

- **Ranh giới bước 4 (code BE theo spec, TDD) vs bước 6 (sinh & tự chạy
  test)**: không trùng lặp — bước 4 là vòng TDD thông thường của
  `superpowers:test-driven-development` (unit test ở cấp hàm/module, viết
  trước khi code, chạy xanh trước khi sang bước 5). Bước 6 là lớp test
  **acceptance/tích hợp theo UC**: dựng kịch bản kiểm thử ứng với đúng luồng
  UC/FR trong đoạn SRS đã trích ở bước 1 (ví dụ gọi API hoặc giả lập thao tác
  UI theo đúng use case, không phải test từng hàm riêng lẻ), chạy và xác nhận
  pass — tương đương tinh thần "nghiệm thu" thủ công mà
  `HUONG_DAN_VIBE_CODE_BoardVerse.md` đang làm bằng tay, nay để agent tự sinh
  và tự chạy. Nếu domain-expert review ở bước 5 phát hiện thiếu sót, sửa code
  rồi chạy lại cả bộ test bước 4 lẫn bước 6 trước khi sang bước 7.

- **Vòng đời dev server cho mockup gate**: `spec-driven-mockup` là nơi gọi
  skill `run` để khởi động dev server lần đầu (phục vụ bước 3 — đưa link cho
  người dùng xem mockup). Orchestrator giữ lại handle/tiến trình đó xuyên suốt
  bước 4-6 thay vì tắt đi; nếu server chết hoặc cần restart (ví dụ sau khi đổi
  schema backend), bước nào phát hiện cũng có thể gọi lại `run` để khởi động
  lại, không cần quay về đầu quy trình. Bước 7 tái sử dụng server đang chạy
  (hoặc khởi động lại nếu cần) để Playwright chụp màn hình — không phải phiên
  server mới hoàn toàn tách biệt.

- **Git workflow theo feature slice**: orchestrator tự tạo 1 branch mới từ
  `main` ngay khi bắt đầu một tính năng (trước hoặc ở bước 1), đặt tên branch
  theo UC/tính năng (ví dụ `feature/uc-04-dang-nhap`). Toàn bộ 7 bước làm việc
  trên branch này. Sau khi bước 7 hoàn tất (test pass, screenshot xong),
  orchestrator tự commit kết quả trên branch đó, rồi hỏi người dùng một lần
  nữa qua AskUserQuestion dạng "duyệt kết quả cuối để merge vào main, hay cần
  sửa thêm" — đây là **gate thứ hai**, tách biệt với gate duyệt UI mockup ở
  bước 3 (gate 1 duyệt hình thức UI, gate 2 duyệt toàn bộ tính năng đã hoàn
  thiện). Chỉ khi người dùng xác nhận rõ ràng ở gate 2, orchestrator mới
  merge branch vào `main`; không tự ý merge nếu chưa có câu trả lời đó. Branch
  không xoá tự động sau merge trừ khi người dùng yêu cầu.

## Cấu trúc file (để builder dựng)

```
D:\Brd\.claude\skills\
  feature-from-srs\
    SKILL.md                      # orchestrator: liệt kê 7 bước, gọi sub-skill
                                   # đúng chỗ, gọi thẳng TDD skill + run skill
                                   # cho các bước còn lại
  spec-driven-mockup\
    SKILL.md                      # technique: cách tìm & trích đoạn spec liên
                                   # quan, cách soi pattern component từ
                                   # landing/trang cũ, cách bootstrap app nếu
                                   # chưa có
    scripts\
      extract_spec.py             # CLI: extract_spec.py <file> <keyword/UC-id>
  ui-mockup-approval-gate\
    SKILL.md                      # discipline: hard gate, rationalization
                                   # table, red flags — không được tự "duyệt
                                   # giùm", không được code BE trước khi có
                                   # phê duyệt rõ ràng bằng lời
  domain-expert-code-review\
    SKILL.md                      # technique: cách dispatch subagent review,
                                   # prompt mẫu, cách phân loại finding
                                   # nghiêm trọng/nhẹ, khi nào quay lại sửa
```

## Những gì để lại cho builder quyết định (và gắn nhãn "my call" trong SKILL.md)

- Nội dung chính xác của prompt dispatch cho domain-expert subagent (builder
  soạn theo mẫu ReportFindings sẵn có trong môi trường).
- Cách chính xác orchestrator phát hiện "đã có app code hay chưa" (gợi ý:
  kiểm tra tồn tại `package.json`/tương đương ở thư mục app dự kiến).
- Format chính xác câu hỏi AskUserQuestion ở gate duyệt UI (nội dung câu hỏi,
  nhãn option) — miễn tuân thủ nguyên tắc "không tự ý đi tiếp nếu chưa có câu
  trả lời rõ ràng từ người dùng".
- Chi tiết tham số CLI của `extract_spec.py` (tên flag, format output) — miễn
  nhận được file + keyword/UC-id và trả về đoạn liên quan.

## Gate tổng quan (2 gate, không nhầm lẫn)

1. **Gate 1 — duyệt UI mockup** (sau bước 2, trong `ui-mockup-approval-gate`):
   chỉ duyệt hình thức/bố cục FE mockup. Không liên quan tới code backend hay
   merge git.
2. **Gate 2 — duyệt kết quả cuối để merge** (sau bước 7, trong orchestrator
   `feature-from-srs`): duyệt toàn bộ tính năng đã hoàn thiện (BE thật, test
   pass, screenshot) trước khi merge branch vào `main`.

Cả hai đều là hard gate — không tự ý đi tiếp (gate 1) hoặc tự ý merge (gate 2)
khi chưa có câu trả lời rõ ràng bằng lời của người dùng.

## Kế hoạch test trước khi coi là xong (theo superpowers:writing-skills)

- `ui-mockup-approval-gate` (discipline skill): chạy pressure scenario RED
  trước (agent không có skill, dưới áp lực "đã gần hết thời gian"/"chắc đẹp
  rồi" có tự ý đi tiếp không) → viết skill → re-test GREEN → refactor loophole.
- `spec-driven-mockup`, `domain-expert-code-review` (technique skill): test
  bằng application scenario — đưa 1 tính năng giả lập (vd UC đăng nhập của
  BoardVerse) xem agent có trích đúng đoạn SRS, dựng đúng pattern, review
  đúng cách không.
- `feature-from-srs` (orchestrator): test end-to-end bằng 1 tính năng thật
  trong BoardVerse sau khi 3 sub-skill đã pass riêng.
