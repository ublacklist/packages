---
"@ublacklist/serpinfo": patch
---

Stop exporting the internal zod schemas (`*CommandSchema`, `serpInfoSchema`, `serpInfoStrictSchema`). Consumers only need the `parse` function and the exported types; the schemas are now an internal implementation detail.
