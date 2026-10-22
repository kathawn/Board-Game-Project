#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh SRS_BoardVerse_v1.0.docx - noi dung day du (gia dinh) theo dung khung
Template_SRS_Claude.docx (10 chuong + Phu luc A, B, C)."""

import os

import doc_style as ds
import project_data as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIAG = os.path.join(ROOT, "diagrams", "out") + os.sep
OUT_PATH = os.path.join(ROOT, "deliverables", "SRS_BoardVerse_v1.0.docx")

doc = ds.new_document()

ds.title_page(
    doc,
    "TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM",
    "Software Requirements Specification – SRS",
    f"Dự án: {pd.PROJECT_NAME} – Hệ thống mua bán và cho thuê board game",
    pd.AUTHOR,
    "SRS-BV-01",
)

ds.version_history(doc, [
    ["0.1", "16/10/2026", pd.AUTHOR, "Khởi tạo bản nháp, viết Chương 2-4 dựa trên BRD_BoardVerse_v1.0."],
    ["0.5", "24/10/2026", pd.AUTHOR, "Hoàn thiện Chương 5-8, 10 và Phụ lục A, B, C."],
    ["0.9", "29/10/2026", pd.AUTHOR, "Hoàn thiện Chương 9 (truy vết) và Chương 1, rà soát toàn văn."],
    ["0.95", "30/10/2026", pd.AUTHOR, "Bổ sung giao vận hai chiều (BR-09, BRU-05) và thanh toán QR (BR-10, BRU-06): FR-TTGV-xx, UC-10/11/12, cập nhật UC-04/06/07, mô hình hoá lại bằng PlantUML."],
    ["1.0", "31/10/2026", pd.AUTHOR, "Scope Freeze — đóng băng yêu cầu."],
])

ds.toc_placeholder(doc)

# ===========================================================================
# FR DATA (dung chung cho Chuong 4 va Chuong 9)
# ===========================================================================
FR_BANHANG = [
    ("FR-BH-01", "Hệ thống phải cho phép khách hàng đăng ký và đăng nhập tài khoản bằng email và mật khẩu.", "UC-01", "SC-06",
     "Tài khoản mới đăng nhập được ngay sau khi đăng ký; sai mật khẩu 5 lần liên tiếp thì tạm khoá 15 phút."),
    ("FR-BH-02", "Hệ thống phải hiển thị danh sách sản phẩm kèm bộ lọc theo danh mục, khoảng giá và trạng thái (bán/thuê).", "UC-02", "SC-01",
     "Kết quả lọc trả về đúng 100% sản phẩm khớp điều kiện trong tập dữ liệu kiểm thử."),
    ("FR-BH-03", "Hệ thống phải hiển thị chi tiết sản phẩm kèm checklist linh kiện đi kèm (tham chiếu SDD-07).", "UC-02", "SC-01",
     "Trang chi tiết hiển thị đầy đủ danh sách linh kiện đã khai báo cho sản phẩm."),
    ("FR-BH-04", "Hệ thống phải cho phép khách thêm sản phẩm vào giỏ và đặt mua (checkout), tạo đơn hàng loại \"bán\".", "UC-03", "SC-02",
     "Sau khi đặt mua thành công, đơn hàng xuất hiện trong lịch sử đơn của khách với trạng thái đúng."),
    ("FR-BH-05", "Hệ thống có thể cho phép khách xem lại lịch sử đơn mua/thuê của chính mình.", "UC-02", "BR-08",
     "Danh sách lịch sử hiển thị đúng và đầy đủ các đơn của tài khoản đang đăng nhập."),
]

FR_CHOTHUE = [
    ("FR-CT-01", "Hệ thống phải cho phép khách chọn ngày bắt đầu và ngày kết thúc để đặt thuê một sản phẩm.", "UC-04", "BR-01",
     "Đơn thuê chỉ được tạo khi ngày kết thúc sau ngày bắt đầu và sản phẩm còn trống trong khoảng đó."),
    ("FR-CT-02", "Hệ thống phải từ chối tạo đơn thuê nếu sản phẩm đã có đơn thuê khác còn hiệu lực trùng ít nhất 1 ngày trong khoảng chọn.", "UC-04", "BR-05",
     "100% các lượt thử đặt trùng lịch trong kịch bản kiểm thử đều bị từ chối kèm thông báo rõ ràng."),
    ("FR-CT-03", "Hệ thống phải tự động tính tiền cọc theo quy tắc BRU-01 (giá niêm yết, cộng thêm phí ship × 2 nếu khách chọn giao vận ở chiều nhận hàng).", "UC-04, UC-05", "BR-02, BR-09",
     "Số tiền cọc tính ra khớp đúng công thức BRU-01 trên mọi tổ hợp hình thức nhận hàng trong kịch bản kiểm thử."),
    ("FR-CT-04", "Hệ thống phải tự động tính tiền thuê theo biểu giá lũy tiến giảm dần theo quy tắc BRU-02.", "UC-04", "BR-02",
     "Tiền thuê tính đúng công thức BRU-02 trên tối thiểu 5 kịch bản số ngày thuê khác nhau."),
    ("FR-CT-05", "Hệ thống phải cho phép nhân viên xác nhận đơn thuê và ghi nhận xuất kho sản phẩm cho đơn đó (xuất tại quầy hoặc giao cho đối tác giao vận theo lựa chọn ở FR-TTGV-01).", "UC-05, UC-06", "BR-01",
     "Sau khi xác nhận, trạng thái đơn chuyển \"Confirmed\" và trạng thái hộp game chuyển \"Rented\"."),
    ("FR-CT-06", "Hệ thống phải tự động tính tiền phạt trễ hạn theo quy tắc BRU-03 khi khách trả hàng sau ngày hết hạn.", "UC-07", "BR-04",
     "Tiền phạt tính đúng 15%/ngày trễ và không vượt trần 100% giá niêm yết trong mọi kịch bản kiểm thử."),
    ("FR-CT-07", "Hệ thống phải tự động tính số tiền hoàn cọc cuối cùng theo quy tắc BRU-03, BRU-04, có điều chỉnh phần chênh lệch phí ship thực tế theo FR-TTGV-08.", "UC-07", "BR-04, BR-09",
     "Số tiền hoàn cọc = cọc đã thu trừ đúng các khoản phạt/đền bù/chênh lệch ship tính được trong kịch bản kiểm thử."),
    ("FR-CT-08", "Hệ thống nên gửi thông báo nhắc hạn trả hàng cho khách trước 1 ngày so với ngày hết hạn thuê.", "UC-04", "BR-06",
     "Thông báo được gửi đúng thời điểm T-1 ngày cho 100% đơn đang ở trạng thái Active trong kịch bản kiểm thử."),
]

FR_TTGV = [
    ("FR-TTGV-01", "Hệ thống phải cho phép khách chọn hình thức nhận hàng (tự đến lấy hoặc giao vận) khi đặt mua/đặt thuê, và chọn hình thức trả hàng (tự mang trả hoặc gọi giao vận đến lấy) khi đến hạn trả.", "UC-04, UC-11", "BR-09",
     "Đơn hàng/đơn thuê lưu đúng lựa chọn hình thức cho từng chiều; chiều trả có thể chọn trễ hơn chiều nhận (tại thời điểm trả hàng)."),
    ("FR-TTGV-02", "Hệ thống phải tính phí giao vận cho mỗi chiều có chọn giao vận theo khu vực, dựa trên quy tắc BRU-05.", "UC-04, UC-11", "BR-09",
     "Phí ship tính đúng theo khu vực (Nội thành/Ngoại thành/Ngoài tỉnh) trên tối thiểu 3 kịch bản kiểm thử."),
    ("FR-TTGV-03", "Hệ thống phải gọi API Green SM (giả định) để tạo yêu cầu giao hàng khi đơn được xác nhận với hình thức nhận là giao vận.", "UC-06", "BR-09",
     "Yêu cầu giao hàng được tạo thành công với mã vận đơn trả về, gắn đúng với mã đơn hàng/đơn thuê liên quan."),
    ("FR-TTGV-04", "Hệ thống phải gọi API Green SM (giả định) để tạo yêu cầu lấy hàng trả khi khách bấm nút yêu cầu giao vận đến lấy lúc đến hạn.", "UC-11", "BR-09",
     "Yêu cầu lấy hàng trả được tạo thành công với mã vận đơn trả về, chỉ khả dụng khi đơn thuê đang ở trạng thái Active hoặc Overdue."),
    ("FR-TTGV-05", "Hệ thống phải nhận và xử lý webhook cập nhật trạng thái vận chuyển (Đang giao/Đã giao/Đang lấy/Đã lấy) từ Green SM.", "UC-12", "BR-09",
     "Trạng thái vận chuyển hiển thị trên đơn hàng/đơn thuê được cập nhật đúng trong vòng 1 phút sau khi webhook được gửi trong kịch bản kiểm thử."),
    ("FR-TTGV-06", "Hệ thống phải gọi API cổng thanh toán (giả định) để sinh mã QR thanh toán động gắn với mã đơn và số tiền cần thu theo quy tắc BRU-06.", "UC-10", "BR-10",
     "Mã QR hiển thị đúng số tiền cần thu (tiền hàng, tiền cọc, hoặc tiền còn thiếu khi quyết toán) cho 100% đơn kiểm thử."),
    ("FR-TTGV-07", "Hệ thống phải chỉ xác nhận một khoản thanh toán là thành công sau khi nhận được webhook xác nhận từ cổng thanh toán, không chấp nhận xác nhận thủ công.", "UC-10", "BR-10",
     "Đơn hàng/đơn thuê chỉ chuyển trạng thái đã thanh toán khi có webhook thành công tương ứng trong kịch bản kiểm thử; không có cách xác nhận thủ công nào trên giao diện."),
    ("FR-TTGV-08", "Hệ thống phải tự động tính chênh lệch giữa phí ship đã giữ trong cọc và phí ship thực tế phát sinh ở chiều trả hàng, cộng/trừ vào số tiền hoàn cọc.", "UC-07", "BR-09",
     "Chênh lệch ship tính đúng trên tối thiểu 4 kịch bản (đổi/giữ hình thức trả hàng so với lúc giữ cọc) trong kiểm thử."),
]

FR_KHO = [
    ("FR-KHO-01", "Hệ thống phải cho phép nhân viên ghi nhận kết quả kiểm đếm linh kiện theo checklist của từng tựa game khi nhập/xuất kho.", "UC-08", "BR-03",
     "Biên bản kiểm đếm lưu đủ danh sách linh kiện và kết quả (đủ/thiếu/hư hỏng) cho mỗi lượt kiểm."),
    ("FR-KHO-02", "Hệ thống phải cho phép nhân viên cập nhật trạng thái hộp game theo vòng đời đã định nghĩa ở mục 3.6.", "UC-09", "SC-05",
     "Trạng thái hộp game chỉ chuyển đổi theo đúng các cung hợp lệ của State Machine ở Hình 3.6/3.7."),
    ("FR-KHO-03", "Hệ thống phải cho phép Admin thêm/sửa/xoá sản phẩm và cập nhật giá niêm yết.", "UC-02", "SC-01",
     "Thay đổi giá niêm yết áp dụng ngay cho các đơn tạo mới, không ảnh hưởng đơn đã xác nhận trước đó."),
    ("FR-KHO-04", "Hệ thống nên cung cấp báo cáo doanh thu bán/thuê tổng hợp theo tháng cho Admin.", "UC-02", "BR-07",
     "Số liệu báo cáo khớp 100% với tổng các giao dịch đã ghi nhận trong tháng được chọn."),
]

ALL_FR = FR_BANHANG + FR_CHOTHUE + FR_KHO + FR_TTGV

# ===========================================================================
# CHUONG 1 - GIOI THIEU
# ===========================================================================
ds.heading(doc, "1. Giới thiệu", level=1)
ds.para(doc, f"SRS này đặc tả các yêu cầu phần mềm cho hệ thống {pd.PROJECT_NAME}, dùng cho đội phát triển và "
             "kiểm thử trong các giai đoạn tiếp theo của dự án.")

ds.heading(doc, "1.1. Mục đích", level=2)
ds.para(doc, f"Tài liệu này đặc tả yêu cầu phần mềm cho {pd.PROJECT_NAME} phiên bản 1.0. "
             "Tài liệu kế thừa trực tiếp từ BRD_BoardVerse_v1.0 (mã BRD-BV-01) đã được Sign-off, chuyển hoá các "
             "yêu cầu nghiệp vụ (BR) và quy tắc nghiệp vụ (BRU) thành yêu cầu phần mềm chi tiết, có thể kiểm thử được.")

ds.heading(doc, "1.2. Phạm vi sản phẩm", level=2)
ds.para(doc, f"{pd.PROJECT_NAME} là một ứng dụng web giúp {pd.ORG_NAME} quản lý bán board game, cho thuê theo "
             "ngày, quản lý kho và đặt cọc. Hệ thống không bao gồm vận chuyển tận nhà, bảo hiểm sản phẩm, thanh "
             "toán quốc tế, bán sỉ và ứng dụng di động riêng (xem mục 5.1/5.2 của BRD_BoardVerse_v1.0).")

ds.heading(doc, "1.3. Đối tượng đọc và hướng dẫn đọc", level=2)
ds.table(doc, ["Nhóm đọc", "Chương nên đọc"], [
    ["Lập trình viên (Giai đoạn Vibe Code)", "Chương 3, 4, 5, 7, 9"],
    ["Người kiểm thử (UAT)", "Chương 4, 6, 10"],
    ["Quản lý dự án / Admin", "Chương 1, 2, 9"],
    ["Đội thiết kế hệ thống (SDD)", "Chương 3, 4, 7, 9"],
], col_widths_cm=[6.0, 9.0])

ds.heading(doc, "1.4. Định nghĩa và từ viết tắt", level=2)
ds.table(doc, ["Thuật ngữ", "Giải thích"], [
    ["ACT-xx", "Mã tác nhân (actor)."],
    ["CON-xx", "Mã ràng buộc thiết kế/triển khai."],
    ["FR-nhóm-xx", "Mã yêu cầu chức năng, nhóm = BH (Bán hàng)/CT (Cho thuê)/KHO (Quản lý kho)."],
    ["NFR-xx", "Mã yêu cầu phi chức năng."],
    ["SSD", "System Sequence Diagram — sơ đồ tuần tự mức hệ thống."],
    ["SRS", "Software Requirements Specification — chính là tài liệu này."],
    ["TBD (To Be Determined)", "Điểm chưa chốt khi viết SRS."],
    ["UC-xx", "Mã use case."],
], col_widths_cm=[5.0, 11.0])

ds.heading(doc, "1.5. Tài liệu tham khảo", level=2)
ds.bullets(doc, [
    "[1] Nguyễn Minh Quân (2026). BRD_BoardVerse_v1.0.docx — Tài liệu yêu cầu nghiệp vụ, mã BRD-BV-01 (giả định của tác giả).",
    "[2] Nguyễn Minh Quân (2026). Bảng giá bán/thuê board game nội bộ BoardVerse (giả định của tác giả).",
])

ds.heading(doc, "1.6. Quy ước tài liệu", level=2)
ds.table(doc, ["Loại mã", "Quy ước", "Ví dụ"], [
    ["Yêu cầu chức năng", "FR-<nhóm>-<số thứ tự 2 chữ số>", "FR-CT-01"],
    ["Yêu cầu phi chức năng", "NFR-<số thứ tự 2 chữ số>", "NFR-01"],
    ["Tác nhân", "ACT-<số thứ tự 2 chữ số>", "ACT-01"],
    ["Use case", "UC-<số thứ tự 2 chữ số>", "UC-04"],
    ["Ràng buộc", "CON-<số thứ tự 2 chữ số>", "CON-01"],
    ["Mức ưu tiên", "MoSCoW: Must / Should / Could / Won't", "Must"],
], col_widths_cm=[4.5, 6.5, 5.0])
ds.note(doc, "Quy ước này được áp dụng nhất quán kể từ Chương 2 trở đi, dù được trình bày chính thức ở đây.")

# ===========================================================================
# CHUONG 2 - MO TA TONG QUAN
# ===========================================================================
ds.heading(doc, "2. Mô tả tổng quan", level=1)

ds.heading(doc, "2.1. Bối cảnh sản phẩm", level=2)
ds.para(doc, f"{pd.PROJECT_NAME} là hệ thống mới, thay thế hoàn toàn quy trình thủ công bằng Excel/Zalo đã mô tả "
             "ở BRD. Hình 2.1 thể hiện ranh giới hệ thống và các nhóm tác nhân tương tác.")
ds.picture(doc, DIAG + "srs_2_1_context.png", width_cm=13)

ds.heading(doc, "2.2. Các chức năng chính (tóm tắt)", level=2)
ds.bullets(doc, [
    "Bán hàng: xem sản phẩm, đặt mua, quản lý tài khoản khách hàng.",
    "Cho thuê: đặt thuê theo ngày, tính cọc/giá thuê/phạt trễ hạn, xác nhận đơn và hoàn cọc.",
    "Quản lý kho: kiểm đếm linh kiện, cập nhật trạng thái hộp game, quản lý danh mục và báo cáo.",
    "Thanh toán & Giao vận: thanh toán trực tuyến qua mã QR, chọn hình thức nhận/trả hàng (tự đến lấy/mang trả hoặc giao vận hai chiều qua đối tác bên thứ ba).",
])
ds.para(doc, "Chi tiết từng yêu cầu được trình bày tại Chương 4.")

ds.heading(doc, "2.3. Đặc điểm người dùng", level=2)
ds.table(doc, ["Nhóm người dùng", "Trình độ CNTT", "Tần suất dùng", "Quyền hạn"], [
    ["Customer", "Phổ thông, quen dùng web/app mua sắm", "Không thường xuyên (vài lần/tháng)", "Xem, đặt mua, đặt thuê, chọn hình thức nhận/trả hàng, thanh toán online, xem lịch sử đơn của chính mình"],
    ["Staff", "Cơ bản, được đào tạo trực tiếp", "Hàng ngày, trong ca làm việc", "Xác nhận đơn, kiểm đếm kho, cập nhật trạng thái hộp game, bàn giao cho giao vận"],
    ["Admin", "Cơ bản đến khá", "Vài lần/tuần", "Toàn quyền trên danh mục sản phẩm, giá, xem báo cáo"],
])
ds.para(doc, "Ma trận phân quyền chức năng theo module:", bold=True)
ds.table(doc, ["Module", "Customer", "Staff", "Admin"], [
    ["Bán hàng (xem/đặt mua)", "Có", "Xem", "Toàn quyền"],
    ["Cho thuê (đặt thuê/hoàn cọc)", "Đặt thuê", "Xác nhận/kiểm đếm/hoàn cọc", "Toàn quyền"],
    ["Quản lý kho", "Không", "Kiểm đếm, cập nhật trạng thái", "Toàn quyền"],
    ["Thanh toán & Giao vận", "Chọn hình thức, thanh toán QR", "Bàn giao cho giao vận, xem trạng thái vận chuyển", "Xem toàn bộ"],
    ["Báo cáo doanh thu", "Không", "Không", "Toàn quyền"],
], col_widths_cm=[5.5, 3.0, 4.5, 3.0])

ds.heading(doc, "2.4. Môi trường vận hành", level=2)
ds.table(doc, ["Thành phần", "Môi trường máy chủ", "Môi trường người dùng"], [
    ["Hệ điều hành", "Linux (container trên nền tảng PaaS)", "Không giới hạn (truy cập qua trình duyệt)"],
    ["Trình duyệt tối thiểu", "—", "Chrome/Edge/Safari bản phát hành trong 2 năm gần nhất"],
    ["Cơ sở dữ liệu", "PostgreSQL 15 trở lên", "—"],
    ["Mạng", "Kết nối Internet ổn định tối thiểu 4G/Wi-Fi", "Kết nối Internet ổn định tối thiểu 4G/Wi-Fi"],
], col_widths_cm=[3.5, 6.0, 6.0])

ds.heading(doc, "2.5. Ràng buộc thiết kế và triển khai", level=2)
ds.table(doc, ["Mã", "Ràng buộc", "Lý do"], [
    ["CON-01", "Dùng Next.js (App Router) + TypeScript cho frontend.", "Thống nhất với lựa chọn Tech Stack ở Tài liệu thiết kế hệ thống (SDD)."],
    ["CON-02", "Dùng PostgreSQL làm cơ sở dữ liệu quan hệ.", "Hỗ trợ tốt ràng buộc khoá ngoại và kiểu Enum cho trạng thái đơn/hộp game."],
    ["CON-03", "Toàn bộ giao diện phải bằng tiếng Việt.", "Khớp CT-04 của BRD."],
    ["CON-04", "Ngân sách phát triển không vượt quá 90.000.000 VNĐ.", "Khớp CT-01/mục 9.1 của BRD."],
    ["CON-05", "Việc tích hợp với Green SM và MoMo chỉ ở mức giả lập API (mock), không gọi dịch vụ thật.", "Khớp CT-05 của BRD."],
], col_widths_cm=[1.8, 7.0, 6.2])

ds.heading(doc, "2.6. Giả định và phụ thuộc", level=2)
ds.para(doc, "Giả định:", bold=True)
ds.bullets(doc, [
    "Khách hàng có thiết bị và kết nối Internet (kế thừa AS-01 của BRD) — nếu sai, cần duy trì song song kênh tại quầy.",
    "Chính sách cọc 100% giá niêm yết không thay đổi trong năm đầu (kế thừa AS-03 của BRD) — nếu sai, cần thiết kế lại FR-CT-03.",
])
ds.para(doc, "Phụ thuộc:", bold=True)
ds.bullets(doc, [
    "Phụ thuộc Prisma ORM và PostgreSQL — nếu không sẵn sàng, không thể migrate schema ở Giai đoạn SDD/Dev.",
    "Phụ thuộc API MoMo giả định (DP-04 của BRD) để sinh mã QR và xác nhận thanh toán (FR-TTGV-06, FR-TTGV-07) — nếu không có, không thể hoàn thành luồng thanh toán online.",
    "Phụ thuộc API Green SM giả định (DP-03 của BRD) để tạo yêu cầu giao/lấy hàng và nhận webhook trạng thái (FR-TTGV-03..05) — nếu không có, chỉ còn hình thức tự đến lấy/tự mang trả.",
])

# ===========================================================================
# CHUONG 3 - MO HINH HOA YEU CAU
# ===========================================================================
ds.heading(doc, "3. Mô hình hoá yêu cầu", level=1)

ds.heading(doc, "3.1. Sơ đồ use case tổng quát", level=2)
ds.code_block(doc, """@startuml
left to right direction
actor Customer as C
actor Staff as S
actor Admin as A
actor "Green SM\\n(giả định)" as Ship
actor "MoMo\\n(giả định)" as Pay

