import { randomBytes } from "node:crypto";
import type { DoiTacGiaoVan } from "../rentals/deposit";
import type { ChieuGiaoVan } from "./types";

/** FR-TTGV-03/04: cổng gọi API đối tác giao vận để tạo yêu cầu giao/lấy hàng. Đối tác thứ 3 là GIẢ LẬP
 * (CLAUDE.md quy tắc 5) — không gọi API thật. Theo đề xuất MVP 2.2 chỉ có MỘT bộ giả lập dùng chung: logic
 * chọn đối tác theo ngưỡng 20km (BRU-05) vẫn chạy, nhưng "Shopee Express" chỉ khác tên và tiền tố mã vận đơn. */

export interface CreateShipmentInput {
  maDon: string;
  chieu: ChieuGiaoVan;
  diaChi: string;
  doiTac: DoiTacGiaoVan;
  khoangCachKm: number;
  phiShip: number;
}

export interface CarrierClient {
  /** Trả về mã vận đơn của đối tác; ném lỗi nếu đối tác lỗi/không khả dụng (UC-06 2a, UC-11 4a). */
  createShipment(input: CreateShipmentInput): Promise<{ maVanDon: string }>;
  /** Huỷ yêu cầu đã tạo — dùng để bù trừ khi một bước sau đó thất bại và đơn bị rollback, để đối tác không
   * giữ vận đơn mà BoardVerse không còn theo dõi. Best-effort: lỗi huỷ không được che lỗi gốc. */
  cancelShipment(maVanDon: string): Promise<void>;
}

const TIEN_TO_MA_VAN_DON: Record<DoiTacGiaoVan, string> = { GreenSM: "GSM", ShopeeExpress: "SPX" };

// Cờ "đối tác đang lỗi" để thử luồng ngoại lệ bằng tay (trang /mock-green-sm). Đặt trên globalThis để
// `next dev` hot-reload không làm mất. Không bao giờ có hiệu lực ở production.
const g = globalThis as unknown as { __bvGreenSmDown?: boolean };

export function setCarrierDown(down: boolean): void {
  g.__bvGreenSmDown = down;
}

export function isCarrierDown(): boolean {
  return process.env.NODE_ENV !== "production" && g.__bvGreenSmDown === true;
}

export function createMockCarrier(): CarrierClient {
  return {
    async createShipment(input) {
      if (isCarrierDown()) throw new Error(`${input.doiTac} không khả dụng (giả lập).`);
      return { maVanDon: `${TIEN_TO_MA_VAN_DON[input.doiTac]}-${randomBytes(4).toString("hex").toUpperCase()}` };
    },
    async cancelShipment() {
      // Giả lập: đối tác không lưu gì nên không có gì để huỷ.
    },
  };
}
