import { createInMemoryRentalCartStore, type RentalCartStore } from "./store";
import { createInMemoryRentalOrderStore, type RentalOrderStore } from "./order-store";

export let rentalOrderStore: RentalOrderStore = createInMemoryRentalOrderStore();
export let rentalCartStore: RentalCartStore = createInMemoryRentalCartStore((productSlug) =>
  rentalOrderStore.listActiveDateRangesForProduct(productSlug),
);

export function resetRentalCartForTests() {
  rentalOrderStore = createInMemoryRentalOrderStore();
  rentalCartStore = createInMemoryRentalCartStore((productSlug) =>
    rentalOrderStore.listActiveDateRangesForProduct(productSlug),
  );
}
