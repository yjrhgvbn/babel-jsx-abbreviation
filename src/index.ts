import * as t from "@babel/types";
import { type NodePath, type Visitor } from "@babel/traverse";
import { declare } from "@babel/helper-plugin-utils";

export default declare((api, opt, dirname) => {
  return {
    name: "babel-plugin-jsx",
    visitor: {
      JSXElement(path) {},
      // Program: {
      //   enter(path, state) { },
      //   exit(path) { },
      // },
    },
  };
});
