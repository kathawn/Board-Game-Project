/** FR-CT-05 (BR-01, UC-05/UC-06): đơn thuê tạo từ giỏ thuê khi khách xác nhận
 * đặt thuê — mỗi dòng giữ lại tiền thuê (FR-CT-04/BRU-02) và tiền cọc
 * (FR-CT-03/BRU-01) đã tính tại thời điểm tạo đơn, để Staff xác nhận (UC-05)
 * không cần tính lại và không bị ảnh hưởng nếu giá niêm yết đổi sau đó. */

export type TrangThaiDonThue = "Pending" | "Confirmed";

export interface RentalOrderLine {
  productSlug: string;
  productName: string;
  startDate: string;
  endDate: string;
  tienThue: number;
  tienCoc: number;
}

export interface RentalOrder {
  id: string;
  email: string;
  trangThai: TrangThaiDonThue;
  ngayTao: string;
  diaChiNhan: string;
  doiTac: "GreenSM" | "ShopeeExpress";
  lines: RentalOrderLine[];
  tongTienThue: number;
  tongTienCoc: number;
}

export interface RentalOrderStore {
  list(): RentalOrder[];
  get(id: string): RentalOrder | undefined;
  create(input: Omit<RentalOrder, "id" | "trangThai" | "ngayTao">): RentalOrder;
  /** FR-CT-05/UC-05: Staff xác nhận đơn — chỉ hợp lệ khi đơn đang ở Pending. */
  confirm(id: string): { ok: true; order: RentalOrder } | { ok: false; error: string };
  /** FR-CT-02/BR-05: khoảng ngày của một sản phẩm trong mọi đơn thuê "còn
   * hiệu lực" (Pending hoặc Confirmed — chưa Completed/huỷ) để giỏ thuê
   * (lib/rentals/store.ts) chặn trùng lịch với đơn thật, không chỉ với dữ
   * liệu demo tĩnh. */
  listActiveDateRangesForProduct(productSlug: string): { startDate: string; endDate: string }[];
}

export function createInMemoryRentalOrderStore(): RentalOrderStore {
  const orders = new Map<string, RentalOrder>();
  let nextId = 1;

  return {
    list() {
      return [...orders.values()].sort((a, b) => (a.ngayTao < b.ngayTao ? 1 : -1));
    },

    get(id) {
      return orders.get(id);
    },

    create(input) {
      const order: RentalOrder = {
        ...input,
        id: `DT-${String(nextId++).padStart(5, "0")}`,
        trangThai: "Pending",
        ngayTao: new Date().toISOString().slice(0, 10),
      };
      orders.set(order.id, order);
      return order;
    },

    confirm(id) {
      const order = orders.get(id);
      if (!order) {
        return { ok: false, error: "Không tìm thấy đơn thuê." };
      }
      if (order.trangThai !== "Pending") {
        return { ok: false, error: "Đơn thuê không ở trạng thái chờ xác nhận." };
      }

      const confirmed: RentalOrder = { ...order, trangThai: "Confirmed" };
      orders.set(id, confirmed);
      return { ok: true, order: confirmed };
    },

    listActiveDateRangesForProduct(productSlug) {
      // TrangThaiDonThue hiện chỉ có Pending/Confirmed (chưa có Active/
      // Completed/Closed như state machine đầy đủ ở SRS 3.6 vì UC-06/UC-07
      // chưa code) — nên mọi đơn trong store này đều "còn hiệu lực" theo
      // nghĩa của FR-CT-02.
      return [...orders.values()]
        .flatMap((order) => order.lines)
        .filter((line) => line.productSlug === productSlug)
        .map(({ startDate, endDate }) => ({ startDate, endDate }));
    },
  };
}
