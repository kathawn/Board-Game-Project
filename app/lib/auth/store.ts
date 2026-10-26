export type Account = {
  email: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: number | null;
  hoTen: string;
  sdt: string;
  diaChi: string;
};

export interface AccountStore {
  get(email: string): Account | undefined;
  save(account: Account): void;
}

export function createInMemoryAccountStore(): AccountStore {
  const accounts = new Map<string, Account>();

  return {
    get(email) {
      return accounts.get(email);
    },
    save(account) {
      accounts.set(account.email, account);
    },
  };
}
