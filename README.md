# babel-jsx-abbreviation

automatic replacement of jsx attributes

## unplugin

it recommended to use with [unplugin-jsx-abbreviation](https://github.com/yjrhgvbn/unplugin-jsx-abbreviation), which is easier to use in vite or any other bundler

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

```sh
npm install --save-dev babel-jsx-abbreviation
```

.babelrc.js

```js
module.exports = function (api) {
  return {
    plugins: [
      [
        "babel-jsx-abbreviation",
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
