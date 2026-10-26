# Danh sách chức năng BoardVerse & Đề xuất rút gọn phạm vi (MVP cho CV)

> Tổng hợp từ BRD_BoardVerse_v1.0.docx và SRS_BoardVerse_v1.0.docx (bản 1.0/1.3). Dùng để quyết định phạm vi code thật trước khi nộp CV — KHÔNG sửa lại BRD/SRS, đây là tài liệu lập kế hoạch coding riêng.

## 1. Danh sách đầy đủ chức năng hiện có trong BRD/SRS

### 1.1. Phân hệ Bán hàng (SC-01, SC-02, SC-06, SC-11)
| Mã | Chức năng | Nguồn |
|---|---|---|
| FR-BH-01 | Đăng ký / đăng nhập bằng email + mật khẩu (khoá 15 phút sau 5 lần sai) | UC-01 |
| FR-BH-02 | Danh sách sản phẩm: lọc theo danh mục/giá/trạng thái, tìm kiếm theo từ khoá | UC-02 |
| FR-BH-03 | Chi tiết sản phẩm kèm checklist linh kiện | UC-02 |
| FR-BH-04 | Kiểm tra còn hàng trước khi cho thêm giỏ/checkout (đơn mua) | UC-03 |
| FR-BH-05 | Xem lịch sử đơn mua/thuê của chính khách | UC-02 |
| FR-BH-06 | Huỷ đơn khi còn ở trạng thái Pending | UC-03, UC-04 |
| FR-BH-07 | Quên/đặt lại mật khẩu qua email (link 30 phút) | UC-17 |
| FR-BH-08 | Giỏ mua: nhiều sản phẩm, chọn số lượng mỗi sản phẩm | UC-03 |
| FR-BH-09 | Xem/sửa số lượng/xoá sản phẩm trong giỏ mua trước khi thanh toán | UC-03 |
| FR-BH-10 | Xem/sửa thông tin cá nhân (họ tên, SĐT, địa chỉ), đổi mật khẩu | UC-18 |
| FR-BH-11 | Đánh giá sản phẩm (1-5 sao + nhận xét) cho đơn đã Completed | UC-19 |

### 1.2. Phân hệ Cho thuê (SC-03, SC-04)
| Mã | Chức năng | Nguồn |
|---|---|---|
| FR-CT-01 | Giỏ thuê: nhiều sản phẩm, mỗi sản phẩm tự chọn ngày bắt đầu/kết thúc riêng | UC-04 |
| FR-CT-02 | Chặn trùng lịch thuê (chung ít nhất 1 ngày với đơn khác còn hiệu lực) | UC-04 |
| FR-CT-03 | Tự tính tổng tiền cọc theo BRU-01 (giá niêm yết + phí ship ước tính × 2) | UC-04, UC-05 |
| FR-CT-04 | Tự tính tiền thuê theo biểu giá lũy tiến giảm BRU-02 | UC-04 |
| FR-CT-05 | Xác nhận đơn thuê + bàn giao cho giao vận | UC-05, UC-06 |
| FR-CT-06 | Tự tính phạt trễ hạn theo BRU-03 (15%/ngày, trần 100%) | UC-07 |
| FR-CT-07 | Tự tính tổng tiền hoàn cọc cuối (trừ phạt/đền bù/chênh lệch ship) | UC-07 |
| FR-CT-08 | Nhắc hạn trả hàng trước 1 ngày (email) | UC-04 |
| FR-CT-09 | Xem/sửa ngày thuê/xoá sản phẩm trong giỏ thuê trước khi thanh toán | UC-04 |

### 1.3. Phân hệ Quản lý kho (SC-05)
| Mã | Chức năng | Nguồn |
|---|---|---|
| FR-KHO-01 | Ghi nhận kết quả kiểm đếm linh kiện theo checklist từng tựa game | UC-08 |
| FR-KHO-02 | Cập nhật trạng thái hộp game theo state machine (Available/Reserved/Rented/Checking/Damaged/Sold) | UC-09 |

