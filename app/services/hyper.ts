import type { z, ZodSchema } from "zod";
import { compose, omit, assoc } from "ramda";

import { connect } from "hyper-connect";

import { DocSchema } from "./models/model";

if (!process.env.HYPER) {
  throw new Error("HYPER environment variable is required");
}

const toId = compose(omit(["_id"]), (doc) => assoc("id", doc._id, doc));
const toUnderscoreId = compose(omit(["id"]), (o) => assoc("_id", o.id, o));

export const hyper = connect(process.env.HYPER as string);

/**
 * - _id -> id
 * - remove type field
 */
const _fromHyper: any = compose(omit(["type"]), toId);
// take an additional schema and further parse the object
_fromHyper.as = (schema: ZodSchema) => compose((o) => schema.parse(o), _fromHyper);

/**
 * - id -> _id
 * - set createdAt if not set
 * - set updatedAt to now
 * - parse to ensure doc has all required fields
 */
const _toHyper: any = compose(
  // ensure all required fields are present
  (model) => DocSchema.parse(model),
  assoc("updatedAt", new Date()),
  (model) => assoc("createdAt", model.createdAt || new Date(), model),
  toUnderscoreId
);
// take an additional schema and further parse the document
_toHyper.as = (docSchema: ZodSchema) => compose((doc) => docSchema.parse(doc), toHyper);

export const fromHyper: {
  (o: any): z.infer<typeof DocSchema>;
  as: <s extends ZodSchema>(schema: s) => (o: any) => ReturnType<s["parse"]>;
} = _fromHyper;

export const toHyper: {
  (o: any): z.infer<typeof DocSchema>;
  as: <ds extends ZodSchema>(docSchema: ds) => (o: any) => ReturnType<ds["parse"]>;
} = _toHyper;
