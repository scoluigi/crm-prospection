import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, prospects, reminders, users } from "@/lib/db";
import { today, uid } from "@/lib/utils";
import { logActivity } from "./activity";

export type ReminderRow = {
  id: string;
  prospectId: string;
  dueDate: string;
  status: "pending" | "done" | "cancelled";
  channel: "appel" | "email" | "sms" | "autre";
  note: string | null;
  completedAt: number | null;
  createdAt: number;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  prospectStatus: string;
  assigneeId: string;
  assigneeName: string | null;
  assigneeColor: string | null;
};

const reminderColumns = {
  id: reminders.id,
  prospectId: reminders.prospectId,
  dueDate: reminders.dueDate,
  status: reminders.status,
  channel: reminders.channel,
  note: reminders.note,
  completedAt: reminders.completedAt,
  createdAt: reminders.createdAt,
  assigneeId: reminders.assigneeId,
  companyName: prospects.companyName,
  contactName: prospects.contactName,
  phone: prospects.phone,
  prospectStatus: prospects.status,
  assigneeName: users.name,
  assigneeColor: users.color,
};

function baseQuery() {
  return db
    .select(reminderColumns)
    .from(reminders)
    .innerJoin(prospects, eq(prospects.id, reminders.prospectId))
    .leftJoin(users, eq(users.id, reminders.assigneeId));
}

/**
 * Synchronise `prospects.next_follow_up` avec la relance en attente la plus proche.
 * Appelé après chaque création / complétion / report de relance pour que les
 * listes et les cartes Kanban restent cohérentes sans jointure supplémentaire.
 */
export async function syncNextFollowUp(prospectId: string): Promise<void> {
  const [next] = await db
    .select({ dueDate: reminders.dueDate })
    .from(reminders)
    .where(and(eq(reminders.prospectId, prospectId), eq(reminders.status, "pending")))
    .orderBy(asc(reminders.dueDate))
    .limit(1);

  await db
    .update(prospects)
    .set({ nextFollowUp: next?.dueDate ?? null, updatedAt: Date.now() })
    .where(eq(prospects.id, prospectId));
}

export async function scheduleReminder(input: {
  prospectId: string;
  assigneeId: string;
  dueDate: string;
  channel?: "appel" | "email" | "sms" | "autre";
  note?: string | null;
  actorId: string;
  /** Annule les relances en attente déjà présentes (évite d'empiler les rappels). */
  replacePending?: boolean;
}): Promise<string> {
  if (input.replacePending !== false) {
    await db
      .update(reminders)
      .set({ status: "cancelled" })
      .where(and(eq(reminders.prospectId, input.prospectId), eq(reminders.status, "pending")));
  }

  const id = uid();
  await db.insert(reminders).values({
    id,
    prospectId: input.prospectId,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    channel: input.channel ?? "appel",
    note: input.note || null,
    status: "pending",
    createdAt: Date.now(),
  });

  await syncNextFollowUp(input.prospectId);

  logActivity({
    type: "relance_programmee",
    message: `Relance programmée le ${input.dueDate}`,
    userId: input.actorId,
    prospectId: input.prospectId,
  });

  return id;
}

export async function completeReminder(id: string, actorId: string): Promise<void> {
  const [row] = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
  if (!row) throw new Error("Relance introuvable");

  await db
    .update(reminders)
    .set({ status: "done", completedAt: Date.now() })
    .where(eq(reminders.id, id));

  await syncNextFollowUp(row.prospectId);

  logActivity({
    type: "relance_programmee",
    message: `Relance du ${row.dueDate} marquée comme effectuée`,
    userId: actorId,
    prospectId: row.prospectId,
  });
}

/** Reporte une relance de `days` jours à partir de sa date prévue (ou d'aujourd'hui si dépassée). */
export async function postponeReminder(id: string, days: number, actorId: string): Promise<void> {
  const [row] = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
  if (!row) throw new Error("Relance introuvable");

  const base = row.dueDate < today() ? today() : row.dueDate;
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const newDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

  await db.update(reminders).set({ dueDate: newDate }).where(eq(reminders.id, id));
  await syncNextFollowUp(row.prospectId);

  logActivity({
    type: "relance_reportee",
    message: `Relance reportée du ${row.dueDate} au ${newDate}`,
    userId: actorId,
    prospectId: row.prospectId,
  });
}

export async function cancelReminder(id: string): Promise<void> {
  const [row] = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
  if (!row) return;
  await db.update(reminders).set({ status: "cancelled" }).where(eq(reminders.id, id));
  await syncNextFollowUp(row.prospectId);
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

export type ReminderBuckets = {
  overdue: ReminderRow[];
  today: ReminderRow[];
  upcoming: ReminderRow[];
};

export async function getReminderBuckets(ownerId?: string): Promise<ReminderBuckets> {
  const day = today();
  const scope = (extra: SQL) =>
    ownerId ? and(eq(reminders.assigneeId, ownerId), extra)! : extra;

  const [overdue, todayRows, upcoming] = await Promise.all([
    baseQuery()
      .where(scope(and(eq(reminders.status, "pending"), lt(reminders.dueDate, day))!))
      .orderBy(asc(reminders.dueDate)),
    baseQuery()
      .where(scope(and(eq(reminders.status, "pending"), eq(reminders.dueDate, day))!))
      .orderBy(asc(reminders.createdAt)),
    baseQuery()
      .where(scope(and(eq(reminders.status, "pending"), gt(reminders.dueDate, day))!))
      .orderBy(asc(reminders.dueDate))
      .limit(100),
  ]);

  return { overdue, today: todayRows, upcoming };
}

export async function getReminderHistory(prospectId: string): Promise<ReminderRow[]> {
  return baseQuery()
    .where(eq(reminders.prospectId, prospectId))
    .orderBy(desc(reminders.dueDate));
}

export async function countOverdueReminders(ownerId?: string): Promise<number> {
  const clauses: SQL[] = [eq(reminders.status, "pending"), lt(reminders.dueDate, today())];
  if (ownerId) clauses.push(eq(reminders.assigneeId, ownerId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(reminders)
    .where(and(...clauses));
  return row?.n ?? 0;
}
