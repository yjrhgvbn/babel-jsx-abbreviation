import { transformAsync } from "@babel/core";
import plugin from "../src";
import { test, expect, describe } from "vitest";

describe("Transform", () => {
  async function transform(code: string): Promise<string> {
    const result = await transformAsync(code, {
      plugins: [[plugin]],
    });
    return result!.code!;
  }
  [
    {
      name: "init",
      from: "test",
      to: "test",
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});
