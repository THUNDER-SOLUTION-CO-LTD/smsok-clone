"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "../auth";
import {
  createApiKeyForUser,
  deleteApiKeyForUser,
  listApiKeysForUser,
  toggleApiKeyForUser,
  updateApiKeyNameForUser,
} from "../api-keys/service";

async function requireSessionUserId() {
  const user = await getSession();
  if (!user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  return user.id;
}

export async function createApiKey(data: unknown) {
  const result = await createApiKeyForUser(await requireSessionUserId(), data);
  revalidatePath("/dashboard/api-keys");
  return result;
}

export async function getApiKeys() {
  return listApiKeysForUser(await requireSessionUserId());
}

export async function toggleApiKey(keyId: string) {
  const result = await toggleApiKeyForUser(await requireSessionUserId(), keyId);
  revalidatePath("/dashboard/api-keys");
  return result;
}

export async function updateApiKeyName(
  keyId: string,
  data: unknown,
) {
  const result = await updateApiKeyNameForUser(
    await requireSessionUserId(),
    keyId,
    data,
  );
  revalidatePath("/dashboard/api-keys");
  return result;
}

export async function deleteApiKey(keyId: string) {
  await deleteApiKeyForUser(await requireSessionUserId(), keyId);
  revalidatePath("/dashboard/api-keys");
}
