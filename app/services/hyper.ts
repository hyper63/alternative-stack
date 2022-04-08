import z from 'zod'
import { compose, omit, assoc } from 'ramda'
import invariant from 'tiny-invariant'

import { connect } from 'hyper-connect'

invariant(process.env.HYPER, "HYPER environment variable is required")

export const hyper = connect(process.env.HYPER as string)

export const DocSchema = z.object({
  _id: z.string(),
  type: z.enum(["note", "user", "password"]),
  createdAt: z.date(),
  updatedAt: z.date()
}).passthrough()

const toId = compose(
  omit(["_id"]),
  (doc) => assoc("id", doc._id || doc.id, doc) // use _id over id always
);

const toUnderscoreId = compose(
  omit(["id"]),
  (doc) => assoc("_id", doc._id || doc.id, doc) // use _id over id always
);

export const fromHyper = toId
export const toHyper = compose(
  doc => DocSchema.parse(doc),
  toUnderscoreId
)
