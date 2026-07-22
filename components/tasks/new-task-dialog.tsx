"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus } from "lucide-react";
import { createTaskAction } from "@/app/actions/tasks";
import type { ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, PRIORITY_LABELS, TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/constants";
import { today } from "@/lib/utils";
import type { TeamMember } from "@/services/users";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Création…" : "Créer la tâche"}
    </Button>
  );
}

export function NewTaskDialog({
  team,
  currentUserId,
  prospectId,
  prospectName,
  trigger,
}: {
  team: TeamMember[];
  currentUserId: string;
  prospectId?: string;
  prospectName?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(createTaskAction, {});

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Tâche créée");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus />
            Nouvelle tâche
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{prospectName ? `Nouvelle tâche · ${prospectName}` : "Nouvelle tâche"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          {prospectId && <input type="hidden" name="prospectId" value={prospectId} />}
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" name="title" placeholder="Rappeler pour confirmer le RDV" required autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select name="type" defaultValue="autre">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TASK_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Priorité</Label>
                <Select name="priority" defaultValue="normale">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Responsable</Label>
                <Select name="assigneeId" defaultValue={currentUserId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commun">Commune (équipe)</SelectItem>
                    {team.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate">Échéance *</Label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={today()} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea id="comment" name="comment" rows={2} placeholder="Détails utiles pour réaliser la tâche" />
            </div>

            {state.error && (
              <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertCircle className="size-3.5 shrink-0" />
                {state.error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Submit />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
