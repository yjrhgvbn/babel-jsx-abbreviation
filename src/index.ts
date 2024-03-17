import * as t from "@babel/types";
import { type NodePath } from "@babel/traverse";
import generate from "@babel/generator";
// @ts-expect-error
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { declare } from "@babel/helper-plugin-utils";
import { getJsxAstValueByString } from "./utils";

interface ReplaceTransform {
  transform?: (name: string, value: string) => { name?: string; value?: string };
  name?: string | ((value: string) => string);
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
            // integration of all replacement rules
            const replacTransform = (name: string, value: string) => {
              const toReplaceName = transform.name;
              const toReplaceValue = transform.value;
              const res = {
                name: (typeof toReplaceName === "function" ? toReplaceName(name) : toReplaceName) ?? name,
                value: (typeof toReplaceValue === "function" ? toReplaceValue(value) : toReplaceValue) ?? value,
              };
              if (typeof transform.transform === "function") {
                const transformRes = transform.transform(name, value);
                if (transformRes.name) {
                  res.name = transformRes.name;
                }
                if (transformRes.value) {
                  res.value = transformRes.value;
                }
              }
              return res;
            };

            const nameStr = name.node.name;
            let valueStr = "";
            const nodePathValue = attr.get("value");
            if (nodePathValue.isJSXExpressionContainer()) {
              valueStr = generate(nodePathValue.node.expression).code;
            } else if (nodePathValue.isStringLiteral()) {
              valueStr = generate(nodePathValue.node).code;
            }

            const { name: toReplaceName, value: toReplaceValue } = replacTransform(nameStr, valueStr);

            if (toReplaceName) {
              /* remove the attribute if the new name already exists */
              if (checkIdentifierExist(attributes, attr, toReplaceName)) {
                attr.remove();
              } else {
                name.replaceWith(t.jsxIdentifier(toReplaceName));
              }
            }
            if (toReplaceValue) nodePathValue.replaceWith(getJsxAstValueByString(toReplaceValue) as any);
          }
        }
      }
    }
  });
}

function checkIdentifierExist(
  attributes: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>[],
  curAttr: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>,
  name: string
) {
  return attributes.some((attr) => {
    if (attr === curAttr) {
      return false;
    }
    if (attr.isJSXAttribute()) {
      const attrName = attr.get("name");
      if (attrName.isJSXIdentifier({ name })) {
        return true;
      }
    }
    return false;
  });
}
