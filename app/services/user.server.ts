import bcrypt from "bcryptjs";
import cuid from "cuid";

import { UserIdSchema } from "./models/model";
import { ConflictError, NotFoundError, UnauthorizedError } from "./models/err";
import { PasswordDoc, PasswordSchema } from "./models/password";
import { EmailSchema, UserDoc, UserSchema } from "./models/user";

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

    return fromHyper(UserSchema)(res as UserDoc);
  }

  async function getUserByEmail(email: string): ReturnType<UserServer["getUserByEmail"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const { docs } = await hyper.data.query<UserDoc>({ type: "user", email });

    if (!docs.length) {
      return null;
    }

    const user = docs.pop();

    return user && fromHyper(UserSchema)(user);
  }

  async function createUser(email: string, password: string): ReturnType<UserServer["createUser"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const exists = await getUserByEmail(email);
    if (exists) {
      throw new ConflictError(`user with email ${email} already exists`);
    }

    const id = `user-${cuid()}`;
    const user = UserSchema.parse({
      id,
      email,
    });

    const hashed = PasswordSchema.parse({
      password: await bcrypt.hash(password, 10),
      parent: id,
    });

    await hyper.data.bulk([user, hashed].map(toHyper));

    return user;
  }

  async function deleteUser(email: string): ReturnType<UserServer["deleteUser"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw new NotFoundError(`user with email ${email} not found`);
    }

    await hyper.data.remove(user.id);
  }

  async function verifyLogin(
    email: string,
    password: string
  ): ReturnType<UserServer["verifyLogin"]> {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw new NotFoundError(`user with email ${email} not found`);
    }

    const {
      docs: [{ password: hash }],
    } = await hyper.data.query<PasswordDoc>({
      type: "password",
      parent: user.id,
    });

    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      throw new UnauthorizedError();
    }

    return fromHyper(UserSchema)(user);
  }

  return {
    getUserById,
    getUserByEmail,
    createUser,
    deleteUser,
    verifyLogin,
  };
};
