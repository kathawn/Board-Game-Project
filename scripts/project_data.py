#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Du lieu gia dinh dung chung cho du an BoardVerse.
Dung boi fill_brd.py, fill_srs.py, build_sdd.py va cac script ve hinh
de dam bao so lieu nhat quan giua 3 cuon BRD / SRS / SDD.
TOAN BO so lieu trong file nay la GIA DINH, phuc vu do an ca nhan.
"""

ORG_NAME = "Cửa hàng BoardVerse"
ORG_FULL = "Hộ kinh doanh BoardVerse (giả định)"
ORG_ADDRESS = "Quận 1, TP. Hồ Chí Minh"
PROJECT_NAME = "BoardVerse"
AUTHOR = "Nguyễn Minh Quân"

ORG_OVERVIEW = (
    "BoardVerse là một cửa hàng giả định chuyên mua bán và cho thuê board game tại "
    f"{ORG_ADDRESS}, hoạt động từ năm 2021. Cửa hàng có 1 địa điểm vật lý rộng 150m², "
    "khoảng 500 tựa board game trong kho (bao gồm cả bản bán và bản cho thuê), 8 nhân sự "
    "(2 quản lý quầy, 4 nhân viên kho/quầy, 1 kế toán, 1 quản lý vận hành) và phục vụ trung "
    "bình 300 lượt khách thuê/tháng, 120 đơn bán/tháng. Khách hàng chính là người chơi board "
    "game cá nhân, các nhóm/hội board game tổ chức sự kiện, và một số quán cà phê board game "
    "nhỏ thuê lại theo lô."
)

# ---------------------------------------------------------------------------
# Pain points (As-Is) - dung o BRD 3.3, lam dau vao cho 3.4 (root cause) va 7.1
# ---------------------------------------------------------------------------
PAIN_POINTS = [
    ("PP-01", "Thất lạc linh kiện trong board game cho thuê", "Khoảng 15% lượt trả hàng/quý bị thiếu ít nhất 1 linh kiện; nhân viên kiểm đếm bằng mắt, không có checklist chuẩn.", "Cao"),
    ("PP-02", "Nhầm lẫn/thất thoát tiền đặt cọc", "Cọc được ghi tay vào sổ hoặc nhắn Zalo, không có mã tra cứu; trung bình 3 vụ khiếu nại/tháng về số tiền cọc không khớp.", "Cao"),
    ("PP-03", "Trùng lịch thuê do không kiểm tra tồn kho theo thời gian thực", "Nhân viên quầy không biết sản phẩm đã được giữ chỗ bởi đơn khác, dẫn đến hẹn khách rồi huỷ, trung bình 5 lượt/tháng.", "Trung"),
    ("PP-04", "Thời gian xử lý 1 đơn thuê kéo dài", "Từ lúc khách chọn game đến lúc xác nhận, lập phiếu, tính tiền mất khoảng 15 phút vì phải tra giá, tính lũy tiến bằng tay.", "Trung"),
    ("PP-05", "Không có dữ liệu tổng hợp để báo cáo", "Doanh thu bán/thuê theo tháng phải cộng tay từ nhiều sổ Excel rời rạc, dễ sai sót, mất 1-2 ngày cuối tháng.", "Thấp"),
]

# ---------------------------------------------------------------------------
# Business Objectives (SMART) - BRD 4.1
# ---------------------------------------------------------------------------
BUSINESS_OBJECTIVES = [
    ("BO-01", "Giảm tỷ lệ thất lạc/hư hỏng linh kiện khi trả hàng từ 15% xuống còn 5% số lượt trả, trong vòng 6 tháng kể từ ngày hệ thống go-live.", "PP-01"),
    ("BO-02", "Tăng tỷ trọng đơn thuê được đặt qua kênh online (web) từ 0% lên 60% tổng số đơn thuê, trong vòng 6 tháng kể từ go-live.", "PP-03, PP-04"),
    ("BO-03", "Giảm thời gian xử lý trung bình 1 đơn thuê tại quầy từ 15 phút xuống còn 3 phút, trong vòng 3 tháng kể từ go-live.", "PP-04"),
    ("BO-04", "Tăng doanh thu cho thuê 20% so với cùng kỳ năm trước, trong vòng 12 tháng kể từ go-live, nhờ mở rộng kênh đặt online.", "PP-04, PP-05"),
    ("BO-05", "Giảm số vụ khiếu nại sai lệch tiền đặt cọc xuống 0 vụ/tháng, trong vòng 3 tháng kể từ go-live.", "PP-02"),
]

# ---------------------------------------------------------------------------
# KPI - BRD 4.2 (BO, ten KPI, baseline, target, cach do, tan suat)
# ---------------------------------------------------------------------------
KPIS = [
    ("BO-01", "Tỷ lệ lượt trả hàng bị thiếu/hư hỏng linh kiện", "15%", "≤ 5%", "Số lượt trả thiếu/hư hỏng ÷ tổng lượt trả, theo checklist kiểm đếm trong hệ thống", "Theo tháng"),
    ("BO-02", "Tỷ trọng đơn thuê đặt qua kênh online", "0%", "≥ 60%", "Số đơn thuê có nguồn = 'Online' ÷ tổng số đơn thuê", "Theo tháng"),
    ("BO-03", "Thời gian xử lý trung bình 1 đơn thuê tại quầy", "15 phút", "≤ 3 phút", "Thời điểm xác nhận đơn trừ thời điểm bắt đầu tạo đơn trên hệ thống POS", "Theo tuần"),
    ("BO-04", "Doanh thu cho thuê theo tháng", "Mức nền năm trước (baseline nội bộ)", "+20% so với cùng kỳ", "Tổng tiền thuê đã thu trừ hoàn cọc, trích từ báo cáo hệ thống", "Theo tháng"),
    ("BO-05", "Số vụ khiếu nại sai lệch tiền cọc", "3 vụ/tháng", "0 vụ/tháng", "Số phiếu khiếu nại liên quan đến cọc được ghi nhận trong hệ thống", "Theo tháng"),
]

# ---------------------------------------------------------------------------
# Scope - BRD 5.1 / 5.2
# ---------------------------------------------------------------------------
IN_SCOPE = [
    ("SC-01", "Quản lý danh mục sản phẩm board game (thông tin, hình ảnh, giá bán, giá thuê, tồn kho)."),
    ("SC-02", "Bán board game trực tuyến và tại quầy (tạo đơn, thanh toán, xuất hoá đơn nội bộ)."),
    ("SC-03", "Cho thuê board game theo ngày, kiểm tra tồn kho theo khoảng thời gian thuê để tránh trùng lịch."),
    ("SC-04", "Quản lý đặt cọc: thu cọc, tính phạt trễ hạn, quyết toán và hoàn cọc."),
    ("SC-05", "Quản lý kho: nhập kho, xuất kho, kiểm đếm linh kiện theo checklist từng tựa game, cập nhật trạng thái hộp game."),
    ("SC-06", "Quản lý khách hàng (đăng ký, đăng nhập, lịch sử đơn mua/thuê)."),
    ("SC-07", "Báo cáo doanh thu cơ bản theo ngày/tháng cho Admin."),
    ("SC-08", "Giao vận hai chiều (nhận hàng và trả hàng) thông qua tích hợp đối tác giao vận bên thứ ba, tính phí theo khu vực."),
    ("SC-09", "Thanh toán trực tuyến qua mã QR (ví điện tử/tài khoản ngân hàng) thông qua cổng thanh toán, áp dụng cho tiền hàng/tiền cọc/tiền thuê."),
]

OUT_OF_SCOPE = [
    ("OS-01", "Tự vận hành đội ngũ shipper/giao vận nội bộ", "Hệ thống chỉ tích hợp với đối tác giao vận bên thứ ba Green SM (giả định) qua API để tạo yêu cầu giao/lấy hàng, không tuyển dụng hoặc quản lý nhân sự giao hàng riêng."),
    ("OS-02", "Bảo hiểm sản phẩm cho thuê", "Chưa có đối tác bảo hiểm giả định; rủi ro hư hỏng xử lý bằng quy chế đền bù (BRU-04) thay vì bảo hiểm."),
    ("OS-03", "Thanh toán quốc tế / đa tiền tệ", "Khách hàng mục tiêu hiện tại chỉ ở thị trường trong nước, dùng VNĐ."),
    ("OS-04", "Bán sỉ / đại lý nhượng quyền", "Mô hình kinh doanh hiện tại là bán lẻ/cho thuê trực tiếp, không có kênh phân phối sỉ."),
    ("OS-05", "Ứng dụng di động riêng (native app)", "Chỉ xây dựng web responsive dùng tốt trên cả máy tính và di động, không phát triển app iOS/Android riêng trong phạm vi đồ án."),
]

ASSUMPTIONS = [
    ("AS-01", "Khách hàng có thiết bị và kết nối Internet để đặt thuê/mua online.", "Nếu sai: tỷ trọng đơn online (BO-02) khó đạt, cần duy trì kênh tại quầy lâu hơn dự kiến.", "Quản lý vận hành"),
    ("AS-02", "Nhân viên kho đồng ý tuân thủ checklist kiểm đếm linh kiện theo từng tựa game.", "Nếu sai: PP-01 không cải thiện dù có hệ thống hỗ trợ.", "Quản lý vận hành"),
    ("AS-03", "Chủ đầu tư đồng ý giữ nguyên chính sách cọc 100% giá niêm yết trong năm đầu vận hành.", "Nếu sai: cần thiết kế lại BRU-01 và toàn bộ luồng tính cọc.", "Chủ đầu tư"),
]

CONSTRAINTS = [
    ("CT-01", "Ngân sách phát triển tối đa 90.000.000 VNĐ cho giai đoạn xây dựng hệ thống (ước tính ở mục 9.1)."),
    ("CT-02", "Thời gian triển khai tối đa 6 tháng kể từ khi BRD được Sign-off đến khi go-live."),
    ("CT-03", "Hệ thống phải chạy được trên hạ tầng chi phí thấp (hosting/PaaS phổ biến), không yêu cầu máy chủ riêng."),
    ("CT-04", "Toàn bộ nội dung hiển thị cho người dùng phải bằng tiếng Việt."),
    ("CT-05", "Việc tích hợp với đối tác giao vận và cổng thanh toán chỉ ở mức giả lập API (mock) phục vụ đồ án, không phát sinh chi phí hợp tác thực tế với nhà cung cấp bên thứ ba."),
]

DEPENDENCIES = [
    ("DP-01", "Chủ đầu tư (giả định)", "Phê duyệt bảng giá thuê/bán và chính sách cọc trước khi lập trình module tính giá.", "Trước khi bắt đầu Giai đoạn 3 (SDD)."),
    ("DP-02", "Nhà cung cấp dịch vụ hosting/PaaS", "Cấp môi trường chạy thử (staging) cho ứng dụng.", "Trước khi bắt đầu Giai đoạn 4 (Lập trình)."),
    ("DP-03", "Green SM (giả định)", "Cung cấp API tạo yêu cầu giao/lấy hàng và webhook cập nhật trạng thái vận chuyển.", "Trước khi bắt đầu Giai đoạn 3 (SDD)."),
    ("DP-04", "MoMo (giả định)", "Cung cấp API sinh mã QR động và webhook xác nhận thanh toán.", "Trước khi bắt đầu Giai đoạn 3 (SDD)."),
]

# ---------------------------------------------------------------------------
# Stakeholders - BRD 6.1
# ---------------------------------------------------------------------------
STAKEHOLDERS = [
    ("Khách cá nhân", "Bên ngoài", "Thuê/mua board game nhanh, minh bạch tiền cọc, không mất thời gian chờ tại quầy."),
    ("Khách nhóm/hội board game", "Bên ngoài", "Thuê số lượng lớn cho sự kiện, cần giữ chỗ trước và biết chắc tồn kho."),
    ("Nhân viên kho/quầy (Staff)", "Bên trong", "Công cụ kiểm đếm, xuất/nhập kho nhanh, giảm việc ghi chép tay."),
    ("Quản lý vận hành (Admin)", "Bên trong", "Số liệu báo cáo chính xác, kiểm soát được tồn kho và dòng tiền cọc."),
    ("Chủ đầu tư", "Bên trong", "Tăng doanh thu, kiểm soát chi phí đầu tư, thu hồi vốn trong thời gian hợp lý."),
    ("Green SM (giả định)", "Bên ngoài", "Nhận yêu cầu giao/lấy hàng rõ ràng qua API, được thanh toán phí ship đúng và kịp thời."),
    ("Giảng viên hướng dẫn (vai trò phê duyệt giả định)", "Bên ngoài", "Tài liệu đúng chuẩn phương pháp luận, có thể bảo vệ đồ án."),
]

# ---------------------------------------------------------------------------
# Business Rules (Yeu cau nghiep vu BR) - BRD 8.1
# ---------------------------------------------------------------------------
BUSINESS_REQUIREMENTS = [
    ("BR-01", "Hệ thống phải cho phép khách hàng tạo đơn thuê board game theo khoảng ngày do khách chọn.", "BO-02", "Must"),
    ("BR-02", "Hệ thống phải tính tiền cọc và tiền thuê tự động theo quy tắc BRU-01, BRU-02.", "BO-03, BO-05", "Must"),
    ("BR-03", "Hệ thống phải cho phép nhân viên kho ghi nhận kết quả kiểm đếm linh kiện khi nhập/xuất kho theo checklist từng tựa game.", "BO-01", "Must"),
    ("BR-04", "Hệ thống phải tính tiền phạt trễ hạn và số tiền hoàn cọc tự động theo quy tắc BRU-03, BRU-04.", "BO-05", "Must"),
    ("BR-05", "Hệ thống phải ngăn việc đặt thuê một sản phẩm trùng khoảng ngày với một đơn thuê khác đang còn hiệu lực trên sản phẩm đó.", "BO-02, BO-03", "Must"),
    ("BR-06", "Hệ thống nên gửi thông báo nhắc hạn trả hàng cho khách trước ngày hết hạn thuê.", "BO-01", "Should"),
    ("BR-07", "Hệ thống nên cung cấp báo cáo doanh thu bán/thuê theo tháng cho Admin.", "BO-04", "Should"),
    ("BR-08", "Hệ thống có thể cho phép khách hàng xem lịch sử đơn mua/thuê của chính mình.", "BO-02", "Could"),
    ("BR-09", "Hệ thống phải cho phép khách hàng chọn hình thức nhận hàng (tự đến lấy hoặc giao vận) và hình thức trả hàng (tự mang trả hoặc gọi giao vận đến lấy), tính phí giao vận theo khu vực.", "BO-02, BO-04", "Must"),
    ("BR-10", "Hệ thống phải cho phép khách hàng thanh toán trực tuyến bằng mã QR qua cổng thanh toán (ví điện tử/ngân hàng).", "BO-02, BO-05", "Must"),
]

# ---------------------------------------------------------------------------
# Quy tac nghiep vu (BRU) - BRD 8.2 - SO LIEU GOC, SRS/SDD se tai su dung
# ---------------------------------------------------------------------------
BRU_01 = (
    "BRU-01", "Đặt cọc khi thuê",
    "Nếu khách đặt thuê một sản phẩm thì hệ thống phải thu cọc trước khi xuất kho, với số tiền cọc = giá niêm yết bán của sản phẩm (100%) "
    "+ phí giao vận theo BRU-05 (nếu khách chọn giao vận ở chiều nhận hàng) × 2 (dự trù cho cả chiều nhận và chiều trả); nếu khách chọn tự "
    "đến lấy ở chiều nhận hàng thì cọc = giá niêm yết, không cộng phí ship. Chênh lệch phí ship giữa số đã giữ cọc và số thực tế phát sinh ở "
    "chiều trả hàng được điều chỉnh (hoàn thêm hoặc thu thêm) khi quyết toán hoàn cọc, cùng lúc với phạt trễ hạn (BRU-03) và đền bù (BRU-04) nếu có.",
    "Chính sách nội bộ chủ đầu tư (giả định)", "BR-02, BR-09",
)
BRU_02 = (
    "BRU-02", "Đơn giá thuê theo ngày (lũy tiến giảm)",
    "Nếu khách thuê N ngày thì đơn giá thuê = 10% giá niêm yết cho ngày thứ 1, 7% giá niêm yết cho mỗi ngày từ ngày thứ 2 đến ngày thứ 10, "
    "và 5% giá niêm yết cho mỗi ngày từ ngày thứ 11 trở đi; tổng tiền thuê = tổng đơn giá các ngày.",
    "Chính sách giá nội bộ chủ đầu tư (giả định)", "BR-02",
)
BRU_03 = (
    "BRU-03", "Phạt trễ hạn trả hàng",
    "Nếu khách trả hàng sau ngày hết hạn thuê thì mỗi ngày trễ bị phạt 15% giá niêm yết của sản phẩm, tổng mức phạt tối đa không vượt quá "
    "100% giá niêm yết (bằng đúng số tiền cọc đã giữ).",
    "Chính sách nội bộ chủ đầu tư (giả định)", "BR-04",
)
BRU_04 = (
    "BRU-04", "Quy chế đền bù khi mất/hư hỏng linh kiện",
    "Nếu linh kiện bị mất/hư hỏng khi trả hàng thì: (a) với linh kiện độc bản không thể mua lẻ thay thế, khách đền 100% giá trị nguyên bộ sản "
    "phẩm; (b) với phụ kiện có thể mua lẻ thay thế, khách đền theo giá linh kiện lẻ niêm yết, hoặc 20% giá trị nguyên bộ nếu nhà phân phối "
    "không bán lẻ linh kiện đó.",
    "Chính sách nội bộ chủ đầu tư (giả định)", "BR-04",
)
BRU_05 = (
    "BRU-05", "Phí giao vận theo khu vực",
    "Nếu khách chọn hình thức giao vận (ở chiều nhận hàng hoặc chiều trả hàng) thì phí giao vận cho chiều đó được tính theo khu vực giao "
    "nhận do đối tác giao vận Green SM (giả định) báo giá qua API tại thời điểm đặt: Nội thành = 20.000 VNĐ, Ngoại thành = 35.000 VNĐ, Ngoài tỉnh = "
    "60.000 VNĐ; nếu khách chọn tự đến lấy/tự mang trả ở chiều đó thì phí giao vận chiều đó bằng 0.",
    "Chính sách nội bộ chủ đầu tư, báo giá giả định của Green SM", "BR-09",
)
BRU_06 = (
    "BRU-06", "Thanh toán trực tuyến qua mã QR",
    "Nếu khách chọn thanh toán trực tuyến thì hệ thống phải gọi cổng thanh toán MoMo (giả định) để sinh mã QR động gắn với đúng mã đơn và số "
    "tiền cần thu (cọc, tiền hàng hoặc tiền còn thiếu khi quyết toán); đơn chỉ được xác nhận là đã thanh toán sau khi hệ thống nhận được "
    "webhook xác nhận thành công từ MoMo, không chấp nhận xác nhận thủ công bằng lời khách báo.",
    "Chính sách nội bộ chủ đầu tư (giả định)", "BR-10",
)
BUSINESS_RULES = [BRU_01, BRU_02, BRU_03, BRU_04, BRU_05, BRU_06]

# ---------------------------------------------------------------------------
# Nhom nguoi dung & NFR muc nghiep vu - BRD 8.3 / 8.4
# ---------------------------------------------------------------------------
USER_GROUPS_BUSINESS = [
    ("Khách cá nhân/nhóm", "Xem sản phẩm, đặt mua/đặt thuê, chọn hình thức nhận/trả hàng, thanh toán online, theo dõi đơn, nhận hoàn cọc đúng hạn.", "BR-01, BR-02, BR-08, BR-09, BR-10"),
    ("Nhân viên kho/quầy", "Xác nhận đơn, kiểm đếm linh kiện, xuất/nhập kho nhanh và chính xác.", "BR-03"),
    ("Quản lý vận hành (Admin)", "Xem báo cáo, quản lý danh mục sản phẩm và giá, theo dõi tồn kho.", "BR-07"),
]

NFR_BUSINESS = [
    ("Hiệu năng", "Trang danh sách sản phẩm phải hiển thị trong vòng 3 giây với đường truyền 4G thông thường."),
    ("Bảo mật", "Thông tin tài khoản và lịch sử giao dịch của khách phải được bảo vệ, chỉ chủ tài khoản và Admin truy cập được."),
    ("Dễ dùng", "Nhân viên quầy mới phải thao tác được luồng tạo đơn thuê cơ bản sau tối đa 30 phút hướng dẫn."),
]

TRANSITION_REQUIREMENTS = [
    ("Chuyển dữ liệu", "Nhập lại danh mục ~500 sản phẩm hiện có từ file Excel vào hệ thống mới trước go-live.", "Quản lý vận hành", "100% sản phẩm đang kinh doanh có trong hệ thống."),
    ("Đào tạo", "Đào tạo 4 nhân viên kho/quầy và 1 Admin sử dụng hệ thống.", "Quản lý vận hành", "Toàn bộ nhân sự hoàn thành checklist thao tác mẫu."),
    ("Chạy song song", "Chạy song song hệ thống mới và sổ sách/Excel cũ trong 2 tuần đầu để đối chiếu.", "Quản lý vận hành", "Không phát sinh sai lệch dữ liệu giữa 2 hệ thống trong 2 tuần."),
]

# ---------------------------------------------------------------------------
# 5 tua game mau (dung o SDD seed data va checklist linh kien)
# ---------------------------------------------------------------------------
SAMPLE_GAMES = [
    ("Cờ Tỷ Phú (Monopoly bản Việt hoá)", "Chiến thuật - Kinh doanh", 2, 6, 450000,
     ["Bàn cờ", "2 xúc xắc", "6 quân cờ hình", "Bộ tiền giấy (7 mệnh giá)", "28 thẻ sở hữu đất", "Thẻ Cơ hội", "Thẻ Khế ước", "32 nhà, 12 khách sạn gỗ"]),
    ("Ma Sói (Werewolves)", "Suy luận - Xã hội", 8, 18, 220000,
     ["Bộ bài vai trò (18 lá)", "Thẻ Đêm/Ngày", "Hướng dẫn luật chơi", "Hộp đựng bài"]),
    ("Catan", "Chiến thuật - Xây dựng", 3, 4, 790000,
     ["19 ô địa hình lục giác", "Khung viền biển", "18 thẻ cảng", "Bộ tài nguyên (gỗ, đất sét, lúa, len, quặng)", "25 thẻ phát triển",
      "95 nhà/đường/thành gỗ (4 màu)", "2 xúc xắc", "Thẻ cướp biển"]),
    ("UNO", "Bài - Gia đình", 2, 10, 95000,
     ["Bộ 108 lá bài UNO", "Hộp nhựa đựng bài", "Hướng dẫn luật chơi"]),
    ("Cờ Cá Ngựa", "Gia đình - Trẻ em", 2, 4, 85000,
     ["Bàn cờ gấp", "4 bộ quân cá ngựa (4 con/màu)", "1 xúc xắc", "Hộp đựng quân"]),
]

# ---------------------------------------------------------------------------
# Actor & Use case - SRS 3.2 / 3.3 (ACT-xx, UC-xx)
# ---------------------------------------------------------------------------
ACTORS = [
    ("ACT-01", "Customer (Khách hàng)", "Người", "Khách cá nhân hoặc đại diện khách nhóm, xem/mua/thuê sản phẩm trên web."),
    ("ACT-02", "Staff (Nhân viên kho/quầy)", "Người", "Xác nhận đơn, xuất/nhập kho, kiểm đếm linh kiện tại quầy."),
    ("ACT-03", "Admin (Quản lý vận hành)", "Người", "Quản lý danh mục sản phẩm, giá, xem báo cáo."),
    ("ACT-04", "Green SM (giả định)", "Hệ thống ngoài", "Đối tác giao vận: nhận yêu cầu giao/lấy hàng qua API, báo giá phí ship theo khu vực, gửi webhook cập nhật trạng thái vận chuyển."),
    ("ACT-05", "MoMo (giả định)", "Hệ thống ngoài", "Cổng thanh toán: sinh mã QR thanh toán động theo mã đơn/số tiền, gửi webhook xác nhận kết quả thanh toán."),
]

USE_CASES = [
    ("UC-01", "Đăng ký / Đăng nhập tài khoản", "Customer", "Bán hàng"),
    ("UC-02", "Xem danh sách và chi tiết sản phẩm", "Customer", "Bán hàng"),
    ("UC-03", "Đặt mua sản phẩm (Checkout)", "Customer", "Bán hàng"),
    ("UC-04", "Đặt thuê theo ngày", "Customer", "Cho thuê"),
    ("UC-05", "Xác nhận đặt cọc", "Staff", "Cho thuê"),
    ("UC-06", "Bàn giao xuất kho", "Staff", "Cho thuê"),
    ("UC-07", "Quyết toán hoàn cọc", "Staff", "Cho thuê"),
    ("UC-08", "Kiểm đếm linh kiện nhập kho", "Staff", "Quản lý kho"),
    ("UC-09", "Cập nhật trạng thái hộp game", "Staff", "Quản lý kho"),
    ("UC-10", "Thanh toán trực tuyến qua mã QR", "Customer", "Thanh toán & Giao vận"),
    ("UC-11", "Yêu cầu giao vận lấy hàng trả", "Customer", "Thanh toán & Giao vận"),
    ("UC-12", "Nhận cập nhật trạng thái giao vận", "Green SM (giả định)", "Thanh toán & Giao vận"),
]

CORE_UCS = ["UC-04", "UC-10", "UC-06", "UC-08", "UC-07", "UC-11"]
# dac ta day du: Dat thue theo ngay, Thanh toan QR, Ban giao xuat kho, Kiem dem nhap kho, Quyet toan hoan coc, Yeu cau giao van lay hang tra

# ---------------------------------------------------------------------------
# Tien do & ngan sach - BRD 9 / 11
# ---------------------------------------------------------------------------
COSTS_ONE_TIME = [
    ("Phân tích & thiết kế nghiệp vụ (BA)", "28.000.000 VNĐ", "Quy đổi 2 tháng công BA x 14.000.000 VNĐ/tháng (mức lương BA thị trường, giả định)"),
    ("Phát triển phần mềm (lập trình, có AI hỗ trợ)", "45.000.000 VNĐ", "Quy đổi 1,5 tháng công lập trình viên x 30.000.000 VNĐ/tháng (mức lương dev thị trường, giả định)"),
    ("Thiết kế UI/UX (wireframe, mockup)", "5.000.000 VNĐ", "Quy đổi công thiết kế 10 giờ"),
    ("Mua tên miền & chứng chỉ SSL (năm đầu)", "600.000 VNĐ", "Giá niêm yết nhà cung cấp domain phổ biến"),
]
COSTS_RECURRING_YEARLY = [
    ("Hosting/PaaS (web + CSDL)", "3.600.000 VNĐ/năm", "Gói cơ bản nhà cung cấp PaaS phổ biến, quy đổi 300.000đ/tháng"),
    ("Duy trì tên miền", "600.000 VNĐ/năm", "Phí gia hạn hàng năm"),
    ("Bảo trì & sửa lỗi nhỏ", "6.000.000 VNĐ/năm", "Quy đổi 12 giờ công/năm x 500.000đ/giờ"),
]

RISKS = [
    ("RISK-01", "Nhân viên không tuân thủ checklist kiểm đếm linh kiện trên hệ thống mới.", "Trung bình", "Cao", "Đào tạo kỹ, gắn kiểm đếm vào luồng xuất/nhập kho bắt buộc, không cho bỏ qua bước."),
    ("RISK-02", "Khách hàng không quen đặt thuê online, vẫn gọi điện/nhắn Zalo như cũ.", "Cao", "Trung bình", "Ưu đãi nhỏ cho đơn đặt online trong tháng đầu, hướng dẫn trực tiếp tại quầy."),
    ("RISK-03", "Sai sót khi nhập lại danh mục ~500 sản phẩm từ Excel cũ.", "Trung bình", "Trung bình", "Chạy song song 2 tuần (mục 8.5) để đối chiếu trước khi tắt hệ thống cũ."),
    ("RISK-04", "Hạ tầng PaaS miễn phí/giá rẻ giới hạn tài nguyên khi lượng truy cập tăng.", "Thấp", "Trung bình", "Theo dõi tải hệ thống, có phương án nâng cấp gói trả phí khi cần."),
]

APPROVERS = [
    ("Chủ đầu tư (giả định)", "Đại diện bên đặt hàng", "Phê duyệt phạm vi, mục tiêu và ngân sách."),
    ("Quản lý vận hành (giả định)", "Đại diện nghiệp vụ", "Xác nhận quy trình nghiệp vụ và quy tắc BRU đúng thực tế."),
    ("Giảng viên hướng dẫn (giả định)", "Vai trò phê duyệt độc lập (giả định)", "Phê duyệt chất lượng tài liệu theo phương pháp luận."),
]

TECH_STACK = [
    ("Frontend", "Next.js (App Router) + TypeScript", "Server-side rendering tốt cho SEO trang sản phẩm, cấu trúc route rõ ràng."),
    ("UI Styling", "Tailwind CSS + Shadcn UI", "Dựng giao diện nhanh, đồng bộ, dễ tuỳ biến theo thiết kế wireframe."),
    ("ORM", "Prisma ORM", "Định nghĩa schema rõ ràng, migrate nhanh, sinh type-safe client cho TypeScript."),
    ("Cơ sở dữ liệu", "PostgreSQL", "CSDL quan hệ, hỗ trợ tốt ràng buộc khoá ngoại và kiểu Enum cần cho trạng thái đơn/hộp game."),
    ("Triển khai", "Vercel (ứng dụng) + Railway/Supabase (PostgreSQL)", "Gói miễn phí/giá rẻ phù hợp đồ án cá nhân, CI/CD tự động khi push GitHub."),
]
