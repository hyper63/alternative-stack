import faker from "@faker-js/faker";

import { User } from "~/services/models/user";
import { services } from "~/services/services";

import { SessionServerFactory } from "~/session.server";
import { LoaderContext } from "~/types";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in with a random user. Yields the user and adds an alias to the user
       *
       * @returns {typeof login}
       * @memberof Chainable
       * @example
       *    cy.login()
       * @example
       *    cy.login({ email: 'whatever@example.com' })
       */
      login: typeof login;
      /**
       * Delete the aliased user, and all notes and passwords
       *
       * the @user must exist (see login)
       *
       * @returns {typeof cleanupUser}
       * @memberof Chainable
       * @example
       *    cy.cleanupUser()
       */
      cleanupUser: typeof cleanupUser;
    }
  }
}

async function login({
  email = faker.internet.email(undefined, undefined, "example.com"),
}: {
  email?: string;
} = {}) {
  const serverContext = services();

  if (!email) {
    throw new Error("email required for login");
  }
  if (!email.endsWith("@example.com")) {
    throw new Error("All test emails must end in @example.com");
  }

  const user = await serverContext.UserServer.createUser(email, "reallystrongpassword");
  cy.then(() => user).as("user");

  const response = await SessionServerFactory(serverContext as LoaderContext).createUserSession({
    request: new Request(""),
    userId: user.id,
    remember: false,
    redirectTo: "/",
  });

  const cookieValue = response.headers.get("Set-Cookie");
  if (!cookieValue) {
    throw new Error("Cookie missing from createUserSession response");
  }
  cy.setCookie("__session", cookieValue);
}

async function cleanupUser() {
  const { UserServer } = services();
  cy.get("@user").then(async (user) => {
    if (!user) {
      throw new Error("user must be set on as cy alias 'user'");
    }

    await UserServer.deleteUser((user as unknown as User).email);
  });

  cy.clearCookie("__session");
}

Cypress.Commands.add("login", login);
Cypress.Commands.add("cleanupUser", cleanupUser);
