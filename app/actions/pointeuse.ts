"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { callsReportedToday, pointe, setReportedToday, startSession } from "@/services/sessions";

/** Pointage d'entrée : démarre la session de prospection. */
export async function startSessionAction(): Promise<{ ok: true }> {
  const user = await requireUser();
  await startSession(user.id);
  revalidatePath("/classement");
  return { ok: true };
}

/** Pointage de sortie : clôture la session avec le nombre d'appels saisi. */
export async function pointeAction(callsCount: number): Promise<{ callsToday: number }> {
  const user = await requireUser();
  const n = Number.isFinite(callsCount) && callsCount > 0 ? Math.floor(callsCount) : 0;
  await pointe(user.id, n);
  revalidatePath("/classement");
  return { callsToday: await callsReportedToday(user.id) };
}

/**
 * Corrige MON total d'appels du jour. `requireUser` garantit qu'on ne peut
 * modifier que le sien — l'id n'est jamais passé par le client.
 */
export async function setMyCallsAction(target: number): Promise<{ callsToday: number }> {
  const user = await requireUser();
  const total = await setReportedToday(user.id, target);
  revalidatePath("/classement");
  return { callsToday: total };
}
