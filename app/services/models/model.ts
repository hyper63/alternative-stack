import z from "zod";

const IdSchema = (prefix: string) => z.string().regex(new RegExp(`${prefix}-([\\w-]+)$`));

export const UserIdSchema = IdSchema("user");
export const NoteIdSchema = IdSchema("note");
export const PasswordIdSchema = IdSchema("password");
export const DocType = z.enum(["note", "user", "password"]);
// A generic doc schema all of our docs in hyper data will adhere to
export const DocSchema = z
  .object({
    _id: z.union([UserIdSchema, NoteIdSchema, PasswordIdSchema]),
    type: DocType,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .passthrough();
