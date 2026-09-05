import * as z from "zod";

import {
  createButtonCommandSchema,
  propertyCommandSchema,
  rootCommandSchema,
} from "./commands.ts";
import {
  extraSelectorSchema,
  matchPatternSchema,
  regexSchema,
} from "./schemas.ts";

const propNameSchema = z.string().regex(
  // Identifier { "$"? (@asciiLetter | "_") (@digit | @asciiLetter | "_")* }
  /^\$?[A-Za-z_][0-9A-Za-z_]*$/,
  "Invalid prop name",
);

export type ResultDescription = z.infer<
  ReturnType<typeof createResultDescriptionSchema>
>;

function createResultDescriptionSchema(strict: boolean) {
  const object = strict ? z.strictObject : z.object;
  return object({
    name: z.string().optional(),
    root: rootCommandSchema,
    url: propertyCommandSchema,
    props: z.record(propNameSchema, propertyCommandSchema).optional(),
    button: createButtonCommandSchema(strict).optional(),
    preserveSpace: z.boolean().optional(),
    extraSelector: extraSelectorSchema.optional(),
  });
}

export type SerpDescription = z.infer<
  ReturnType<typeof createSerpDescriptionSchema>
>;

function createSerpDescriptionSchema(strict: boolean) {
  const object = strict ? z.strictObject : z.object;
  const resultDescriptionSchema = createResultDescriptionSchema(strict);
  return object({
    name: z.string(),
    matches: matchPatternSchema.array(),
    excludeMatches: matchPatternSchema.array().optional(),
    includeRegex: regexSchema.optional(),
    excludeRegex: regexSchema.optional(),
    userAgent: z.enum(["any", "desktop", "mobile"]).optional(),
    results: strict
      ? resultDescriptionSchema.array()
      : resultDescriptionSchema
          .nullable()
          .catch(() => null)
          .array()
          .transform((results) => results.filter((result) => result != null)),
    commonProps: z.record(propNameSchema, z.string()).optional(),
    delay: z.boolean().or(z.number()).optional(),
  });
}

export type SerpInfo = z.infer<ReturnType<typeof createSerpInfoSchema>>;

function createSerpInfoSchema(strict: boolean) {
  const object = strict ? z.strictObject : z.object;

  const personSchema = z.string().or(
    object({
      name: z.string(),
      email: z.email().optional(),
      url: z.url().optional(),
    }),
  );

  // https://github.com/colinhacks/zod/issues/61
  const bugsSchema = z
    .url()
    .or(object({ url: z.url(), email: z.email() }))
    .or(object({ url: z.url(), email: z.undefined() }))
    .or(object({ url: z.undefined(), email: z.email() }));

  return object({
    SERPINFO_VERSION: z.literal("1.0").optional(),

    // Inspired by package.json
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
    homepage: z.url().optional(),
    bugs: bugsSchema.optional(),
    license: z.string().optional(),
    author: personSchema.optional(),
    contributors: personSchema.array().optional(),

    lastModified: z.iso.datetime().optional(),
    pages: createSerpDescriptionSchema(strict).array(),
  });
}

export const serpInfoSchema = createSerpInfoSchema(false);

export const serpInfoStrictSchema = createSerpInfoSchema(true);
