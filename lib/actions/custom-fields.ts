"use server";

import { prisma } from "@/lib/db";

// ── List custom fields ───────────────────────────────
export async function getCustomFields(userId: string) {
  return prisma.customField.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

// ── Create custom field ──────────────────────────────
export async function createCustomField(
  userId: string,
  data: { name: string; type: string; options?: string[]; required?: boolean }
) {
  const validTypes = ["text", "number", "date", "select"];
  if (!validTypes.includes(data.type)) {
    throw new Error("ประเภทฟิลด์ไม่ถูกต้อง");
  }
  if (data.type === "select" && (!data.options || data.options.length === 0)) {
    throw new Error("ฟิลด์ประเภท select ต้องมีตัวเลือกอย่างน้อย 1 รายการ");
  }

  const count = await prisma.customField.count({ where: { userId } });
  if (count >= 20) {
    throw new Error("สร้าง Custom Field ได้สูงสุด 20 รายการ");
  }

  return prisma.customField.create({
    data: {
      userId,
      name: data.name.trim(),
      type: data.type,
      options: data.options ? JSON.stringify(data.options) : null,
      required: data.required ?? false,
    },
  });
}

// ── Update custom field ──────────────────────────────
export async function updateCustomField(
  userId: string,
  fieldId: string,
  data: { name?: string; type?: string; options?: string[]; required?: boolean }
) {
  const field = await prisma.customField.findFirst({
    where: { id: fieldId, userId },
  });
  if (!field) throw new Error("ไม่พบ Custom Field");

  if (data.type) {
    const validTypes = ["text", "number", "date", "select"];
    if (!validTypes.includes(data.type)) {
      throw new Error("ประเภทฟิลด์ไม่ถูกต้อง");
    }
  }

  return prisma.customField.update({
    where: { id: fieldId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.options !== undefined && { options: JSON.stringify(data.options) }),
      ...(data.required !== undefined && { required: data.required }),
    },
  });
}

// ── Delete custom field ──────────────────────────────
export async function deleteCustomField(userId: string, fieldId: string) {
  const field = await prisma.customField.findFirst({
    where: { id: fieldId, userId },
  });
  if (!field) throw new Error("ไม่พบ Custom Field");

  await prisma.customField.delete({ where: { id: fieldId } });
  return { success: true };
}

// ── Get custom field values for a contact ────────────
export async function getCustomFieldValues(userId: string, contactId: string) {
  // Verify contact ownership
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  return prisma.customFieldValue.findMany({
    where: { contactId },
    include: { field: { select: { id: true, name: true, type: true, options: true } } },
  });
}

// ── Set custom field values for a contact (upsert) ───
export async function setCustomFieldValues(
  userId: string,
  contactId: string,
  values: Array<{ fieldId: string; value: string }>
) {
  // Verify contact ownership
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new Error("ไม่พบรายชื่อ");

  // Verify all fields belong to user
  const fieldIds = values.map((v) => v.fieldId);
  const fields = await prisma.customField.findMany({
    where: { id: { in: fieldIds }, userId },
  });
  if (fields.length !== fieldIds.length) {
    throw new Error("Custom Field บางรายการไม่ถูกต้อง");
  }

  // Validate select-type values against options
  for (const val of values) {
    const field = fields.find((f) => f.id === val.fieldId);
    if (field?.type === "select" && field.options) {
      const opts: string[] = JSON.parse(field.options);
      if (!opts.includes(val.value)) {
        throw new Error(`ค่า "${val.value}" ไม่อยู่ในตัวเลือกของฟิลด์ "${field.name}"`);
      }
    }
  }

  // Upsert all values in transaction
  await prisma.$transaction(
    values.map((v) =>
      prisma.customFieldValue.upsert({
        where: { contactId_fieldId: { contactId, fieldId: v.fieldId } },
        create: { contactId, fieldId: v.fieldId, value: v.value },
        update: { value: v.value },
      })
    )
  );

  return { success: true };
}
