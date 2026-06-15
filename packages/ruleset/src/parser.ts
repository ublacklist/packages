import { parseMixed } from "@lezer/common";
import { styleTags, tags as t } from "@lezer/highlight";
import { parser as yamlParser } from "@lezer/yaml";
import { parser as frontmatterParser } from "./frontmatter.grammar.ts";
import { parser as _bodyParser } from "./ruleset.grammar.ts";

const bodyParser = _bodyParser.configure({
  props: [
    styleTags({
      Comment: t.lineComment,
      "@ AtInteger @if": t.modifier,
      Identifier: t.variableName,
      "StringMatchOperator CaseSensitivity RegExpMatchOperator":
        t.compareOperator,
      String: t.string,
      RegExp: t.regexp,
      "( )": t.paren,
      '"!" & |': t.logicOperator,
    }),
  ],
});

export const parser = frontmatterParser.configure({
  props: [styleTags({ DashLine: t.meta })],
  wrap: parseMixed((node) =>
    node.name === "FrontmatterContent"
      ? { parser: yamlParser }
      : node.name === "Body"
        ? { parser: bodyParser }
        : null,
  ),
});
