# @ublacklist/serpinfo

The SERPINFO format definition, parser, and schemas for [uBlacklist](https://github.com/iorate/ublacklist).

## Installation

```shell
npm install @ublacklist/serpinfo
```

## Usage

```typescript
import { parse } from "@ublacklist/serpinfo";

const result = parse(`
name: Example
pages:
  - name: example
    matches:
      - "*://*.example.com/*"
    results: []
`);

if (result.success) {
  console.log(result.data.name); // "Example"
} else {
  console.error(result.error);
}
```

## Documentation

See the [SERPINFO specification](https://github.com/ublacklist/packages/blob/main/packages/serpinfo/docs/spec.md) for the full format.

## License

[MIT](https://github.com/ublacklist/packages/blob/main/LICENSE)
