import type { z } from "zod";
import bcrypt from "bcryptjs";
import cuid from "cuid";

import { DocType, UserIdSchema } from "./models/model";
import { ConflictError, NotFoundError, UnauthorizedError } from "./models/err";
import type { PasswordDoc } from "./models/password";
import { PasswordDocSchema, PasswordObjSchema, PasswordSchema } from "./models/password";
import type { User, UserDoc } from "./models/user";
import { EmailSchema, UserDocSchema, UserSchema } from "./models/user";

import { fromHyper, toHyper } from "./hyper";
import type { ServerContext, UserServer } from "./types";

export const UserServerFactory = (env: ServerContext): UserServer => {
  async function getUserById(id: string): ReturnType<UserServer["getUserById"]> {
    const { hyper } = env;

    id = UserIdSchema.parse(id);
    const res = await hyper.data.get(id);

    if (!res.ok && res.status === 404) {
      return null;
    }

    return fromHyper.as(UserSchema)(res);
  }

  async function getUserByEmail(email: string): ReturnType<UserServer["getUserByEmail"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const res = await hyper.data.query<UserDoc>({ type: "user", email });

    if (!res.ok) {
      throw new Error(res.msg);
    }

    const { docs } = res;

    if (!docs.length) {
      return null;
    }

    const user = docs.pop() as UserDoc;

    return user && fromHyper.as(UserSchema)(user);
  }

  async function getUserAndPassword(
    email: string
  ): Promise<{ user: User; password: z.infer<typeof PasswordObjSchema> }> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw new NotFoundError(`user with email ${email} not found`);
    }

    const res = await hyper.data.query<PasswordDoc>({
      type: "password",
      parent: user.id,
    });

    if (!res.ok) {
      throw new Error(res.msg);
    }

    const { docs } = res;

    if (!docs.length) {
      // TODO: use hyper queue to create job to send alert
      console.error("A user without a password. Send an alert to a monitoring system...");
      throw new NotFoundError(`password not found for user with email ${email}`);
    }

    return {
      user,
      password: fromHyper.as(PasswordObjSchema)(docs.pop()),
    };
  }

  async function createUser(email: string, password: string): ReturnType<UserServer["createUser"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const exists = await getUserByEmail(email);
    if (exists) {
      throw new ConflictError(`user with email ${email} already exists`);
    }

    const userId = `user-${cuid()}`;
    const user = UserSchema.parse({ id: userId, email });
    const pw = PasswordSchema.parse(password.trim());

    await hyper.data.bulk([
      toHyper.as(UserDocSchema)({ ...user, type: DocType.enum.user }),
      toHyper.as(PasswordDocSchema)({
        id: `password-${cuid()}`,
        parent: userId,
        hash: await bcrypt.hash(pw, 10),
        type: DocType.enum.password,
      }),
    ]);

    return user;
  }

  async function deleteUser(email: string): ReturnType<UserServer["deleteUser"]> {
    const { hyper, NoteServer } = env;

    const { user, password } = await getUserAndPassword(email);
    const notes = await NoteServer.getNotesByParent({ parent: user.id });

    // delete all user's notes docs
    await Promise.all(notes.map((n) => NoteServer.deleteNote(n)));
    // delete the password doc
    await hyper.data.remove(password.id);
    // delete user doc
    await hyper.data.remove(user.id);
  }

  async function verifyLogin(
    email: string,
    password: string
  ): ReturnType<UserServer["verifyLogin"]> {
    const { user, password: pw } = await getUserAndPassword(email);

    const isValid = await bcrypt.compare(password, pw.hash);
    if (!isValid) {
      throw new UnauthorizedError();
    }

    return user;
  }

  return {
    getUserById,
    getUserByEmail,
    createUser,
    deleteUser,
    verifyLogin,
  };
};
