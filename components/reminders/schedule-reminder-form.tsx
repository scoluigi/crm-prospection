"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { scheduleReminderAction } from "@/app/actions/reminders";
import type { ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDaysISO } from "@/lib/utils";
import type { TeamMember } from "@/services/users";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <CalendarPlus />
      Programmer
    </Button>
  );
}

export function ScheduleReminderForm({
  prospectId,
  team,
  currentUserId,
}: {
  prospectId: string;
  team: TeamMember[];
  currentUserId: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(scheduleReminderAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Relance programmée");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="prospectId" value={prospectId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Date</label>
        <Input name="dueDate" type="date" defaultValue={addDaysISO(1)} required className="w-[150px]" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Canal</label>
        <Select name="channel" defaultValue="appel">
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appel">Appel</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500">Assignée à</label>
        <Select name="assigneeId" defaultValue={currentUserId}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Submit />
    </form>
  );
}
