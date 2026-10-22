#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Thu vien ve hinh bang Pillow dung chung cho BRD / SRS / SDD.
Primitives: box, diamond, ellipse, actor, arrow, text.
Composers: flowchart, swimlane, erd, grid2x2, fishbone, tree, layers,
wireframe, usecase_diagram, sequence_diagram.
Toan bo xuat ra PNG (nen trang, vien/chu mau Navy #1B365D) de nhung vao Word.
"""

import os
from PIL import Image, ImageDraw, ImageFont

NAVY = "#1B365D"
NAVY_LIGHT = "#EAF0F8"
GREY = "#5B5B5B"
WHITE = "#FFFFFF"
ACCENT = "#C0392B"

FONT_DIR = r"C:\Windows\Fonts"
_FONT_CACHE = {}


def get_font(size, bold=False):
    key = (size, bold)
    if key not in _FONT_CACHE:
        name = "calibrib.ttf" if bold else "calibri.ttf"
        try:
            _FONT_CACHE[key] = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
        except OSError:
            _FONT_CACHE[key] = ImageFont.load_default(size=size)
    return _FONT_CACHE[key]


def new_canvas(w, h, bg=WHITE):
    img = Image.new("RGB", (int(w), int(h)), bg)
    return img, ImageDraw.Draw(img)


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    return path


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_centered_text(draw, cx, cy, text, font, fill=NAVY, max_width=None):
    lines = wrap_text(draw, text, font, max_width) if max_width else [text]
    line_h = font.size + 4
    total_h = line_h * len(lines)
    y = cy - total_h / 2
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((cx - w / 2, y), line, font=font, fill=fill)
        y += line_h


def rounded_rect(draw, box, radius=12, fill=NAVY_LIGHT, outline=NAVY, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_box(draw, box, text, font=None, fill=NAVY_LIGHT, outline=NAVY, text_color=NAVY, radius=10, bold=False):
    x0, y0, x1, y1 = box
    rounded_rect(draw, box, radius=radius, fill=fill, outline=outline, width=2)
    font = font or get_font(15, bold=bold)
    draw_centered_text(draw, (x0 + x1) / 2, (y0 + y1) / 2, text, font, fill=text_color, max_width=(x1 - x0 - 16))


def draw_diamond(draw, cx, cy, w, h, text, font=None, fill="#FFF3E0", outline=NAVY):
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    draw.polygon(pts, fill=fill, outline=outline, width=2)
    font = font or get_font(13)
    draw_centered_text(draw, cx, cy, text, font, fill=NAVY, max_width=w - 20)


def draw_ellipse(draw, box, text, font=None, fill=WHITE, outline=NAVY):
    draw.ellipse(box, fill=fill, outline=outline, width=2)
    x0, y0, x1, y1 = box
    font = font or get_font(13)
    draw_centered_text(draw, (x0 + x1) / 2, (y0 + y1) / 2, text, font, fill=NAVY, max_width=(x1 - x0 - 14))


def draw_actor(draw, x, y, label, font=None, scale=1.0):
    """Hinh que don gian: dau tron, than, 2 tay, 2 chan."""
    h = 26 * scale
    r = 8 * scale
    draw.ellipse((x - r, y - h, x + r, y - h + 2 * r), outline=NAVY, width=2, fill=WHITE)
    body_top = y - h + 2 * r
    body_bot = body_top + 24 * scale
    draw.line((x, body_top, x, body_bot), fill=NAVY, width=2)
    draw.line((x - 14 * scale, body_top + 8 * scale, x + 14 * scale, body_top + 8 * scale), fill=NAVY, width=2)
    draw.line((x, body_bot, x - 12 * scale, body_bot + 20 * scale), fill=NAVY, width=2)
    draw.line((x, body_bot, x + 12 * scale, body_bot + 20 * scale), fill=NAVY, width=2)
    font = font or get_font(13, bold=True)
    draw_centered_text(draw, x, body_bot + 36 * scale, label, font, fill=NAVY, max_width=100)


def _shrink_to_edge(p_from, p_to, margin=0):
    if margin == 0:
        return p_from
    import math
    dx, dy = p_to[0] - p_from[0], p_to[1] - p_from[1]
    dist = max(1e-6, math.hypot(dx, dy))
    return (p_from[0] + dx / dist * margin, p_from[1] + dy / dist * margin)


def draw_arrow(draw, p1, p2, label=None, color=NAVY, width=2, dashed=False, font=None, label_bg=WHITE):
    import math
    if dashed:
        dist = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        n = max(2, int(dist // 10))
        for i in range(n):
            t0, t1 = i / n, (i + 0.55) / n
            x0, y0 = p1[0] + (p2[0] - p1[0]) * t0, p1[1] + (p2[1] - p1[1]) * t0
            x1, y1 = p1[0] + (p2[0] - p1[0]) * t1, p1[1] + (p2[1] - p1[1]) * t1
            draw.line((x0, y0, x1, y1), fill=color, width=width)
    else:
        draw.line((p1[0], p1[1], p2[0], p2[1]), fill=color, width=width)

    angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    ah = 10
    for side in (0.5, -0.5):
        a2 = angle + math.pi - side
        draw.line((p2[0], p2[1], p2[0] + ah * math.cos(a2 + side * 0.9), p2[1] + ah * math.sin(a2 + side * 0.9)), fill=color, width=width)
    # simpler arrow head (two angled lines)
    for sign in (1, -1):
        a2 = angle + math.pi + sign * 0.4
        draw.line((p2[0], p2[1], p2[0] + ah * math.cos(a2), p2[1] + ah * math.sin(a2)), fill=color, width=width)

    if label:
        font = font or get_font(12)
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        w = draw.textlength(label, font=font)
        draw.rectangle((mx - w / 2 - 3, my - 10, mx + w / 2 + 3, my + 10), fill=label_bg)
        draw.text((mx - w / 2, my - 8), label, font=font, fill=color)


# ---------------------------------------------------------------------------
# Composers
# ---------------------------------------------------------------------------

def flowchart_vertical(steps, path, width=760, box_w=560, box_h=56, gap=46, title=None):
    """steps: list of (text, kind) hoac (text, kind, nhan_mui_ten_den_box_nay).
    kind in {'start','end','process','decision'}."""
    steps = [(s[0], s[1], s[2] if len(s) > 2 else None) for s in steps]
    n = len(steps)
    top_margin = 70 if title else 30
    h = top_margin + n * (box_h + gap) + 30
    img, draw = new_canvas(width, h)
    if title:
        draw_centered_text(draw, width / 2, 30, title, get_font(20, bold=True), fill=NAVY, max_width=width - 40)
    cx = width / 2
    y = top_margin
    centers = []
    for text, kind, _ in steps:
        cy = y + box_h / 2
        if kind == "decision":
            draw_diamond(draw, cx, cy, box_w * 0.62, box_h + 24, text)
        elif kind in ("start", "end"):
            rounded_rect(draw, (cx - box_w * 0.42, y, cx + box_w * 0.42, y + box_h), radius=box_h / 2, fill="#1B365D", outline=NAVY)
            draw_centered_text(draw, cx, cy, text, get_font(15, bold=True), fill=WHITE, max_width=box_w * 0.8)
        else:
            draw_box(draw, (cx - box_w / 2, y, cx + box_w / 2, y + box_h), text)
        centers.append((cx, y, cy, y + box_h if kind != "decision" else cy + (box_h + 24) / 2))
        y += (box_h + 24 if kind == "decision" else box_h) + gap
    for i in range(len(centers) - 1):
        p1 = (centers[i][0], centers[i][3])
        p2 = (centers[i + 1][0], centers[i + 1][1])
        draw_arrow(draw, p1, p2, label=steps[i + 1][2])
    return save(img, path)


def swimlane(lane_names, items, path, width=1000, lane_h=640, title=None):
    """items: list of (lane_index, text, col_order) drawn top-to-bottom in given order;
    arrows connect consecutive items in list order regardless of lane."""
    n_lanes = len(lane_names)
    top = 90 if title else 50
    img, draw = new_canvas(width, top + lane_h + 40)
    if title:
        draw_centered_text(draw, width / 2, 28, title, get_font(20, bold=True), fill=NAVY, max_width=width - 40)
    lane_w = width / n_lanes
    for i, name in enumerate(lane_names):
        x0 = i * lane_w
        draw.rectangle((x0, top, x0 + lane_w, top + lane_h), outline=NAVY, width=2)
        draw.rectangle((x0, top, x0 + lane_w, top + 34), fill=NAVY, outline=NAVY)
        draw_centered_text(draw, x0 + lane_w / 2, top + 17, name, get_font(14, bold=True), fill=WHITE, max_width=lane_w - 10)

    box_h = 48
    step_gap = (lane_h - 50) / max(1, len(items))
    centers = []
    for idx, (lane_i, text) in enumerate(items):
        x0 = lane_i * lane_w
        cy = top + 55 + idx * step_gap
        bx0, bx1 = x0 + 14, x0 + lane_w - 14
        draw_box(draw, (bx0, cy - box_h / 2, bx1, cy + box_h / 2), text, font=get_font(12.5))
        centers.append(((bx0 + bx1) / 2, cy - box_h / 2, (bx0 + bx1) / 2, cy + box_h / 2))
    for i in range(len(centers) - 1):
        draw_arrow(draw, (centers[i][0], centers[i][3]), (centers[i + 1][0], centers[i + 1][1]))
    return save(img, path)


def erd(entities, relationships, path, width=1150, title=None):
    """entities: list of (name, [attr,...]); relationships: list of (from, to, label)."""
    col_count = min(3, len(entities))
    rows = (len(entities) + col_count - 1) // col_count
    cell_w = width / col_count
    row_h = 230
    top = 90 if title else 30
    img, draw = new_canvas(width, top + rows * row_h + 30)
    if title:
        draw_centered_text(draw, width / 2, 28, title, get_font(20, bold=True), fill=NAVY, max_width=width - 40)
    positions = {}
    for idx, (name, attrs) in enumerate(entities):
        r, c = divmod(idx, col_count)
        x0 = c * cell_w + 20
        x1 = (c + 1) * cell_w - 20
        y0 = top + r * row_h + 10
        box_h = 26 + 18 * len(attrs) + 10
        y1 = y0 + box_h
        draw.rectangle((x0, y0, x1, y1), fill=WHITE, outline=NAVY, width=2)
        draw.rectangle((x0, y0, x1, y0 + 26), fill=NAVY, outline=NAVY)
        draw_centered_text(draw, (x0 + x1) / 2, y0 + 13, name, get_font(13, bold=True), fill=WHITE, max_width=(x1 - x0 - 10))
        fy = y0 + 32
        for attr in attrs:
            draw.text((x0 + 10, fy), "• " + attr, font=get_font(11), fill=NAVY)
            fy += 18
        positions[name] = (x0, y0, x1, y1)
    for a, b, label in relationships:
        if a not in positions or b not in positions:
            continue
        ax0, ay0, ax1, ay1 = positions[a]
        bx0, by0, bx1, by1 = positions[b]
        acx, acy = (ax0 + ax1) / 2, (ay0 + ay1) / 2
        bcx, bcy = (bx0 + bx1) / 2, (by0 + by1) / 2
        if abs(acy - bcy) < 5:
            # cung hang: noi canh phai/trai
            if acx < bcx:
                p1, p2 = (ax1, acy), (bx0, bcy)
            else:
                p1, p2 = (ax0, acy), (bx1, bcy)
        else:
            # khac hang: noi canh duoi/tren
            if acy < bcy:
                p1, p2 = (acx, ay1), (bcx, by0)
            else:
                p1, p2 = (acx, ay0), (bcx, by1)
        draw_arrow(draw, p1, p2, label=label, dashed=False)
    return save(img, path)


def grid2x2(items, path, width=900, height=620, title=None, axis_x="Mức quan tâm", axis_y="Quyền lực",
            quad_labels=("Giữ liên lạc", "Quản lý chặt", "Theo dõi tối thiểu", "Thông báo thường xuyên")):
    top = 70 if title else 30
    img, draw = new_canvas(width, top + height)
    if title:
        draw_centered_text(draw, width / 2, 24, title, get_font(18, bold=True), fill=NAVY, max_width=width - 40)
    pad = 60
    x0, y0, x1, y1 = pad, top + 10, width - 220, top + height - 50
    draw.rectangle((x0, y0, x1, y1), outline=NAVY, width=2)
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    draw.line((mx, y0, mx, y1), fill=NAVY, width=1)
    draw.line((x0, my, x1, my), fill=NAVY, width=1)
    f = get_font(11)
    draw_centered_text(draw, (x0 + mx) / 2, (y0 + my) / 2, quad_labels[1], f, fill=GREY)
    draw_centered_text(draw, (mx + x1) / 2, (y0 + my) / 2, quad_labels[0], f, fill=GREY)
    draw_centered_text(draw, (x0 + mx) / 2, (my + y1) / 2, quad_labels[2], f, fill=GREY)
    draw_centered_text(draw, (mx + x1) / 2, (my + y1) / 2, quad_labels[3], f, fill=GREY)
    draw.text((x0 - 50, y0 - 10), "Cao", font=get_font(12), fill=NAVY)
    draw.text((x0 - 55, y1 - 10), "Thấp", font=get_font(12), fill=NAVY)
    draw.text((x0 - 10, y1 + 10), "Thấp", font=get_font(12), fill=NAVY)
    draw.text((x1 - 20, y1 + 10), "Cao", font=get_font(12), fill=NAVY)
    draw_centered_text(draw, (x0 + x1) / 2, y1 + 32, axis_x, get_font(13, bold=True), fill=NAVY)
    for name, px, py in items:
        cx = x0 + px * (x1 - x0)
        cy = y1 - py * (y1 - y0)
        draw.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill=ACCENT, outline=NAVY)
        draw.text((cx + 8, cy - 7), name, font=get_font(12), fill=NAVY)
    return save(img, path)


def fishbone(problem, bones, path, width=1100, height=560):
    """bones: list of (category, [cause,...])."""
    img, draw = new_canvas(width, height)
    spine_y = height / 2
    draw_arrow(draw, (60, spine_y), (width - 160, spine_y), width=3)
    draw_box(draw, (width - 170, spine_y - 40, width - 20, spine_y + 40), problem, font=get_font(14, bold=True), fill="#FDEDEC", outline=ACCENT)
    n = len(bones)
    seg = (width - 260) / max(1, n)
    for i, (cat, causes) in enumerate(bones):
        x = 90 + seg * i + seg * 0.5
        up = i % 2 == 0
        y_end = spine_y - 160 if up else spine_y + 160
        draw_arrow(draw, (x - 40, y_end), (x + 40, spine_y), color=GREY)
        draw.text((x - 30 if up else x - 30, y_end - 16 if up else y_end + 4), cat, font=get_font(13, bold=True), fill=NAVY)
        for j, cause in enumerate(causes):
            t = (j + 1) / (len(causes) + 1)
            cx = (x - 40) + ((x + 40) - (x - 40)) * t
            cy = y_end + (spine_y - y_end) * t
            offset = -14 if up else 14
            draw.text((cx + 6, cy + offset), cause, font=get_font(10.5), fill=GREY)
    return save(img, path)


def layers(layer_names, path, width=760, layer_h=70, title=None):
    top = 70 if title else 30
    img, draw = new_canvas(width, top + layer_h * len(layer_names) + 30)
    if title:
        draw_centered_text(draw, width / 2, 28, title, get_font(19, bold=True), fill=NAVY, max_width=width - 40)
    for i, name in enumerate(layer_names):
        y0 = top + i * layer_h
        y1 = y0 + layer_h - 10
        draw_box(draw, (40, y0, width - 40, y1), name, font=get_font(15, bold=True))
        if i < len(layer_names) - 1:
            draw_arrow(draw, (width / 2, y1), (width / 2, y1 + 10))
    return save(img, path)


def tree(root, children, path, width=1000, title=None):
    """children: list of (parent_label_or_None, label). None parent => direct child of root."""
    top = 80 if title else 40
    img, draw = new_canvas(width, top + 260)
    if title:
        draw_centered_text(draw, width / 2, 24, title, get_font(18, bold=True), fill=NAVY, max_width=width - 40)
    rx0, ry0, rx1, ry1 = width / 2 - 90, top, width / 2 + 90, top + 40
    draw_box(draw, (rx0, ry0, rx1, ry1), root, font=get_font(14, bold=True), fill=NAVY, text_color=WHITE)
    n = len(children)
    seg = (width - 80) / max(1, n)
    for i, (_, label) in enumerate(children):
        cx = 40 + seg * i + seg / 2
        cy0 = top + 110
        draw_box(draw, (cx - seg * 0.42, cy0, cx + seg * 0.42, cy0 + 50), label, font=get_font(11.5))
        draw_arrow(draw, ((rx0 + rx1) / 2, ry1), (cx, cy0))
    return save(img, path)


def wireframe(regions, path, width=480, height=760, title=None):
    """regions: list of (x0,y0,x1,y1,label) in 0..1 normalized coords."""
    top = 40 if title else 10
    img, draw = new_canvas(width, top + height + 10)
    draw.rectangle((0, top, width, top + height), outline=NAVY, width=3)
    if title:
        draw_centered_text(draw, width / 2, 20, title, get_font(14, bold=True), fill=NAVY, max_width=width - 20)
    for x0, y0, x1, y1, label in regions:
        box = (x0 * width, top + y0 * height, x1 * width, top + y1 * height)
        draw.rectangle(box, outline=NAVY, width=1, fill="#F7F9FC")
        draw_centered_text(draw, (box[0] + box[2]) / 2, (box[1] + box[3]) / 2, label, get_font(11), fill=GREY, max_width=box[2] - box[0] - 10)
    return save(img, path)


def usecase_diagram(actors, groups, links, path, width=1100, title=None, ellipse_w=230, row_h=46):
    """actors: list of (name, side) side in {'left','right'}.
    groups: list of (group_name, [usecase_label,...]) stacked vertically inside the system box.
    links: list of (actor_name, usecase_label) -> ve duong noi actor toi dung use case."""
    total_ucs = sum(len(ucs) for _, ucs in groups)
    content_h = len(groups) * 30 + total_ucs * row_h + 40
    n_actors = max(len(actors), 1)
    actor_h = n_actors // 2 * 150 + 150
    height = max(content_h, actor_h) + 60
    top = 70 if title else 30
    img, draw = new_canvas(width, top + height)
    if title:
        draw_centered_text(draw, width / 2, 24, title, get_font(19, bold=True), fill=NAVY, max_width=width - 40)
    sys_box = (210, top + 20, width - 210, top + height - 20)
    draw.rectangle(sys_box, outline=NAVY, width=2)
    draw.text((sys_box[0] + 10, sys_box[1] - 22), "Hệ thống BoardVerse", font=get_font(13, bold=True), fill=NAVY)

    left_actors = [a for a in actors if a[1] == "left"]
    right_actors = [a for a in actors if a[1] == "right"]
    actor_pos = {}
    for i, (name, _) in enumerate(left_actors):
        ay = top + 70 + i * 150
        draw_actor(draw, 75, ay + 46, name)
        actor_pos[name] = (110, ay + 10)
    for i, (name, _) in enumerate(right_actors):
        ay = top + 70 + i * 150
        draw_actor(draw, width - 75, ay + 46, name)
        actor_pos[name] = (width - 110, ay + 10)

    uc_pos = {}
    gx0, gx1 = sys_box[0] + 30, sys_box[2] - 30
    gcx = (gx0 + gx1) / 2
    gy = sys_box[1] + 30
    for gname, ucs in groups:
        draw.text((gx0, gy - 18), gname, font=get_font(12, bold=True), fill=GREY)
        for uc in ucs:
            cy = gy + 16
            box = (gcx - ellipse_w / 2, cy - 18, gcx + ellipse_w / 2, cy + 18)
            draw_ellipse(draw, box, uc, font=get_font(11.5))
            uc_pos[uc] = (gcx, cy)
            gy += row_h
        gy += 20

    for actor_name, uc_label in links:
        if actor_name in actor_pos and uc_label in uc_pos:
            ax, ay = actor_pos[actor_name]
            ux, uy = uc_pos[uc_label]
            side = "left" if actor_name in dict(left_actors) else "right"
            edge_x = sys_box[0] if side == "left" else sys_box[2]
            draw_arrow(draw, (ax, ay), (edge_x, uy), color=GREY, width=1)
            draw.line((edge_x, uy, ux - ellipse_w / 2 if side == "left" else ux + ellipse_w / 2, uy), fill=GREY, width=1)
    return save(img, path)


def sequence_diagram(lifelines, messages, path, width=900, title=None):
    """lifelines: list of names (left to right). messages: list of (from_idx, to_idx, label)."""
    top = 80 if title else 40
    n = len(lifelines)
    col_w = (width - 180) / max(1, n - 1 if n > 1 else 1)
    row_h = 60
    height = top + 60 + len(messages) * row_h + 40
    img, draw = new_canvas(width, height)
    if title:
        draw_centered_text(draw, width / 2, 24, title, get_font(18, bold=True), fill=NAVY, max_width=width - 40)
    xs = []
    for i, name in enumerate(lifelines):
        x = 90 + i * col_w
        xs.append(x)
        draw_box(draw, (x - 70, top, x + 70, top + 36), name, font=get_font(12.5, bold=True))
        draw.line((x, top + 36, x, height - 20), fill="#9AA7B8", width=1)
    y = top + 70
    for f, t, label in messages:
        draw_arrow(draw, (xs[f], y), (xs[t], y), label=label, dashed=(f > t))
        y += row_h
    return save(img, path)
