import { createRequestHandler } from "@remix-run/architect";
import * as build from "@remix-run/dev/server-build";

import { services } from "~/services/services";

import { SessionServerFactory } from "~/session.server";
import { LoaderContext } from "~/types";

if (process.env.NODE_ENV !== "production") {
  require("./mocks");
}

export const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(event): LoaderContext {
    const serverContext = services();

    /**
     * Loaders have access to:
     * - Business services
     * - SessionServer
     * - ApiGatewayProxyEvent
     *
     * Business logic is encapsulated, having access to only itself (see ./services/services.ts).
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
      ...serverContext,
      event,
      SessionServer: SessionServerFactory({ ...serverContext, event } as LoaderContext),
    };
  },
});
