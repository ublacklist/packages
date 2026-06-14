# @ublacklist/match-pattern

A parser and lookup map for [WebExtensions match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns).

## Installation

```shell
npm install @ublacklist/match-pattern
```

## Usage

```typescript
import { MatchPatternMap, parseMatchPattern } from "@ublacklist/match-pattern";

parseMatchPattern("*://*.example.com/*");
// { allURLs: false, scheme: "*", host: "*.example.com", path: "/*" }

const map = new MatchPatternMap<number>();
map.set("*://*.example.com/*", 1);
map.get("https://www.example.com/"); // [1]
```

## License

[MIT](https://github.com/ublacklist/packages/blob/main/LICENSE)
