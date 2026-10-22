#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh BRD_BoardVerse_v1.0.docx - noi dung day du (gia dinh) theo dung khung
Template_BRD_Claude.docx (12 chuong + Phu luc A, B)."""

import os

import doc_style as ds
import project_data as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIAG = os.path.join(ROOT, "diagrams", "out") + os.sep
OUT_PATH = os.path.join(ROOT, "deliverables", "BRD_BoardVerse_v1.0.docx")

doc = ds.new_document()

ds.title_page(
    doc,
    "TÀI LIỆU YÊU CẦU NGHIỆP VỤ",
    "Business Requirements Document – BRD",
    f"Dự án: {pd.PROJECT_NAME} – Hệ thống mua bán và cho thuê board game",
    pd.AUTHOR,
    "BRD-BV-01",
)

ds.version_history(doc, [
    ["0.1", "20/09/2026", pd.AUTHOR, "Khởi tạo bản nháp, viết Chương 3-6."],
    ["0.5", "02/10/2026", pd.AUTHOR, "Hoàn thiện Chương 7-12 và Phụ lục A, B."],
    ["0.9", "10/10/2026", pd.AUTHOR, "Hoàn thiện Chương 1-2, rà soát toàn văn."],
    ["1.0", "14/10/2026", pd.AUTHOR, "Chốt phạm vi, hoàn tất trang phê duyệt, Sign-off."],
])

ds.toc_placeholder(doc)

# ===========================================================================
# CHUONG 1 - GIOI THIEU
# ===========================================================================
ds.heading(doc, "1. Giới thiệu", level=1)
ds.para(doc, f"Tài liệu này mô tả bối cảnh, mục tiêu kinh doanh, phạm vi và yêu cầu nghiệp vụ của dự án "
             f"{pd.PROJECT_NAME} — hệ thống hỗ trợ {pd.ORG_NAME} quản lý việc mua bán và cho thuê board game. "
             f"Tài liệu phục vụ việc ra quyết định đầu tư và là đầu vào cho giai đoạn đặc tả yêu cầu phần mềm.")

ds.heading(doc, "1.1. Mục đích tài liệu", level=2)
ds.para(doc, "Tài liệu này nhằm trình bày đầy đủ bối cảnh, mục tiêu kinh doanh, phạm vi dự án và các yêu cầu "
             "nghiệp vụ cốt lõi để Chủ đầu tư có cơ sở phê duyệt đầu tư xây dựng hệ thống BoardVerse. "
             "Tài liệu này đóng vai trò là đầu vào chính thức để xây dựng Tài liệu đặc tả yêu cầu phần mềm (SRS).")

ds.heading(doc, "1.2. Phạm vi tài liệu", level=2)
ds.para(doc, "Bao gồm: bối cảnh kinh doanh, mục tiêu, phạm vi dự án, các bên liên quan, giải pháp đề xuất ở mức "
             "tổng quan, yêu cầu nghiệp vụ, phân tích tài chính và rủi ro, kế hoạch triển khai tổng quan, tiêu chí "
             "nghiệm thu ở mức nghiệp vụ.")
ds.para(doc, "Không bao gồm: đặc tả kỹ thuật chi tiết (use case, mô hình dữ liệu, giao diện...) — các nội dung "
             "này thuộc Tài liệu đặc tả yêu cầu phần mềm (SRS) và Tài liệu thiết kế hệ thống (SDD).")

ds.heading(doc, "1.3. Đối tượng đọc", level=2)
ds.table(doc, ["Nhóm đọc", "Mục đích đọc", "Các mục cần đọc"], [
    ["Chủ đầu tư", "Ra quyết định phê duyệt đầu tư", "Chương 2, 4, 9, 10, 12"],
    ["Quản lý vận hành / Admin", "Hiểu quy trình nghiệp vụ mới để chuẩn bị triển khai", "Chương 3, 5, 7, 8, 11"],
    ["Đội ngũ phân tích/thiết kế SRS, SDD", "Dùng làm đầu vào đặc tả hệ thống", "Chương 5, 6, 7, 8, Phụ lục A"],
    ["Giảng viên hướng dẫn / người đánh giá đồ án", "Đánh giá tính đầy đủ của tài liệu", "Toàn bộ tài liệu"],
], col_widths_cm=[3.8, 6.0, 6.2])

ds.heading(doc, "1.4. Thuật ngữ, định nghĩa và từ viết tắt", level=2)
ds.table(doc, ["Thuật ngữ", "Giải thích"], [
    ["Admin", "Người dùng vai trò quản lý vận hành hệ thống."],
    ["BO (Business Objective)", "Mục tiêu kinh doanh của dự án, mã hoá dạng BO-xx."],
    ["BR (Business Requirement)", "Yêu cầu nghiệp vụ, mã hoá dạng BR-xx."],
    ["BRD (Business Requirements Document)", "Tài liệu yêu cầu nghiệp vụ — chính là tài liệu này."],
    ["BRU (Business Rule)", "Quy tắc nghiệp vụ, mã hoá dạng BRU-xx."],
    ["Go-live", "Thời điểm hệ thống chính thức đưa vào vận hành thay thế quy trình thủ công."],
    ["KPI (Key Performance Indicator)", "Chỉ số đo lường mức đạt được của một mục tiêu kinh doanh."],
    ["Staff", "Người dùng vai trò nhân viên kho/quầy."],
], col_widths_cm=[5.5, 10.5])

ds.heading(doc, "1.5. Cấu trúc tài liệu", level=2)
ds.bullets(doc, [
    "Chương 2 tóm tắt điều hành toàn bộ đề xuất đầu tư.",
    "Chương 3 trình bày bối cảnh và vấn đề kinh doanh hiện tại.",
    "Chương 4 nêu mục tiêu kinh doanh và tiêu chí thành công.",
    "Chương 5 xác định phạm vi dự án.",
    "Chương 6 phân tích các bên liên quan.",
    "Chương 7 trình bày giải pháp đề xuất ở mức tổng quan.",
    "Chương 8 liệt kê yêu cầu kinh doanh và quy tắc nghiệp vụ.",
    "Chương 9 phân tích tài chính.",
    "Chương 10 phân tích rủi ro.",
    "Chương 11 trình bày kế hoạch triển khai tổng quan.",
    "Chương 12 nêu tiêu chí nghiệm thu và quy trình phê duyệt.",
    "Phụ lục A là ma trận truy vết BO–BR; Phụ lục B liệt kê tài liệu bổ sung.",
])

# ===========================================================================
# CHUONG 2 - TOM TAT DIEU HANH
# ===========================================================================
ds.heading(doc, "2. Tóm tắt điều hành", level=1)
ds.para(doc,
    f"{pd.ORG_NAME} hiện quản lý hoạt động mua bán và cho thuê board game hoàn toàn thủ công bằng sổ sách, "
    "Excel và Zalo, dẫn tới 5 vấn đề cốt lõi: thất lạc linh kiện (15% lượt trả/quý), nhầm lẫn tiền cọc "
    "(3 vụ khiếu nại/tháng), trùng lịch thuê, thời gian xử lý đơn chậm (15 phút/đơn) và thiếu số liệu báo cáo.")
ds.para(doc,
    f"Dự án {pd.PROJECT_NAME} đề xuất xây dựng một hệ thống web hỗ trợ bán hàng, cho thuê board game và quản lý "
    "kho, giúp tự động hoá việc kiểm tra tồn kho, tính tiền cọc/tiền thuê/tiền phạt theo quy tắc nghiệp vụ chuẩn "
    "hoá, và cung cấp checklist kiểm đếm linh kiện điện tử.")
ds.para(doc,
    "Lợi ích kỳ vọng: giảm tỷ lệ thất lạc linh kiện xuống 5%, tăng tỷ trọng đơn thuê online lên 60%, giảm thời "
    "gian xử lý đơn xuống 3 phút, tăng 20% doanh thu cho thuê trong 12 tháng và loại bỏ khiếu nại sai lệch cọc "
    "(chi tiết Chương 4). Tổng chi phí đầu tư ước tính 78.600.000 VNĐ, chi phí vận hành khoảng 10.200.000 VNĐ/năm, "
    "thời gian hoàn vốn dự kiến khoảng 12,8 tháng (chi tiết Chương 9).")
ds.para(doc,
    "Thời gian triển khai dự kiến tối đa 6 tháng kể từ khi BRD được phê duyệt. Tài liệu này đề nghị Chủ đầu tư "
    "phê duyệt phạm vi và ngân sách tại Chương 12 để nhóm dự án tiếp tục xây dựng Tài liệu đặc tả yêu cầu phần mềm (SRS).")

# ===========================================================================
# CHUONG 3 - BOI CANH VA CO HOI KINH DOANH
# ===========================================================================
ds.heading(doc, "3. Bối cảnh và cơ hội kinh doanh", level=1)
ds.para(doc, f"{pd.ORG_NAME} đang gặp nhiều vấn đề trong vận hành do phụ thuộc hoàn toàn vào quy trình thủ công: "
             "quy trình không đồng nhất, dữ liệu rời rạc, mất nhiều thời gian xử lý đơn và dễ xảy ra sai sót.")

ds.heading(doc, "3.1. Tổng quan tổ chức và bối cảnh", level=2)
ds.para(doc, pd.ORG_OVERVIEW)

ds.heading(doc, "3.2. Vấn đề hoặc cơ hội kinh doanh", level=2)
ds.para(doc,
    "Do toàn bộ quy trình bán hàng, cho thuê và quản lý kho hiện dựa vào sổ sách, Excel và Zalo, nhân viên không "
    "có công cụ kiểm tra tồn kho theo thời gian thực và không có checklist kiểm đếm linh kiện chuẩn hoá. Hệ quả "
    "là trung bình 15% lượt trả hàng mỗi quý bị thiếu linh kiện, 3 vụ khiếu nại sai lệch tiền cọc mỗi tháng, và "
    "nhân viên mất khoảng 15 phút để xử lý một đơn thuê. Nếu không giải quyết, cửa hàng tiếp tục mất chi phí mua "
    "bổ sung linh kiện, giảm uy tín với khách hàng nhóm/sự kiện (vốn thuê số lượng lớn) và bỏ lỡ cơ hội mở rộng "
    "doanh thu qua kênh online.")

ds.heading(doc, "3.3. Hiện trạng quy trình (As-Is)", level=2)
ds.para(doc, "Quy trình thuê/trả board game hiện tại gồm các bước thủ công từ lúc khách hỏi tình trạng sản phẩm "
             "đến lúc hoàn cọc, được mô tả tại Hình 3.1 (mã PlantUML, tác giả tự vẽ lại bằng draw.io).")
ds.code_block(doc, """@startuml
start
:Khách hỏi tình trạng game qua điện thoại/Zalo;
:Nhân viên tra sổ/Excel thủ công để kiểm tra tồn kho;
if (Còn hàng đúng ngày khách cần?) then (Không)
  :Báo khách hết hàng / hẹn lại;
  stop
