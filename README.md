# @ublacklist/packages

A monorepo of packages extracted from the [uBlacklist](https://github.com/iorate/ublacklist) browser extension.

## Packages

| Package                                                    | Description                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| [@ublacklist/match-pattern](packages/match-pattern#readme) | A parser and lookup map for WebExtensions match patterns. |
| [@ublacklist/ruleset](packages/ruleset#readme)             | The ruleset format definition and parser.                 |
| [@ublacklist/serpinfo](packages/serpinfo#readme)           | The SERPINFO format definition, parser, and schemas.      |

## Agent skills

This repository also publishes [agent skills](https://agentskills.io/) that help AI coding agents author uBlacklist rulesets and SERPINFO files.

| Skill                                                               | Description                                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [ublacklist-ruleset](packages/ruleset/skills/ublacklist-ruleset)    | Write, review, or debug rulesets for the uBlacklist browser extension.                  |
| [ublacklist-serpinfo](packages/serpinfo/skills/ublacklist-serpinfo) | Write or modify SERPINFO files that describe how uBlacklist parses search result pages. |

Install them with the [GitHub CLI](https://cli.github.com/):

```shell
gh skill install ublacklist/packages
```

## License

[MIT](LICENSE)
