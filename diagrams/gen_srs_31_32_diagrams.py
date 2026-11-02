# -*- coding: utf-8 -*-
"""Sinh cac file .drawio (mxGraph XML) cho muc 3.1 (6 so do Use Case: Hinh 3.1,
3.1a-3.1e) va phan Domain Class Diagram cua muc 3.5 (Hinh 3.2) trong SRS, tu noi
dung PlantUML da co trong fill_srs.py (dong ~263-424 cho use case, ~554-665 cho
domain class). Dung chung class Diagram/quy uoc trinh bay voi gen_srs_36_diagrams.py:
khong mau (trang/den), nhan canh la text_label toa do tuyet doi (khong dung co che
auto edge-label cua drawio), luon check_overlap() truoc khi luu."""
import html
import sys

sys.stdout.reconfigure(encoding="utf-8")

OUT_DIR = "D:/Brd/diagrams/drawio/"


def esc(s):
    return html.escape(s, quote=True)


class Diagram:
    def __init__(self, name, diagram_id):
        self.name = name
        self.diagram_id = diagram_id
        self.cells = []
        self._id = 2
        self.boxes = []  # (x, y, w, h, label) de kiem tra de len nhau

    def new_id(self, prefix="n"):
        self._id += 1
        return f"{prefix}{self._id}"

    def add(self, cell_xml):
        self.cells.append(cell_xml)

    def rect(self, x, y, w, h, label, rounded=False, bold=False, dashed=False, fontsize=12, track=True):
        nid = self.new_id()
        style = (f"rounded={'1' if rounded else '0'};whiteSpace=wrap;html=1;"
                 f"fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontSize={fontsize};"
                 "align=center;verticalAlign=middle;")
        if bold:
            style += "fontStyle=1;"
        if dashed:
            style += "dashed=1;"
        self.add(f'<mxCell id="{nid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        if track:
            self.boxes.append((x, y, w, h, label))
        return nid

    def ellipse(self, x, y, w, h, label, fontsize=11, track=True):
        nid = self.new_id()
        style = (f"ellipse;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;"
                  f"fontColor=#000000;fontSize={fontsize};align=center;verticalAlign=middle;")
        self.add(f'<mxCell id="{nid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        if track:
            self.boxes.append((x, y, w, h, label))
        return nid

    def actor(self, x, y, label, fontsize=11):
        """Actor UML kieu stick-figure don gian: dau (circle) + than + 2 tay + 2
        chan, ve bang cac duong thang; nhan dat ben duoi hinh. x,y la goc tren-trai
        cua bounding box (rong 60, cao 90 than nguoi + 26 nhan)."""
        head_d = 24
        cx = x + 30
        head_top = y
        body_top = head_top + head_d
        body_bottom = body_top + 36
        leg_bottom = body_bottom + 30
        self.circle(cx - head_d / 2, head_top, head_d, filled=False)
        self.plain_line(cx, body_top, cx, body_bottom)
        self.plain_line(cx - 20, body_top + 10, cx + 20, body_top + 10)  # tay
        self.plain_line(cx, body_bottom, cx - 18, leg_bottom)  # chan trai
        self.plain_line(cx, body_bottom, cx + 18, leg_bottom)  # chan phai
        label_y = leg_bottom + 4
        self.text_label(x - 20, label_y, 100, 22, label, fontsize=fontsize)
        self.boxes.append((cx - head_d / 2, y, head_d, leg_bottom - y, f"actor-body:{label}"))
        return (cx, (head_top + leg_bottom) / 2)  # diem neo trung tam de ve canh

    def circle(self, x, y, d, filled=False, track_label=None):
        nid = self.new_id()
        fill = "#000000" if filled else "#ffffff"
        style = f"ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=#000000;"
        self.add(f'<mxCell id="{nid}" value="" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{d}" height="{d}" as="geometry"/></mxCell>')
        if track_label:
            self.boxes.append((x, y, d, d, track_label))
        return nid

    def lane_bg(self, x, y, w, h, label, fontsize=14):
        """Khung bao 'package' - hinh chu nhat vien net dut, nhan o goc tren-trai."""
        nid = self.new_id()
        style = ("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;"
                  "spacingLeft=10;spacingTop=8;fillColor=none;strokeColor=#000000;"
                  f"dashed=1;fontStyle=1;fontSize={fontsize};")
        self.cells.insert(0, f'<mxCell id="{nid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                   f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return nid

    def text_label(self, x, y, w, h, text, fontsize=11, align="center"):
        nid = self.new_id()
        style = (f"text;html=1;align={align};verticalAlign=middle;whiteSpace=wrap;"
                  f"fillColor=#ffffff;strokeColor=none;fontColor=#000000;fontSize={fontsize};")
        self.add(f'<mxCell id="{nid}" value="{esc(text)}" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        self.boxes.append((x, y, w, h, text))
        return nid

    def plain_line(self, x1, y1, x2, y2, dashed=False, arrow=False):
        nid = self.new_id()
        style = "html=1;strokeColor=#000000;rounded=0;"
        style += "endArrow=block;" if arrow else "endArrow=none;"
        if dashed:
            style += "dashed=1;"
        self.add(f'<mxCell id="{nid}" style="{style}" edge="1" parent="1">'
                  f'<mxGeometry relative="1" as="geometry">'
                  f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
                  f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/>'
                  f'</mxGeometry></mxCell>')
        return nid

    def plain_edge(self, src, dst, dashed=False, exitX=None, exitY=None,
                   entryX=None, entryY=None, points=None):
        nid = self.new_id("e")
        style = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;strokeColor=#000000;"
        if dashed:
            style += "dashed=1;startArrow=none;endArrow=open;"
        if exitX is not None:
            style += f"exitX={exitX};exitY={exitY};exitDx=0;exitDy=0;"
        if entryX is not None:
            style += f"entryX={entryX};entryY={entryY};entryDx=0;entryDy=0;"
        pts = ""
        if points:
            pts_xml = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in points)
            pts = f'<Array as="points">{pts_xml}</Array>'
        self.add(f'<mxCell id="{nid}" style="{style}" edge="1" parent="1" source="{src}" target="{dst}">'
                  f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>')
        return nid

    def check_overlap(self):
        problems = []
        for i in range(len(self.boxes)):
            x1, y1, w1, h1, l1 = self.boxes[i]
            for j in range(i + 1, len(self.boxes)):
                x2, y2, w2, h2, l2 = self.boxes[j]
                if x1 < x2 + w2 and x2 < x1 + w1 and y1 < y2 + h2 and y2 < y1 + h1:
                    problems.append((l1, l2))
        return problems

    def xml(self, page_w, page_h):
        body = "".join(self.cells)
        return (f'<mxfile host="app.diagrams.net">\n'
                f'  <diagram name="{esc(self.name)}" id="{self.diagram_id}">\n'
                f'    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
                f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="{page_w}" pageHeight="{page_h}" math="0" shadow="0">\n'
                f'      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n        {body}\n'
                f'      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n')

    def save(self, filename, page_w, page_h):
        problems = self.check_overlap()
        if problems:
            print(f"  !! OVERLAP trong {filename}:")
            for l1, l2 in problems:
                print(f"       - {l1!r}  ><  {l2!r}")
        path = OUT_DIR + filename
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.xml(page_w, page_h))
        print("Da sinh:", path, "(" + ("OK" if not problems else f"{len(problems)} overlap!") + ")")


# ===========================================================================
# Use-case diagram helper
# ===========================================================================
UC_W, UC_H = 260, 60


def build_usecase_diagram(filename, diagram_id, name, actors_left, actors_right,
                           packages, assoc, deps, page_w_hint=None):
    """actors_left/actors_right: list of (label, y_center) placed on left/right
    margins. packages: list of (title, [(uc_key, label), ...]) stacked top-to-
    bottom, each drawn as a dashed rectangle containing stacked usecase ellipses.
    assoc: list of (actor_label, uc_key) - solid line actor-usecase.
    deps: list of (uc_key_src, uc_key_dst, label) - dashed arrow with <<..>> label.
    """
    d = Diagram(name, diagram_id)

    PKG_X = 420
    PKG_W = 520
    PKG_GAP = 60
    UC_GAP = 24
    PKG_PAD_TOP = 46
    PKG_PAD_BOTTOM = 24

    uc_pos = {}  # uc_key -> (cx, cy)
    y_cursor = 40
    for title, items in packages:
        pkg_h = PKG_PAD_TOP + len(items) * (UC_H + UC_GAP) - UC_GAP + PKG_PAD_BOTTOM
        d.lane_bg(PKG_X, y_cursor, PKG_W, pkg_h, title)
        uc_x = PKG_X + (PKG_W - UC_W) // 2
        uc_y = y_cursor + PKG_PAD_TOP
        for uc_key, label in items:
            nid = d.ellipse(uc_x, uc_y, UC_W, UC_H, label)
            uc_pos[uc_key] = (uc_x + UC_W / 2, uc_y + UC_H / 2, nid, uc_x, uc_y)
            uc_y += UC_H + UC_GAP
        y_cursor += pkg_h + PKG_GAP

    content_bottom = y_cursor - PKG_GAP

    # Actors ben trai
    actor_pos = {}
    for label, cy in actors_left:
        cx_anchor, cy_anchor = d.actor(40, cy, label)
        actor_pos[label] = (cx_anchor, cy_anchor, "left")

    # Dependency «include»/«extend» giua 2 usecase: duong gap khuc di qua mot
    # "lane" rieng ben phai khung package (khong cat ngang cac usecase khac), moi
    # dependency mot lane x rieng de khong de len nhau; nhan dat ngay trong lane do.
    # (tinh TRUOC khi dat actor ben phai, de nhuong du khong gian cho cac lane.)
    bus_x0 = PKG_X + PKG_W + 20
    lane_w = 260
    n_deps = len(deps)

    # Actors ben phai (dat sau cac lane dependency, cach ra them 140)
    right_x = bus_x0 + n_deps * lane_w + 140
    for label, cy in actors_right:
        cx_anchor, cy_anchor = d.actor(right_x, cy, label)
        actor_pos[label] = (cx_anchor, cy_anchor, "right")

    # Duong association actor - usecase (net lien, khong mui ten theo quy uoc UML)
    for actor_label, uc_key in assoc:
        acx, acy, side = actor_pos[actor_label]
        ucx, ucy, _nid, ucx0, ucy0 = uc_pos[uc_key]
        if side == "left":
            d.plain_line(acx + 12, acy, ucx0, ucy)
        else:
            d.plain_line(acx - 12, acy, ucx0 + UC_W, ucy)

    for i, (src_key, dst_key, label) in enumerate(deps):
        sx, sy, snid, sx0, sy0 = uc_pos[src_key]
        dx, dy, dnid, dx0, dy0 = uc_pos[dst_key]
        lane_x = bus_x0 + i * lane_w + 30
        d.plain_edge(snid, dnid, dashed=True, exitX=1, exitY=0.5, entryX=1, entryY=0.5,
                     points=[(lane_x, sy), (lane_x, dy)])
        mid_y = (sy + dy) / 2
        d.text_label(lane_x + 8, mid_y - 20, lane_w - 40, 40, label, fontsize=10, align="left")

    page_w = page_w_hint or (right_x + 140)
    page_h = max(content_bottom, max([cy for _, cy in actors_left] + [cy for _, cy in actors_right] + [0]) + 80) + 40
    d.save(filename, page_w, page_h)


# ===========================================================================
# Hinh 3.1 - Use Case tong quat (toan bo 20 UC, 6 actor)
# ===========================================================================
def build_uc_overview():
    packages = [
        ("Bán hàng", [
            ("UC01", "UC-01 Đăng ký/Đăng nhập"),
            ("UC02", "UC-02 Xem sản phẩm"),
            ("UC03", "UC-03 Đặt mua"),
            ("UC17", "UC-17 Quên/đặt lại mật khẩu"),
            ("UC18", "UC-18 Cập nhật thông tin cá nhân"),
            ("UC19", "UC-19 Đánh giá sản phẩm"),
        ]),
        ("Cho thuê", [
            ("UC04", "UC-04 Đặt thuê theo ngày"),
            ("UC05", "UC-05 Xác nhận đặt cọc"),
            ("UC06", "UC-06 Bàn giao cho giao vận"),
            ("UC07", "UC-07 Quyết toán hoàn cọc"),
        ]),
        ("Quản lý kho", [
            ("UC08", "UC-08 Kiểm đếm linh kiện nhập kho"),
            ("UC09", "UC-09 Cập nhật trạng thái hộp game"),
        ]),
        ("Thanh toán & Giao vận", [
            ("UC10", "UC-10 Thanh toán qua mã QR"),
            ("UC11", "UC-11 Yêu cầu giao vận đến lấy hàng trả"),
            ("UC12", "UC-12 Nhận cập nhật trạng thái giao vận"),
            ("UC20", "UC-20 Rút tiền từ ví điện tử"),
        ]),
        ("Quản trị hệ thống", [
            ("UC13", "UC-13 Đăng nhập nội bộ"),
            ("UC14", "UC-14 Quản lý tài khoản nhân viên"),
            ("UC15", "UC-15 Quản lý danh mục & giá"),
            ("UC16", "UC-16 Xem báo cáo & thống kê"),
        ]),
    ]
    actors_left = [("Customer", 160), ("Staff", 900), ("Admin", 1500)]
    actors_right = [("Green SM\n(giả định)", 700), ("Shopee Express\n(giả định)", 1000), ("MoMo\n(giả định)", 340)]
    assoc = [
        ("Customer", "UC01"), ("Customer", "UC02"), ("Customer", "UC03"), ("Customer", "UC04"),
        ("Customer", "UC11"), ("Customer", "UC17"), ("Customer", "UC18"), ("Customer", "UC19"), ("Customer", "UC20"),
        ("Staff", "UC05"), ("Staff", "UC06"), ("Staff", "UC07"), ("Staff", "UC08"), ("Staff", "UC09"), ("Staff", "UC13"),
        ("Admin", "UC02"), ("Admin", "UC09"), ("Admin", "UC13"), ("Admin", "UC14"), ("Admin", "UC15"), ("Admin", "UC16"),
        ("Green SM\n(giả định)", "UC12"), ("Shopee Express\n(giả định)", "UC12"), ("MoMo\n(giả định)", "UC10"),
    ]
    deps = [
        ("UC03", "UC10", "«include»"),
        ("UC04", "UC10", "«include»"),
        ("UC06", "UC12", "«extend»"),
        ("UC11", "UC12", "«extend»"),
        ("UC07", "UC10", "«extend»\n(nếu còn tiền phải thu thêm)"),
    ]
    build_usecase_diagram("srs_3_1_uc_overview.drawio", "srs-3-1-uc-overview",
                           "Hinh 3.1 - Use Case tong quat", actors_left, actors_right, packages, assoc, deps,
                           page_w_hint=1340)


# ===========================================================================
# Hinh 3.1a - Use Case phan he Ban hang
# ===========================================================================
def build_uc_banhang():
    packages = [
        ("Bán hàng", [
            ("UC01", "UC-01 Đăng ký/Đăng nhập"),
            ("UC02", "UC-02 Xem sản phẩm"),
            ("UC03", "UC-03 Đặt mua"),
            ("UC17", "UC-17 Quên/đặt lại mật khẩu"),
            ("UC18", "UC-18 Cập nhật thông tin cá nhân"),
            ("UC19", "UC-19 Đánh giá sản phẩm"),
        ]),
    ]
    actors_left = [("Customer", 260)]
    actors_right = [("Admin", 260)]
    assoc = [
        ("Customer", "UC01"), ("Customer", "UC02"), ("Customer", "UC03"),
        ("Customer", "UC17"), ("Customer", "UC18"), ("Customer", "UC19"),
        ("Admin", "UC02"),
    ]
    build_usecase_diagram("srs_3_1a_uc_banhang.drawio", "srs-3-1a-uc-banhang",
                           "Hinh 3.1a - Use Case phan he Ban hang", actors_left, actors_right, packages, assoc, [])


# ===========================================================================
# Hinh 3.1b - Use Case phan he Cho thue
# ===========================================================================
def build_uc_chothue():
    packages = [
        ("Cho thuê", [
            ("UC04", "UC-04 Đặt thuê theo ngày"),
            ("UC05", "UC-05 Xác nhận đặt cọc"),
            ("UC06", "UC-06 Bàn giao cho giao vận"),
            ("UC07", "UC-07 Quyết toán hoàn cọc"),
        ]),
    ]
    actors_left = [("Customer", 160)]
    actors_right = [("Staff", 300)]
    assoc = [("Customer", "UC04"), ("Staff", "UC05"), ("Staff", "UC06"), ("Staff", "UC07")]
    build_usecase_diagram("srs_3_1b_uc_chothue.drawio", "srs-3-1b-uc-chothue",
                           "Hinh 3.1b - Use Case phan he Cho thue", actors_left, actors_right, packages, assoc, [])


# ===========================================================================
# Hinh 3.1c - Use Case phan he Quan ly kho
# ===========================================================================
def build_uc_kho():
    packages = [
        ("Quản lý kho", [
            ("UC08", "UC-08 Kiểm đếm linh kiện nhập kho"),
            ("UC09", "UC-09 Cập nhật trạng thái hộp game"),
        ]),
    ]
    actors_left = [("Staff", 160)]
    actors_right = [("Admin", 220)]
    assoc = [("Staff", "UC08"), ("Staff", "UC09"), ("Admin", "UC09")]
    build_usecase_diagram("srs_3_1c_uc_kho.drawio", "srs-3-1c-uc-kho",
                           "Hinh 3.1c - Use Case phan he Quan ly kho", actors_left, actors_right, packages, assoc, [])


# ===========================================================================
# Hinh 3.1d - Use Case phan he Thanh toan & Giao van
# ===========================================================================
def build_uc_ttgv():
    packages = [
        ("Thanh toán & Giao vận", [
            ("UC10", "UC-10 Thanh toán qua mã QR"),
            ("UC11", "UC-11 Yêu cầu giao vận đến lấy hàng trả"),
            ("UC12", "UC-12 Nhận cập nhật trạng thái giao vận"),
            ("UC20", "UC-20 Rút tiền từ ví điện tử"),
        ]),
    ]
    actors_left = [("Customer", 320)]
    actors_right = [("MoMo\n(giả định)", 140), ("Green SM\n(giả định)", 420), ("Shopee Express\n(giả định)", 620)]
    assoc = [
        ("Customer", "UC10"), ("Customer", "UC11"), ("Customer", "UC20"),
        ("MoMo\n(giả định)", "UC10"), ("Green SM\n(giả định)", "UC12"), ("Shopee Express\n(giả định)", "UC12"),
    ]
    deps = [("UC11", "UC12", "«extend»")]
    build_usecase_diagram("srs_3_1d_uc_ttgv.drawio", "srs-3-1d-uc-ttgv",
                           "Hinh 3.1d - Use Case phan he Thanh toan & Giao van",
                           actors_left, actors_right, packages, assoc, deps, page_w_hint=1340)


# ===========================================================================
# Hinh 3.1e - Use Case phan he Quan tri he thong
# ===========================================================================
def build_uc_admin():
    packages = [
        ("Quản trị hệ thống", [
            ("UC13", "UC-13 Đăng nhập nội bộ"),
            ("UC14", "UC-14 Quản lý tài khoản nhân viên"),
            ("UC15", "UC-15 Quản lý danh mục & giá"),
            ("UC16", "UC-16 Xem báo cáo & thống kê"),
        ]),
    ]
    actors_left = [("Staff", 160)]
    actors_right = [("Admin", 340)]
    assoc = [("Staff", "UC13"), ("Admin", "UC13"), ("Admin", "UC14"), ("Admin", "UC15"), ("Admin", "UC16")]
    build_usecase_diagram("srs_3_1e_uc_admin.drawio", "srs-3-1e-uc-admin",
                           "Hinh 3.1e - Use Case phan he Quan tri he thong", actors_left, actors_right, packages, assoc, [])


# ===========================================================================
# Hinh 3.2 - Domain Class Diagram (khong phuong thuc, chi thuoc tinh)
# ===========================================================================
CLASSES = {
    "KhachHang": ["id", "ho_ten", "email", "sdt", "dia_chi", "mat_khau_hash"],
    "ViDienTu": ["id", "so_du"],
    "SanPham": ["id", "ten", "mo_ta", "gia_niem_yet", "danh_muc", "anh_url"],
    "HopGame": ["id", "ma_hop", "trang_thai"],
    "LinhKien": ["id", "ten_linh_kien", "la_doc_ban", "so_luong", "gia_le"],
    "DanhGia": ["id", "so_sao", "nhan_xet", "ngay_danh_gia"],
    "DonHang": ["id", "loai", "trang_thai", "ngay_tao"],
    "ChiTietDonHang": ["id", "so_luong", "ngay_bat_dau", "ngay_ket_thuc", "don_gia",
                        "dia_chi_nhan", "dia_chi_tra", "ma_hop"],
    "DatCoc": ["id", "so_tien", "phi_ship_giu", "trang_thai", "ngay_hoan", "phieu_quyet_toan"],
    "GiaoVan": ["id", "chieu", "doi_tac", "khoang_cach_km", "phi_ship", "ma_van_don",
                "trang_thai_vanchuyen", "hoan_tat_luc"],
    "ThanhToan": ["id", "so_tien", "muc_dich", "trang_thai", "ma_qr"],
    "BienBanKiemDem": ["id", "ket_qua", "ngay_lap"],
    "NhanVien": ["id", "ho_ten", "email", "mat_khau_hash", "vai_tro", "dang_hoat_dong"],
}

# (col, row) grid position - 4 cot x 4 hang, du cho 13 lop khong de len nhau
CLASS_GRID = {
    "KhachHang": (0, 0), "DonHang": (1, 0), "SanPham": (2, 0), "NhanVien": (3, 0),
    "ViDienTu": (0, 1), "ChiTietDonHang": (1, 1), "HopGame": (2, 1), "BienBanKiemDem": (3, 1),
    "DatCoc": (0, 2), "GiaoVan": (1, 2), "LinhKien": (2, 2),
    "DanhGia": (1, 3), "ThanhToan": (2, 3),
}

# (src, dst, src_mult, dst_mult) - khop dung PlantUML dong 652-664 cua fill_srs.py
CLASS_RELATIONS = [
    ("KhachHang", "ViDienTu", "1", "1"),
    ("KhachHang", "DonHang", "1", "0..*"),
    ("KhachHang", "DanhGia", "1", "0..*"),
    ("DonHang", "ChiTietDonHang", "1", "1..*"),
    ("SanPham", "ChiTietDonHang", "1", "0..*"),
    ("SanPham", "HopGame", "1", "0..*"),
    ("SanPham", "LinhKien", "1", "0..*"),
    ("SanPham", "DanhGia", "1", "0..*"),
    ("DonHang", "DatCoc", "1", "0..1"),
    ("ChiTietDonHang", "GiaoVan", "1", "0..*"),
    ("DonHang", "ThanhToan", "1", "0..*"),
    ("ChiTietDonHang", "BienBanKiemDem", "1", "0..*"),
    ("NhanVien", "BienBanKiemDem", "1", "0..*"),
]

CLS_HEADER_H = 30
CLS_ROW_H = 22
CLS_W = 240
CLS_COL_GAP = 160
CLS_ROW_GAP = 90


def build_domain_class_diagram():
    d = Diagram("Hinh 3.2 - Domain Class Diagram", "srs-3-2-domain-class")

    heights = {name: CLS_HEADER_H + CLS_ROW_H * len(attrs) for name, attrs in CLASSES.items()}
    n_cols = max(c for c, r in CLASS_GRID.values()) + 1
    n_rows = max(r for c, r in CLASS_GRID.values()) + 1
    row_height = [0] * n_rows
    for name, (c, r) in CLASS_GRID.items():
        row_height[r] = max(row_height[r], heights[name])

    col_x = [40 + c * (CLS_W + CLS_COL_GAP) for c in range(n_cols)]
    row_y = [0] * n_rows
    row_y[0] = 40
    for r in range(1, n_rows):
        row_y[r] = row_y[r - 1] + row_height[r - 1] + CLS_ROW_GAP

    positions = {name: (col_x[c], row_y[r]) for name, (c, r) in CLASS_GRID.items()}
    class_ids = {}

    for name, attrs in CLASSES.items():
        x, y = positions[name]
        h = heights[name]
        nid = d.new_id()
        style = ("swimlane;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;"
                 f"fontColor=#000000;startSize={CLS_HEADER_H};fontStyle=1;fontSize=13;align=center;")
        d.add(f'<mxCell id="{nid}" value="{esc(name)}" style="{style}" vertex="1" parent="1">'
              f'<mxGeometry x="{x}" y="{y}" width="{CLS_W}" height="{h}" as="geometry"/></mxCell>')
        d.boxes.append((x, y, CLS_W, h, name))
        class_ids[name] = nid
        for i, attr in enumerate(attrs):
            aid = d.new_id()
            astyle = "text;html=1;align=left;verticalAlign=middle;spacingLeft=8;fontColor=#000000;fontSize=11;"
            d.add(f'<mxCell id="{aid}" value="{esc(attr)}" style="{astyle}" vertex="1" parent="{nid}">'
                  f'<mxGeometry y="{CLS_HEADER_H + i * CLS_ROW_H}" width="{CLS_W}" height="{CLS_ROW_H}" as="geometry"/></mxCell>')

    # Canh quan he: dung grid de chon canh xuat/nhap trai-phai-tren-duoi hop ly.
    exit_groups = {}
    rel_sides = []
    for src, dst, _sm, _dm in CLASS_RELATIONS:
        sc, sr = CLASS_GRID[src]
        dc, dr = CLASS_GRID[dst]
        if dc > sc:
            src_side, dst_side = "right", "left"
        elif dc < sc:
            src_side, dst_side = "left", "right"
        elif dr > sr:
            src_side, dst_side = "bottom", "top"
        else:
            src_side, dst_side = "top", "bottom"
        key = (src, src_side)
        exit_groups.setdefault(key, []).append((src, dst))
        rel_sides.append((src, dst, src_side, dst_side))

    # Mot (lop, canh) co the vua la diem XUAT cua quan he nay, vua la diem NHAP cua
    # quan he khac (vd DonHang.left vua la exit cua DonHang->DatCoc, vua la entry
    # cua KhachHang->DonHang) - phai gom chung mot "pool" stagger theo tung
    # (lop, canh) de khong co 2 nhan trung frac.
    side_usage = {}  # (box, side) -> list of (src, dst)
    for src, dst, src_side, dst_side in rel_sides:
        side_usage.setdefault((src, src_side), []).append((src, dst))
        side_usage.setdefault((dst, dst_side), []).append((src, dst))

    frac_of = {}  # (box, side, src, dst) -> frac in (0,1)
    for (box, side), items in side_usage.items():
        n = len(items)
        for i, (src, dst) in enumerate(items):
            frac_of[(box, side, src, dst)] = (i + 1) / (n + 1)

    exit_frac = {(src, dst, side): frac_of[(src, side, src, dst)]
                 for src, dst, src_side, dst_side in rel_sides for side in [src_side]}
    entry_frac = {(src, dst, side): frac_of[(dst, side, src, dst)]
                  for src, dst, src_side, dst_side in rel_sides for side in [dst_side]}

    side_xy = {"left": (0, 0.5), "right": (1, 0.5), "top": (0.5, 0), "bottom": (0.5, 1)}

    for src, dst, src_side, dst_side in rel_sides:
        ex, ey = side_xy[src_side]
        dx, dy = side_xy[dst_side]
        if src_side in ("left", "right"):
            ey = exit_frac[(src, dst, src_side)]
        else:
            ex = exit_frac[(src, dst, src_side)]
        if dst_side in ("left", "right"):
            dy = entry_frac[(src, dst, dst_side)]
        else:
            dx = entry_frac[(src, dst, dst_side)]
        style = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=30;orthogonalLoop=1;"
                 "endArrow=none;startArrow=none;strokeColor=#000000;"
                 f"exitX={ex};exitY={ey:.3f};exitDx=0;exitDy=0;"
                 f"entryX={dx};entryY={dy:.3f};entryDx=0;entryDy=0;")
        eid = d.new_id("e")
        d.add(f'<mxCell id="{eid}" style="{style}" edge="1" parent="1" source="{class_ids[src]}" target="{class_ids[dst]}">'
              f'<mxGeometry relative="1" as="geometry"/></mxCell>')

    # Nhan boi so (multiplicity) dat ngay canh diem exit/entry thuc te cua canh do
    # (dung lai ty le exit_frac/entry_frac da tinh o tren) de khong de len nhau
    # khi 1 lop co nhieu quan he cung mot phia.
    for src, dst, src_side, dst_side in rel_sides:
        src_mult, dst_mult = next((sm, dm) for s, d2, sm, dm in CLASS_RELATIONS if s == src and d2 == dst)
        sx, sy = positions[src]
        dxp, dyp = positions[dst]
        sh, dh = heights[src], heights[dst]

        if src_side == "right":
            frac = exit_frac[(src, dst, "right")]
            d.text_label(sx + CLS_W + 6, sy + frac * sh - 10, 50, 20, src_mult, fontsize=10, align="left")
        elif src_side == "left":
            frac = exit_frac[(src, dst, "left")]
            d.text_label(sx - 56, sy + frac * sh - 10, 50, 20, src_mult, fontsize=10, align="right")
        elif src_side == "bottom":
            frac = exit_frac[(src, dst, "bottom")]
            d.text_label(sx + frac * CLS_W - 25, sy + sh + 4, 50, 18, src_mult, fontsize=10)
        else:
            frac = exit_frac[(src, dst, "top")]
            d.text_label(sx + frac * CLS_W - 25, sy - 22, 50, 18, src_mult, fontsize=10)

        if dst_side == "left":
            frac = entry_frac[(src, dst, "left")]
            d.text_label(dxp - 56, dyp + frac * dh - 10, 50, 20, dst_mult, fontsize=10, align="right")
        elif dst_side == "right":
            frac = entry_frac[(src, dst, "right")]
            d.text_label(dxp + CLS_W + 6, dyp + frac * dh - 10, 50, 20, dst_mult, fontsize=10, align="left")
        elif dst_side == "top":
            frac = entry_frac[(src, dst, "top")]
            d.text_label(dxp + frac * CLS_W - 25, dyp - 22, 50, 18, dst_mult, fontsize=10)
        else:
            frac = entry_frac[(src, dst, "bottom")]
            d.text_label(dxp + frac * CLS_W - 25, dyp + dh + 4, 50, 18, dst_mult, fontsize=10)

    page_w = max(x + CLS_W for x, y in positions.values()) + 60
    page_h = max(y + heights[name] for name, (x, y) in positions.items()) + 60
    d.save("srs_3_2_domain_class.drawio", page_w, page_h)


if __name__ == "__main__":
    build_uc_overview()
    build_uc_banhang()
    build_uc_chothue()
    build_uc_kho()
    build_uc_ttgv()
    build_uc_admin()
    build_domain_class_diagram()

    print("\nHoan tat sinh 7 file .drawio cho muc 3.1/3.2 SRS.")
