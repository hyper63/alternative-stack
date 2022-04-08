import type { Session } from "@remix-run/node";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { hyper } from "./hyper";
import type { Note, NewNote } from "~/models/note";
import type { User } from "~/models/user";
import type { Password } from "~/models/password";

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
  verifyLogin: (email: User["email"], password: Password["password"]) => Promise<User | null>;
}

export interface SessionServer {
  getSession(request: Request): Promise<Session>;
  getUserId(request: Request): Promise<User["id"] | undefined>;
  getUser(request: Request): Promise<null | User>;
  requireUserId(request: Request, redirectTo?: string): Promise<User["id"]>;
  requireUser(request: Request): Promise<User>;
  createUserSession({
    request,
    userId,
    remember,
    redirectTo,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
  }): Promise<Response>;
  logout(request: Request): Promise<Response>;
}

export type ServerContext = {
  UserServer: UserServer;
  NoteServer: NoteServer;
  SessionServer: SessionServer;
};

export type ServerEnvironment = {
  hyper: typeof hyper;
  event: APIGatewayProxyEventV2;
};