package "Bán hàng" {
  usecase "UC-01 Đăng ký/Đăng nhập" as UC01
  usecase "UC-02 Xem sản phẩm" as UC02
  usecase "UC-03 Đặt mua" as UC03
}
package "Cho thuê" {
  usecase "UC-04 Đặt thuê theo ngày" as UC04
  usecase "UC-05 Xác nhận đặt cọc" as UC05
  usecase "UC-06 Bàn giao xuất kho" as UC06
  usecase "UC-07 Quyết toán hoàn cọc" as UC07
}
package "Quản lý kho" {
  usecase "UC-08 Kiểm đếm linh kiện nhập kho" as UC08
  usecase "UC-09 Cập nhật trạng thái hộp game" as UC09
}
package "Thanh toán & Giao vận" {
  usecase "UC-10 Thanh toán qua mã QR" as UC10
  usecase "UC-11 Yêu cầu giao vận lấy hàng trả" as UC11
  usecase "UC-12 Nhận cập nhật trạng thái giao vận" as UC12
}

C --> UC01
C --> UC02
C --> UC03
C --> UC04
C --> UC11
S --> UC05
S --> UC06
S --> UC07
S --> UC08
S --> UC09
A --> UC02
A --> UC09

UC03 ..> UC10 : <<include>>
UC04 ..> UC10 : <<include>>
UC06 ..> UC12 : <<extend>>\\n(nếu nhận hàng = giao vận)
UC11 ..> UC12 : <<extend>>
UC07 ..> UC10 : <<extend>>\\n(nếu còn tiền phải thu thêm)

