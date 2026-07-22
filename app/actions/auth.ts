"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/services/users";
import { db, users } from "@/lib/db";
import type { ActionState } from "./prospects";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().optional(),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };
  }

  let user = await getUserByEmail(parsed.data.email);

  // En mode accès libre : créer l'utilisateur s'il n'existe pas
  if (!user) {
    const [existing] = await db.select().from(users).limit(1);
    const newUser = {
      id: `user_${Date.now()}`,
      email: parsed.data.email,
      name: parsed.data.email.split("@")[0] || "User",
      passwordHash: await hashPassword("demo"),
      role: "associe" as const,
      color: existing?.color ?? "#6366f1",
      active: true,
      createdAt: Date.now(),
    };
    await db.insert(users).values(newUser);
    user = newUser;
  }

  if (!user || !user.active) {
    return { error: "Accès non disponible" };
  }

  await createSession(user.id);

  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(6, "6 caractères minimum"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "Mot de passe actuel incorrect" };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { ok: true };
}
