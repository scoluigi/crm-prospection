"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";
import { logCallAction } from "@/app/actions/calls";
import type { ActionState } from "@/app/actions/prospects";
import { CALL_OUTCOMES, CALL_OUTCOME_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Enregistre un appel en un clic : un bouton par résultat, ou « appel simple ». */
export function LogCall({ prospectId }: { prospectId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(logCallAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Appel enregistré 📞");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="prospectId" value={prospectId} />
      <Textarea name="notes" rows={2} placeholder="Note de l'appel (optionnel)…" />
      <div className="flex flex-wrap gap-1.5">
        <Button type="submit" size="sm">
          <PhoneCall />
          J&apos;ai appelé
        </Button>
        {CALL_OUTCOMES.map((o) => (
          <Button key={o} type="submit" name="outcome" value={o} size="sm" variant="secondary">
            {CALL_OUTCOME_LABELS[o]}
          </Button>
        ))}
      </div>
    </form>
  );
}
