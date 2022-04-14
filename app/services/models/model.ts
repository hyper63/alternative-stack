import z from "zod";

// eslint-disable-next-line no-useless-escape
const IdSchema = (prefix: string) => z.string().regex(new RegExp(`${prefix}-([\w-]+)$`));

export const DocSchema = z
  .object({
    _id: z.string(),
    type: z.enum(["note", "user", "password"]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .passthrough();

export const UserIdSchema = IdSchema("user");
export const NoteIdSchema = IdSchema("note");
export const PasswordIdSchema = IdSchema("password");
