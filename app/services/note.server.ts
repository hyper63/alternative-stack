import type { ServerEnvironment, NoteServer } from "./types";

export const NotesServerFactory = (env: ServerEnvironment) => ({} as NoteServer);
