/* eslint-disable import/first */
process.env.HYPER = "https://localhost:6363/test";

import { describe, expect, test, vi } from "vitest";
import bcrypt from "bcryptjs";

import { hyper } from "./hyper";
import { ConflictError, NotFoundError, UnauthorizedError } from "./models/err";
import { User } from "./models/user";
import { NoteServer } from "./types";

import { UserServerFactory } from "./user.server";

const mockNoteServer = {
  getNotesByParent: async () => [{ _id: "note-123", parent: "user-123" }],
  deleteNote: async () => {},
} as unknown as NoteServer;

// @ts-ignore
const UserServer = UserServerFactory({ hyper, NoteServer: mockNoteServer });

const userTemplate = {
  id: expect.stringMatching(/^user-/),
  email: expect.any(String),
};

describe("UserServer", () => {
  describe("getUserById", () => {
    test("should return the user", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async (id) => ({
        _id: id,
        type: "user",
        email: "foo@bar.com",
      }));

      const user = (await UserServer.getUserById("user-123")) as User;

      expect(user).toMatchObject(userTemplate);
    });

    test("should return null on 404", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async (id) => ({
        ok: false,
        status: 404,
      }));

      const notFound = (await UserServer.getUserById("user-123")) as User;

      expect(notFound).toBeNull();
    });

    test("should throw if not a user id format", async () => {
      await expect(() => UserServer.getUserById("not-user-123")).rejects.toThrow();
    });
  });

  describe("getUserByEmail", () => {
    test("should return the user", async () => {
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [{ _id: "user-123", email: "foo@bar.com" }],
      }));

      const user = await UserServer.getUserByEmail("foo@bar.com");

      expect(user).toMatchObject(userTemplate);
    });

    test("should return null on not user found", async () => {
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async (id) => ({
        ok: true,
        docs: [],
      }));

      const notFound = await UserServer.getUserByEmail("foo@bar.com");

      expect(notFound).toBeNull();
    });

    test("should throw if not an email", async () => {
      await expect(() => UserServer.getUserByEmail("not-an-email")).rejects.toThrow();
    });
  });

  describe("createUser", () => {
    test("should return the user", async () => {
      // lookup existing users
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [],
      }));

      vi.spyOn(hyper.data, "bulk").mockImplementationOnce(async () => ({
        ok: true,
        docs: [
          { ok: true, id: "user-123" },
          { ok: true, id: "password-123" },
        ],
      }));

      const user = await UserServer.createUser("foo@bar.com", "1234abcd");

      expect(user).toMatchObject(userTemplate);
    });

    test("should create the user and password", async () => {
      // lookup existing users
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [],
      }));

      const spy = vi.spyOn(hyper.data, "bulk").mockImplementationOnce(async () => ({
        ok: true,
        docs: [
          { ok: true, id: "user-123" },
          { ok: true, id: "password-123" },
        ],
      }));

      await UserServer.createUser("foo@bar.com", "1234abcd");

      const calls = spy.mock.calls;
      // @ts-ignore
      const [userDoc, passwordDoc] = calls.pop()?.pop();

      // user doc
      expect(userDoc).toMatchObject({
        _id: expect.stringMatching(/^user-/),
      });
      // password doc
      expect(passwordDoc).toMatchObject({
        _id: expect.stringMatching(/^password-/),
        parent: expect.any(String),
        hash: expect.any(String),
        type: "password",
      });

      expect(passwordDoc.hash).not.toBe("1234abcd");
    });

    test("should throw if user with email already exists", async () => {
      // lookup existing users
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [{ _id: "user-123", email: "foo@bar.com" }],
      }));

      await expect(() => UserServer.createUser("foo@bar.com", "1234abcd")).rejects.toThrow(
        ConflictError
      );
    });

    test("should throw if not a valid password", async () => {
      await expect(() => UserServer.createUser("foo@bar.com", "short")).rejects.toThrow();
    });

    test("should throw if not an email", async () => {
      await expect(() => UserServer.createUser("not-an-email", "1234abcd")).rejects.toThrow();
    });
  });

  describe("deleteUser", () => {
    test("should delete the user, password, and notes", async () => {
      vi.spyOn(hyper.data, "query")
        // user doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [{ _id: "user-123", email: "foo@bar.com", type: "user" }],
        }))
        // password doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [{ _id: "password-123", hash: "1234", type: "password", parent: "user-123" }],
        }));

      const removeSpy = vi
        .spyOn(hyper.data, "remove")
        .mockImplementation(async (id) => ({ ok: true, id }));
      const deleteNoteSpy = vi.spyOn(mockNoteServer, "deleteNote");

      const res = await UserServer.deleteUser("foo@bar.com");

      expect(res).toBeUndefined();
      expect(removeSpy).toHaveBeenCalled();
      expect(deleteNoteSpy).toHaveBeenCalled();
    });
  });

  describe("verifyLogin", () => {
    test("should verify the password and return the user", async () => {
      vi.spyOn(hyper.data, "query")
        // user doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [{ _id: "user-123", email: "foo@bar.com", type: "user" }],
        }))
        // password doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [
            {
              _id: "password-123",
              hash: await bcrypt.hash("1234abcd", 10),
              type: "password",
              parent: "user-123",
            },
          ],
        }));

      const res = await UserServer.verifyLogin("foo@bar.com", "1234abcd");

      expect(res).toMatchObject(userTemplate);
    });

    test("should throw if invalid password", async () => {
      vi.spyOn(hyper.data, "query")
        // user doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [{ _id: "user-123", email: "foo@bar.com", type: "user" }],
        }))
        // password doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [
            {
              _id: "password-123",
              hash: await bcrypt.hash("1234abcd", 10),
              type: "password",
              parent: "user-123",
            },
          ],
        }));

      await expect(() => UserServer.verifyLogin("foo@bar.com", "incorrect-pw")).rejects.toThrow(
        UnauthorizedError
      );
    });

    test("should throw if password is not found", async () => {
      vi.spyOn(hyper.data, "query")
        // user doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [{ _id: "user-123", email: "foo@bar.com", type: "user" }],
        }))
        // password doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [],
        }));

      await expect(() => UserServer.verifyLogin("foo@bar.com", "incorrect-pw")).rejects.toThrow(
        NotFoundError
      );
    });

    test("should throw if user is not found", async () => {
      vi.spyOn(hyper.data, "query")
        // user doc
        .mockImplementationOnce(async () => ({
          ok: true,
          docs: [],
        }));

      await expect(() => UserServer.verifyLogin("foo@bar.com", "incorrect-pw")).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
