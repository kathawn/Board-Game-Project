export type LoaiGio = "thue" | "mua";

/** Lựa chọn dòng giỏ để thanh toán — lưu phía server để giữ nguyên khi khách đổi trang/bộ lọc/tab,
 * và để checkout dùng đúng các dòng đã chọn (không tin danh sách từ client).
 * Lưu theo kiểu "đã bỏ chọn": mặc định mọi dòng đều được chọn, nên dòng mới thêm vào giỏ tự được chọn. */
export interface SelectionStore {
  isSelected(email: string, loai: LoaiGio, id: string): boolean;
  set(email: string, loai: LoaiGio, ids: string[], chon: boolean): void;
}

export function createInMemorySelectionStore(): SelectionStore {
  const boChon = new Map<string, Set<string>>();
  const key = (email: string, loai: LoaiGio) => `${email}|${loai}`;
  return {
    isSelected: (email, loai, id) => !boChon.get(key(email, loai))?.has(id),
    set(email, loai, ids, chon) {
      const k = key(email, loai);
      const s = boChon.get(k) ?? new Set<string>();
      for (const id of ids) {
        if (chon) s.delete(id);
        else s.add(id);
      }
      boChon.set(k, s);
    },
  };
}

const g = globalThis as unknown as { __bvCartSelection?: SelectionStore };
// globalThis để hot-reload của `next dev` không làm mất lựa chọn (giống giỏ thuê).
export const selectionStore: SelectionStore = (g.__bvCartSelection ??= createInMemorySelectionStore());
