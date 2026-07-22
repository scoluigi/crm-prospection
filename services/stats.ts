import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, calls, prospects, reminders, tasks, users } from "@/lib/db";
import { HOT_STATUSES, PROSPECT_STATUSES, type ProspectStatus } from "@/lib/constants";
import { startOfTodayMs, today } from "@/lib/utils";

export type DashboardStats = {
  totalProspects: number;
  activeProspects: number;
  followUpsToday: number;
  followUpsOverdue: number;
  callsToday: number;
  callsThisWeek: number;
  meetingsPlanned: number;
  hotOpportunities: number;
  quotesSent: number;
  overdueTasks: number;
  openTasks: number;
  wonCount: number;
  wonAmount: number;
  pipelineAmount: number;
  byStatus: { status: ProspectStatus; count: number; amount: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const day = today();
  const startToday = startOfTodayMs();
  const startWeek = startToday - 6 * 86_400_000;

  const [
    totals,
    statusRows,
    followUpToday,
    followUpOverdue,
    callsTodayRow,
    callsWeekRow,
    tasksRow,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${prospects.status} in ('a_contacter','appele','a_relancer','interesse','rdv_pris','devis_envoye') then 1 else 0 end)`,
        hot: sql<number>`sum(case when ${prospects.status} in ('interesse','rdv_pris','devis_envoye') then 1 else 0 end)`,
        meetings: sql<number>`sum(case when ${prospects.status} = 'rdv_pris' then 1 else 0 end)`,
        quotes: sql<number>`sum(case when ${prospects.status} = 'devis_envoye' then 1 else 0 end)`,
        won: sql<number>`sum(case when ${prospects.status} = 'gagne' then 1 else 0 end)`,
        wonAmount: sql<number>`coalesce(sum(case when ${prospects.status} = 'gagne' then ${prospects.estimatedAmount} else 0 end), 0)`,
        pipelineAmount: sql<number>`coalesce(sum(case when ${prospects.status} in ('interesse','rdv_pris','devis_envoye') then ${prospects.estimatedAmount} else 0 end), 0)`,
      })
      .from(prospects),

    db
      .select({
        status: prospects.status,
        count: sql<number>`count(*)`,
        amount: sql<number>`coalesce(sum(${prospects.estimatedAmount}), 0)`,
      })
      .from(prospects)
      .groupBy(prospects.status),

    db
      .select({ n: sql<number>`count(*)` })
      .from(reminders)
      .where(and(eq(reminders.status, "pending"), eq(reminders.dueDate, day))),

    db
      .select({ n: sql<number>`count(*)` })
      .from(reminders)
      .where(and(eq(reminders.status, "pending"), lt(reminders.dueDate, day))),

    db.select({ n: sql<number>`count(*)` }).from(calls).where(gte(calls.calledAt, startToday)),
    db.select({ n: sql<number>`count(*)` }).from(calls).where(gte(calls.calledAt, startWeek)),

    db
      .select({
        open: sql<number>`sum(case when ${tasks.status} != 'termine' then 1 else 0 end)`,
        overdue: sql<number>`sum(case when ${tasks.status} != 'termine' and ${tasks.dueDate} < ${day} then 1 else 0 end)`,
      })
      .from(tasks),
  ]);

  const t = totals[0];
  const statusMap = new Map(statusRows.map((r) => [r.status, r]));

  return {
    totalProspects: Number(t?.total ?? 0),
    activeProspects: Number(t?.active ?? 0),
    followUpsToday: Number(followUpToday[0]?.n ?? 0),
    followUpsOverdue: Number(followUpOverdue[0]?.n ?? 0),
    callsToday: Number(callsTodayRow[0]?.n ?? 0),
    callsThisWeek: Number(callsWeekRow[0]?.n ?? 0),
    meetingsPlanned: Number(t?.meetings ?? 0),
    hotOpportunities: Number(t?.hot ?? 0),
    quotesSent: Number(t?.quotes ?? 0),
    overdueTasks: Number(tasksRow[0]?.overdue ?? 0),
    openTasks: Number(tasksRow[0]?.open ?? 0),
    wonCount: Number(t?.won ?? 0),
    wonAmount: Number(t?.wonAmount ?? 0),
    pipelineAmount: Number(t?.pipelineAmount ?? 0),
    byStatus: PROSPECT_STATUSES.map((status) => ({
      status,
      count: Number(statusMap.get(status)?.count ?? 0),
      amount: Number(statusMap.get(status)?.amount ?? 0),
    })),
  };
}

export type UserPerformance = {
  userId: string;
  name: string;
  color: string;
  prospects: number;
  activeProspects: number;
  hotProspects: number;
  callsToday: number;
  callsWeek: number;
  openTasks: number;
  overdueTasks: number;
  doneTasksToday: number;
  overdueReminders: number;
  won: number;
  pipelineAmount: number;
};

/** Performance par associé : alimente le dashboard et la vue Équipe. */
export async function getTeamPerformance(): Promise<UserPerformance[]> {
  const day = today();
  const startToday = startOfTodayMs();
  const startWeek = startToday - 6 * 86_400_000;

  const [team, prospectRows, callRows, taskRows, reminderRows] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, color: users.color })
      .from(users)
      .where(eq(users.active, true)),

    db
      .select({
        ownerId: prospects.ownerId,
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${prospects.status} in ('a_contacter','appele','a_relancer','interesse','rdv_pris','devis_envoye') then 1 else 0 end)`,
        hot: sql<number>`sum(case when ${prospects.status} in ('interesse','rdv_pris','devis_envoye') then 1 else 0 end)`,
        won: sql<number>`sum(case when ${prospects.status} = 'gagne' then 1 else 0 end)`,
        pipeline: sql<number>`coalesce(sum(case when ${prospects.status} in ('interesse','rdv_pris','devis_envoye') then ${prospects.estimatedAmount} else 0 end), 0)`,
      })
      .from(prospects)
      .groupBy(prospects.ownerId),

    db
      .select({
        userId: calls.userId,
        today: sql<number>`sum(case when ${calls.calledAt} >= ${startToday} then 1 else 0 end)`,
        week: sql<number>`count(*)`,
      })
      .from(calls)
      .where(gte(calls.calledAt, startWeek))
      .groupBy(calls.userId),

    db
      .select({
        assigneeId: tasks.assigneeId,
        open: sql<number>`sum(case when ${tasks.status} != 'termine' then 1 else 0 end)`,
        overdue: sql<number>`sum(case when ${tasks.status} != 'termine' and ${tasks.dueDate} < ${day} then 1 else 0 end)`,
        doneToday: sql<number>`sum(case when ${tasks.completedAt} >= ${startToday} then 1 else 0 end)`,
      })
      .from(tasks)
      .groupBy(tasks.assigneeId),

    db
      .select({ assigneeId: reminders.assigneeId, overdue: sql<number>`count(*)` })
      .from(reminders)
      .where(and(eq(reminders.status, "pending"), lt(reminders.dueDate, day)))
      .groupBy(reminders.assigneeId),
  ]);

  const p = new Map(prospectRows.map((r) => [r.ownerId, r]));
  const c = new Map(callRows.map((r) => [r.userId, r]));
  const t = new Map(taskRows.map((r) => [r.assigneeId, r]));
  const r = new Map(reminderRows.map((x) => [x.assigneeId, x]));

  return team
    .map((u) => ({
      userId: u.id,
      name: u.name,
      color: u.color,
      prospects: Number(p.get(u.id)?.total ?? 0),
      activeProspects: Number(p.get(u.id)?.active ?? 0),
      hotProspects: Number(p.get(u.id)?.hot ?? 0),
      callsToday: Number(c.get(u.id)?.today ?? 0),
      callsWeek: Number(c.get(u.id)?.week ?? 0),
      openTasks: Number(t.get(u.id)?.open ?? 0),
      overdueTasks: Number(t.get(u.id)?.overdue ?? 0),
      doneTasksToday: Number(t.get(u.id)?.doneToday ?? 0),
      overdueReminders: Number(r.get(u.id)?.overdue ?? 0),
      won: Number(p.get(u.id)?.won ?? 0),
      pipelineAmount: Number(p.get(u.id)?.pipeline ?? 0),
    }))
    .sort((a, b) => b.callsToday - a.callsToday || b.activeProspects - a.activeProspects);
}

