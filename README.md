# babel-jsx-abbreviation

automatic replacement of jsx attributes

---

without

```jsx
<div className={clsx(["mt2", "mb-1"])} />
```

with

```jsx
<div c={["mt2", "mb-1"]} />
```

## Usage

.babelrc.js

```js
module.exports = function (api) {
  return {
    plugins: [
      [
        "babel-plugin-jsx-abbreviation",
        {
          replace: {
            c: {
              name: "className",
              value: (v) => {
                return `{clsx(${v})}`;
              },
            },
          },
        },
      ],
    ],
  };
};
```

## Options

```js
{
  replace: {
    // the matching attribute
    c: {
      // the attribute name to replace
      name: "className",
      // the value to replace with
      value: (v) => {
        // v is the value of the attribute, always a string
        // <div c={"s"} /> => v = `"s"`, <div c="s" /> => v = `"s"`, <div c={["s"]} /> => v = `["s"]`
        return `{clsx(${v})}`;
      },
    },

    // multiple attributes
    // <div c={"s"} /> will be replaced with <div className={clsx("s")} style={"s"}/>
    c: [{
      name: (n) => "className",
      value: (v) => {
        return `{clsx(${v})}`;
      },
    },
    {
      transform: (n, v) => {
        return {
          name: "style",
          value: `{${v}}`,
        };
      },
    }],
  },
}
```
