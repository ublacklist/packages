import assert from "node:assert/strict";
import { test } from "node:test";
import { MatchPatternMap } from "./index.ts";

function get(map: MatchPatternMap<number>, url: string) {
  return map.get(url).sort();
}

test("MatchPatternMap", async (t) => {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
  await t.test("MDN Examples", () => {
    const map = new MatchPatternMap<number>();
    map.set("<all_urls>", 0);
    map.set("*://*/*", 1);
    map.set("*://*.mozilla.org/*", 2);
    map.set("*://mozilla.org/", 3);
    assert.throws(() => map.set("ftp://mozilla.org/", 4));
    map.set("https://*/path", 5);
    map.set("https://*/path/", 6);
    map.set("https://mozilla.org/*", 7);
    map.set("https://mozilla.org/a/b/c/", 8);
    map.set("https://mozilla.org/*/b/*/", 9);
    assert.throws(() => map.set("file:///blah/*", 10));
    // <all_urls>
    assert.deepEqual(get(map, "http://example.org/"), [0, 1]);
    assert.deepEqual(get(map, "https://a.org/some/path/"), [0, 1]);
    assert.deepEqual(get(map, "ws://sockets.somewhere.org/"), []);
    assert.deepEqual(get(map, "wss://ws.example.com/stuff/"), []);
    assert.deepEqual(get(map, "ftp://files.somewhere.org/"), []);
    assert.deepEqual(get(map, "resource://a/b/c/"), []);
    assert.deepEqual(get(map, "ftps://files.somewhere.org/"), []);
    // *://*/*
    assert.deepEqual(get(map, "http://example.org/"), [0, 1]);
    assert.deepEqual(get(map, "https://a.org/some/path/"), [0, 1]);
    assert.deepEqual(get(map, "ws://sockets.somewhere.org/"), []);
    assert.deepEqual(get(map, "wss://ws.example.com/stuff/"), []);
    assert.deepEqual(get(map, "ftp://ftp.example.org/"), []);
    assert.deepEqual(get(map, "file:///a/"), []);
    // *://*.mozilla.org/*
    assert.deepEqual(get(map, "http://mozilla.org/"), [0, 1, 2, 3]);
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "http://a.mozilla.org/"), [0, 1, 2]);
    assert.deepEqual(get(map, "http://a.b.mozilla.org/"), [0, 1, 2]);
    assert.deepEqual(get(map, "https://b.mozilla.org/path/"), [0, 1, 2, 6]);
    assert.deepEqual(get(map, "ws://ws.mozilla.org/"), []);
    assert.deepEqual(get(map, "wss://secure.mozilla.org/something"), []);
    assert.deepEqual(get(map, "ftp://mozilla.org/"), []);
    assert.deepEqual(get(map, "http://mozilla.com/"), [0, 1]);
    assert.deepEqual(get(map, "http://firefox.org/"), [0, 1]);
    // *://mozilla.org/
    assert.deepEqual(get(map, "http://mozilla.org/"), [0, 1, 2, 3]);
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "ws://mozilla.org/"), []);
    assert.deepEqual(get(map, "wss://mozilla.org/"), []);
    assert.deepEqual(get(map, "ftp://mozilla.org/"), []);
    assert.deepEqual(get(map, "http://a.mozilla.org/"), [0, 1, 2]);
    assert.deepEqual(get(map, "http://mozilla.org/a"), [0, 1, 2]);
    // ftp://mozilla.org/
    assert.deepEqual(get(map, "ftp://mozilla.org/"), []);
    assert.deepEqual(get(map, "http://mozilla.org/"), [0, 1, 2, 3]);
    assert.deepEqual(get(map, "ftp://sub.mozilla.org/"), []);
    assert.deepEqual(get(map, "ftp://mozilla.org/path"), []);
    // https://*/path
    assert.deepEqual(get(map, "https://mozilla.org/path"), [0, 1, 2, 5, 7]);
    assert.deepEqual(get(map, "https://a.mozilla.org/path"), [0, 1, 2, 5]);
    assert.deepEqual(get(map, "https://something.com/path"), [0, 1, 5]);
    assert.deepEqual(get(map, "http://mozilla.org/path"), [0, 1, 2]);
    assert.deepEqual(get(map, "https://mozilla.org/path/"), [0, 1, 2, 6, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/a"), [0, 1, 2, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/path?foo=1"), [0, 1, 2, 7]);
    // https://*/path/
    assert.deepEqual(get(map, "http://mozilla.org/path/"), [0, 1, 2]);
    assert.deepEqual(get(map, "https://a.mozilla.org/path/"), [0, 1, 2, 6]);
    assert.deepEqual(get(map, "https://something.com/path/"), [0, 1, 6]);
    assert.deepEqual(get(map, "http://mozilla.org/path/"), [0, 1, 2]);
    assert.deepEqual(get(map, "https://mozilla.org/path"), [0, 1, 2, 5, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/a"), [0, 1, 2, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/path?foo=1"), [0, 1, 2, 7]);
    // https://mozilla.org/*
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/path"), [0, 1, 2, 5, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/another"), [0, 1, 2, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/path/to/doc"), [0, 1, 2, 7]);
    assert.deepEqual(
      get(map, "https://mozilla.org/path/to/doc?foo=1"),
      [0, 1, 2, 7],
    );
    // https://mozilla.org/a/b/c/
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/"),
      [0, 1, 2, 7, 8, 9],
    );
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/#section1"),
      [0, 1, 2, 7, 8, 9],
    );
    // https://mozilla.org/*/b/*/
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/"),
      [0, 1, 2, 7, 8, 9],
    );
    assert.deepEqual(get(map, "https://mozilla.org/d/b/f/"), [0, 1, 2, 7, 9]);
    assert.deepEqual(get(map, "https://mozilla.org/a/b/c/d/"), [0, 1, 2, 7, 9]);
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/d/#section1"),
      [0, 1, 2, 7, 9],
    );
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/d/?foo=/"),
      [0, 1, 2, 7, 9],
    );
    assert.deepEqual(
      get(map, "https://mozilla.org/a?foo=21314&bar=/b/&extra=c/"),
      [0, 1, 2, 7, 9],
    );
    assert.deepEqual(get(map, "https://mozilla.org/b/*/"), [0, 1, 2, 7]);
    assert.deepEqual(get(map, "https://mozilla.org/a/b/"), [0, 1, 2, 7]);
    assert.deepEqual(
      get(map, "https://mozilla.org/a/b/c/d/?foo=bar"),
      [0, 1, 2, 7],
    );
    // file:///blah/*
    assert.deepEqual(get(map, "file:///blah/"), []);
    assert.deepEqual(get(map, "file:///blah/bleh"), []);
    assert.deepEqual(get(map, "file:///bleh/"), []);
    // Invalid match patterns
    assert.throws(() => map.set("resource://path/", 11));
    assert.throws(() => map.set("https://mozilla.org", 12));
    assert.throws(() => map.set("https://mozilla.*.org/", 13));
    assert.throws(() => map.set("https://*zilla.org", 14));
    assert.throws(() => map.set("http*://mozilla.org/", 15));
    assert.throws(() => map.set("https://mozilla.org:80/", 16));
    assert.throws(() => map.set("*//*", 17));
    assert.throws(() => map.set("file://*", 18));
  });

  await t.test("Serialization", () => {
    let map = new MatchPatternMap<number>();
    map.set("<all_urls>", 0);
    map.set("*://*/*", 1);
    map.set("*://*.mozilla.org/*", 2);
    map.set("*://mozilla.org/", 3);
    map.set("https://*/path", 5);
    map.set("https://*/path/", 6);
    map.set("https://mozilla.org/*", 7);
    map.set("https://mozilla.org/a/b/c/", 8);
    map.set("https://mozilla.org/*/b/*/", 9);
    const json = map.toJSON();
    assert.equal(
      JSON.stringify(json),
      '[[0],[[],[[1],[5,"https","/path"],[6,"https","/path/"]],{"org":[[],[],{"mozilla":[[[3,"*","/"],[7,"https"],[8,"https","/a/b/c/"],[9,"https","/*/b/*/"]],[[2]]]}]}]]',
    );
    map = new MatchPatternMap(json);
    assert.deepEqual(get(map, "http://mozilla.org/"), [0, 1, 2, 3]);
    assert.deepEqual(get(map, "https://mozilla.org/"), [0, 1, 2, 3, 7]);
    assert.deepEqual(get(map, "http://a.mozilla.org/"), [0, 1, 2]);
    assert.deepEqual(get(map, "http://a.b.mozilla.org/"), [0, 1, 2]);
    assert.deepEqual(get(map, "https://b.mozilla.org/path/"), [0, 1, 2, 6]);
  });
});
