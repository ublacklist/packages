---
"@ublacklist/ruleset": patch
"@ublacklist/serpinfo": patch
---

Import zod as a namespace (`import * as z from "zod"`) instead of the named `z` export, so that esbuild can tree-shake unused parts of zod from consumers' bundles.
