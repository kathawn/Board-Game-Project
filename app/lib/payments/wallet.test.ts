import { describe, expect, it } from "vitest";
import {
  buildWalletWhere,
  getWalletLedger,
  maskTaiKhoan,
  nhomButToan,
  rutTienVi,
  validateRutTien,
} from "./wallet";
import type { PrismaClient } from "../generated/prisma/client";

type Entry = { id: string; soTien: number; lyDo: string; maGiaoDich: string | null; ngayTao: Date };

/** Fake không đánh giá được `where` của Prisma → suy nhóm từ chuỗi where do buildWalletWhere sinh ra
 * (đã test riêng): NOT = nhóm tien, RUT- = nhóm rut, HUYDON- = nhóm coc, không có = tất cả. */
function locTheoWhere(entries: Entry[], where: unknown): Entry[] {
  const tag = JSON.stringify(where);
  if (tag.includes("NOT")) return entries.filter((e) => nhomButToan(e.maGiaoDich) === "tien");
  if (tag.includes("RUT-")) return entries.filter((e) => nhomButToan(e.maGiaoDich) === "rut");
  if (tag.includes("HUYDON-")) return entries.filter((e) => nhomButToan(e.maGiaoDich) === "coc");
  return entries;
}

/** DB giả tối thiểu: một ví có sẵn các bút toán (mới nhất trước, như orderBy ngayTao desc). */
function fakeDb(soDu: number | null, entries: Entry[]): PrismaClient {
  return {
    viDienTu: {
      findFirst: async () => (soDu === null ? null : { id: "vi-1", soDu }),
    },
    butToanVi: {
      aggregate: async () => ({
        _sum: { soTien: entries.filter((e) => e.soTien > 0).reduce((n, e) => n + e.soTien, 0) },
      }),
      count: async ({ where }: { where: unknown }) => locTheoWhere(entries, where).length,
      findMany: async ({ where, skip, take }: { where: unknown; skip: number; take: number }) =>
        locTheoWhere(entries, where).slice(skip, skip + take),
    },
  } as unknown as PrismaClient;
}

const entry = (i: number, maGiaoDich: string | null = `HOANCOC-${i}`): Entry => ({
  id: `e${i}`,
  soTien: 100000 * i,
  lyDo: `Hoàn cọc ${i}`,
  maGiaoDich,
  ngayTao: new Date(Date.UTC(2026, 9, i)),
});

describe("nhomButToan", () => {
  it("HUYDON-/HOANCOC- là hoàn cọc đơn; RUT- là rút tiền; còn lại (MOMO-...) là hoàn tiền thanh toán", () => {
    expect(nhomButToan("HUYDON-DT-00018")).toBe("coc");
    expect(nhomButToan("HOANCOC-DT-90002")).toBe("coc");
    expect(nhomButToan("MOMO-abc")).toBe("tien");
    expect(nhomButToan(null)).toBe("tien");
    expect(nhomButToan("RUT-1A2B3C")).toBe("rut");
  });
});

describe("buildWalletWhere", () => {
  it("luôn giới hạn theo ví của khách", () => {
    expect(buildWalletWhere("vi-1", {})).toEqual({ viId: "vi-1" });
  });

  it("tìm kiếm khớp lý do hoặc mã giao dịch, bỏ khoảng trắng thừa", () => {
    const w = buildWalletWhere("vi-1", { q: "  DT-00018 " });
    expect(JSON.stringify(w)).toContain('"contains":"DT-00018"');
    expect(JSON.stringify(w)).toContain("lyDo");
    expect(JSON.stringify(w)).toContain("maGiaoDich");
  });

  it("nhóm coc lọc theo tiền tố mã giao dịch HUYDON-/HOANCOC-", () => {
    const s = JSON.stringify(buildWalletWhere("vi-1", { nhom: "coc" }));
    expect(s).toContain("HUYDON-");
    expect(s).toContain("HOANCOC-");
    expect(s).not.toContain("NOT");
  });

  it("nhóm tien là phần bù của nhóm coc và rut (kể cả mã giao dịch null)", () => {
    const s = JSON.stringify(buildWalletWhere("vi-1", { nhom: "tien" }));
    expect(s).toContain("NOT");
    expect(s).toContain("RUT-");
    expect(s).toContain("null");
  });

  it("nhóm rut lọc theo tiền tố RUT-", () => {
    const s = JSON.stringify(buildWalletWhere("vi-1", { nhom: "rut" }));
    expect(s).toContain("RUT-");
    expect(s).not.toContain("NOT");
  });
});