### 1.4. Phân hệ Thanh toán & Giao vận (SC-08, SC-09)
| Mã | Chức năng | Nguồn |
|---|---|---|
| FR-TTGV-01 | Bắt buộc nhập địa chỉ nhận hàng + địa chỉ trả hàng (không có tự lấy/tự trả) | UC-04, UC-11 |
| FR-TTGV-02 | Tự tính khoảng cách, tự chọn đối tác giao vận (Green SM ≤20km / Shopee Express >20km), tính phí | UC-04, UC-11 |
| FR-TTGV-03 | Gọi API đối tác giao vận tạo yêu cầu giao hàng khi xác nhận đơn | UC-06 |
| FR-TTGV-04 | Gọi API đối tác giao vận tạo yêu cầu lấy hàng trả khi đến hạn | UC-11 |
| FR-TTGV-05 | Nhận & xử lý webhook cập nhật trạng thái vận chuyển | UC-12 |
| FR-TTGV-06 | Gọi API cổng thanh toán MoMo sinh mã QR động theo BRU-06 | UC-10 |
| FR-TTGV-07 | Chỉ xác nhận thanh toán qua webhook, không xác nhận thủ công | UC-10 |
| FR-TTGV-08 | Tự tính chênh lệch phí ship giữa cọc đã giữ và thực tế, cộng/trừ vào hoàn cọc | UC-07 |
| FR-TTGV-09 | Rút tiền từ ví điện tử nội bộ về tài khoản ngân hàng | UC-20 |

### 1.5. Phân hệ Quản trị hệ thống (SC-07, SC-10)
| Mã | Chức năng | Nguồn |
|---|---|---|
| FR-ADM-01 | Đăng nhập nội bộ riêng biệt Staff/Admin (không dùng chung tài khoản khách) | UC-13 |
| FR-ADM-02 | Admin tạo/sửa/khoá-mở khoá tài khoản nhân viên | UC-14 |
| FR-ADM-03 | Admin thêm/sửa/xoá sản phẩm, cập nhật giá bán/giá thuê | UC-15 |
| FR-ADM-04 | Báo cáo doanh thu bán/thuê theo tháng | UC-16 |
| FR-ADM-05 | Báo cáo tồn kho theo trạng thái hộp game + danh sách đơn theo trạng thái | UC-16 |

### 1.6. Quy tắc nghiệp vụ nền (bắt buộc dù chọn feature nào)
BRU-01 (cọc), BRU-02 (giá thuê lũy tiến), BRU-03 (phạt trễ hạn), BRU-04 (đền bù mất/hỏng), BRU-05 (chọn đối tác & phí ship), BRU-06 (QR + ví điện tử), BRU-07 (ưu tiên theo webhook đến trước, không giữ chỗ).

### 1.7. Yêu cầu phi chức năng chính (NFR)
Hiệu năng (≤3s tải trang, ≥50 user đồng thời), uptime 99%, bảo mật (hash password, session timeout 30 phút, OWASP Top 10), responsive 360-1920px, lưu trữ dữ liệu theo Luật Kế toán/Nghị định 13/2023 (giả định).

---

## 2. Đề xuất rút gọn phạm vi khi code thật để nộp CV

**Nguyên tắc chọn:** giữ lại các chức năng *thể hiện rõ nhất chất "nghiệp vụ có logic tính toán + xử lý trạng thái/race condition"* (điểm mạnh nhất của đồ án này so với CRUD app thông thường), cắt/lùi các phần tốn công tích hợp nhưng ít giá trị trình diễn (vì toàn bộ đối tác thứ 3 chỉ là mock — xem phần "Nhược điểm" đã trao đổi trước đó).

### 2.1. MUST — giữ nguyên, đây là "linh hồn" của project
- FR-CT-01, 02, 03, 04, 05, 06, 07, 09 (toàn bộ luồng đặt thuê — tính cọc, giá lũy tiến, phạt trễ hạn, hoàn cọc) — đây là bộ quy tắc nghiệp vụ phức tạp nhất, **không nên cắt**, vì đây chính là lý do project này "khác" một to-do app.
- FR-KHO-01, 02 (checklist kiểm đếm + state machine hộp game) — đi kèm trực tiếp với luồng thuê/trả, không tách rời được.
- FR-TTGV-06, 07 (QR + xác nhận qua webhook) và BRU-07 (ưu tiên theo webhook đến trước) — đây là bài toán race-condition/idempotency đáng kể nhất để nói trong phỏng vấn kỹ thuật; webhook có thể **giả lập bằng một endpoint nội bộ tự gọi** (không cần tích hợp MoMo thật) nhưng vẫn giữ đúng cơ chế.
- FR-BH-01, 02, 03, 04 (đăng nhập, danh sách/chi tiết sản phẩm, checkout mua cơ bản) — nền tảng, không có thì không demo được gì.
- FR-ADM-01, 03 (đăng nhập nội bộ, quản lý sản phẩm/giá) — cần tối thiểu để Admin tạo dữ liệu seed và demo phân quyền.

