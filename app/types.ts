import { Session } from "@remix-run/node";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { User } from "./services/models/user";
import { ServerContext } from "./services/types";

export interface SessionServer {
  getSession(request: Request): Promise<Session>;
  getUserId(request: Request): Promise<User["id"] | null>;
  getUser(request: Request): Promise<User | null>;
  requireUserId(request: Request, redirectTo?: string): Promise<User["id"]>;
  requireUser(request: Request): Promise<User>;
  createUserSession({
    request,
    userId,
    remember,
    redirectTo,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
  }): Promise<Response>;
  logout(request: Request): Promise<Response>;
}

export type LoaderContext = ServerContext & {
  SessionServer: SessionServer;
  event: APIGatewayProxyEventV2;
};
