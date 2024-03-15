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
    {
      name: "replace name with value",
      from: "<div name1='hello' />",
      to: "<div name2='hello' />",
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform single value", () => {
  const transform = initTransform({
    replace: {
      name1: { value: "value2" },
    },
  });
  [
    {
      name: "replace name",
      from: "<div name1={()=>{}} />",
      to: `<div name1={"value2"} />`,
    },
    {
      name: "can auto add value",
      from: "<div name1 />",
      to: `<div name1="value2" />`,
    },
    {
      name: "can replace value",
      from: `<div name1="hello" />`,
      to: `<div name1="value2" />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform single value fn", () => {
  const transform = initTransform({
    replace: {
      name1: {
        value: (v) => {
          return `{clsx("hello", ${v})}`;
        },
      },
    },
  });
  [
    {
      name: "replace name with ExpressionContainer",
      from: `<div name1={"world"} />`,
      to: `<div name1={clsx("hello", "world")} />`,
    },
    {
      name: "can auto add value",
      from: `<div name1 />`,
      to: `<div name1={clsx("hello")} />`,
    },
    {
      name: "can replace value",
      from: `<div name1="world" />`,
      to: `<div name1={clsx("hello", "world")} />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform single name and value", () => {
  const transform = initTransform({
    replace: {
      c: {
        name: "className",
        value: (v) => {
          return `{clsx(${v})}`;
        },
      },
    },
  });
  [
    {
      name: "replace name and value",
      from: "<div c />",
      to: `<div className={clsx()} />`,
    },
    {
      name: "replace name and value with value",
      from: `<div c="hello" />`,
      to: `<div className={clsx("hello")} />`,
    },
    {
      name: "replace name and value with array value",
      from: `<div c={["hello", "world"]} />`,
      to: `<div className={clsx(["hello", "world"])} />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});
