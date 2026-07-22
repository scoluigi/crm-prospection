import { Badge } from "@/components/ui/badge";
import {
  CALL_OUTCOME_COLORS,
  CALL_OUTCOME_LABELS,
  INTEREST_COLORS,
  INTEREST_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
  type CallOutcome,
  type InterestLevel,
  type ProspectStatus,
  type TaskPriority,
  type TaskType,
} from "@/lib/constants";
import { URGENCY_COLORS, cn, relativeDayLabel, urgencyOf } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ProspectStatus; className?: string }) {
  return <Badge className={cn(STATUS_COLORS[status], className)}>{STATUS_LABELS[status]}</Badge>;
}

export function InterestBadge({ level, className }: { level: InterestLevel; className?: string }) {
  return <Badge className={cn(INTEREST_COLORS[level], className)}>{INTEREST_LABELS[level]}</Badge>;
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <Badge className={cn(PRIORITY_COLORS[priority], className)}>{PRIORITY_LABELS[priority]}</Badge>
  );
}

export function TaskTypeBadge({ type, className }: { type: TaskType; className?: string }) {
  return (
    <Badge className={cn("border-slate-200 bg-white text-slate-600", className)}>
      {TASK_TYPE_LABELS[type]}
    </Badge>
  );
}

export function CallOutcomeBadge({
  outcome,
  className,
}: {
  outcome: CallOutcome;
  className?: string;
}) {
  return (
    <Badge className={cn(CALL_OUTCOME_COLORS[outcome], className)}>
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
