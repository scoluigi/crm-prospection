"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      <LogIn />
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <Card className="p-5">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={params.get("next") ?? "/"} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="prenom@agence.fr"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Mot de passe (optionnel)</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Accès libre"
          />
        </div>

        {state.error && (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="size-3.5 shrink-0" />
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </Card>
  );
}
