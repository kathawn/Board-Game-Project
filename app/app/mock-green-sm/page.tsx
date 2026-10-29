"use client";

import { useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { TRANG_THAI_THEO_CHIEU, type Shipment, type TrangThaiVanChuyen } from "@/lib/shipping/types";

/** Giả lập Green SM (đối tác thứ 3 giả định): thay cho việc shipper cập nhật trạng thái thật. Cố ý KHÔNG dùng
 * Header/Footer/theme của khách — đây không phải giao diện của BoardVerse. Chỉ có ở dev. */
const NHAN: Record<TrangThaiVanChuyen, string> = {
  DangGiao: "Đang giao",
  DaGiao: "Đã giao",
  DangLay: "Đang lấy",
  DaLay: "Đã lấy",
};

type Row = Shipment & { maDon: string };

export default function MockGreenSmPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [down, setDown] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  if (process.env.NODE_ENV === "production") notFound();

  const load = useCallback(async () => {
    const data = await (await fetch("/api/mock-green-sm")).json();
    setRows(data.shipments);
    setDown(data.down);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const post = async (body: object) => {
    const response = await fetch("/api/mock-green-sm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setLog((prev) => [`[${response.status}] ${JSON.stringify(body)} → ${JSON.stringify(data)}`, ...prev]);
    await load();
  };

  const btn = { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 } as const;

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 720, margin: "48px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Green SM / Shopee Express (giả lập)</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>
        Không phải giao diện của BoardVerse. Mỗi nút gọi đúng webhook thật có ký HMAC.
      </p>
      <label style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
        <input type="checkbox" checked={down} onChange={(e) => post({ action: "down", down: e.target.checked })} /> Giả lập
        đối tác lỗi / không khả dụng (UC-06 luồng 2a, UC-11 luồng 4a)
      </label>

      {rows.length === 0 && <p style={{ color: "#666", fontSize: 14 }}>Chưa có vận đơn nào.</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.maVanDon} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 14 }}>
              <b>{r.maVanDon}</b> · đơn {r.maDon} · {r.chieu === "Nhan" ? "giao hàng" : "lấy hàng trả"} · hiện tại:{" "}
              <b>{NHAN[r.trangThai]}</b>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {TRANG_THAI_THEO_CHIEU[r.chieu].map((t) => (
                <button key={t} type="button" style={btn} onClick={() => post({ action: "webhook", maVanDon: r.maVanDon, trangThai: t })}>
                  Gửi webhook → {NHAN[t]}
                </button>
              ))}
              <button
                type="button"
                style={btn}
                onClick={() =>
                  post({ action: "webhook", maVanDon: r.maVanDon, trangThai: TRANG_THAI_THEO_CHIEU[r.chieu][1], badSignature: true })
                }
              >
                Gửi webhook sai chữ ký (→ 401)
              </button>
            </div>
          </div>
        ))}
      </div>

      <pre style={{ marginTop: 20, fontSize: 12, whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 12, borderRadius: 6, minHeight: 60 }}>
        {log.length ? log.join("\n") : "Chưa gửi gì."}
      </pre>
    </main>
  );
}
