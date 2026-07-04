# @ublacklist/ruleset

## 1.0.3

### Patch Changes

- 343e8f4: Update js-yaml to v5. Switch to a namespace import since js-yaml v5 no longer provides a default export. Behavior is unchanged.

## 1.0.2

### Patch Changes

- 9ffdd7d: Encode block as `1` (the default value) and highlight as a negative value, matching uBlacklist's original value encoding. This shortens the serialized JSON for block rules with expressions.

## 1.0.1

### Patch Changes

- 5698c34: Export `bodyParser`, the configured parser for ruleset bodies.

## 1.0.0

### Major Changes

- 3e21585: Add @ublacklist/ruleset, the ruleset format definition and parser extracted from the uBlacklist extension.
