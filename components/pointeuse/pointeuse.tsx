"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Timer } from "lucide-react";
import { pointeAction, startSessionAction } from "@/app/actions/pointeuse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const heure = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function Pointeuse({
  initialActive,
  initialStartedAt,
  initialCallsToday,
}: {
  initialActive: boolean;
  initialStartedAt: number | null;
  initialCallsToday: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [active, setActive] = useState(initialActive);
  const [startedAt, setStartedAt] = useState<number | null>(initialStartedAt);
  const [callsToday, setCallsToday] = useState(initialCallsToday);

  const [showEntry, setShowEntry] = useState(!initialActive);
  const [showPointe, setShowPointe] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [input, setInput] = useState("");
  const exitArmed = useRef(true);

  // Pointage d'entrée : démarre la session.
  const start = () => {
    startTransition(async () => {
      await startSessionAction();
      setActive(true);
      setStartedAt(Date.now());
      setShowEntry(false);
      exitArmed.current = true;
    });
  };

  const openPointe = () => {
    setMinutes(startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 60000)) : 0);
    setInput("");
    setShowPointe(true);
  };

  // Bouton « Pointer » : clôture si une session est ouverte, sinon (re)pointe l'entrée.
  const onPointerClick = () => {
    if (active) openPointe();
    else setShowEntry(true);
  };

  // Pointage de sortie : enregistre le nombre d'appels.
  const validerPointe = () => {
    const n = parseInt(input, 10);
    startTransition(async () => {
      const res = await pointeAction(Number.isFinite(n) ? n : 0);
      setCallsToday(res.callsToday);
      setActive(false);
      setStartedAt(null);
      setShowPointe(false);
      toast.success(`Pointé : ${Number.isFinite(n) ? n : 0} appel(s) 💪`);
      router.refresh();
    });
  };

  // Intention de sortie (souris qui quitte par le haut) → popup de pointage.
  useEffect(() => {
    if (!active) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && exitArmed.current && !showPointe) {
        exitArmed.current = false;
        openPointe();
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, showPointe, startedAt]);

  return (
    <>
      <Button size="sm" variant="secondary" onClick={onPointerClick} disabled={pending}>
        <Timer />
        <span className="hidden sm:inline">Pointer</span>
        <span className="ml-0.5 min-w-5 rounded-full bg-indigo-600 px-1.5 text-center text-[11px] font-semibold text-white">
          {callsToday}
        </span>
      </Button>

      {/* Pointage d'entrée */}
      <Dialog open={showEntry} onOpenChange={setShowEntry}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="size-5 text-indigo-500" />
              C&apos;est parti !
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-600">
              Il est <strong>{heure()}</strong>. Aujourd&apos;hui tu as appelé{" "}
              <strong>{callsToday} personne{callsToday > 1 ? "s" : ""}</strong>.
              <br />
              On démarre une session de prospection&nbsp;?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowEntry(false)}>
              Plus tard
            </Button>
            <Button onClick={start} disabled={pending}>
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pointage de sortie */}
      <Dialog open={showPointe} onOpenChange={setShowPointe}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="size-5 text-amber-500" />
              Pointe ta session
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              Tu as passé <strong>{minutes} min</strong> à prospecter. Combien d&apos;appels
              as-tu passés&nbsp;?
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calls">Nombre d&apos;appels</Label>
              <Input
                id="calls"
                type="number"
                min={0}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && validerPointe()}
                placeholder="Ex : 12"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPointe(false)}>
              Annuler
            </Button>
            <Button onClick={validerPointe} disabled={pending}>
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
