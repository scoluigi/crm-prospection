"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeStatusAction } from "@/app/actions/prospects";
import { PROSPECT_STATUSES, STATUS_LABELS, type ProspectStatus } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuickStatusSelect({
  prospectId,
  status,
}: {
  prospectId: string;
  status: ProspectStatus;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        const prev = value;
        setValue(next as ProspectStatus);
        startTransition(async () => {
          const res = await changeStatusAction(prospectId, next as ProspectStatus);
          if (res.error) {
            setValue(prev);
            toast.error(res.error);
          } else {
            toast.success(`Statut : ${STATUS_LABELS[next as ProspectStatus]}`);
          }
        });
      }}
    >
      <SelectTrigger className="w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROSPECT_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
