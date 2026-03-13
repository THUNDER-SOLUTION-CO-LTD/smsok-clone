import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import {
  InvoicePdf,
  type InvoicePdfData,
} from "@/lib/accounting/pdf/invoice-pdf";
import {
  QuotationPdf,
  type QuotationPdfData,
} from "@/lib/accounting/pdf/quotation-pdf";
import { buildDocumentVerificationAssets } from "@/lib/accounting/pdf/document-verification";
import { numberToThaiText } from "@/lib/accounting/thai-number";

type NumericLike = { toNumber(): number } | number;

type OrderPdfRecord = {
  id: string;
  orderNumber: string;
  customerType: "INDIVIDUAL" | "COMPANY";
  packageName: string;
  smsCount: number;
  taxName: string;
  taxId: string;
  taxAddress: string;
  taxBranchType: "HEAD" | "BRANCH";
  taxBranchNumber: string | null;
  netAmount: NumericLike;
  vatAmount: NumericLike;
  totalAmount: NumericLike;
  hasWht: boolean;
  whtAmount: NumericLike;
  payAmount: NumericLike;
  quotationNumber?: string | null;
  invoiceNumber?: string | null;
  expiresAt?: Date;
  paidAt?: Date | null;
  createdAt: Date;
  user?: {
    email?: string | null;
    phone?: string | null;
  } | null;
};

const QUOTATION_SELLER = {
  name: process.env.COMPANY_NAME || "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: process.env.COMPANY_TAX_ID || "0105566000000",
  address:
    process.env.COMPANY_ADDRESS ||
    "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: process.env.COMPANY_PHONE || "LINE: @smsok",
};

const INVOICE_SELLER = {
  ...QUOTATION_SELLER,
  branch: process.env.COMPANY_BRANCH || "สำนักงานใหญ่",
  email: process.env.COMPANY_EMAIL || "billing@smsok.com",
};

function toNumber(value: NumericLike) {
  return typeof value === "number" ? value : value.toNumber();
}

function buildOrderItem(order: OrderPdfRecord) {
  const unitPrice = toNumber(order.netAmount);
  return [
    {
      description: `${order.packageName} (${order.smsCount.toLocaleString("th-TH")} SMS)`,
      quantity: 1,
      unitPrice,
      amount: unitPrice,
    },
  ];
}

function buildBuyerBranch(order: OrderPdfRecord) {
  if (order.customerType === "INDIVIDUAL") {
    return null;
  }

  if (order.taxBranchType === "BRANCH" && order.taxBranchNumber) {
    return `สาขา ${order.taxBranchNumber}`;
  }

  return "สำนักงานใหญ่";
}

async function buildOrderInvoicePdfData(
  order: OrderPdfRecord,
  options: {
    documentNumber: string;
    type: InvoicePdfData["type"];
    issuedAt: Date;
    notes?: string | null;
    isVoid?: boolean;
  },
): Promise<InvoicePdfData> {
  const subtotal = toNumber(order.netAmount);
  const vatAmount = toNumber(order.vatAmount);
  const total = toNumber(order.totalAmount);
  const whtAmount = order.hasWht ? toNumber(order.whtAmount) : null;
  const netPayable = order.hasWht ? toNumber(order.payAmount) : null;
  const verification = await buildDocumentVerificationAssets(options.documentNumber);

  return {
    invoiceNumber: options.documentNumber,
    type: options.type,
    createdAt: options.issuedAt,
    dueDate: options.type === "INVOICE" ? order.expiresAt ?? null : null,
    seller: INVOICE_SELLER,
    buyer: {
      name: order.taxName,
      taxId: order.taxId,
      branch: buildBuyerBranch(order),
      address: order.taxAddress,
      phone: order.user?.phone ?? undefined,
      email: order.user?.email ?? undefined,
    },
    items: buildOrderItem(order),
    subtotal,
    vatRate: 7,
    vatAmount,
    whtRate: order.hasWht ? 3 : null,
    whtAmount,
    total,
    netPayable,
    amountInWords: numberToThaiText(netPayable ?? total),
    verificationUrl: verification.verificationUrl,
    verificationQrDataUrl: verification.verificationQrDataUrl,
    isVoid: options.isVoid ?? false,
    notes: options.notes ?? `อ้างอิงคำสั่งซื้อ ${order.orderNumber}`,
  };
}

export async function renderOrderQuotationPdf(order: OrderPdfRecord) {
  if (!order.quotationNumber) {
    throw new Error("ไม่พบใบเสนอราคาสำหรับคำสั่งซื้อนี้");
  }

  const total = toNumber(order.totalAmount);
  const vatAmount = toNumber(order.vatAmount);
  const subtotal = toNumber(order.netAmount);

  const data: QuotationPdfData = {
    quotationNumber: order.quotationNumber,
    createdAt: order.createdAt,
    validUntil: order.expiresAt ?? order.createdAt,
    seller: QUOTATION_SELLER,
    buyer: {
      name: order.taxName,
      address: order.taxAddress,
      phone: order.user?.phone ?? undefined,
      email: order.user?.email ?? undefined,
    },
    items: buildOrderItem(order),
    subtotal,
    vatRate: 7,
    vatAmount,
    total,
    amountInWords: numberToThaiText(total),
    notes: `อ้างอิงคำสั่งซื้อ ${order.orderNumber}`,
  };

  const element = createElement(QuotationPdf, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

export async function renderOrderInvoicePdf(order: OrderPdfRecord) {
  if (!order.invoiceNumber) {
    throw new Error("ไม่พบใบกำกับภาษีสำหรับคำสั่งซื้อนี้");
  }

  const data = await buildOrderInvoicePdfData(order, {
    documentNumber: order.invoiceNumber,
    type: "TAX_INVOICE_RECEIPT",
    issuedAt: order.paidAt ?? order.createdAt,
  });

  const element = createElement(InvoicePdf, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

export async function renderOrderAccountingDocumentPdf(
  order: OrderPdfRecord,
  options: {
    documentNumber: string;
    type: "INVOICE" | "TAX_INVOICE" | "RECEIPT" | "CREDIT_NOTE";
    issuedAt: Date;
    notes?: string | null;
    isVoid?: boolean;
  },
) {
  const data = await buildOrderInvoicePdfData(order, options);
  const element = createElement(InvoicePdf, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
