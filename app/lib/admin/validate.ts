import type { AdminProductInput } from "./types";

/** UC-15 (FR-ADM-03): kiểm tra dữ liệu Admin nhập khi thêm/sửa sản phẩm. Hàm thuần để test được không cần DB. */

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Cột giaNiemYet là DECIMAL(12,0) (ERD) nên tối đa 12 chữ số. */
export const GIA_TOI_DA = 999_999_999_999;

export type ValidationResult = { ok: true; value: AdminProductInput } | { ok: false; error: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateProductInput(raw: unknown): ValidationResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const value: AdminProductInput = {
    slug: str(o.slug),
    ten: str(o.ten),
    danhMuc: str(o.danhMuc),
    giaNiemYet: Number(o.giaNiemYet),
    moTaNgan: str(o.moTaNgan),
    soNguoiMin: Number(o.soNguoiMin),
    soNguoiMax: Number(o.soNguoiMax),
  };

  if (!value.ten) return { ok: false, error: "Tên sản phẩm không được để trống." };
  if (value.ten.length > 200) return { ok: false, error: "Tên sản phẩm tối đa 200 ký tự." };
  if (!value.slug || !SLUG_RE.test(value.slug)) {
    return { ok: false, error: "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang (vd: co-ty-phu)." };
  }
  if (value.slug.length > 100) return { ok: false, error: "Slug tối đa 100 ký tự." };
  if (!value.danhMuc) return { ok: false, error: "Danh mục không được để trống." };
  if (value.danhMuc.length > 100) return { ok: false, error: "Danh mục tối đa 100 ký tự." };
  if (!Number.isInteger(value.giaNiemYet) || value.giaNiemYet <= 0 || value.giaNiemYet > GIA_TOI_DA) {
    return { ok: false, error: "Giá niêm yết phải là số nguyên đồng lớn hơn 0." };
  }
  if (!Number.isInteger(value.soNguoiMin) || value.soNguoiMin < 1) {
    return { ok: false, error: "Số người tối thiểu phải từ 1 trở lên." };
  }
  if (!Number.isInteger(value.soNguoiMax) || value.soNguoiMax < value.soNguoiMin || value.soNguoiMax > 100) {
    return { ok: false, error: "Số người tối đa phải lớn hơn hoặc bằng số người tối thiểu (và không quá 100)." };
  }
  if (value.moTaNgan.length > 500) return { ok: false, error: "Mô tả ngắn tối đa 500 ký tự." };
  return { ok: true, value };
}
