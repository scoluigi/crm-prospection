import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, calls, prospects, users } from "@/lib/db";
import {
  CALL_OUTCOME_LABELS,
  CALL_OUTCOME_RULES,
  type CallOutcome,
} from "@/lib/constants";
import { addDaysISO, startOfTodayMs, uid } from "@/lib/utils";
import { logActivity } from "./activity";
import { scheduleReminder } from "./reminders";

export type CallRow = {
  id: string;
  prospectId: string;
  outcome: CallOutcome;
  notes: string | null;
  durationMin: number | null;
  calledAt: number;
  companyName: string;
  userId: string;
  userName: string | null;
  userColor: string | null;
};

const callColumns = {
  id: calls.id,
  prospectId: calls.prospectId,
  outcome: calls.outcome,
  notes: calls.notes,
  durationMin: calls.durationMin,
  calledAt: calls.calledAt,
  userId: calls.userId,
  companyName: prospects.companyName,
  userName: users.name,
  userColor: users.color,
};

/**
 * Enregistre un appel et applique la règle métier associée au résultat :
 * mise à jour du statut prospect, du niveau d'intérêt, de la date de dernier
 * contact, et création de la relance suivante.
 *
 * C'est l'action la plus utilisée du CRM — tout doit se faire en un seul clic.
 */
export async function logCall(input: {
  prospectId: string;
  userId: string;
  outcome: CallOutcome;
  notes?: string | null;
  durationMin?: number | null;
  /** Date de relance choisie manuellement ; sinon on applique la règle par défaut. */
  nextFollowUp?: string | null;
}): Promise<void> {
  const now = Date.now();
  const rule = CALL_OUTCOME_RULES[input.outcome];

  await db.insert(calls).values({
    id: uid(),
    prospectId: input.prospectId,
    userId: input.userId,
    outcome: input.outcome,
    notes: input.notes || null,
    durationMin: input.durationMin ?? null,
    calledAt: now,
  });

  await db
    .update(prospects)
    .set({
      status: rule.status,
      ...(rule.interest ? { interest: rule.interest } : {}),
      lastContactAt: now,
      updatedAt: now,
    })
    .where(eq(prospects.id, input.prospectId));

  logActivity({
    type: "appel_effectue",
    message: `Appel : ${CALL_OUTCOME_LABELS[input.outcome]}`,
    userId: input.userId,
    prospectId: input.prospectId,
    meta: { outcome: input.outcome },
  });

  // Relance : la date explicite prime sur la règle par défaut.
  const followUpDate =
    input.nextFollowUp ??
    (rule.nextFollowUpDays !== null ? addDaysISO(rule.nextFollowUpDays) : null);

  if (followUpDate) {
    await scheduleReminder({
      prospectId: input.prospectId,
      assigneeId: input.userId,
      dueDate: followUpDate,
      channel: "appel",
      note: input.notes || null,
      actorId: input.userId,
    });
  }
}

export async function getProspectCalls(prospectId: string): Promise<CallRow[]> {
  return db
    .select(callColumns)
    .from(calls)
    .innerJoin(prospects, eq(prospects.id, calls.prospectId))
    .leftJoin(users, eq(users.id, calls.userId))
    .where(eq(calls.prospectId, prospectId))
    .orderBy(desc(calls.calledAt));
}

export async function getTodayCalls(userId?: string): Promise<CallRow[]> {
  const start = startOfTodayMs();
  const clauses = [gte(calls.calledAt, start)];
  if (userId) clauses.push(eq(calls.userId, userId));

  return db
    .select(callColumns)
    .from(calls)
    .innerJoin(prospects, eq(prospects.id, calls.prospectId))
    .leftJoin(users, eq(users.id, calls.userId))
    .where(and(...clauses))
    .orderBy(desc(calls.calledAt));
}

export async function countCallsSince(since: number, userId?: string): Promise<number> {
  const clauses = [gte(calls.calledAt, since)];
  if (userId) clauses.push(eq(calls.userId, userId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(calls)
    .where(and(...clauses));
  return row?.n ?? 0;
}

/** Nombre d'appels du jour par associé, pour la vue Équipe et le dashboard. */
export async function callsTodayByUser(): Promise<Record<string, number>> {
  const rows = await db
    .select({ userId: calls.userId, n: sql<number>`count(*)` })
    .from(calls)
    .where(gte(calls.calledAt, startOfTodayMs()))
    .groupBy(calls.userId);

  return Object.fromEntries(rows.map((r: any) => [r.userId, r.n]));
}

/** Appels par jour sur les N derniers jours, pour le mini-graphique du dashboard. */
export async function callsPerDay(days = 14): Promise<{ date: string; count: number }[]> {
  const since = startOfTodayMs() - (days - 1) * 86_400_000;
  const rows = await db
    .select({
      date: sql<string>`date(${calls.calledAt} / 1000, 'unixepoch', 'localtime')`,
      count: sql<number>`count(*)`,
    })
    .from(calls)
    .where(gte(calls.calledAt, since))
    .groupBy(sql`date(${calls.calledAt} / 1000, 'unixepoch', 'localtime')`);

  const map = new Map<string, number>(rows.map((r: any) => [r.date, r.count]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    out.push({ date: iso, count: (map.get(iso) ?? 0) as number });
  }
  return out;
}
