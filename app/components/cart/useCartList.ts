"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tải một trang giỏ hàng từ API list (tìm kiếm/lọc/phân trang phía server).
 * Bỏ qua phản hồi cũ nếu khách gõ/đổi trang nhanh hơn mạng trả về. */
export function useCartList<T extends { counts: { all: number; canxuly: number }; page: number; totalPages: number }>(
  endpoint: string,
  onUnauthorized: () => void,
) {
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [filter, setFilter] = useState<"all" | "canxuly">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQApplied(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    const params = new URLSearchParams({ q: qApplied, filter, page: String(page) });
    const response = await fetch(`${endpoint}?${params}`);
    if (mine !== seq.current) return;
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    const body = (await response.json()) as T;
    // Xoá dòng cuối của trang cuối → server kẹp page về trang hợp lệ.
    if (body.page !== page) setPage(body.page);
    setData(body);
    setLoading(false);
  }, [endpoint, qApplied, filter, page, onUnauthorized]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return { q, setQ, qApplied, filter, setFilter: (f: "all" | "canxuly") => { setFilter(f); setPage(1); }, page, setPage, data, loading, reload };
}
