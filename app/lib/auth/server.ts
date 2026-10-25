import { createAuthService, type AuthService } from "./auth";
import { createInMemoryAccountStore } from "./store";
import { createSessionStore, type SessionStore } from "./session";

export let sessionStore: SessionStore = createSessionStore();
export let authService: AuthService = createAuthService(createInMemoryAccountStore(), sessionStore);

export function resetAuthForTests() {
  sessionStore = createSessionStore();
  authService = createAuthService(createInMemoryAccountStore(), sessionStore);
}
