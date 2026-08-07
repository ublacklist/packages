---
"@ublacklist/match-pattern": major
---

Declare the removal of `matchPatternTest` as a breaking change. It was removed in v1.2.0, which should have been a major release. v2.0.0 is identical to v1.2.0 in code; if you are upgrading from v1.1.x, replace `matchPatternTest(pattern, url)` with `new MatchPattern([pattern]).test(url)`.
