# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This repository is a pnpm monorepo of packages extracted from the [uBlacklist](https://github.com/iorate/ublacklist) browser extension: `@ublacklist/match-pattern`, `@ublacklist/ruleset`, and `@ublacklist/serpinfo`. It also publishes the agent skills `ublacklist-ruleset` and `ublacklist-serpinfo`.

## Development Commands

```shell
# Run all checks (oxlint and oxfmt)
pnpm check

# Fix linting/formatting issues
pnpm fix

# Run tests
pnpm test

# Build all packages
pnpm build
```
