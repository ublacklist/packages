---
"@ublacklist/serpinfo": major
---

Drop invalid result definitions from `results` in non-strict mode instead of replacing them with `null`. `SerpDescription["results"]` is now `ResultDescription[]`, and the `SerpInfoStrict` type, which no longer differs from `SerpInfo`, has been removed.
