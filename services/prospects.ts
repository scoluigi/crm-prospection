import { and, asc, desc, eq, isNotNull, isNull, like, lt, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, prospects, users, type Prospect } from "@/lib/db";
import { ACTIVE_STATUSES, STATUS_LABELS, type ProspectStatus } from "@/lib/constants";
import { buildDedupeKey, today, uid } from "@/lib/utils";
import { logActivity } from "./activity";

export type ProspectWithOwner = Prospect & {
  ownerName: string | null;
  ownerColor: string | null;
};

const withOwnerColumns = {
  id: prospects.id,
  companyName: prospects.companyName,
  contactName: prospects.contactName,
  phone: prospects.phone,
  source: prospects.source,
  status: prospects.status,
  ownerId: prospects.ownerId,
  lastContactAt: prospects.lastContactAt,
  relance1: prospects.relance1,
  relance2: prospects.relance2,
  relance3: prospects.relance3,
  nextFollowUp: prospects.nextFollowUp,
  notes: prospects.notes,
  dedupeKey: prospects.dedupeKey,
  createdAt: prospects.createdAt,
  updatedAt: prospects.updatedAt,
  ownerName: users.name,
  ownerColor: users.color,
};

/** Prochaine relance à venir (ou la plus récente en retard) parmi les trois dates. */
export function computeNextFollowUp(
  r1?: string | null,
  r2?: string | null,
  r3?: string | null,
): string | null {
  const dates = [r1, r2, r3].filter((d): d is string => Boolean(d)).sort();
  if (dates.length === 0) return null;
  const day = today();
  const upcoming = dates.find((d) => d >= day);
  return upcoming ?? dates[dates.length - 1];
}

// Filtres & recherche

export type ProspectFilters = {
  q?: string;
  status?: string;
  ownerId?: string;
  due?: "overdue" | "today" | "week" | "none" | "all";
  sort?: "recent" | "relance" | "entreprise";
};

function buildWhere(filters: ProspectFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim().toLowerCase()}%`;
    const search = or(
      like(sql`lower(${prospects.companyName})`, term),
      like(sql`lower(coalesce(${prospects.contactName}, ''))`, term),
      like(sql`coalesce(${prospects.phone}, '')`, term),
      like(sql`lower(coalesce(${prospects.source}, ''))`, term),
    );
    if (search) clauses.push(search);
  }

  if (filters.status && filters.status !== "all") {
    if (filters.status === "actifs") {
      clauses.push(sql`${prospects.status} in ${ACTIVE_STATUSES}`);
    } else {
      clauses.push(eq(prospects.status, filters.status as ProspectStatus));
    }
  }

  if (filters.ownerId && filters.ownerId !== "all") {
    clauses.push(eq(prospects.ownerId, filters.ownerId));
  }

  const day = today();
  switch (filters.due) {
    case "overdue":
      clauses.push(and(isNotNull(prospects.nextFollowUp), lt(prospects.nextFollowUp, day))!);
      break;
    case "today":
      clauses.push(eq(prospects.nextFollowUp, day));
      break;
    case "week": {
      const in7 = new Date();
      in7.setDate(in7.getDate() + 7);
      const limit = in7.toISOString().slice(0, 10);
      clauses.push(and(isNotNull(prospects.nextFollowUp), lte(prospects.nextFollowUp, limit))!);
      break;
    }
    case "none":
      clauses.push(isNull(prospects.nextFollowUp));
      break;
  }

  return clauses.length ? and(...clauses) : undefined;
}

function buildOrder(sort: ProspectFilters["sort"]) {
  switch (sort) {
    case "relance":
      return [sql`${prospects.nextFollowUp} is null`, asc(prospects.nextFollowUp)];
    case "entreprise":
      return [asc(prospects.companyName)];
    default:
      return [desc(prospects.updatedAt)];
  }
}

export async function listProspects(filters: ProspectFilters = {}): Promise<ProspectWithOwner[]> {
  return db
    .select(withOwnerColumns)
    .from(prospects)
    .leftJoin(users, eq(users.id, prospects.ownerId))
    .where(buildWhere(filters))
    .orderBy(...buildOrder(filters.sort))
    .limit(500);
}

export async function getProspect(id: string): Promise<ProspectWithOwner | undefined> {
  const [row] = await db
    .select(withOwnerColumns)
    .from(prospects)
    .leftJoin(users, eq(users.id, prospects.ownerId))
    .where(eq(prospects.id, id))
    .limit(1);
  return row;
}

// Écriture

export type ProspectInput = {
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: ProspectStatus;
  ownerId: string;
  relance1?: string | null;
  relance2?: string | null;
  relance3?: string | null;
  notes?: string | null;
};

export async function createProspect(input: ProspectInput, actorId: string): Promise<string> {
  const id = uid();
  const now = Date.now();

  await db.insert(prospects).values({
    id,
    companyName: input.companyName.trim(),
    contactName: input.contactName || null,
    phone: input.phone || null,
    source: input.source || null,
    status: input.status ?? "a_contacter",
    ownerId: input.ownerId,
    relance1: input.relance1 || null,
    relance2: input.relance2 || null,
    relance3: input.relance3 || null,
    nextFollowUp: computeNextFollowUp(input.relance1, input.relance2, input.relance3),
    notes: input.notes || null,
    dedupeKey: buildDedupeKey(input.companyName, input.phone),
    createdAt: now,
    updatedAt: now,
  });

  logActivity({
    type: "prospect_cree",
    message: `Lead « ${input.companyName.trim()} » créé`,
    userId: actorId,
    prospectId: id,
  });

  return id;
}

export async function updateProspect(
  id: string,
  input: Partial<ProspectInput>,
  actorId: string,
): Promise<void> {
  const before = await getProspect(id);
  if (!before) throw new Error("Lead introuvable");

  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    patch[key] = value === "" ? null : value;
  }

  // Recalcule la prochaine relance si une des dates change.
  if (input.relance1 !== undefined || input.relance2 !== undefined || input.relance3 !== undefined) {
    patch.nextFollowUp = computeNextFollowUp(
      input.relance1 !== undefined ? input.relance1 : before.relance1,
      input.relance2 !== undefined ? input.relance2 : before.relance2,
      input.relance3 !== undefined ? input.relance3 : before.relance3,
    );
  }

  if (input.companyName !== undefined || input.phone !== undefined) {
    patch.dedupeKey = buildDedupeKey(
      (input.companyName ?? before.companyName) as string,
      (input.phone ?? before.phone) as string | null,
    );
  }

  await db.update(prospects).set(patch).where(eq(prospects.id, id));

  if (input.status && input.status !== before.status) {
    logActivity({
      type: "statut_change",
      message: `Statut : ${STATUS_LABELS[before.status]} → ${STATUS_LABELS[input.status]}`,
      userId: actorId,
      prospectId: id,
    });
  }

  if (input.ownerId && input.ownerId !== before.ownerId) {
    const [newOwner] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, input.ownerId))
      .limit(1);
    logActivity({
      type: "responsable_change",
      message: `Responsable : ${before.ownerName ?? "—"} → ${newOwner?.name ?? "—"}`,
      userId: actorId,
      prospectId: id,
    });
  }
}

export async function setProspectStatus(
  id: string,
  status: ProspectStatus,
  actorId: string,
): Promise<void> {
  await updateProspect(id, { status }, actorId);
}

export async function deleteProspect(id: string): Promise<void> {
  await db.delete(prospects).where(eq(prospects.id, id));
}
