import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { LoaderContext } from "~/types";

export const action: ActionFunction = async ({ request, context }) => {
  const { UserServer, SessionServer } = context as LoaderContext;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "🚨 🚨 🚨 🚨 🚨 🚨 🚨 🚨 test routes should not be enabled in production 🚨 🚨 🚨 🚨 🚨 🚨 🚨 🚨"
    );
    // test routes should not be enabled in production or without
    // enable test routes... Just in case this somehow slips through
    // we'll redirect :)
    return redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }

  const { email } = await request.json();
  if (!email) {
    throw new Error("email required for login");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  await UserServer.deleteUser(email);

  return SessionServer.logout(request).catch(() => {});
};

export default null;
