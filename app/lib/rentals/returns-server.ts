import { getPrisma } from "../db/client";
import { createReturnService, type ReturnService } from "./returns";

export const returnService: ReturnService = createReturnService({ getDb: getPrisma });
