---
name: ublacklist-serpinfo
description: Write or modify SERPINFO YAML files that describe how the uBlacklist browser extension parses a search engine's result pages (SERPs). Use when adding uBlacklist support for a search engine or fixing a broken SERP definition.
license: MIT
---

# uBlacklist SERPINFO authoring

A SERPINFO file is a YAML document that tells uBlacklist how to find results on a search engine's pages and where to place block buttons.

Read [spec.md](spec.md) for the complete format before writing or reviewing a SERPINFO file.

## Workflow

1. Inspect the SERP's DOM to find a stable CSS selector for each result's root element, its link, and its title.
2. Define a page entry per SERP category (web, images, news, ...) with `matches` patterns for its URLs.
3. In each result definition, set `root`, `url`, and `props.title`; commands beyond bare CSS selectors (`upward`, `attribute`, `regexSubstitute`, `or`, ...) handle harder layouts.
4. Set `commonProps` with `$site` and `$category` so users can target the engine and category from ruleset expressions.
5. Add a `button` command if the default block-button placement does not fit the layout.

## Validation

The [`@ublacklist/serpinfo`](https://www.npmjs.com/package/@ublacklist/serpinfo) npm package provides the parser and schemas for programmatic validation.
