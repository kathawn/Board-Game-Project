#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh cac hinh minh hoa dung trong BRD_BoardVerse_v1.0.docx."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import diagram_kit as dk

OUT = os.path.join(os.path.dirname(__file__), "out")


def build():
    paths = {}

    paths["asis"] = dk.flowchart_vertical(
        [
            ("Bắt đầu: Khách hỏi tình trạng game qua điện thoại/Zalo", "start"),
            ("Nhân viên tra sổ/Excel thủ công để kiểm tra tồn kho", "process"),
            ("Còn hàng đúng ngày khách cần?", "decision"),
            ("Báo khách hết hàng / hẹn lại", "process", "Không"),
            ("Khách đến quầy, chọn game, nộp cọc tiền mặt", "process", "Có"),
            ("Nhân viên ghi tay thông tin thuê và số cọc vào sổ", "process"),
            ("Giao game cho khách, khách mang về sử dụng", "process"),
            ("Khách mang trả game đúng/trễ hạn", "process"),
            ("Nhân viên kiểm đếm linh kiện bằng mắt, không checklist", "process"),
            ("Đủ linh kiện, đúng hạn?", "decision"),
            ("Ghi biên bản đền bù / phạt trễ hạn bằng tay", "process", "Không"),
            ("Hoàn cọc còn lại bằng tiền mặt, không có phiếu xác nhận", "process", "Có / sau khi đền bù"),
            ("Kết thúc", "end"),
        ],
        os.path.join(OUT, "brd_3_3_asis_flowchart.png"),
        title="Hình 3.1 – Quy trình thuê/trả board game hiện tại (As-Is)",
        width=820,
    )

    paths["fishbone"] = dk.fishbone(
        "Thất lạc linh kiện &\nnhầm lẫn tiền cọc",
        [
            ("Con người", ["Thiếu đào tạo kiểm đếm", "Bàn giao ca không rõ ràng"]),
            ("Quy trình", ["Không có checklist chuẩn theo từng game", "Ghi cọc bằng tay dễ nhầm số"]),
            ("Công cụ", ["Dùng nhiều file Excel rời rạc", "Không kiểm tra trùng lịch tự động"]),
            ("Dữ liệu", ["Không lưu lịch sử thuê theo khách", "Không có mã tra cứu đơn/cọc"]),
        ],
        os.path.join(OUT, "brd_3_4_fishbone.png"),
    )

    paths["power_interest"] = dk.grid2x2(
        [
            ("Chủ đầu tư", 0.92, 0.92),
            ("Quản lý vận hành (Admin)", 0.8, 0.85),
            ("Nhân viên kho/quầy", 0.3, 0.72),
            ("Khách nhóm/hội board game", 0.28, 0.55),
            ("Khách cá nhân", 0.2, 0.32),
            ("Giảng viên hướng dẫn", 0.5, 0.6),
        ],
        os.path.join(OUT, "brd_6_2_power_interest.png"),
        title="Hình 6.1 – Ma trận Quyền lực – Quan tâm (Power-Interest Grid)",
    )

    paths["tobe"] = dk.flowchart_vertical(
        [
            ("Bắt đầu: Khách xem tồn kho thời gian thực trên website", "start"),
            ("Khách chọn ngày thuê, hệ thống tự kiểm tra trùng lịch", "process"),
            ("Sản phẩm còn trống đúng khoảng ngày chọn?", "decision"),
            ("Hệ thống gợi ý sản phẩm khác/ngày khác", "process", "Không"),
            ("Khách đặt thuê & thanh toán cọc online (BRU-01)", "process", "Có"),
            ("Hệ thống tự tính tiền thuê theo biểu giá lũy tiến (BRU-02)", "process"),
            ("Nhân viên xác nhận đơn và xuất kho trên hệ thống", "process"),
            ("Hệ thống tự nhắc hạn trả trước ngày hết hạn (BR-06)", "process"),
            ("Khách trả hàng, nhân viên kiểm đếm theo checklist điện tử", "process"),
            ("Đủ linh kiện, đúng hạn?", "decision"),
            ("Hệ thống tự tính phạt trễ hạn/đền bù (BRU-03, BRU-04)", "process", "Không"),
            ("Hệ thống tự tính và thực hiện hoàn cọc, gửi phiếu xác nhận", "process", "Có / sau khi tính phạt"),
            ("Kết thúc", "end"),
        ],
        os.path.join(OUT, "brd_7_2_tobe_flowchart.png"),
        title="Hình 7.1 – Quy trình thuê/trả board game với hệ thống BoardVerse (To-Be)",
        width=820,
    )

    for k, v in paths.items():
        print(k, "->", v)


if __name__ == "__main__":
    build()
