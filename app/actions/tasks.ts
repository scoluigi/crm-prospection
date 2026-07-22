"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES, type TaskStatus } from "@/lib/constants";
import { createTask, deleteTask, toggleTask, updateTask } from "@/services/tasks";
import type { ActionState } from "./prospects";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  type: z.enum(TASK_TYPES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeId: z.string().optional(),
  prospectId: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Une échéance est obligatoire"),
  comment: z.string().optional(),
});

function revalidateTaskViews() {
  revalidatePath("/");
  revalidatePath("/aujourdhui");
  revalidatePath("/equipe");
}

function readTaskForm(formData: FormData) {
  const get = (key: string) => {
    const value = formData.get(key);
    return value === null ? undefined : String(value);
  };
  return {
    title: get("title") ?? "",
    type: get("type"),
    priority: get("priority"),
    assigneeId: get("assigneeId"),
    prospectId: get("prospectId"),
    dueDate: get("dueDate") ?? "",
    comment: get("comment"),
  };
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse(readTaskForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const d = parsed.data;
  const id = await createTask(
    {
      ...d,
      // La valeur sentinelle "commun" représente une tâche sans responsable.
      assigneeId: !d.assigneeId || d.assigneeId === "commun" ? null : d.assigneeId,
      prospectId: d.prospectId === "aucun" ? null : d.prospectId || null,
    },
    user.id,
  );

  revalidateTaskViews();
  if (d.prospectId && d.prospectId !== "aucun") revalidatePath(`/prospects/${d.prospectId}`);
  return { ok: true, id };
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Tâche introuvable" };

  const parsed = taskSchema.safeParse(readTaskForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Saisie invalide" };

  const status = String(formData.get("status") ?? "") as TaskStatus;
  const d = parsed.data;

  await updateTask(
    id,
    {
      ...d,
      assigneeId: !d.assigneeId || d.assigneeId === "commun" ? null : d.assigneeId,
      prospectId: d.prospectId === "aucun" ? null : d.prospectId || null,
      ...(TASK_STATUSES.includes(status) ? { status } : {}),
    },
    user.id,
  );

  revalidateTaskViews();
  return { ok: true, id };
}

export async function toggleTaskAction(id: string): Promise<ActionState> {
  const user = await requireUser();
  await toggleTask(id, user.id);
  revalidateTaskViews();
  return { ok: true };
}

export async function setTaskStatusAction(id: string, status: TaskStatus): Promise<ActionState> {
  const user = await requireUser();
  if (!TASK_STATUSES.includes(status)) return { error: "Statut inconnu" };
  await updateTask(id, { status }, user.id);
  revalidateTaskViews();
  return { ok: true };
}

export async function deleteTaskAction(id: string): Promise<ActionState> {
  await requireUser();
  await deleteTask(id);
  revalidateTaskViews();
  return { ok: true };
}
