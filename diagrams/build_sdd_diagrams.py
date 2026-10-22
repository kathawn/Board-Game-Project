#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh cac hinh minh hoa dung trong SDD_BoardVerse_v1.0.docx."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import diagram_kit as dk

OUT = os.path.join(os.path.dirname(__file__), "out")


def build():
    dk.layers(
        [
            "Presentation — Next.js App Router (React Server/Client Components)",
            "Application/Service — Server Actions & Route Handlers (xử lý nghiệp vụ, quy tắc BRU-01..04)",
            "Data Access — Prisma ORM (Repository/Client)",
            "Database — PostgreSQL",
        ],
        os.path.join(OUT, "sdd_1_architecture.png"),
        title="Hình 1 – Kiến trúc phần mềm tổng thể (Layered Architecture)",
        width=820, layer_h=80,
    )

    dk.tree(
        "BoardVerse (trang chủ)",
        [
            (None, "Danh sách sản phẩm\n(SCR-01)"),
            (None, "Chi tiết sản phẩm\n& Đặt thuê (SCR-02)"),
            (None, "Giỏ hàng /\nThanh toán (SCR-03)"),
            (None, "Thanh toán\nmã QR (SCR-06)"),
            (None, "Giao vận lấy hàng\ntrả (SCR-07)"),
            (None, "Đăng nhập /\nĐăng ký"),
            (None, "POS nội bộ:\nKho (SCR-04)"),
            (None, "POS nội bộ:\nBáo cáo (SCR-05)"),
        ],
        os.path.join(OUT, "sdd_sitemap.png"), title="Hình 2 – Sitemap tổng thể", width=1180,
    )

    dk.flowchart_vertical(
        [
            ("Trang chủ / Danh sách sản phẩm", "start"),
            ("Chi tiết sản phẩm & chọn ngày thuê", "process"),
            ("Đã đăng nhập?", "decision"),
            ("Chuyển hướng Đăng nhập/Đăng ký", "process", "Không"),
            ("Giỏ hàng / Chọn hình thức nhận hàng (SCR-03)", "process", "Có"),
            ("Thanh toán mã QR (SCR-06)", "process"),
            ("Trang theo dõi đơn hàng / Yêu cầu giao vận trả (SCR-07)", "end"),
        ],
        os.path.join(OUT, "sdd_navigation_flow.png"),
        title="Hình 3 – Luồng điều hướng (Navigation Flow) phía khách hàng", width=680,
    )

    dk.wireframe(
        [
            (0.05, 0.03, 0.95, 0.10, "Header: Giỏ hàng"),
            (0.05, 0.13, 0.95, 0.45, "Danh sách sản phẩm đã chọn: tên, ngày thuê/mua, đơn giá, phí ship dự kiến"),
            (0.05, 0.48, 0.95, 0.62, "Tổng tiền hàng + Tổng tiền cọc (nếu có thuê)"),
            (0.05, 0.65, 0.95, 0.78, "Chọn hình thức nhận hàng\n( ) Tự đến lấy  ( ) Giao vận [khu vực]"),
            (0.05, 0.81, 0.95, 0.92, "[Nút: Tiến hành thanh toán → SCR-06]"),
        ],
        os.path.join(OUT, "sdd_wireframe_cart.png"), title="SCR-03 Giỏ hàng / Thanh toán", width=560, height=420,
    )

    dk.wireframe(
        [
            (0.05, 0.03, 0.95, 0.10, "Header POS: Tên nhân viên | Đăng xuất"),
            (0.05, 0.13, 0.30, 0.95, "Menu: Đơn thuê | Kho | Kiểm đếm | Báo cáo"),
            (0.34, 0.13, 0.95, 0.30, "Thanh tìm kiếm đơn / sản phẩm"),
            (0.34, 0.33, 0.95, 0.60, "Bảng danh sách đơn thuê đang xử lý"),
            (0.34, 0.63, 0.95, 0.90, "Checklist kiểm đếm linh kiện của đơn đang chọn"),
        ],
        os.path.join(OUT, "sdd_wireframe_pos.png"), title="SCR-04 Bảng điều khiển kho (POS nội bộ)", width=560, height=420,
    )
    dk.wireframe(
        [
            (0.05, 0.03, 0.95, 0.10, "Header Admin: Bộ lọc tháng/năm"),
            (0.05, 0.14, 0.46, 0.45, "Biểu đồ doanh thu bán theo ngày"),
            (0.50, 0.14, 0.95, 0.45, "Biểu đồ doanh thu thuê theo ngày"),
            (0.05, 0.48, 0.95, 0.90, "Bảng chi tiết giao dịch trong tháng"),
        ],
        os.path.join(OUT, "sdd_wireframe_report.png"), title="SCR-05 Báo cáo doanh thu (Admin)", width=560, height=420,
    )

    # Design Class Diagram v2 nay trinh bay bang code PlantUML text truc tiep trong
    # build_sdd.py (ds.code_block), khong con sinh anh Pillow (dong bo cach lam voi SRS 3.1/3.5/3.6).

    print("Da sinh xong cac hinh SDD vao", OUT)


if __name__ == "__main__":
    build()
