import { getPrisma } from "../db/client";
import { createMockCarrier } from "./carrier";
import { createShippingService, type ShippingService } from "./service";

export const shippingService: ShippingService = createShippingService({
  getDb: getPrisma,
  carrier: createMockCarrier(),
});
