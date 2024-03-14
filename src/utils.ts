import { parse } from "@babel/parser";
import * as t from "@babel/types";
// @ts-expect-error
import syntaxJsx from "@babel/plugin-syntax-jsx";

export function getJsxAstValueByString(str: string) {
  const wapJsx = `<div value=${str} />`;

  const parseRes = parse(wapJsx, { plugins: ["jsx"] }).program.body as any;
  const value = parseRes[0].expression.openingElement.attributes[0].value as
    | t.JSXElement
    | t.JSXExpressionContainer
    | t.JSXFragment
    | t.StringLiteral
    | null
    | undefined;

  return value;
}
