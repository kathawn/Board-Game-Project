# -*- coding: utf-8 -*-
"""Sinh cac file .drawio (mxGraph XML) cho muc 3.6 SRS (Activity/State Machine/Sequence Diagram)
tu noi dung PlantUML da co trong fill_srs.py. Khong dung mau - chi vien/chu den, fill trong (trang).

Moi nhan (label) tren canh deu la mot text-box duoc dat toa do THU CONG (khong dung co che
"edge label" tu dong cua drawio), de co the kiem tra chong lan (check_overlap) va kiem soat
chinh xac vi tri, tranh chu de len hinh/duong khac."""
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

    def diamond(self, x, y, w, h, label, fontsize=12):
        nid = self.new_id()
        style = ("rhombus;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;"
                  f"fontColor=#000000;fontSize={fontsize};align=center;verticalAlign=middle;")
        self.add(f'<mxCell id="{nid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        self.boxes.append((x, y, w, h, label))
        return nid

    def circle(self, x, y, d, filled=False, track_label=None):
        nid = self.new_id()
        fill = "#000000" if filled else "#ffffff"
        style = f"ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor=#000000;"
        self.add(f'<mxCell id="{nid}" value="" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{d}" height="{d}" as="geometry"/></mxCell>')
        if track_label:
            self.boxes.append((x, y, d, d, track_label))
        return nid

    def final_node(self, x, y, d=34):
        outer = self.circle(x, y, d, filled=False, track_label="(final)")
        pad = 7
        self.circle(x + pad, y + pad, d - 2 * pad, filled=True)
        return outer

    def lane_bg(self, x, y, w, h, label):
        nid = self.new_id()
        style = ("rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=center;"
                  "fillColor=none;strokeColor=#000000;fontStyle=1;fontSize=14;spacingTop=10;")
        self.cells.insert(0, f'<mxCell id="{nid}" value="{esc(label)}" style="{style}" vertex="1" parent="1">'
                   f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        return nid

    def text_label(self, x, y, w, h, text, fontsize=11, align="center"):
        """Mot o chu thuan tuy (khong vien, nen trang) dat o toa do thu cong - dung lam nhan cho canh."""
        nid = self.new_id()
        style = (f"text;html=1;align={align};verticalAlign=middle;whiteSpace=wrap;"
                  f"fillColor=#ffffff;strokeColor=none;fontColor=#000000;fontSize={fontsize};")
        self.add(f'<mxCell id="{nid}" value="{esc(text)}" style="{style}" vertex="1" parent="1">'
                  f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        self.boxes.append((x, y, w, h, text))
        return nid

    def plain_edge(self, src, dst, dashed=False, exitX=None, exitY=None,
                   entryX=None, entryY=None, points=None):
        """Canh noi thuan tuy, KHONG gan nhan (nhan duoc dat rieng bang text_label)."""
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

    def plain_line(self, x1, y1, x2, y2, dashed=False):
        """Mui ten thang tu diem toa do (x1,y1) den (x2,y2) - dung cho sequence diagram."""
        nid = self.new_id()
        style = "endArrow=block;html=1;strokeColor=#000000;rounded=0;"
        if dashed:
            style += "dashed=1;"
        self.add(f'<mxCell id="{nid}" style="{style}" edge="1" parent="1">'
                  f'<mxGeometry relative="1" as="geometry">'
                  f'<mxPoint x="{x1}" y="{y1}" as="sourcePoint"/>'
                  f'<mxPoint x="{x2}" y="{y2}" as="targetPoint"/>'
                  f'</mxGeometry></mxCell>')
        return nid

    def vline(self, x, y, h, dashed=True):
        nid = self.new_id()
        style = f"endArrow=none;html=1;strokeColor=#000000;{'dashed=1;' if dashed else ''}"
        self.add(f'<mxCell id="{nid}" style="{style}" edge="1" parent="1">'
                  f'<mxGeometry relative="1" as="geometry">'
                  f'<mxPoint x="{x}" y="{y}" as="sourcePoint"/>'
                  f'<mxPoint x="{x}" y="{y + h}" as="targetPoint"/></mxGeometry></mxCell>')
        return nid

    def branch_label(self, dx, dy, dw, dh, frac_x, text, below=True, w=70, h=24):
        cx = dx + frac_x * dw
        y = dy + dh + 8 if below else dy - 8 - h
        return self.text_label(cx - w / 2, y, w, h, text, fontsize=11)

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
# Hinh 3.4 - Activity Diagram (Swimlane): luong dat thue
# ===========================================================================
def build_activity_dathue():
    """Hinh 3.4 - phai khop dung PlantUML trong fill_srs.py (dong ~817-847).
    Khong con nhanh 'tu den lay / giao van' (SRS 1.3+: giao van bat buoc 2 chieu,
    BRU-05/SC-08) - chi con 1 quyet dinh duy nhat la webhook thanh toan (BRU-07)."""
    d = Diagram("Hinh 3.4 - Activity luong dat thue", "srs-3-6-act-dathue")

    LANE_CUS_X, LANE_SYS_X, LANE_STAFF_X = 40, 360, 680
    LANE_W = 320
    TOP = 40

    cus_cx = LANE_CUS_X + (LANE_W - 260) // 2
    sys_cx = LANE_SYS_X + (LANE_W - 260) // 2
    staff_cx = LANE_STAFF_X + (LANE_W - 260) // 2

    n_start = d.circle(cus_cx + 115, 90, 30, filled=True, track_label="(start)")

    n1 = d.rect(cus_cx, 220, 260, 70, "Chọn sản phẩm & ngày thuê")
    n2 = d.rect(cus_cx, 350, 260, 90, "Xác nhận địa chỉ nhận hàng\n(lấy từ hồ sơ cá nhân)")
    n3 = d.rect(sys_cx, 500, 260, 70, "Kiểm tra tồn kho theo ngày\n(FR-CT-02)")
    n4 = d.rect(sys_cx, 630, 260, 90, "Tính khoảng cách, chọn đối tác\ngiao vận theo bán kính 20km (BRU-05)")
    n5 = d.rect(sys_cx, 780, 260, 90, "Tính tiền thuê (BRU-02) và\nphí ship (BRU-05)")
    n6 = d.rect(sys_cx, 930, 260, 70, "Tính tiền cọc theo BRU-01")
    n7 = d.rect(cus_cx, 1060, 260, 70, "Thanh toán cọc qua mã QR\n(UC-10)")

    dec_y = 1190
    dec = d.diamond(sys_cx - 20, dec_y, 300, 150,
                     "Sản phẩm/ngày còn khả dụng\nkhi nhận webhook? (BRU-07)")

    n_xacnhan = d.rect(sys_cx, dec_y + 150 + 60, 260, 70, "Xác nhận thanh toán")
    n_taodon = d.rect(sys_cx, dec_y + 150 + 60 + 70 + 50, 260, 80, "Tạo đơn thuê trạng thái Pending")

    REJECT_X = LANE_STAFF_X + LANE_W + 60
    n_reject = d.rect(REJECT_X, dec_y, 230, 90, "Hoàn tiền vào\nVí điện tử nội bộ")
    n_reject_stop = d.final_node(REJECT_X + (230 - 34) // 2, dec_y + 90 + 50)

    staff_y0 = dec_y + 150 + 60 + 70 + 50 + 80 + 60
    n8 = d.rect(staff_cx, staff_y0, 260, 70, "Xác nhận đơn thuê (UC-05)")
    n9 = d.rect(staff_cx, staff_y0 + 70 + 50, 260, 90,
                "Gọi API đối tác giao vận đã chọn\ntạo yêu cầu giao hàng (FR-TTGV-03)")
    n10 = d.rect(staff_cx, staff_y0 + 70 + 50 + 90 + 50, 260, 70, "Bàn giao sản phẩm cho shipper")
    n11 = d.rect(staff_cx, staff_y0 + 70 + 50 + 90 + 50 + 70 + 50, 260, 70, "Cập nhật Hộp game = Rented")

    stop_y = staff_y0 + 70 + 50 + 90 + 50 + 70 + 50 + 70 + 60
    n_stop = d.final_node(staff_cx + (260 - 34) // 2, stop_y)

    LANE_BOTTOM = max(stop_y + 34 + 50, dec_y + 90 + 50 + 34 + 50)

    d.lane_bg(LANE_CUS_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Customer")
    d.lane_bg(LANE_SYS_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Hệ thống")
    d.lane_bg(LANE_STAFF_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Staff")

    d.plain_edge(n_start, n1)
    d.plain_edge(n1, n2)
    d.plain_edge(n2, n3)
    d.plain_edge(n3, n4)
    d.plain_edge(n4, n5)
    d.plain_edge(n5, n6)
    d.plain_edge(n6, n7)
    d.plain_edge(n7, dec)
    d.plain_edge(dec, n_xacnhan, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.branch_label(sys_cx - 20, dec_y, 300, 150, 0.4, "Có")
    d.plain_edge(dec, n_reject, exitX=1, exitY=0.5, entryX=0, entryY=0.5)
    d.branch_label(sys_cx - 20, dec_y, 300, 150, 1.0, "Không", below=False, w=90)
    d.plain_edge(n_reject, n_reject_stop)
    d.plain_edge(n_xacnhan, n_taodon)
    d.plain_edge(n_taodon, n8, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(n8, n9)
    d.plain_edge(n9, n10)
    d.plain_edge(n10, n11)
    d.plain_edge(n11, n_stop)

    d.save("srs_3_6_activity_dathue.drawio", REJECT_X + 230 + 40, LANE_BOTTOM + 40)


# ===========================================================================
# Hinh 3.5 - Activity Diagram (Swimlane): luong tra hang & kiem ke
# ===========================================================================
def build_activity_trahang():
    """Hinh 3.5 - phai khop dung PlantUML trong fill_srs.py (dong ~850-879).
    Khong con nhanh 'tu mang tra / goi giao van' (SRS 1.3+: giao van bat buoc
    ca 2 chieu) - chi con 1 duong thang qua 4 lane, ket thuc bang quyet dinh
    con thieu tien hay khong (BRU-06)."""
    d = Diagram("Hinh 3.5 - Activity luong tra hang & kiem ke", "srs-3-6-act-trahang")

    LANE_CUS_X, LANE_SYS_X, LANE_SHIP_X, LANE_STAFF_X = 40, 360, 680, 1000
    LANE_W = 320
    TOP = 40

    cus_cx = LANE_CUS_X + (LANE_W - 260) // 2
    sys_cx = LANE_SYS_X + (LANE_W - 260) // 2
    ship_cx = LANE_SHIP_X + (LANE_W - 260) // 2
    staff_cx = LANE_STAFF_X + (LANE_W - 260) // 2

    n_start = d.circle(cus_cx + 115, 90, 30, filled=True, track_label="(start)")
    n1 = d.rect(cus_cx, 220, 260, 90, "Đến hạn trả, xác nhận địa chỉ\nlấy hàng trả (mặc định = địa chỉ nhận)")

    y1 = 380
    s1 = d.rect(sys_cx, y1, 260, 90, "Tính khoảng cách, chọn đối tác\ngiao vận theo bán kính 20km (BRU-05)")
    s2 = d.rect(sys_cx, y1 + 90 + 50, 260, 70, "Tính phí ship chiều trả\n(BRU-05)")
    s3 = d.rect(sys_cx, y1 + 90 + 50 + 70 + 50, 260, 90,
                "Gọi API đối tác giao vận đã chọn\ntạo yêu cầu lấy hàng (FR-TTGV-04)")

    y_ship = y1 + 90 + 50 + 70 + 50 + 90 + 60
    n_ship = d.rect(ship_cx, y_ship, 260, 70, "Lấy hàng từ khách,\ngiao về kho")

    y_kiemdem = y_ship + 70 + 60
    n_kiemdem = d.rect(staff_cx, y_kiemdem, 260, 90, "Kiểm đếm linh kiện theo checklist\nđiện tử (UC-08)")

    y2 = y_kiemdem + 90 + 60
    n2 = d.rect(sys_cx, y2, 260, 70, "Tính phạt trễ hạn / đền bù\n(BRU-03, BRU-04)")
    n3 = d.rect(sys_cx, y2 + 70 + 50, 260, 70, "Trừ phí ship thực tế\nhai chiều (FR-TTGV-08)")
    n4 = d.rect(sys_cx, y2 + (70 + 50) * 2, 260, 70, "Tính số tiền hoàn cọc\ncuối cùng")
    n5 = d.rect(staff_cx, y2 + (70 + 50) * 3, 260, 70, "Xác nhận hoàn cọc\n(UC-07)")

    y_dec2 = y2 + (70 + 50) * 3 + 70 + 60
    dec2_x = LANE_SYS_X + (LANE_W + LANE_W - 260) // 2
    dec2 = d.diamond(dec2_x, y_dec2, 260, 110, "Còn thiếu\ntiền?")

    y_b2 = y_dec2 + 150
    bYes_x = LANE_SYS_X + 30
    bNo_x = LANE_SHIP_X + LANE_W - 30 - 260
    bYes = d.rect(bYes_x, y_b2, 260, 70, "Sinh mã QR\nthu thêm (UC-10)")
    bNo = d.rect(bNo_x, y_b2, 260, 90, "Cộng tiền hoàn cọc vào\nVí điện tử nội bộ của khách (BRU-06)")

    stop_cx = (bYes_x + bNo_x + 260) / 2 - 15
    n_stop = d.final_node(stop_cx, y_b2 + 90 + 60)

    LANE_BOTTOM = y_b2 + 90 + 60 + 34 + 50

    d.lane_bg(LANE_CUS_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Customer")
    d.lane_bg(LANE_SYS_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Hệ thống")
    d.lane_bg(LANE_SHIP_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Đối tác giao vận")
    d.lane_bg(LANE_STAFF_X, TOP, LANE_W, LANE_BOTTOM - TOP, "Staff")

    d.plain_edge(n_start, n1)
    d.plain_edge(n1, s1, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(s1, s2)
    d.plain_edge(s2, s3)
    d.plain_edge(s3, n_ship, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(n_ship, n_kiemdem, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(n_kiemdem, n2, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(n2, n3)
    d.plain_edge(n3, n4)
    d.plain_edge(n4, n5, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(n5, dec2, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(dec2, bYes, exitX=0.2, exitY=1, entryX=0.5, entryY=0)
    d.plain_edge(dec2, bNo, exitX=0.8, exitY=1, entryX=0.5, entryY=0)
    d.branch_label(dec2_x, y_dec2, 260, 110, 0.2, "Có")
    d.branch_label(dec2_x, y_dec2, 260, 110, 0.8, "Không")
    d.plain_edge(bYes, n_stop, exitX=0.5, exitY=1, entryX=0.3, entryY=0)
    d.plain_edge(bNo, n_stop, exitX=0.5, exitY=1, entryX=0.7, entryY=0)

    d.save("srs_3_6_activity_trahang.drawio", LANE_STAFF_X + LANE_W + 40, LANE_BOTTOM + 40)


# ===========================================================================
# Hinh 3.6 - State Machine: Vong doi Don thue
# ===========================================================================
def build_state_donthue():
    d = Diagram("Hinh 3.6 - State Machine Don thue", "srs-3-6-state-donthue")

    BOX_W, BOX_H, GAP = 200, 80, 280
    STEP = BOX_W + GAP
    y_main = 240

    start_x = 40
    pending_x = 360
    confirmed_x = pending_x + STEP
    active_x = confirmed_x + STEP
    completed_x = active_x + STEP
    closed_x = completed_x + STEP
    final_x = closed_x + STEP - 120

    n_start = d.circle(start_x, y_main + 25, 30, filled=True, track_label="(start)")
    pending = d.rect(pending_x, y_main, BOX_W, BOX_H, "Pending")
    confirmed = d.rect(confirmed_x, y_main, BOX_W, BOX_H, "Confirmed")
    active = d.rect(active_x, y_main, BOX_W, BOX_H, "Active")
    completed = d.rect(completed_x, y_main, BOX_W, BOX_H, "Completed")
    closed = d.rect(closed_x, y_main, BOX_W, BOX_H, "Closed")
    n_final = d.final_node(final_x, y_main + 23)

    overdue_y = y_main + 420
    overdue = d.rect(active_x, overdue_y, BOX_W, BOX_H, "Overdue")

    def gap_label(left_box_right, right_box_left, text):
        mid = (left_box_right + right_box_left) / 2
        w = min(240, right_box_left - left_box_right - 20)
        d.text_label(mid - w / 2, y_main, w, BOX_H, text)

    d.plain_edge(n_start, pending)
    gap_label(start_x + 30, pending_x, "Khách đặt thuê,\nchưa thanh toán cọc")

    d.plain_edge(pending, confirmed)
    gap_label(pending_x + BOX_W, confirmed_x, "Thanh toán cọc thành công (UC-10)\n+ Staff xác nhận (UC-05)")

    d.plain_edge(confirmed, active)
    gap_label(confirmed_x + BOX_W, active_x, "Bàn giao xuất kho\n(UC-06)")

    d.plain_edge(active, completed)
    gap_label(active_x + BOX_W, completed_x, "Trả hàng đúng hạn,\nđã quyết toán (UC-07)")

    d.plain_edge(completed, closed)
    gap_label(completed_x + BOX_W, closed_x, "Hoàn tất hoàn\ncọc/thu thêm")

    d.plain_edge(closed, n_final)

    mid_x = active_x + BOX_W / 2
    completed_mid_x = completed_x + BOX_W / 2
    d.plain_edge(active, overdue, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.text_label(mid_x - 90, y_main + BOX_H + 20, 180, 40, "Quá hạn\ntrả hàng")

    route_y = overdue_y - 110
    d.plain_edge(overdue, completed, exitX=0.5, exitY=0, entryX=0.5, entryY=1,
                 points=[(mid_x, route_y), (completed_mid_x, route_y)])
    label2_w = 340
    d.text_label((mid_x + completed_mid_x) / 2 - label2_w / 2, route_y - 40, label2_w, 34,
                 "Trả hàng trễ hạn, đã quyết toán (UC-07)")

    page_w = final_x + 34 + 60
    page_h = overdue_y + BOX_H + 40
    d.save("srs_3_6_state_donthue.drawio", page_w, page_h)


# ===========================================================================
# Hinh 3.7 - State Machine: Vong doi Hop game vat ly
# ===========================================================================
def build_state_hopgame():
    """Hinh 3.7 - phai khop dung PlantUML trong fill_srs.py (dong ~894-905),
    gom ca nhanh Available -> Sold -> [*] (ban hang) con thieu o ban truoc."""
    d = Diagram("Hinh 3.7 - State Machine Hop game", "srs-3-6-state-hopgame")

    BOX_W, BOX_H, GAP = 200, 80, 280
    STEP = BOX_W + GAP
    y_main = 260

    start_x = 40
    available_x = 360
    reserved_x = available_x + STEP
    rented_x = reserved_x + STEP
    checking_x = rented_x + STEP
    damaged_x = checking_x + STEP

    n_start = d.circle(start_x, y_main + 25, 30, filled=True, track_label="(start)")
    available = d.rect(available_x, y_main, BOX_W, BOX_H, "Available")
    reserved = d.rect(reserved_x, y_main, BOX_W, BOX_H, "Reserved")
    rented = d.rect(rented_x, y_main, BOX_W, BOX_H, "Rented")
    checking = d.rect(checking_x, y_main, BOX_W, BOX_H, "Checking")
    damaged = d.rect(damaged_x, y_main, BOX_W, BOX_H, "Damaged")

    # Sold: nhanh ban hang, dat phia duoi Available, du xa de khong de len 3 "hang"
    # nhan cua duong quay-ve-Available (row1/row2/row3, y 428-594) ngay ben duoi.
    sold_y = y_main + BOX_H + 500
    sold = d.rect(available_x, sold_y, BOX_W, BOX_H, "Sold")
    n_final_sold = d.final_node(available_x + (BOX_W - 34) // 2, sold_y + BOX_H + 60)

    def gap_label(left_box_right, right_box_left, text):
        mid = (left_box_right + right_box_left) / 2
        w = min(240, right_box_left - left_box_right - 20)
        d.text_label(mid - w / 2, y_main, w, BOX_H, text)

    d.plain_edge(n_start, available)
    gap_label(start_x + 30, available_x, "Nhập kho\nlần đầu")

    d.plain_edge(available, reserved)
    gap_label(available_x + BOX_W, reserved_x, "Khách đặt thuê, đơn ở\nPending/Confirmed")

    d.plain_edge(reserved, rented)
    gap_label(reserved_x + BOX_W, rented_x, "Bàn giao xuất kho\n(UC-06)")

    d.plain_edge(rented, checking)
    gap_label(rented_x + BOX_W, checking_x, "Khách trả hàng, bắt đầu\nkiểm đếm (UC-08)")

    d.plain_edge(checking, damaged)
    gap_label(checking_x + BOX_W, damaged_x, "Thiếu/hư hỏng\nlinh kiện")

    d.plain_edge(available, sold, exitX=0.5, exitY=1, entryX=0.5, entryY=0)
    d.text_label(available_x + BOX_W + 10, sold_y - 120, 260, 40,
                 "Khách mua, thanh toán\nthành công (UC-03)")
    d.plain_edge(sold, n_final_sold)
    d.text_label(available_x + BOX_W + 10, sold_y + BOX_H + 10, 240, 26, "Rời khỏi kho vĩnh viễn")

    # 3 duong quay ve Available, xep thanh 3 "hang" rieng phia duoi hang chinh,
    # cang xuat phat tu cot cang xa Available thi dat o hang cang sau de khong de/cat nhau.
    row1_y = y_main + BOX_H + 80    # reserved -> available (gan nhat)
    row2_y = y_main + BOX_H + 150   # checking -> available
    row3_y = y_main + BOX_H + 220   # damaged -> available (xa nhat)

    def return_edge(src, src_x, dst_entry_frac, row_y, label):
        exit_x = src_x + BOX_W / 2
        entry_x = available_x + dst_entry_frac * BOX_W
        d.plain_edge(src, available, exitX=0.5, exitY=1, entryX=dst_entry_frac, entryY=1,
                     points=[(exit_x, row_y), (entry_x, row_y)])
        lo, hi = sorted([exit_x, entry_x])
        d.text_label(lo, row_y + 8, hi - lo, 26, label)

    return_edge(reserved, reserved_x, 0.8, row1_y, "Đơn bị huỷ trước khi xuất kho")
    return_edge(checking, checking_x, 0.6, row2_y, "Đủ linh kiện, không hư hỏng")
    return_edge(damaged, damaged_x, 0.95, row3_y, "Đã xử lý đền bù (BRU-04)")

    page_w = damaged_x + BOX_W + 60
    page_h = sold_y + BOX_H + 60 + 34 + 60
    d.save("srs_3_6_state_hopgame.drawio", page_w, page_h)


# ===========================================================================
# Sequence diagrams
# ===========================================================================
def build_seq_datcoc():
    """Hinh 3.8 - phai khop dung PlantUML trong fill_srs.py (dong ~908-925),
    gom ca khung alt/else (BRU-07) con thieu o ban truoc."""
    d = Diagram("Hinh 3.8 - SSD Dat coc", "srs-3-6-seq-datcoc")
    HEAD_W, HEAD_H, HEAD_Y = 240, 50, 40
    participants = [(220, "Customer"), (700, "Hệ thống BoardVerse"), (1180, "MoMo\n(giả định)")]

    alt_y, alt_h = 760, 260
    lifeline_bottom = alt_y + alt_h + 60

    for cx, label in participants:
        hx = cx - HEAD_W // 2
        d.rect(hx, HEAD_Y, HEAD_W, HEAD_H, label, bold=True)
        d.vline(cx, HEAD_Y + HEAD_H, lifeline_bottom - (HEAD_Y + HEAD_H), dashed=True)

    msgs_before = [
        (0, 1, "chonSanPham(ngay_bat_dau, ngay_ket_thuc, diaChiNhan)", False, 150),
        (1, 0, "traVe(tienThue, phiShip, tienCoc)", True, 250),
        (0, 1, "xacNhanThanhToanCoc()", False, 350),
        (1, 2, "yeuCauSinhMaQR(maDon, tienCoc)", False, 450),
        (2, 1, "traVe(maQR)", True, 550),
        (1, 0, "hienThiMaQR(maQR)", True, 650),
        (2, 1, "webhookThanhToan(maDon, thanhCong)", False, 710),
    ]
    for src_i, dst_i, label, dashed, y in msgs_before:
        x1, x2 = participants[src_i][0], participants[dst_i][0]
        d.plain_line(x1, y, x2, y, dashed=dashed)
        lo, hi = min(x1, x2), max(x1, x2)
        d.text_label(lo + 20, y - 30, (hi - lo) - 40, 24, label, fontsize=11)

    ax, ay, aw, ah = 160, alt_y, 1100, alt_h
    nid = d.new_id()
    style = ("rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
             "verticalAlign=top;align=left;spacingLeft=6;spacingTop=4;fontSize=11;")
    d.cells.insert(0, f'<mxCell id="{nid}" value="{esc("alt  [sanPham/ngày còn khả dụng (BRU-07)]")}" '
               f'style="{style}" vertex="1" parent="1">'
               f'<mxGeometry x="{ax}" y="{ay}" width="{aw}" height="{ah}" as="geometry"/></mxCell>')
    d.boxes.append((ax, ay, aw, 26, "alt frame title"))
    else_y = ay + ah / 2
    nid2 = d.new_id()
    d.add(f'<mxCell id="{nid2}" style="endArrow=none;html=1;strokeColor=#000000;dashed=1;" edge="1" parent="1">'
          f'<mxGeometry relative="1" as="geometry">'
          f'<mxPoint x="{ax}" y="{else_y}" as="sourcePoint"/>'
          f'<mxPoint x="{ax + aw}" y="{else_y}" as="targetPoint"/></mxGeometry></mxCell>')
    d.text_label(ax + 6, else_y + 2, 320, 20, "[else — đã bị đơn khác chiếm trước]", align="left")

    x1, x2 = participants[1][0], participants[0][0]
    y_if = ay + 70
    d.plain_line(x1, y_if, x2, y_if, dashed=True)
    d.text_label(min(x1, x2) + 20, y_if - 30, abs(x2 - x1) - 40, 24, "xacNhanDonThue(maDon)", fontsize=11)

    y_else = else_y + 70
    d.plain_line(x1, y_else, x2, y_else, dashed=True)
    d.text_label(min(x1, x2) + 20, y_else - 30, abs(x2 - x1) - 40, 24, "hoanTienVaoViDienTu(soTien)", fontsize=11)

    page_w = max(cx for cx, _ in participants) + HEAD_W // 2 + 60
    page_h = lifeline_bottom + 40
    d.save("srs_3_6_seq_datcoc.drawio", page_w, page_h)


def build_seq_giaovan():
    """Hinh 3.10 - phai khop dung PlantUML trong fill_srs.py (dong ~944-957),
    gom ca self-message Sys->Sys (tinhKhoangCach/chonDoiTac) con thieu o ban truoc."""
    d = Diagram("Hinh 3.10 - SSD Giao van 2 chieu", "srs-3-6-seq-giaovan")
    HEAD_W, HEAD_H, HEAD_Y = 240, 50, 40
    participants = [(220, "Customer"), (700, "Hệ thống BoardVerse"), (1180, "Green SM / Shopee Express\n(giả định)")]
    lifeline_bottom = 980

    for cx, label in participants:
        hx = cx - HEAD_W // 2
        d.rect(hx, HEAD_Y, HEAD_W, HEAD_H, label, bold=True)
        d.vline(cx, HEAD_Y + HEAD_H, lifeline_bottom - (HEAD_Y + HEAD_H), dashed=True)

    sys_x = participants[1][0]

    def msg(src_i, dst_i, label, dashed, y):
        x1, x2 = participants[src_i][0], participants[dst_i][0]
        d.plain_line(x1, y, x2, y, dashed=dashed)
        lo, hi = min(x1, x2), max(x1, x2)
        d.text_label(lo + 20, y - 30, (hi - lo) - 40, 24, label, fontsize=11)

    def self_msg(idx, label, y, loop_w=160, loop_h=50):
        """Canh tu-goi-chinh-minh (Sys -> Sys): ve bang 3 doan thang noi diem
        (x,y) -> (x+loop_w,y) -> (x+loop_w,y+loop_h) -> (x,y+loop_h), mui ten o cuoi."""
        x = participants[idx][0]
        nid = d.new_id()
        style = "endArrow=block;html=1;strokeColor=#000000;rounded=0;"
        d.add(f'<mxCell id="{nid}" style="{style}" edge="1" parent="1">'
              f'<mxGeometry relative="1" as="geometry">'
              f'<mxPoint x="{x}" y="{y}" as="sourcePoint"/>'
              f'<mxPoint x="{x}" y="{y + loop_h}" as="targetPoint"/>'
              f'<Array as="points"><mxPoint x="{x + loop_w}" y="{y}"/><mxPoint x="{x + loop_w}" y="{y + loop_h}"/></Array>'
              f'</mxGeometry></mxCell>')
        d.text_label(x + 20, y + loop_h / 2 - 12, loop_w + 60, 24, label, fontsize=11, align="left")

    msg(0, 1, "xacNhanDiaChi(chieu, diaChi)", False, 150)
    self_msg(1, "tinhKhoangCach(); chonDoiTac(khoangCach)", 220)
    msg(1, 0, "traVe(doiTacDaChon, phiShip)", True, 370)
    msg(1, 2, "taoYeuCauGiaoNhan(maDon, chieu, diaChi)", False, 470)
    msg(2, 1, "traVe(maVanDon)", True, 570)
    msg(1, 0, "xacNhanDaTaoYeuCau(maVanDon)", True, 670)
    msg(2, 1, "webhookCapNhatTrangThai(maVanDon, trangThai)", False, 770)
    msg(1, 0, "capNhatTrangThaiVanChuyen(trangThai)", True, 870)

    page_w = max(cx for cx, _ in participants) + HEAD_W // 2 + 60
    page_h = lifeline_bottom + 40
    d.save("srs_3_6_seq_giaovan.drawio", page_w, page_h)


def build_seq_hoancoc():
    d = Diagram("Hinh 3.9 - SSD Hoan coc", "srs-3-6-seq-hoancoc")
    HEAD_W, HEAD_H, HEAD_Y = 240, 50, 40
    participants = [(220, "Staff"), (700, "Hệ thống BoardVerse"), (1180, "Customer")]

    alt_y, alt_h = 460, 280
    lifeline_bottom = alt_y + alt_h + 60

    for cx, label in participants:
        hx = cx - HEAD_W // 2
        d.rect(hx, HEAD_Y, HEAD_W, HEAD_H, label, bold=True)
        d.vline(cx, HEAD_Y + HEAD_H, lifeline_bottom - (HEAD_Y + HEAD_H), dashed=True)

    msgs_before = [
        (0, 1, "xacNhanKiemDem(chiTietDonId, ketQua)", False, 150),
        (1, 0, "traVe(soTienHoanCoc, soTienConThieu)", True, 250),
        (0, 1, "xacNhanHoanCoc()", False, 350),
    ]
    for src_i, dst_i, label, dashed, y in msgs_before:
        x1, x2 = participants[src_i][0], participants[dst_i][0]
        d.plain_line(x1, y, x2, y, dashed=dashed)
        lo, hi = min(x1, x2), max(x1, x2)
        d.text_label(lo + 20, y - 30, (hi - lo) - 40, 24, label, fontsize=11)

    ax, ay, aw, ah = 160, alt_y, 1100, alt_h
    nid = d.new_id()
    style = ("rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;"
             "verticalAlign=top;align=left;spacingLeft=6;spacingTop=4;fontSize=11;")
    d.cells.insert(0, f'<mxCell id="{nid}" value="alt  [soTienConThieu &gt; 0]" style="{style}" vertex="1" parent="1">'
               f'<mxGeometry x="{ax}" y="{ay}" width="{aw}" height="{ah}" as="geometry"/></mxCell>')
    d.boxes.append((ax, ay, aw, 26, "alt frame title"))
    else_y = ay + ah / 2
    nid2 = d.new_id()
    d.add(f'<mxCell id="{nid2}" style="endArrow=none;html=1;strokeColor=#000000;dashed=1;" edge="1" parent="1">'
          f'<mxGeometry relative="1" as="geometry">'
          f'<mxPoint x="{ax}" y="{else_y}" as="sourcePoint"/>'
          f'<mxPoint x="{ax + aw}" y="{else_y}" as="targetPoint"/></mxGeometry></mxCell>')
    d.text_label(ax + 6, else_y + 2, 100, 20, "[else]", align="left")

    y_if = ay + 70
    x1, x2 = participants[1][0], participants[2][0]
    d.plain_line(x1, y_if, x2, y_if, dashed=True)
    d.text_label(min(x1, x2) + 20, y_if - 30, abs(x2 - x1) - 40, 24, "sinhMaQRThuThem(soTienConThieu)", fontsize=11)

    y_else = else_y + 70
    d.plain_line(x1, y_else, x2, y_else, dashed=True)
    d.text_label(min(x1, x2) + 20, y_else - 30, abs(x2 - x1) - 40, 24, "thongBaoHoanCoc(soTienHoanCoc)", fontsize=11)

    page_w = max(cx for cx, _ in participants) + HEAD_W // 2 + 60
    page_h = lifeline_bottom + 40
    d.save("srs_3_6_seq_hoancoc.drawio", page_w, page_h)


if __name__ == "__main__":
    build_activity_dathue()
    build_activity_trahang()
    build_state_donthue()
    build_state_hopgame()
    build_seq_datcoc()
    build_seq_giaovan()
    build_seq_hoancoc()

    print("\nHoan tat sinh 7 file .drawio cho muc 3.6 SRS.")
