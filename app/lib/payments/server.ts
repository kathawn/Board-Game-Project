import { rentalCartStore } from "../rentals/server";
import { getPrisma } from "../db/client";
import { createPaymentService, type PaymentService } from "./service";

export const paymentService: PaymentService = createPaymentService({
  getDb: getPrisma,
  rentalCart: () => rentalCartStore,
});
