import { db, prospects } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  parseDateLoose,
  parseStatus,
  type ColumnMapping,
  type ImportFieldKey,
} from "@/lib/import-mapping";
import { buildDedupeKey, normalize, parseAmount, uid } from "@/lib/utils";
import { getAllDedupeKeys } from "./prospects";
import { getTeam } from "./users";
import { logActivity } from "./activity";

export type RawRow = Record<string, string>;

export type RowVerdict = "nouveau" | "doublon" | "incomplet";

export type AnalyzedRow = {
  index: number;
  verdict: RowVerdict;
  /** Raison affichée à l'utilisateur quand la ligne pose problème. */
  reason?: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  sector: string | null;
  status: string;
  ownerName: string | null;
  estimatedAmount: number | null;
  /** Nom du prospect déjà en base qui provoque le doublon. */
  duplicateOf?: string;
};

export type ImportAnalysis = {
  rows: AnalyzedRow[];
  counts: Record<RowVerdict, number>;
  /** Noms d'associés présents dans le fichier mais absents du CRM. */
  unknownOwners: string[];
};

type NormalizedRow = {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  sector: string | null;
  city: string | null;
  source: string | null;
  status: ReturnType<typeof parseStatus>;
  ownerName: string | null;
  estimatedAmount: number | null;
  identifiedNeed: string | null;
  nextFollowUp: string | null;
  notes: string | null;
};

function pick(row: RawRow, mapping: ColumnMapping, field: ImportFieldKey): string | null {
  for (const [column, target] of Object.entries(mapping)) {
    if (target === field) {
      const value = row[column]?.trim();
      if (value) return value;
    }
  }
  return null;
}

function normalizeRow(row: RawRow, mapping: ColumnMapping): NormalizedRow {
  return {
    companyName: pick(row, mapping, "companyName") ?? "",
    contactName: pick(row, mapping, "contactName"),
    phone: pick(row, mapping, "phone"),
    email: pick(row, mapping, "email"),
    website: pick(row, mapping, "website"),
    sector: pick(row, mapping, "sector"),
    city: pick(row, mapping, "city"),
    source: pick(row, mapping, "source"),
    status: parseStatus(pick(row, mapping, "status")),
    ownerName: pick(row, mapping, "ownerName"),
    estimatedAmount: parseAmount(pick(row, mapping, "estimatedAmount")),
    identifiedNeed: pick(row, mapping, "identifiedNeed"),
    nextFollowUp: parseDateLoose(pick(row, mapping, "nextFollowUp")),
    notes: pick(row, mapping, "notes"),
  };
}

/**
 * Analyse le fichier sans rien écrire : c'est l'aperçu affiché avant validation.
 * Détecte les doublons contre la base ET à l'intérieur du fichier lui-même.
 */
export async function analyzeImport(
  rows: RawRow[],
  mapping: ColumnMapping,
): Promise<ImportAnalysis> {
  const existingKeys = await getAllDedupeKeys();
  const team = await getTeam();
  const teamByName = new Map(team.map((u) => [normalize(u.name), u]));

  const seenInFile = new Map<string, string>();
  const unknownOwners = new Set<string>();
  const analyzed: AnalyzedRow[] = [];
  const counts: Record<RowVerdict, number> = { nouveau: 0, doublon: 0, incomplet: 0 };

  rows.forEach((raw, index) => {
    const r = normalizeRow(raw, mapping);

    let verdict: RowVerdict = "nouveau";
    let reason: string | undefined;
    let duplicateOf: string | undefined;

    if (!r.companyName) {
      verdict = "incomplet";
      reason = "Nom d'entreprise manquant";
    } else {
      const key = buildDedupeKey(r.companyName, r.phone);
      const existing = existingKeys.get(key);
      const inFile = seenInFile.get(key);

      if (existing) {
        verdict = "doublon";
        reason = "Déjà présent dans le CRM";
        duplicateOf = existing;
      } else if (inFile) {
        verdict = "doublon";
        reason = "Ligne en double dans le fichier";
        duplicateOf = inFile;
      } else {
        seenInFile.set(key, r.companyName);
        if (!r.phone && !r.email) {
          reason = "Ni téléphone ni email — le prospect sera créé mais non appelable";
        }
      }
    }

    if (r.ownerName && !teamByName.has(normalize(r.ownerName))) {
      unknownOwners.add(r.ownerName);
    }

    counts[verdict]++;
    analyzed.push({
      index,
      verdict,
      reason,
      duplicateOf,
      companyName: r.companyName || "(vide)",
      contactName: r.contactName,
      phone: r.phone,
      email: r.email,
      city: r.city,
      sector: r.sector,
      status: r.status ?? "a_contacter",
      ownerName: r.ownerName,
      estimatedAmount: r.estimatedAmount,
    });
  });

  return { rows: analyzed, counts, unknownOwners: [...unknownOwners] };
}

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
};

