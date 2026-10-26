// Nguồn số liệu: mở rộng từ scripts/project_data.py SAMPLE_GAMES (giữ 4 tựa
// cũ có ảnh: Cờ Tỷ Phú/Monopoly, Ma Sói/Ultimate Werewolf, Catan, UNO) cho
// khớp 16 ảnh thật trong public/images/ — không tự thêm ảnh/sản phẩm khác.

export type ProductTone = "wine" | "amber" | "forest" | "sky";

/** docBan = true: linh kiện độc bản, không thể mua lẻ thay thế — nếu mất/hư
 * hỏng, khách đền 100% giá trị nguyên bộ (BRU-04a). false: phụ kiện có thể
 * mua lẻ thay thế — đền theo giá linh kiện lẻ, hoặc 20% giá trị nguyên bộ
 * nếu nhà phân phối không bán lẻ (BRU-04b). */
export interface LinhKien {
  ten: string;
  docBan: boolean;
}

export interface Product {
  slug: string;
  ten: string;
  anh: string;
  danhMuc: string;
  soNguoiMin: number;
  soNguoiMax: number;
  giaNiemYet: number;
  linhKien: LinhKien[];
  tone: ProductTone;
  moTaNgan: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: "co-ty-phu",
    ten: "Cờ Tỷ Phú (Monopoly bản Việt hoá)",
    anh: "/images/Monopoly.jpg",
    danhMuc: "Chiến thuật - Kinh doanh",
    soNguoiMin: 2,
    soNguoiMax: 6,
    giaNiemYet: 450000,
    linhKien: [
      { ten: "Bàn cờ", docBan: true },
      { ten: "2 xúc xắc", docBan: false },
      { ten: "6 quân cờ hình", docBan: true },
      { ten: "Bộ tiền giấy (7 mệnh giá)", docBan: false },
      { ten: "28 thẻ sở hữu đất", docBan: true },
      { ten: "Thẻ Cơ hội", docBan: true },
      { ten: "Thẻ Khế ước", docBan: true },
      { ten: "32 nhà, 12 khách sạn gỗ", docBan: false },
    ],
    tone: "amber",
    moTaNgan: "Tham vọng, mặc cả, và một chút lạnh lùng với người thân.",
  },
  {
    slug: "ma-soi",
    ten: "Ma Sói (Ultimate Werewolf)",
    anh: "/images/Ultimate Werewolf.jpg",
    danhMuc: "Suy luận - Xã hội",
    soNguoiMin: 8,
    soNguoiMax: 18,
    giaNiemYet: 220000,
    linhKien: [
      { ten: "Bộ bài vai trò (18 lá)", docBan: true },
      { ten: "Thẻ Đêm/Ngày", docBan: false },
      { ten: "Hướng dẫn luật chơi", docBan: false },
      { ten: "Hộp đựng bài", docBan: false },
    ],
    tone: "wine",
    moTaNgan: "Giữ mặt lạnh, dò xét từng ánh nhìn — ai cười sau cùng mới thắng.",
  },
  {
    slug: "catan",
    ten: "Catan",
    anh: "/images/Catan.jpg",
    danhMuc: "Chiến thuật - Xây dựng",
    soNguoiMin: 3,
    soNguoiMax: 4,
    giaNiemYet: 790000,
    linhKien: [
      { ten: "19 ô địa hình lục giác", docBan: true },
      { ten: "Khung viền biển", docBan: true },
      { ten: "18 thẻ cảng", docBan: true },
      { ten: "Bộ tài nguyên (gỗ, đất sét, lúa, len, quặng)", docBan: false },
      { ten: "25 thẻ phát triển", docBan: true },
      { ten: "95 nhà/đường/thành gỗ (4 màu)", docBan: false },
      { ten: "2 xúc xắc", docBan: false },
      { ten: "Thẻ cướp biển", docBan: true },
    ],
    tone: "forest",
    moTaNgan: "Dựng làng, mở đường, thương lượng từng viên đất sét.",
  },
  {
    slug: "uno",
    ten: "UNO",
    anh: "/images/Uno.jpg",
    danhMuc: "Bài - Gia đình",
    soNguoiMin: 2,
    soNguoiMax: 10,
    giaNiemYet: 95000,
    linhKien: [
      { ten: "Bộ 108 lá bài UNO", docBan: true },
      { ten: "Hộp nhựa đựng bài", docBan: false },
      { ten: "Hướng dẫn luật chơi", docBan: false },
    ],
    tone: "sky",
    moTaNgan: "Nhanh, gọn, may rủi vừa đủ cho một tối giữa tuần.",
  },
  {
    slug: "7-wonders",
    ten: "7 Wonders",
    anh: "/images/7 Wonders.jpg",
    danhMuc: "Chiến thuật - Xây dựng văn minh",
    soNguoiMin: 2,
    soNguoiMax: 7,
    giaNiemYet: 650000,
    linhKien: [
      { ten: "Bộ thẻ kỳ quan (7 kỳ quan)", docBan: true },
      { ten: "Thẻ công trình 3 thời đại", docBan: true },
      { ten: "Bộ đồng xu", docBan: false },
      { ten: "Thẻ xung đột quân sự", docBan: true },
    ],
    tone: "forest",
    moTaNgan: "Bảy kỳ quan, một thời đại — dựng cả nền văn minh trong một buổi tối.",
  },
  {
    slug: "azul",
    ten: "Azul",
    anh: "/images/Azul.jpg",
    danhMuc: "Chiến thuật - Xếp hình",
    soNguoiMin: 2,
    soNguoiMax: 4,
    giaNiemYet: 580000,
    linhKien: [
      { ten: "100 viên gạch men (5 màu)", docBan: false },
      { ten: "4 bảng cá nhân", docBan: true },
      { ten: "1 túi vải rút", docBan: false },
      { ten: "Thẻ điểm tiên phong", docBan: false },
    ],
    tone: "sky",
    moTaNgan: "Ghép từng viên gạch men thành bức tường hoàng cung đẹp nhất.",
  },
  {
    slug: "bang",
    ten: "Bang!",
    anh: "/images/Bang!.jpg",
    danhMuc: "Nhập vai - Viễn Tây",
    soNguoiMin: 4,
    soNguoiMax: 7,
    giaNiemYet: 390000,
    linhKien: [
      { ten: "Bộ bài vai trò (Cảnh sát/Ngoài vòng pháp luật/Phó cảnh sát)", docBan: true },
      { ten: "Bộ bài hành động", docBan: true },
      { ten: "Thẻ súng & vật phẩm", docBan: true },
      { ten: "Thẻ máu", docBan: false },
    ],
    tone: "wine",
    moTaNgan: "Súng, mưu kế và những liên minh đổi chiều giữa miền Viễn Tây.",
  },
  {
    slug: "carcassonne",
    ten: "Carcassonne",
    anh: "/images/Carcassonne.jpg",
    danhMuc: "Chiến thuật - Xếp gạch",
    soNguoiMin: 2,
    soNguoiMax: 5,
    giaNiemYet: 520000,
    linhKien: [
      { ten: "72 quân domino địa hình", docBan: true },
      { ten: "40 quân thợ xây (follower)", docBan: false },
      { ten: "Bảng tính điểm", docBan: false },
      { ten: "Túi vải đựng quân", docBan: false },
    ],
    tone: "amber",
    moTaNgan: "Từng viên gạch dựng nên thành quách, đường xá và đồng cỏ Pháp cổ.",
  },
  {
    slug: "codenames",
    ten: "Codenames",
    anh: "/images/Codenames.jpg",
    danhMuc: "Party - Từ vựng",
    soNguoiMin: 2,
    soNguoiMax: 8,
    giaNiemYet: 420000,
    linhKien: [
      { ten: "200 thẻ từ khoá", docBan: true },
      { ten: "Lưới gợi ý mật danh (2 phe)", docBan: true },
      { ten: "Thẻ điệp viên/ám sát", docBan: true },
      { ten: "Đồng hồ cát", docBan: false },
    ],
    tone: "sky",
    moTaNgan: "Một từ gợi ý, cả đội cùng đoán — sai một ly là lộ điệp viên.",
  },
  {
    slug: "coup",
    ten: "Coup",
    anh: "/images/Coup.jpg",
    danhMuc: "Suy luận - Bluff",
    soNguoiMin: 2,
    soNguoiMax: 6,
    giaNiemYet: 280000,
    linhKien: [
      { ten: "15 thẻ vai trò (5 loại)", docBan: true },
      { ten: "Thẻ ảnh hưởng", docBan: true },
      { ten: "Bộ đồng xu nhựa", docBan: false },
    ],
    tone: "wine",
    moTaNgan: "Nói dối trơn tru, lật tẩy đúng lúc — triều đình chỉ có một người thắng.",
  },
  {
    slug: "exploding-kittens",
    ten: "Exploding Kittens",
    anh: "/images/Exploding Kittens.jpg",
    danhMuc: "Bài - Gia đình",
    soNguoiMin: 2,
    soNguoiMax: 5,
    giaNiemYet: 320000,
    linhKien: [
      { ten: "Bộ bài 56 lá", docBan: true },
      { ten: "Thẻ Mèo Nổ", docBan: true },
      { ten: "Thẻ Vô Hiệu Hoá", docBan: true },
      { ten: "Hướng dẫn luật chơi", docBan: false },
    ],
    tone: "amber",
    moTaNgan: "Rút bài, cầu may, đừng rút trúng con mèo sẽ nổ tung bàn chơi.",
  },
  {
    slug: "gloomhaven",
    ten: "Gloomhaven",
    anh: "/images/Gloomhaven.jpg",
    danhMuc: "Nhập vai - Chiến thuật",
    soNguoiMin: 1,
    soNguoiMax: 4,
    giaNiemYet: 1890000,
    linhKien: [
      { ten: "Bộ bảng bản đồ module", docBan: true },
      { ten: "Sổ chiến dịch", docBan: true },
      { ten: "Bộ thẻ nhân vật & quái vật", docBan: true },
      { ten: "Hộp mini miniature", docBan: true },
      { ten: "Sổ luật chơi dày", docBan: false },
    ],
    tone: "forest",
    moTaNgan: "Một chiến dịch nhập vai dài hơi, mỗi trận đánh là một chương truyện.",
  },
  {
    slug: "root",
    ten: "Root",
    anh: "/images/Root.jpg",
    danhMuc: "Chiến thuật - Xung đột không đối xứng",
    soNguoiMin: 2,
    soNguoiMax: 4,
    giaNiemYet: 990000,
    linhKien: [
      { ten: "Bảng bản đồ rừng", docBan: true },
      { ten: "4 bộ quân phe (Mèo/Chim/Chuột/Cáo)", docBan: true },
      { ten: "Bộ thẻ sự kiện", docBan: true },
      { ten: "Xúc xắc chiến đấu", docBan: false },
    ],
    tone: "forest",
    moTaNgan: "Bốn phe, bốn luật chơi riêng — khu rừng chỉ đủ chỗ cho một kẻ thống trị.",
  },
  {
    slug: "scythe",
    ten: "Scythe",
    anh: "/images/Scythe.jpg",
    danhMuc: "Chiến thuật - Xây dựng đế chế",
    soNguoiMin: 1,
    soNguoiMax: 5,
    giaNiemYet: 1450000,
    linhKien: [
      { ten: "Bảng bản đồ lớn", docBan: true },
      { ten: "5 bộ quân phe (mech, công nhân)", docBan: true },
      { ten: "Bộ thẻ tài nguyên", docBan: false },
      { ten: "Bảng điểm hiện đại hoá", docBan: false },
    ],
    tone: "wine",
    moTaNgan: "Mở rộng lãnh thổ, phát triển mech — một đế chế hậu chiến tranh.",
  },
  {
    slug: "splendor",
    ten: "Splendor",
    anh: "/images/Splendor.jpg",
    danhMuc: "Chiến thuật - Thu thập",
    soNguoiMin: 2,
    soNguoiMax: 4,
    giaNiemYet: 480000,
    linhKien: [
      { ten: "90 thẻ phát triển (3 cấp)", docBan: true },
      { ten: "Token đá quý (6 loại)", docBan: false },
      { ten: "10 thẻ quý tộc", docBan: true },
    ],
    tone: "sky",
    moTaNgan: "Thu mua đá quý, dựng xưởng kim hoàn, chiêu mộ quý tộc ghé qua.",
  },
  {
    slug: "ticket-to-ride",
    ten: "Ticket to Ride",
    anh: "/images/Ticket to Ride.jpg",
    danhMuc: "Chiến thuật - Xây dựng tuyến đường",
    soNguoiMin: 2,
    soNguoiMax: 5,
    giaNiemYet: 690000,
    linhKien: [
      { ten: "Bảng bản đồ tuyến tàu", docBan: true },
      { ten: "240 toa tàu nhựa (5 màu)", docBan: false },
      { ten: "Bộ thẻ toa tàu", docBan: true },
      { ten: "Thẻ lộ trình đích", docBan: true },
    ],
    tone: "amber",
    moTaNgan: "Nối từng thành phố bằng đường ray, chạy đua hoàn thành lộ trình bí mật.",
  },
];