Ship --> UC12
Pay --> UC10
@enduml""")
ds.caption(doc, "Hình 3.1 – Sơ đồ Use Case tổng quát")
ds.para(doc, "Do tổng số use case vượt quá 8, phân rã thêm theo 4 phân hệ để dễ đọc:")
ds.code_block(doc, """@startuml
left to right direction
actor Customer as C
actor Admin as A
package "Bán hàng" {
  usecase "UC-01 Đăng ký/Đăng nhập" as UC01
  usecase "UC-02 Xem sản phẩm" as UC02
  usecase "UC-03 Đặt mua" as UC03
}
C --> UC01
C --> UC02
C --> UC03
A --> UC02
@enduml""")
ds.caption(doc, "Hình 3.1a – Use Case phân hệ Bán hàng")
ds.code_block(doc, """@startuml
left to right direction
actor Customer as C
actor Staff as S
package "Cho thuê" {
  usecase "UC-04 Đặt thuê theo ngày" as UC04
  usecase "UC-05 Xác nhận đặt cọc" as UC05
  usecase "UC-06 Bàn giao xuất kho" as UC06
  usecase "UC-07 Quyết toán hoàn cọc" as UC07
}
C --> UC04
S --> UC05
S --> UC06
S --> UC07
@enduml""")
ds.caption(doc, "Hình 3.1b – Use Case phân hệ Cho thuê")
ds.code_block(doc, """@startuml
left to right direction
actor Staff as S
actor Admin as A
package "Quản lý kho" {
  usecase "UC-08 Kiểm đếm linh kiện nhập kho" as UC08
  usecase "UC-09 Cập nhật trạng thái hộp game" as UC09
}
S --> UC08
S --> UC09
A --> UC09
@enduml""")
ds.caption(doc, "Hình 3.1c – Use Case phân hệ Quản lý kho")
ds.code_block(doc, """@startuml
left to right direction
actor Customer as C
actor "Green SM\\n(giả định)" as Ship
actor "MoMo\\n(giả định)" as Pay
package "Thanh toán & Giao vận" {
  usecase "UC-10 Thanh toán qua mã QR" as UC10
  usecase "UC-11 Yêu cầu giao vận lấy hàng trả" as UC11
  usecase "UC-12 Nhận cập nhật trạng thái giao vận" as UC12
}
C --> UC10
C --> UC11
Pay --> UC10
Ship --> UC12
UC11 ..> UC12 : <<extend>>
@enduml""")
ds.caption(doc, "Hình 3.1d – Use Case phân hệ Thanh toán & Giao vận")

ds.heading(doc, "3.2. Danh sách tác nhân", level=2)
ds.table(doc, ["Mã", "Tên tác nhân", "Loại", "Mô tả"], pd.ACTORS, col_widths_cm=[1.8, 4.0, 2.2, 7.0])

ds.heading(doc, "3.3. Danh sách use case", level=2)
ds.table(doc, ["Mã", "Tên use case", "Tác nhân chính", "Phân hệ"], pd.USE_CASES, col_widths_cm=[1.8, 6.5, 3.0, 3.7])

ds.heading(doc, "3.4. Đặc tả use case", level=2)
ds.para(doc, "Đặc tả đầy đủ cho 6 use case trọng điểm (3.4.1 – 3.4.6), theo bảng mẫu Actor / Pre-Post-condition / Main flow / Alternative flow / Exception flow.")

uc_specs = [
    ("3.4.1. UC-04 – Đặt thuê theo ngày", {
        "Tác nhân": "Customer (ACT-01)",
        "Điều kiện trước": "Khách đã đăng nhập; sản phẩm đang ở trạng thái cho thuê được.",
        "Điều kiện sau": "Đơn thuê được tạo ở trạng thái Pending, tiền thuê và tiền cọc (gồm phí ship nếu có) đã tính.",
        "Luồng chính": "1. Khách chọn sản phẩm. 2. Khách chọn ngày bắt đầu và ngày kết thúc thuê. "
                        "3. Hệ thống kiểm tra tồn kho theo khoảng ngày (FR-CT-02). 4. Khách chọn hình thức nhận hàng: tự đến lấy hoặc giao vận "
                        "(FR-TTGV-01); nếu chọn giao vận, khách nhập khu vực nhận hàng. 5. Hệ thống tính tiền thuê (FR-CT-04), phí ship nếu có "
                        "(FR-TTGV-02) và tiền cọc theo BRU-01 (FR-CT-03). 6. Khách xác nhận và thanh toán cọc online qua mã QR (UC-10). "
                        "7. Hệ thống tạo đơn thuê trạng thái Pending.",
        "Luồng thay thế": "6a. Khách huỷ thao tác trước khi thanh toán → hệ thống không tạo đơn.",
        "Luồng ngoại lệ": "3a. Sản phẩm không còn trống trong khoảng ngày đã chọn (rẽ từ bước 3) → hệ thống báo lỗi và gợi ý ngày/sản phẩm khác, kết thúc use case.",
    }),
    ("3.4.2. UC-10 – Thanh toán trực tuyến qua mã QR", {
        "Tác nhân": "Customer (ACT-01); MoMo (ACT-05, giả định)",
        "Điều kiện trước": "Có một khoản cần thu xác định (tiền cọc của đơn thuê, tiền hàng của đơn mua, hoặc tiền còn thiếu khi quyết toán hoàn cọc).",
        "Điều kiện sau": "Khoản thanh toán được xác nhận thành công và đơn hàng/đơn thuê liên quan chuyển sang trạng thái tương ứng (ví dụ Pending→Confirmed).",
        "Luồng chính": "1. Hệ thống gọi API cổng thanh toán MoMo để sinh mã QR gắn với mã đơn và số tiền cần thu (FR-TTGV-06). "
                        "2. Khách quét mã QR bằng ví MoMo hoặc app ngân hàng hỗ trợ VietQR và xác nhận thanh toán. 3. MoMo gửi webhook báo kết quả "
                        "thành công về hệ thống (FR-TTGV-07). 4. Hệ thống xác nhận khoản thanh toán và cập nhật trạng thái đơn liên quan.",
        "Luồng thay thế": "Không có.",
        "Luồng ngoại lệ": "3a. Hệ thống không nhận được webhook trong 15 phút kể từ khi sinh mã QR (rẽ từ bước 3) → mã QR hết hiệu lực, hệ thống "
                           "báo khách thử lại từ bước 1. 3b. Webhook báo thất bại → hệ thống giữ nguyên trạng thái đơn, báo khách thanh toán thất bại.",
    }),
    ("3.4.3. UC-06 – Bàn giao xuất kho", {
        "Tác nhân": "Staff (ACT-02); Green SM (ACT-04, giả định)",
        "Điều kiện trước": "Đơn thuê ở trạng thái Confirmed (đã xác nhận, đã thu cọc).",
        "Điều kiện sau": "Hộp game chuyển trạng thái Rented; đơn thuê chuyển trạng thái Active.",
        "Luồng chính": "1. Nhân viên tra cứu đơn thuê theo mã đơn. 2. Hệ thống hiển thị hình thức nhận hàng khách đã chọn (FR-TTGV-01). "
                        "3a. Nếu hình thức là tự đến lấy: nhân viên xác nhận bàn giao trực tiếp cho khách tại quầy. "
                        "3b. Nếu hình thức là giao vận: hệ thống gọi API Green SM để tạo yêu cầu giao hàng (FR-TTGV-03), nhân viên giao "
                        "sản phẩm cho shipper Green SM. 4. Hệ thống cập nhật trạng thái hộp game thành Rented (FR-KHO-02). 5. Hệ thống cập nhật đơn thuê thành Active.",
        "Luồng thay thế": "Không có.",
        "Luồng ngoại lệ": "1a. Không tìm thấy mã đơn (rẽ từ bước 1) → hệ thống báo lỗi, kết thúc use case. "
                           "3ba. API Green SM trả lỗi/không khả dụng (rẽ từ bước 3b) → hệ thống báo nhân viên tạm chuyển sang hình thức tự đến lấy hoặc thử lại sau.",
    }),
    ("3.4.4. UC-08 – Kiểm đếm linh kiện nhập kho", {
        "Tác nhân": "Staff (ACT-02)",
        "Điều kiện trước": "Sản phẩm đã về đến quầy (do khách tự mang trả hoặc do shipper giao vận chiều trả bàn giao lại).",
        "Điều kiện sau": "Biên bản kiểm đếm được lưu; trạng thái hộp game cập nhật theo kết quả kiểm đếm.",
        "Luồng chính": "1. Nhân viên mở checklist linh kiện của sản phẩm (FR-KHO-01). 2. Nhân viên đánh dấu từng linh kiện đủ/thiếu/hư hỏng. "
                        "3. Hệ thống lưu biên bản kiểm đếm. 4. Hệ thống cập nhật trạng thái hộp game (FR-KHO-02) — Available nếu đủ, Damaged nếu thiếu/hư hỏng.",
        "Luồng thay thế": "Không có.",
        "Luồng ngoại lệ": "2a. Linh kiện không có trong checklist gốc (rẽ từ bước 2) → nhân viên ghi chú thủ công, hệ thống vẫn lưu biên bản.",
    }),
    ("3.4.5. UC-11 – Yêu cầu giao vận lấy hàng trả", {
        "Tác nhân": "Customer (ACT-01); Green SM (ACT-04, giả định)",
        "Điều kiện trước": "Đơn thuê đang ở trạng thái Active hoặc Overdue (đến hoặc đã quá hạn trả).",
        "Điều kiện sau": "Yêu cầu lấy hàng trả được tạo với mã vận đơn; đơn thuê ghi nhận hình thức trả hàng là giao vận.",
        "Luồng chính": "1. Khi đến hạn trả, hệ thống hiển thị 2 lựa chọn: tự mang ra quán hoặc bấm nút gọi Green SM đến lấy (FR-TTGV-01). "
                        "2. Khách chọn gọi giao vận và xác nhận khu vực lấy hàng. 3. Hệ thống tính phí ship chiều trả theo khu vực (FR-TTGV-02). "
                        "4. Hệ thống gọi API Green SM để tạo yêu cầu lấy hàng (FR-TTGV-04). 5. Hệ thống ghi nhận hình thức trả hàng = giao vận cho đơn thuê.",
        "Luồng thay thế": "1a. Khách chọn tự mang ra quán → hệ thống ghi nhận hình thức trả hàng = tự mang trả, kết thúc use case ở bước này.",
        "Luồng ngoại lệ": "4a. API Green SM trả lỗi/không khả dụng (rẽ từ bước 4) → hệ thống báo khách thử lại sau hoặc chọn tự mang ra quán.",
    }),
    ("3.4.6. UC-07 – Quyết toán hoàn cọc", {
        "Tác nhân": "Staff (ACT-02); MoMo (ACT-05, giả định)",
        "Điều kiện trước": "Biên bản kiểm đếm (UC-08) đã hoàn tất cho đơn thuê liên quan; hình thức trả hàng thực tế đã xác định (UC-11 hoặc tự mang trả).",
        "Điều kiện sau": "Số tiền hoàn cọc cuối cùng được tính và hoàn lại cho khách (hoặc thu thêm nếu còn thiếu); đơn thuê chuyển trạng thái Completed rồi Closed.",
        "Luồng chính": "1. Hệ thống tính phạt trễ hạn nếu có (FR-CT-06). 2. Hệ thống tính đền bù nếu thiếu/hư hỏng linh kiện (FR-CT-07). "
                        "3. Hệ thống tính chênh lệch phí ship giữa số đã giữ trong cọc và số thực tế phát sinh (FR-TTGV-08). "
                        "4. Hệ thống tính số tiền hoàn cọc cuối cùng. 5. Nhân viên xác nhận hoàn cọc; nếu còn thiếu tiền, hệ thống sinh mã QR để thu thêm (UC-10). "
                        "6. Hệ thống cập nhật đơn thuê thành Completed.",
        "Luồng thay thế": "5a. Số tiền hoàn cọc bằng 0 → hệ thống vẫn lập phiếu xác nhận hoàn cọc 0đ để lưu vết.",
        "Luồng ngoại lệ": "4a. Tổng tiền phạt/đền bù/ship vượt quá tiền cọc đã thu (rẽ từ bước 4) → hệ thống báo số tiền khách còn phải trả thêm, không tự trừ âm.",
    }),
]
for title, fields in uc_specs:
    ds.heading(doc, title, level=3)
    ds.table(doc, ["Trường", "Nội dung"], list(fields.items()), col_widths_cm=[3.5, 11.5])

ds.para(doc, "Đặc tả rút gọn cho các use case còn lại (luồng chính, 1 câu):", bold=True)
ds.table(doc, ["Mã", "Luồng chính rút gọn"], [
    ["UC-01", "Khách nhập email/mật khẩu để đăng ký hoặc đăng nhập; hệ thống xác thực và cấp phiên đăng nhập."],
    ["UC-02", "Khách xem danh sách/chi tiết sản phẩm; hệ thống hiển thị dữ liệu kèm checklist linh kiện."],
    ["UC-03", "Khách thêm sản phẩm vào giỏ, chọn hình thức nhận hàng và thanh toán; hệ thống tạo đơn hàng loại \"bán\"."],
    ["UC-05", "Nhân viên xem đơn thuê mới, xác nhận đã thu cọc; hệ thống chuyển đơn sang trạng thái Confirmed."],
    ["UC-09", "Nhân viên chọn hộp game và trạng thái mới; hệ thống kiểm tra hợp lệ theo State Machine rồi cập nhật."],
    ["UC-12", "Green SM gửi webhook cập nhật trạng thái vận đơn; hệ thống xác thực và cập nhật trạng thái vận chuyển trên đơn liên quan."],
], col_widths_cm=[1.8, 13.2])

ds.heading(doc, "3.5. Mô hình dữ liệu mức khái niệm", level=2)
ds.para(doc, "Danh sách lớp/thực thể sơ bộ được xác định từ các use case ở mục 3.3 và Business Rules Catalog "
             "(BRD mục 8.2): KhachHang, SanPham, HopGame, LinhKien, DonHang, ChiTietDonHang, DatCoc, GiaoVan, "
             "ThanhToan, BienBanKiemDem, NhanVien.")
ds.para(doc, "Sơ đồ lớp Domain (phiên bản không có phương thức, chỉ thuộc tính):", bold=True)
ds.code_block(doc, """@startuml
hide circle
hide methods
skinparam classAttributeIconSize 0

