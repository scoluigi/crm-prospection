"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { ColumnMapping } from "@/lib/import-mapping";
import {
  analyzeImport,
  commitImport,
  type ImportAnalysis,
  type ImportResult,
  type RawRow,
} from "@/services/import";

/** Limite de sécurité : au-delà, le fichier doit être découpé. */
const MAX_ROWS = 5000;

export async function analyzeImportAction(
  rows: RawRow[],
  mapping: ColumnMapping,
): Promise<{ ok: true; analysis: ImportAnalysis } | { ok: false; error: string }> {
  await requireUser();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `Fichier trop volumineux (max ${MAX_ROWS} lignes).` };
  }
  if (!Object.values(mapping).includes("companyName")) {
    return { ok: false, error: "Associe une colonne au champ « Nom de l'entreprise »." };
  }

  return { ok: true, analysis: await analyzeImport(rows, mapping) };
}

export async function commitImportAction(
  rows: RawRow[],
  mapping: ColumnMapping,
  options: { defaultOwnerId: string; updateDuplicates: boolean },
): Promise<{ ok: true; result: ImportResult } | { ok: false; error: string }> {
  const user = await requireUser();

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "Aucune ligne à importer." };
  }
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `Fichier trop volumineux (max ${MAX_ROWS} lignes).` };
  }

  const result = await commitImport(rows, mapping, {
    actorId: user.id,
    defaultOwnerId: options.defaultOwnerId || user.id,
    updateDuplicates: Boolean(options.updateDuplicates),
  });

  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/cold-call");
  revalidatePath("/equipe");

  return { ok: true, result };
}
