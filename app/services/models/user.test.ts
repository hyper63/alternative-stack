import { describe, expect, test } from "vitest";

import { UserSchema, UserDocSchema } from "./user";

describe("UserSchema", () => {
  test("should require the fields", () => {
    const valid = {
      id: `user-123`,
      email: "foo@bar.com",
    };
    expect(() => UserSchema.parse(valid)).not.toThrow();

    expect(() => UserSchema.parse({ ...valid, id: "nope-1233" })).toThrow();
    expect(() => UserSchema.parse({ ...valid, email: null })).toThrow();
    expect(() => UserSchema.parse({ ...valid, email: "not an email" })).toThrow();
  });
});

describe("UserDocSchema", () => {
  test("should require fields on user doc", () => {
    const valid = {
      _id: `user-123`,
      email: "foo@bar.com",
      type: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => UserDocSchema.parse(valid)).not.toThrow();

    expect(() => UserDocSchema.parse({ ...valid, type: "nope-1233" })).toThrow();
    expect(() => UserDocSchema.parse({ ...valid, _id: "nope-1233" })).toThrow();
  });
});
