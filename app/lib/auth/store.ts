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
  get(email: string): Promise<Account | undefined>;
  save(account: Account): Promise<void>;
}

export function createInMemoryAccountStore(): AccountStore {
  const accounts = new Map<string, Account>();

  return {
    async get(email) {
      return accounts.get(email);
    },
    async save(account) {
      accounts.set(account.email, account);
    },
  };
}
