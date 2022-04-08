import { createRequestHandler } from "@remix-run/architect";
import * as build from "@remix-run/dev/server-build";

import { hyper } from "~/services/hyper";
import { ServerContext } from "~/services/types";
import { NotesServerFactory } from "~/services/note.server";
import { SessionServerFactory } from "~/services/session.server";
import { UserServerFactory } from "~/services/user.server";

if (process.env.NODE_ENV !== "production") {
  require("./mocks");
}

export const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(event): ServerContext {
    // Inject side effects into business logic
    return {
      UserServer: UserServerFactory({ hyper, event }),
      NoteServer: NotesServerFactory({ hyper, event }),
      SessionServer: SessionServerFactory({ hyper, event })
    };
  },
});
