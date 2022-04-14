import cuid from "cuid";

import type { NoteDoc } from "./models/note";
import { NoteSchema } from "./models/note";
import { NoteIdSchema } from "./models/model";
import { NotFoundError } from "./models/err";

import { fromHyper, toHyper } from "./hyper";
import type { NoteServer, ServerContext } from "./types";

export const NotesServerFactory = (env: ServerContext): NoteServer => ({
  async getNote({ id }): ReturnType<NoteServer["getNote"]> {
    const { hyper } = env;

    id = NoteIdSchema.parse(id);
    const res = await hyper.data.get(id);

    if (!res.ok && res.status === 404) {
      return null;
    }

    return fromHyper(NoteSchema)(res as NoteDoc);
  },

  async getNotesByParent({ parent }): ReturnType<NoteServer["getNotesByParent"]> {
    // check hyper cache
    const { hyper, UserServer } = env;

    const user = await UserServer.getUserById(parent);

    if (!user) {
      throw new NotFoundError(`parent with id ${parent} not found`);
    }

    const { docs } = await hyper.data.query<NoteDoc>({
      type: "note",
      parent,
    });
    return docs.map(fromHyper(NoteSchema));
  },

  async createNote({ body, title, parent }): ReturnType<NoteServer["createNote"]> {
    const { hyper, UserServer } = env;

    const user = await UserServer.getUserById(parent);

    if (!user) {
      throw new NotFoundError(`parent with id ${parent} not found`);
    }

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

  async deleteNote({ id }): ReturnType<NoteServer["deleteNote"]> {
    const { hyper } = env;

    // TODO: invalidate cache
    id = NoteIdSchema.parse(id);
    await hyper.data.remove(id);
  },
});
