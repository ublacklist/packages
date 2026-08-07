---
name: ublacklist-ruleset
description: Write, review, or debug rulesets for the uBlacklist browser extension — rules that block, unblock, or highlight search results by URL, title, or SERP context. Use when authoring rules or ruleset subscriptions for uBlacklist.
license: MIT
---

# uBlacklist ruleset authoring

A ruleset is a newline-separated list of rules. Each rule blocks, unblocks (`@` prefix), or highlights (`@N` prefix) search results.

Read [spec.md](spec.md) for the complete syntax before writing or reviewing rules.

## Quick reference

- Prefer a match pattern for simple host/path blocks: `*://*.example.com/*`. `*` may not appear in the middle of a host.
- Use an expression to match titles, URL parts, or SERP context: `title *= "spam" i`, `$site = "google" & host = "youtube.com"`.
- Regular expressions must be JavaScript regex literals surrounded by `/`, with inner `/` escaped: `/example\.(net|org)/`.
- Scope a match pattern with a guard: `*://*.amazon.com/* @if($category="images")`.
- Comment with `#`; inline trailing comments are allowed.
- A ruleset published as a subscription may start with YAML frontmatter; set the `name` field.

## Validation

Rules can be parsed programmatically with the [`@ublacklist/ruleset`](https://www.npmjs.com/package/@ublacklist/ruleset) npm package. Unparseable lines are ignored by uBlacklist rather than reported as errors, so double-check syntax against spec.md.
