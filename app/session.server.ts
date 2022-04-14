import { createCookieSessionStorage, redirect } from "@remix-run/node";

import type { LoaderContext, SessionServer } from "./types";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

export const SessionServerFactory = (env: LoaderContext): SessionServer => {
  async function getSession(request: Request) {
    const cookie = request.headers.get("Cookie");
    return sessionStorage.getSession(cookie);
  }

  async function getUserId(request: Request) {
    const session = await getSession(request);
    const userId = session.get(USER_SESSION_KEY);
    return userId;
  }

  async function getUser(request: Request) {
    const { UserServer } = env;
    const userId = await getUserId(request);
    if (userId === undefined) return null;

    const user = await UserServer.getUserById(userId);
    if (user) return user;

    throw await logout(request);
  }

  async function requireUserId(request: Request, redirectTo?: string) {
    const userId = await getUserId(request);
    if (!userId) {
      const searchParams = new URLSearchParams([["redirectTo", redirectTo || "/"]]);
      throw redirect(`/login?${searchParams}`);
    }

    return userId;
  }

  async function requireUser(request: Request) {
    const { UserServer } = env;

    const userId = await requireUserId(request);

    const user = await UserServer.getUserById(userId);
    if (user) return user;

    throw await logout(request);
  }

  async function createUserSession({
    request,
    userId,
    remember,
    redirectTo,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
  }) {
    const session = await getSession(request);
    session.set(USER_SESSION_KEY, userId);
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session, {
          maxAge: remember
            ? 60 * 60 * 24 * 7 // 7 days
            : undefined,
        }),
      },
    });
  }

  async function logout(request: Request) {
    const session = await getSession(request);
    return redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }

  return {
    getSession,
    getUserId,
    getUser,
    requireUserId,
    requireUser,
    createUserSession,
    logout,
  };
};
