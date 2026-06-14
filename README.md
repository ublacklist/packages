# @ublacklist/packages

A monorepo of packages extracted from the [uBlacklist](https://github.com/iorate/ublacklist) browser extension.

## Packages

| Package                                                    | Description                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| [@ublacklist/match-pattern](packages/match-pattern#readme) | A parser and lookup map for WebExtensions match patterns. |

## Development

```shell
# Install dependencies (pnpm >= 11 required)
pnpm install

# Build all packages
pnpm build

# Run all checks (biome, prettier, tsgo)
pnpm check

# Run tests
pnpm test

# Fix linting/formatting issues
pnpm fix
```

## License

[MIT](LICENSE)
