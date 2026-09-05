import assert from "node:assert/strict";
import { test } from "node:test";

import { parse } from "./parse.ts";

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
    assert.equal(result.data.name, "Example");
    assert.equal(result.data.pages.length, 1);
    assert.deepEqual(result.data.pages[0]?.matches, ["*://*.example.com/*"]);
    assert.equal(result.data.pages[0]?.results[0]?.url, "a.url");
  });

  await t.test("reports a YAML syntax error", () => {
    const result = parse("name: Example\n\tpages: []");
    assert.ok(!result.success);
    assert.equal(typeof result.error, "string");
  });

  await t.test("reports a schema validation error", () => {
    const result = parse("name: Example");
    assert.ok(!result.success);
    assert.equal(typeof result.error, "string");
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
      - root: div.result
        url: a.url
`);
    assert.ok(result.success);
    assert.deepEqual(result.data.pages[0]?.results, [
      { root: "div.result", url: "a.url" },
    ]);
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

  await t.test("ignores unknown keys in non-strict mode", () => {
    const result = parse(`
name: Example
unknownKey: true
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    unknownKey: true
    results:
      - root: div.result
        url: a.url
        unknownKey: true
        button: ["inset", { unknownKey: true }]
`);
    assert.ok(result.success);
    assert.ok(!("unknownKey" in result.data));
  });

  await t.test("rejects unknown keys in strict mode", () => {
    for (const input of [
      `
name: Example
unknownKey: true
pages: []
`,
      `
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    unknownKey: true
    results: []
`,
      `
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results:
      - root: div.result
        url: a.url
        unknownKey: true
`,
      `
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results:
      - root: div.result
        url: a.url
        button: ["inset", { unknownKey: true }]
`,
    ]) {
      const result = parse(input, { strict: true });
      assert.ok(!result.success);
      assert.match(result.error, /Unrecognized key: "unknownKey"/);
    }
  });
});