/** BRU-02 (SRS): đơn giá thuê ngày thứ 1 = 10% giá niêm yết — dùng để hiển thị
 * giá "Từ .../ngày" và lọc theo khoảng giá khi khách chọn trạng thái Thuê. */
export function giaThueNgayDau(giaNiemYet: number): number {
  return Math.round(giaNiemYet * 0.1);
}

export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

/** FR-BH-03: tra cứu 1 sản phẩm theo slug để hiển thị trang chi tiết kèm checklist linh kiện. */
export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export interface ProductFilter {
  q?: string;
  danhMuc?: string;
  /** Chỉ đổi cơ sở giá để so khoảng giá (giá bán vs. giá thuê ngày đầu — BRU-02),
   * KHÔNG lọc bớt sản phẩm theo tình trạng bán/thuê — dữ liệu mẫu không có field
   * đó, mọi sản phẩm trong catalog giả định đều bán được và thuê được. Xem FR-BH-02. */
  loai?: "ban" | "thue";
  giaMin?: number;
  giaMax?: number;
}

/** FR-BH-02: lọc danh sách sản phẩm theo từ khoá tên, danh mục và khoảng giá.
 * Khi loai = "thue", khoảng giá so với giá thuê ngày đầu (BRU-02) thay vì giá niêm yết. */
export function filterProducts(products: Product[], filter: ProductFilter): Product[] {
  const q = filter.q?.trim().toLowerCase();

  return products.filter((p) => {
    const giaSoSanh = filter.loai === "thue" ? giaThueNgayDau(p.giaNiemYet) : p.giaNiemYet;

    if (q && !p.ten.toLowerCase().includes(q)) return false;
    if (filter.danhMuc && p.danhMuc !== filter.danhMuc) return false;
    if (filter.giaMin !== undefined && giaSoSanh < filter.giaMin) return false;
    if (filter.giaMax !== undefined && giaSoSanh > filter.giaMax) return false;
    return true;
  });
}
