---
"@ublacklist/serpinfo": major
---

Reject unknown keys in strict mode. `parse(input, { strict: true })` now fails on properties that the SERPINFO specification does not define, at every level of the document (top level, page definitions, result definitions, and button command options), so misspelled property names are reported instead of being silently ignored. Non-strict parsing is unchanged and still ignores unknown keys.
