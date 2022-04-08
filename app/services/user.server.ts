import type { ServerEnvironment, UserServer } from "./types";

export const UserServerFactory = (env: ServerEnvironment) => ({} as UserServer);
