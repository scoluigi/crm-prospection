"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { createProspectAction, type ActionState } from "@/app/actions/prospects";
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

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Création…" : "Créer le prospect"}
    </Button>
  );
}

export function NewProspectDialog({
  team,
  currentUserId,
  children,
}: {
  team: TeamMember[];
  currentUserId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, formAction] = useActionState<ActionState, FormData>(createProspectAction, {});

  useEffect(() => {
    if (state.ok && state.id) {
      setOpen(false);
      toast.success("Prospect créé", {
        action: { label: "Ouvrir", onClick: () => router.push(`/prospects/${state.id}`) },
      });
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau prospect</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
            <ProspectFormFields team={team} defaultOwnerId={currentUserId} />
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
