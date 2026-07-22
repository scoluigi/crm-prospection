"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Send, StickyNote, Trash2 } from "lucide-react";
import { addNoteAction, deleteNoteAction } from "@/app/actions/notes";
import type { ActionState } from "@/app/actions/prospects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { NoteRow } from "@/services/notes";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Envoyer">
      <Send />
    </Button>
  );
}

export function NotesPanel({ prospectId, notes }: { prospectId: string; notes: NoteRow[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addNoteAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      <form ref={formRef} action={formAction} className="flex items-start gap-2">
        <input type="hidden" name="prospectId" value={prospectId} />
        <Textarea
          name="content"
          rows={2}
          placeholder="Ajouter une note interne (visible par toute l'équipe)…"
          className="flex-1"
          required
        />
        <Submit />
      </form>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Aucune note pour l'instant" className="py-6" />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id} className="group flex items-start gap-2.5">
              <UserAvatar name={note.authorName ?? "?"} color={note.authorColor} size="sm" />
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-700">
                    {note.authorName} <span className="font-normal text-slate-400">· {formatDateTime(note.createdAt)}</span>
                  </p>
                  <button
                    onClick={() => {
                      void deleteNoteAction(note.id, prospectId);
                      toast.success("Note supprimée");
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Supprimer la note"
                  >
                    <Trash2 className="size-3.5 text-slate-400 hover:text-rose-600" />
                  </button>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
