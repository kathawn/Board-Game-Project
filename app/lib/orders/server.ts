import { createInMemoryOrderStore, type OrderStore } from "./store";

export let orderStore: OrderStore = createInMemoryOrderStore();

export function resetOrdersForTests() {
  orderStore = createInMemoryOrderStore();
}
