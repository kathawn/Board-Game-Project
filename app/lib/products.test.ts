import { describe, test, expect } from "vitest";
import { checkStock, filterProducts, getProductBySlug, PRODUCTS } from "./products";

describe("filterProducts (FR-BH-02)", () => {
  test("returns all products when no filter is given", () => {
    const result = filterProducts(PRODUCTS, {});

    expect(result).toHaveLength(PRODUCTS.length);
  });

  test("matches products whose name contains the keyword, case-insensitively", () => {
    const result = filterProducts(PRODUCTS, { q: "catan" });

    expect(result.map((p) => p.slug)).toEqual(["catan"]);
  });

  test("filters by exact category", () => {
    const result = filterProducts(PRODUCTS, { danhMuc: "Bài - Gia đình" });

    expect(result.map((p) => p.slug).sort()).toEqual(["exploding-kittens", "uno"]);
  });

  test("filters by sale price range (loai=ban) using giaNiemYet", () => {
    const result = filterProducts(PRODUCTS, { loai: "ban", giaMin: 440000, giaMax: 460000 });

    expect(result.map((p) => p.slug)).toEqual(["co-ty-phu"]);
  });

  test("filters by rent price range (loai=thue) using the day-1 rent price, not the sale price", () => {
    // Splendor's sale price (480000) falls inside 400000-500000, but its day-1
    // rent price (10% of 480000 = 48000) does not — only Coup's (28000) does.
    const result = filterProducts(PRODUCTS, { loai: "thue", giaMin: 25000, giaMax: 30000 });

    expect(result.map((p) => p.slug)).toEqual(["coup"]);
  });

  test("combines keyword, category, and price filters together", () => {
    const result = filterProducts(PRODUCTS, {
      q: "o",
      danhMuc: "Chiến thuật - Thu thập",
      loai: "ban",
      giaMin: 0,
      giaMax: 1000000,
    });

    expect(result.map((p) => p.slug)).toEqual(["splendor"]);
  });

  test("returns an empty list when nothing matches", () => {
    const result = filterProducts(PRODUCTS, { q: "khong-ton-tai" });

    expect(result).toEqual([]);
  });
});

describe("getProductBySlug (FR-BH-03)", () => {
  test("returns the product with a full linhKien checklist when the slug exists", () => {
    const result = getProductBySlug("catan");

    expect(result?.slug).toBe("catan");
    expect(result?.linhKien).toEqual(PRODUCTS.find((p) => p.slug === "catan")?.linhKien);
  });

  test("returns undefined when no product matches the slug", () => {
    const result = getProductBySlug("khong-ton-tai");

    expect(result).toBeUndefined();
  });
});

describe("checkStock (FR-BH-04)", () => {
  const catan = PRODUCTS.find((p) => p.slug === "catan")!; // soLuongTon: 2
  const coup = PRODUCTS.find((p) => p.slug === "coup")!; // soLuongTon: 0

  test("allows checkout when the product has at least the requested quantity available", () => {
    const result = checkStock(catan, 2);

    expect(result).toEqual({ ok: true });
  });

  test("rejects with a clear message when the product is completely out of stock", () => {
    const result = checkStock(coup, 1);

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toContain("hết hàng");
  });

  test("rejects with a clear message when fewer units are available than requested", () => {
    const result = checkStock(catan, 3);

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toContain("không đủ");
  });

  test("rejects a zero quantity as an invalid selection, even when the product has stock", () => {
    const result = checkStock(catan, 0);

    expect(result.ok).toBe(false);
  });

  test("rejects a negative quantity as an invalid selection", () => {
    const result = checkStock(catan, -5);

    expect(result.ok).toBe(false);
  });

  test("rejects a non-numeric (NaN) quantity as an invalid selection", () => {
    const result = checkStock(catan, Number("abc"));

    expect(result.ok).toBe(false);
  });
});
