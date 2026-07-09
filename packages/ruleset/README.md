# @ublacklist/ruleset

The ruleset format definition and parser for [uBlacklist](https://github.com/iorate/ublacklist).

## Installation

```shell
npm install @ublacklist/ruleset
```

## Usage

```typescript
import { Ruleset } from "@ublacklist/ruleset";

const ruleset = new Ruleset(`
*://*.example.com/*
@1 title=~/sponsored/i
`);

ruleset.test({ url: "https://www.example.com/" }); // true
ruleset.test({ url: "https://www.example.net/" }); // false
```

## Documentation

See the [ruleset specification](https://github.com/ublacklist/packages/blob/main/packages/ruleset/docs/spec.md) for the full syntax.

## License

[MIT](https://github.com/ublacklist/packages/blob/main/LICENSE)
