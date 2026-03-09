import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? [{ emit: "event", level: "error" }]
        : [{ emit: "event", level: "query" }, { emit: "event", level: "error" }],
  });

prisma.$on("error" as never, (e: unknown) => {
  const event = e as { message: string };
  logger.error("Prisma error", { detail: event.message });
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
