import bcrypt from "bcryptjs";
import cuid from "cuid";

import { UserIdSchema } from "~/models/model";
import { PasswordDoc, PasswordSchema } from "~/models/password";
import { EmailSchema, UserDoc, UserSchema } from "~/models/user";

import { fromHyper, toHyper } from "./hyper";
import type { ServerContext, UserServer } from "./types";

export const UserServerFactory = (env: ServerContext): UserServer => {
  async function getUserById(id: string) {
    const { hyper } = env;

    id = UserIdSchema.parse(id);
    const userDoc = await hyper.data.get<UserDoc>(id);
    return fromHyper(UserSchema)(userDoc);
  }

  async function getUserByEmail(email: string) {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const {
      docs: [user],
    } = await hyper.data.query<UserDoc>({ type: "user", email });
    return user && fromHyper(UserSchema)(user);
  }

  async function createUser(email: string, password: string) {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const exists = await getUserByEmail(email);
    if (exists) {
      throw new Error(`user with email ${email} already exists`);
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

  async function deleteUser(email: string) {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error(`No user with email ${email} found`);
    }

    await hyper.data.remove(user.id);
  }

  async function verifyLogin(email: string, password: string) {
    const { hyper } = env;

    email = EmailSchema.parse(email);
    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error(`No user with email ${email} found`);
    }

    const {
      docs: [{ password: hash }],
    } = await hyper.data.query<PasswordDoc>({
      type: "password",
      parent: user?.id,
    });

    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return undefined;
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
