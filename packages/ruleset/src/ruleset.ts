import type { SyntaxNode } from "@lezer/common";
import {
  MatchPatternMap,
  type MatchPatternMapJSON,
} from "@ublacklist/match-pattern";
import yaml from "js-yaml";
import { z } from "zod";
import { parser } from "./parser.ts";
import { parser as bodyParser } from "./ruleset.grammar.ts";
import { Text } from "./text.ts";
import { parseRegExp, parseString } from "./utils.ts";

export type RulesetJSON = {
  source: string;
  metadata: Record<string, unknown>;
  ruleMap: MatchPatternMapJSON<Rule>;
  frontmatterUnclosed: boolean;
};

export type SearchResult = {
  url: string;
  props?: Props;
};

export type Props = Record<string, string>;

export type ExecResult = {
  lineNumber: number;
  action: Action;
}[];

export type Action =
  | { type: "block" }
  | { type: "unblock" }
  | { type: "highlight"; colorNumber: number };

export class Ruleset implements Iterable<string> {
  constructor(input: string | RulesetJSON) {
    if (typeof input === "string") {
      this.#source = new Text(input);
      this.#metadata = {};
      this.#ruleMap = new MatchPatternMap();
      this.#frontmatterUnclosed = false;
      const tree = parser.parse(this.#source.toString());
      const frontmatterNode = tree.topNode.getChild("Frontmatter");
      if (frontmatterNode) {
        // biome-ignore lint/style/noNonNullAssertion: "Frontmatter" always has "Stream"
        const streamNode = frontmatterNode.getChild("Stream")!;
        const stream = this.#source.slice(streamNode.from, streamNode.to);
        try {
          this.#metadata = z
            .record(z.string(), z.unknown())
            .parse(yaml.load(stream, { schema: yaml.JSON_SCHEMA }));
        } catch {
          // `YAMLException` or `ZodError` is thrown
        }
      }
      const rulesetNode = tree.topNode.getChild("Ruleset");
      if (rulesetNode) {
        collectRuleset(rulesetNode, this.#source, this.#ruleMap);
      } else if (frontmatterNode) {
        // Probably the YAML frontmatter is unclosed
        this.#frontmatterUnclosed = true;
      }
    } else {
      this.#source = new Text(input.source);
      this.#metadata = input.metadata;
      this.#ruleMap = new MatchPatternMap(input.ruleMap);
      this.#frontmatterUnclosed = input.frontmatterUnclosed;
    }
  }

  get length(): number {
    return this.#source.lines;
  }

  exec(result: Readonly<SearchResult>): ExecResult {
    const props = flatten(result);
    const matches: ExecResult = [];
    for (const [lineNumber, value = -1, expression = null] of this.#ruleMap.get(
      result.url,
    )) {
      if (!expression || execExpression(expression, props)) {
        const action: Action =
          value === -1
            ? { type: "block" }
            : value === 0
              ? { type: "unblock" }
              : { type: "highlight", colorNumber: value };
        matches.push({ lineNumber, action });
      }
    }
    return matches;
  }

  extend(input: string) {
    if (this.#frontmatterUnclosed) {
      this.#source = this.#source.append("\n---");
      this.#frontmatterUnclosed = false;
    }
    if (!input.length) {
      return;
    }
    if (!this.#source.length) {
      this.#source = new Text(input);
      const tree = bodyParser.parse(this.#source.toString());
      collectRuleset(tree.topNode, this.#source, this.#ruleMap);
      return;
    }
    const from = this.#source.length + 1;
    this.#source = this.#source.append(`\n${input}`);
    const to = this.#source.length;
    const tree = bodyParser.parse(this.#source.toString(), undefined, [
      { from: 0, to: 0 },
      { from, to },
    ]);
    collectRuleset(tree.topNode, this.#source, this.#ruleMap);
  }

  get(n: number): string | null {
    if (n < 1 || n > this.#source.lines) {
      return null;
    }
    return this.#source.line(n);
  }

  test(result: Readonly<SearchResult>): boolean {
    const matches = this.exec(result);
    return (
      matches.length !== 0 &&
      matches.every(({ action }) => action.type === "block")
    );
  }

  toJSON(): RulesetJSON {
    return {
      source: this.#source.toString(),
      metadata: this.#metadata,
      ruleMap: this.#ruleMap.toJSON(),
      frontmatterUnclosed: this.#frontmatterUnclosed,
    };
  }

  toString(): string {
    return this.#source.toString();
  }

  *[Symbol.iterator](): Generator<string> {
    const lines = this.#source.lines;
    for (let n = 1; n <= lines; ++n) {
      yield this.#source.line(n);
    }
  }

  #source: Text;
  #metadata: Record<string, unknown>;
  #ruleMap: MatchPatternMap<Rule>;
  #frontmatterUnclosed: boolean;
}

type Rule = [
  lineNumber: number,
  value?: number,
  expression?: Expression | null,
];

type Expression =
  | ["=", string, string]
  | ["=i", string, string]
  | ["^=", string, string]
  | ["^=i", string, string]
  | ["$=", string, string]
  | ["$=i", string, string]
  | ["*=", string, string]
  | ["*=i", string, string]
  | ["=~", string, PlainRegExp]
  | ["!", Expression]
  | ["&", Expression, Expression]
  | ["|", Expression, Expression];

const regExpSymbol = Symbol("RegExp");

type PlainRegExp = [pattern: string, flags?: string] & {
  [regExpSymbol]?: RegExp;
};

function collectRuleset(
  rulesetNode: SyntaxNode,
  source: Text,
  ruleMap: MatchPatternMap<Rule>,
) {
  for (const ruleNode of rulesetNode.getChildren("Rule")) {
    if (hasError(ruleNode)) {
      continue;
    }
    const lineNumber = source.lineNumberAt(ruleNode.from);
    const value = getValue(ruleNode, source);
    const matchPattern = getMatchPattern(ruleNode, source);
    let expression: Expression | null;
    try {
      expression = getExpression(ruleNode, source);
    } catch {
      // An invalid string literal or regular expression
      continue;
    }
    try {
      ruleMap.set(
        matchPattern ?? "<all_urls>",
        expression
          ? [lineNumber, value, expression]
          : value !== -1
            ? [lineNumber, value]
            : [lineNumber],
      );
    } catch {
      // #497 Just in case
    }
  }
}

function hasError(ruleNode: SyntaxNode): boolean {
  const cursor = ruleNode.cursor();
  do {
    if (cursor.type.isError) {
      return true;
    }
    // #497 An error node may expand to the next line
    // `<=` is used to include the new line character
  } while (cursor.next() && cursor.from <= ruleNode.to);
  return false;
}

function getValue(ruleNode: SyntaxNode, source: Text): number {
  if (ruleNode.getChild("UnblockSpecifier")) {
    return 0;
  }
  const highlightSpecifierNode = ruleNode.getChild("HighlightSpecifier");
  if (highlightSpecifierNode) {
    return Number(
      source.slice(highlightSpecifierNode.from + 1, highlightSpecifierNode.to),
    );
  }
  return -1;
}

function getMatchPattern(ruleNode: SyntaxNode, source: Text): string | null {
  const matchPatternNode = ruleNode.getChild("MatchPattern");
  if (matchPatternNode) {
    return source.slice(matchPatternNode.from, matchPatternNode.to);
  }
  return null;
}

function getExpression(ruleNode: SyntaxNode, source: Text): Expression | null {
  const ifSpecifierNode = ruleNode.getChild("IfSpecifier");
  if (ifSpecifierNode) {
    // biome-ignore lint/style/noNonNullAssertion: "IfSpecifier" always has "Expression"
    return collectExpression(ifSpecifierNode.getChild("Expression")!, source);
  }
  const expressionNode = ruleNode.getChild("Expression");
  if (expressionNode) {
    return collectExpression(expressionNode, source);
  }
  return null;
}

function collectExpression(
  expressionNode: SyntaxNode,
  source: Text,
): Expression {
  if (expressionNode.name === "MatchExpression") {
    const identifierNode = expressionNode.getChild("Identifier");
    let identifier =
      identifierNode && source.slice(identifierNode.from, identifierNode.to);
    identifier =
      identifier == null || identifier === "u"
        ? "url"
        : identifier === "t"
          ? "title"
          : identifier;
    const stringMatchOperatorNode = expressionNode.getChild(
      "StringMatchOperator",
    );
    if (stringMatchOperatorNode) {
      const operator = source.slice(
        stringMatchOperatorNode.from,
        stringMatchOperatorNode.to,
      ) as "=" | "^=" | "$=" | "*=";
      // biome-ignore lint/style/noNonNullAssertion: "StringMatchOperator" is always followed by "String"
      const stringNode = expressionNode.getChild("String")!;
      const string = parseString(source.slice(stringNode.from, stringNode.to));
      const caseInsensitive =
        expressionNode.getChild("CaseSensitivity") != null;
      return [caseInsensitive ? `${operator}i` : operator, identifier, string];
    }
    // biome-ignore lint/style/noNonNullAssertion: If "StringMatchOperator" is not present, "RegExp" is present
    const regExpNode = expressionNode.getChild("RegExp")!;
    const { pattern, flags } = parseRegExp(
      source.slice(regExpNode.from, regExpNode.to),
    );
    return ["=~", identifier, flags ? [pattern, flags] : [pattern]];
  }
  if (expressionNode.name === "ParenthesizedExpression") {
    // biome-ignore lint/style/noNonNullAssertion: "ParenthesizedExpression" always has "Expression"
    return collectExpression(expressionNode.getChild("Expression")!, source);
  }
  if (expressionNode.name === "NegateExpression") {
    return [
      "!",
      // biome-ignore lint/style/noNonNullAssertion: "NegateExpression" always has "Expression"
      collectExpression(expressionNode.getChild("Expression")!, source),
    ];
  }
  if (expressionNode.name === "AndExpression") {
    const [leftNode, rightNode] = expressionNode.getChildren("Expression");
    return [
      "&",
      // biome-ignore lint/style/noNonNullAssertion: "AndExpression" always has two "Expression"s
      collectExpression(leftNode!, source),
      // biome-ignore lint/style/noNonNullAssertion: "AndExpression" always has two "Expression"s
      collectExpression(rightNode!, source),
    ];
  }
  {
    // "OrExpression"
    const [leftNode, rightNode] = expressionNode.getChildren("Expression");
    return [
      "|",
      // biome-ignore lint/style/noNonNullAssertion: "OrExpression" always has two "Expression"s
      collectExpression(leftNode!, source),
      // biome-ignore lint/style/noNonNullAssertion: "OrExpression" always has two "Expression"s
      collectExpression(rightNode!, source),
    ];
  }
}

function flatten(result: Readonly<SearchResult>): Props {
  try {
    const { protocol, hostname, pathname, search } = new URL(result.url);
    return {
      ...result.props,
      url: result.url,
      scheme: protocol.slice(0, -1),
      host: hostname,
      path: `${pathname}${search}`,
    };
  } catch {
    // An invalid URL leaves `scheme`/`host`/`path` undefined
    return {
      ...result.props,
      url: result.url,
    };
  }
}

function execExpression(
  expression: Expression,
  props: Readonly<Props>,
): boolean {
  if (expression[0] === "=") {
    const prop = getProp(props, expression[1]);
    return prop != null && prop === expression[2];
  }
  if (expression[0] === "=i") {
    const prop = getProp(props, expression[1]);
    return prop != null && prop.toLowerCase() === expression[2].toLowerCase();
  }
  if (expression[0] === "^=") {
    const prop = getProp(props, expression[1]);
    // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
    return prop != null && prop.startsWith(expression[2]);
  }
  if (expression[0] === "^=i") {
    const prop = getProp(props, expression[1]);
    return (
      // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
      prop != null && prop.toLowerCase().startsWith(expression[2].toLowerCase())
    );
  }
  if (expression[0] === "$=") {
    const prop = getProp(props, expression[1]);
    // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
    return prop != null && prop.endsWith(expression[2]);
  }
  if (expression[0] === "$=i") {
    const prop = getProp(props, expression[1]);
    return (
      // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
      prop != null && prop.toLowerCase().endsWith(expression[2].toLowerCase())
    );
  }
  if (expression[0] === "*=") {
    const prop = getProp(props, expression[1]);
    // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
    return prop != null && prop.includes(expression[2]);
  }
  if (expression[0] === "*=i") {
    const prop = getProp(props, expression[1]);
    return (
      // biome-ignore lint/complexity/useOptionalChain: Return a boolean value
      prop != null && prop.toLowerCase().includes(expression[2].toLowerCase())
    );
  }
  if (expression[0] === "=~") {
    const prop = getProp(props, expression[1]);
    return prop != null && plainRegExpTest(expression[2], prop);
  }
  if (expression[0] === "!") {
    return !execExpression(expression[1], props);
  }
  if (expression[0] === "&") {
    return (
      execExpression(expression[1], props) &&
      execExpression(expression[2], props)
    );
  }
  // "|"
  return (
    execExpression(expression[1], props) || execExpression(expression[2], props)
  );
}

function getProp(props: Readonly<Props>, name: string): string | null {
  return Object.hasOwn(props, name)
    ? // biome-ignore lint/style/noNonNullAssertion: `props` has `name`
      props[name]!
    : null;
}

function plainRegExpTest(regExp: PlainRegExp, string: string): boolean {
  regExp[regExpSymbol] ||= new RegExp(regExp[0], regExp[1] ?? "");
  return regExp[regExpSymbol].test(string);
}
