import { gte, sql } from "drizzle-orm";
import { db, sessions } from "@/lib/db";
import { startOfTodayMs } from "@/lib/utils";
import { getTeam } from "./users";

export type LeaderRow = {
  userId: string;
  name: string;
  color: string;
  callsToday: number;
  callsWeek: number;
  /** Session en cours : minutes écoulées, ou null si l'associé n'est pas « en ligne ». */
  activeMinutes: number | null;
};

const WEEK_MS = 7 * 86_400_000;

async function reportedByUserSince(since: number): Promise<Map<string, number>> {
  const rows = await db
    .select({ userId: sessions.userId, n: sql<number>`coalesce(sum(${sessions.callsCount}), 0)::int` })
    .from(sessions)
    .where(gte(sessions.startedAt, since))
    .groupBy(sessions.userId);
  return new Map(rows.map((r) => [r.userId, Number(r.n)]));
}

/** Classement des associés : appels déclarés du jour, de la semaine, et présence en cours. */
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const [team, today, week, active] = await Promise.all([
    getTeam(),
    reportedByUserSince(startOfTodayMs()),
    reportedByUserSince(Date.now() - WEEK_MS),
    db
      .select({ userId: sessions.userId, startedAt: sessions.startedAt })
      .from(sessions)
      .where(sql`${sessions.endedAt} is null`),
  ]);

  const activeByUser = new Map(active.map((s) => [s.userId, Number(s.startedAt)]));
  const now = Date.now();

  return team
    .map((m) => {
      const startedAt = activeByUser.get(m.id);
      return {
        userId: m.id,
        name: m.name,
        color: m.color,
        callsToday: today.get(m.id) ?? 0,
        callsWeek: week.get(m.id) ?? 0,
        activeMinutes: startedAt ? Math.max(0, Math.round((now - startedAt) / 60000)) : null,
      };
    })
    .sort((a, b) => b.callsToday - a.callsToday || b.callsWeek - a.callsWeek);
}