describe("getWalletLedger", () => {
  it("khách chưa có ví → số dư 0, sổ cái rỗng, vẫn là trang 1/1", async () => {
    const r = await getWalletLedger(fakeDb(null, []), "a@x.vn", { page: 1 });
    expect(r).toEqual({
      soDu: 0,
      tongHoan: 0,
      rows: [],
      total: 0,
      page: 1,
      totalPages: 1,
      dem: { all: 0, coc: 0, tien: 0, rut: 0 },
    });
  });

  it("trả số dư, bút toán của trang yêu cầu và tổng tiền đã hoàn lấy từ toàn bộ sổ cái", async () => {
    const all = [3, 2, 1].map((i) => entry(i));
    const r = await getWalletLedger(fakeDb(600000, all), "a@x.vn", { page: 1, pageSize: 2 });
    expect(r.soDu).toBe(600000);
    expect(r.tongHoan).toBe(600000);
    expect(r.rows.map((x) => x.id)).toEqual(["e3", "e2"]);
    expect(r.total).toBe(3);
    expect(r.totalPages).toBe(2);
  });

  it("page vượt quá số trang → kẹp về trang cuối", async () => {
    const all = [3, 2, 1].map((i) => entry(i));
    const r = await getWalletLedger(fakeDb(600000, all), "a@x.vn", { page: 99, pageSize: 2 });
    expect(r.page).toBe(2);
    expect(r.rows.map((x) => x.id)).toEqual(["e1"]);
  });

  it("ngày tạo được trả dạng ISO string để JSON hoá", async () => {
    const r = await getWalletLedger(fakeDb(100000, [entry(1)]), "a@x.vn", { page: 1 });
    expect(r.rows[0].ngayTao).toBe("2026-10-01T00:00:00.000Z");
    expect(r.rows[0].soTien).toBe(100000);
  });

  it("có số đếm từng nhóm; lọc theo nhóm thì total/rows chỉ tính nhóm đó, số đếm giữ nguyên", async () => {
    const all = [entry(3, "HUYDON-DT-3"), entry(2, "MOMO-x"), entry(1, "HOANCOC-DT-1")];
    const r = await getWalletLedger(fakeDb(600000, all), "a@x.vn", { page: 1, nhom: "coc" });
    expect(r.dem).toEqual({ all: 3, coc: 2, tien: 1, rut: 0 });
    expect(r.total).toBe(2);
    expect(r.rows.map((x) => x.id)).toEqual(["e3", "e1"]);

    const tien = await getWalletLedger(fakeDb(600000, all), "a@x.vn", { page: 1, nhom: "tien" });
    expect(tien.total).toBe(1);
    expect(tien.rows.map((x) => x.id)).toEqual(["e2"]);
  });

  it("bút toán rút tiền (âm) được đếm ở nhóm rut và không làm giảm tổng đã hoàn", async () => {
    const rut: Entry = { id: "r1", soTien: -200000, lyDo: "Rút tiền", maGiaoDich: "RUT-AB12", ngayTao: new Date(Date.UTC(2026, 9, 5)) };
    const all = [rut, entry(2, "HUYDON-DT-2")];
    const r = await getWalletLedger(fakeDb(0, all), "a@x.vn", { page: 1, nhom: "rut" });
    expect(r.dem.rut).toBe(1);
    expect(r.rows.map((x) => x.id)).toEqual(["r1"]);
    expect(r.rows[0].soTien).toBe(-200000);
    expect(r.tongHoan).toBe(200000);
  });

  it("truy vấn tổng đã hoàn chỉ cộng bút toán dương", async () => {
    let whereAgg: unknown;
    const db = {
      viDienTu: { findFirst: async () => ({ id: "vi-1", soDu: 100000 }) },
      butToanVi: {
        aggregate: async (args: { where: unknown }) => {
          whereAgg = args.where;
          return { _sum: { soTien: 300000 } };
        },
        count: async () => 0,
        findMany: async () => [],
      },
    } as unknown as PrismaClient;
    await getWalletLedger(db, "a@x.vn", {});
    expect(JSON.stringify(whereAgg)).toContain('"gt":0');
  });
});

