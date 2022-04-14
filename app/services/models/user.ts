import z from "zod";

import { DocSchema, UserIdSchema } from "./model";

export const EmailSchema = z
  .string()
  .email()
  .transform((val) => val.toLowerCase());
export const UserSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
});
export type User = z.infer<typeof UserSchema>;

export const UserDocSchema = DocSchema.extend(
  UserSchema.extend({ _id: UserIdSchema, type: z.literal("user") }).omit({ id: true }).shape
);
export type UserDoc = z.infer<typeof UserDocSchema>;
