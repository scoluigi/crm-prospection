import { and, asc, desc, eq, inArray, isNotNull, isNull, like, lt, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, prospects, users, type Prospect } from "@/lib/db";
import {
  ACTIVE_STATUSES,
  STATUS_LABELS,
  type InterestLevel,
  type ProspectStatus,
} from "@/lib/constants";
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
  email: prospects.email,
  website: prospects.website,
  sector: prospects.sector,
  city: prospects.city,
  source: prospects.source,
  status: prospects.status,
  interest: prospects.interest,
  ownerId: prospects.ownerId,
  lastContactAt: prospects.lastContactAt,
  nextFollowUp: prospects.nextFollowUp,
  notes: prospects.notes,
  estimatedAmount: prospects.estimatedAmount,
  identifiedNeed: prospects.identifiedNeed,
  dedupeKey: prospects.dedupeKey,
  createdAt: prospects.createdAt,
  updatedAt: prospects.updatedAt,
  ownerName: users.name,
  ownerColor: users.color,
};

// ---------------------------------------------------------------------------
// Filtres & recherche
// ---------------------------------------------------------------------------

export type ProspectFilters = {
  /** Recherche libre sur entreprise, contact, téléphone, email. */
  q?: string;
  status?: string;
  ownerId?: string;
  interest?: string;
  city?: string;
  sector?: string;
  /** Filtre sur la prochaine relance. */
  due?: "overdue" | "today" | "week" | "none" | "all";
  sort?: "recent" | "relance" | "montant" | "entreprise";
};

function buildWhere(filters: ProspectFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim().toLowerCase()}%`;
    const search = or(
      like(sql`lower(${prospects.companyName})`, term),
      like(sql`lower(coalesce(${prospects.contactName}, ''))`, term),
      like(sql`coalesce(${prospects.phone}, '')`, term),
      like(sql`lower(coalesce(${prospects.email}, ''))`, term),
      like(sql`lower(coalesce(${prospects.city}, ''))`, term),
    );
    if (search) clauses.push(search);
  }

  if (filters.status && filters.status !== "all") {
    if (filters.status === "actifs") {
      clauses.push(inArray(prospects.status, ACTIVE_STATUSES));
    } else {
      clauses.push(eq(prospects.status, filters.status as ProspectStatus));
    }
  }

  if (filters.ownerId && filters.ownerId !== "all") {
    clauses.push(eq(prospects.ownerId, filters.ownerId));
  }

  if (filters.interest && filters.interest !== "all") {
    clauses.push(eq(prospects.interest, filters.interest as InterestLevel));
  }

  if (filters.city && filters.city !== "all") {
    clauses.push(eq(prospects.city, filters.city));
  }

  if (filters.sector && filters.sector !== "all") {
    clauses.push(eq(prospects.sector, filters.sector));
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

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

function buildOrder(sort: ProspectFilters["sort"]) {
  switch (sort) {
    case "relance":
      // Les prospects sans relance planifiée passent en dernier.
      return [sql`${prospects.nextFollowUp} is null`, asc(prospects.nextFollowUp)];
    case "montant":
      return [desc(prospects.estimatedAmount)];
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

export async function countProspects(filters: ProspectFilters = {}): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(prospects)
    .where(buildWhere(filters));
  return row?.n ?? 0;
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

/** Valeurs distinctes de villes et secteurs, pour alimenter les filtres. */
export async function getFilterOptions(): Promise<{ cities: string[]; sectors: string[] }> {
  const cityRows = await db
    .selectDistinct({ v: prospects.city })
    .from(prospects)
    .where(isNotNull(prospects.city))
    .orderBy(asc(prospects.city));
  const sectorRows = await db
    .selectDistinct({ v: prospects.sector })
    .from(prospects)
    .where(isNotNull(prospects.sector))
    .orderBy(asc(prospects.sector));

  return {
    cities: cityRows.map((r: any) => r.v).filter((v: any): v is string => Boolean(v)),
    sectors: sectorRows.map((r: any) => r.v).filter((v: any): v is string => Boolean(v)),
  };
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

export type ProspectInput = {
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  sector?: string | null;
  city?: string | null;
  source?: string | null;
  status?: ProspectStatus;
  interest?: InterestLevel;
  ownerId: string;
  nextFollowUp?: string | null;
  notes?: string | null;
  estimatedAmount?: number | null;
  identifiedNeed?: string | null;
};

export async function createProspect(input: ProspectInput, actorId: string): Promise<string> {
  const id = uid();
  const ts = Date.now();

  await db.insert(prospects).values({
    id,
    companyName: input.companyName.trim(),
    contactName: input.contactName || null,
    phone: input.phone || null,
    email: input.email || null,
    website: input.website || null,
    sector: input.sector || null,
    city: input.city || null,
    source: input.source || null,
    status: input.status ?? "a_contacter",
    interest: input.interest ?? "inconnu",
    ownerId: input.ownerId,
    nextFollowUp: input.nextFollowUp || null,
    notes: input.notes || null,
    estimatedAmount: input.estimatedAmount ?? null,
    identifiedNeed: input.identifiedNeed || null,
    dedupeKey: buildDedupeKey(input.companyName, input.phone),
    createdAt: ts,
    updatedAt: ts,
  });

  logActivity({
    type: "prospect_cree",
    message: `Prospect « ${input.companyName.trim()} » créé`,
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
  if (!before) throw new Error("Prospect introuvable");

  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    patch[key] = value === "" ? null : value;
  }

  // La clé de dédoublonnage suit le téléphone et le nom.
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
      meta: { from: before.status, to: input.status },
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

/**
 * Recherche un prospect existant à partir de sa clé de dédoublonnage.
 * Utilisé par l'import CSV pour ne jamais créer de doublon.
 */
export async function findByDedupeKey(key: string): Promise<Prospect | undefined> {
  const [row] = await db.select().from(prospects).where(eq(prospects.dedupeKey, key)).limit(1);
  return row;
}

export async function getAllDedupeKeys(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: prospects.id, key: prospects.dedupeKey, name: prospects.companyName })
    .from(prospects);
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.key) map.set(r.key, r.name);
  }
  return map;
}

/** File d'attente du module Cold Call : jamais appelés ou à rappeler, triés par urgence. */
export async function getCallQueue(ownerId?: string): Promise<ProspectWithOwner[]> {
  const clauses: SQL[] = [
    inArray(prospects.status, ["a_contacter", "appele", "a_relancer"] as ProspectStatus[]),
  ];
  if (ownerId) clauses.push(eq(prospects.ownerId, ownerId));

  return db
    .select(withOwnerColumns)
    .from(prospects)
    .leftJoin(users, eq(users.id, prospects.ownerId))
    .where(and(...clauses))
    .orderBy(
      // Jamais contactés d'abord, puis relances les plus anciennes.
      sql`${prospects.lastContactAt} is not null`,
      sql`${prospects.nextFollowUp} is null`,
      asc(prospects.nextFollowUp),
      asc(prospects.createdAt),
    )
    .limit(200);
}
