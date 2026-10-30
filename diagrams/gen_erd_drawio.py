# -*- coding: utf-8 -*-
"""Sinh file .drawio (mxGraph XML) cho ERD Hinh 3.3 trong SRS, tu noi dung PlantUML trong fill_srs.py."""
import html

ENTITIES = {
    "KhachHang": {
        "attrs": [("* id", "UUID", "PK"), ("ho_ten", "VARCHAR", None), ("email", "VARCHAR", None),
                  ("sdt", "VARCHAR", None), ("mat_khau_hash", "VARCHAR", None)],
    },
    "DonHang": {
        "attrs": [("* id", "UUID", "PK"), ("# khach_hang_id", "UUID", "FK"), ("loai", "ENUM", None),
                  ("trang_thai", "ENUM", None), ("ngay_tao", "TIMESTAMP", None)],
    },
    "SanPham": {
        "attrs": [("* id", "UUID", "PK"), ("ten", "VARCHAR", None), ("mo_ta", "TEXT", None),
                  ("gia_niem_yet", "NUMERIC", None), ("danh_muc", "VARCHAR", None)],
    },
    "DatCoc": {
        "attrs": [("* id", "UUID", "PK"), ("# don_hang_id", "UUID", "FK, UNIQUE"), ("so_tien", "NUMERIC", None),
                  ("phi_ship_giu", "NUMERIC", None), ("trang_thai", "ENUM", None), ("ngay_hoan", "DATE", None),
                  ("phieu_quyet_toan", "TEXT", None)],
    },
    "ChiTietDonHang": {
        "attrs": [("* id", "UUID", "PK"), ("# don_hang_id", "UUID", "FK"), ("# san_pham_id", "UUID", "FK"),
                  ("ngay_bat_dau", "DATE", None), ("ngay_ket_thuc", "DATE", None), ("don_gia", "NUMERIC", None),
                  ("dia_chi_nhan", "VARCHAR", None), ("dia_chi_tra", "VARCHAR", None), ("ma_hop", "VARCHAR", None)],
    },
    "HopGame": {
        "attrs": [("* id", "UUID", "PK"), ("# san_pham_id", "UUID", "FK"), ("ma_hop", "VARCHAR", None),
                  ("trang_thai", "ENUM", None)],
    },
    "ThanhToan": {
        "attrs": [("* id", "UUID", "PK"), ("# don_hang_id", "UUID", "FK"), ("so_tien", "NUMERIC", None),
                  ("muc_dich", "ENUM", None), ("trang_thai", "ENUM", None), ("ma_qr", "VARCHAR", None)],
    },
    "GiaoVan": {
        "attrs": [("* id", "UUID", "PK"), ("# chi_tiet_don_id", "UUID", "FK"), ("chieu", "ENUM", None),
                  ("doi_tac", "ENUM", None), ("khoang_cach_km", "NUMERIC", None), ("phi_ship", "NUMERIC", None),
                  ("ma_van_don", "VARCHAR", None), ("trang_thai_vanchuyen", "ENUM", None), ("hoan_tat_luc", "TIMESTAMP", None)],
    },
    "LinhKien": {
        "attrs": [("* id", "UUID", "PK"), ("# san_pham_id", "UUID", "FK"), ("ten_linh_kien", "VARCHAR", None),
                  ("la_doc_ban", "BOOLEAN", None), ("so_luong", "INTEGER", None), ("gia_le", "NUMERIC", None)],
    },
    "BienBanKiemDem": {
        "attrs": [("* id", "UUID", "PK"), ("# chi_tiet_don_id", "UUID", "FK"), ("# nhan_vien_id", "UUID", "FK"),
                  ("ket_qua", "TEXT", None), ("ngay_lap", "TIMESTAMP", None)],
    },
    "NhanVien": {
        "attrs": [("* id", "UUID", "PK"), ("ho_ten", "VARCHAR", None), ("vai_tro", "ENUM", None)],
    },
}

# vi tri luoi (col, row) - dung de tinh toa do thuc va chon canh noi (trai/phai)
GRID = {
    "KhachHang": (0, 0), "DonHang": (1, 0), "SanPham": (2, 0),
    "DatCoc": (0, 1), "ChiTietDonHang": (1, 1), "HopGame": (2, 1),
    "ThanhToan": (0, 2), "GiaoVan": (1, 2), "LinhKien": (2, 2),
    "BienBanKiemDem": (0, 3), "NhanVien": (1, 3),
}

# (source, target, ten_cot_FK_trong_target, start_arrow_tai_source, end_arrow_tai_target)
RELATIONS = [
    ("KhachHang", "DonHang", "# khach_hang_id", "ERmandOne", "ERzeroToMany"),
    ("DonHang", "ChiTietDonHang", "# don_hang_id", "ERmandOne", "ERoneToMany"),
    ("SanPham", "ChiTietDonHang", "# san_pham_id", "ERmandOne", "ERzeroToMany"),
    ("SanPham", "HopGame", "# san_pham_id", "ERmandOne", "ERzeroToMany"),
    ("SanPham", "LinhKien", "# san_pham_id", "ERmandOne", "ERzeroToMany"),
    ("DonHang", "DatCoc", "# don_hang_id", "ERmandOne", "ERzeroToOne"),
    ("ChiTietDonHang", "GiaoVan", "# chi_tiet_don_id", "ERmandOne", "ERzeroToMany"),
    ("DonHang", "ThanhToan", "# don_hang_id", "ERmandOne", "ERzeroToMany"),
    ("ChiTietDonHang", "BienBanKiemDem", "# chi_tiet_don_id", "ERmandOne", "ERzeroToMany"),
    ("NhanVien", "BienBanKiemDem", "# nhan_vien_id", "ERmandOne", "ERzeroToMany"),
]

