/* eslint-disable import/first */
process.env.HYPER = "https://localhost:6363/test";

import { describe, expect, test } from "vitest";
import { ZodSchema } from "zod";

import { fromHyper, hyper, toHyper } from "./hyper";

describe("hyper", () => {
  test("should be defined", () => {
    expect(hyper).toBeDefined();
  });
});

describe("toHyper", () => {
  test("should set _id and remove id", () => {
    const res = toHyper({ foo: "bar", type: "note", id: "note-123" });

    expect(res._id).toBe("note-123");
    expect((res as any).id).not.toBeDefined();
  });

  test("should assoc date fields", () => {
    const res = toHyper({ foo: "bar", type: "note", id: "note-123" });

    expect(res.createdAt).toBeTruthy();
    expect(res.updatedAt).toBeTruthy();
  });

  test("should only set createdAt if not defined", () => {
    const createdAt = new Date();
    const res = toHyper({ foo: "bar", type: "note", id: "note-123", createdAt });

    expect(res.createdAt.getTime()).toBe(createdAt.getTime());
  });

  test(".as(schema) should use the schema to parse", () => {
    const mockSchema = {
      parse: (o: any) => {
        return { ...o, foo: "bar" };
      },
    };

    const res = toHyper.as(mockSchema as ZodSchema)({ type: "note", id: "note-123" });

    expect(res.foo).toBe("bar");
  });
});

describe("fromHyper", () => {
  test("should set id and remove _id", () => {
    const res = fromHyper({ foo: "bar", type: "note", _id: "note-123" });

    // @ts-ignore
    expect(res.id).toBe("note-123");
    expect((res as any)._id).not.toBeDefined();
  });

  test(".as(schema) should use the schema to parse", () => {
    const mockSchema = {
      parse: (o: any) => {
        return { ...o, foo: "bar" };
      },
    };

    const res = fromHyper.as(mockSchema as ZodSchema)({ type: "note", _id: "note-123" });

    expect(res.foo).toBe("bar");
  });
});
