import { parseMatchPattern } from "@ublacklist/match-pattern";
import * as csstree from "css-tree";
import { z } from "zod";

function parseCss(value: string, context: string): csstree.CssNode | null {
  try {
    let ok = true;
    const ast = csstree.parse(value, {
      context,
      onParseError() {
        ok = false;
      },
    });
    return ok ? ast : null;
  } catch {
    return null;
  }
}

function cssSchema(context: string, message: string) {
  return z
    .string()
    .refine((value) => parseCss(value, context) != null, message);
}

export const cssSelectorListSchema = cssSchema(
  "selectorList",
  "Invalid CSS selector list",
);

export const extraSelectorSchema = z.string().superRefine((value, ctx) => {
  const ast = parseCss(value, "selectorList");
  if (ast == null || ast.type !== "SelectorList") {
    ctx.addIssue({
      code: "custom",
      message: "Invalid CSS selector list",
      fatal: true,
    });
    return;
  }
  const everyTopLevelHasNesting = !ast.children.some(
    (selector) =>
      csstree.find(selector, (node) => node.type === "NestingSelector") == null,
  );
  if (!everyTopLevelHasNesting) {
    ctx.addIssue({
      code: "custom",
      message:
        "Every selector in the list must contain the nesting selector '&'",
    });
  }
});

export const cssDeclarationListSchema = cssSchema(
  "declarationList",
  "Invalid CSS declaration list",
);

export const cssValueSchema = cssSchema("value", "Invalid CSS value");

export const matchPatternSchema = z
  .string()
  .refine((value) => parseMatchPattern(value) != null, "Invalid match pattern");

export const regexSchema = z.string().refine((value) => {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}, "Invalid regular expression");
