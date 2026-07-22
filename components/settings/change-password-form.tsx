"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";
import type { ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <KeyRound />
      {pending ? "Mise à jour…" : "Changer le mot de passe"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Mot de passe mis à jour");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirmer</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required />
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="size-3.5 shrink-0" />
          {state.error}
        </p>
      )}

      <div>
        <Submit />
      </div>
    </form>
  );
}
