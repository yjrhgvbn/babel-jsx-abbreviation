import { transformAsync } from "@babel/core";
import plugin, { PluginOptions } from "../src";
import { test, expect, describe } from "vitest";

function initTransform(opt: PluginOptions) {
  return async function transform(code: string): Promise<string> {
    const result = await transformAsync(code, {
      plugins: [[plugin, opt]],
    });
    return result!.code!;
  };
}

describe("transform single name", () => {
  const transform = initTransform({
    replace: {
      name1: { name: "hello", value: '"hello"' },
      name2: [
        { name: "world", value: '"world"' },
        { name: "world2", value: '"world2"' },
      ],
    },
  });
  [
    {
      name: "should replace name",
      from: "<div name1 />",
      to: `<div hello="hello" />`,
    },
    {
      name: "should ignore duplicate name",
      from: `<div name1 name2="123" />`,
      to: `<div hello="hello" world="world" world2="world2" />`,
    },
    {
      name: "should replace name with value",
      from: "<div name1='hello' />",
      to: `<div hello="hello" />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});
