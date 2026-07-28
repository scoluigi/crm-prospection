import { sql } from "drizzle-orm";
import { bigint, boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";
import type { ActivityType, CallOutcome, ProspectStatus, UserRole } from "@/lib/constants";

/** Horodatage epoch en millisecondes : dépasse int32, doit être un bigint en PostgreSQL. */
const ts = (name: string) => bigint(name, { mode: "number" });
const now = sql`(extract(epoch from now()) * 1000)::bigint`;

// Utilisateurs (les associés)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("associe"),
  color: text("color").notNull().default("#6366f1"),
  active: boolean("active").notNull().default(true),
  createdAt: ts("created_at").notNull().default(now),
});

// Leads / prospects — volontairement minimaliste
export const prospects = pgTable(
  "prospects",
  {
    id: text("id").primaryKey(),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name"),
    phone: text("phone"),
    /** Où le lead a été trouvé : Google Maps, LinkedIn, recommandation… */
    source: text("source"),
    status: text("status").$type<ProspectStatus>().notNull().default("a_contacter"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    /** Dernier appel enregistré (epoch ms). */
    lastContactAt: ts("last_contact_at"),
    /** Trois dates de relance successives, format `YYYY-MM-DD`. */
    relance1: text("relance1"),
    relance2: text("relance2"),
    relance3: text("relance3"),
    /** Miroir de la prochaine relance à venir (calculé à l'enregistrement) — sert au tri. */
    nextFollowUp: text("next_follow_up"),
    notes: text("notes"),
    /** Clé de déduplication : téléphone + nom d'entreprise normalisés. */
    dedupeKey: text("dedupe_key"),
    createdAt: ts("created_at").notNull().default(now),
    updatedAt: ts("updated_at").notNull().default(now),
  },
  (t) => [
    index("prospects_status_idx").on(t.status),
    index("prospects_owner_idx").on(t.ownerId),
    index("prospects_follow_up_idx").on(t.nextFollowUp),
    index("prospects_dedupe_idx").on(t.dedupeKey),
  ],
);

// Appels — un appel peut être « solo » (pointage sans lead précis)
export const calls = pgTable(
  "calls",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    outcome: text("outcome").$type<CallOutcome>(),
    notes: text("notes"),
    calledAt: ts("called_at").notNull().default(now),
  },
  (t) => [
    index("calls_user_idx").on(t.userId),
    index("calls_date_idx").on(t.calledAt),
    index("calls_prospect_idx").on(t.prospectId),
  ],
);

// Sessions de prospection (pointeuse) — présence + durée
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    startedAt: ts("started_at").notNull().default(now),
    /** `null` = session en cours (personne « en ligne »). */
    endedAt: ts("ended_at"),
    /** Nombre d'appels saisi au pointage de sortie. */
    callsCount: integer("calls_count"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_started_idx").on(t.startedAt)],
);

// Journal d'activité (historique d'un lead)
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<ActivityType>().notNull(),
    userId: text("user_id").references(() => users.id),
    prospectId: text("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    meta: text("meta"),
    createdAt: ts("created_at").notNull().default(now),
  },
  (t) => [index("activity_prospect_idx").on(t.prospectId), index("activity_date_idx").on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
