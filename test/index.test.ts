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
      name1: { name: "name2" },
    },
  });
  [
    {
      name: "replace name",
      from: "<div name1 />",
      to: "<div name2 />",
    },
    {
      name: "replace name with duplicate",
      from: "<div name1 name2 />",
      to: "<div name2 />",
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});