HEADER_H = 26
ROW_H = 20
COL_W = 240
COL_GAP = 170
ROW_GAP = 110

def esc(s):
    return html.escape(s, quote=True)

# --- 1) tinh chieu cao tung entity, roi toa do x/y theo luoi (grid) ---
heights = {name: HEADER_H + ROW_H * len(data["attrs"]) for name, data in ENTITIES.items()}

n_cols = max(c for c, r in GRID.values()) + 1
n_rows = max(r for c, r in GRID.values()) + 1
row_height = [0] * n_rows
for name, (c, r) in GRID.items():
    row_height[r] = max(row_height[r], heights[name])

col_x = [40 + c * (COL_W + COL_GAP) for c in range(n_cols)]
row_y = [0] * n_rows
row_y[0] = 40
for r in range(1, n_rows):
    row_y[r] = row_y[r - 1] + row_height[r - 1] + ROW_GAP

positions = {name: (col_x[c], row_y[r]) for name, (c, r) in GRID.items()}

# --- 2) tinh ben trai/phai de xuat/nhap canh, gom nhom de dan deu diem xuat tren cung 1 canh ---
def side_of(src, dst):
    sc, sr = GRID[src]
    dc, dr = GRID[dst]
    if dc > sc:
        return "right", "left"
    if dc < sc:
        return "left", "right"
    return "right", "right"  # cung cot -> vong qua ben phai (khe trong giua 2 cot)

exit_groups = {}
rel_sides = []
for src, dst, fk_col, sa, ea in RELATIONS:
    src_side, dst_side = side_of(src, dst)
    key = (src, src_side)
    exit_groups.setdefault(key, []).append((src, dst, fk_col, sa, ea))
    rel_sides.append((src, dst, fk_col, sa, ea, src_side, dst_side))

exit_frac = {}
for key, rels in exit_groups.items():
    n = len(rels)
    for i, rel in enumerate(rels):
        exit_frac[(rel[0], rel[1], key[1])] = (i + 1) / (n + 1)

# --- 3) sinh cell ---
cells = []
cell_id = 2  # id 0,1 la root mac dinh cua mxGraph
entity_ids = {}
attr_row_index = {}  # (entity, ten_cot) -> index trong attrs

for name, data in ENTITIES.items():
    eid = f"e{cell_id}"; cell_id += 1
    entity_ids[name] = eid
    x, y = positions[name]
    h = heights[name]
    cells.append(
        f'<mxCell id="{eid}" value="{esc(name)}" style="swimlane;whiteSpace=wrap;html=1;startSize={HEADER_H};'
        f'fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=13;align=center;" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{COL_W}" height="{h}" as="geometry"/></mxCell>'
    )
    for i, (col, typ, tag) in enumerate(data["attrs"]):
        attr_row_index[(name, col)] = i
        aid = f"a{cell_id}"; cell_id += 1
        is_pk = tag == "PK"
        label = f"{col} : {typ}" + (f"  <<{tag}>>" if tag else "")
        style = (
            "text;html=1;align=left;verticalAlign=middle;spacingLeft=8;fontSize=11;"
            + ("fontStyle=4;" if is_pk else "")
        )
        cells.append(
            f'<mxCell id="{aid}" value="{esc(label)}" style="{style}" vertex="1" parent="{eid}">'
            f'<mxGeometry y="{HEADER_H + i * ROW_H}" width="{COL_W}" height="{ROW_H}" as="geometry"/></mxCell>'
        )

for src, dst, fk_col, start_arrow, end_arrow, src_side, dst_side in rel_sides:
    rid = f"r{cell_id}"; cell_id += 1
    exit_y = exit_frac[(src, dst, src_side)]
    fk_idx = attr_row_index[(dst, fk_col)]
    entry_y = (HEADER_H + (fk_idx + 0.5) * ROW_H) / heights[dst]
    exit_x = 0 if src_side == "left" else 1
    entry_x = 0 if dst_side == "left" else 1
    style = (
        "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=30;orthogonalLoop=1;"
        "endArrow=none;startArrow=none;"
        f"startArrow={start_arrow};endArrow={end_arrow};"
        f"exitX={exit_x};exitY={exit_y:.3f};exitDx=0;exitDy=0;"
        f"entryX={entry_x};entryY={entry_y:.3f};entryDx=0;entryDy=0;"
    )
    cells.append(
        f'<mxCell id="{rid}" style="{style}" edge="1" parent="1" source="{entity_ids[src]}" target="{entity_ids[dst]}">'
        f'<mxGeometry relative="1" as="geometry"/></mxCell>'
    )

page_w = max(x + COL_W for x, y in positions.values()) + 40
page_h = max(y + heights[name] for name, (x, y) in positions.items()) + 40

xml = f"""<mxfile host="app.diagrams.net">
  <diagram name="ERD BoardVerse" id="srs-3-5-erd">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{page_w}" pageHeight="{page_h}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {''.join(cells)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""

out_path = "D:/Brd/diagrams/srs_3_5_erd.drawio"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(xml)
print("Da sinh:", out_path)