### 2.2. NÊN RÚT GỌN hoặc ĐƠN GIẢN HOÁ (vẫn giữ ý tưởng, chỉ giảm độ phức tạp tích hợp)
- **Gộp 2 đối tác giao vận thành 1** (chỉ giữ Green SM, bỏ Shopee Express) — logic "chọn theo khoảng cách" trong BRU-05 có thể demo bằng 1 đối tác + ngưỡng khoảng cách giả, không cần code 2 bộ API giả lập song song. Giảm ~40% công việc ở FR-TTGV-02/03/04/05 mà không mất điểm trình diễn vì bản chất là mock cả hai.
- **FR-TTGV-08 (chênh lệch ship lúc hoàn cọc)** — là một edge-case nhỏ, có thể code sau khi luồng chính (đặt thuê → trả hàng → hoàn cọc) đã chạy được; không chặn đường demo chính nếu chưa kịp.
- **FR-BH-08, 09 (giỏ mua nhiều sản phẩm/số lượng)** — có thể làm bản đơn giản "mua 1 sản phẩm/lần" trước, nếu còn thời gian mới nâng cấp lên giỏ hàng nhiều dòng. Giỏ *thuê* (FR-CT-01) nên giữ vì đó là phần nghiệp vụ chính, nhưng giỏ *mua* ít giá trị kỹ thuật hơn.
- **FR-ADM-04, 05 (báo cáo)** — làm bản thống kê số cơ bản (vài con số tổng hợp bằng query), không cần dashboard biểu đồ đẹp; dồn thời gian cho luồng nghiệp vụ cốt lõi.

### 2.3. CÓ THỂ ĐỂ LÀM Ở TƯƠNG LAI (Phase 2 — nêu rõ trong README là "đã thiết kế, chưa triển khai" để không mất điểm tài liệu)
- **FR-BH-07 (quên/đặt lại mật khẩu qua email)** — cần tích hợp SMTP, không phải trọng tâm nghiệp vụ của đồ án; để sau.
- **FR-BH-11 (đánh giá sản phẩm, sao + nhận xét)** — tính năng phụ, không liên quan luồng thuê/mua/thanh toán chính.
- **FR-CT-08 (email nhắc hạn trả hàng)** — cần cron job + email, có thể mô phỏng bằng log/console trước, làm thật sau.
- **FR-TTGV-09 (rút tiền ví điện tử về ngân hàng)** — là tính năng "xa nhất" khỏi lõi nghiệp vụ thuê/bán game; giữ ví điện tử nội bộ để nhận hoàn cọc là đủ, chưa cần luồng rút tiền.
- **FR-ADM-02 (Admin tạo/sửa/khoá tài khoản Staff qua UI)** — có thể seed trực tiếp vào DB cho vài tài khoản mẫu, không cần xây UI quản lý nhân viên hoàn chỉnh.
- **Toàn bộ NFR định lượng** (≥50 user đồng thời, 99% uptime, load test) — các chỉ số này chỉ có ý nghĩa khi có hạ tầng/traffic thật; để portfolio cá nhân, ghi nhận trong SRS là đủ, không cần đo kiểm thật.
- **Shopee Express** (nếu không gộp theo mục 2.2) — dù chọn gộp hay không, đây vẫn là ứng viên đầu tiên để cắt nếu thời gian gấp.

### 2.4. Vì sao chọn cắt theo hướng này
Mục tiêu khi nộp CV là **demo được một luồng end-to-end hoàn chỉnh và có logic đáng nói** (đặt thuê → tính cọc → thanh toán QR giả lập → webhook → xác nhận → trả hàng → kiểm đếm → tính phạt/hoàn cọc), hơn là làm dở 100% chức năng. Các mục ở 2.3 đều là "nhánh phụ" không nằm trên luồng chính này — cắt chúng không làm mất đi phần thể hiện kỹ năng kỹ thuật/nghiệp vụ, chỉ làm gọn khối lượng code cần hoàn thành trước khi nộp CV. Khi phỏng vấn, có thể trình bày các mục ở 2.3 như "đã có trong SRS, nằm trong roadmap Phase 2" — vẫn cho thấy năng lực đặc tả đầy đủ mà không bị áp lực code hết.
