import { rentalCartStore } from "../rentals/server";
import { cartStore } from "../cart/server";
import { getPrisma } from "../db/client";
import { createPaymentService, type PaymentService } from "./service";

export const paymentService: PaymentService = createPaymentService({
  getDb: getPrisma,
  rentalCart: () => rentalCartStore,
  purchaseCart: () => cartStore,
});
