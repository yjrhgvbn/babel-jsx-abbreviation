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
        handleJSXAttribute(path, opt);
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

function handleJSXAttribute(path: NodePath<t.JSXOpeningElement>, opt: PluginOptions) {
  const attributes = path.get("attributes");

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
          let transformResList = transforms.map((v) => handleTransform(attr, v)).filter(Boolean) as t.JSXAttribute[];
          // same name only keep the last one
          const lookedSet = new Set<string>();
          transformResList = transformResList.reverse().filter((v) => {
            const name = v.name.name.toString();
            if (lookedSet.has(name)) {
              return false;
            }
            lookedSet.add(name);
            return true;
          });
          transformResList.forEach((transformRes) => {
            if (!isIdentifierExist(attributes, transformRes) || isIdentifierSameName(attr.node, transformRes)) {
              attr.insertAfter(transformRes);
            }
          });
          attr.remove();
        }
      }
    }
  });
}

function handleTransform(attr: NodePath<t.JSXAttribute>, transform: ReplaceTransform) {
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
      if (transformRes.name !== undefined && transformRes.name !== null) {
        res.name = transformRes.name;
      }
      if (transformRes.value !== undefined && transformRes.value !== null) {
        res.value = transformRes.value;
      }
    }
    return res;
  };
  const name = attr.get("name");
  const nameStr = name.node.name as string;
  let valueStr = "";
  const nodePathValue = attr.get("value");
  if (nodePathValue.isJSXExpressionContainer()) {
    valueStr = generate(nodePathValue.node.expression).code;
  } else if (nodePathValue.isStringLiteral()) {
    valueStr = generate(nodePathValue.node).code;
  }

  const { name: toReplaceName, value: toReplaceValue } = replacTransform(nameStr, valueStr);
  if (!toReplaceName) return null;
  const newJsxIdentifier = t.jsxIdentifier(toReplaceName);
  const newAttr = toReplaceValue ? getJsxAstValueByString(toReplaceValue) : null;
  return t.jsxAttribute(newJsxIdentifier, newAttr);
}

function isIdentifierExist(attributes: NodePath<t.JSXAttribute | t.JSXSpreadAttribute>[], newAttr: t.JSXAttribute) {
  return attributes.some((attr) => {
    return attr.isJSXAttribute() && isIdentifierSameName(attr.node, newAttr);
  });
}

function isIdentifierSameName(attr: t.JSXAttribute, newAttr: t.JSXAttribute) {
  return attr.name.name === newAttr.name.name;
}
