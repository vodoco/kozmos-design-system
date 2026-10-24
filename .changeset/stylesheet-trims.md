---
"@kozmos-ds/react": patch
---

The stylesheet is smaller: 30.14 KB gzip, down from 31.77 (30,864 bytes gzip, down from 32,537; 223,510 raw, down from 245,927). Every Kozmos part draws as it did; the rules are the same, written shorter, and rules nothing in Kozmos draws with are gone. What a product could notice:

- **Utilities nothing in Kozmos uses are gone.** A class a product passes through `className` applies only if Kozmos's stylesheet has it, and these it no longer has:
  - the 21 that only Kozmos's own tests named, among them `ml-2`, `-ml-1`, `pl-8`, `rounded-lg`, `rounded-l-md`, `rounded-tr-lg`, `border-r-2`, `border-sm`, `border-lg`, `bg-success`, `ring-primary`, `w-[72px]` and `right-[2px]`. 0.12.2's `SelectLabel` drew with `pl-8`; it no longer does, in this same release;
  - `container`, with its seven breakpoints, and `hidden`, `visible`, `static`, `resize`, `transform`, `blur` and `filter`, which Tailwind made from words in the source;
  - the 14 bare side and corner radii, `rounded-t` to `rounded-bl` (0.25rem), made from the class-group names `cn()` teaches tailwind-merge. With a role, `rounded-t-panel` and the rest, they are generated where a component uses them, as before.
- **`ScrollArea`'s `hideScrollbar`** no longer carries `[-ms-overflow-style:none]`, which only Internet Explorer and the old Edge read, and neither runs `@scope`.
- **Tailwind's compiler variables.** The stylesheet now registers 17 of them, not 38. A variable registered without an initial value that no Kozmos utility sets, the two skews, eight filter and eight backdrop-filter terms and three numeric terms (with `blur` gone, nothing sets `--tw-blur`), never had a value, so each read of it is now written as the value it always gave, and it is not registered. A product's own Tailwind utility that sets one of them (`skew-x-3`, `brightness-110`) on an element that also carries a Kozmos transform or filter utility no longer adds to Kozmos's value there. `var(--tw-shadow, 0 0 #0000)` and the like drop a fallback equal to the registered initial value, and tailwindcss-animate's rotation, which Kozmos only ever resets, is gone from the enter and exit animations.
- **Token strings.** Read from script, some token values come back shorter: `#ffffff` is `#fff`, and `rgba(23, 25, 28, .05)` is `rgba(23,25,28,.05)`. The colours are the same.
- **Licences.** The package now ships `THIRD-PARTY-NOTICES`, with the licences of Tailwind CSS, of its preflight (modern-normalize) and of tailwindcss-animate, whose output `style.css` and `reset.css` contain. Tailwind's one-line banner comment, which carried no copyright notice, is gone from `style.css`.
- The stylesheet is minified for the browsers `package.json` declares (Chrome and Edge 118, Safari 17.4, Firefox 146), so `inset` is no longer written as four longhands, and `-webkit-appearance`, `-moz-appearance` and `-moz-tab-size` copies are gone.
