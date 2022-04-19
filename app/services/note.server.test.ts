/* eslint-disable import/first */
process.env.HYPER = "https://localhost:6363/test";

import { describe, expect, test, vi } from "vitest";

import { UserServer } from "./types";
import { hyper } from "./hyper";
import { NotFoundError } from "./models/err";
import { Note } from "./models/note";

import { NotesServerFactory } from "./note.server";

const mockUserServer = {
  getUserById: async (id: string) => ({ id }),
} as UserServer;

// @ts-ignore
const NoteServer = NotesServerFactory({
  hyper,
  UserServer: mockUserServer,
});

const noteTemplate = {
  id: expect.stringMatching(/^note-/),
  title: expect.any(String),
  body: expect.any(String),
  parent: expect.any(String),
};

describe("NoteServer", () => {
  describe("getNote", () => {
    test("should return the note", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async (id) => ({
        _id: id,
        type: "note",
        title: "foo",
        body: "bar",
        parent: "user-123",
      }));

      const note = (await NoteServer.getNote({ id: "note-123" })) as Note;

      expect(note).toMatchObject(noteTemplate);
    });

    test("should return null on 404", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async (id) => ({
        ok: false,
        status: 404,
      }));

      const notFound = await NoteServer.getNote({ id: "note-123" });

      expect(notFound).toBeNull();
    });

    test("should throw if not a note id format", async () => {
      await expect(() => NoteServer.getNote({ id: "not-note-123" })).rejects.toThrow();
    });
  });

  describe("getNotesByParent", () => {
    test("should return the notes", async () => {
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [
          { _id: "note-123", type: "note", parent: "user-123", title: "foo", body: "bar" },
          { _id: "note-456", type: "note", parent: "user-123", title: "foo", body: "bar" },
        ],
      }));

      const [note1, note2] = await NoteServer.getNotesByParent({ parent: "user-123" });

      expect(note1).toMatchObject(noteTemplate);
      expect(note2).toMatchObject(noteTemplate);
    });

    test("should return an empty array", async () => {
      vi.spyOn(hyper.data, "query").mockImplementationOnce(async () => ({
        ok: true,
        docs: [],
      }));

      const notes = await NoteServer.getNotesByParent({ parent: "user-123" });

      expect(notes).toBeInstanceOf(Array);
      expect(notes.length).toBe(0);
    });

    test("should throw if parent is not found", async () => {
      vi.spyOn(mockUserServer, "getUserById").mockImplementationOnce(async () => null);

      await expect(() => NoteServer.getNotesByParent({ parent: "user-123" })).rejects.toThrow();
    });
  });

  describe("createNote", () => {
    test("should return the new note", async () => {
      vi.spyOn(hyper.data, "add").mockImplementationOnce(async (doc) => ({
        ok: true,
        id: doc._id,
      }));

      const note = await NoteServer.createNote({ title: "foo", body: "bar", parent: "user-123" });

      expect(note).toMatchObject(noteTemplate);
    });

    test("should throw if parent is not found", async () => {
      vi.spyOn(mockUserServer, "getUserById").mockImplementationOnce(async () => null);

      await expect(() =>
        NoteServer.createNote({
          title: "foo",
          body: "bar",
          parent: "user-123",
        })
      ).rejects.toThrow();
    });
  });

  describe("deleteNote", () => {
    test("should delete the note", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async (id) => ({
        _id: id,
        type: "note",
        title: "foo",
        body: "bar",
        parent: "user-123",
      }));

      const spy = vi
        .spyOn(hyper.data, "remove")
        .mockImplementationOnce(async (id) => ({ ok: true, id }));

      await NoteServer.deleteNote({ id: "note-123" });

      expect(spy).toHaveBeenCalledWith("note-123");
    });

    test("should throw if note is not found", async () => {
      vi.spyOn(hyper.data, "get").mockImplementationOnce(async () => ({
        ok: false,
        status: 404,
      }));

      await expect(() => NoteServer.deleteNote({ id: "note-123" })).rejects.toThrow(NotFoundError);
    });
  });
});
