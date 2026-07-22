import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "bg-indigo-50 text-indigo-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    success: "bg-emerald-50 text-emerald-600",
  };

  const content = (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p>}
      </div>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="size-4.5" />
      </span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
