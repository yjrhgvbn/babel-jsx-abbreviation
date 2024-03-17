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

describe("transform multiple name", () => {
  const transform = initTransform({
    replace: {
      name1: [{ name: "name2" }, { name: "name3" }],
    },
  });
  [
    {
      name: "replace name",
      from: "<div name1 />",
      to: "<div name2 name3 />",
    },
    {
      name: "replace name with duplicate",
      from: `<div name1 name2="123" />`,
      to: `<div name3 name2="123" />`,
    },
    {
      name: "replace name with value",
      from: "<div name1='hello' />",
      to: "<div name2='hello' name3='hello' />",
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform multiple name fn", () => {
  const transform = initTransform({
    replace: {
      name1: [{ name: (val) => val.toUpperCase() }, { name: (val) => val + "_ext" }],
    },
  });
  [
    {
      name: "replace name",
      from: "<div name1 />",
      to: "<div NAME1 name1_ext />",
    },
    {
      name: "replace name with duplicate",
      from: `<div name1 NAME1="hello" />`,
      to: `<div name1_ext NAME1="hello" />`,
    },
    {
      name: "replace name with value",
      from: `<div name1="hello" />`,
      to: `<div NAME1="hello" name1_ext="hello" />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform multiple value", () => {
  const transform = initTransform({
    replace: {
      name1: [{ value: '"value1"' }, { value: '"value2"' }],
    },
  });
  [
    {
      name: "replace value",
      from: "<div name1={()=>{}} />",
      to: `<div name1="value2" />`,
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

describe("transform multiple value fn", () => {
  const transform = initTransform({
    replace: {
      name1: [
        {
          value: '"asd"',
        },
        {
          value: (v) => {
            return `{clsx("hello", ${v})}`;
          },
        },
      ],
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

describe("transform multiple name and value", () => {
  const transform = initTransform({
    replace: {
      c: [
        {
          name: "className",
          value: (v) => {
            return `{clsx(${v})}`;
          },
        },
        {
          name: "isReplace",
          value: () => {
            return ``;
          },
        },
      ],
    },
  });
  [
    {
      name: "replace name and value",
      from: "<div c />",
      to: `<div className={clsx()} isReplace />`,
    },
    {
      name: "replace name and value with value",
      from: `<div c="hello" />`,
      to: `<div className={clsx("hello")} isReplace />`,
    },
    {
      name: "replace name and value with array value",
      from: `<div c={["hello", "world"]} />`,
      to: `<div className={clsx(["hello", "world"])} isReplace />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});

describe("transform single by transform ", () => {
  const transform = initTransform({
    replace: {
      c: [
        {
          transform: (_, value) => {
            return { name: "className", value: `{clsx(${value})}` };
          },
        },
        {
          transform: (_) => {
            return { name: "isReplace", value: `` };
          },
        },
      ],
    },
  });
  [
    {
      name: "replace name and value",
      from: "<div c />",
      to: `<div className={clsx()} isReplace />`,
    },
    {
      name: "replace name and value with value",
      from: `<div c="hello" />`,
      to: `<div className={clsx("hello")} isReplace />`,
    },
    {
      name: "replace name and value with array value",
      from: `<div c={["hello", "world"]} />`,
      to: `<div className={clsx(["hello", "world"])} isReplace />`,
    },
  ].forEach(({ name, from, to }) => {
    test(name, async () => {
      expect(await transform(from)).toMatch(to);
    });
  });
});
