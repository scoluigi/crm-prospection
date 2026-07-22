import { and, asc, desc, eq, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, prospects, tasks, users } from "@/lib/db";
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/constants";
import { today, uid } from "@/lib/utils";
import { logActivity } from "./activity";

export type TaskRow = {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  comment: string | null;
  completedAt: number | null;
  createdAt: number;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeColor: string | null;
  prospectId: string | null;
  prospectName: string | null;
  prospectPhone: string | null;
};

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  type: tasks.type,
  priority: tasks.priority,
  status: tasks.status,
  dueDate: tasks.dueDate,
  comment: tasks.comment,
  completedAt: tasks.completedAt,
  createdAt: tasks.createdAt,
  assigneeId: tasks.assigneeId,
  assigneeName: users.name,
  assigneeColor: users.color,
  prospectId: tasks.prospectId,
  prospectName: prospects.companyName,
  prospectPhone: prospects.phone,
};

function baseQuery() {
  return db
    .select(taskColumns)
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .leftJoin(prospects, eq(prospects.id, tasks.prospectId));
}

/** Tri métier : urgence d'abord, puis échéance. */
const priorityOrder = sql`case ${tasks.priority}
  when 'urgente' then 0 when 'haute' then 1 when 'normale' then 2 else 3 end`;

export type TaskScope = {
  /** `null` = tâches communes uniquement ; `undefined` = toute l'équipe. */
  assigneeId?: string | null;
  status?: TaskStatus | "ouvertes";
  dueBefore?: string;
  dueOn?: string;
  prospectId?: string;
};

export async function listTasks(scope: TaskScope = {}): Promise<TaskRow[]> {
  const clauses: SQL[] = [];

  if (scope.assigneeId === null) clauses.push(isNull(tasks.assigneeId));
  else if (scope.assigneeId) clauses.push(eq(tasks.assigneeId, scope.assigneeId));

  if (scope.status === "ouvertes") clauses.push(ne(tasks.status, "termine"));
  else if (scope.status) clauses.push(eq(tasks.status, scope.status));

  if (scope.dueOn) clauses.push(eq(tasks.dueDate, scope.dueOn));
  if (scope.dueBefore) clauses.push(lt(tasks.dueDate, scope.dueBefore));
  if (scope.prospectId) clauses.push(eq(tasks.prospectId, scope.prospectId));

  return baseQuery()
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(priorityOrder, asc(tasks.dueDate), desc(tasks.createdAt))
    .limit(300);
}

/**
 * Tâches pertinentes « aujourd'hui » pour un associé :
 * ce qui est dû aujourd'hui + tout ce qui est en retard.
 * Inclut les tâches communes (sans responsable).
 */
export async function getTodayTasks(userId: string): Promise<{
  mine: TaskRow[];
  shared: TaskRow[];
  overdue: TaskRow[];
}> {
  const day = today();

  const [mine, shared, overdue] = await Promise.all([
    baseQuery()
      .where(and(eq(tasks.assigneeId, userId), ne(tasks.status, "termine"), lte(tasks.dueDate, day)))
      .orderBy(priorityOrder, asc(tasks.dueDate)),
    baseQuery()
      .where(and(isNull(tasks.assigneeId), ne(tasks.status, "termine"), lte(tasks.dueDate, day)))
      .orderBy(priorityOrder, asc(tasks.dueDate)),
    baseQuery()
      .where(
        and(
          ne(tasks.status, "termine"),
          lt(tasks.dueDate, day),
          or(eq(tasks.assigneeId, userId), isNull(tasks.assigneeId)),
        ),
      )
      .orderBy(asc(tasks.dueDate)),
  ]);

  return { mine, shared, overdue };
}

export async function countOverdueTasks(userId?: string): Promise<number> {
  const clauses: SQL[] = [ne(tasks.status, "termine"), lt(tasks.dueDate, today())];
  if (userId) clauses.push(eq(tasks.assigneeId, userId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tasks)
    .where(and(...clauses));
  return row?.n ?? 0;
}

export type TaskInput = {
  title: string;
  type?: TaskType;
  priority?: TaskPriority;
  assigneeId?: string | null;
  prospectId?: string | null;
  dueDate: string;
  comment?: string | null;
};

export async function createTask(input: TaskInput, actorId: string): Promise<string> {
  const id = uid();
  const ts = Date.now();

  await db.insert(tasks).values({
    id,
    title: input.title.trim(),
    type: input.type ?? "autre",
    priority: input.priority ?? "normale",
    status: "a_faire",
    assigneeId: input.assigneeId ?? null,
    prospectId: input.prospectId || null,
    dueDate: input.dueDate,
    comment: input.comment || null,
    createdById: actorId,
    createdAt: ts,
    updatedAt: ts,
  });

  logActivity({
    type: "tache_creee",
    message: `Tâche créée : ${input.title.trim()}`,
    userId: actorId,
    prospectId: input.prospectId || null,
  });

  return id;
}

export async function updateTask(
  id: string,
  input: Partial<TaskInput> & { status?: TaskStatus },
  actorId: string,
): Promise<void> {
  const [before] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!before) throw new Error("Tâche introuvable");

  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    patch[key] = value === "" ? null : value;
  }

  if (input.status === "termine" && before.status !== "termine") {
    patch.completedAt = Date.now();
  } else if (input.status && input.status !== "termine") {
    patch.completedAt = null;
  }

  await db.update(tasks).set(patch).where(eq(tasks.id, id));

  if (input.status === "termine" && before.status !== "termine") {
    logActivity({
      type: "tache_terminee",
      message: `Tâche terminée : ${before.title}`,
      userId: actorId,
      prospectId: before.prospectId,
    });
  }
}

export async function toggleTask(id: string, actorId: string): Promise<void> {
  const [before] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!before) return;
  await updateTask(id, { status: before.status === "termine" ? "a_faire" : "termine" }, actorId);
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}

/** Statistiques de tâches par associé pour la vue Équipe. */
export async function taskStatsByUser(): Promise<
  Record<string, { open: number; overdue: number; doneToday: number }>
> {
  const day = today();
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      assigneeId: tasks.assigneeId,
      open: sql<number>`sum(case when ${tasks.status} != 'termine' then 1 else 0 end)`,
      overdue: sql<number>`sum(case when ${tasks.status} != 'termine' and ${tasks.dueDate} < ${day} then 1 else 0 end)`,
      doneToday: sql<number>`sum(case when ${tasks.completedAt} >= ${startToday.getTime()} then 1 else 0 end)`,
    })
    .from(tasks)
    .groupBy(tasks.assigneeId);

  const out: Record<string, { open: number; overdue: number; doneToday: number }> = {};
  for (const r of rows) {
    out[r.assigneeId ?? "commun"] = {
      open: Number(r.open ?? 0),
      overdue: Number(r.overdue ?? 0),
      doneToday: Number(r.doneToday ?? 0),
    };
  }
  return out;
}
