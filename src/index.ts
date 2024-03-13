import * as t from "@babel/types";
import { type NodePath, type Visitor } from "@babel/traverse";
// @ts-expect-error
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { declare } from "@babel/helper-plugin-utils";

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

        attributes.forEach((attr) => {
          // TODO
          if (attr.isJSXSpreadAttribute()) {
            return;
          }
          if (attr.isJSXAttribute()) {
            // const name = attr.get("name");
            // if (name.isJSXIdentifier({ name: "test" })) {
            //   name.replaceWith(t.jsxIdentifier("test123"));
            //   // const value = attr.get("value");
            //   // if (value.isStringLiteral()) {
            //   //   value.replaceWith(t.stringLiteral("test12"));
            //   // }
            // }
          }
        });
      },
      // Program: {
      //   enter(path, state) { },
      //   exit(path) { },
      // },
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
    // TODO
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
            if (!toReplaceName) break;
            /* remove the attribute if the new name already exists */
            if (checkIdentifierExist(attributes, toReplaceName)) {
              attr.remove();
              break;
            }
            if (transform.name) {
              name.replaceWith(t.jsxIdentifier(transform.name));
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
