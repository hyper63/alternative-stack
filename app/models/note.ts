import z from 'zod'

import { IdSchema } from './model'

export const NoteSchema = z.object({
  id: IdSchema("note"),
  parent: z.string(),
  title: z.string(),
  body: z.string()
}).passthrough()
export type Note = z.infer<typeof NoteSchema>

export const NewNoteSchema = NoteSchema.omit({ id: true })
export type NewNote = z.infer<typeof NewNoteSchema>
