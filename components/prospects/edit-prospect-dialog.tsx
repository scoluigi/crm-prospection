"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Pencil } from "lucide-react";
import { updateProspectAction, type ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProspectFormFields } from "./prospect-form-fields";
import type { TeamMember } from "@/services/users";
import type { ProspectWithOwner } from "@/services/prospects";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}

export function EditProspectDialog({
  prospect,
  team,
  trigger,
}: {
  prospect: ProspectWithOwner;
  team: TeamMember[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(updateProspectAction, {});

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Prospect mis à jour");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">
            <Pencil />
            Modifier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier {prospect.companyName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="id" value={prospect.id} />
          <DialogBody>
            <ProspectFormFields team={team} defaultOwnerId={prospect.ownerId} prospect={prospect} />
            {state.error && (
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
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
