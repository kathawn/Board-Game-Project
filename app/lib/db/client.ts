import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../generated/prisma/client";
import { parseSqlServerUrl } from "./connection";

/** App chỉ nối DB khi có DATABASE_URL và không chạy dưới vitest (NODE_ENV=test) — test đơn vị
 * vẫn dùng store in-memory để chạy được mà không cần SQL Server. */
export function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL) && process.env.NODE_ENV !== "test";
}

// Giữ một PrismaClient duy nhất qua các lần hot-reload của `next dev`, nếu không mỗi lần sửa file
// sẽ mở thêm một pool kết nối tới SQL Server.
const globalForPrisma = globalThis as unknown as { __boardversePrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__boardversePrisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL chưa được cấu hình (xem app/.env).");
    globalForPrisma.__boardversePrisma = new PrismaClient({
      adapter: new PrismaMssql(parseSqlServerUrl(url)),
    });
  }
  return globalForPrisma.__boardversePrisma;
}