class KhachHang {
  id
  ho_ten
  email
  sdt
  mat_khau_hash
}
class SanPham {
  id
  ten
  mo_ta
  gia_niem_yet
  danh_muc
}
class HopGame {
  id
  ma_hop
  trang_thai
}
class LinhKien {
  id
  ten_linh_kien
  la_doc_ban
}
class DonHang {
  id
  loai
  trang_thai
  ngay_tao
}
class ChiTietDonHang {
  id
  ngay_bat_dau
  ngay_ket_thuc
  don_gia
  hinh_thuc_nhan
  hinh_thuc_tra
}
class DatCoc {
  id
  so_tien
  phi_ship_giu
  trang_thai
  ngay_hoan
}
class GiaoVan {
  id
  chieu
  khu_vuc
  phi_ship
  ma_van_don
  trang_thai_vanchuyen
}
class ThanhToan {
  id
  so_tien
  muc_dich
  trang_thai
  ma_qr
}
class BienBanKiemDem {
  id
  ket_qua
  ngay_lap
}
class NhanVien {
  id
  ho_ten
  vai_tro
}

KhachHang "1" -- "0..*" DonHang
DonHang "1" *-- "1..*" ChiTietDonHang
SanPham "1" -- "0..*" ChiTietDonHang
SanPham "1" -- "0..*" HopGame
SanPham "1" -- "0..*" LinhKien
DonHang "1" -- "0..1" DatCoc
ChiTietDonHang "1" -- "0..*" GiaoVan
DonHang "1" -- "0..*" ThanhToan
ChiTietDonHang "1" -- "0..*" BienBanKiemDem
NhanVien "1" -- "0..*" BienBanKiemDem
@enduml""")
ds.caption(doc, "Hình 3.2 – Sơ đồ lớp Domain (không có phương thức)")
ds.para(doc, "Áp dụng 4 quy tắc chuyển đổi từ Sơ đồ lớp Domain sang ERD: (1) mỗi lớp → một thực thể/bảng; "
             "(2) mỗi thuộc tính → một cột kèm kiểu dữ liệu sơ bộ; (3) quan hệ 1-N/N-N → khoá ngoại hoặc bảng "
             "trung gian; (4) chuẩn hoá và vẽ ERD hoàn chỉnh theo ký hiệu Crow's Foot (Hình 3.3). Quan hệ "
             "DonHang–DatCoc là 1-1 vì mỗi đơn thuê chỉ có một khoản cọc tương ứng; GiaoVan và ThanhToan là thực thể "
             "mới tách ra từ nhu cầu lưu nhiều lượt giao vận (2 chiều) và nhiều lượt thanh toán (cọc, tiền hàng, thu thêm) cho cùng một đơn.")
ds.code_block(doc, """@startuml
hide circle
skinparam linetype orthogonal

