import { describe, expect, test } from "vitest";

import { NoteSchema, NoteDocSchema } from "./note";

describe("NoteSchema", () => {
  test("should require the fields", () => {
    const valid = {
      id: `note-123`,
      parent: "parentid",
      body: "foo",
      title: "bar",
    };
    expect(() => NoteSchema.parse(valid)).not.toThrow();

    expect(() => NoteSchema.parse({ ...valid, id: "nope-1233" })).toThrow();
    expect(() => NoteSchema.parse({ ...valid, title: null })).toThrow();
    expect(() => NoteSchema.parse({ ...valid, body: null })).toThrow();
    expect(() => NoteSchema.parse({ ...valid, parent: null })).toThrow();
  });
});

describe("NoteDocSchema", () => {
  test("should require fields on note doc", () => {
    const valid = {
      _id: `note-123`,
      parent: "parentid",
      body: "foo",
      title: "bar",
      type: "note",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => NoteDocSchema.parse(valid)).not.toThrow();

    expect(() => NoteDocSchema.parse({ ...valid, type: "nope-1233" })).toThrow();
    expect(() => NoteDocSchema.parse({ ...valid, _id: "nope-1233" })).toThrow();
  });
});
