import {
  CalendarClock,
  PhoneCall,
  PlusCircle,
  RefreshCw,
  StickyNote,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { ActivityType } from "@/lib/constants";
import type { ActivityEntry } from "@/services/activity";

const ICONS: Record<ActivityType, LucideIcon> = {
  prospect_cree: PlusCircle,
  statut_change: RefreshCw,
  appel_effectue: PhoneCall,
  responsable_change: UserCog,
  note_modifiee: StickyNote,
  relance_planifiee: CalendarClock,
};

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={RefreshCw} title="Aucune activité enregistrée" className="py-6" />;
  }

  return (
    <ol className="flex flex-col gap-0">
      {entries.map((entry, idx) => {
        const Icon = ICONS[entry.type] ?? RefreshCw;
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Icon className="size-3.5" />
              </span>
              {idx < entries.length - 1 && <span className="w-px flex-1 bg-slate-100" />}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <p className="text-sm text-slate-700">{entry.message}</p>
              <p className="text-xs text-slate-400">
                {entry.userName ?? "Système"} · {formatDateTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
