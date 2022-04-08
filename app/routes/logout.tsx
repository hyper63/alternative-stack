import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import type { ServerContext } from "~/services/types";

export const action: ActionFunction = async ({ request, context }) => {
  const { SessionServer } = context as ServerContext;

  return SessionServer.logout(request);
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
