import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cssDeclarationListSchema,
  cssSelectorListSchema,
  cssValueSchema,
  extraSelectorSchema,
  matchPatternSchema,
  regexSchema,
} from "./schemas.ts";

test("cssSelectorListSchema", async (t) => {
  await t.test("accepts a valid selector list", () => {
    assert.ok(cssSelectorListSchema.safeParse("div.result, a.url").success);
  });

  await t.test("rejects an invalid selector list", () => {
    assert.ok(!cssSelectorListSchema.safeParse("div..").success);
  });
});

test("cssDeclarationListSchema", async (t) => {
  await t.test("accepts a valid declaration list", () => {
    assert.ok(
      cssDeclarationListSchema.safeParse("color: red; display: none").success,
    );
  });

  await t.test("rejects an invalid declaration list", () => {
    assert.ok(!cssDeclarationListSchema.safeParse("color red").success);
  });
});

test("cssValueSchema", async (t) => {
  await t.test("accepts a valid value", () => {
    assert.ok(cssValueSchema.safeParse("16px").success);
  });
});

test("matchPatternSchema", async (t) => {
  await t.test("accepts a valid match pattern", () => {
    assert.ok(matchPatternSchema.safeParse("*://*.example.com/*").success);
  });

  await t.test("rejects an invalid match pattern", () => {
    assert.ok(!matchPatternSchema.safeParse("not a match pattern").success);
  });
});

test("regexSchema", async (t) => {
  await t.test("accepts a valid regular expression", () => {
    assert.ok(regexSchema.safeParse("ab+c").success);
  });

  await t.test("rejects an invalid regular expression", () => {
    assert.ok(!regexSchema.safeParse("(").success);
  });
});

test("extraSelectorSchema", async (t) => {
  await t.test("accepts a single selector with `&`", () => {
    assert.ok(extraSelectorSchema.safeParse("& + tr").success);
  });

  await t.test("accepts every selector having `&` in a list", () => {
    assert.ok(extraSelectorSchema.safeParse("& + tr, & + tr + tr").success);
  });

  await t.test("accepts `&` appearing anywhere in the selector", () => {
    assert.ok(
      extraSelectorSchema.safeParse(".header:has(+ &), & + .footer").success,
    );
  });

  await t.test("accepts a bare `&`", () => {
    assert.ok(extraSelectorSchema.safeParse("&").success);
  });

  await t.test(
    "accepts `&` at top level even when a nested selector lacks it",
    () => {
      assert.ok(extraSelectorSchema.safeParse(":has(.foo) + &").success);
    },
  );

  await t.test("rejects a selector without `&`", () => {
    assert.ok(!extraSelectorSchema.safeParse(".footer").success);
  });

  await t.test("rejects a list where one selector lacks `&`", () => {
    assert.ok(!extraSelectorSchema.safeParse("& + tr, .footer").success);
  });

  await t.test(
    "does not treat `&` inside an attribute value as nesting",
    () => {
      assert.ok(!extraSelectorSchema.safeParse("a[href='x&y']").success);
    },
  );

  await t.test("rejects an unparsable selector list", () => {
    assert.ok(!extraSelectorSchema.safeParse("&..").success);
  });

  await t.test("reports the missing `&` without a parse error", () => {
    const result = extraSelectorSchema.safeParse(".footer");
    assert.ok(!result.success);
    assert.deepEqual(
      result.error.issues.map((issue) => issue.message),
      ["Every selector in the list must contain the nesting selector '&'"],
    );
  });

  await t.test("reports only the parse error for an unparsable list", () => {
    const result = extraSelectorSchema.safeParse("&..");
    assert.ok(!result.success);
    assert.deepEqual(
      result.error.issues.map((issue) => issue.message),
      ["Invalid CSS selector list"],
    );
  });
});
