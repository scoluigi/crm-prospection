"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addNote, deleteNote } from "@/services/notes";
import type { ActionState } from "./prospects";

export async function addNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const prospectId = String(formData.get("prospectId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!prospectId) return { error: "Prospect introuvable" };
  if (!content) return { error: "La note est vide" };

  await addNote(prospectId, user.id, content);
  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true };
}

export async function deleteNoteAction(id: string, prospectId: string): Promise<ActionState> {
  await requireUser();
  await deleteNote(id);
  revalidatePath(`/prospects/${prospectId}`);
  return { ok: true };
}
