import { randomUUID } from "node:crypto";

type VerificationCodeClient = {
  orderDocument: {
    findUnique(args: {
      where: { id: string },
      select: { verificationCode: true },
    }): Promise<{ verificationCode: string | null } | null>;
    updateMany(args: {
      where: { id: string, verificationCode: null },
      data: { verificationCode: string },
    }): Promise<{ count: number }>;
  };
};

export async function ensureOrderDocumentVerificationCode(
  client: VerificationCodeClient,
  documentId: string,
  existingCode?: string | null,
) {
  if (existingCode) {
    return existingCode;
  }

  const nextCode = randomUUID();
  const updateResult = await client.orderDocument.updateMany({
    where: {
      id: documentId,
      verificationCode: null,
    },
    data: { verificationCode: nextCode },
  });

  if (updateResult.count > 0) {
    return nextCode;
  }

  const latest = await client.orderDocument.findUnique({
    where: { id: documentId },
    select: { verificationCode: true },
  });

  if (latest?.verificationCode) {
    return latest.verificationCode;
  }

  throw new Error("ไม่สามารถสร้าง verification code สำหรับเอกสารได้");
}
