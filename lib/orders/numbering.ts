import { type PrismaClient } from "@prisma/client";
import { prisma as db } from "@/lib/db";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;

export type OrderDocumentKind =
  | "order"
  | "quotation"
  | "invoice"
  | "tax-invoice"
  | "receipt"
  | "credit-note"
  | "debit-note";

const PREFIX_BY_KIND: Record<OrderDocumentKind, string> = {
  order: "ORD",
  quotation: "QT",
  invoice: "INV",
  "tax-invoice": "TIV",
  receipt: "RCP",
  "credit-note": "CN",
  "debit-note": "DN",
};

function toYearMonth(now = new Date()) {
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatOrderDocumentNumber(prefix: string, sequence: number, now = new Date()) {
  return `${prefix}-${toYearMonth(now)}-${String(sequence).padStart(5, "0")}`;
}

export async function generateOrderDocumentNumber(
  kind: OrderDocumentKind,
  client: DbClient = db,
  now = new Date(),
) {
  const prefix = PREFIX_BY_KIND[kind];
  const yearMonth = toYearMonth(now);

  const sequence = await client.documentSequence.upsert({
    where: {
      prefix_yearMonth: {
        prefix,
        yearMonth,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      prefix,
      yearMonth,
      lastNumber: 1,
    },
  });

  return formatOrderDocumentNumber(prefix, sequence.lastNumber, now);
}
