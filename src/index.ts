import * as t from "@babel/types";
import { type NodePath } from "@babel/traverse";
import generate from "@babel/generator";
// @ts-expect-error
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { declare } from "@babel/helper-plugin-utils";
import { getJsxAstValueByString } from "./utils";

interface ReplaceTransform {
  parse?: (name: string, value: string) => { name: string; value: string };
  name?: string;
  value?: string | ((value: string) => string);
}

interface Replace {
  [key: string]: ReplaceTransform | ReplaceTransform[];
}

export interface PluginOptions {
  replace?: Replace;
}

export default declare<PluginOptions>((api, opt = {}) => {
  return {
    name: "babel-jsx-abbreviation",
    inherits: syntaxJsx,
    visitor: {
      JSXOpeningElement(path) {
        const attributes = path.get("attributes");
        handleJSXAttribute(attributes, opt);
      },
    },
  };
});

function getReplaceTransforms(replace: Replace, name: string) {
  let res: ReplaceTransform[] = [];
  if (!replace) {
    return res;
  }
  if (replace[name]) {
    const transform = replace[name];
    if (Array.isArray(transform)) {
      res = transform;
    } else {
      res = [transform];
    }
  }
  return res;
}

function handleJSXAttribute(attributes: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>[], opt: PluginOptions) {
  attributes.forEach((attr) => {
    if (attr.isJSXSpreadAttribute()) {
      return;
    }
    if (attr.isJSXAttribute()) {
      const replace = opt.replace;
      const name = attr.get("name");

      if (!replace) return;
      for (const key of Object.keys(replace)) {
        if (name.isJSXIdentifier({ name: key })) {
          const transforms = getReplaceTransforms(replace, key);
          for (const transform of transforms) {
            const toReplaceName = transform.name;
            if (toReplaceName) {
              /* remove the attribute if the new name already exists */
              if (checkIdentifierExist(attributes, toReplaceName)) {
                attr.remove();
                break;
              }
              if (transform.name) {
                name.replaceWith(t.jsxIdentifier(transform.name));
              }
            }

            const toReplaceValue = transform.value;
            const nodePathValue = attr.get("value");
            const nodeValue = nodePathValue.node;
            if (toReplaceValue) {
              if (typeof toReplaceValue === "string") {
                if (t.isJSXExpressionContainer(nodeValue)) {
                  nodeValue.expression = t.stringLiteral(toReplaceValue);
                } else if (t.isStringLiteral(nodeValue)) {
                  nodeValue.value = toReplaceValue;
                } else {
                  nodePathValue.replaceWith(t.stringLiteral(toReplaceValue));
                }
              } else if (typeof toReplaceValue === "function") {
                if (t.isJSXExpressionContainer(nodeValue)) {
                  const expressionValue = generate(nodeValue.expression).code;
                  nodePathValue.replaceWith(getJsxAstValueByString(toReplaceValue(expressionValue)) as any);
                } else if (t.isStringLiteral(nodeValue)) {
                  const generateValue = generate(nodeValue).code;
                  nodePathValue.replaceWith(getJsxAstValueByString(toReplaceValue(generateValue)) as any);
                } else {
                  nodePathValue.replaceWith(getJsxAstValueByString(toReplaceValue("")) as any);
                }
              }
            }
          }
        }
      }
    }
  });
}

function checkIdentifierExist(attributes: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>[], name: string) {
  return attributes.some((attr) => {
    if (attr.isJSXAttribute()) {
      const attrName = attr.get("name");
      if (attrName.isJSXIdentifier({ name })) {
        return true;
      }
    }
    return false;
  });
}
