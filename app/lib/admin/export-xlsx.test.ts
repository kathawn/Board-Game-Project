import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { exportAnalytics, exportBoxes, exportOrders, exportRevenue } from "./export-xlsx";
import type { RevenueLineRow } from "./types";

async function read(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb;
}

const line = (o: Partial<RevenueLineRow>): RevenueLineRow => ({
  maDon: "TH-001",
  loai: "Thue",
  ngayTao: "2026-10-05",
  khach: "Nguyễn A",
  sanPham: "Catan",
  danhMuc: "Chiến thuật",
  tien: 120000,
  ...o,
});

describe("exportRevenue", () => {
  it("ghi sheet Tổng hợp + Giao dịch với tiền/ngày là kiểu thật và dòng tổng khớp", async () => {
    const lines = [line({}), line({ maDon: "BN-002", loai: "Ban", tien: 380000 })];
    const wb = await read(
      await exportRevenue({
        from: "2026-10-01",
        to: "2026-10-31",
        summary: { ban: { soDon: 1, doanhThu: 380000 }, thue: { soDon: 1, doanhThu: 120000 }, tong: 500000, soDon: 2 },
        lines,
        filter: "",
      }),
    );
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Tổng hợp", "Giao dịch"]);
    const info = wb.getWorksheet("Tổng hợp")!;
    expect(info.getCell("B1").value).toBe("01/10/2026 – 31/10/2026");
    expect(info.getCell("B3").value).toBe(500000);

    const ws = wb.getWorksheet("Giao dịch")!;
    expect(ws.getCell("B2").value).toBe("Thuê");
    expect(ws.getCell("C2").value).toBeInstanceOf(Date);
    expect(ws.getCell("G2").value).toBe(120000);
    expect(ws.getCell("A4").value).toBe("Tổng cộng");
    expect(ws.getCell("G4").value).toBe(500000);
  });
});

describe("exportOrders / exportBoxes", () => {
  it("dịch trạng thái sang tiếng Việt", async () => {
    const o = await read(
      await exportOrders([{ maDon: "TH-1", loai: "Thue", trangThai: "Overdue", ngayTao: "2026-10-01", khach: "A", sanPham: "X", tien: 1 }]),
    );
    expect(o.getWorksheet("Đơn hàng")!.getCell("C2").value).toBe("Quá hạn");
    const b = await read(await exportBoxes([{ maHop: "H-1", sanPham: "X", trangThai: "Damaged" }]));
    expect(b.getWorksheet("Hộp game")!.getCell("C2").value).toBe("Hư hỏng");
  });

  it("danh sách rỗng vẫn tạo file hợp lệ chỉ có dòng tiêu đề", async () => {
    const wb = await read(await exportBoxes([]));
    expect(wb.getWorksheet("Hộp game")!.rowCount).toBe(1);
  });
});

describe("exportAnalytics", () => {
  it("có đủ 5 sheet và tỷ trọng danh mục cộng lại bằng 100%", async () => {
    const wb = await read(
      await exportAnalytics({
        from: "2026-09-01",
        to: "2026-10-31",
        data: {
          monthly: [
            { thang: "2026-09", ban: 100, thue: 50 },
            { thang: "2026-10", ban: 0, thue: 50 },
          ],
          topSanPham: [{ ten: "Catan", doanhThu: 200 }],
          theoDanhMuc: [
            { ten: "A", doanhThu: 150 },
            { ten: "B", doanhThu: 50 },
          ],
          donTheoTrangThai: { Pending: 1, Confirmed: 0, Active: 2, Overdue: 0, Completed: 0, Closed: 0, Cancelled: 0 },
        },
      }),
    );
    expect(wb.worksheets).toHaveLength(5);
    const dm = wb.getWorksheet("Theo danh mục")!;
    expect((dm.getCell("C2").value as number) + (dm.getCell("C3").value as number)).toBeCloseTo(1);
    expect(wb.getWorksheet("Doanh thu theo tháng")!.getCell("D4").value).toBe(200);
  });
});
