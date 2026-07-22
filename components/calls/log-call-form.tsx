"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, PhoneCall } from "lucide-react";
import { logCallAction } from "@/app/actions/calls";
import type { ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CALL_OUTCOMES,
  CALL_OUTCOME_LABELS,
  CALL_OUTCOME_RULES,
  type CallOutcome,
} from "@/lib/constants";
import { addDaysISO, cn } from "@/lib/utils";

function Submit({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      <PhoneCall />
      {pending ? "Enregistrement…" : label}
    </Button>
  );
}

const OUTCOME_STYLES: Record<CallOutcome, string> = {
  pas_repondu: "data-[on=true]:border-slate-400 data-[on=true]:bg-slate-100",
  mauvais_numero: "data-[on=true]:border-neutral-400 data-[on=true]:bg-neutral-100",
  a_rappeler: "data-[on=true]:border-amber-400 data-[on=true]:bg-amber-50",
  interesse: "data-[on=true]:border-violet-400 data-[on=true]:bg-violet-50",
  pas_interesse: "data-[on=true]:border-rose-400 data-[on=true]:bg-rose-50",
  rdv_pris: "data-[on=true]:border-emerald-400 data-[on=true]:bg-emerald-50",
};

/**
 * Formulaire d'enregistrement d'appel : le cœur du produit.
 * Un clic sur un résultat pré-remplit la relance suggérée par la règle métier ;
 * l'associé peut l'ajuster avant de valider.
 */
export function LogCallForm({
  prospectId,
  onLogged,
  compact = false,
}: {
  prospectId: string;
  onLogged?: () => void;
  compact?: boolean;
}) {
  const formId = useId();
  const [state, formAction] = useActionState<ActionState, FormData>(logCallAction, {});
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [followUp, setFollowUp] = useState<string>("");

  useEffect(() => {
    if (state.ok) {
      toast.success("Appel enregistré");
      setOutcome(null);
      setFollowUp("");
      onLogged?.();
    }
  }, [state, onLogged]);

  return (
    <form id={formId} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="prospectId" value={prospectId} />
      <input type="hidden" name="outcome" value={outcome ?? ""} />

      <div>
        <Label className="mb-1.5 block">Résultat de l&apos;appel *</Label>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {CALL_OUTCOMES.map((o) => (
            <button
              key={o}
              type="button"
              data-on={outcome === o}
              onClick={() => {
                setOutcome(o);
                const days = CALL_OUTCOME_RULES[o].nextFollowUpDays;
                setFollowUp(days !== null ? addDaysISO(days) : "");
              }}
              className={cn(
                "rounded-lg border border-slate-200 px-2.5 py-2 text-left text-xs font-medium text-slate-600 transition-colors hover:border-slate-300",
                OUTCOME_STYLES[o],
              )}
            >
              {CALL_OUTCOME_LABELS[o]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-notes`}>Notes d&apos;appel</Label>
        <Textarea
          id={`${formId}-notes`}
          name="notes"
          rows={2}
          placeholder="Ce qui s'est dit, objections, besoin exprimé…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${formId}-followup`}>Prochaine relance</Label>
        <Input
          id={`${formId}-followup`}
          name="nextFollowUp"
          type="date"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />
      </div>

      {state.error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="size-3.5 shrink-0" />
          {state.error}
        </p>
      )}

      <Submit
        disabled={!outcome}
        label={outcome ? `Enregistrer « ${CALL_OUTCOME_LABELS[outcome]} »` : "Choisis un résultat"}
      />
    </form>
  );
}