describe("maskTaiKhoan", () => {
  it("chỉ giữ 4 số cuối", () => {
    expect(maskTaiKhoan("0123456789")).toBe("••••6789");
    expect(maskTaiKhoan("123")).toBe("••••");
  });
});

describe("validateRutTien (UC-20)", () => {
  const ok = { soTien: 500000, nganHang: "Vietcombank", soTaiKhoan: "0123456789", tenChuTaiKhoan: "Nguyen Van A" };

  it("hợp lệ → trả giá trị đã chuẩn hoá (cắt khoảng trắng)", () => {
    const r = validateRutTien({ ...ok, nganHang: "  Vietcombank ", soTaiKhoan: " 0123456789 " });
    expect(r).toEqual({ ok: true, value: ok });
  });

  it.each([
    ["số tiền 0", { ...ok, soTien: 0 }],
    ["số tiền âm", { ...ok, soTien: -5 }],
    ["số tiền lẻ", { ...ok, soTien: 1000.5 }],
    ["số tiền không phải số", { ...ok, soTien: "abc" }],
    ["thiếu ngân hàng", { ...ok, nganHang: "  " }],
    ["số tài khoản có chữ", { ...ok, soTaiKhoan: "01234abc" }],
    ["số tài khoản quá ngắn", { ...ok, soTaiKhoan: "123" }],
    ["thiếu tên chủ tài khoản", { ...ok, tenChuTaiKhoan: "" }],
    ["body không phải object", null],
    ["số tiền vượt giới hạn cột Decimal(12,0)", { ...ok, soTien: 1_000_000_000_000 }],
    ["số tiền không phải số nguyên an toàn", { ...ok, soTien: 1e300 }],
    ["tên ngân hàng quá dài", { ...ok, nganHang: "A".repeat(101) }],
    ["tên chủ tài khoản quá dài", { ...ok, tenChuTaiKhoan: "A".repeat(101) }],
    ["mã yêu cầu chứa ký tự lạ", { ...ok, maYeuCau: "abc def!" }],
  ])("từ chối: %s", (_ten, input) => {
    expect(validateRutTien(input).ok).toBe(false);
  });

  it("nhận mã yêu cầu hợp lệ (chống gửi trùng)", () => {
    const r = validateRutTien({ ...ok, maYeuCau: "3f2c9a1e-5b7d-4e8a-9c01-aabbccddeeff" });
    expect(r).toMatchObject({ ok: true, value: { maYeuCau: "3f2c9a1e-5b7d-4e8a-9c01-aabbccddeeff" } });
  });
});

