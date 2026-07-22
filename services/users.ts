import { asc, eq } from "drizzle-orm";
import { db, users, type User } from "@/lib/db";

export type TeamMember = Pick<User, "id" | "name" | "email" | "color" | "role" | "active">;

export async function getTeam(): Promise<TeamMember[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      color: users.color,
      role: users.role,
      active: users.active,
    })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name));
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return user;
}
