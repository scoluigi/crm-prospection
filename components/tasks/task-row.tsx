"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { toggleTaskAction, deleteTaskAction } from "@/app/actions/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { PriorityBadge, TaskTypeBadge, DueBadge } from "@/components/shared/badges";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRow as TaskRowData } from "@/services/tasks";

export function TaskRow({
  task,
  showProspectLink = true,
  showDelete = true,
}: {
  task: TaskRowData;
  showProspectLink?: boolean;
  showDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const done = task.status === "termine";

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm", done && "opacity-60")}>
      <Checkbox
        checked={done}
        disabled={pending}
        className="mt-0.5"
        onCheckedChange={() =>
          startTransition(async () => {
            const res = await toggleTaskAction(task.id);
            if (res.error) toast.error(res.error);
          })
        }
      />

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-slate-800", done && "line-through")}>{task.title}</p>

        {task.prospectId && showProspectLink && (
          <Link href={`/prospects/${task.prospectId}`} className="text-xs text-indigo-600 hover:underline">
            {task.prospectName}
          </Link>
        )}
        {task.comment && <p className="mt-0.5 text-xs text-slate-500">{task.comment}</p>}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <TaskTypeBadge type={task.type} />
          <PriorityBadge priority={task.priority} />
          {!done && <DueBadge date={task.dueDate} />}
          {task.assigneeName && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <UserAvatar name={task.assigneeName} color={task.assigneeColor} size="sm" className="size-4 text-[8px]" />
              {task.assigneeName}
            </span>
          )}
        </div>
      </div>

      {showDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label="Supprimer la tâche"
          onClick={() =>
            startTransition(async () => {
              await deleteTaskAction(task.id);
              toast.success("Tâche supprimée");
            })
          }
        >
          <Trash2 className="text-slate-400 hover:text-rose-600" />
        </Button>
      )}
    </div>
  );
}
