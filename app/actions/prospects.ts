"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  INTEREST_LEVELS,
  PROSPECT_STATUSES,
  type InterestLevel,
  type ProspectStatus,
} from "@/lib/constants";
import { parseAmount } from "@/lib/utils";
import {
  createProspect,
  deleteProspect,
  setProspectStatus,
  updateProspect,
} from "@/services/prospects";

export type ActionState = { ok?: boolean; error?: string; id?: string };

const prospectSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire"),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.string().trim().email("Email invalide"), z.literal("")]).optional(),
  website: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  city: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
  interest: z.enum(INTEREST_LEVELS).optional(),
  ownerId: z.string().min(1, "Un responsable est obligatoire"),
  nextFollowUp: z.string().optional(),
  notes: z.string().optional(),
  estimatedAmount: z.string().optional(),
  identifiedNeed: z.string().trim().optional(),
});

function readForm(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return value === null ? undefined : String(value);
  };
  return {
    companyName: get("companyName") ?? "",
    contactName: get("contactName"),
    phone: get("phone"),
    email: get("email"),
    website: get("website"),
    sector: get("sector"),
    city: get("city"),
    source: get("source"),
    status: get("status") as ProspectStatus | undefined,
    interest: get("interest") as InterestLevel | undefined,
    ownerId: get("ownerId") ?? "",
    nextFollowUp: get("nextFollowUp"),
    notes: get("notes"),
    estimatedAmount: get("estimatedAmount"),
    identifiedNeed: get("identifiedNeed"),
  };
}

function revalidateAll(id?: string) {
  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/aujourdhui");
  revalidatePath("/cold-call");
  revalidatePath("/relances");
  revalidatePath("/equipe");
  if (id) revalidatePath(`/prospects/${id}`);
}

export async function createProspectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = prospectSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const d = parsed.data;
  const id = await createProspect(
    {
      ...d,
      email: d.email || null,
      estimatedAmount: parseAmount(d.estimatedAmount),
      nextFollowUp: d.nextFollowUp || null,
    },
    user.id,
  );

  revalidateAll(id);
  return { ok: true, id };
}

export async function updateProspectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Prospect introuvable" };

  const parsed = prospectSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const d = parsed.data;
  await updateProspect(
    id,
    {
      ...d,
      email: d.email || null,
      estimatedAmount: parseAmount(d.estimatedAmount),
      nextFollowUp: d.nextFollowUp || null,
    },
    user.id,
  );

  revalidateAll(id);
  return { ok: true, id };
}

/** Utilisé par le glisser-déposer du Kanban et le menu rapide de la fiche. */
export async function changeStatusAction(id: string, status: ProspectStatus): Promise<ActionState> {
  const user = await requireUser();
  if (!PROSPECT_STATUSES.includes(status)) return { error: "Statut inconnu" };

  await setProspectStatus(id, status, user.id);
  revalidateAll(id);
  return { ok: true };
}

export async function changeOwnerAction(id: string, ownerId: string): Promise<ActionState> {
  const user = await requireUser();
  await updateProspect(id, { ownerId }, user.id);
  revalidateAll(id);
  return { ok: true };
}

export async function changeInterestAction(
  id: string,
  interest: InterestLevel,
): Promise<ActionState> {
  const user = await requireUser();
  await updateProspect(id, { interest }, user.id);
  revalidateAll(id);
  return { ok: true };
}

export async function deleteProspectAction(id: string): Promise<ActionState> {
  await requireUser();
  await deleteProspect(id);
  revalidateAll();
  return { ok: true };
}
