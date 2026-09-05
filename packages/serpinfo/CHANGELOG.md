# @ublacklist/serpinfo

## 3.0.0

### Major Changes

- Drop invalid result definitions from `results` in non-strict mode instead of replacing them with `null`. `SerpDescription["results"]` is now `ResultDescription[]`, and the `SerpInfoStrict` type, which no longer differs from `SerpInfo`, has been removed.

- Reject unknown keys in strict mode. `parse(input, { strict: true })` now fails on properties that the SERPINFO specification does not define, at every level of the document (top level, page definitions, result definitions, and button command options), so misspelled property names are reported instead of being silently ignored. Non-strict parsing is unchanged and still ignores unknown keys.

### Patch Changes

- Import zod as a namespace (`import * as z from "zod"`) instead of the named `z` export, so that esbuild can tree-shake unused parts of zod from consumers' bundles.

## 2.0.0

### Major Changes

- d7a672c: Declare the removal of the internal zod schemas (`*CommandSchema`, `serpInfoSchema`, `serpInfoStrictSchema`) as a breaking change. They were removed in v1.0.1, which should have been a major release. v2.0.0 is identical to v1.1.1 in code; use the `parse` function and the exported types instead of the schemas.

### Patch Changes

- Updated dependencies [d7a672c]
- Updated dependencies [d7a672c]
  - @ublacklist/match-pattern@2.0.0

## 1.1.1

### Patch Changes

- 343e8f4: Update js-yaml to v5. Switch to a namespace import since js-yaml v5 no longer provides a default export. Behavior is unchanged.

## 1.1.0

### Minor Changes

- 0719942: Add an optional `extraSelector` field to a result definition. It takes a CSS selector list where every top-level selector must reference the result root via the nesting selector `&`, validated with css-tree.

## 1.0.1

### Patch Changes

- a83f7f5: Stop exporting the internal zod schemas (`*CommandSchema`, `serpInfoSchema`, `serpInfoStrictSchema`). Consumers only need the `parse` function and the exported types; the schemas are now an internal implementation detail.

## 1.0.0

### Major Changes

- eca4c9b: Add @ublacklist/serpinfo, the SERPINFO format definition, parser, and schemas extracted from the uBlacklist extension.
