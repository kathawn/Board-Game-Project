import { requireStaff } from "@/lib/auth/staff";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/db/client";
import {
  CHUYEN_HOP_LE,
  TRANG_THAI_HOP_GAME,
  doiTrangThaiHop,
  isTrangThaiHopGame,
  type TrangThaiHopGame,
} from "@/lib/rentals/box-state";

/** UC-09 (FR-KHO-02): Staff tra cứu hộp game và đổi trạng thái theo State Machine (SRS 3.6, Hình 3.7).
 * GET  ?q=&trangThai=&page=&pageSize= → danh sách hộp có tìm kiếm (mã hộp / tên sản phẩm), lọc theo trạng thái
 *      (trangThai = "canxuly" gộp Checking + Damaged, "all", hoặc một trạng thái) và phân trang, kèm số hộp theo trạng thái.
 * POST { maHop, trangThai } → đổi trạng thái; cung không hợp lệ trả 409. */
export async function GET(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const loc = url.searchParams.get("trangThai") ?? "canxuly";
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize")) || 10));

  const timKiem: Prisma.HopGameWhereInput = q
    ? { OR: [{ maHop: { contains: q } }, { sanPham: { ten: { contains: q } } }] }
    : {};
  const theoTrangThai: Prisma.HopGameWhereInput =
    loc === "all"
      ? {}
      : loc === "canxuly"
        ? { trangThai: { in: ["Checking", "Damaged"] } }
        : isTrangThaiHopGame(loc)
          ? { trangThai: loc }
          : {};

  const db = getPrisma();
  const total = await db.hopGame.count({ where: { AND: [timKiem, theoTrangThai] } });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Number(url.searchParams.get("page")) || 1));

  const [boxes, grouped] = await Promise.all([
    db.hopGame.findMany({
      where: { AND: [timKiem, theoTrangThai] },
      include: { sanPham: { select: { ten: true } } },
      orderBy: { maHop: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.hopGame.groupBy({ by: ["trangThai"], where: timKiem, _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(TRANG_THAI_HOP_GAME.map((t) => [t, 0])) as Record<TrangThaiHopGame, number>;
  for (const g of grouped) counts[g.trangThai as TrangThaiHopGame] = g._count._all;

  return Response.json({
    ok: true,
    boxes: boxes.map((b) => ({
      maHop: b.maHop,
      tenSanPham: b.sanPham.ten,
      trangThai: b.trangThai,
      tiepTheo: CHUYEN_HOP_LE[b.trangThai as TrangThaiHopGame] ?? [],
    })),
    total,
    page,
    pageSize,
    totalPages,
    counts,
  });
}

export async function POST(request: Request) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không phải JSON hợp lệ." }, { status: 400 });
  }
  const { maHop, trangThai } = body;
  if (typeof maHop !== "string" || !maHop.trim() || !isTrangThaiHopGame(trangThai)) {
    return Response.json({ error: "Thiếu maHop hoặc trangThai không hợp lệ." }, { status: 400 });
  }
  const result = await doiTrangThaiHop(getPrisma(), maHop.trim(), trangThai);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ ok: true, maHop: result.maHop, tu: result.tu, den: result.den });
}
