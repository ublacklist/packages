# @ublacklist/serpinfo

## 1.0.1

### Patch Changes

- a83f7f5: Stop exporting the internal zod schemas (`*CommandSchema`, `serpInfoSchema`, `serpInfoStrictSchema`). Consumers only need the `parse` function and the exported types; the schemas are now an internal implementation detail.

## 1.0.0

### Major Changes

- eca4c9b: Add @ublacklist/serpinfo, the SERPINFO format definition, parser, and schemas extracted from the uBlacklist extension.
