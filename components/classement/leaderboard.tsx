"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Pencil, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { setMyCallsAction } from "@/app/actions/pointeuse";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaderRow } from "@/services/leaderboard";

type Metric = "today" | "week";
const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({ rows, currentUserId }: { rows: LeaderRow[]; currentUserId: string }) {
  const router = useRouter();
  const [metric, setMetric] = useState<Metric>("today");
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [myToday, setMyToday] = useState<number | null>(null); // override optimiste

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(t);
  }, [router]);

  const value = (r: LeaderRow) => {
    if (metric === "today" && r.userId === currentUserId && myToday !== null) return myToday;
    return metric === "today" ? r.callsToday : r.callsWeek;
  };
  const sorted = [...rows].sort((a, b) => value(b) - value(a));
  const max = Math.max(1, ...sorted.map(value));
  const totalToday = rows.reduce((s, r) => s + (r.userId === currentUserId && myToday !== null ? myToday : r.callsToday), 0);
  const online = rows.filter((r) => r.activeMinutes !== null).length;

  const saveEdit = () => {
    const n = parseInt(draft, 10);
    const target = Number.isFinite(n) && n >= 0 ? n : 0;
    setMyToday(target);
    setEditing(false);
    startTransition(async () => {
      const res = await setMyCallsAction(target);
      setMyToday(res.callsToday);
      toast.success("Ton total a été mis à jour");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <Stat label="Appels aujourd'hui" value={totalToday} />
          <Stat label="En prospection" value={online} />
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          {(["today", "week"] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                metric === m ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {m === "today" ? "Aujourd'hui" : "7 jours"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {sorted.map((r, i) => {
          const v = value(r);
          const isMe = r.userId === currentUserId;
          const canEdit = isMe && metric === "today";
          return (
            <div key={r.userId} className={cn("flex items-center gap-3 rounded-lg", isMe && "bg-indigo-50/50 -mx-1 px-1 py-0.5")}>
              <span className="w-6 shrink-0 text-center text-lg">{MEDALS[i] ?? ""}</span>
              <UserAvatar name={r.name} color={r.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                    {r.name}
                    {isMe && <span className="text-[10px] font-normal text-indigo-500">(toi)</span>}
                    {r.activeMinutes !== null && (
                      <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-600">
                        <Circle className="size-2 fill-emerald-500 text-emerald-500" />
                        {r.activeMinutes} min
                      </span>
                    )}
                  </span>

                  {canEdit && editing ? (
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditing(false);
                        }}
                        className="w-16 rounded-md border border-slate-300 px-1.5 py-0.5 text-right text-sm"
                      />
                      <button onClick={saveEdit} disabled={pending} className="text-emerald-600 hover:text-emerald-700">
                        <Check className="size-4" />
                      </button>
                      <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="size-4" />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{v}</span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setDraft(String(v));
                            setEditing(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                          title="Modifier mon total"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(v / max) * 100}%`, backgroundColor: r.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Trophy className="size-3.5" />
        Classement en direct — tu peux corriger ton propre total, pas celui des autres.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 shadow-sm">
      <p className="text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
