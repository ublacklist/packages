import assert from "node:assert/strict";
import { test } from "node:test";
import { type ExecResult, type Props, Ruleset } from "./ruleset.ts";

function _test(ruleset: Ruleset, url: string, props?: Props): boolean {
  return ruleset.test({ url, ...(props && { props }) });
}

function exec(ruleset: Ruleset, url: string, props?: Props): ExecResult {
  return ruleset
    .exec({ url, ...(props && { props }) })
    .sort(({ lineNumber: a }, { lineNumber: b }) => a - b);
}

test("Ruleset", async (t) => {
  await t.test("Match patterns", () => {
    {
      const ruleset = new Ruleset("*://*/*");
      assert.ok(_test(ruleset, "https://example.com/"));
      assert.ok(_test(ruleset, "https://a.org/some/path"));
      assert.ok(!_test(ruleset, "ftp://ftp.example.org/"));
      assert.ok(!_test(ruleset, "file:///a/"));
    }
    {
      const ruleset = new Ruleset("*://*.mozilla.org/*");
      assert.ok(_test(ruleset, "http://mozilla.org/"));
      assert.ok(_test(ruleset, "https://mozilla.org/"));
      assert.ok(_test(ruleset, "http://a.mozilla.org"));
      assert.ok(_test(ruleset, "https://a.b.mozilla.org"));
      assert.ok(_test(ruleset, "https://b.mozilla.org/path"));
      assert.ok(!_test(ruleset, "ftp://mozilla.org/"));
      assert.ok(!_test(ruleset, "http://mozilla.com/"));
      assert.ok(!_test(ruleset, "http://firefox.org/"));
    }
    {
      const ruleset = new Ruleset("*://mozilla.org/");
      assert.ok(_test(ruleset, "http://mozilla.org/"));
      assert.ok(_test(ruleset, "https://mozilla.org/"));
      assert.ok(!_test(ruleset, "ftp://mozilla.org/"));
      assert.ok(!_test(ruleset, "http://a.mozilla.org"));
      assert.ok(!_test(ruleset, "http://mozilla.org/a"));
    }
    {
      const ruleset = new Ruleset("ftp://mozilla.org"); // not supported
      assert.ok(!_test(ruleset, "ftp://mozilla.org/"));
      assert.ok(!_test(ruleset, "http://mozilla.org/"));
      assert.ok(!_test(ruleset, "ftp://sub.mozilla.org/"));
      assert.ok(!_test(ruleset, "ftp://mozilla.org/path"));
    }
    {
      const ruleset = new Ruleset("https://*/path");
      assert.ok(_test(ruleset, "https://mozilla.org/path"));
      assert.ok(_test(ruleset, "https://a.mozilla.org/path"));
      assert.ok(_test(ruleset, "https://something.com/path"));
      assert.ok(!_test(ruleset, "http://mozilla.org/path"));
      assert.ok(!_test(ruleset, "https://mozilla.org/path/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/a"));
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/path?foo=1"));
    }
    {
      const ruleset = new Ruleset("https://*/path/");
      assert.ok(_test(ruleset, "https://mozilla.org/path/"));
      assert.ok(_test(ruleset, "https://a.mozilla.org/path/"));
      assert.ok(_test(ruleset, "https://something.com/path/"));
      assert.ok(!_test(ruleset, "http://mozilla.org/path/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/path"));
      assert.ok(!_test(ruleset, "https://mozilla.org/a"));
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/path/?foo=1"));
    }
    {
      const ruleset = new Ruleset("https://mozilla.org/*");
      assert.ok(_test(ruleset, "https://mozilla.org/"));
      assert.ok(_test(ruleset, "https://mozilla.org/path"));
      assert.ok(_test(ruleset, "https://mozilla.org/another"));
      assert.ok(_test(ruleset, "https://mozilla.org/path/to/doc"));
      assert.ok(_test(ruleset, "https://mozilla.org/path/to/doc?foo=1"));
      assert.ok(!_test(ruleset, "http://mozilla.org/path"));
      assert.ok(!_test(ruleset, "https://mozilla.com/path"));
    }
    {
      const ruleset = new Ruleset("https://mozilla.org/a/b/c/");
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/"));
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/#section1"));
    }
    {
      const ruleset = new Ruleset("https://mozilla.org/*/b/*/");
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/"));
      assert.ok(_test(ruleset, "https://mozilla.org/d/b/f/"));
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/d/"));
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/d/#section1"));
      assert.ok(_test(ruleset, "https://mozilla.org/a/b/c/d?foo=/"));
      assert.ok(
        _test(ruleset, "https://mozilla.org/a?foo=21314&bar=/b/&extra=c/"),
      );
      assert.ok(!_test(ruleset, "https://mozilla.org/b/*/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/a/b/"));
      assert.ok(!_test(ruleset, "https://mozilla.org/a/b/c/d/?foo=bar"));
    }
    // Invalid match patterns
    {
      const ruleset = new Ruleset("https://mozilla.org");
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
    }
    {
      const ruleset = new Ruleset("https://mozilla.*.org/");
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
      assert.ok(!_test(ruleset, "https://mozilla.a.org/"));
    }
    {
      const ruleset = new Ruleset("https://*zilla.org/");
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
    }
    {
      const ruleset = new Ruleset("http*://mozilla.org/");
      assert.ok(!_test(ruleset, "https://mozilla.org/"));
    }
    {
      const ruleset = new Ruleset("https://mozilla.org:80/");
      assert.ok(!_test(ruleset, "https://mozilla.org:80/"));
    }
    // Schemes and hosts are case-insensitive
    {
      const ruleset = new Ruleset("HTTPS://*.EXAMPLE.com/PATH/*");
      assert.ok(_test(ruleset, "https://example.com/PATH/"));
      assert.ok(_test(ruleset, "HTTPS://WWW.EXAMPLE.COM/PATH/TO/DIR"));
      assert.ok(!_test(ruleset, "https://example.com/path/"));
    }
  });

  await t.test("Regular expressions (legacy)", () => {
    {
      const ruleset = new Ruleset(String.raw`/example\.(net|org)/`);
      assert.ok(_test(ruleset, "https://example.net/"));
      assert.ok(_test(ruleset, "https://example.org/"));
      assert.ok(_test(ruleset, "http://example.com/?query=example.net"));
      assert.ok(!_test(ruleset, "ftp://example.net/"));
      assert.ok(!_test(ruleset, "http://example.com/"));
    }
    {
      const ruleset = new Ruleset(String.raw`url/example\.(net|org)/`);
      assert.ok(_test(ruleset, "https://example.net/"));
      assert.ok(!_test(ruleset, "https://example.com/"));
    }
    {
      const ruleset = new Ruleset("title/Example Domain/");
      assert.ok(
        _test(ruleset, "http://example.com", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com", {
          title: "This Is An Example Domain",
        }),
      );
      assert.ok(!_test(ruleset, "http://example.com"));
      assert.ok(
        !_test(ruleset, "http://example.com", { title: "example domain" }),
      );
    }
    {
      const ruleset = new Ruleset("t/example domain/i");
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(!_test(ruleset, "http://example.com/"));
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "example-domain" }),
      );
    }
    // https://ublacklist.github.io/docs/advanced-features#regular-expressions
    {
      const ruleset = new Ruleset(String.raw`/https:\/\/www\.qinterest\./`);
      assert.ok(_test(ruleset, "https://www.qinterest.com/"));
      assert.ok(_test(ruleset, "https://www.qinterest.jp/hoge"));
      assert.ok(!_test(ruleset, "http://www.qinterest.com/"));
      assert.ok(!_test(ruleset, "https://www.rinterest.com/"));
    }
    {
      const ruleset = new Ruleset(String.raw`/https?:\/\/([^/.]+\.)*?xn--/`);
      assert.ok(_test(ruleset, "http://xn--fsq.xn--zckzah/")); // http://例.テスト/
      assert.ok(!_test(ruleset, "http://example.test/"));
    }
  });

  await t.test("Simple expressions", () => {
    {
      const ruleset = new Ruleset('title="Example Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title = "Example Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title="example domain"i');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title = "example domain" I');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title^="Example"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(!_test(ruleset, "http://example.com/", { title: "Domain" }));
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title ^= "Example"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title^="Example"i');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title ^= "Example" I');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title$="Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(!_test(ruleset, "http://example.com/", { title: "Example" }));
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title $= "Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('$domain$="Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { $domain: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title$="domain"i');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title $= "domain" I');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title*="ple Dom"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title *= "ple Dom"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title*="PLE DOM"i');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('title *= "PLE DOM" I');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset("title=~/example/i");
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "Test Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset("title =~ /example/i");
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    // String literals
    {
      const ruleset = new Ruleset(
        String.raw`title="foo bar \xA9 \u00A9 \u{2F804} \0 \b \f \n \r \t \v \a"`,
      );
      assert.ok(
        _test(ruleset, "http://example.com/", {
          title: "foo bar \xA9 \u00A9 \u{2F804} \0 \b \f \n \r \t \v a",
        }),
      );
    }
    {
      const ruleset = new Ruleset(String.raw`title="foo bar \00"`);
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "foo bar \x000" }),
      );
    }
    {
      const ruleset = new Ruleset(String.raw`title="foo bar \xA"`);
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "foo bar \\xA" }),
      );
    }
    // Regular expression Literals
    // Escape sequence in class characters
    // https://github.com/iorate/ublacklist/issues/527
    {
      const ruleset = new Ruleset(String.raw`title=~/[\u3040-\u309F]/`);
      assert.ok(_test(ruleset, "http://example.com/", { title: "ひらがな" }));
      assert.ok(!_test(ruleset, "http://example.com/", { title: "カタカナ" }));
    }
    {
      const ruleset = new Ruleset(String.raw`title=~/[\u3040-\u309G]/`);
      assert.ok(!_test(ruleset, "http://example.com/", { title: "ひらがな" }));
    }
  });

  await t.test("Complex expressions", () => {
    {
      const ruleset = new Ruleset('(title="Example Domain")');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "example domain" }),
      );
    }
    {
      const ruleset = new Ruleset('( title = "Example Domain" )');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('!title="Example Domain"');
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('url*="example"&title="Example Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://something.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset('url*="example"|title="Example Domain"');
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        _test(ruleset, "http://something.com/", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { snippet: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://something.com/", { snippet: "Example Domain" }),
      );
    }
    // Precedence
    {
      const ruleset = new Ruleset(
        'url *= "example" | title ^= "Example" & title $= "Domain"',
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "example domain" }),
      );
      assert.ok(
        _test(ruleset, "http://something.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://something.com/", { snippet: "Example" }),
      );
    }
    // More complex expressions
    {
      const ruleset = new Ruleset(
        `a="1" & b^="2" | !(c$="3" & d*="4") | !!e=~/5/ & f=~/6/`,
      );
      assert.ok(_test(ruleset, "http://example.com/", { a: "1", b: "20" }));
      assert.ok(_test(ruleset, "http://example.com/", { a: "1", b: "3" }));
      assert.ok(
        !_test(ruleset, "http://example.com/", { a: "1", c: "3", d: "4" }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", {
          a: "1",
          b: "3",
          c: "3",
          d: "123567",
        }),
      );
      assert.ok(
        _test(ruleset, "http://example.com/", {
          a: "1",
          b: "3",
          c: "3",
          d: "4",
          e: "551",
          f: "169",
        }),
      );
      assert.ok(
        !_test(ruleset, "http://example.com/", {
          a: "1",
          b: "3",
          c: "3",
          d: "4",
          e: "551",
          f: "777",
        }),
      );
    }
  });

  await t.test("Unblock and highlight specifiers", () => {
    {
      const ruleset = new Ruleset("@*://example.com/*");
      assert.deepEqual(exec(ruleset, "https://example.com/"), [
        { lineNumber: 1, action: { type: "unblock" } },
      ]);
      assert.deepEqual(exec(ruleset, "https://example.net/"), []);
    }
    {
      const ruleset = new Ruleset(String.raw`@1 /example\.net/`);
      assert.deepEqual(exec(ruleset, "http://www.example.net/"), [
        { lineNumber: 1, action: { type: "highlight", colorNumber: 1 } },
      ]);
      assert.deepEqual(exec(ruleset, "http://www.example.com/"), []);
    }
    {
      const ruleset = new Ruleset("@10t/bar/i");
      assert.deepEqual(
        exec(ruleset, "http://example.com/", { title: "FOO BAR BAZ" }),
        [{ lineNumber: 1, action: { type: "highlight", colorNumber: 10 } }],
      );
      assert.deepEqual(
        exec(ruleset, "http://example.com/foo/bar/baz/", { title: "QUX QUUX" }),
        [],
      );
    }
    // Invalid highlight specifier
    {
      const ruleset = new Ruleset(String.raw`@ 1 /example\.net/`);
      assert.deepEqual(exec(ruleset, "http://www.example.net/"), []);
    }
  });

  await t.test("If specifier", () => {
    {
      const ruleset = new Ruleset("*://example.com/* @if(title=~/example/i)");
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.org/", { title: "Example Domain" }),
      );
      assert.ok(
        !_test(ruleset, "http://example.org/", { snippet: "Example Domain" }),
      );
    }
    {
      const ruleset = new Ruleset(
        "*://example.com/* @if( (title =~ /example/i) )",
      );
      assert.ok(
        _test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
    // Space is required before if specifier
    {
      const ruleset = new Ruleset("*://example.com/*@if(title=~/example/i)");
      assert.ok(
        !_test(ruleset, "http://example.com/", { title: "Example Domain" }),
      );
    }
  });

  await t.test("Multiple rules", () => {
    {
      const ruleset = new Ruleset(`*://example.com/*
@https://example.com/*
@1*://www.example.com/*
@2*://*.example.com/*
@3*://example.com/path
@4http://a.b.example.com/*
@5http://*.b.example.com/*/b/*/
*://example.com/*`);
      assert.deepEqual(exec(ruleset, "https://example.com/"), [
        { lineNumber: 1, action: { type: "block" } },
        { lineNumber: 2, action: { type: "unblock" } },
        { lineNumber: 4, action: { type: "highlight", colorNumber: 2 } },
        { lineNumber: 8, action: { type: "block" } },
      ]);
      assert.deepEqual(exec(ruleset, "http://www.example.com/path"), [
        { lineNumber: 3, action: { type: "highlight", colorNumber: 1 } },
        { lineNumber: 4, action: { type: "highlight", colorNumber: 2 } },
      ]);
      assert.deepEqual(exec(ruleset, "http://example.com/path"), [
        { lineNumber: 1, action: { type: "block" } },
        { lineNumber: 4, action: { type: "highlight", colorNumber: 2 } },
        { lineNumber: 5, action: { type: "highlight", colorNumber: 3 } },
        { lineNumber: 8, action: { type: "block" } },
      ]);
      assert.deepEqual(exec(ruleset, "http://a.b.example.com/a/b/c/"), [
        { lineNumber: 4, action: { type: "highlight", colorNumber: 2 } },
        { lineNumber: 6, action: { type: "highlight", colorNumber: 4 } },
        { lineNumber: 7, action: { type: "highlight", colorNumber: 5 } },
      ]);
      assert.deepEqual(exec(ruleset, "https://example.net/a/b/c/"), []);
    }
    {
      const ruleset = new Ruleset(String.raw`@3 /example\.com/
@2 u/example\.net/
@1 url/www\.example\.com/
@ t/example/
title/domain/i`);
      assert.deepEqual(
        exec(ruleset, "https://www.example.com", { title: "Example Domain" }),
        [
          { lineNumber: 1, action: { type: "highlight", colorNumber: 3 } },
          { lineNumber: 3, action: { type: "highlight", colorNumber: 1 } },
          { lineNumber: 5, action: { type: "block" } },
        ],
      );
      assert.deepEqual(
        exec(ruleset, "ftp://ftp.example.net", { title: "ftp example" }),
        [],
      );
    }
    {
      const ruleset = new Ruleset(String.raw`  *://*.example.com/*bar*
t/quux$/

# Invalid rule
example\.(net|org)

@2 /^HTTP:\/\//i
@https://example.com/*

# IPv4 address
/^https?:\/\/(\d{1,3}\.){3}\d{1,3}\//`);
      assert.deepEqual(exec(ruleset, "https://example.com/foobar"), [
        { lineNumber: 1, action: { type: "block" } },
        { lineNumber: 8, action: { type: "unblock" } },
      ]);
      assert.deepEqual(
        exec(ruleset, "http://www.example.com/hogefuga", { title: "qux quux" }),
        [
          { lineNumber: 2, action: { type: "block" } },
          { lineNumber: 7, action: { type: "highlight", colorNumber: 2 } },
        ],
      );
      assert.deepEqual(
        exec(ruleset, "https://127.0.0.1/hoge/fuga/", { title: "qux quux" }),
        [
          { lineNumber: 2, action: { type: "block" } },
          { lineNumber: 11, action: { type: "block" } },
        ],
      );
      assert.deepEqual(
        exec(ruleset, "ftp://127.0.0.1/", { title: "quux qux" }),
        [],
      );
    }
  });

  await t.test("Extension", () => {
    const ruleset = new Ruleset("");
    const url1 = "https://example.net/path";

    ruleset.extend("");
    assert.deepEqual(exec(ruleset, url1), []);

    ruleset.extend(String.raw`*://example.com/*
@https://example.net/*
  @1 /example\.edu/
*://*.net/*`);
    assert.deepEqual(exec(ruleset, url1), [
      { lineNumber: 2, action: { type: "unblock" } },
      { lineNumber: 4, action: { type: "block" } },
    ]);

    ruleset.extend("");
    assert.deepEqual(exec(ruleset, url1), [
      { lineNumber: 2, action: { type: "unblock" } },
      { lineNumber: 4, action: { type: "block" } },
    ]);

    ruleset.extend(`title/example/i
@2*://*.example.net/path*`);
    assert.deepEqual(exec(ruleset, url1), [
      { lineNumber: 2, action: { type: "unblock" } },
      { lineNumber: 4, action: { type: "block" } },
      { lineNumber: 6, action: { type: "highlight", colorNumber: 2 } },
    ]);

    const url2 = "https://example.com/";
    const props2 = { title: "**EXAMPLE**" };
    assert.deepEqual(exec(ruleset, url2, props2), [
      { lineNumber: 1, action: { type: "block" } },
      { lineNumber: 5, action: { type: "block" } },
    ]);

    ruleset.extend("@*://*/*");
    assert.deepEqual(exec(ruleset, url1), [
      { lineNumber: 2, action: { type: "unblock" } },
      { lineNumber: 4, action: { type: "block" } },
      { lineNumber: 6, action: { type: "highlight", colorNumber: 2 } },
      { lineNumber: 7, action: { type: "unblock" } },
    ]);
    assert.deepEqual(exec(ruleset, url2, props2), [
      { lineNumber: 1, action: { type: "block" } },
      { lineNumber: 5, action: { type: "block" } },
      { lineNumber: 7, action: { type: "unblock" } },
    ]);
  });
});
