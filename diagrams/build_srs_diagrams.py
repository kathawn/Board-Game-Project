#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh cac hinh minh hoa dung trong SRS_BoardVerse_v1.0.docx."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts"))
import diagram_kit as dk
import project_data as pd

OUT = os.path.join(os.path.dirname(__file__), "out")


def build():
    # 2.1 - So do ngu canh he thong
    dk.layers(
        ["Khách hàng (web/trình duyệt di động)", "Hệ thống BoardVerse (web app)",
         "Nhân viên kho/quầy & Admin (POS nội bộ)", "Green SM & MoMo (giả định, bên ngoài)"],
        os.path.join(OUT, "srs_2_1_context.png"),
        title="Hình 2.1 – Sơ đồ ngữ cảnh hệ thống (giản lược)",
        width=720,
    )

    # Muc 3.1 (use case), 3.5 (class/ERD), 3.6 (activity/state/sequence) nay duoc trinh bay
    # truc tiep bang code PlantUML trong fill_srs.py (ds.code_block), khong con sinh anh Pillow
    # cho cac so do nay nua.

    # Phu luc A - wireframe cac man hinh chinh
    dk.wireframe(
        [
            (0.05, 0.02, 0.95, 0.09, "Header: Logo BoardVerse | Tìm kiếm | Giỏ hàng | Tài khoản"),
            (0.05, 0.11, 0.95, 0.16, "Bộ lọc: Danh mục | Giá | Trạng thái (Bán/Thuê)"),
            (0.05, 0.18, 0.48, 0.40, "Thẻ sản phẩm 1\n(ảnh, tên, giá)"),
            (0.52, 0.18, 0.95, 0.40, "Thẻ sản phẩm 2"),
            (0.05, 0.42, 0.48, 0.64, "Thẻ sản phẩm 3"),
            (0.52, 0.42, 0.95, 0.64, "Thẻ sản phẩm 4"),
            (0.05, 0.92, 0.95, 0.98, "Footer"),
        ],
        os.path.join(OUT, "srs_appA_wireframe_danhsach.png"), title="SCR-01 Danh sách sản phẩm",
    )
    dk.wireframe(
        [
            (0.05, 0.02, 0.95, 0.09, "Header"),
            (0.05, 0.12, 0.5, 0.40, "Ảnh sản phẩm"),
            (0.55, 0.12, 0.95, 0.26, "Tên, giá bán, giá thuê"),
            (0.55, 0.28, 0.95, 0.40, "Chọn ngày thuê (từ - đến)"),
            (0.55, 0.42, 0.95, 0.52, "Hình thức nhận hàng:\n( ) Tự đến lấy  ( ) Giao vận [khu vực]"),
            (0.55, 0.54, 0.95, 0.60, "[Nút: Thêm vào giỏ / Thuê ngay]"),
            (0.05, 0.63, 0.95, 0.75, "Checklist linh kiện đi kèm"),
            (0.05, 0.78, 0.95, 0.92, "Mô tả chi tiết sản phẩm"),
        ],
        os.path.join(OUT, "srs_appA_wireframe_chitiet.png"), title="SCR-02 Chi tiết sản phẩm & Đặt thuê",
    )
    dk.wireframe(
        [
            (0.05, 0.02, 0.95, 0.09, "Header"),
            (0.1, 0.14, 0.9, 0.22, "Tóm tắt đơn: Sản phẩm, tiền thuê, phí ship, tiền cọc"),
            (0.1, 0.26, 0.9, 0.60, "Mã QR thanh toán động\n(gắn mã đơn + số tiền)"),
            (0.1, 0.64, 0.9, 0.72, "Trạng thái: Đang chờ thanh toán..."),
            (0.1, 0.76, 0.9, 0.86, "Hướng dẫn: Quét QR bằng ví MoMo hoặc app ngân hàng hỗ trợ VietQR"),
        ],
        os.path.join(OUT, "srs_appA_wireframe_thanhtoan.png"), title="SCR-06 Thanh toán mã QR",
    )
    dk.wireframe(
        [
            (0.05, 0.02, 0.95, 0.09, "Header"),
            (0.1, 0.14, 0.9, 0.24, "Đơn thuê #... — Hạn trả: dd/mm/yyyy"),
            (0.1, 0.30, 0.9, 0.42, "Hình thức trả hàng:\n( ) Tự mang ra quán  ( ) Gọi giao vận đến lấy"),
            (0.1, 0.46, 0.9, 0.56, "Khu vực lấy hàng (nếu chọn giao vận) + Phí ship dự kiến"),
            (0.1, 0.60, 0.9, 0.70, "[Nút: Xác nhận yêu cầu]"),
            (0.1, 0.74, 0.9, 0.86, "Trạng thái vận chuyển: Mã vận đơn, Đang lấy/Đã lấy"),
        ],
        os.path.join(OUT, "srs_appA_wireframe_giaovan.png"), title="SCR-07 Yêu cầu giao vận lấy hàng trả",
    )

    print("Da sinh xong cac hinh SRS vao", OUT)


if __name__ == "__main__":
    build()
