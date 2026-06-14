import assert from "node:assert";
import { test } from "node:test";
import { parse } from "./index.ts";

test("parse", async (t) => {
  await t.test("parses a valid SERPINFO document", () => {
    const result = parse(`
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results:
      - root: div.result
        url: a.url
        props:
          title: h3
`);
    assert.ok(result.success);
    assert.strictEqual(result.data.name, "Example");
    assert.strictEqual(result.data.pages.length, 1);
    assert.deepStrictEqual(result.data.pages[0]?.matches, [
      "*://*.example.com/*",
    ]);
    assert.strictEqual(result.data.pages[0]?.results[0]?.url, "a.url");
  });

  await t.test("reports a YAML syntax error", () => {
    const result = parse("name: Example\n\tpages: []");
    assert.ok(!result.success);
    assert.strictEqual(typeof result.error, "string");
  });

  await t.test("reports a schema validation error", () => {
    const result = parse("name: Example");
    assert.ok(!result.success);
    assert.strictEqual(typeof result.error, "string");
  });

  await t.test("rejects an invalid match pattern", () => {
    const result = parse(`
name: Example
pages:
  - name: example
    matches:
      - "not a match pattern"
    results: []
`);
    assert.ok(!result.success);
  });

  await t.test("drops an invalid result in non-strict mode", () => {
    const result = parse(`
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results:
      - {}
`);
    assert.ok(result.success);
    assert.deepStrictEqual(result.data.pages[0]?.results, [null]);
  });

  await t.test("rejects an invalid result in strict mode", () => {
    const result = parse(
      `
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results:
      - {}
`,
      { strict: true },
    );
    assert.ok(!result.success);
  });
});
