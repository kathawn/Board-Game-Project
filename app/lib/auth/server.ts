import { createAuthService, type AuthService } from "./auth";
import { createInMemoryAccountStore } from "./store";
import { createPrismaAccountStore } from "./prisma-store";
import { createSessionStore, type SessionStore } from "./session";
import { dbEnabled, getPrisma } from "../db/client";

// Phiên đăng nhập vẫn nằm trong bộ nhớ (chưa có bảng Session trong ERD): đặt trên globalThis để
// `next dev` hot-reload không làm mọi người bị đăng xuất. Restart server thì phải đăng nhập lại.
const g = globalThis as unknown as { __bvSessions?: SessionStore };

export let sessionStore: SessionStore = (g.__bvSessions ??= createSessionStore());
// Có DATABASE_URL (và không chạy test) -> tài khoản đọc/ghi SQL Server; ngược lại dùng bộ nhớ như cũ.
export let authService: AuthService = createAuthService(
  dbEnabled() ? createPrismaAccountStore(getPrisma) : createInMemoryAccountStore(),
  sessionStore,
);

export function resetAuthForTests() {
  sessionStore = createSessionStore();
  authService = createAuthService(createInMemoryAccountStore(), sessionStore);
}
