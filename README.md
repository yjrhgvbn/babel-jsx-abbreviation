A babel plugin help you to easy witrte props in react component.

# Example

## setting

```json
replace: {
  c: {
    name: "className",
    value: (v) => {
      return `{clsx(${v})}`;
    },
  },
}
```

## IN

```jsx
<div c={["mt2", "mb-1"]} />
```

## OUT

```jsx
<div className={clsx(["mt2", "mb-1"])} />
```
