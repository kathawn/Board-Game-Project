import type { Metadata } from "next";
import { InfoPage, InfoSection, InfoTable, InfoNote } from "@/components/layout/InfoPage";
import { formatVND } from "@/lib/products";

export const metadata: Metadata = { title: "Chính sách hoàn cọc — BoardVerse" };

export default function ChinhSachHoanCocPage() {
  const vd = 450000;
  const phiShipVd = 23000;
  const cocVd = vd + phiShipVd * 2;
  const phat2Ngay = Math.round(vd * 0.15) * 2;
  return (
    <InfoPage
      eyebrow="Hỗ trợ"
      title="Chính sách đặt cọc & hoàn cọc"
      intro="Áp dụng cho đơn thuê. Tiền cọc là khoản bảo đảm, không phải phí: nếu bạn trả hàng đúng hạn, đủ linh kiện thì được hoàn lại gần như toàn bộ."
    >
      <InfoSection title="1. Mức đặt cọc">
        <p>
          Tiền cọc mỗi sản phẩm = <strong className="font-semibold text-ink">100% giá niêm yết</strong> +{" "}
          <strong className="font-semibold text-ink">phí giao vận chiều giao × 2</strong>. Khoản này thu một lần khi
          thanh toán đơn, trước khi hộp game được xuất kho.
        </p>
        <InfoNote>
          Ví dụ: Cờ Tỷ Phú {formatVND(vd)}, phí giao vận ước tính {formatVND(phiShipVd)} → cọc = {formatVND(vd)} +{" "}
          {formatVND(phiShipVd)} × 2 = {formatVND(cocVd)}.
        </InfoNote>
      </InfoSection>

      <InfoSection title="2. Số tiền được hoàn">
        <p>Sau khi nhân viên kiểm đếm xong, số hoàn được tính như sau:</p>
        <p className="rounded bg-paper px-4 py-3 text-center font-heading text-base italic text-ink">
          Hoàn cọc = Tiền cọc − Phạt trễ hạn − Tiền đền bù − Phí giao vận thực tế (hai chiều) + Phí giao vận đã giữ
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Số hoàn không bao giờ vượt quá tiền cọc đã thu.</li>
          <li>
            Phí giao vận đã giữ trong cọc chỉ là dự trù. Nếu phí thực tế thấp hơn, phần dư được hoàn; nếu cao hơn (ví dụ
            địa chỉ lấy hàng xa hơn địa chỉ giao), phần thiếu được trừ thêm.
          </li>
          <li>
            Nếu các khoản trừ lớn hơn tiền cọc, bạn không bị trừ âm vào ví mà được yêu cầu thanh toán phần còn thiếu
            qua mã QR.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Phạt trả hàng trễ hạn">
        <p>
          Mỗi ngày trễ so với ngày hết hạn thuê bị phạt{" "}
          <strong className="font-semibold text-ink">15% giá niêm yết</strong>, tổng mức phạt tối đa bằng 100% giá niêm
          yết.
        </p>
        <InfoNote>
          Ví dụ: trả trễ 2 ngày với tựa game {formatVND(vd)} → phạt 2 × 15% = {formatVND(phat2Ngay)}. Ngày hàng về kho
          được tính theo thời điểm đơn vị giao vận hoàn tất lấy hàng.
        </InfoNote>
      </InfoSection>

      <InfoSection title="4. Đền bù linh kiện thiếu hoặc hư hỏng">
        <InfoTable
          head={["Loại linh kiện", "Mức đền"]}
          rows={[
            ["Linh kiện độc bản (không mua lẻ được: bàn cờ, thẻ bài, quân cờ…)", "100% giá niêm yết của cả bộ"],
            ["Phụ kiện có bán lẻ (xúc xắc, tiền giấy, nhà gỗ…)", "Giá bán lẻ niêm yết × số lượng thiếu/hỏng"],
            ["Phụ kiện nhà phân phối không bán lẻ", "20% giá niêm yết của bộ × số lượng"],
          ]}
        />
        <p>
          Tổng tiền đền bù cho một sản phẩm không vượt quá 100% giá niêm yết của bộ. Danh sách linh kiện chuẩn của từng
          tựa game có ở trang chi tiết sản phẩm, để bạn đối chiếu khi nhận và khi trả.
        </p>
      </InfoSection>

      <InfoSection title="5. Hoàn tiền về đâu">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Tiền hoàn được cộng vào <strong className="font-semibold text-ink">Ví điện tử nội bộ</strong> của bạn trên
            BoardVerse, không hoàn trực tiếp qua MoMo.
          </li>
          <li>Bạn có thể dùng số dư để thanh toán đơn khác hoặc yêu cầu rút về tài khoản ngân hàng của chính mình.</li>
          <li>Mỗi lần hoàn đều có phiếu quyết toán chi tiết và dòng lịch sử trong mục Ví của tôi.</li>
        </ul>
      </InfoSection>

      <InfoSection title="6. Hoàn đầy đủ trong các trường hợp khác">
        <ul className="list-disc space-y-2 pl-5">
          <li>Bạn huỷ đơn khi nhân viên chưa xác nhận đơn: hoàn toàn bộ tiền cọc vào ví.</li>
          <li>
            Hộp game không còn khả dụng vì có khách khác thanh toán thành công trước: hoàn toàn bộ số tiền đã thanh
            toán vào ví.
          </li>
        </ul>
      </InfoSection>

      <p className="text-xs text-ink-soft">
        Mọi mức giá và tỷ lệ trên là số liệu giả định của đồ án BoardVerse, không phải dữ liệu kinh doanh thật.
      </p>
    </InfoPage>
  );
}