else (Có)
  :Khách đến quầy, chọn game, nộp cọc tiền mặt;
endif
:Nhân viên ghi tay thông tin thuê và số cọc vào sổ;
:Giao game cho khách, khách mang về sử dụng;
:Khách mang trả game đúng/trễ hạn;
:Nhân viên kiểm đếm linh kiện bằng mắt, không checklist;
if (Đủ linh kiện, đúng hạn?) then (Không)
  :Ghi biên bản đền bù / phạt trễ hạn bằng tay;
else (Có / sau khi đền bù)
endif
:Hoàn cọc còn lại bằng tiền mặt, không có phiếu xác nhận;
stop
@enduml""")
ds.caption(doc, "Hình 3.1 – Quy trình thuê/trả board game hiện tại (As-Is)")
ds.para(doc, "Tổng hợp các điểm đau (pain points) ghi nhận được từ quy trình As-Is:", bold=True)
ds.table(doc, ["Mã", "Điểm đau", "Mô tả", "Mức ảnh hưởng"],
          [[c, t, d, m] for c, t, d, m in pd.PAIN_POINTS], col_widths_cm=[1.8, 5.0, 7.5, 2.2])

ds.heading(doc, "3.4. Phân tích nguyên nhân gốc", level=2)
ds.para(doc, "Áp dụng sơ đồ xương cá (Fishbone) để phân tích nguyên nhân gốc của nhóm vấn đề "
             "\"thất lạc linh kiện & nhầm lẫn tiền cọc\" (Hình 3.2):")
ds.picture(doc, DIAG + "brd_3_4_fishbone.png", width_cm=15, cap="Hình 3.2 – Sơ đồ xương cá nguyên nhân gốc")
ds.para(doc, "Kết luận: nguyên nhân gốc tập trung ở việc thiếu công cụ số hoá (checklist điện tử, kiểm tra trùng "
             "lịch tự động, mã tra cứu cọc) chứ không phải do năng lực nhân viên; do đó giải pháp công nghệ ở "
             "Chương 7 có thể giải quyết trực tiếp phần lớn nguyên nhân này.")

ds.heading(doc, "3.5. Đối thủ và thực tiễn tham chiếu (nếu có)", level=2)
ds.table(doc, ["Đơn vị tham chiếu (giả định)", "Cách giải quyết vấn đề tương tự", "Nhận xét"], [
    ["Chuỗi cho thuê board game X (TP.HCM)", "Dùng phần mềm quản lý thuê có sẵn, tính tiền tự động, quét mã QR kiểm kê.", "Giảm sai sót kiểm đếm nhưng chi phí thuê bao phần mềm cao, không tuỳ biến quy tắc giá riêng."],
    ["Quán cà phê board game Y", "Vẫn quản lý thủ công bằng sổ nhưng giới hạn số lượng game cho thuê để dễ kiểm soát.", "Không phù hợp khi mở rộng quy mô như BoardVerse."],
], col_widths_cm=[4.5, 7.0, 4.5])

# ===========================================================================
# CHUONG 4
# ===========================================================================
ds.heading(doc, "4. Mục tiêu kinh doanh và tiêu chí thành công", level=1)
ds.para(doc, "Mọi mục tiêu dưới đây đều đo được và sẽ được dùng làm căn cứ nghiệm thu dự án tại Chương 12.")

ds.heading(doc, "4.1. Mục tiêu kinh doanh", level=2)
ds.table(doc, ["Mã", "Mục tiêu (SMART)", "Pain point liên quan"],
          [[b, o, p] for b, o, p in pd.BUSINESS_OBJECTIVES], col_widths_cm=[1.8, 11.5, 2.7], first_col_bold=True)

ds.heading(doc, "4.2. Chỉ số đo lường (KPI)", level=2)
ds.table(doc, ["BO liên quan", "Chỉ số KPI", "Baseline", "Mục tiêu", "Cách đo", "Tần suất"],
          pd.KPIS, col_widths_cm=[1.8, 4.5, 2.5, 2.5, 4.0, 1.7])

ds.heading(doc, "4.3. Tiêu chí thành công", level=2)
ds.para(doc, "Thành công của dự án:", bold=True)
ds.bullets(doc, [
    "☐ Dự án go-live trong vòng 6 tháng kể từ khi BRD được Sign-off (Đạt/Không đạt).",
    "☐ Tổng chi phí thực tế không vượt quá 90.000.000 VNĐ (Đạt/Không đạt).",
])
ds.para(doc, "Thành công của sản phẩm:", bold=True)
ds.bullets(doc, [f"☐ Đạt mục tiêu {b}: {o.split(',')[0]}... (Đạt/Không đạt)." for b, o, _ in pd.BUSINESS_OBJECTIVES])

# ===========================================================================
# CHUONG 5
# ===========================================================================
ds.heading(doc, "5. Phạm vi dự án", level=1)
ds.para(doc, "Phạm vi được xác định rõ để tránh phình phạm vi (scope creep) trong các giai đoạn tiếp theo.")

ds.heading(doc, "5.1. Trong phạm vi", level=2)
ds.table(doc, ["Mã", "Hạng mục trong phạm vi"], pd.IN_SCOPE, col_widths_cm=[2.0, 13.0], first_col_bold=True)

ds.heading(doc, "5.2. Ngoài phạm vi", level=2)
ds.table(doc, ["Mã", "Hạng mục ngoài phạm vi", "Lý do loại trừ"],
          pd.OUT_OF_SCOPE, col_widths_cm=[1.8, 5.0, 8.2], first_col_bold=True)

ds.heading(doc, "5.3. Giả định", level=2)
ds.table(doc, ["Mã", "Giả định", "Hậu quả nếu sai", "Người xác nhận"],
          pd.ASSUMPTIONS, col_widths_cm=[1.8, 5.5, 5.0, 2.7], first_col_bold=True)

ds.heading(doc, "5.4. Ràng buộc", level=2)
ds.table(doc, ["Mã", "Ràng buộc"], pd.CONSTRAINTS, col_widths_cm=[2.0, 13.0], first_col_bold=True)

ds.heading(doc, "5.5. Phụ thuộc", level=2)
ds.table(doc, ["Mã", "Bên cung cấp", "Nội dung phụ thuộc", "Hạn chót"],
          pd.DEPENDENCIES, col_widths_cm=[1.8, 4.0, 6.5, 2.7], first_col_bold=True)

# ===========================================================================
# CHUONG 6
# ===========================================================================
ds.heading(doc, "6. Các bên liên quan", level=1)
ds.para(doc, "Chương này xác định ai bị ảnh hưởng, ai ra quyết định và ai cần tham gia trong suốt dự án.")

ds.heading(doc, "6.1. Danh sách bên liên quan", level=2)
ds.table(doc, ["Bên liên quan", "Trong/Ngoài tổ chức", "Mối quan tâm"],
          pd.STAKEHOLDERS, col_widths_cm=[4.5, 3.0, 7.5])

ds.heading(doc, "6.2. Vai trò và trách nhiệm (RACI)", level=2)
ds.table(doc, ["Hoạt động / Sản phẩm bàn giao", "Chủ đầu tư", "Quản lý vận hành", "Nhân viên kho/quầy", "BA (tác giả)", "PM / Dev / Designer"], [
    ["Phê duyệt BRD", "A", "C", "I", "R", "I"],
    ["Xác nhận quy trình nghiệp vụ (As-Is/To-Be)", "I", "A", "C", "R", "I"],
    ["Xây dựng Business Rules Catalog", "C", "A", "C", "R", "I"],
    ["Thiết kế & lập trình hệ thống", "I", "I", "I", "C", "R/A"],
    ["Đào tạo sử dụng hệ thống", "I", "A", "R", "R", "C"],
    ["Nghiệm thu UAT", "I", "A", "R", "C", "C"],
    ["Phê duyệt go-live", "A", "R", "I", "C", "C"],
], col_widths_cm=[4.5, 2.0, 2.2, 2.2, 2.2, 2.5])

# ===========================================================================
# CHUONG 7
# ===========================================================================
ds.heading(doc, "7. Giải pháp đề xuất (mức tổng quan)", level=1)
ds.para(doc, "Giải pháp được trình bày ở mức nghiệp vụ, chưa đi vào công nghệ cụ thể (phần này thuộc Tài liệu thiết kế hệ thống).")

ds.heading(doc, "7.1. Mô tả giải pháp", level=2)
sol_map = [
    ("PP-01", "Cung cấp checklist linh kiện điện tử theo từng tựa game, bắt buộc nhân viên kiểm đếm và xác nhận khi xuất/nhập kho."),
    ("PP-02", "Mọi khoản cọc được ghi nhận trong hệ thống với mã đơn tra cứu được, loại bỏ việc ghi tay vào sổ."),
    ("PP-03", "Hệ thống tự động kiểm tra tồn kho theo khoảng ngày thuê trước khi xác nhận đơn, ngăn trùng lịch."),
    ("PP-04", "Tự động hoá tính giá thuê theo quy tắc lũy tiến và tính cọc, giảm thao tác tính tay của nhân viên."),
    ("PP-05", "Hệ thống tổng hợp báo cáo doanh thu theo thời gian thực từ dữ liệu giao dịch, không cần cộng tay Excel."),
]
for pp_code, desc in sol_map:
    pp = next(p for p in pd.PAIN_POINTS if p[0] == pp_code)
    ds.para(doc, f"{pp_code} – {pp[1]}: {desc}")

ds.heading(doc, "7.2. Quy trình nghiệp vụ mong muốn (To-Be)", level=2)
ds.code_block(doc, """@startuml
start
:Khách xem tồn kho thời gian thực trên website;
:Khách chọn ngày thuê, hệ thống tự kiểm tra trùng lịch;
if (Sản phẩm còn trống đúng khoảng ngày chọn?) then (Không)
  :Hệ thống gợi ý sản phẩm khác/ngày khác;
  stop
