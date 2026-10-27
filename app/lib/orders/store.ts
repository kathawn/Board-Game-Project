/** FR-BH-05 (BR-08, UC-02): lịch sử đơn mua/thuê của khách. Chưa có luồng
 * checkout/đặt thuê thật (FR-BH-06/08/09, FR-CT-*) trong code — mỗi tài khoản
 * được seed sẵn vài đơn mẫu khi lần đầu tra cứu, để demo trang đọc dữ liệu
 * đúng phạm vi tài khoản đang đăng nhập. */

export type LoaiDon = "Ban" | "Thue";
export type TrangThaiDon = "Pending" | "Confirmed" | "Active" | "Overdue" | "Completed" | "Closed";

export interface DonHang {
  id: string;
  loai: LoaiDon;
  trangThai: TrangThaiDon;
  ngayTao: string;
  sanPham: string;
  chiTiet: string;
  tongTien: number;
}

export interface OrderStore {
  listByEmail(email: string): DonHang[];
}

function demoOrdersFor(): DonHang[] {
  return [
    {
      id: "DH-00231",
      loai: "Ban",
      trangThai: "Completed",
      ngayTao: "2026-10-12",
      sanPham: "UNO",
      chiTiet: "Số lượng: 2",
      tongTien: 190000,
    },
    {
      id: "DH-00245",
      loai: "Thue",
      trangThai: "Active",
      ngayTao: "2026-10-20",
      sanPham: "Catan",
      chiTiet: "Thuê 20/10 → 23/10/2026",
      tongTien: 1580000,
    },
    {
      id: "DH-00198",
      loai: "Thue",
      trangThai: "Closed",
      ngayTao: "2026-09-02",
      sanPham: "Ma Sói (Ultimate Werewolf)",
      chiTiet: "Thuê 02/09 → 04/09/2026",
      tongTien: 460000,
    },
    {
      id: "DH-00302",
      loai: "Ban",
      trangThai: "Pending",
      ngayTao: "2026-10-26",
      sanPham: "Azul",
      chiTiet: "Số lượng: 1",
      tongTien: 580000,
    },
  ];
}

export function createInMemoryOrderStore(): OrderStore {
  const ordersByEmail = new Map<string, DonHang[]>();

  return {
    listByEmail(email) {
      const existing = ordersByEmail.get(email);
      if (existing) return existing;

      const seeded = demoOrdersFor();
      ordersByEmail.set(email, seeded);
      return seeded;
    },
  };
}