/**
 * Applique l'import.
 * - Les lignes incomplètes sont toujours ignorées.
 * - Les doublons sont ignorés, sauf si `updateDuplicates` est activé (mise à jour
 *   des champs vides uniquement, pour ne jamais écraser une saisie manuelle).
 */
export async function commitImport(
  rows: RawRow[],
  mapping: ColumnMapping,
  options: {
    actorId: string;
    /** Associé attribué aux lignes sans responsable identifiable. */
    defaultOwnerId: string;
    updateDuplicates: boolean;
  },
): Promise<ImportResult> {
  const existingKeys = await getAllDedupeKeys();
  const team = await getTeam();
  const teamByName = new Map(team.map((u) => [normalize(u.name), u]));

  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };
  const seenInFile = new Set<string>();
  const ts = Date.now();

  for (const raw of rows) {
    const r = normalizeRow(raw, mapping);
    if (!r.companyName) {
      result.skipped++;
      continue;
    }

    const key = buildDedupeKey(r.companyName, r.phone);
    const ownerId = r.ownerName
      ? (teamByName.get(normalize(r.ownerName))?.id ?? options.defaultOwnerId)
      : options.defaultOwnerId;

    if (existingKeys.has(key) || seenInFile.has(key)) {
      if (!options.updateDuplicates || seenInFile.has(key)) {
        result.skipped++;
        continue;
      }

      const [existing] = await db
        .select()
        .from(prospects)
        .where(eq(prospects.dedupeKey, key))
        .limit(1);

      if (!existing) {
        result.skipped++;
        continue;
      }

      // On ne complète que les champs vides : la donnée saisie dans le CRM fait foi.
      const patch: Record<string, unknown> = {};
      const fillable: [keyof typeof existing, string | number | null][] = [
        ["contactName", r.contactName],
        ["phone", r.phone],
        ["email", r.email],
        ["website", r.website],
        ["sector", r.sector],
        ["city", r.city],
        ["source", r.source],
        ["estimatedAmount", r.estimatedAmount],
        ["identifiedNeed", r.identifiedNeed],
        ["notes", r.notes],
      ];
      for (const [field, value] of fillable) {
        if (value !== null && value !== "" && !existing[field as keyof typeof existing]) patch[field as keyof typeof patch] = value;
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = ts;
        await db.update(prospects).set(patch).where(eq(prospects.id, existing.id));
        result.updated++;
      } else {
        result.skipped++;
      }
      continue;
    }

    seenInFile.add(key);

    await db.insert(prospects).values({
      id: uid(),
      companyName: r.companyName,
      contactName: r.contactName,
      phone: r.phone,
      email: r.email,
      website: r.website,
      sector: r.sector,
      city: r.city,
      source: r.source ?? "Import",
      status: r.status ?? "a_contacter",
      interest: "inconnu",
      ownerId,
      nextFollowUp: r.nextFollowUp,
      notes: r.notes,
      estimatedAmount: r.estimatedAmount,
      identifiedNeed: r.identifiedNeed,
      dedupeKey: key,
      createdAt: ts,
      updatedAt: ts,
    });

    result.created++;
  }

  logActivity({
    type: "import_csv",
    message: `Import : ${result.created} créés, ${result.updated} complétés, ${result.skipped} ignorés`,
    userId: options.actorId,
  });

  return result;
}
