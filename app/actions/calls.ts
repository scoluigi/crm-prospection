"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { CALL_OUTCOMES } from "@/lib/constants";
import { logCall } from "@/services/calls";
import type { ActionState } from "./prospects";

const callSchema = z.object({
  prospectId: z.string().min(1),
  outcome: z.enum(CALL_OUTCOMES).optional(),
  notes: z.string().optional(),
});

/** Enregistre un appel depuis une fiche lead (résultat optionnel). */
export async function logCallAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = callSchema.safeParse({
    prospectId: String(formData.get("prospectId") ?? ""),
    outcome: formData.get("outcome") ? String(formData.get("outcome")) : undefined,
    notes: formData.get("notes") ? String(formData.get("notes")) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Appel invalide" };

  const d = parsed.data;
  await logCall({
    userId: user.id,
    prospectId: d.prospectId,
    outcome: d.outcome ?? null,
    notes: d.notes || null,
  });

  revalidatePath("/");
  revalidatePath("/classement");
  revalidatePath(`/prospects/${d.prospectId}`);
  return { ok: true };
}
