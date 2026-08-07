---
"@ublacklist/serpinfo": major
---

Declare the removal of the internal zod schemas (`*CommandSchema`, `serpInfoSchema`, `serpInfoStrictSchema`) as a breaking change. They were removed in v1.0.1, which should have been a major release. v2.0.0 is identical to v1.1.1 in code; use the `parse` function and the exported types instead of the schemas.