entity KhachHang {
  * id : UUID <<PK>>
  --
  ho_ten : VARCHAR
  email : VARCHAR
  sdt : VARCHAR
  mat_khau_hash : VARCHAR
}
entity SanPham {
  * id : UUID <<PK>>
  --
  ten : VARCHAR
  mo_ta : TEXT
  gia_niem_yet : NUMERIC
  danh_muc : VARCHAR
}
entity HopGame {
  * id : UUID <<PK>>
  --
  # san_pham_id : UUID <<FK>>
  ma_hop : VARCHAR
  trang_thai : ENUM
}
entity LinhKien {
  * id : UUID <<PK>>
  --
  # san_pham_id : UUID <<FK>>
  ten_linh_kien : VARCHAR
  la_doc_ban : BOOLEAN
}
entity DonHang {
  * id : UUID <<PK>>
  --
  # khach_hang_id : UUID <<FK>>
  loai : ENUM
  trang_thai : ENUM
  ngay_tao : TIMESTAMP
}
entity ChiTietDonHang {
  * id : UUID <<PK>>
  --
  # don_hang_id : UUID <<FK>>
  # san_pham_id : UUID <<FK>>
  ngay_bat_dau : DATE
  ngay_ket_thuc : DATE
  don_gia : NUMERIC
  hinh_thuc_nhan : ENUM
  hinh_thuc_tra : ENUM
}
entity DatCoc {
  * id : UUID <<PK>>
  --
  # don_hang_id : UUID <<FK, UNIQUE>>
  so_tien : NUMERIC
  phi_ship_giu : NUMERIC
  trang_thai : ENUM
  ngay_hoan : DATE
}
entity GiaoVan {
  * id : UUID <<PK>>
  --
  # chi_tiet_don_id : UUID <<FK>>
  chieu : ENUM
  khu_vuc : ENUM
  phi_ship : NUMERIC
  ma_van_don : VARCHAR
  trang_thai_vanchuyen : ENUM
}
entity ThanhToan {
  * id : UUID <<PK>>
  --
  # don_hang_id : UUID <<FK>>
  so_tien : NUMERIC
  muc_dich : ENUM
  trang_thai : ENUM
  ma_qr : VARCHAR
}
entity BienBanKiemDem {
  * id : UUID <<PK>>
  --
  # chi_tiet_don_id : UUID <<FK>>
  # nhan_vien_id : UUID <<FK>>
  ket_qua : VARCHAR
  ngay_lap : TIMESTAMP
}
entity NhanVien {
  * id : UUID <<PK>>
  --
  ho_ten : VARCHAR
  vai_tro : ENUM
}

