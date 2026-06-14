import { z } from "zod";
import { discriminatedTupleUnion } from "./discriminated-tuple-union.ts";
import {
  cssDeclarationListSchema,
  cssSelectorListSchema,
  cssValueSchema,
  regexSchema,
} from "./schemas.ts";

/* Element Commands */

export type ElementCommand =
  | ["selector", string, (ElementCommand | undefined)?]
  | ["upward", number | string, (ElementCommand | undefined)?]
  | string;

export const elementCommandSchema: z.ZodType<ElementCommand> =
  discriminatedTupleUnion([
    z.tuple([
      z.literal("selector"),
      cssSelectorListSchema,
      z.lazy(() => elementCommandSchema).optional(),
    ]),
    z.tuple([
      z.literal("upward"),
      z.number().or(z.string()),
      z.lazy(() => elementCommandSchema).optional(),
    ]),
  ]).or(cssSelectorListSchema);

/* Root Commands */

export type RootCommand =
  | ["selector", string]
  | ["upward", number | string, RootCommand]
  | string;

export const rootCommandSchema: z.ZodType<RootCommand> =
  discriminatedTupleUnion([
    z.tuple([z.literal("selector"), cssSelectorListSchema]),
    z.tuple([
      z.literal("upward"),
      z.number().or(z.string()),
      z.lazy(() => rootCommandSchema).nonoptional(),
    ]),
  ]).or(cssSelectorListSchema);

/* Proprety Commands */

export type PropertyCommand =
  | ["attribute", string, (ElementCommand | undefined)?]
  | ["const", string]
  | ["domainToURL", PropertyCommand]
  | ["or", PropertyCommand[], (ElementCommand | undefined)?]
  | ["property", string, (ElementCommand | undefined)?]
  | ["regexExclude", string, PropertyCommand]
  | ["regexInclude", string, PropertyCommand]
  | ["regexSubstitute", string, string, PropertyCommand]
  | string;

export const propertyCommandSchema: z.ZodType<PropertyCommand> =
  discriminatedTupleUnion([
    z.tuple([
      z.literal("attribute"),
      z.string(),
      elementCommandSchema.optional(),
    ]),
    z.tuple([z.literal("const"), z.string()]),
    z.tuple([
      z.literal("domainToURL"),
      z.lazy(() => propertyCommandSchema).nonoptional(),
    ]),
    z.tuple([
      z.literal("or"),
      z.lazy(() => propertyCommandSchema).array(),
      elementCommandSchema.optional(),
    ]),
    z.tuple([
      z.literal("property"),
      z.string(),
      elementCommandSchema.optional(),
    ]),
    z.tuple([
      z.literal("regexExclude"),
      regexSchema,
      z.lazy(() => propertyCommandSchema).nonoptional(),
    ]),
    z.tuple([
      z.literal("regexInclude"),
      regexSchema,
      z.lazy(() => propertyCommandSchema).nonoptional(),
    ]),
    z.tuple([
      z.literal("regexSubstitute"),
      regexSchema,
      z.string(),
      z.lazy(() => propertyCommandSchema).nonoptional(),
    ]),
  ]).or(cssSelectorListSchema);

/* Button Commands */

export type ButtonCommand = z.infer<typeof buttonCommandSchema>;

export const buttonCommandSchema = discriminatedTupleUnion([
  z.tuple([
    z.literal("icon"),
    z.object({ style: cssDeclarationListSchema.optional() }).optional(),
    elementCommandSchema.optional(),
  ]),
  z.tuple([
    z.literal("inset"),
    z
      .object({
        top: cssValueSchema.or(z.literal(0)).optional(),
        right: cssValueSchema.or(z.literal(0)).optional(),
        bottom: cssValueSchema.or(z.literal(0)).optional(),
        left: cssValueSchema.or(z.literal(0)).optional(),
        zIndex: cssValueSchema.or(z.number().int()).optional(),
      })
      .optional(),
    elementCommandSchema.optional(),
  ]),
  z.tuple([
    z.literal("text"),
    z
      .object({
        position: z
          .enum(["afterbegin", "afterend", "beforebegin", "beforeend"])
          .optional(),
        style: cssDeclarationListSchema.optional(),
      })
      .optional(),
    elementCommandSchema.optional(),
  ]),
]);
