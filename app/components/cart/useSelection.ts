"use client";

import { useCallback, useState } from "react";

/** Tích chọn dòng giỏ để thanh toán. Lựa chọn nằm ở server (giữ qua trang/bộ lọc/tab);
 * "chọn tất cả" gửi điều kiện tìm kiếm/lọc hiện tại để server chọn MỌI dòng khớp, kể cả ở trang khác. */
export function useSelection(
  loai: "thue" | "mua",
  filterState: { qApplied: string; filter: string },
  reload: () => Promise<void>,
) {
  const [busy, setBusy] = useState(false);
  const { qApplied, filter } = filterState;

  const send = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      try {
        await fetch("/api/cart/selection", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ loai, ...payload }),
        });
        await reload();
      } finally {
        setBusy(false);
      }
    },
    [loai, reload],
  );

  return {
    busy,
    toggle: (id: string, chon: boolean) => send({ ids: [id], chon }),
    toggleMatching: (chon: boolean) => send({ khop: { q: qApplied, filter }, chon }),
  };
}
