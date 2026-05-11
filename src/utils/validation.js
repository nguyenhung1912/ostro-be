import mongoose from "mongoose";

export const isValidObjectId = (value) => mongoose.isValidObjectId(value);

export const areValidObjectIds = (values) =>
  Array.isArray(values) &&
  values.every((value) => mongoose.isValidObjectId(value));
