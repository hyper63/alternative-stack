import z from "zod";

import { DocSchema, PasswordIdSchema, UserIdSchema } from "./model";

export const PasswordSchema = z.object({
  id: PasswordIdSchema,
  password: z.string(),
  parent: UserIdSchema,
});
export type Password = z.infer<typeof PasswordSchema>;

export const PasswordDocSchema = DocSchema.extend(
  PasswordSchema.extend({ type: z.literal("password") }).omit({ id: true }).shape
);
export type PasswordDoc = z.infer<typeof PasswordDocSchema>;
