import { createInMemoryRentalCartStore, type RentalCartStore } from "./store";

export let rentalCartStore: RentalCartStore = createInMemoryRentalCartStore();

export function resetRentalCartForTests() {
  rentalCartStore = createInMemoryRentalCartStore();
}
