import { describe, expect, test } from "vitest";

import { PasswordObjSchema, PasswordDocSchema, PasswordSchema } from "./password";

describe("PasswordSchema", () => {
  test("should require password to be at least 8 characters", () => {
    expect(() => PasswordSchema.parse("abcd1234")).not.toThrow();

    expect(() => PasswordSchema.parse("not8")).toThrow();
  });
});

describe("PasswordObjSchema", () => {
  test("should require the fields", () => {
    const valid = {
      id: `password-123`,
      parent: "user-123",
      hash: "1234",
    };
    expect(() => PasswordObjSchema.parse(valid)).not.toThrow();

    expect(() => PasswordObjSchema.parse({ ...valid, id: "nope-1233" })).toThrow();
    expect(() => PasswordObjSchema.parse({ ...valid, parent: "not-user-123" })).toThrow();
    expect(() => PasswordObjSchema.parse({ ...valid, hash: null })).toThrow();
  });
});

describe("PasswordDocSchema", () => {
  test("should require fields on password doc", () => {
    const valid = {
      _id: `password-123`,
      parent: "user-123",
      hash: "1234",
      type: "password",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(() => PasswordDocSchema.parse(valid)).not.toThrow();

    expect(() => PasswordDocSchema.parse({ ...valid, type: "nope-1233" })).toThrow();
    expect(() => PasswordDocSchema.parse({ ...valid, _id: "nope-1233" })).toThrow();
  });
});
