import cuid from "cuid";

import { NoteSchema } from "~/models/note";
import { NoteIdSchema } from "~/models/model";
import type { NoteDoc } from "~/models/note";

import { fromHyper, toHyper } from "./hyper";
import type { NoteServer, ServerContext } from "./types";

export const NotesServerFactory = (env: ServerContext): NoteServer => ({
  async getNote({ id }) {
    const { hyper } = env;

    id = NoteIdSchema.parse(id);
    const noteDoc = await hyper.data.get(id);
    return fromHyper(NoteSchema)(noteDoc);
  },

  async getNotesByParent({ parent }) {
    // check hyper cache
    const { hyper } = env;

    const { docs } = await hyper.data.query<NoteDoc>({
      type: "note",
      parent,
    });
    return docs.map(fromHyper(NoteSchema));
  },

  async createNote({ body, title, parent }) {
    const { hyper } = env;

    // TODO: invalidate cache
    const newNote = NoteSchema.parse({
      id: `note-${cuid()}`,
      title,
      body,
      parent,
    });
    await hyper.data.add(toHyper(newNote));
    return newNote;
  },

  async deleteNote({ id }) {
    const { hyper } = env;

    // TODO: invalidate cache
    id = NoteIdSchema.parse(id);
    await hyper.data.remove(id);
  },
});
