import { createRequestHandler } from "@remix-run/architect";
import * as build from "@remix-run/dev/server-build";

import { hyper } from "~/services/hyper";
import { NotesServerFactory } from "~/services/note.server";
import { UserServerFactory } from "~/services/user.server";

import { SessionServerFactory } from "~/session.server";
import { LoaderContext } from "~/types";

if (process.env.NODE_ENV !== "production") {
  require("./mocks");
}

export const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(event): LoaderContext {
    const context: any = { hyper };

    // Inject side effects into business logic
    context.UserServer = UserServerFactory(context);
    context.NoteServer = NotesServerFactory(context);

    /**
     * Loaders have access to:
     * - Business services
     * - SessionServer
     * - ApiGatewayProxyEvent
     *
     * Business logic is encapsulated, having access to only itself.
     * This has lots of benefits:
     * - Business logic is framework agnostic and can be reused
     *   - Remix/NextJS/CRA/Preact
     *   - Vue
     *   - Svelte
     *   - CLI :)
     *
     * - Easier to test business logic (unit tests!)
     * - Separation of concerns
     *
     * For more info, see https://blog.hyper.io/the-perfect-application-architecture/
     */
    return {
      ...context,
      event,
      SessionServer: SessionServerFactory({ ...context, event }),
    };
  },
});
