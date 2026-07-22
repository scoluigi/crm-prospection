import { desc, eq } from "drizzle-orm";
import { db, notes, users } from "@/lib/db";
import { uid } from "@/lib/utils";
import { logActivity } from "./activity";

export type NoteRow = {
  id: string;
  content: string;
  createdAt: number;
  authorId: string;
  authorName: string | null;
  authorColor: string | null;
};

export async function getProspectNotes(prospectId: string): Promise<NoteRow[]> {
  return db
    .select({
      id: notes.id,
      content: notes.content,
      createdAt: notes.createdAt,
      authorId: notes.authorId,
      authorName: users.name,
      authorColor: users.color,
    })
    .from(notes)
    .leftJoin(users, eq(users.id, notes.authorId))
    .where(eq(notes.prospectId, prospectId))
    .orderBy(desc(notes.createdAt));
}

export async function addNote(
  prospectId: string,
  authorId: string,
  content: string,
): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  await db.insert(notes).values({
    id: uid(),
    prospectId,
    authorId,
    content: trimmed,
    createdAt: Date.now(),
  });

  logActivity({
    type: "note_ajoutee",
    message: "Note interne ajoutée",
    userId: authorId,
    prospectId,
  });
}

export async function deleteNote(id: string): Promise<void> {
  await db.delete(notes).where(eq(notes.id, id));
}
