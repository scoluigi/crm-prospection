import { Badge } from "@/components/ui/badge";
import {
  CALL_OUTCOME_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type CallOutcome,
  type ProspectStatus,
} from "@/lib/constants";
import { URGENCY_COLORS, cn, relativeDayLabel, urgencyOf } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ProspectStatus; className?: string }) {
  return <Badge className={cn(STATUS_COLORS[status], className)}>{STATUS_LABELS[status]}</Badge>;
}

export function CallOutcomeBadge({
  outcome,
  className,
}: {
  outcome: CallOutcome;
  className?: string;
}) {
  return (
    <Badge className={cn("border-slate-200 bg-white text-slate-600", className)}>
      {CALL_OUTCOME_LABELS[outcome]}
    </Badge>
  );
}

/** Badge d'échéance : rouge si en retard, orange si aujourd'hui. */
export function DueBadge({
  date,
  className,
  prefix,
}: {
  date: string | null | undefined;
  className?: string;
  prefix?: string;
}) {
  const urgency = urgencyOf(date);
  if (urgency === "none") {
    return <Badge className={cn(URGENCY_COLORS.none, className)}>Pas de date</Badge>;
  }
  return (
    <Badge className={cn(URGENCY_COLORS[urgency], className)}>
      {prefix ? `${prefix} ` : ""}
      {relativeDayLabel(date)}
    </Badge>
  );
}
