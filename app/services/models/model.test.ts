import { describe, expect, test } from "vitest";

import { DocSchema } from "./model";

describe("DocSchema", () => {
  test("should require the document fields", () => {
    const valid = {
      _id: `note-123`,
      type: "note",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => DocSchema.parse(valid)).not.toThrow();

    expect(() => DocSchema.parse({ ...valid, _id: "nope-1233" })).toThrow();
    expect(() => DocSchema.parse({ ...valid, type: null })).toThrow();
    expect(() => DocSchema.parse({ ...valid, createdAt: null })).toThrow();
    expect(() => DocSchema.parse({ ...valid, updatedAt: null })).toThrow();
  });

  test("should allow other fields on the document", () => {
    const valid = {
      _id: `note-123`,
      type: "note",
      createdAt: new Date(),
      updatedAt: new Date(),
      foo: "bar",
    };
    expect((DocSchema.parse(valid) as any).foo).toBeTruthy();
  });
});