else (Có)
  :Khách đặt thuê & thanh toán cọc online (BRU-01);
endif
:Hệ thống tự tính tiền thuê theo biểu giá lũy tiến (BRU-02);
:Nhân viên xác nhận đơn và xuất kho trên hệ thống;
:Hệ thống tự nhắc hạn trả trước ngày hết hạn (BR-06);
:Khách trả hàng, nhân viên kiểm đếm theo checklist điện tử;
if (Đủ linh kiện, đúng hạn?) then (Không)
  :Hệ thống tự tính phạt trễ hạn/đền bù (BRU-03, BRU-04);
else (Có / sau khi tính phạt)
endif
:Hệ thống tự tính và thực hiện hoàn cọc, gửi phiếu xác nhận;
stop
@enduml""")
ds.caption(doc, "Hình 7.1 – Quy trình thuê/trả board game với hệ thống BoardVerse (To-Be)")
ds.para(doc, "Bảng so sánh As-Is và To-Be:", bold=True)
ds.table(doc, ["Tiêu chí", "As-Is (hiện tại)", "To-Be (với BoardVerse)"], [
    ["Kiểm tra tồn kho", "Tra sổ/Excel thủ công, dễ trùng lịch", "Kiểm tra tự động theo thời gian thực"],
    ["Tính tiền cọc/thuê", "Tính tay, dễ sai", "Tự động theo BRU-01, BRU-02"],
    ["Kiểm đếm linh kiện", "Bằng mắt, không checklist", "Checklist điện tử bắt buộc theo từng game"],
    ["Hoàn cọc/phạt trễ hạn", "Ghi tay, không phiếu xác nhận", "Tự động theo BRU-03, BRU-04, có phiếu điện tử"],
    ["Thời gian xử lý 1 đơn", "~15 phút", "Mục tiêu ≤ 3 phút"],
], col_widths_cm=[3.5, 5.5, 6.0])

ds.heading(doc, "7.3. Các phương án đã cân nhắc", level=2)
ds.table(doc, ["Phương án", "Ưu điểm", "Nhược điểm", "Kết luận"], [
    ["Không làm gì (giữ nguyên thủ công)", "Không tốn chi phí đầu tư", "Vấn đề PP-01..PP-05 tiếp tục kéo dài, mất cơ hội tăng doanh thu", "Không chọn"],
    ["Mua phần mềm quản lý cho thuê có sẵn trên thị trường", "Triển khai nhanh", "Chi phí thuê bao dài hạn cao, không tuỳ biến quy tắc giá riêng (BRU-01..06)", "Không chọn"],
    ["Tự xây dựng hệ thống riêng (BoardVerse)", "Tuỳ biến đúng quy tắc nghiệp vụ, chi phí một lần thấp hơn về dài hạn, phù hợp mục tiêu học tập/portfolio", "Cần thời gian phát triển ban đầu", "Chọn phương án này"],
], col_widths_cm=[4.3, 4.3, 5.0, 1.4])

# ===========================================================================
# CHUONG 8
# ===========================================================================
ds.heading(doc, "8. Yêu cầu kinh doanh", level=1)
ds.para(doc, "Mọi yêu cầu trong chương này là đầu vào trực tiếp để xây dựng Tài liệu đặc tả yêu cầu phần mềm (SRS).")

ds.heading(doc, "8.1. Yêu cầu nghiệp vụ (BR)", level=2)
ds.table(doc, ["Mã", "Yêu cầu nghiệp vụ", "BO liên quan", "Ưu tiên (MoSCoW)"],
          pd.BUSINESS_REQUIREMENTS, col_widths_cm=[1.6, 9.0, 2.4, 2.0], first_col_bold=True)

ds.heading(doc, "8.2. Quy tắc nghiệp vụ", level=2)
for code, name, rule, basis, br in pd.BUSINESS_RULES:
    ds.para(doc, f"{code} – {name}", bold=True)
    ds.para(doc, rule)
    ds.para(doc, f"Căn cứ: {basis}  |  Yêu cầu liên quan: {br}", italic=True, size=9.5, color=ds.GREY)
ds.para(doc, "Bảng tổng hợp quy tắc nghiệp vụ (Catalog):", bold=True)
ds.table(doc, ["Mã", "Tên quy tắc", "Yêu cầu BR liên quan"],
          [[c, n, br] for c, n, r, b, br in pd.BUSINESS_RULES], col_widths_cm=[2.0, 7.0, 6.0], first_col_bold=True)

ds.heading(doc, "8.3. Nhóm người dùng và nhu cầu chính", level=2)
ds.table(doc, ["Nhóm người dùng", "Nhu cầu chính", "BR liên quan"],
          pd.USER_GROUPS_BUSINESS, col_widths_cm=[4.0, 8.0, 3.0])

ds.heading(doc, "8.4. Yêu cầu phi chức năng ở mức nghiệp vụ", level=2)
ds.table(doc, ["Khía cạnh", "Kỳ vọng"], pd.NFR_BUSINESS, col_widths_cm=[3.5, 11.5])

ds.heading(doc, "8.5. Yêu cầu chuyển đổi và triển khai", level=2)
ds.table(doc, ["Hạng mục", "Nội dung", "Người phụ trách", "Điều kiện hoàn thành"],
          pd.TRANSITION_REQUIREMENTS, col_widths_cm=[2.8, 5.5, 3.0, 3.7])

# ===========================================================================
# CHUONG 9
# ===========================================================================
ds.heading(doc, "9. Phân tích tài chính", level=1)
ds.para(doc, "Toàn bộ số liệu tài chính là giả định của tác giả, dùng VNĐ, phân tích theo kỳ năm.")

ds.heading(doc, "9.1. Chi phí", level=2)
ds.para(doc, "Chi phí một lần (đầu tư ban đầu):", bold=True)
ds.table(doc, ["Hạng mục", "Chi phí", "Cách ước tính / giả định"], pd.COSTS_ONE_TIME, col_widths_cm=[5.0, 3.0, 7.0])
ds.para(doc, "Tổng chi phí một lần: 78.600.000 VNĐ", bold=True)
ds.para(doc, "Chi phí định kỳ (vận hành hàng năm):", bold=True)
ds.table(doc, ["Hạng mục", "Chi phí/năm", "Cách ước tính / giả định"], pd.COSTS_RECURRING_YEARLY, col_widths_cm=[5.0, 3.0, 7.0])
ds.para(doc, "Tổng chi phí vận hành: 10.200.000 VNĐ/năm", bold=True)

ds.heading(doc, "9.2. Lợi ích", level=2)
ds.table(doc, ["Lợi ích", "Loại", "Quy đổi/năm"], [
    ["Tăng 20% doanh thu cho thuê (BO-04)", "Hữu hình", "+72.000.000 VNĐ/năm (nền 360.000.000 VNĐ/năm)"],
    ["Giảm thất thoát do mất linh kiện (BO-01)", "Hữu hình", "+6.000.000 VNĐ/năm"],
    ["Giảm giờ công xử lý đơn và báo cáo thủ công (BO-03, BO-05)", "Hữu hình", "+6.000.000 VNĐ/năm"],
    ["Nâng cao uy tín với khách nhóm/sự kiện nhờ minh bạch tiền cọc (BO-05)", "Vô hình", "Không quy đổi — tăng khả năng giữ chân khách hàng nhóm"],
], col_widths_cm=[7.0, 2.5, 5.5])

ds.heading(doc, "9.3. Hiệu quả đầu tư", level=2)
ds.para(doc, "Công thức: ROI = (Lợi ích ròng năm 1 − Chi phí đầu tư) ÷ Chi phí đầu tư. "
             "Thời gian hoàn vốn = Chi phí đầu tư ÷ Lợi ích ròng mỗi năm. NPV tính với tỷ lệ chiết khấu giả định 10%/năm, kỳ phân tích 2 năm.")
ds.table(doc, ["Chỉ tiêu", "Giá trị"], [
    ["Tổng lợi ích năm 1", "84.000.000 VNĐ"],
    ["Chi phí vận hành năm 1", "10.200.000 VNĐ"],
    ["Lợi ích ròng năm 1", "73.800.000 VNĐ"],
    ["Chi phí đầu tư ban đầu", "78.600.000 VNĐ"],
    ["Thời gian hoàn vốn (Payback period)", "≈ 12,8 tháng"],
    ["ROI năm 1", "≈ -6,1%"],
    ["NPV (2 năm, chiết khấu 10%/năm)", "≈ +49.480.000 VNĐ"],
], col_widths_cm=[8.0, 7.0], first_col_bold=True)
ds.para(doc, "Diễn giải: ROI năm 1 âm vì chi phí đầu tư ban đầu chưa được thu hồi hết trong năm đầu, nhưng thời gian "
             "hoàn vốn khoảng 12,8 tháng (dưới 13 tháng) và NPV 2 năm dương cho thấy dự án vẫn đáng đầu tư về mặt tài "
             "chính trong kịch bản giả định này.")

# ===========================================================================
# CHUONG 10
# ===========================================================================
ds.heading(doc, "10. Phân tích rủi ro", level=1)
ds.para(doc, "Phân tích ở cấp độ dự án, không đi sâu rủi ro kỹ thuật chi tiết (thuộc phạm vi SDD).")

ds.heading(doc, "10.1. Đánh giá rủi ro", level=2)
ds.table(doc, ["Mã", "Nếu... thì...", "Xác suất", "Tác động", "Biện pháp ứng phó"],
          pd.RISKS, col_widths_cm=[1.8, 6.5, 2.2, 2.2, 4.3], first_col_bold=True)

ds.heading(doc, "10.2. Kế hoạch dự phòng cho rủi ro mức cao", level=2)
high_risks = [r for r in pd.RISKS if r[3] == "Cao" or r[2] == "Cao"]
for code, desc, prob, impact, mitigation in high_risks:
    ds.para(doc, f"{code}: {desc}", bold=True)
    ds.para(doc, f"Dấu hiệu nhận biết: tỷ lệ/ số vụ liên quan tăng bất thường so với baseline ở Chương 4. "
                 f"Hành động: {mitigation} Người quyết định: Quản lý vận hành.")

# ===========================================================================
# CHUONG 11
# ===========================================================================
ds.heading(doc, "11. Kế hoạch triển khai tổng quan", level=1)
ds.para(doc, "Kế hoạch chi tiết (WBS) được quản lý riêng trong \"Kế_Hoạch_Chi_Tiết_Checklist_BoardVerse.docx\"; "
             "chương này chỉ nêu các mốc lớn.")

ds.heading(doc, "11.1. Giai đoạn và cột mốc", level=2)
ds.table(doc, ["Giai đoạn", "Sản phẩm bàn giao", "Thời lượng ước tính"], [
    ["1. Tài liệu yêu cầu nghiệp vụ (BRD)", "BRD_BoardVerse_v1.0.docx đã Sign-off", "3 tuần"],
    ["2. Tài liệu đặc tả yêu cầu phần mềm (SRS)", "SRS_BoardVerse_v1.0.docx đã Scope Freeze", "3 tuần"],
    ["3. Tài liệu thiết kế hệ thống (SDD)", "SDD_BoardVerse_v1.0.docx đã phê duyệt kỹ thuật", "2 tuần"],
    ["4. Lập trình hệ thống (Development)", "Hệ thống hoàn thiện theo đặc tả SDD, sẵn sàng kiểm thử", "6 tuần"],
    ["5. Kiểm thử hệ thống & UAT", "Biên bản kiểm thử và biên bản nghiệm thu UAT đã ký", "2 tuần"],
    ["6. Triển khai & đào tạo (Go-live)", "Hệ thống vận hành chính thức thay quy trình thủ công, nhân sự đã đào tạo", "1 tuần"],
], col_widths_cm=[6.0, 6.5, 3.0])

ds.heading(doc, "11.2. Nguồn lực", level=2)
ds.table(doc, ["Vai trò", "Số lượng", "Ghi chú"], [
    ["Business Analyst (tác giả)", "1", "Tác giả đồ án, phụ trách toàn bộ phân tích nghiệp vụ và soạn tài liệu BRD/SRS/SDD."],
    ["Project Manager (giả định)", "1", "Điều phối tiến độ, ngân sách và rủi ro dự án."],
    ["Product Owner (giả định)", "1", "Đại diện quyết định ưu tiên nghiệp vụ, phê duyệt backlog ở các giai đoạn sau."],
    ["Developer (giả định)", "1", "Lập trình hệ thống theo đặc tả SRS/SDD."],
    ["UI/UX Designer (giả định)", "1", "Thiết kế wireframe, mockup giao diện."],
    ["Ngân sách", "78.600.000 VNĐ (một lần) + 10.200.000 VNĐ/năm", "Khớp mục 9.1."],
    ["Công cụ/hạ tầng", "Next.js, Prisma, PostgreSQL, Vercel, GitHub", "Chi tiết tại Tài liệu thiết kế hệ thống (SDD)."],
], col_widths_cm=[6.0, 5.0, 4.5])

ds.heading(doc, "11.3. Quản lý thay đổi và truyền thông", level=2)
ds.para(doc, "Áp dụng chiến lược giao tiếp theo từng nhóm bên liên quan (Chương 6): báo cáo tiến độ hàng tuần cho "
             "Chủ đầu tư/Quản lý vận hành; tổ chức 1 buổi đào tạo trực tiếp cho nhân viên kho/quầy trước go-live; "
             "thông báo thay đổi chính sách giá cho khách qua trang web.")

# ===========================================================================
# CHUONG 12
# ===========================================================================
ds.heading(doc, "12. Tiêu chí nghiệm thu và phê duyệt", level=1)

ds.heading(doc, "12.1. Tiêu chí nghiệm thu", level=2)
ds.table(doc, ["Tiêu chí", "BR/KPI liên quan", "Người nghiệm thu"], [
    ["Hệ thống tính đúng tiền cọc/thuê/phạt theo BRU-01..04 trên tối thiểu 10 kịch bản kiểm thử", "BR-02, BR-04", "Quản lý vận hành"],
    ["Hệ thống chặn được 100% các lượt đặt thuê trùng lịch trong kiểm thử", "BR-05", "Quản lý vận hành"],
    ["Checklist kiểm đếm linh kiện khả dụng cho toàn bộ 5 tựa game mẫu", "BR-03", "Nhân viên kho/quầy"],
    ["Hệ thống tính đúng phí giao vận theo khu vực (BRU-05) và số tiền cọc có cộng ship (BRU-01) trên tối thiểu 6 kịch bản kiểm thử", "BR-09", "Quản lý vận hành"],
    ["Hệ thống chỉ xác nhận đơn đã thanh toán sau khi nhận webhook thành công từ cổng thanh toán giả định (BRU-06)", "BR-10", "Quản lý vận hành"],
    ["Thời gian xử lý 1 đơn thuê mẫu tại quầy ≤ 3 phút", "BO-03 / KPI tương ứng", "Quản lý vận hành"],
], col_widths_cm=[7.5, 3.5, 4.0])

ds.heading(doc, "12.2. Quy trình thay đổi yêu cầu", level=2)
ds.numbered(doc, [
    "Bên đề xuất (Chủ đầu tư, Quản lý vận hành hoặc đội dự án) gửi yêu cầu thay đổi bằng văn bản/email.",
    "BA (tác giả) đánh giá tác động đến phạm vi, chi phí, thời gian và các mục tiêu BO-xx liên quan.",
    "Chủ đầu tư phê duyệt hoặc từ chối thay đổi dựa trên đánh giá tác động.",
    "Nếu được duyệt, tài liệu BRD được cập nhật, tăng số phiên bản và ghi vào Lịch sử phiên bản.",
])

ds.heading(doc, "12.3. Phê duyệt tài liệu", level=2)
ds.para(doc, "Tài liệu này được xem là chính thức phê duyệt (Sign-off) khi có đầy đủ xác nhận của các vai trò dưới đây.")
ds.sign_off_table(doc, pd.APPROVERS)

# ===========================================================================
# PHU LUC A, B
# ===========================================================================
ds.heading(doc, "Phụ lục A. Ma trận truy vết sơ bộ BO – BR", level=1)
trace_rows = []
for bo, obj, _pp in pd.BUSINESS_OBJECTIVES:
    related = [br for br, _txt, bos, _prio in pd.BUSINESS_REQUIREMENTS if bo in bos]
    trace_rows.append([bo, ", ".join(related) if related else "(chưa có BR trực tiếp)"])
ds.table(doc, ["Mục tiêu kinh doanh (BO)", "Yêu cầu nghiệp vụ (BR) truy vết"], trace_rows, col_widths_cm=[4.0, 11.0])

ds.heading(doc, "Phụ lục B. Tài liệu bổ sung", level=1)
ds.table(doc, ["Tài liệu", "Nguồn", "Dùng ở mục"], [
    ["Bảng giá bán/thuê 5 tựa game mẫu", "Giả định của tác giả", "Mục 9.1, 9.2; dùng lại ở SDD (seed data)"],
    ["Biên bản khảo sát hiện trạng (giả định)", "Giả định của tác giả, thay thế Phụ lục phỏng vấn thực tế", "Mục 3.3"],
    ["Sổ tay quy tắc nghiệp vụ nội bộ (giả định)", "Giả định của tác giả", "Mục 8.2"],
], col_widths_cm=[5.5, 5.5, 4.0])

doc.save(OUT_PATH)
print("DONE: BRD_BoardVerse_v1.0.docx")
