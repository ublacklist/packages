# @ublacklist/packages

A monorepo of packages extracted from the [uBlacklist](https://github.com/iorate/ublacklist) browser extension.

## Packages

| Package                                                    | Description                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| [@ublacklist/match-pattern](packages/match-pattern#readme) | A parser and lookup map for WebExtensions match patterns. |
| [@ublacklist/ruleset](packages/ruleset#readme)             | The ruleset format definition and parser.                 |
| [@ublacklist/serpinfo](packages/serpinfo#readme)           | The SERPINFO format definition, parser, and schemas.      |

## Development

```shell
# Install dependencies (pnpm >= 10 required)
pnpm install

# Build all packages
pnpm build

# Run all checks (biome, prettier, typescript)
pnpm check

# Run tests
pnpm test

# Fix linting/formatting issues
pnpm fix
```

## License

[MIT](LICENSE)
