import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoTable, InfoNote } from "@/components/layout/InfoPage";
import { formatVND, tinhTienThueNgay } from "@/lib/products";

export const metadata: Metadata = { title: "Hướng dẫn đặt thuê — BoardVerse" };

const STEPS = [
  {
    t: "Chọn game và ngày thuê",
    d: "Vào mục Sản phẩm, mở trang chi tiết của tựa game bạn muốn, chọn “Thuê/ngày” rồi chọn ngày bắt đầu và ngày trả. Hệ thống chỉ cho đặt khi vẫn còn hộp game trống trong toàn bộ khoảng ngày đó. Bạn cần đăng nhập để thêm vào giỏ.",
  },
  {
    t: "Kiểm tra giỏ hàng và địa chỉ nhận",
    d: "Trong giỏ, nhập địa chỉ nhận hàng. Hệ thống tính sẵn tiền thuê, phí giao vận và tiền cọc để bạn xem trước khi thanh toán — không có khoản phát sinh ẩn.",
  },
  {
    t: "Thanh toán tiền cọc qua mã QR",
    d: "Chọn thanh toán trực tuyến, hệ thống sinh mã QR MoMo gắn đúng mã đơn và số tiền. Đơn chỉ được xác nhận sau khi hệ thống nhận được thông báo thanh toán thành công; xác nhận bằng lời không được chấp nhận.",
  },
  {
    t: "Nhân viên xác nhận và giao hàng",
    d: "BoardVerse xác nhận đơn, kiểm hộp game rồi bàn giao cho đơn vị giao vận. Trong bán kính 20 km, đơn đi bằng Green SM (giao nhanh trong ngày); xa hơn đi bằng Shopee Express (thường 1–3 ngày).",
  },
  {
    t: "Chơi và trả hàng đúng hạn",
    d: "Giữ đủ linh kiện trong hộp. Đến ngày trả, bạn mở Lịch sử đơn, nhập địa chỉ lấy hàng và bấm “Yêu cầu giao vận đến lấy hàng” — đơn vị giao vận sẽ đến lấy hộp game tại địa chỉ của bạn.",
  },
  {
    t: "Kiểm đếm và nhận lại tiền cọc",
    d: "Khi hộp game về kho, nhân viên kiểm đếm từng linh kiện theo danh sách của tựa game. Tiền cọc, sau khi trừ các khoản phát sinh (nếu có), được hoàn vào Ví của tôi. Chi tiết xem ở Chính sách hoàn cọc.",
  },
];

export default function HuongDanDatThuePage() {
  const vd = 450000;
  return (
    <InfoPage
      eyebrow="Hỗ trợ"
      title="Hướng dẫn đặt thuê"
      intro="Thuê board game theo ngày tại BoardVerse gồm 6 bước. Toàn bộ giá và quy tắc dưới đây là số liệu giả định của đồ án."
    >
      <InfoSection title="Các bước đặt thuê">
        <ol className="flex flex-col gap-5">
          {STEPS.map((s, i) => (
            <li key={s.t} className="grid grid-cols-[40px_1fr] gap-4">
              <span className="font-heading text-2xl italic text-gold">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="mb-1 font-heading text-lg text-ink">{s.t}</h3>
                <p>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </InfoSection>

      <InfoSection title="Cách tính tiền thuê">
        <p>Đơn giá giảm dần theo số ngày thuê, tính trên giá niêm yết của sản phẩm:</p>
        <InfoTable
          head={["Ngày thuê", "Đơn giá mỗi ngày"]}
          rows={[
            ["Ngày thứ 1", "10% giá niêm yết"],
            ["Ngày thứ 2 đến ngày thứ 10", "7% giá niêm yết"],
            ["Từ ngày thứ 11", "5% giá niêm yết"],
          ]}
        />
        <InfoNote>
          Ví dụ: Cờ Tỷ Phú có giá niêm yết {formatVND(vd)}. Thuê 3 ngày = 10% + 7% + 7% = {formatVND(tinhTienThueNgay(vd, 3))}.
        </InfoNote>
      </InfoSection>

      <InfoSection title="Tiền cọc và phí giao vận">
        <p>
          Mỗi hộp game thuê cần đặt cọc trước khi xuất kho:{" "}
          <strong className="font-semibold text-ink">100% giá niêm yết + phí giao vận chiều giao × 2</strong> (dự trù cho
          cả chiều giao và chiều lấy hàng trả). Bạn chịu phí giao vận thực tế của cả hai chiều; phần chênh lệch với số đã
          giữ được cân đối khi hoàn cọc.
        </p>
        <p>Xem quy định hoàn cọc đầy đủ tại trang Chính sách hoàn cọc.</p>
      </InfoSection>

      <InfoSection title="Lưu ý khi đặt">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            BoardVerse không giữ chỗ khi bạn mới thêm vào giỏ. Nếu có nhiều người cùng thanh toán cho một hộp game và
            ngày trùng nhau, người thanh toán thành công trước sẽ được giữ đơn; những người còn lại được hoàn tiền ngay
            vào ví.
          </li>
          <li>Bạn có thể tự huỷ đơn khi nhân viên chưa xác nhận đơn; tiền cọc đã thu được hoàn vào ví.</li>
          <li>Tất cả đơn thuê đều giao và lấy hàng qua đơn vị giao vận, không có hình thức tự đến lấy hay tự mang trả.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
