---
"@ublacklist/ruleset": major
---

Declare the serialization encoding change as a breaking change. v1.0.2 changed how block and highlight rules are encoded in serialized JSON (block as `1`, highlight as a negative value), which should have been a major release. v2.0.0 is identical to v1.0.3 in code.
