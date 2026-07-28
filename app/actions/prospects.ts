"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PROSPECT_STATUSES, type ProspectStatus } from "@/lib/constants";
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
  source: z.string().trim().optional(),
  status: z.enum(PROSPECT_STATUSES).optional(),
  ownerId: z.string().min(1, "Un responsable est obligatoire"),
  relance1: z.string().optional(),
  relance2: z.string().optional(),
  relance3: z.string().optional(),
  notes: z.string().optional(),
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
    source: get("source"),
    status: get("status") as ProspectStatus | undefined,
    ownerId: get("ownerId") ?? "",
    relance1: get("relance1"),
    relance2: get("relance2"),
    relance3: get("relance3"),
    notes: get("notes"),
  };
}

function revalidateAll(id?: string) {
  revalidatePath("/");
  revalidatePath("/classement");
  if (id) revalidatePath(`/prospects/${id}`);
}

export async function createProspectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = prospectSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const id = await createProspect(parsed.data, user.id);
  revalidateAll(id);
  return { ok: true, id };
}

export async function updateProspectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Lead introuvable" };

  const parsed = prospectSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  await updateProspect(id, parsed.data, user.id);
  revalidateAll(id);
  return { ok: true, id };
}

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

export async function deleteProspectAction(id: string): Promise<ActionState> {
  await requireUser();
  await deleteProspect(id);
  revalidateAll();
  return { ok: true };
}
