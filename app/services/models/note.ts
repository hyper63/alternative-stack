import z from "zod";

import { DocSchema, NoteIdSchema } from "./model";

export const NoteSchema = z
  .object({
    id: NoteIdSchema,
    parent: z.string(),
    title: z.string(),
    body: z.string(),
  })
  .passthrough();
export type Note = z.infer<typeof NoteSchema>;
export type NewNote = Omit<Note, "id">;

export const NoteDocSchema = DocSchema.extend(
  NoteSchema.extend({ type: z.literal("note") }).omit({ id: true }).shape
);
export type NoteDoc = z.infer<typeof NoteDocSchema>;
