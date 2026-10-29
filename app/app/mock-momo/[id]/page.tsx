"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";

/** Giả lập MoMo (đối tác thứ 3 giả định): thay cho việc quét QR thật. Cố ý KHÔNG dùng
 * Header/Footer/theme của khách — đây không phải giao diện của BoardVerse. Chỉ có ở dev. */
const ACTIONS = [
  { action: "success", label: "Gửi webhook thành công", hint: "Khách đã quét QR và xác nhận" },
  { action: "duplicate", label: "Gửi webhook thành công 2 lần", hint: "Kiểm tra idempotency (MoMo retry)" },
  { action: "fail", label: "Gửi webhook thất bại", hint: "UC-10 luồng 3b" },
  { action: "expire", label: "Không gửi gì — hết 15 phút", hint: "UC-10 luồng 3a" },
] as const;

export default function MockMomoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [log, setLog] = useState<string[]>([]);

  if (process.env.NODE_ENV === "production") notFound();

  const send = async (action: string) => {
    const response = await fetch(`/api/mock-momo/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await response.json();
    setLog((prev) => [`[${response.status}] ${action} → ${JSON.stringify(body)}`, ...prev]);
  };

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 560, margin: "48px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>MoMo (giả lập)</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
        Khoản thanh toán <b>{id}</b>. Không phải giao diện của BoardVerse.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {ACTIONS.map((a) => (
          <button
            key={a.action}
            type="button"
            onClick={() => send(a.action)}
            style={{ padding: "10px 14px", textAlign: "left", border: "1px solid #ccc", borderRadius: 6, background: "#fff", cursor: "pointer" }}
          >
            <b>{a.label}</b>
            <br />
            <small style={{ color: "#666" }}>{a.hint}</small>
          </button>
        ))}
      </div>
      <pre style={{ marginTop: 20, fontSize: 12, whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 12, borderRadius: 6, minHeight: 60 }}>
        {log.length ? log.join("\n") : "Chưa gửi gì."}
      </pre>
    </main>
  );
}
