import z from "zod";

import { DocSchema, PasswordIdSchema, UserIdSchema } from "./model";

export const PasswordSchema = z.string().min(8);

export type Password = z.infer<typeof PasswordSchema>;
export const PasswordObjSchema = z.object({
  id: PasswordIdSchema,
  parent: UserIdSchema,
  hash: z.string(),
});

export const PasswordDocSchema = DocSchema.extend(
  PasswordObjSchema.extend({
    _id: PasswordIdSchema,
    type: z.literal("password"),
  }).omit({ id: true }).shape
).strict();

export type PasswordDoc = z.infer<typeof PasswordDocSchema>;
