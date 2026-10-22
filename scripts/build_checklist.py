#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh file Word "Ke_Hoach_Chi_Tiet_Checklist_BoardVerse.docx"
Bang kiem tien do chi tiet (Master Checklist / Granular WBS) cho do an BoardVerse.
"""

import itertools
import os

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = RGBColor(0x1B, 0x36, 0x5D)
NAVY_HEX = "1B365D"
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ZEBRA_HEX = "EEF2F7"
HEADER_BG = "1B365D"
CALLOUT_BG = "EAF0F8"
CALLOUT_BORDER = "1B365D"
GRID_BORDER_HEX = "B9C4D4"

_id_counter = itertools.count(100001)


# --------------------------------------------------------------------------
# Du lieu WBS - 5 giai doan, moi viec = (Ma viec, Noi dung chi tiet, San pham dau ra, Trang thai)
# --------------------------------------------------------------------------

PHASE_1 = {
    "title": "GIAI ĐOẠN 1 — CUỐN 1: TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BRD)",
    "subtitle": "Điền theo đúng thứ tự khuyến nghị của Template_BRD_Claude.docx: Chương 3→4→5→6→7→8→9→10→11→12→Phụ lục A→Phụ lục B→Chương 1→Chương 2. Đầu ra cuối giai đoạn: \"BRD_BoardVerse_v1.0.docx\" đã Sign-off.",
    "tasks": [
        ("BRD-01", "Dựng bối cảnh giả định: mô tả cửa hàng/chuỗi mua bán & cho thuê board game (quy mô, thị trường, khách hàng chính).", "Mục 3.1", "Đoạn Tổng quan tổ chức và bối cảnh", "Chưa làm"),
        ("BRD-02", "Soạn Tuyên bố vấn đề/cơ hội kinh doanh theo chuỗi: hiện tượng — ảnh hưởng — đối tượng chịu ảnh hưởng — hậu quả nếu không giải quyết (chưa nêu giải pháp/công nghệ).", "Mục 3.2", "Đoạn Vấn đề hoặc cơ hội kinh doanh", "Chưa làm"),
        ("BRD-03", "Khảo sát thực trạng quản lý thủ công giả định (ghi sổ/Excel/Zalo), nhận diện các lỗi thất lạc linh kiện, nhầm lẫn tiền cọc; tổng hợp thành danh sách Pain Points phân loại theo mức ảnh hưởng (cao/trung/thấp).", "Mục 3.3", "Bảng danh sách Pain Points", "Chưa làm"),
        ("BRD-04", "Vẽ sơ đồ quy trình nghiệp vụ Hiện tại (As-Is) — luồng thuê/trả board game bằng sổ sách, Excel thủ công, đặt tên \"Hình 3.1\".", "Mục 3.3", "Sơ đồ As-Is (Flowchart)", "Chưa làm"),
        ("BRD-05", "Phân tích nguyên nhân gốc của từng Pain Point ở mục 3.3 (dùng 5 Whys hoặc sơ đồ xương cá Fishbone), chèn hình minh hoạ và viết đoạn kết luận.", "Mục 3.4", "Sơ đồ nguyên nhân gốc + đoạn kết luận", "Chưa làm"),
        ("BRD-06", "So sánh ngắn cách 2-3 đơn vị kinh doanh board game khác xử lý vấn đề tương tự bằng bảng tiêu chí (hoặc ghi \"Không áp dụng\" kèm lý do nếu không có đối chiếu thật).", "Mục 3.5", "Bảng đối thủ/thực tiễn tham chiếu", "Chưa làm"),
        ("BRD-07", "Xác định 3-5 mục tiêu kinh doanh theo chuẩn SMART, mã BO-xx, mỗi mục tiêu trỏ về vấn đề đã nêu ở mục 3.2.", "Mục 4.1", "Bảng mục tiêu SMART (BO-xx)", "Chưa làm"),
        ("BRD-08", "Xây dựng bảng KPI đo lường, mỗi KPI trỏ về một BO-xx, có baseline, giá trị mục tiêu, cách đo và tần suất đo.", "Mục 4.2", "Bảng KPI kinh doanh", "Chưa làm"),
        ("BRD-09", "Soạn Tiêu chí thành công, tách 2 nhóm: thành công của dự án (đúng hạn, đúng ngân sách) và thành công của sản phẩm (đạt KPI), dạng danh sách kiểm tra Đạt/Không đạt.", "Mục 4.3", "Danh sách tiêu chí thành công", "Chưa làm"),
        ("BRD-10", "Khoanh vùng nghiệp vụ Trong phạm vi (In-Scope): bán board game, cho thuê theo ngày, quản lý kho, quản lý cọc, hoàn cọc — mã SC-xx.", "Mục 5.1", "Danh sách In-Scope (SC-xx)", "Chưa làm"),
        ("BRD-11", "Khoanh vùng nghiệp vụ Ngoài phạm vi (Out-of-Scope): vận chuyển tận nhà, bảo hiểm sản phẩm, thanh toán quốc tế, bán sỉ — kèm lý do loại trừ cho từng mục.", "Mục 5.2", "Danh sách Out-of-Scope kèm lý do", "Chưa làm"),
        ("BRD-12", "Liệt kê Giả định của dự án; mỗi giả định nêu rõ hậu quả nếu nó sai và ai chịu trách nhiệm xác nhận.", "Mục 5.3", "Danh sách Giả định", "Chưa làm"),
        ("BRD-13", "Liệt kê Ràng buộc (ngân sách, thời gian, nhân lực, pháp lý, công nghệ), mỗi ràng buộc là một câu khẳng định kiểm tra được.", "Mục 5.4", "Danh sách Ràng buộc", "Chưa làm"),
        ("BRD-14", "Liệt kê Phụ thuộc của dự án; mỗi phụ thuộc nêu bên cung cấp, thứ cần cung cấp, hạn chót cần có.", "Mục 5.5", "Danh sách Phụ thuộc", "Chưa làm"),
        ("BRD-15", "Lập danh sách Stakeholders liên quan dự án (Khách cá nhân, Khách nhóm, Nhân viên kho/quầy, Admin, Chủ đầu tư/Quản lý), cột \"Mối quan tâm\" ghi rõ họ muốn gì.", "Mục 6.1", "Danh sách Stakeholders", "Chưa làm"),
        ("BRD-16", "Xếp các Stakeholders vào ma trận Quyền lực–Quan tâm (Power-Interest Grid 2x2), kèm bảng chiến lược giao tiếp cho từng nhóm.", "Mục 6.2", "Sơ đồ Power-Interest Grid + bảng chiến lược", "Chưa làm"),
        ("BRD-17", "Xây dựng Ma trận RACI cho các hoạt động/sản phẩm bàn giao nghiệp vụ chính theo từng Stakeholder (mỗi hàng đúng một chữ A).", "Mục 6.3", "Ma trận RACI", "Chưa làm"),
        ("BRD-18", "Viết Mô tả giải pháp: với mỗi Pain Point ở mục 3.3, nêu 1 đoạn ngắn giải pháp BoardVerse xử lý thế nào (không nêu công nghệ cụ thể).", "Mục 7.1", "Đoạn Mô tả giải pháp", "Chưa làm"),
        ("BRD-19", "Vẽ sơ đồ quy trình nghiệp vụ Tương lai (To-Be) — luồng thuê/trả có hệ thống BoardVerse hỗ trợ, đặt tên \"Hình 7.1\" cùng kiểu với As-Is.", "Mục 7.2", "Sơ đồ To-Be (Flowchart)", "Chưa làm"),
        ("BRD-20", "So sánh & chú thích các điểm cải tiến giữa As-Is (3.3) và To-Be (7.2) bằng bảng đối chiếu.", "Mục 7.2", "Bảng so sánh As-Is vs To-Be", "Chưa làm"),
        ("BRD-21", "Liệt kê các Phương án đã cân nhắc (ít nhất 2-3 phương án, có phương án \"không làm gì\"), kết luận chọn phương án nào và vì sao.", "Mục 7.3", "Bảng phương án & kết luận lựa chọn", "Chưa làm"),
        ("BRD-22", "Soạn Yêu cầu nghiệp vụ (BR) — mã BR-xx, mẫu câu \"Tổ chức/Hệ thống phải...\", ưu tiên theo MoSCoW, mỗi BR trỏ về một BO-xx.", "Mục 8.1", "Danh sách Yêu cầu nghiệp vụ (BR-xx)", "Chưa làm"),
        ("BRD-23", "Soạn quy tắc BRU-01: Khách phải đặt cọc 100% giá trị niêm yết sản phẩm khi thuê.", "Mục 8.2", "Quy tắc nghiệp vụ BRU-01", "Chưa làm"),
        ("BRD-24", "Soạn quy tắc BRU-02: Đơn giá thuê tính theo chu kỳ 24 giờ & biểu giá lũy tiến giảm dần theo số ngày thuê.", "Mục 8.2", "Quy tắc nghiệp vụ BRU-02", "Chưa làm"),
        ("BRD-25", "Soạn quy tắc BRU-03: Công thức tính phạt trễ hạn trả hàng (mức phạt theo giờ/ngày trễ, trần phạt tối đa).", "Mục 8.2", "Quy tắc nghiệp vụ BRU-03", "Chưa làm"),
        ("BRD-26", "Soạn quy tắc BRU-04: Quy chế đền bù — phân biệt linh kiện độc bản (đền theo giá trị nguyên bộ) vs phụ kiện có thể thay thế (đền theo giá linh kiện lẻ).", "Mục 8.2", "Quy tắc nghiệp vụ BRU-04", "Chưa làm"),
        ("BRD-27", "Tổng hợp toàn bộ quy tắc (BRU-01 → BRU-04 và các quy tắc bổ sung nếu có) vào bảng Quy tắc nghiệp vụ, mỗi quy tắc ghi rõ căn cứ & yêu cầu BR liên quan.", "Mục 8.2", "Bảng Quy tắc nghiệp vụ (Catalog)", "Chưa làm"),
        ("BRD-28", "Liệt kê Nhóm người dùng và nhu cầu chính ở mức tổng quát (chưa phải use case); mỗi nhóm một dòng, nhu cầu trỏ đến BR liên quan.", "Mục 8.3", "Bảng Nhóm người dùng & nhu cầu", "Chưa làm"),
        ("BRD-29", "Xác định Yêu cầu phi chức năng ở mức nghiệp vụ (hiệu năng, bảo mật, tuân thủ, dễ dùng), có số cụ thể khi có thể.", "Mục 8.4", "Bảng NFR mức nghiệp vụ", "Chưa làm"),
        ("BRD-30", "Soạn Yêu cầu chuyển đổi & triển khai: chuyển dữ liệu, đào tạo, chạy song song, thời điểm cắt chuyển; mỗi hạng mục nêu người phụ trách & điều kiện hoàn thành.", "Mục 8.5", "Danh sách Yêu cầu chuyển đổi & triển khai", "Chưa làm"),
        ("BRD-31", "Ước tính Chi phí một lần (đầu tư) và định kỳ (vận hành); mỗi dòng ghi cách ước tính/giả định, có dòng tổng, đơn vị tiền tệ và kỳ phân tích.", "Mục 9.1", "Bảng Chi phí", "Chưa làm"),
        ("BRD-32", "Liệt kê Lợi ích hữu hình (quy ra tiền, trỏ về KPI ở mục 4.2) và lợi ích vô hình (mô tả bằng lời).", "Mục 9.2", "Bảng Lợi ích", "Chưa làm"),
        ("BRD-33", "Tính Hiệu quả đầu tư (ROI, NPV, thời gian hoàn vốn): trình bày công thức, kỳ phân tích, tỷ lệ chiết khấu nếu dùng, kết quả và 2-3 câu diễn giải.", "Mục 9.3", "Bảng/đoạn Hiệu quả đầu tư", "Chưa làm"),
        ("BRD-34", "Lập danh sách rủi ro cấp dự án dạng \"Nếu [nguyên nhân] thì [hậu quả]\", có xác suất/tác động theo thang Cao-Trung-Thấp, xếp giảm dần.", "Mục 10.1", "Bảng Đánh giá rủi ro", "Chưa làm"),
        ("BRD-35", "Soạn Kế hoạch dự phòng cho từng rủi ro mức Cao: dấu hiệu nhận biết, hành động ứng phó, người quyết định.", "Mục 10.2", "Kế hoạch dự phòng rủi ro cao", "Chưa làm"),
        ("BRD-36", "Lập các Giai đoạn & cột mốc triển khai chính, mỗi giai đoạn có sản phẩm bàn giao cụ thể; có thể chèn biểu đồ Gantt mức cao.", "Mục 11.1", "Bảng/biểu đồ Giai đoạn & cột mốc", "Chưa làm"),
        ("BRD-37", "Ước tính Nguồn lực cần có (nhân sự theo vai trò/số lượng, công cụ, hạ tầng); số tiền phải khớp với mục 9.1.", "Mục 11.2", "Bảng Nguồn lực", "Chưa làm"),
        ("BRD-38", "Soạn Quản lý thay đổi & truyền thông: hoạt động đào tạo, kênh thông báo, tần suất cập nhật cho từng nhóm Stakeholder ở mục 6.2.", "Mục 11.3", "Kế hoạch quản lý thay đổi & truyền thông", "Chưa làm"),
        ("BRD-39", "Soạn Tiêu chí nghiệm thu; mỗi tiêu chí kiểm tra được, trỏ về BR hoặc KPI liên quan, nêu rõ ai là người nghiệm thu.", "Mục 12.1", "Danh sách Tiêu chí nghiệm thu", "Chưa làm"),
        ("BRD-40", "Soạn Quy trình thay đổi yêu cầu sau khi BRD đã duyệt: ai đề xuất, ai đánh giá tác động, ai duyệt, cập nhật tài liệu ra sao.", "Mục 12.2", "Quy trình thay đổi yêu cầu", "Chưa làm"),
        ("BRD-41", "Lập danh sách người Phê duyệt tài liệu (đại diện bên đặt hàng/giả định, đại diện nghiệp vụ, quản lý dự án).", "Mục 12.3", "Danh sách phê duyệt (trang Sign-off)", "Chưa làm"),
        ("BRD-42", "Xây dựng Ma trận truy vết sơ bộ BO–BR: mỗi BO (mục 4.1) có ít nhất một BR (mục 8.1), mỗi BR truy được về một BO.", "Phụ lục A", "Ma trận truy vết BO–BR", "Chưa làm"),
        ("BRD-43", "Liệt kê Tài liệu bổ sung giả định (biểu mẫu ghi sổ cũ, số liệu gốc, sơ đồ chi tiết); mỗi tài liệu ghi tên, nguồn, và mục BRD sử dụng.", "Phụ lục B", "Danh sách Tài liệu bổ sung", "Chưa làm"),
        ("BRD-44", "Viết Mục đích tài liệu (2-4 câu, mở đầu \"Tài liệu này nhằm...\"), nêu rõ BRD là đầu vào cho SRS.", "Mục 1.1", "Đoạn Mục đích tài liệu", "Chưa làm"),
        ("BRD-45", "Viết Phạm vi tài liệu: 2 ý rõ ràng \"Bao gồm\" và \"Không bao gồm\" (khác với phạm vi dự án ở Chương 5).", "Mục 1.2", "Đoạn Phạm vi tài liệu", "Chưa làm"),
        ("BRD-46", "Lập bảng Đối tượng đọc 3 cột; cột \"Các mục cần đọc\" ghi số chương cụ thể cho từng nhóm người đọc.", "Mục 1.3", "Bảng Đối tượng đọc", "Chưa làm"),
        ("BRD-47", "Lập bảng Thuật ngữ, định nghĩa & viết tắt, xếp theo thứ tự bảng chữ cái, chỉ ghi thuật ngữ thực sự dùng trong tài liệu.", "Mục 1.4", "Bảng Thuật ngữ & viết tắt", "Chưa làm"),
        ("BRD-48", "Lập danh sách Tài liệu tham khảo theo một chuẩn trích dẫn thống nhất (APA/IEEE); ghi rõ nguồn là \"giả định của tác giả\" vì dự án không có thật.", "Mục 1.5", "Danh sách Tài liệu tham khảo", "Chưa làm"),
        ("BRD-49", "Viết Cấu trúc tài liệu: mỗi chương một câu mô tả ngắn, theo đúng thứ tự Mục lục.", "Mục 1.6", "Đoạn Cấu trúc tài liệu", "Chưa làm"),
        ("BRD-50", "Viết Tóm tắt điều hành (viết sau cùng): vấn đề, giải pháp đề xuất, lợi ích kỳ vọng, chi phí tổng, thời gian, đề nghị phê duyệt — tối đa 1 trang, lấy số liệu từ Chương 4 và Chương 9, không dùng thuật ngữ kỹ thuật.", "Mục 2", "Đoạn Tóm tắt điều hành", "Chưa làm"),
        ("BRD-51", "Tổng hợp toàn bộ các mục trên thành bản thảo đầy đủ tài liệu BRD (Word), xoá các khối chỉ dẫn xanh và chữ trong [ ], cập nhật dòng đầu Lịch sử phiên bản (0.1).", "Toàn bộ BRD", "Bản thảo BRD v0.9 (.docx)", "Chưa làm"),
        ("BRD-52", "Rà soát chéo (self-review): đối chiếu nội dung BRD với mục tiêu kinh doanh & KPI (Chương 4), hiệu đính lỗi, bấm Update Field > Update entire table cho Mục lục.", "Toàn bộ BRD", "Biên bản rà soát BRD", "Chưa làm"),
        ("BRD-53", "Thêm dòng phiên bản 1.0 vào Lịch sử phiên bản và hoàn tất trang Phê duyệt (mục 12.3, giả định vai trò Chủ đầu tư/Giảng viên hướng dẫn).", "Mục 12.3", "Trang Sign-off đã điền tên người duyệt", "Chưa làm"),
        ("BRD-54", "Xuất bản & lưu bản chốt với tên file \"BRD_BoardVerse_v1.0.docx\".", "Toàn bộ BRD", "BRD_BoardVerse_v1.0.docx (đã Sign-off)", "Chưa làm"),
    ],
}

PHASE_2 = {
    "title": "GIAI ĐOẠN 2 — CUỐN 2: TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)",
    "subtitle": "Điền theo đúng thứ tự khuyến nghị của Template_SRS_Claude.docx: Chương 2→3→4→5→6→7→8→10→Phụ lục A→B→C→Chương 9→Chương 1. Đầu ra cuối giai đoạn: \"SRS_BoardVerse_v1.0.docx\" đã Scope Freeze.",
    "tasks": [
        ("SRS-01", "Vẽ sơ đồ ngữ cảnh hệ thống \"Hình 2.1\" (BoardVerse và các tác nhân/hệ thống bên ngoài tương tác), chú thích 2-3 câu.", "Mục 2.1", "Sơ đồ ngữ cảnh hệ thống", "Chưa làm"),
        ("SRS-02", "Liệt kê các nhóm chức năng chính ở mức cao (Bán hàng, Cho thuê, Quản lý kho), mỗi nhóm một câu; có thể thêm sơ đồ khối.", "Mục 2.2", "Danh sách nhóm chức năng (tóm tắt)", "Chưa làm"),
        ("SRS-03", "Mô tả Đặc điểm người dùng (Customer, Staff, Admin): trình độ, tần suất dùng, quyền hạn; kèm bảng Ma trận phân quyền theo từng module, khớp danh sách tác nhân ở mục 3.2.", "Mục 2.3", "Bảng Đặc điểm người dùng + Ma trận phân quyền", "Chưa làm"),
        ("SRS-04", "Xác định Môi trường vận hành: phần cứng, hệ điều hành, trình duyệt, CSDL, mạng, hạ tầng — phân biệt môi trường máy chủ và người dùng, ghi phiên bản tối thiểu.", "Mục 2.4", "Bảng Môi trường vận hành", "Chưa làm"),
        ("SRS-05", "Liệt kê Ràng buộc thiết kế và triển khai, mã CON-xx (ngôn ngữ lập trình, framework, chuẩn, chính sách, giới hạn thời gian/ngân sách), mỗi dòng kèm lý do.", "Mục 2.5", "Danh sách Ràng buộc (CON-xx)", "Chưa làm"),
        ("SRS-06", "Tách 2 danh sách Giả định (hậu quả nếu sai) và Phụ thuộc (hệ thống/thư viện/dịch vụ ngoài, ảnh hưởng nếu không có).", "Mục 2.6", "Danh sách Giả định & Phụ thuộc", "Chưa làm"),
        ("SRS-07", "Vẽ Use Case Diagram tổng quát toàn hệ thống: tác nhân, use case, quan hệ include/extend.", "Mục 3.1", "Use Case Diagram tổng quát", "Chưa làm"),
        ("SRS-08", "Phân rã thêm Use Case Diagram theo 3 phân hệ: Bán hàng, Cho thuê, Quản lý kho (vì tổng số use case > 15).", "Mục 3.1", "3 Use Case Diagram phân hệ", "Chưa làm"),
        ("SRS-09", "Lập danh sách Tác nhân (Customer, Staff, Admin...), mã ACT-xx, cột loại ghi \"Người\" hoặc \"Hệ thống\".", "Mục 3.2", "Danh sách Tác nhân (ACT-xx)", "Chưa làm"),
        ("SRS-10", "Lập bảng Danh sách use case (mã UC-xx, tên dạng \"động từ + đối tượng\") cho khoảng 6-8 use case thuộc 3 phân hệ — mọi UC trong bảng này đều phải có đặc tả ở mục 3.4.", "Mục 3.3", "Bảng Danh sách use case (UC-xx)", "Chưa làm"),
        ("SRS-11", "Đặc tả chi tiết Use Case \"Đặt thuê theo ngày\" (Actor, Pre/Post-condition, Main flow, Alternative flow, Exception flow) theo bảng mẫu 3.4.x.", "Mục 3.4", "Bảng đặc tả UC-Đặt thuê theo ngày", "Chưa làm"),
        ("SRS-12", "Đặc tả chi tiết Use Case \"Bàn giao xuất kho\" theo bảng mẫu 3.4.x.", "Mục 3.4", "Bảng đặc tả UC-Bàn giao xuất kho", "Chưa làm"),
        ("SRS-13", "Đặc tả chi tiết Use Case \"Kiểm đếm linh kiện nhập kho\" theo bảng mẫu 3.4.x.", "Mục 3.4", "Bảng đặc tả UC-Kiểm đếm nhập kho", "Chưa làm"),
        ("SRS-14", "Đặc tả chi tiết Use Case \"Quyết toán hoàn cọc\" theo bảng mẫu 3.4.x.", "Mục 3.4", "Bảng đặc tả UC-Quyết toán hoàn cọc", "Chưa làm"),
        ("SRS-15", "Viết đặc tả rút gọn (luồng chính ngắn) cho các use case còn lại trong bảng 3.3 (đăng nhập, xem danh sách sản phẩm, đặt mua, cập nhật trạng thái hộp game...) để không UC nào thiếu đặc tả.", "Mục 3.4", "Đặc tả rút gọn các UC còn lại", "Chưa làm"),
        ("SRS-16", "Xác định danh sách lớp/thực thể (Entity Classes) sơ bộ dựa trên Use Case (3.3) & Business Rules Catalog (BRD mục 8.2).", "Mục 3.5", "Danh sách Entity Classes sơ bộ", "Chưa làm"),
        ("SRS-17", "Xây dựng Sơ đồ Lớp Domain phiên bản 1 (chỉ thuộc tính, TUYỆT ĐỐI KHÔNG chứa phương thức) kèm quan hệ association/aggregation/composition.", "Mục 3.5", "Domain Class Diagram v1", "Chưa làm"),
        ("SRS-18", "Áp dụng Quy tắc chuyển đổi 1: chuyển mỗi Lớp (Class) thành một Thực thể (Entity/Table).", "Mục 3.5", "Danh sách Entity tương ứng Class", "Chưa làm"),
        ("SRS-19", "Áp dụng Quy tắc chuyển đổi 2: chuyển mỗi Thuộc tính (Attribute) thành Cột (Column) kèm kiểu dữ liệu sơ bộ.", "Mục 3.5", "Danh sách Column sơ bộ theo Entity", "Chưa làm"),
        ("SRS-20", "Áp dụng Quy tắc chuyển đổi 3: chuyển quan hệ 1-N, N-N thành khóa ngoại (FK) hoặc bảng trung gian (Junction Table).", "Mục 3.5", "Danh sách FK / bảng trung gian", "Chưa làm"),
        ("SRS-21", "Áp dụng Quy tắc chuyển đổi 4: chuẩn hóa & vẽ hoàn chỉnh sơ đồ ERD theo chuẩn ký hiệu Crow's Foot, kèm bảng mô tả từng thực thể.", "Mục 3.5", "ERD hoàn chỉnh (Crow's Foot)", "Chưa làm"),
        ("SRS-22", "Vẽ Activity Diagram (có Swimlane phân làn theo Actor) cho luồng thuê board game.", "Mục 3.6", "Activity Diagram - Luồng thuê", "Chưa làm"),
        ("SRS-23", "Vẽ Activity Diagram (có Swimlane phân làn theo Actor) cho luồng trả hàng & kiểm kê.", "Mục 3.6", "Activity Diagram - Luồng trả/kiểm kê", "Chưa làm"),
        ("SRS-24", "Vẽ State Machine Diagram cho Vòng đời Đơn thuê (Pending → Confirmed → Active → Completed/Overdue → Closed).", "Mục 3.6", "State Machine - Đơn thuê", "Chưa làm"),
        ("SRS-25", "Vẽ State Machine Diagram cho Vòng đời Hộp game vật lý (Available → Reserved → Rented → Checking → Damaged/Available).", "Mục 3.6", "State Machine - Hộp game", "Chưa làm"),
        ("SRS-26", "Vẽ System Sequence Diagram (SSD) cho luồng đặt cọc (Deposit) giữa Actor và hệ thống.", "Mục 3.6", "SSD - Luồng đặt cọc", "Chưa làm"),
        ("SRS-27", "Vẽ System Sequence Diagram (SSD) cho luồng hoàn cọc (Refund Deposit) giữa Actor và hệ thống.", "Mục 3.6", "SSD - Luồng hoàn cọc", "Chưa làm"),
        ("SRS-28", "Đổi tên mục 4.1 thành \"Quản lý Bán hàng\"; viết 2-3 câu mô tả rồi liệt kê yêu cầu chức năng mã FR-BH-xx (xem sản phẩm, đặt mua, thanh toán...) kèm tiêu chí chấp nhận, trỏ về UC & BR liên quan.", "Mục 4.1", "Bảng Yêu cầu chức năng - Bán hàng (FR-BH-xx)", "Chưa làm"),
        ("SRS-29", "Đổi tên mục 4.2 thành \"Quản lý Cho thuê\"; liệt kê yêu cầu mã FR-CT-xx (đặt thuê theo ngày, tính giá lũy tiến, đặt cọc, phạt trễ hạn, hoàn cọc...) kèm tiêu chí chấp nhận, trỏ UC & BR.", "Mục 4.2", "Bảng Yêu cầu chức năng - Cho thuê (FR-CT-xx)", "Chưa làm"),
        ("SRS-30", "Đổi tên mục 4.3 thành \"Quản lý Kho\"; liệt kê yêu cầu mã FR-KHO-xx (nhập/xuất kho, kiểm đếm linh kiện, cập nhật trạng thái hộp game...) kèm tiêu chí chấp nhận, trỏ UC & BR.", "Mục 4.3", "Bảng Yêu cầu chức năng - Kho (FR-KHO-xx)", "Chưa làm"),
        ("SRS-31", "Soạn Giao diện người dùng: quy ước chung (bố cục, màu sắc, ngôn ngữ, cách hiển thị lỗi) + bảng danh sách màn hình kèm mã màn hình (wireframe đặt ở Phụ lục A).", "Mục 5.1", "Bảng quy ước UI + danh sách màn hình", "Chưa làm"),
        ("SRS-32", "Ghi \"Không áp dụng\" cho Giao diện phần cứng kèm lý do (ứng dụng web, không có thiết bị/giao thức phần cứng chuyên dụng).", "Mục 5.2", "Đoạn Giao diện phần cứng (Không áp dụng)", "Chưa làm"),
        ("SRS-33", "Liệt kê Giao diện phần mềm: các hệ thống/API/thư viện ngoài sản phẩm kết nối (ví dụ cổng thanh toán giả định, dịch vụ email), nêu mục đích, cách giao tiếp, dữ liệu trao đổi, phiên bản.", "Mục 5.3", "Bảng Giao diện phần mềm", "Chưa làm"),
        ("SRS-34", "Soạn Giao diện truyền thông: giao thức HTTP/HTTPS, định dạng dữ liệu (JSON), yêu cầu bảo mật truyền thông.", "Mục 5.4", "Đoạn Giao diện truyền thông", "Chưa làm"),
        ("SRS-35", "Soạn NFR Hiệu năng (6.1): thời gian phản hồi, số người dùng đồng thời, điều kiện đo (tải/thiết bị/mạng) — có số liệu cụ thể.", "Mục 6.1", "Bảng NFR - Hiệu năng", "Chưa làm"),
        ("SRS-36", "Soạn NFR Độ tin cậy và khả dụng (6.2): tỷ lệ khả dụng, RTO/RPO nếu có, cách hệ thống phản ứng khi lỗi.", "Mục 6.2", "Bảng NFR - Độ tin cậy & khả dụng", "Chưa làm"),
        ("SRS-37", "Soạn NFR Bảo mật (6.3): xác thực, phân quyền, mã hoá, nhật ký, chống tấn công phổ biến (có thể tham chiếu OWASP), mật khẩu, thời gian hết phiên.", "Mục 6.3", "Bảng NFR - Bảo mật", "Chưa làm"),
        ("SRS-38", "Soạn NFR Khả năng sử dụng (6.4): chỉ số đo được (thời gian học, tỷ lệ hoàn thành tác vụ).", "Mục 6.4", "Bảng NFR - Khả năng sử dụng", "Chưa làm"),
        ("SRS-39", "Soạn NFR Khả năng bảo trì và mở rộng (6.5): chuẩn mã nguồn, tài liệu, ghi log, khả năng mở rộng tải.", "Mục 6.5", "Bảng NFR - Bảo trì & mở rộng", "Chưa làm"),
        ("SRS-40", "Soạn NFR Tính tương thích và di động (6.6): danh sách trình duyệt/thiết bị/hệ điều hành cần hỗ trợ kèm phiên bản tối thiểu.", "Mục 6.6", "Bảng NFR - Tương thích & di động", "Chưa làm"),
        ("SRS-41", "Soạn NFR Tuân thủ pháp lý và chuẩn (6.7): luật/quy định liên quan (bảo vệ dữ liệu cá nhân...), điều khoản và hệ quả với hệ thống.", "Mục 6.7", "Bảng NFR - Tuân thủ pháp lý", "Chưa làm"),
        ("SRS-42", "Lập Từ điển dữ liệu: mỗi Entity ở ERD (mục 3.5) một bảng — tên cột, kiểu dữ liệu, độ dài, ràng buộc (bắt buộc/duy nhất/khoá), ý nghĩa.", "Mục 7.1", "Từ điển dữ liệu (Data Dictionary)", "Chưa làm"),
        ("SRS-43", "Soạn Lưu trữ, sao lưu và lưu giữ: thời gian lưu dữ liệu, chu kỳ sao lưu, quy tắc xoá/ẩn danh, kèm căn cứ.", "Mục 7.2", "Đoạn Lưu trữ & sao lưu", "Chưa làm"),
        ("SRS-44", "Ghi \"Không áp dụng\" cho Di chuyển dữ liệu kèm lý do (hệ thống mới, không có dữ liệu hệ thống cũ cần chuyển).", "Mục 7.3", "Đoạn Di chuyển dữ liệu (Không áp dụng)", "Chưa làm"),
        ("SRS-45", "Soạn Các yêu cầu khác: tài liệu hướng dẫn, đào tạo nhân viên, cài đặt, hỗ trợ, bản quyền — mỗi yêu cầu có mã OTH-xx viết cùng mẫu với yêu cầu chức năng.", "Chương 8", "Danh sách Yêu cầu khác (OTH-xx)", "Chưa làm"),
        ("SRS-46", "Soạn Tiêu chí nghiệm thu: chọn phương pháp xác minh (Test/Demo/Inspection/Analysis) cho từng yêu cầu, khớp với \"Tiêu chí chấp nhận\" đã viết ở Chương 4.", "Chương 10", "Bảng Tiêu chí nghiệm thu", "Chưa làm"),
        ("SRS-47", "Vẽ/ghép Wireframe mức thấp cho các màn hình đã khai báo ở mục 5.1, đặt tên theo mã màn hình, chú thích ngắn các thành phần chính.", "Phụ lục A", "Bộ Wireframe & mockup", "Chưa làm"),
        ("SRS-48", "Liệt kê các điểm chưa chốt khi viết SRS (mã TBD-xx, người chịu trách nhiệm, hạn giải quyết); nếu không còn điểm nào thì ghi rõ \"Không có TBD còn tồn đọng\".", "Phụ lục B", "Danh sách TBD", "Chưa làm"),
        ("SRS-49", "Khởi tạo khung Nhật ký thay đổi yêu cầu (để trống hoặc ghi \"Chưa có thay đổi\" ở bản 1.0), dùng để cập nhật sau khi SRS được duyệt.", "Phụ lục C", "Khung Nhật ký thay đổi yêu cầu", "Chưa làm"),
        ("SRS-50", "Xây dựng Ma trận truy vết yêu cầu: mỗi BR trong BRD (mục 8.1) có ít nhất một FR, mỗi FR truy ngược về một BR; rà soát và xử lý yêu cầu mồ côi (nếu có).", "Chương 9", "Ma trận truy vết BR–FR–UC", "Chưa làm"),
        ("SRS-51", "Viết Mục đích: mở đầu \"Tài liệu này đặc tả yêu cầu phần mềm cho BoardVerse phiên bản 1.0...\", nêu rõ quan hệ với BRD_BoardVerse_v1.0.", "Mục 1.1", "Đoạn Mục đích", "Chưa làm"),
        ("SRS-52", "Viết Phạm vi sản phẩm: tóm tắt 1-2 đoạn từ phạm vi dự án ở BRD (mục 5.1/5.2), đảm bảo nhất quán.", "Mục 1.2", "Đoạn Phạm vi sản phẩm", "Chưa làm"),
        ("SRS-53", "Lập bảng Đối tượng đọc và hướng dẫn đọc (2 cột): nhóm người đọc & thứ tự chương nên đọc.", "Mục 1.3", "Bảng Đối tượng đọc", "Chưa làm"),
        ("SRS-54", "Lập bảng Định nghĩa và từ viết tắt theo alphabet, chỉ ghi thuật ngữ thực sự xuất hiện trong SRS.", "Mục 1.4", "Bảng Định nghĩa & viết tắt", "Chưa làm"),
        ("SRS-55", "Lập danh sách Tài liệu tham khảo (BRD_BoardVerse_v1.0 + chuẩn/tài liệu kỹ thuật khác), dùng một chuẩn trích dẫn thống nhất; ghi \"giả định của tác giả\" nếu cần.", "Mục 1.5", "Danh sách Tài liệu tham khảo", "Chưa làm"),
        ("SRS-56", "Lập bảng Quy ước tài liệu: cách đánh mã yêu cầu (FR-nhóm-số, NFR-số, UC-xx, ACT-xx, CON-xx...), thang ưu tiên MoSCoW, ý nghĩa 'phải/nên/có thể' — quy ước này cần được áp dụng nhất quán từ các chương trước, chỉ chính thức viết ra ở đây.", "Mục 1.6", "Bảng Quy ước tài liệu", "Chưa làm"),
        ("SRS-57", "Tổng hợp bản thảo SRS hoàn chỉnh (Word), xoá khối chỉ dẫn xanh và chữ trong [ ], cập nhật dòng đầu Lịch sử phiên bản (0.1).", "Toàn bộ SRS", "Bản thảo SRS v0.9 (.docx)", "Chưa làm"),
        ("SRS-58", "Rà soát toàn diện: đối chiếu Chương 9 không còn yêu cầu mồ côi, đối chiếu mọi NFR đều có số đo cụ thể, bấm Update Field cho Mục lục.", "Toàn bộ SRS", "Biên bản rà soát SRS", "Chưa làm"),
        ("SRS-59", "Thêm dòng phiên bản 1.0 vào Lịch sử phiên bản và thực hiện Scope Freeze — xuất bản \"SRS_BoardVerse_v1.0.docx\".", "Toàn bộ SRS", "SRS_BoardVerse_v1.0.docx (Scope Freeze)", "Chưa làm"),
    ],
}

PHASE_3 = {
    "title": "GIAI ĐOẠN 3 — CUỐN 3: TÀI LIỆU THIẾT KẾ HỆ THỐNG (SDD)",
    "subtitle": "Đầu ra cuối giai đoạn: file Word \"SDD_BoardVerse_v1.0.docx\" đã phê duyệt kỹ thuật.",
    "tasks": [
        ("SDD-01", "Thiết kế mô hình kiến trúc phần mềm tổng thể (Layered/Clean Architecture áp dụng cho ứng dụng web BoardVerse).", "—", "Sơ đồ kiến trúc tổng thể", "Chưa làm"),
        ("SDD-02", "Lựa chọn & mô tả chi tiết Tech Stack: Next.js (App Router), Tailwind CSS, Shadcn UI, Prisma ORM, PostgreSQL.", "—", "Bảng mô tả Tech Stack", "Chưa làm"),
        ("SDD-03", "Thiết kế Schema Prisma (model, field, relation) chuyển đổi trực tiếp từ ERD đã chốt ở SRS.", "—", "File schema.prisma (bản thiết kế)", "Chưa làm"),
        ("SDD-04", "Định nghĩa các PostgreSQL Types & Enum cần dùng (trạng thái đơn thuê, loại sản phẩm, trạng thái hộp game...).", "—", "Danh sách Enum & Types", "Chưa làm"),
        ("SDD-05", "Thiết kế Index tối ưu cho các truy vấn chính (tìm sản phẩm còn trống theo ngày, tra cứu đơn thuê theo khách hàng).", "—", "Danh sách Index đề xuất", "Chưa làm"),
        ("SDD-06", "Lựa chọn 5 tựa board game kinh điển để làm dữ liệu mẫu (ví dụ: Cờ Tỷ Phú, Cờ Cá Ngựa, Ma Sói, Catan, UNO).", "—", "Danh sách 5 tựa game mẫu", "Chưa làm"),
        ("SDD-07", "Soạn checklist linh kiện chi tiết cho từng tựa game mẫu (dùng để kiểm đếm khi nhập/xuất kho).", "—", "Checklist linh kiện theo từng game", "Chưa làm"),
        ("SDD-08", "Viết kịch bản Seed Data (mô tả logic script khởi tạo dữ liệu mẫu: sản phẩm, linh kiện, tài khoản demo).", "—", "Kịch bản Seed Data (bản thiết kế)", "Chưa làm"),
        ("SDD-09", "Thiết kế Sitemap toàn hệ thống (trang phía Khách hàng & trang POS/Admin).", "—", "Sơ đồ Sitemap", "Chưa làm"),
        ("SDD-10", "Vẽ Luồng điều hướng (Navigation Flow) giữa các trang chính trong hệ thống.", "—", "Sơ đồ Navigation Flow", "Chưa làm"),
        ("SDD-11", "Thiết kế khung Wireframe UI phía Khách hàng (trang chủ, danh sách sản phẩm, chi tiết, giỏ thuê, thanh toán).", "—", "Bộ Wireframe - Khách hàng", "Chưa làm"),
        ("SDD-12", "Thiết kế khung Wireframe UI phía POS/Admin (quản lý kho, quản lý đơn thuê, quyết toán cọc).", "—", "Bộ Wireframe - POS/Admin", "Chưa làm"),
        ("SDD-13", "Thiết kế thuật toán kiểm tra tình trạng phòng trống/sản phẩm sẵn có theo khoảng ngày thuê (tránh trùng lịch thuê).", "—", "Đặc tả thuật toán kiểm tra tồn kho", "Chưa làm"),
        ("SDD-14", "Thiết kế Module tính toán giá thuê theo biểu giá lũy tiến (BR-02) và công thức tính phạt trễ hạn (BR-03).", "—", "Đặc tả Module tính toán giá/phạt", "Chưa làm"),
        ("SDD-15", "Đặc tả danh sách API Endpoints (HTTP method, path, request body, response body, status code) cho các luồng chính.", "—", "Bảng đặc tả API Endpoints", "Chưa làm"),
        ("SDD-16", "Nâng cấp Domain Class Diagram (v1) thành Sơ đồ Lớp Thiết kế phiên bản 2 (Design Class Diagram), bổ sung đầy đủ Methods.", "—", "Design Class Diagram v2", "Chưa làm"),
        ("SDD-17", "Bổ sung các lớp Service & Controller vào Design Class Diagram theo kiến trúc đã chọn ở SDD-01.", "—", "Design Class Diagram v2 (hoàn chỉnh Service/Controller)", "Chưa làm"),
        ("SDD-18", "Tổng hợp bản thảo SDD hoàn chỉnh (toàn bộ các mục trên), rà soát tính khả thi kỹ thuật với Tech Stack đã chọn.", "—", "Bản thảo SDD v0.9 (.docx)", "Chưa làm"),
        ("SDD-19", "Lập trang Phê duyệt kỹ thuật (Technical Sign-off) để chốt thiết kế hệ thống phiên bản 1.0.", "—", "SDD_BoardVerse_v1.0.docx (đã phê duyệt)", "Chưa làm"),
    ],
}

PHASE_4 = {
    "title": "GIAI ĐOẠN 4 — CHUYỂN ĐỔI SANG MARKDOWN TRÊN GITHUB (docs)",
    "subtitle": "Đầu ra cuối giai đoạn: repo GitHub với thư mục /docs hoàn chỉnh.",
    "tasks": [
        ("GIT-01", "Khởi tạo Repository GitHub mới (đặt tên \"boardverse\", viết mô tả ngắn, chọn License, thêm .gitignore).", "—", "Repository GitHub đã khởi tạo", "Chưa làm"),
        ("GIT-02", "Khởi tạo cấu trúc thư mục chuẩn cho dự án (/docs, /src hoặc /app, /prisma, README.md gốc).", "—", "Cấu trúc thư mục dự án", "Chưa làm"),
        ("GIT-03", "Soạn docs/PRD.md — tóm tắt nội dung cốt lõi từ BRD và SRS thành Product Requirement Document dạng Markdown.", "—", "docs/PRD.md", "Chưa làm"),
        ("GIT-04", "Soạn docs/data-schema.md — chuyển ERD đã chốt thành sơ đồ viết bằng mã Mermaid (erDiagram).", "—", "docs/data-schema.md", "Chưa làm"),
        ("GIT-05", "Soạn docs/user-stories.md — chuyển từng Use Case ở SRS thành User Story kèm Acceptance Criteria theo chuẩn Given-When-Then.", "—", "docs/user-stories.md", "Chưa làm"),
        ("GIT-06", "Soạn docs/api-specs.md — chuyển bảng đặc tả API Endpoints ở SDD-15 sang định dạng Markdown.", "—", "docs/api-specs.md", "Chưa làm"),
        ("GIT-07", "Thiết lập file luật AI (CLAUDE.md hoặc .cursorrules) quy định kỷ luật code: bám sát tài liệu, quy ước đặt tên, cấu trúc thư mục khi Vibe Code.", "—", "CLAUDE.md / .cursorrules", "Chưa làm"),
        ("GIT-08", "Commit & push toàn bộ tài liệu Markdown (/docs) cùng file luật AI lên GitHub, kiểm tra hiển thị đúng trên web.", "—", "Commit đầu tiên trên GitHub", "Chưa làm"),
    ],
}

PHASE_5 = {
    "title": "GIAI ĐOẠN 5 — VIBE CODE, KIỂM THỬ NGHIỆM THU & ĐÓNG GÓI CV",
    "subtitle": "Đầu ra cuối giai đoạn: Live Demo + README.md + 3 file PDF + CV hoàn chỉnh.",
    "tasks": [
        ("DEV-01", "Khởi tạo mã nguồn dự án (Next.js App Router scaffold, cài Tailwind CSS, Shadcn UI).", "—", "Source code khởi tạo", "Chưa làm"),
        ("DEV-02", "Cấu hình kết nối Prisma ORM với PostgreSQL (biến môi trường, connection string) và chạy migrate DB theo schema.prisma.", "—", "Database đã migrate", "Chưa làm"),
        ("DEV-03", "Viết script và nạp Seed Data (5 tựa game mẫu + checklist linh kiện) vào database.", "—", "Database có Seed Data", "Chưa làm"),
        ("DEV-04", "Vibe code User Story đầu tiên theo lát cắt dọc (Vertical Slice): hoàn chỉnh từ UI → API → Database cho 1 chức năng trọn vẹn.", "—", "User Story #1 hoàn thiện (chạy được end-to-end)", "Chưa làm"),
        ("DEV-05", "Vibe code tiếp User Story kế tiếp theo lát cắt dọc, ưu tiên luồng \"Đặt thuê theo ngày\".", "—", "User Story kế tiếp hoàn thiện", "Chưa làm"),
        ("DEV-06", "Vibe code tiếp User Story kế tiếp theo lát cắt dọc, ưu tiên luồng \"Bàn giao xuất kho / Kiểm đếm nhập kho\".", "—", "User Story kế tiếp hoàn thiện", "Chưa làm"),
        ("DEV-07", "Vibe code tiếp User Story kế tiếp theo lát cắt dọc, ưu tiên luồng \"Quyết toán hoàn cọc\".", "—", "User Story kế tiếp hoàn thiện", "Chưa làm"),
        ("DEV-08", "Lặp lại Vibe code tuần tự cho toàn bộ các User Story còn lại trong docs/user-stories.md theo thứ tự ưu tiên.", "—", "Toàn bộ User Story đã code xong", "Chưa làm"),
        ("DEV-09", "Kiểm thử nghiệm thu (UAT) từng chức năng, đối chiếu từng tiêu chí Acceptance Criteria (Given-When-Then).", "—", "Biên bản kiểm thử UAT", "Chưa làm"),
        ("DEV-10", "Sửa lỗi logic phát sinh sau kiểm thử & tinh chỉnh giao diện theo Wireframe đã thiết kế.", "—", "Bản fix lỗi & tinh chỉnh UI", "Chưa làm"),
        ("DEV-11", "Deploy ứng dụng web lên Vercel, kiểm tra hoạt động và lấy đường link Live Demo.", "—", "Link Live Demo trên Vercel", "Chưa làm"),
        ("DEV-12", "Viết README.md hoàn chỉnh cho GitHub: giới thiệu dự án, Tech Stack, link Live Demo, hướng dẫn cài đặt & chạy local.", "—", "README.md hoàn chỉnh", "Chưa làm"),
        ("DEV-13", "Xuất 3 cuốn tài liệu BRD, SRS, SDD sang định dạng PDF để đính kèm hồ sơ.", "—", "3 file PDF (BRD/SRS/SDD)", "Chưa làm"),
        ("DEV-14", "Đóng gói toàn bộ Portfolio (link GitHub repo + link Live Demo + 3 file PDF) và đưa vào CV xin việc vị trí BA.", "—", "Portfolio hoàn chỉnh trong CV", "Chưa làm"),
    ],
}

PHASES = [PHASE_1, PHASE_2, PHASE_3, PHASE_4, PHASE_5]

COLUMN_WIDTHS_CM = [1.3, 1.8, 9.3, 3.2, 6.2, 2.9]
HEADERS = ["✓", "Mã việc", "Tên công việc & Chi tiết thực hiện", "Điền vào mục (BRD)", "Sản phẩm đầu ra", "Trạng thái"]


# --------------------------------------------------------------------------
# Helper functions
# --------------------------------------------------------------------------

def set_cell_shading(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def set_cell_borders(cell, color_hex=GRID_BORDER_HEX, sz=4):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color_hex)
        borders.append(el)
    tcPr.append(borders)


def set_cell_vertical_center(cell):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def format_run(run, size=10, bold=False, color=None, font_name="Calibri"):
    run.font.name = font_name
    run.font.size = Pt(size)
    run.font.bold = bold
    if color is not None:
        run.font.color.rgb = color


def add_checkbox(paragraph):
    """Chen Content Control Checkbox (w14:checkbox) co the click truc tiep trong Word."""
    sdt = OxmlElement("w:sdt")
    sdtPr = OxmlElement("w:sdtPr")

    rpr_symbol = OxmlElement("w:rPr")
    rfonts = OxmlElement("w:rFonts")
    rfonts.set(qn("w:ascii"), "MS Gothic")
    rfonts.set(qn("w:eastAsia"), "MS Gothic")
    rfonts.set(qn("w:hAnsi"), "MS Gothic")
    rpr_symbol.append(rfonts)
    sdtPr.append(rpr_symbol)

    id_el = OxmlElement("w:id")
    id_el.set(qn("w:val"), str(next(_id_counter)))
    sdtPr.append(id_el)

    checkbox = OxmlElement("w14:checkbox")
    checked = OxmlElement("w14:checked")
    checked.set(qn("w14:val"), "0")
    checked_state = OxmlElement("w14:checkedState")
    checked_state.set(qn("w14:val"), "2612")
    checked_state.set(qn("w14:font"), "MS Gothic")
    unchecked_state = OxmlElement("w14:uncheckedState")
    unchecked_state.set(qn("w14:val"), "2610")
    unchecked_state.set(qn("w14:font"), "MS Gothic")
    checkbox.append(checked)
    checkbox.append(checked_state)
    checkbox.append(unchecked_state)
    sdtPr.append(checkbox)

    sdt.append(sdtPr)
    sdt.append(OxmlElement("w:sdtEndPr"))

    sdt_content = OxmlElement("w:sdtContent")
    run_el = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    rfonts2 = OxmlElement("w:rFonts")
    rfonts2.set(qn("w:ascii"), "MS Gothic")
    rfonts2.set(qn("w:eastAsia"), "MS Gothic")
    rfonts2.set(qn("w:hAnsi"), "MS Gothic")
    rfonts2.set(qn("w:hint"), "eastAsia")
    rpr.append(rfonts2)
    run_el.append(rpr)
    t_el = OxmlElement("w:t")
    t_el.text = "\u2610"
    run_el.append(t_el)
    sdt_content.append(run_el)
    sdt.append(sdt_content)

    paragraph._p.append(sdt)


def set_landscape(document):
    section = document.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    new_width, new_height = section.page_height, section.page_width
    section.page_width = new_width
    section.page_height = new_height
    section.left_margin = Cm(1.5)
    section.right_margin = Cm(1.5)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)


def set_default_font(document):
    style = document.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), "Calibri")


def add_title_block(document):
    p = document.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("BẢNG KIỂM TIẾN ĐỘ CHI TIẾT — MASTER CHECKLIST")
    format_run(run, size=22, bold=True, color=NAVY)

    p2 = document.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("DỰ ÁN PHÂN TÍCH THIẾT KẾ HỆ THỐNG MUA BÁN & CHO THUÊ BOARD GAME — \"BOARDVERSE\"")
    format_run(run2, size=14, bold=True, color=RGBColor(0x44, 0x44, 0x44))

    p3 = document.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    info = (
        "Mô hình phát triển: Waterfall (tuần tự, chốt & đóng băng từng giai đoạn)   |   "
        "Phương pháp luận: OOAD kết hợp UML   |   "
        "Lộ trình: BRD → SRS → SDD → Markdown (docs) → Vibe Code → Deploy → Portfolio"
    )
    run3 = p3.add_run(info)
    format_run(run3, size=9.5, bold=False, color=RGBColor(0x66, 0x66, 0x66))

    document.add_paragraph()


def add_callout(document):
    table = document.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.rows[0].cells[0]
    set_cell_shading(cell, CALLOUT_BG)
    set_cell_borders(cell, color_hex=CALLOUT_BORDER, sz=10)

    cell.text = ""
    p0 = cell.paragraphs[0]
    r0 = p0.add_run("📌 HƯỚNG DẪN SỬ DỤNG BẢNG KIỂM")
    format_run(r0, size=11.5, bold=True, color=NAVY)

    lines = [
        "1. Tích hoàn thành: nhấp chuột trực tiếp vào ô vuông ☐ ở đầu mỗi dòng việc — ô sẽ chuyển thành ☑ (checkbox tương tác, không cần công cụ ngoài).",
        "2. Gạch ngang việc đã xong: bôi đen (chọn) đoạn text ở cột \"Tên công việc\" rồi vào thẻ Home > nhóm Font > bấm nút Strikethrough — hoặc dùng tổ hợp phím Ctrl + D nếu bạn đã tự gán phím tắt này cho lệnh Strikethrough trong Word (Word không mặc định gán Ctrl+D cho Strikethrough ở mọi phiên bản).",
        "3. Cập nhật cột \"Trạng thái\": sửa trực tiếp chữ \"Chưa làm\" thành \"Đang làm\" / \"Hoàn thành\" khi cần.",
        "4. Nên lưu file dưới dạng .docx (giữ nguyên) để không mất tính năng checkbox tương tác; nếu xuất PDF chỉ dùng cho mục đích lưu trữ/đính kèm CV.",
    ]
    for line in lines:
        p = cell.add_paragraph()
        r = p.add_run(line)
        format_run(r, size=9.5, bold=False, color=RGBColor(0x22, 0x22, 0x22))

    document.add_paragraph()


def style_header_row(row):
    for idx, text in enumerate(HEADERS):
        cell = row.cells[idx]
        cell.text = ""
        set_cell_shading(cell, HEADER_BG)
        set_cell_borders(cell, color_hex=NAVY_HEX, sz=4)
        set_cell_vertical_center(cell)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        format_run(run, size=10.5, bold=True, color=WHITE)


def set_column_widths(table):
    for row in table.rows:
        for idx, width in enumerate(COLUMN_WIDTHS_CM):
            row.cells[idx].width = Cm(width)
    for idx, width in enumerate(COLUMN_WIDTHS_CM):
        table.columns[idx].width = Cm(width)


def add_phase_section(document, phase, add_page_break=True):
    if add_page_break:
        document.add_page_break()

    p = document.add_paragraph()
    run = p.add_run(phase["title"])
    format_run(run, size=14, bold=True, color=NAVY)
    p.paragraph_format.space_after = Pt(2)

    p2 = document.add_paragraph()
    run2 = p2.add_run(phase["subtitle"])
    format_run(run2, size=9.5, bold=True, color=RGBColor(0x5B, 0x5B, 0x5B))
    p2.paragraph_format.space_after = Pt(6)

    tasks = phase["tasks"]
    table = document.add_table(rows=1 + len(tasks), cols=len(HEADERS))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    style_header_row(table.rows[0])

    for row_idx, (code, detail, target, output, status) in enumerate(tasks, start=1):
        row = table.rows[row_idx]
        zebra = row_idx % 2 == 0
        bg = ZEBRA_HEX if zebra else "FFFFFF"

        cb_cell = row.cells[0]
        cb_cell.text = ""
        set_cell_shading(cb_cell, bg)
        set_cell_borders(cb_cell)
        set_cell_vertical_center(cb_cell)
        cb_para = cb_cell.paragraphs[0]
        cb_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        add_checkbox(cb_para)

        values = [code, detail, target, output, status]
        for col_idx, value in enumerate(values, start=1):
            cell = row.cells[col_idx]
            cell.text = ""
            set_cell_shading(cell, bg)
            set_cell_borders(cell)
            set_cell_vertical_center(cell)
            para = cell.paragraphs[0]
            if col_idx in (1, 3, 5):
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = para.add_run(value)
            bold = col_idx == 1
            format_run(run, size=9.5, bold=bold, color=NAVY if col_idx == 1 else RGBColor(0x22, 0x22, 0x22))

    set_column_widths(table)
    document.add_paragraph()


def main():
    document = Document()
    set_landscape(document)
    set_default_font(document)

    add_title_block(document)
    add_callout(document)

    for i, phase in enumerate(PHASES):
        add_phase_section(document, phase, add_page_break=(i > 0))

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(root, "deliverables", "Ke_Hoach_Chi_Tiet_Checklist_BoardVerse.docx")
    document.save(output_path)
    total_tasks = sum(len(p["tasks"]) for p in PHASES)
    print(f"DONE: saved to {output_path}")
    print(f"Total phases: {len(PHASES)} | Total granular tasks: {total_tasks}")


if __name__ == "__main__":
    main()
