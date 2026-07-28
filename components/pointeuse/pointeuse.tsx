"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PhoneCall, Timer, Trophy } from "lucide-react";
import { endSessionAction, punchAction, startSessionAction } from "@/app/actions/pointeuse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function heureCourante() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

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
  const [calls, setCalls] = useState(initialCallsToday);

  const [showEntry, setShowEntry] = useState(!initialActive);
  const [showExit, setShowExit] = useState(false);
  const exitShownRef = useRef(false);

  // Pointage d'entrée : démarre la session.
  const start = () => {
    startTransition(async () => {
      await startSessionAction();
      setActive(true);
      setStartedAt(Date.now());
      setShowEntry(false);
    });
  };

  // +1 appel
  const punch = useCallback(() => {
    setCalls((c) => c + 1); // optimiste
    startTransition(async () => {
      const res = await punchAction();
      setCalls(res.callsToday);
      toast.success("+1 appel 💪");
      router.refresh();
    });
  }, [router]);

  // Pointage de sortie : clôture la session.
  const end = () => {
    startTransition(async () => {
      await endSessionAction();
      setActive(false);
      setStartedAt(null);
      setShowExit(false);
      router.refresh();
    });
  };

  // Détection d'intention de sortie (souris qui quitte par le haut) → popup de sortie.
  useEffect(() => {
    if (!active) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current) {
        exitShownRef.current = true;
        setShowExit(true);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [active]);

  const minutes = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 60000)) : 0;

  return (
    <>
      {/* Bouton « Pointer » (haut à droite) */}
      <Button size="sm" variant="secondary" onClick={punch} disabled={pending}>
        <PhoneCall />
        <span className="hidden sm:inline">Pointer</span>
        <span className="ml-0.5 min-w-5 rounded-full bg-indigo-600 px-1.5 text-center text-[11px] font-semibold text-white">
          {calls}
        </span>
      </Button>

      {/* Pointage d'entrée */}
      <Dialog open={showEntry} onOpenChange={setShowEntry}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="size-5 text-indigo-500" />
              Pointage d&apos;entrée
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-600">
              Il est <strong>{heureCourante()}</strong>. Tu as passé{" "}
              <strong>{calls} appel{calls > 1 ? "s" : ""}</strong> aujourd&apos;hui.
              <br />
              On est d&apos;accord&nbsp;? 💪
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowEntry(false)}>
              Plus tard
            </Button>
            <Button onClick={start} disabled={pending}>
              Oui, c&apos;est parti !
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pointage de sortie */}
      <Dialog
        open={showExit}
        onOpenChange={(o) => {
          setShowExit(o);
          if (!o) exitShownRef.current = false;
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              Déjà fini&nbsp;?
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-slate-600">
              Ça fait <strong>{minutes} min</strong> que tu prospectes pour{" "}
              <strong>{calls} appel{calls > 1 ? "s" : ""}</strong>.
              <br />
              Tu valides ta session&nbsp;?
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                punch();
              }}
              disabled={pending}
            >
              <PhoneCall />
              Encore un appel
            </Button>
            <Button onClick={end} disabled={pending}>
              Valider et clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
