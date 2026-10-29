/** FR-CT-01 (BR-01, UC-04): giỏ thuê — khách thêm nhiều sản phẩm vào giỏ,
 * mỗi sản phẩm tự chọn ngày bắt đầu/kết thúc riêng. Tiêu chí chấp nhận của
 * FR-CT-01 yêu cầu mỗi dòng chỉ hợp lệ khi ngày kết thúc sau ngày bắt đầu
 * và sản phẩm còn trống trong khoảng đó — phần "còn trống" dùng đúng quy
 * tắc trùng lịch của FR-CT-02/BR-05 (trùng ít nhất 1 ngày với đơn thuê khác
 * còn hiệu lực, hoặc với dòng khác cùng sản phẩm đã có trong giỏ). "Đơn
 * thuê khác còn hiệu lực" tra từ rentalOrderStore thật (tiêm vào qua
 * getActiveReservations, xem lib/rentals/server.ts) — KHÔNG chỉ dựa vào
 * ACTIVE_RESERVATIONS demo bên dưới, nếu không mọi sản phẩm trừ Catan sẽ
 * không được chặn trùng lịch với đơn thật tạo qua checkout (FR-CT-05). */

export interface RentalCartLine {
  id: string;
  productSlug: string;
  startDate: string;
  endDate: string;
}

export interface ActiveReservation {
  startDate: string;
  endDate: string;
}

export type AddLineResult = { ok: true; line: RentalCartLine } | { ok: false; error: string };

export interface RentalCartStore {
  list(email: string): Promise<RentalCartLine[]>;
  /** productName chỉ dùng để nêu rõ tên sản phẩm trong thông báo lỗi trùng
   * lịch (FR-CT-02: "...nêu rõ sản phẩm bị trùng") — store không tự tra cứu
   * catalog sản phẩm, gọi nơi khác (route) phải resolve tên trước khi gọi. */
  addLine(
    email: string,
    input: { productSlug: string; productName: string; startDate: string; endDate: string },
  ): Promise<AddLineResult>;
  /** FR-CT-09: sửa ngày thuê của một dòng đã có trong giỏ — vẫn phải qua lại
   * đúng kiểm tra hợp lệ ngày + trùng lịch (FR-CT-02) như khi thêm mới, chỉ
   * loại trừ chính dòng đang sửa khỏi tập so trùng trong giỏ. */
  updateLine(
    email: string,
    lineId: string,
    input: { productName: string; startDate: string; endDate: string },
  ): Promise<AddLineResult>;
  removeLine(email: string, lineId: string): Promise<void>;
  /** FR-CT-05: xoá toàn bộ giỏ thuê sau khi đã chuyển thành đơn thuê (checkout). */
  clear(email: string): Promise<void>;
}

/** Đơn thuê còn hiệu lực đã tồn tại trong hệ thống TRƯỚC khi có luồng
 * checkout thật (giả định, seed để demo BR-05) — khớp đơn DH-00245 (Active,
 * 20/10→23/10/2026, Catan) đã seed ở lib/orders/store.ts. Giữ lại song song
 * với getActiveReservations (đơn thật từ rentalOrderStore) vì đơn demo này
 * không nằm trong rentalOrderStore — nó minh hoạ việc chặn trùng với dữ
 * liệu lịch sử có sẵn, không phải đơn tạo qua checkout của feature này. */
const ACTIVE_RESERVATIONS: Record<string, ActiveReservation[]> = {
  catan: [{ startDate: "2026-10-20", endDate: "2026-10-23" }],
};

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** FR-CT-02/BR-05: tra cứu đơn thuê thật (Pending/Confirmed — cả hai đều
 * "còn hiệu lực", chỉ đơn đã Confirmed mới chắc chắn đã giữ chỗ, nhưng
 * Pending cũng phải chặn vì BRU-07 ưu tiên theo thời điểm xử lý, không
 * phải theo trạng thái) có trùng khoảng ngày cho một sản phẩm — tiêm từ
 * ngoài vào (lib/rentals/server.ts) để tránh phụ thuộc vòng tròn giữa
 * store.ts và order-store.ts. */
export type GetActiveReservations = (productSlug: string) => Promise<ActiveReservation[]>;

export function createInMemoryRentalCartStore(
  getActiveReservations: GetActiveReservations = async () => [],
): RentalCartStore {
  const cartsByEmail = new Map<string, RentalCartLine[]>();
  let nextId = 1;

  return {
    async list(email) {
      return cartsByEmail.get(email) ?? [];
    },

    async addLine(email, { productSlug, productName, startDate, endDate }) {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return { ok: false, error: "Ngày bắt đầu/kết thúc không hợp lệ." };
      }
      if (endDate <= startDate) {
        return { ok: false, error: "Ngày kết thúc phải sau ngày bắt đầu." };
      }

      const existingLines = cartsByEmail.get(email) ?? [];
      const linesForSameProduct = existingLines.filter((l) => l.productSlug === productSlug);
      const reservations = ACTIVE_RESERVATIONS[productSlug] ?? [];
      const realOrders = await getActiveReservations(productSlug);

      const conflict = [...reservations, ...realOrders, ...linesForSameProduct].some((r) =>
        rangesOverlap(startDate, endDate, r.startDate, r.endDate),
      );
      if (conflict) {
        return {
          ok: false,
          error: `${productName} đã có đơn thuê khác còn hiệu lực trùng ngày trong khoảng đã chọn.`,
        };
      }

      const line: RentalCartLine = { id: `RC-${nextId++}`, productSlug, startDate, endDate };
      cartsByEmail.set(email, [...existingLines, line]);
      return { ok: true, line };
    },

    async updateLine(email, lineId, { productName, startDate, endDate }) {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return { ok: false, error: "Ngày bắt đầu/kết thúc không hợp lệ." };
      }
      if (endDate <= startDate) {
        return { ok: false, error: "Ngày kết thúc phải sau ngày bắt đầu." };
      }

      const existingLines = cartsByEmail.get(email) ?? [];
      const target = existingLines.find((l) => l.id === lineId);
      if (!target) {
        return { ok: false, error: "Không tìm thấy dòng trong giỏ thuê." };
      }

      const linesForSameProduct = existingLines.filter(
        (l) => l.productSlug === target.productSlug && l.id !== lineId,
      );
      const reservations = ACTIVE_RESERVATIONS[target.productSlug] ?? [];
      const realOrders = await getActiveReservations(target.productSlug);

      const conflict = [...reservations, ...realOrders, ...linesForSameProduct].some((r) =>
        rangesOverlap(startDate, endDate, r.startDate, r.endDate),
      );
      if (conflict) {
        return {
          ok: false,
          error: `${productName} đã có đơn thuê khác còn hiệu lực trùng ngày trong khoảng đã chọn.`,
        };
      }

      const updated: RentalCartLine = { ...target, startDate, endDate };
      cartsByEmail.set(
        email,
        existingLines.map((l) => (l.id === lineId ? updated : l)),
      );
      return { ok: true, line: updated };
    },

    async removeLine(email, lineId) {
      const existingLines = cartsByEmail.get(email) ?? [];
      cartsByEmail.set(email, existingLines.filter((l) => l.id !== lineId));
    },

    async clear(email) {
      cartsByEmail.set(email, []);
    },
  };
}
