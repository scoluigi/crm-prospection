"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { countCallsToday, logCall } from "@/services/calls";
import { endSession, startSession } from "@/services/sessions";

export type PunchResult = { callsToday: number };

/** Pointage solo : +1 appel passé, renvoie le nouveau total du jour. */
export async function punchAction(): Promise<PunchResult> {
  const user = await requireUser();
  await logCall({ userId: user.id });
  revalidatePath("/classement");
  return { callsToday: await countCallsToday(user.id) };
}

/** Pointage d'entrée : démarre la session de prospection. */
export async function startSessionAction(): Promise<{ ok: true }> {
  const user = await requireUser();
  await startSession(user.id);
  revalidatePath("/classement");
  return { ok: true };
}

/** Pointage de sortie : clôture la session. */
export async function endSessionAction(): Promise<{ ok: true }> {
  const user = await requireUser();
  await endSession(user.id);
  revalidatePath("/classement");
  return { ok: true };
}
