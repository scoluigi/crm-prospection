"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Phone } from "lucide-react";
import { cancelReminderAction, completeReminderAction, postponeReminderAction } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { DueBadge } from "@/components/shared/badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ReminderRow as ReminderRowData } from "@/services/reminders";

export function ReminderRow({
  reminder,
  showProspectLink = true,
}: {
  reminder: ReminderRowData;
  showProspectLink?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <UserAvatar name={reminder.assigneeName ?? "?"} color={reminder.assigneeColor} size="sm" />

      <div className="min-w-0 flex-1">
        {showProspectLink ? (
          <Link href={`/prospects/${reminder.prospectId}`} className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600">
            {reminder.companyName}
          </Link>
        ) : (
          <p className="truncate text-sm font-medium text-slate-900">{reminder.companyName}</p>
        )}
        <p className="truncate text-xs text-slate-500">
          {reminder.contactName ?? reminder.phone ?? "—"}
          {reminder.note ? ` · ${reminder.note}` : ""}
        </p>
      </div>

      <DueBadge date={reminder.dueDate} />

      <div className="flex items-center gap-1">
        {reminder.phone && (
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={`tel:${reminder.phone}`} aria-label="Appeler">
              <Phone />
            </a>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await completeReminderAction(reminder.id);
              if (res.error) toast.error(res.error);
              else toast.success("Relance effectuée");
            })
          }
        >
          <Check />
          Fait
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Autres actions">
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[1, 2, 7].map((days) => (
              <DropdownMenuItem
                key={days}
                onSelect={() =>
                  startTransition(async () => {
                    const res = await postponeReminderAction(reminder.id, days);
                    if (res.error) toast.error(res.error);
                    else toast.success(`Relance reportée de ${days} j`);
                  })
                }
              >
                Reporter de {days} jour{days > 1 ? "s" : ""}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              destructive
              onSelect={() =>
                startTransition(async () => {
                  await cancelReminderAction(reminder.id);
                  toast.success("Relance annulée");
                })
              }
            >
              Annuler la relance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
