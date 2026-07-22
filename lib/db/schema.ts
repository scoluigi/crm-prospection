import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type {
  ActivityType,
  CallOutcome,
  InterestLevel,
  ProspectStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
} from "@/lib/constants";

/**
 * Conventions :
 * - Les identifiants sont des UUID texte (générés côté application).
 * - Les horodatages complets sont stockés en epoch millisecondes (integer).
 * - Les dates « métier » sans heure (relance, deadline) sont stockées en texte ISO `YYYY-MM-DD`,
 *   ce qui évite tout décalage de fuseau horaire sur les comparaisons « aujourd'hui ».
 */

const now = sql`(unixepoch() * 1000)`;

// ---------------------------------------------------------------------------
// Utilisateurs (les 3 associés)
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("associe"),
  /** Couleur d'accent utilisée pour l'avatar et les graphiques d'équipe. */
  color: text("color").notNull().default("#6366f1"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull().default(now),
});

// ---------------------------------------------------------------------------
// Prospects
// ---------------------------------------------------------------------------

export const prospects = sqliteTable(
  "prospects",
  {
    id: text("id").primaryKey(),
    companyName: text("company_name").notNull(),
    contactName: text("contact_name"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    sector: text("sector"),
    city: text("city"),
    source: text("source"),
    status: text("status").$type<ProspectStatus>().notNull().default("a_contacter"),
    interest: text("interest").$type<InterestLevel>().notNull().default("inconnu"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    /** Date/heure du dernier appel ou échange enregistré (epoch ms). */
    lastContactAt: integer("last_contact_at"),
    /** Prochaine relance planifiée, format `YYYY-MM-DD`. Miroir de la relance en attente la plus proche. */
    nextFollowUp: text("next_follow_up"),
    notes: text("notes"),
    /** Montant estimé de la prestation, en euros. */
    estimatedAmount: real("estimated_amount"),
    /** Besoin identifié : « site vitrine », « refonte », « SEO »… */
    identifiedNeed: text("identified_need"),
    /** Clé de déduplication : téléphone normalisé + nom d'entreprise normalisé. */
    dedupeKey: text("dedupe_key"),
    createdAt: integer("created_at").notNull().default(now),
    updatedAt: integer("updated_at").notNull().default(now),
  },
  (t) => [
    index("prospects_status_idx").on(t.status),
    index("prospects_owner_idx").on(t.ownerId),
    index("prospects_follow_up_idx").on(t.nextFollowUp),
    index("prospects_dedupe_idx").on(t.dedupeKey),
  ],
);

// ---------------------------------------------------------------------------
// Tâches (todo quotidienne)
// ---------------------------------------------------------------------------

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    type: text("type").$type<TaskType>().notNull().default("autre"),
    priority: text("priority").$type<TaskPriority>().notNull().default("normale"),
    status: text("status").$type<TaskStatus>().notNull().default("a_faire"),
    /** Responsable de la tâche. `null` = tâche commune à l'équipe. */
    assigneeId: text("assignee_id").references(() => users.id),
    prospectId: text("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
    /** Échéance au format `YYYY-MM-DD`. */
    dueDate: text("due_date").notNull(),
    comment: text("comment"),
    createdById: text("created_by_id").references(() => users.id),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull().default(now),
    updatedAt: integer("updated_at").notNull().default(now),
  },
  (t) => [
    index("tasks_due_idx").on(t.dueDate),
    index("tasks_assignee_idx").on(t.assigneeId),
    index("tasks_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Appels (cold call & rappels)
// ---------------------------------------------------------------------------

export const calls = sqliteTable(
  "calls",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    outcome: text("outcome").$type<CallOutcome>().notNull(),
    notes: text("notes"),
    /** Durée de l'appel en minutes (saisie optionnelle). */
    durationMin: integer("duration_min"),
    calledAt: integer("called_at").notNull().default(now),
  },
  (t) => [index("calls_prospect_idx").on(t.prospectId), index("calls_date_idx").on(t.calledAt)],
);

// ---------------------------------------------------------------------------
// Relances
// ---------------------------------------------------------------------------

export const reminders = sqliteTable(
  "reminders",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id")
      .notNull()
      .references(() => users.id),
    /** Date prévue de la relance, format `YYYY-MM-DD`. */
    dueDate: text("due_date").notNull(),
    /** `pending` = à faire, `done` = effectuée, `cancelled` = annulée. */
    status: text("status").$type<"pending" | "done" | "cancelled">().notNull().default("pending"),
    channel: text("channel").$type<"appel" | "email" | "sms" | "autre">().notNull().default("appel"),
    note: text("note"),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [
    index("reminders_due_idx").on(t.dueDate),
    index("reminders_status_idx").on(t.status),
    index("reminders_prospect_idx").on(t.prospectId),
  ],
);

// ---------------------------------------------------------------------------
// Notes internes
// ---------------------------------------------------------------------------

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [index("notes_prospect_idx").on(t.prospectId)],
);

// ---------------------------------------------------------------------------
// Journal d'activité
// ---------------------------------------------------------------------------

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<ActivityType>().notNull(),
    userId: text("user_id").references(() => users.id),
    prospectId: text("prospect_id").references(() => prospects.id, { onDelete: "cascade" }),
    /** Description lisible, déjà formatée pour l'affichage. */
    message: text("message").notNull(),
    /** Détails structurés optionnels, sérialisés en JSON. */
    meta: text("meta"),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => [
    index("activity_prospect_idx").on(t.prospectId),
    index("activity_date_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Types inférés
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
