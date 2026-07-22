import { desc, eq } from "drizzle-orm";
import { db, activityLogs, users } from "@/lib/db";
import type { ActivityType } from "@/lib/constants";
import { uid } from "@/lib/utils";

/**
 * Journalise une action importante.
 * Toute mutation métier passe par ici : c'est ce qui alimente la timeline
 * des fiches prospect et la vue Équipe.
 */
export function logActivity(input: {
  type: ActivityType;
  message: string;
  userId?: string | null;
  prospectId?: string | null;
  meta?: Record<string, unknown>;
}): void {
  db.insert(activityLogs)
    .values({
      id: uid(),
      type: input.type,
      message: input.message,
      userId: input.userId ?? null,
      prospectId: input.prospectId ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
      createdAt: Date.now(),
    })
    .run();
}

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: number;
  userName: string | null;
  userColor: string | null;
  prospectId: string | null;
};

export async function getProspectActivity(prospectId: string): Promise<ActivityEntry[]> {
  const rows = await db
    .select({
      id: activityLogs.id,
      type: activityLogs.type,
      message: activityLogs.message,
      createdAt: activityLogs.createdAt,
      prospectId: activityLogs.prospectId,
      userName: users.name,
      userColor: users.color,
    })
    .from(activityLogs)
    .leftJoin(users, eq(users.id, activityLogs.userId))
    .where(eq(activityLogs.prospectId, prospectId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  return rows;
}

export async function getRecentActivity(limit = 25): Promise<ActivityEntry[]> {
  return db
    .select({
      id: activityLogs.id,
      type: activityLogs.type,
      message: activityLogs.message,
      createdAt: activityLogs.createdAt,
      prospectId: activityLogs.prospectId,
      userName: users.name,
      userColor: users.color,
    })
    .from(activityLogs)
    .leftJoin(users, eq(users.id, activityLogs.userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
