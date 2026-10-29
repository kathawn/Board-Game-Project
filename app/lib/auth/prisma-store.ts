import type { PrismaClient } from "../generated/prisma/client";
import type { Account, AccountStore } from "./store";

/** Tài khoản khách hàng lưu ở bảng KhachHang (SDD mục 3). Đăng ký tạo luôn Ví điện tử nội bộ
 * số dư 0 theo quan hệ 1-1 (BRU-06). */
export function createPrismaAccountStore(getDb: () => PrismaClient): AccountStore {
  return {
    async get(email) {
      const row = await getDb().khachHang.findUnique({ where: { email } });
      if (!row) return undefined;
      const account: Account = {
        email: row.email,
        passwordHash: row.matKhauHash,
        failedAttempts: row.soLanSai,
        lockedUntil: row.khoaDen ? row.khoaDen.getTime() : null,
        hoTen: row.hoTen,
        sdt: row.sdt,
        diaChi: row.diaChi,
      };
      return account;
    },

    async save(account) {
      const fields = {
        hoTen: account.hoTen,
        sdt: account.sdt,
        diaChi: account.diaChi,
        matKhauHash: account.passwordHash,
        soLanSai: account.failedAttempts,
        khoaDen: account.lockedUntil === null ? null : new Date(account.lockedUntil),
      };
      await getDb().khachHang.upsert({
        where: { email: account.email },
        update: fields,
        create: { email: account.email, ...fields, viDienTu: { create: { soDu: 0 } } },
      });
    },
  };
}
