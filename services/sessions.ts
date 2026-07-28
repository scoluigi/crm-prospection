import { and, desc, eq, isNull } from "drizzle-orm";
import { db, sessions, type Session } from "@/lib/db";
import { uid } from "@/lib/utils";

/** Session de prospection en cours (non clôturée) pour un associé, s'il y en a une. */
export async function getActiveSession(userId: string): Promise<Session | undefined> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(1);
  return row;
}

/** Démarre une session (ou renvoie celle en cours) — appelé au « pointage d'entrée ». */
export async function startSession(userId: string): Promise<Session> {
  const active = await getActiveSession(userId);
  if (active) return active;

  const row = { id: uid(), userId, startedAt: Date.now(), endedAt: null };
  await db.insert(sessions).values(row);
  return row as Session;
}

/** Clôture la session en cours — appelé au « pointage de sortie ». */
export async function endSession(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ endedAt: Date.now() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.endedAt)));
}
