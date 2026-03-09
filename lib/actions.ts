"use server";

import { prisma } from "./db";
import { hashPassword, verifyPassword, setSession, clearSession } from "./auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  if (password.length < 8) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed },
  });

  await setSession(user.id);
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await setSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/");
}
