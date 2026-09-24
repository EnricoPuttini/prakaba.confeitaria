import { z } from "zod";

const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

export const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).optional(),
);

export const optionalNonNegativeInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional(),
);

export const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

export const optionalText = z.preprocess(emptyToUndefined, z.string().trim().optional());
