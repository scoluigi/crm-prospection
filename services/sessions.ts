import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db, sessions, type Session } from "@/lib/db";
import { startOfTodayMs, uid } from "@/lib/utils";

/** Session de prospection en cours (non pointée) pour un associé, s'il y en a une. */
export async function getActiveSession(userId: string): Promise<Session | undefined> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(1);
  return row;
}

/** Démarre une session (pointage d'entrée) — ou renvoie celle déjà ouverte. */
export async function startSession(userId: string): Promise<Session> {
  const active = await getActiveSession(userId);
  if (active) return active;

  const row = { id: uid(), userId, startedAt: Date.now(), endedAt: null, callsCount: null };
  await db.insert(sessions).values(row);
  return row as Session;
}

/** Pointage de sortie : clôture la session ouverte en enregistrant le nombre d'appels. */
export async function pointe(userId: string, callsCount: number): Promise<void> {
  const active = await getActiveSession(userId);
  if (!active) {
    // Pas de session ouverte : on en crée une déjà clôturée (pointage rapide).
    await db.insert(sessions).values({
      id: uid(),
      userId,
      startedAt: Date.now(),
      endedAt: Date.now(),
      callsCount,
    });
    return;
  }
  await db.update(sessions).set({ endedAt: Date.now(), callsCount }).where(eq(sessions.id, active.id));
}

/** Total d'appels déclarés aujourd'hui (sessions pointées). */
export async function callsReportedToday(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${sessions.callsCount}), 0)::int` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, startOfTodayMs())));
  return row?.n ?? 0;
}

/**
 * Fixe le total d'appels du jour pour un associé (correction manuelle).
 * On enregistre un ajustement (session instantanée) pour atteindre la valeur voulue.
 */
export async function setReportedToday(userId: string, target: number): Promise<number> {
  const current = await callsReportedToday(userId);
  const delta = Math.max(0, Math.floor(target)) - current;
  if (delta !== 0) {
    const now = Date.now();
    await db.insert(sessions).values({
      id: uid(),
      userId,
      startedAt: now,
      endedAt: now,
      callsCount: delta,
    });
  }
  return Math.max(0, Math.floor(target));
}
