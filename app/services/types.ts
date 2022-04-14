import type { Hyper } from "hyper-connect";

import type { Note, NewNote } from "./models/note";
import type { User } from "./models/user";
import type { Password } from "./models/password";

export interface NoteServer {
  getNote({ id, parent }: Pick<Note, "id" | "parent">): Promise<Note | null>;
  getNotesByParent({ parent }: Pick<Note, "parent">): Promise<Array<Note>>;
  createNote({ body, title, parent }: NewNote): Promise<Note>;
  deleteNote({ parent, id }: Pick<Note, "id" | "parent">): Promise<void>;
}

export interface UserServer {
  getUserById: (id: User["id"]) => Promise<User | null>;
  getUserByEmail: (email: User["email"]) => Promise<User | null>;
  createUser: (email: User["email"], password: Password["password"]) => Promise<User>;
  deleteUser: (email: User["email"]) => Promise<void>;
  verifyLogin: (email: User["email"], password: Password["password"]) => Promise<User>;
}

export type ServerContext = {
  hyper: Hyper;
  UserServer: UserServer;
  NoteServer: NoteServer;
};
