---
"@kozmos-ds/react": minor
---

A one-of-several choice is a radio group, two small marks become targets you can hit, a notice can
interrupt, and Skeleton holds a shape.

**`ChipGroup selectionMode="single"`** is a radio group: one Tab stop, and the arrow keys move the
choice, mirrored right to left (`dir`). It takes `value`, `defaultValue` and `onValueChange`, and
each `Chip` a `value`. `"multiple"` stays the default and behaves as before.

```tsx
<ChipGroup
  selectionMode="single"
  value={sort}
  onValueChange={setSort}
  aria-label={t("sort.label")}
>
  <Chip value="distance">{t("sort.nearest")}</Chip>
  <Chip value="name">{t("sort.name")}</Chip>
</ChipGroup>
```

**Chip's remove mark is 24px.** It was 20px at every chip size, under WCAG 2.5.8's minimum. Its
44px-tall target is laid on by owned CSS, so the chip itself doesn't grow.

**`Notice` can interrupt.** It gains `live`: `"off"`, `"polite"` (the default) or `"assertive"`, the
same words `Alert` takes, so an emergency notice can cut in while a dietary one waits its turn. A
caller's own `role` still wins.

**`Skeleton` holds a shape and a size.** `shape` is `"line"` (text-high, filling its row),
`"block"` (no default height: it is as tall as what it stands in for) or `"circle"` (`width` is its
diameter), with `width` and `height`. Its grey is Figma's `background/200`, one step darker than the
`background/100` it was, and the same on iOS and Android.
