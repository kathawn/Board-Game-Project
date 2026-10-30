import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** UC-15: ảnh sản phẩm do Admin tải lên, lưu vào public/images/products/ rồi ghi đường dẫn vào SanPham.anhUrl.
 * Tên file do server tự đặt từ slug (đã kiểm tra regex) + thời điểm tải — KHÔNG dùng tên file client gửi, nên không
 * thể ghi đè file khác hay thoát khỏi thư mục (path traversal). Loại file xác định theo "chữ ký" byte đầu file, không
 * tin Content-Type/đuôi file do client khai. Lưu ý: ghi vào public/ chỉ hợp với chạy local/dev — môi trường deploy
 * thật cần chuyển sang object storage. */

export const ANH_TOI_DA_BYTES = 2 * 1024 * 1024;
const THU_MUC = path.join(process.cwd(), "public", "images", "products");
const URL_GOC = "/images/products/";

type Dang = { ext: "jpg" | "png" | "webp" };

export function nhanDangAnh(b: Buffer): Dang | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg" };
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png" };
  }
  if (b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") {
    return { ext: "webp" };
  }
  return null;
}

export type LuuAnh = { ok: true; url: string } | { ok: false; error: string };

export async function luuAnhSanPham(slug: string, data: Buffer): Promise<LuuAnh> {
  if (data.length === 0) return { ok: false, error: "File ảnh rỗng." };
  if (data.length > ANH_TOI_DA_BYTES) return { ok: false, error: "Ảnh tối đa 2MB." };
  const dang = nhanDangAnh(data);
  if (!dang) return { ok: false, error: "Chỉ nhận ảnh JPG, PNG hoặc WebP." };

  await mkdir(THU_MUC, { recursive: true });
  const ten = `${slug}-${Date.now()}.${dang.ext}`;
  await writeFile(path.join(THU_MUC, ten), data);
  return { ok: true, url: URL_GOC + ten };
}

/** Xoá file ảnh cũ — chỉ xoá file nằm trong thư mục ảnh upload (không đụng ảnh mẫu của seed). */
export async function xoaAnhCu(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(URL_GOC)) return;
  const ten = path.basename(url);
  try {
    await unlink(path.join(THU_MUC, ten));
  } catch {
    // file đã mất thì thôi
  }
}