describe("rutTienVi (UC-20, FR-TTGV-09)", () => {
  const input = { soTien: 300000, nganHang: "Vietcombank", soTaiKhoan: "0123456789", tenChuTaiKhoan: "Nguyen Van A" };

  function fakeRutDb(soDu: number | null) {
    const state = { soDu, ledger: [] as { soTien: number; lyDo: string; maGiaoDich: string }[] };
    const tx = {
      // lockResource (sp_getapplock) trả mã 0 = lấy khoá thành công.
      $queryRaw: async () => [{ r: 0 }],
      viDienTu: {
        findFirst: async () => (state.soDu === null ? null : { id: "vi-1" }),
        // UPDATE có điều kiện: chỉ trừ khi số dư còn đủ, giống Prisma updateMany + gte.
        updateMany: async ({ where, data }: { where: { soDu: { gte: number } }; data: { soDu: { decrement: number } } }) => {
          if (state.soDu === null || state.soDu < where.soDu.gte) return { count: 0 };
          state.soDu -= data.soDu.decrement;
          return { count: 1 };
        },
        findUniqueOrThrow: async () => ({ soDu: state.soDu }),
      },
      butToanVi: {
        create: async ({ data }: { data: { soTien: number; lyDo: string; maGiaoDich: string } }) => state.ledger.push(data),
        findFirst: async ({ where }: { where: { maGiaoDich: string } }) =>
          state.ledger.find((l) => l.maGiaoDich === where.maGiaoDich) ?? null,
      },
    };
    const db = { $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx) } as unknown as PrismaClient;
    return { db, state };
  }

  it("số dư đủ → trừ đúng số tiền, ghi bút toán âm mã RUT-, che số tài khoản trong lý do", async () => {
    const { db, state } = fakeRutDb(1000000);
    const r = await rutTienVi(db, "a@x.vn", input);
    expect(r).toMatchObject({ ok: true, soDuMoi: 700000 });
    expect(state.soDu).toBe(700000);
    expect(state.ledger).toHaveLength(1);
    expect(state.ledger[0].soTien).toBe(-300000);
    expect(state.ledger[0].maGiaoDich).toMatch(/^RUT-/);
    expect(state.ledger[0].lyDo).toContain("Vietcombank");
    expect(state.ledger[0].lyDo).toContain("6789");
    expect(state.ledger[0].lyDo).not.toContain("0123456789");
  });

  it("rút đúng bằng số dư → về 0, vẫn hợp lệ (không âm)", async () => {
    const { db, state } = fakeRutDb(300000);
    expect(await rutTienVi(db, "a@x.vn", input)).toMatchObject({ ok: true, soDuMoi: 0 });
    expect(state.soDu).toBe(0);
  });

  it("số dư không đủ → 409, số dư giữ nguyên, không ghi bút toán", async () => {
    const { db, state } = fakeRutDb(299999);
    const r = await rutTienVi(db, "a@x.vn", input);
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(state.soDu).toBe(299999);
    expect(state.ledger).toHaveLength(0);
  });

  it("khách chưa có ví → 409 số dư không đủ", async () => {
    const { db } = fakeRutDb(null);
    expect(await rutTienVi(db, "a@x.vn", input)).toMatchObject({ ok: false, status: 409 });
  });

  it("rút về tài khoản đứng tên người khác vẫn được (không bắt buộc trùng họ tên đăng ký)", async () => {
    const { db, state } = fakeRutDb(1000000);
    const r = await rutTienVi(db, "a@x.vn", { ...input, tenChuTaiKhoan: "TRAN VAN B" });
    expect(r).toMatchObject({ ok: true, soDuMoi: 700000 });
    expect(state.soDu).toBe(700000);
  });

  it("gửi lại cùng mã yêu cầu (bấm đúp / retry khi mạng lỗi) → chỉ trừ ví một lần, trả lại kết quả cũ", async () => {
    const { db, state } = fakeRutDb(1000000);
    const req = { ...input, maYeuCau: "req-12345678" };
    const lan1 = await rutTienVi(db, "a@x.vn", req);
    const lan2 = await rutTienVi(db, "a@x.vn", req);
    expect(lan1).toMatchObject({ ok: true, soDuMoi: 700000, maGiaoDich: "RUT-req-12345678" });
    expect(lan2).toMatchObject({ ok: true, soDuMoi: 700000, maGiaoDich: "RUT-req-12345678" });
    expect(state.soDu).toBe(700000);
    expect(state.ledger).toHaveLength(1);
  });

  it("hai mã yêu cầu khác nhau là hai lần rút khác nhau", async () => {
    const { db, state } = fakeRutDb(1000000);
    await rutTienVi(db, "a@x.vn", { ...input, maYeuCau: "req-aaaaaaaa" });
    await rutTienVi(db, "a@x.vn", { ...input, maYeuCau: "req-bbbbbbbb" });
    expect(state.soDu).toBe(400000);
    expect(state.ledger).toHaveLength(2);
  });
});
