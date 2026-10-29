import { createInMemoryRentalCartStore, type RentalCartStore } from "./store";
import { createPrismaRentalOrderStore, type RentalOrderStore } from "./order-store";
import { getPrisma } from "../db/client";

// Đơn thuê nằm trong SQL Server. Giỏ thuê chưa có bảng trong ERD nên vẫn ở bộ nhớ; đặt trên globalThis
// để `next dev` hot-reload không làm giỏ của mọi người biến mất (restart server thì giỏ mất).
export const rentalOrderStore: RentalOrderStore = createPrismaRentalOrderStore(getPrisma);

const g = globalThis as unknown as { __bvRentalCart?: RentalCartStore };
export const rentalCartStore: RentalCartStore = (g.__bvRentalCart ??= createInMemoryRentalCartStore((productSlug) =>
  rentalOrderStore.listActiveDateRangesForProduct(productSlug),
));
