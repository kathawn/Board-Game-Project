// Nguồn số liệu: scripts/project_data.py SAMPLE_GAMES (5 tựa game mẫu dùng chung
// cho seed data BoardVerse) — giữ đồng bộ, không tự thêm sản phẩm khác ở đây.

export type ProductTone = "wine" | "amber" | "forest" | "sky";

export interface Product {
  slug: string;
  ten: string;
  danhMuc: string;
  soNguoiMin: number;
  soNguoiMax: number;
  giaNiemYet: number;
  linhKien: string[];
  tone: ProductTone;
  moTaNgan: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: "co-ty-phu",
    ten: "Cờ Tỷ Phú (Monopoly bản Việt hoá)",
    danhMuc: "Chiến thuật - Kinh doanh",
    soNguoiMin: 2,
    soNguoiMax: 6,
    giaNiemYet: 450000,
    linhKien: [
      "Bàn cờ",
      "2 xúc xắc",
      "6 quân cờ hình",
      "Bộ tiền giấy (7 mệnh giá)",
      "28 thẻ sở hữu đất",
      "Thẻ Cơ hội",
      "Thẻ Khế ước",
      "32 nhà, 12 khách sạn gỗ",
    ],
    tone: "amber",
    moTaNgan: "Tham vọng, mặc cả, và một chút lạnh lùng với người thân.",
  },
  {
    slug: "ma-soi",
    ten: "Ma Sói (Werewolves)",
    danhMuc: "Suy luận - Xã hội",
    soNguoiMin: 8,
    soNguoiMax: 18,
    giaNiemYet: 220000,
    linhKien: ["Bộ bài vai trò (18 lá)", "Thẻ Đêm/Ngày", "Hướng dẫn luật chơi", "Hộp đựng bài"],
    tone: "wine",
    moTaNgan: "Giữ mặt lạnh, dò xét từng ánh nhìn — ai cười sau cùng mới thắng.",
  },
  {
    slug: "catan",
    ten: "Catan",
    danhMuc: "Chiến thuật - Xây dựng",
    soNguoiMin: 3,
    soNguoiMax: 4,
    giaNiemYet: 790000,
    linhKien: [
      "19 ô địa hình lục giác",
      "Khung viền biển",
      "18 thẻ cảng",
      "Bộ tài nguyên (gỗ, đất sét, lúa, len, quặng)",
      "25 thẻ phát triển",
      "95 nhà/đường/thành gỗ (4 màu)",
      "2 xúc xắc",
      "Thẻ cướp biển",
    ],
    tone: "forest",
    moTaNgan: "Dựng làng, mở đường, thương lượng từng viên đất sét.",
  },
  {
    slug: "uno",
    ten: "UNO",
    danhMuc: "Bài - Gia đình",
    soNguoiMin: 2,
    soNguoiMax: 10,
    giaNiemYet: 95000,
    linhKien: ["Bộ 108 lá bài UNO", "Hộp nhựa đựng bài", "Hướng dẫn luật chơi"],
    tone: "sky",
    moTaNgan: "Nhanh, gọn, may rủi vừa đủ cho một tối giữa tuần.",
  },
  {
    slug: "co-ca-ngua",
    ten: "Cờ Cá Ngựa",
    danhMuc: "Gia đình - Trẻ em",
    soNguoiMin: 2,
    soNguoiMax: 4,
    giaNiemYet: 85000,
    linhKien: ["Bàn cờ gấp", "4 bộ quân cá ngựa (4 con/màu)", "1 xúc xắc", "Hộp đựng quân"],
    tone: "amber",
    moTaNgan: "Một chiều thứ Bảy, một ván cờ, những người bạn cũ.",
  },
];

export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}
