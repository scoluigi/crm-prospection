import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, calls, prospects, users } from "@/lib/db";
import { CALL_OUTCOME_LABELS, CALL_OUTCOME_STATUS, type CallOutcome } from "@/lib/constants";
import { startOfTodayMs, uid } from "@/lib/utils";
import { logActivity } from "./activity";

export type CallRow = {
  id: string;
  prospectId: string | null;
  outcome: CallOutcome | null;
  notes: string | null;
  calledAt: number;
  userId: string;
  userName: string | null;
  userColor: string | null;
};

/**
 * Enregistre un appel. Deux usages :
 * - « pointage solo » : userId seul (prospectId/outcome nuls) — juste +1 au compteur.
 * - depuis une fiche lead : prospectId + outcome → met aussi à jour le statut du lead.
 */
export async function logCall(input: {
  userId: string;
  prospectId?: string | null;
  outcome?: CallOutcome | null;
  notes?: string | null;
}): Promise<void> {
  const now = Date.now();

  await db.insert(calls).values({
    id: uid(),
    userId: input.userId,
    prospectId: input.prospectId || null,
    outcome: input.outcome || null,
    notes: input.notes || null,
    calledAt: now,
  });

  if (input.prospectId) {
    const newStatus = input.outcome ? CALL_OUTCOME_STATUS[input.outcome] : null;
    await db
      .update(prospects)
      .set({ lastContactAt: now, updatedAt: now, ...(newStatus ? { status: newStatus } : {}) })
      .where(eq(prospects.id, input.prospectId));

    logActivity({
      type: "appel_effectue",
      message: input.outcome ? `Appel : ${CALL_OUTCOME_LABELS[input.outcome]}` : "Appel passé",
      userId: input.userId,
      prospectId: input.prospectId,
    });
  }
}

export async function getProspectCalls(prospectId: string): Promise<CallRow[]> {
  return db
    .select({
      id: calls.id,
      prospectId: calls.prospectId,
      outcome: calls.outcome,
      notes: calls.notes,
      calledAt: calls.calledAt,
      userId: calls.userId,
      userName: users.name,
      userColor: users.color,
    })
    .from(calls)
    .leftJoin(users, eq(users.id, calls.userId))
    .where(eq(calls.prospectId, prospectId))
    .orderBy(desc(calls.calledAt));
}

/** Nombre d'appels depuis un instant donné (compteur pointeuse). */
export async function countCallsSince(since: number, userId?: string): Promise<number> {
  const clauses = [gte(calls.calledAt, since)];
  if (userId) clauses.push(eq(calls.userId, userId));
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(calls)
    .where(and(...clauses));
  return row?.n ?? 0;
}

export function countCallsToday(userId?: string): Promise<number> {
  return countCallsSince(startOfTodayMs(), userId);
}
