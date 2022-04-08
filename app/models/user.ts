import z from 'zod'

import { IdSchema } from './model';

export const UserSchema = z.object({
  id: IdSchema("user"),
  email: z.string(),
  notes: z.array(IdSchema("note"))
});
export type User = z.infer<typeof UserSchema>

export const PasswordSchema = z.object({
  password: z.string(),
  parent: IdSchema("user")
})
export type Password = z.infer<typeof PasswordSchema>
