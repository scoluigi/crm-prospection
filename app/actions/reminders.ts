"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { cancelReminder, completeReminder, postponeReminder, scheduleReminder } from "@/services/reminders";
import type { ActionState } from "./prospects";

function revalidateReminderViews(prospectId?: string) {
  revalidatePath("/");
  revalidatePath("/relances");
  revalidatePath("/aujourdhui");
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/equipe");
  if (prospectId) revalidatePath(`/prospects/${prospectId}`);
}

export async function scheduleReminderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const prospectId = String(formData.get("prospectId") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const channel = String(formData.get("channel") ?? "appel") as "appel" | "email" | "sms" | "autre";
  const note = formData.get("note") ? String(formData.get("note")) : null;
  const assigneeId = String(formData.get("assigneeId") ?? user.id);

  if (!prospectId) return { error: "Prospect introuvable" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { error: "Date de relance invalide" };

  await scheduleReminder({
    prospectId,
    assigneeId: assigneeId || user.id,
    dueDate,
    channel,
    note,
    actorId: user.id,
  });

  revalidateReminderViews(prospectId);
  return { ok: true };
}

export async function completeReminderAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  await completeReminder(id, user.id);
  revalidateReminderViews();
  return { ok: true };
}

export async function postponeReminderAction(id: string, days: number): Promise<ActionState> {
  const user = await requireUser();
  if (!Number.isFinite(days) || days < 1 || days > 365) return { error: "Report invalide" };
  await postponeReminder(id, days, user.id);
  revalidateReminderViews();
  return { ok: true };
}

export async function cancelReminderAction(id: string): Promise<ActionState> {
  await requireUser();
  await cancelReminder(id);
  revalidateReminderViews();
  return { ok: true };
}
