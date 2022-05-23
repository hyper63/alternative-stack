import cuid from "cuid";

import type { NoteDoc, NewNote } from "./models/note";
import { NoteSchema, NoteDocSchema } from "./models/note";
import { DocType, NoteIdSchema } from "./models/model";
import { NotFoundError } from "./models/err";

import { fromHyper, toHyper } from "./hyper";
import type { NoteServer, ServerContext } from "./types";

export const NotesServerFactory = (env: ServerContext): NoteServer => {
  async function getNote({ id }: { id: string }): ReturnType<NoteServer["getNote"]> {
    const { hyper } = env;

    id = NoteIdSchema.parse(id);
    const res = await hyper.data.get(id);

    if (!res.ok && res.status === 404) {
      return null;
    }

    return fromHyper.as(NoteSchema)(res);
  }

  async function getNotesByParent({
    parent,
  }: {
    parent: string;
  }): ReturnType<NoteServer["getNotesByParent"]> {
    // check hyper cache
    const { hyper, UserServer } = env;

    const user = await UserServer.getUserById(parent);

    if (!user) {
      throw new NotFoundError(`parent with id ${parent} not found`);
    }

    // TODO: use hyper cache to instead of querying db
    const { docs } = await hyper.data.query<NoteDoc>({
      type: "note",
      parent,
    });
    return docs.map(fromHyper.as(NoteSchema));
  }

  async function createNote({
    body,
    title,
    parent,
  }: NewNote): ReturnType<NoteServer["createNote"]> {
    const { hyper, UserServer } = env;

    const user = await UserServer.getUserById(parent);

    if (!user) {
      throw new NotFoundError(`parent with id ${parent} not found`);
    }

    const newNote = NoteSchema.parse({
      id: `note-${cuid()}`,
      title,
      body,
      parent,
    });
    await hyper.data.add<NoteDoc>(
      toHyper.as(NoteDocSchema)({ ...newNote, type: DocType.enum.note })
    );
    // TODO: invalidate hyper cache for notes from parent

    return newNote;
  }

  async function deleteNote({ id }: { id: string }): ReturnType<NoteServer["deleteNote"]> {
    const { hyper } = env;
    const note = await getNote({ id });

    if (!note) {
      throw new NotFoundError();
    }

    await hyper.data.remove(note.id);
    // TODO: invalidate hyper cache for notes from parent
  }

  return {
    getNote,
    getNotesByParent,
    createNote,
    deleteNote,
  };
};