KhachHang ||--o{ DonHang
DonHang ||--|{ ChiTietDonHang
SanPham ||--o{ ChiTietDonHang
SanPham ||--o{ HopGame
SanPham ||--o{ LinhKien
DonHang ||--o| DatCoc
ChiTietDonHang ||--o{ GiaoVan
DonHang ||--o{ ThanhToan
ChiTietDonHang ||--o{ BienBanKiemDem
NhanVien ||--o{ BienBanKiemDem
@enduml""")
ds.caption(doc, "Hình 3.3 – ERD mức khái niệm (ký hiệu Crow's Foot)")

ds.heading(doc, "3.6. Mô hình quy trình và trạng thái", level=2)
ds.para(doc, "Activity Diagram (Swimlane) – luồng đặt thuê:", bold=True)
ds.code_block(doc, """@startuml
|Customer|
start
:Chọn sản phẩm & ngày thuê;
:Chọn hình thức nhận hàng
(tự đến lấy / giao vận);
|Hệ thống|
:Kiểm tra tồn kho theo ngày (FR-CT-02);
:Tính tiền thuê (BRU-02) và phí ship
nếu có (BRU-05);
:Tính tiền cọc theo BRU-01;
|Customer|
:Thanh toán cọc qua mã QR (UC-10);
|Hệ thống|
:Xác nhận thanh toán (webhook);
:Tạo đơn thuê trạng thái Pending;
|Staff|
:Xác nhận đơn thuê (UC-05);
if (Hình thức nhận = giao vận?) then (Có)
  :Gọi API Green SM
  tạo yêu cầu giao hàng (FR-TTGV-03);
else (Không)
  :Bàn giao trực tiếp tại quầy;
endif
:Xuất kho, cập nhật Hộp game = Rented;
stop
@enduml""")
ds.caption(doc, "Hình 3.4 – Activity Diagram luồng đặt thuê (Swimlane)")
ds.para(doc, "Activity Diagram (Swimlane) – luồng trả hàng & kiểm kê:", bold=True)
ds.code_block(doc, """@startuml
|Customer|
start
:Đến hạn trả, chọn hình thức trả hàng
(tự mang trả / gọi giao vận);
if (Chọn giao vận?) then (Có)
  |Hệ thống|
  :Tính phí ship chiều trả (BRU-05);
  :Gọi API Green SM
  tạo yêu cầu lấy hàng (FR-TTGV-04);
  |Green SM|
  :Lấy hàng từ khách, giao về quán;
else (Không)
  |Customer|
  :Mang trả sản phẩm tại quầy;
endif
|Staff|
:Kiểm đếm linh kiện theo checklist điện tử (UC-08);
|Hệ thống|
:Tính phạt trễ hạn / đền bù (BRU-03, BRU-04);
:Tính chênh lệch phí ship (FR-TTGV-08);
:Tính số tiền hoàn cọc cuối cùng;
|Staff|
:Xác nhận hoàn cọc (UC-07);
|Hệ thống|
if (Còn thiếu tiền?) then (Có)
  :Sinh mã QR thu thêm (UC-10);
else (Không)
  :Hoàn tiền còn lại cho khách;
endif
stop
@enduml""")
ds.caption(doc, "Hình 3.5 – Activity Diagram luồng trả hàng & kiểm kê (Swimlane)")
ds.para(doc, "State Machine Diagram – Vòng đời Đơn thuê:", bold=True)
ds.code_block(doc, """@startuml
[*] --> Pending : Khách đặt thuê, chưa thanh toán cọc
Pending --> Confirmed : Thanh toán cọc thành công (UC-10) + Staff xác nhận (UC-05)
Confirmed --> Active : Bàn giao xuất kho (UC-06)
Active --> Overdue : Quá hạn trả hàng
Active --> Completed : Trả hàng đúng hạn, đã quyết toán (UC-07)
Overdue --> Completed : Trả hàng trễ hạn, đã quyết toán (UC-07)
Completed --> Closed : Hoàn tất hoàn cọc/thu thêm
Closed --> [*]
@enduml""")
ds.caption(doc, "Hình 3.6 – State Machine: Vòng đời Đơn thuê")
ds.para(doc, "State Machine Diagram – Vòng đời Hộp game vật lý:", bold=True)
ds.code_block(doc, """@startuml
[*] --> Available : Nhập kho lần đầu
Available --> Reserved : Khách đặt thuê, đơn ở Pending/Confirmed
Reserved --> Rented : Bàn giao xuất kho (UC-06)
Reserved --> Available : Đơn bị huỷ trước khi xuất kho
Rented --> Checking : Khách trả hàng, bắt đầu kiểm đếm (UC-08)
Checking --> Available : Đủ linh kiện, không hư hỏng
Checking --> Damaged : Thiếu/hư hỏng linh kiện
Damaged --> Available : Đã xử lý đền bù (BRU-04)
@enduml""")
ds.caption(doc, "Hình 3.7 – State Machine: Vòng đời Hộp game vật lý")
ds.para(doc, "System Sequence Diagram – Đặt cọc:", bold=True)
ds.code_block(doc, """@startuml
actor Customer as C
participant "Hệ thống BoardVerse" as Sys
participant "MoMo (giả định)" as Pay

C -> Sys : chonSanPham(ngay_bat_dau, ngay_ket_thuc, hinh_thuc_nhan)
Sys --> C : traVe(tienThue, phiShip, tienCoc)
C -> Sys : xacNhanThanhToanCoc()
Sys -> Pay : yeuCauSinhMaQR(maDon, tienCoc)
Pay --> Sys : traVe(maQR)
Sys --> C : hienThiMaQR(maQR)
Pay -> Sys : webhookThanhToan(maDon, thanhCong)
Sys --> C : xacNhanDonThue(maDon)
@enduml""")
ds.caption(doc, "Hình 3.8 – System Sequence Diagram: Đặt cọc")
ds.para(doc, "System Sequence Diagram – Hoàn cọc:", bold=True)
ds.code_block(doc, """@startuml
actor Staff as S
participant "Hệ thống BoardVerse" as Sys
actor Customer as C

S -> Sys : xacNhanKiemDem(chiTietDonId, ketQua)
Sys --> S : traVe(soTienHoanCoc, soTienConThieu)
S -> Sys : xacNhanHoanCoc()
alt soTienConThieu > 0
  Sys --> C : sinhMaQRThuThem(soTienConThieu)
else
  Sys --> C : thongBaoHoanCoc(soTienHoanCoc)
end
@enduml""")
ds.caption(doc, "Hình 3.9 – System Sequence Diagram: Hoàn cọc")
ds.para(doc, "System Sequence Diagram – Giao vận hai chiều:", bold=True)
ds.code_block(doc, """@startuml
actor Customer as C
participant "Hệ thống BoardVerse" as Sys
participant "Green SM (giả định)" as Ship

C -> Sys : chonHinhThucGiaoVan(chieu, khuVuc)
Sys --> C : traVe(phiShip)
Sys -> Ship : taoYeuCauGiaoNhan(maDon, chieu, khuVuc)
Ship --> Sys : traVe(maVanDon)
Sys --> C : xacNhanDaTaoYeuCau(maVanDon)
Ship -> Sys : webhookCapNhatTrangThai(maVanDon, trangThai)
Sys --> C : capNhatTrangThaiVanChuyen(trangThai)
@enduml""")
ds.caption(doc, "Hình 3.10 – System Sequence Diagram: Giao vận hai chiều")

# ===========================================================================
# CHUONG 4 - YEU CAU CHUC NANG
# ===========================================================================
ds.heading(doc, "4. Yêu cầu chức năng", level=1)
ds.para(doc, "Mỗi yêu cầu dưới đây chỉ thể hiện một ý, có thể kiểm thử được và trỏ về use case (UC) và yêu cầu "
             "nghiệp vụ (BR) liên quan.")

ds.heading(doc, "4.1. Quản lý Bán hàng", level=2)
ds.para(doc, "Nhóm yêu cầu phục vụ việc khách hàng xem và mua board game trực tuyến, tương ứng phân hệ Bán hàng (SC-02).")
ds.table(doc, ["Mã", "Yêu cầu", "UC", "BR/SC liên quan", "Tiêu chí chấp nhận"],
          FR_BANHANG, col_widths_cm=[2.0, 5.0, 1.8, 2.2, 4.0])

ds.heading(doc, "4.2. Quản lý Cho thuê", level=2)
ds.para(doc, "Nhóm yêu cầu cốt lõi của hệ thống, xử lý đặt thuê, tính cọc/giá thuê/phạt và hoàn cọc (SC-03, SC-04).")
ds.table(doc, ["Mã", "Yêu cầu", "UC", "BR liên quan", "Tiêu chí chấp nhận"],
          FR_CHOTHUE, col_widths_cm=[2.0, 5.0, 1.8, 2.2, 4.0])

ds.heading(doc, "4.3. Quản lý Kho", level=2)
ds.para(doc, "Nhóm yêu cầu phục vụ kiểm đếm linh kiện, quản lý trạng thái hộp game và báo cáo (SC-05, SC-07).")
ds.table(doc, ["Mã", "Yêu cầu", "UC", "BR/SC liên quan", "Tiêu chí chấp nhận"],
          FR_KHO, col_widths_cm=[2.0, 5.0, 1.8, 2.2, 4.0])

ds.heading(doc, "4.4. Quản lý Thanh toán & Giao vận", level=2)
ds.para(doc, "Nhóm yêu cầu phục vụ thanh toán trực tuyến qua mã QR và giao vận hai chiều qua đối tác bên thứ ba (SC-08, SC-09).")
ds.table(doc, ["Mã", "Yêu cầu", "UC", "BR liên quan", "Tiêu chí chấp nhận"],
          FR_TTGV, col_widths_cm=[2.3, 4.7, 2.0, 2.0, 4.0])

# ===========================================================================
# CHUONG 5 - YEU CAU GIAO DIEN BEN NGOAI
# ===========================================================================
ds.heading(doc, "5. Yêu cầu giao diện bên ngoài", level=1)

ds.heading(doc, "5.1. Giao diện người dùng", level=2)
ds.para(doc, "Quy ước chung: bố cục header cố định (logo, tìm kiếm, giỏ hàng, tài khoản), màu chủ đạo Navy "
             "#1B365D, thông báo lỗi hiển thị dạng banner đỏ phía trên form. Wireframe chi tiết đặt tại Phụ lục A.")
ds.table(doc, ["Mã màn hình", "Tên màn hình", "Actor sử dụng"], [
    ["SCR-01", "Danh sách sản phẩm", "Customer, Admin"],
    ["SCR-02", "Chi tiết sản phẩm & Đặt thuê", "Customer"],
    ["SCR-03", "Giỏ hàng / Thanh toán", "Customer"],
    ["SCR-04", "Bảng điều khiển kho (POS nội bộ)", "Staff"],
    ["SCR-05", "Báo cáo doanh thu", "Admin"],
    ["SCR-06", "Thanh toán mã QR", "Customer"],
    ["SCR-07", "Yêu cầu giao vận lấy hàng trả", "Customer"],
], col_widths_cm=[2.5, 7.0, 5.5])

ds.heading(doc, "5.2. Giao diện phần cứng", level=2)
ds.para(doc, "Không áp dụng — BoardVerse là ứng dụng web thuần tuý, không điều khiển hay kết nối trực tiếp với "
             "thiết bị/giao thức phần cứng chuyên dụng nào.")

ds.heading(doc, "5.3. Giao diện phần mềm", level=2)
ds.table(doc, ["Hệ thống ngoài", "Mục đích", "Cách giao tiếp", "Dữ liệu trao đổi", "Phiên bản"], [
    ["MoMo (giả định)", "Sinh mã QR và xác nhận thanh toán cọc/tiền hàng/thu thêm online (FR-TTGV-06, FR-TTGV-07)", "REST API qua HTTPS + Webhook", "Số tiền, mã đơn, mã QR, trạng thái thanh toán", "MoMo Payment API v1 (giả định)"],
    ["Green SM (giả định)", "Tạo yêu cầu giao/lấy hàng và nhận cập nhật trạng thái vận chuyển (FR-TTGV-03..05)", "REST API qua HTTPS + Webhook", "Mã đơn, chiều (giao/lấy), khu vực, phí ship, mã vận đơn, trạng thái vận chuyển", "Green SM Partner API v1 (giả định)"],
    ["Dịch vụ email (giả định)", "Gửi thông báo nhắc hạn trả hàng (FR-CT-08)", "SMTP API", "Địa chỉ email, nội dung thông báo", "—"],
], col_widths_cm=[3.3, 4.2, 3.0, 3.5, 2.0])

ds.heading(doc, "5.4. Giao diện truyền thông", level=2)
ds.para(doc, "Toàn bộ giao tiếp giữa trình duyệt và máy chủ sử dụng giao thức HTTP/HTTPS, định dạng dữ liệu JSON. "
             "Mọi kết nối phải qua HTTPS (TLS 1.2 trở lên); không truyền dữ liệu nhạy cảm (mật khẩu, số tiền cọc) qua HTTP thuần.")

# ===========================================================================
# CHUONG 6 - YEU CAU PHI CHUC NANG
# ===========================================================================
ds.heading(doc, "6. Yêu cầu phi chức năng", level=1)
ds.para(doc, "Mỗi yêu cầu có mã NFR-xx và được định lượng cụ thể.")

ds.heading(doc, "6.1. Hiệu năng", level=2)
ds.table(doc, ["Mã", "Yêu cầu", "Điều kiện đo"], [
    ["NFR-01", "Trang danh sách sản phẩm (SCR-01) phải tải xong trong vòng 3 giây.", "Kết nối 4G thông thường, tối đa 20 sản phẩm/trang."],
    ["NFR-02", "Hệ thống phải xử lý được tối thiểu 50 người dùng truy cập đồng thời không giảm hiệu năng rõ rệt.", "Đo bằng công cụ kiểm thử tải trên môi trường staging."],
], col_widths_cm=[1.8, 7.7, 5.5])

ds.heading(doc, "6.2. Độ tin cậy và khả dụng", level=2)
ds.table(doc, ["Mã", "Yêu cầu"], [
    ["NFR-03", "Hệ thống phải đạt tỷ lệ khả dụng tối thiểu 99% trong giờ hoạt động (8h–22h)."],
    ["NFR-04", "Khi lỗi hệ thống xảy ra, phải hiển thị thông báo lỗi thân thiện thay vì màn hình lỗi kỹ thuật (stack trace)."],
], col_widths_cm=[1.8, 13.2])

ds.heading(doc, "6.3. Bảo mật", level=2)
ds.table(doc, ["Mã", "Yêu cầu"], [
    ["NFR-05", "Mật khẩu người dùng phải được băm (hash) trước khi lưu trữ, không lưu dạng văn bản thuần."],
    ["NFR-06", "Phiên đăng nhập (session) phải tự động hết hạn sau 30 phút không hoạt động."],
    ["NFR-07", "Hệ thống phải phòng chống các lỗ hổng phổ biến theo OWASP Top 10 (SQL Injection, XSS, CSRF)."],
], col_widths_cm=[1.8, 13.2])

ds.heading(doc, "6.4. Khả năng sử dụng", level=2)
ds.para(doc, "NFR-08: Nhân viên quầy mới (chưa dùng hệ thống) phải thao tác được luồng xác nhận đơn thuê cơ bản "
             "sau tối đa 30 phút hướng dẫn, đo bằng kiểm thử người dùng trong giai đoạn UAT.")

ds.heading(doc, "6.5. Khả năng bảo trì và mở rộng", level=2)
ds.para(doc, "NFR-09: Mã nguồn phải tuân theo cấu trúc thư mục chuẩn của Next.js App Router và có ESLint cấu hình "
             "sẵn, giúp bổ sung tính năng mới (ví dụ thêm phân hệ sự kiện) mà không phải sửa đổi các module hiện có.")

ds.heading(doc, "6.6. Tính tương thích và di động", level=2)
ds.para(doc, "NFR-10: Giao diện phải hiển thị đúng (responsive) trên Chrome/Edge/Safari bản phát hành trong 2 năm "
             "gần nhất, trên màn hình từ 360px (di động) đến 1920px (desktop).")

ds.heading(doc, "6.7. Tuân thủ pháp lý và chuẩn", level=2)
ds.para(doc, "NFR-11: Hệ thống phải tuân thủ Nghị định về bảo vệ dữ liệu cá nhân hiện hành (giả định): chỉ thu "
             "thập thông tin khách hàng cần thiết (họ tên, email, SĐT) và cho phép khách yêu cầu xoá tài khoản.")

# ===========================================================================
# CHUONG 7 - YEU CAU DU LIEU
# ===========================================================================
ds.heading(doc, "7. Yêu cầu dữ liệu", level=1)

ds.heading(doc, "7.1. Từ điển dữ liệu", level=2)
ds.para(doc, "Trích từ điển dữ liệu cho 4 thực thể trung tâm (đầy đủ cho toàn bộ 11 thực thể sẽ hoàn thiện ở SDD):")
ds.table(doc, ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Ý nghĩa"], [
    ["id", "UUID", "PK, NOT NULL", "Khoá chính."],
    ["don_hang_id", "UUID", "FK → DonHang.id, NOT NULL", "Đơn thuê/mua liên quan."],
    ["san_pham_id", "UUID", "FK → SanPham.id, NOT NULL", "Sản phẩm được thuê."],
    ["ngay_bat_dau", "DATE", "NOT NULL", "Ngày bắt đầu thuê."],
    ["ngay_ket_thuc", "DATE", "NOT NULL, > ngay_bat_dau", "Ngày kết thúc thuê."],
    ["don_gia", "NUMERIC(12,0)", "NOT NULL, ≥ 0", "Tổng tiền thuê tính theo BRU-02."],
    ["hinh_thuc_nhan", "ENUM('TuDenLay','GiaoVan')", "NOT NULL, mặc định 'TuDenLay'", "Hình thức nhận hàng khách chọn lúc đặt (BR-09)."],
    ["hinh_thuc_tra", "ENUM('TuMangTra','GiaoVan')", "NULL cho đến khi đến hạn trả", "Hình thức trả hàng khách chọn lúc đến hạn (BR-09)."],
], col_widths_cm=[3.0, 3.5, 4.5, 4.0])
ds.caption(doc, "Bảng ChiTietDonHang (trích)")
ds.table(doc, ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Ý nghĩa"], [
    ["id", "UUID", "PK, NOT NULL", "Khoá chính."],
    ["don_hang_id", "UUID", "FK → DonHang.id, UNIQUE, NOT NULL", "Đơn thuê liên quan (1-1)."],
    ["so_tien", "NUMERIC(12,0)", "NOT NULL, ≥ 0", "Số tiền cọc đã thu theo BRU-01 (gồm giá niêm yết + phí ship giữ nếu có)."],
    ["phi_ship_giu", "NUMERIC(12,0)", "NOT NULL, mặc định 0", "Phần phí ship đã giữ trước trong cọc, dùng để tính chênh lệch lúc hoàn cọc (FR-TTGV-08)."],
    ["trang_thai", "ENUM('Held','Refunded','Partially_Refunded')", "NOT NULL", "Trạng thái xử lý cọc."],
    ["ngay_hoan", "DATE", "NULL", "Ngày hoàn cọc, rỗng nếu chưa hoàn."],
], col_widths_cm=[3.0, 4.5, 4.5, 3.0])
ds.caption(doc, "Bảng DatCoc (trích)")
ds.table(doc, ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Ý nghĩa"], [
    ["id", "UUID", "PK, NOT NULL", "Khoá chính."],
    ["chi_tiet_don_id", "UUID", "FK → ChiTietDonHang.id, NOT NULL", "Dòng đơn liên quan đến lượt giao vận."],
    ["chieu", "ENUM('Nhan','Tra')", "NOT NULL", "Chiều giao vận: nhận hàng hoặc trả hàng."],
    ["khu_vuc", "ENUM('NoiThanh','NgoaiThanh','NgoaiTinh')", "NOT NULL", "Khu vực tính phí theo BRU-05."],
    ["phi_ship", "NUMERIC(12,0)", "NOT NULL, ≥ 0", "Phí giao vận thực tế của lượt này, theo bảng giá BRU-05."],
    ["ma_van_don", "VARCHAR", "NULL cho đến khi tạo thành công", "Mã vận đơn trả về từ API Green SM (FR-TTGV-03/04)."],
    ["trang_thai_vanchuyen", "ENUM('DangGiao','DaGiao','DangLay','DaLay')", "NOT NULL", "Trạng thái cập nhật từ webhook Green SM (FR-TTGV-05)."],
], col_widths_cm=[3.0, 4.0, 4.5, 3.5])
ds.caption(doc, "Bảng GiaoVan (trích)")
ds.table(doc, ["Cột", "Kiểu dữ liệu", "Ràng buộc", "Ý nghĩa"], [
    ["id", "UUID", "PK, NOT NULL", "Khoá chính."],
    ["don_hang_id", "UUID", "FK → DonHang.id, NOT NULL", "Đơn hàng/đơn thuê liên quan."],
    ["so_tien", "NUMERIC(12,0)", "NOT NULL, ≥ 0", "Số tiền của khoản thanh toán."],
    ["muc_dich", "ENUM('TienHang','TienCoc','ThuThem')", "NOT NULL", "Mục đích thu tiền (FR-TTGV-06)."],
    ["trang_thai", "ENUM('ChoThanhToan','DaThanhToan','HetHieuLuc')", "NOT NULL", "Trạng thái khoản thanh toán, chỉ chuyển 'DaThanhToan' khi có webhook (BRU-06)."],
    ["ma_qr", "VARCHAR", "NULL cho đến khi sinh mã", "Nội dung/mã tham chiếu mã QR do cổng thanh toán trả về."],
], col_widths_cm=[3.0, 4.0, 4.5, 3.5])
ds.caption(doc, "Bảng ThanhToan (trích)")

ds.heading(doc, "7.2. Lưu trữ, sao lưu và lưu giữ", level=2)
ds.para(doc, "Dữ liệu giao dịch (đơn hàng, cọc, biên bản kiểm đếm) được lưu giữ tối thiểu 2 năm để phục vụ tra "
             "cứu/khiếu nại. Sao lưu toàn bộ cơ sở dữ liệu tự động hàng ngày, lưu trữ bản sao lưu trong 30 ngày gần nhất.")

ds.heading(doc, "7.3. Di chuyển dữ liệu", level=2)
ds.para(doc, "Không áp dụng đầy đủ quy trình di chuyển dữ liệu tự động — BoardVerse là hệ thống mới; dữ liệu danh "
             "mục ~500 sản phẩm từ Excel cũ được nhập lại thủ công theo yêu cầu chuyển đổi đã nêu ở BRD mục 8.5, "
             "không qua script di chuyển tự động.")

# ===========================================================================
# CHUONG 8 - CAC YEU CAU KHAC
# ===========================================================================
ds.heading(doc, "8. Các yêu cầu khác", level=1)
ds.table(doc, ["Mã", "Yêu cầu"], [
    ["OTH-01", "Hệ thống phải có tài liệu hướng dẫn sử dụng ngắn (1 trang) cho nhân viên kho/quầy."],
    ["OTH-02", "Dự án phải tổ chức tối thiểu 1 buổi đào tạo trực tiếp cho nhân viên trước go-live (khớp BRD mục 8.5)."],
    ["OTH-03", "Hệ thống phải có hướng dẫn cài đặt/chạy local trong README.md của repo GitHub."],
    ["OTH-04", "Mã nguồn phát hành dưới giấy phép mã nguồn mở MIT (phục vụ mục đích portfolio cá nhân)."],
], col_widths_cm=[2.0, 13.0], first_col_bold=True)

# ===========================================================================
# CHUONG 9 - MA TRAN TRUY VET YEU CAU
# ===========================================================================
ds.heading(doc, "9. Ma trận truy vết yêu cầu", level=1)
ds.para(doc, "Mỗi yêu cầu nghiệp vụ (BR) trong BRD_BoardVerse_v1.0 (mục 8.1) phải có ít nhất một yêu cầu chức "
             "năng (FR) tương ứng, và mỗi FR phải truy ngược được về một BR hoặc một hạng mục phạm vi (SC-xx) "
             "nếu chưa có BR trực tiếp.")
trace_rows = []
for br, text, bo, prio in pd.BUSINESS_REQUIREMENTS:
    matched = [(fr, uc) for fr, _desc, uc, ref, _ac in ALL_FR if br in ref]
    fr_codes = ", ".join(fr for fr, _ in matched) if matched else "(chưa có FR — cần rà soát)"
    uc_codes = ", ".join(sorted(set(u for _, ucs in matched for u in ucs.split(", ")))) if matched else "—"
    trace_rows.append([br, fr_codes, uc_codes])
ds.table(doc, ["BR (BRD)", "FR tương ứng (SRS)", "UC liên quan"], trace_rows, col_widths_cm=[2.5, 6.5, 6.0])

orphan_fr = [fr for fr, _d, _uc, ref, _ac in ALL_FR if not ref.startswith("BR-")]
if orphan_fr:
    ds.note(doc, "Các FR sau chưa truy về BR trực tiếp mà truy về hạng mục phạm vi (SC-xx) vì là chức năng nền "
                 f"tảng (đăng nhập, xem sản phẩm, danh mục...) không được mã hoá riêng ở BRD: {', '.join(orphan_fr)}.")
ds.para(doc, "Rà soát: không có BR nào ở trên bị \"mồ côi\" (không có FR tương ứng); bảng được cập nhật mỗi khi "
             "yêu cầu thay đổi theo quy trình ở Phụ lục C.")

# ===========================================================================
# CHUONG 10 - TIEU CHI NGHIEM THU
# ===========================================================================
ds.heading(doc, "10. Tiêu chí nghiệm thu", level=1)
ds.table(doc, ["Nhóm yêu cầu", "Phương pháp xác minh", "Ghi chú"], [
    ["FR-CT-01..08 (Cho thuê)", "Test", "Viết kịch bản kiểm thử tự động cho từng FR, đối chiếu Tiêu chí chấp nhận ở Chương 4."],
    ["FR-BH-01..05 (Bán hàng)", "Test + Demo", "Kiểm thử tự động luồng chính, trình diễn trực tiếp cho Admin."],
    ["FR-KHO-01..04 (Kho)", "Demo", "Trình diễn trực tiếp luồng kiểm đếm cho nhân viên kho trong UAT."],
    ["NFR-01, NFR-02 (Hiệu năng)", "Analysis", "Dùng công cụ đo tải (ví dụ Lighthouse, k6) trên môi trường staging."],
    ["NFR-05..07 (Bảo mật)", "Inspection", "Rà soát code và cấu hình theo checklist OWASP cơ bản."],
    ["NFR-08 (Khả năng sử dụng)", "Demo", "Quan sát nhân viên thật thao tác trong buổi UAT."],
], col_widths_cm=[4.5, 3.0, 7.5])

# ===========================================================================
# PHU LUC A, B, C
# ===========================================================================
ds.heading(doc, "Phụ lục A. Wireframe và mockup giao diện", level=1)
ds.picture(doc, DIAG + "srs_appA_wireframe_danhsach.png", width_cm=9)
ds.picture(doc, DIAG + "srs_appA_wireframe_chitiet.png", width_cm=9)
ds.picture(doc, DIAG + "srs_appA_wireframe_thanhtoan.png", width_cm=9)
ds.picture(doc, DIAG + "srs_appA_wireframe_giaovan.png", width_cm=9)
ds.note(doc, "Wireframe cho SCR-03, SCR-04, SCR-05 sẽ được hoàn thiện cùng bộ Wireframe POS/Admin ở Tài liệu thiết kế hệ thống (SDD).")

ds.heading(doc, "Phụ lục B. Danh sách vấn đề chưa rõ (TBD)", level=1)
ds.table(doc, ["Mã", "Nội dung TBD", "Người chịu trách nhiệm", "Hạn giải quyết"], [
    ["TBD-01", "Ký hợp tác chính thức và xin cấp API key với MoMo (hiện chỉ giả định mức tích hợp API, chưa có hợp đồng thật).", "Chủ đầu tư / Tác giả", "Trước khi bắt đầu Giai đoạn 3 (SDD)"],
    ["TBD-02", "Ký hợp tác chính thức và xin cấp API key với Green SM, chốt bảng giá ship chính thức theo khu vực.", "Chủ đầu tư / Tác giả", "Trước khi bắt đầu Giai đoạn 3 (SDD)"],
], col_widths_cm=[1.8, 7.2, 3.5, 3.5])
ds.note(doc, "Không có TBD nào ảnh hưởng đến yêu cầu mức Must; tài liệu vẫn đủ điều kiện Scope Freeze.")

ds.heading(doc, "Phụ lục C. Nhật ký thay đổi yêu cầu", level=1)
ds.table(doc, ["Ngày", "Yêu cầu thay đổi", "Tác động", "Người duyệt"], [["—", "Chưa có thay đổi (bản 1.0)", "—", "—"]],
          col_widths_cm=[2.5, 6.5, 4.0, 3.0])

doc.save(OUT_PATH)
print("DONE: SRS_BoardVerse_v1.0.docx")
