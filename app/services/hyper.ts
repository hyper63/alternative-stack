import { ZodSchema } from "zod";
import { compose, omit, assoc } from "ramda";

import { connect } from "hyper-connect";

import { DocSchema } from "./models/model";

if (!process.env.HYPER) {
  throw new Error("HYPER environment variable is required");
}

const toId = compose(omit(["_id"]), (doc) => assoc("id", doc._id, doc));

const toUnderscoreId = compose(omit(["id"]), (o) => assoc("_id", o.id, o));

export const hyper = connect(process.env.HYPER as string);

export const fromHyper = <s extends ZodSchema = ZodSchema>(schema: s) =>
  compose((doc) => schema.parse(doc), toId);

export const toHyper = compose(
  // ensure all required fields are present
  (model) => DocSchema.parse(model),
  // update updatedAt
  assoc("updatedAt", new Date()),
  // upsert createdAt
  (model) => assoc("createdAt", model.createdAt || new Date(), model),
  toUnderscoreId
);
