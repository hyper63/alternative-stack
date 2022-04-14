import type { ServerContext } from "./types";
import { NotesServerFactory } from "./note.server";
import { UserServerFactory } from "./user.server";
import { hyper } from "./hyper";

/**
 * Creates a server context - injecting dependencies where needed
 */
export const services = (): ServerContext => {
  const _services: any = {};

  _services.hyper = hyper;
  // Inject side effects into business logic
  _services.UserServer = UserServerFactory(_services);
  _services.NoteServer = NotesServerFactory(_services);

  return _services as ServerContext;
};