/** Prospects chauds à suivre en priorité (affichés sur le dashboard et « Aujourd'hui »). */
export async function getHotProspects(ownerId?: string, limit = 8) {
  const clauses = [inArray(prospects.status, HOT_STATUSES)];
  if (ownerId) clauses.push(eq(prospects.ownerId, ownerId));

  return db
    .select({
      id: prospects.id,
      companyName: prospects.companyName,
      contactName: prospects.contactName,
      phone: prospects.phone,
      status: prospects.status,
      interest: prospects.interest,
      estimatedAmount: prospects.estimatedAmount,
      nextFollowUp: prospects.nextFollowUp,
      ownerName: users.name,
      ownerColor: users.color,
    })
    .from(prospects)
    .leftJoin(users, eq(users.id, prospects.ownerId))
    .where(and(...clauses))
    .orderBy(sql`${prospects.nextFollowUp} is null`, prospects.nextFollowUp)
    .limit(limit);
}

/** Prospects jamais contactés — la matière première du cold call. */
export async function countNeverContacted(ownerId?: string): Promise<number> {
  const clauses = [eq(prospects.status, "a_contacter")];
  if (ownerId) clauses.push(eq(prospects.ownerId, ownerId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(prospects)
    .where(and(...clauses));
  return row?.n ?? 0;
}
