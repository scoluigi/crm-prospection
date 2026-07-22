"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { CALL_OUTCOMES } from "@/lib/constants";
import { logCall } from "@/services/calls";
import type { ActionState } from "./prospects";

const callSchema = z.object({
  prospectId: z.string().min(1),
  outcome: z.enum(CALL_OUTCOMES),
  notes: z.string().optional(),
  nextFollowUp: z.string().optional(),
  durationMin: z.string().optional(),
});

/**
 * Enregistre un appel. Point d'entrée unique utilisé par le module Cold Call
 * et par la fiche prospect.
 */
export async function logCallAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = callSchema.safeParse({
    prospectId: String(formData.get("prospectId") ?? ""),
    outcome: String(formData.get("outcome") ?? ""),
    notes: formData.get("notes") ? String(formData.get("notes")) : undefined,
    nextFollowUp: formData.get("nextFollowUp") ? String(formData.get("nextFollowUp")) : undefined,
    durationMin: formData.get("durationMin") ? String(formData.get("durationMin")) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Résultat d'appel invalide" };
  }

  const d = parsed.data;
  const duration = d.durationMin ? Number.parseInt(d.durationMin, 10) : null;

  await logCall({
    prospectId: d.prospectId,
    userId: user.id,
    outcome: d.outcome,
    notes: d.notes || null,
    durationMin: Number.isFinite(duration) ? duration : null,
    nextFollowUp: d.nextFollowUp || null,
  });

  revalidatePath("/");
  revalidatePath("/cold-call");
  revalidatePath("/relances");
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/aujourdhui");
  revalidatePath("/equipe");
  revalidatePath(`/prospects/${d.prospectId}`);

  return { ok: true };
}
