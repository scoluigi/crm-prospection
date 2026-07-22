"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeOwnerAction } from "@/app/actions/prospects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamMember } from "@/services/users";

export function QuickOwnerSelect({
  prospectId,
  ownerId,
  team,
}: {
  prospectId: string;
  ownerId: string;
  team: TeamMember[];
}) {
  const [value, setValue] = useState(ownerId);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        const prev = value;
        setValue(next);
        startTransition(async () => {
          const res = await changeOwnerAction(prospectId, next);
          if (res.error) {
            setValue(prev);
            toast.error(res.error);
          } else {
            toast.success("Responsable mis à jour");
          }
        });
      }}
    >
      <SelectTrigger className="w-[150px]">
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
  );
}
