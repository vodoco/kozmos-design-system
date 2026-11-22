# Porting a part to Vue

How a part leaves `@kozmos-ds/vue/react-bridge` and becomes a native Vue part in
`@kozmos-ds/vue`, on Reka UI (decision 83: no UI kit). A port draws **the element React
draws, with the classes React draws, from the same recipe**: it never re-invents a style.
The checks below hold each port to React's API and to React's server render, so a port is
done when they pass and nothing marked `TODO(port)` is left.

`KozmosBadge` and `KozmosSeparator` were the first ports made with this kit: read them
beside this page (`src/components/Badge`, `src/components/Separator`).

## 0. Before you start

```bash
pnpm install --frozen-lockfile
pnpm --filter "@kozmos-ds/react..." build   # the scaffold and the contract read React's dist
pnpm --filter @kozmos-ds/vue build          # the contract reads Vue's dist too
```

Workspace packages resolve to `dist`: rebuild React after moving a recipe, and Vue after
changing a port, before running Vue's tests.

## 1. Scaffold it

```bash
pnpm --filter @kozmos-ds/vue port <Name>            # React's export name: Badge
pnpm --filter @kozmos-ds/vue port <Name> --dry-run  # print what it would write
```

It reads what React's part takes from React's built declarations, through the contract's own
reader (`test/contract/read-contract.ts`), and React's stories through the parity check's
reader, and writes:

| File                                      | What                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/<Name>/<Name>.ts`         | the part: its props, `v-model`s, events and slots, named as the contract names them; it draws a bare element, marked `TODO(port)` |
| `src/components/<Name>/<Name>.stories.ts` | React's args stories, same names and args, under `Vue/<React's title>`; a stub for each story React draws by hand                 |
| `src/index.ts`                            | the export                                                                                                                        |
| `test/ports.ts`                           | the `PORTS` entry: React's stories file, the stories drawn `elsewhere`, the events and where each fires                           |
| `test/parity/<name>.parity.spec.ts`       | when React has a story the parity check cannot draw from its args, or an event: one test each, failing until you draw it          |
| `scripts/vue/coverage.mjs`                | each new story in the Vue browser suites' register, marked `TODO(port)`                                                           |

It refuses a name that is already native (in `src/index.ts` or `test/ports.ts`), a name
React does not export, and any file that exists: it never overwrites. It prints the steps
left, with the bridge line to take out.

A compound part (Tabs: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) is one port per
export, in one pull request: scaffold each. The parts after the first have no stories file
of their own; give them `drawnIn` the first part's parity spec.

## 2. Move the recipe into `packages/react/src/recipes`

The classes, custom properties and drawings React's part builds its element from move out of
the `.tsx` into a framework-free module, `packages/react/src/recipes/<name>.ts`, exported
from `recipes/index.ts`. React imports it by path; Vue builds it in through the
`#kozmos-recipes` alias. `recipes.framework-free.test.ts` allows only
`class-variance-authority`, `clsx` and `tailwind-merge`.

- Move, never copy: `badgeVariants`, `counterVariants`, `separatorClasses`, Badge's icon
  class and counter helpers all left their components for `recipes/`.
- A recipe a React export names (`counterVariants`) is re-exported from its component
  (`export { counterVariants }`), so React's API does not change.
- A helper whose React type names React (`formatCounterValue(value: ReactNode)`) keeps its
  React signature; the recipe takes the framework-free part (`formatCounterText`).
- Derive the recipe's types from the recipe (`NonNullable<VariantProps<typeof x>["size"]>`),
  so a variant added there reaches every framework.
- Point any check that read the class in the `.tsx` at the recipe
  (`scripts/check-component-contracts.mjs`, `scripts/check-border-parity.mjs`: grep for the
  component's path).

**React's pixels and API must not change.** Before and after, build React and compare:

```bash
cp -R packages/react/dist /tmp/react-before   # on the unchanged tree
pnpm --filter @kozmos-ds/react build
cmp /tmp/react-before/index.d.ts packages/react/dist/index.d.ts
cmp /tmp/react-before/style.css packages/react/dist/style.css
(cd packages/react && npx vitest run src/components/<Name> src/recipes)
```

## 3. Draw the element

Replace the skeleton's drawing with React's, element for element:

- **Same tag, same classes, same attributes, same order of children.** Build the class
  with `cn(recipe(...), normalizeClass(attrs.class))`, as React's `cn(recipe, className)`.
- `inheritAttrs: false`, and spread the rest of `attrs` where React spreads `...props`
  (after the attributes React writes first, so an app's `role` wins as it does in React).
- A prop React destructures and ignores (Badge's `asChild`) is declared and ignored.
- A prop's type: a literal union is fine inline in `PropType<…>`; when the recipe exports
  it, write it out in `types.ts` and hold it to the recipe in `types.check.ts` (Badge's,
  Button's). **Never name a `#kozmos-recipes` type in a prop:** Vue's declarations would
  name a module the package does not ship, and the contract reads the prop as `any`.
- Defaults: React's parameter-list default is the Vue default (`decorative: true`). A
  Boolean prop without one is `default: undefined`, or Vue reads it as `false`.
- Internal React parts the part draws (Badge's `Counter`) are drawn inline from their recipe
  in Vue, as `spinnerArc` is for Button: a helper, not an export.

### Radix → Reka UI

Reka UI is Radix's Vue port: most primitives have the same name, props and DOM.

| Radix (React)                    | Reka UI (Vue)                        | Notes                                                                                |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| `@radix-ui/react-<x>` `Root`     | `import { <X>Root } from "reka-ui"`  | Separator is `Separator`; most are `<X>Root`, `<X>Trigger`, `<X>Content`             |
| `asChild` + `Slot`               | `as-child` (`asChild` prop) + `Slot` | Reka's `Primitive` also takes `as`; React's API does not, so never declare it        |
| `onOpenChange`, `onValueChange`… | `update:open`, `update:modelValue`   | Reka's own events are already v-model shaped: re-emit them under the contract's name |
| `value` / `defaultValue`         | `modelValue` / `defaultValue`        | a controlled `value` is `modelValue` in Vue (decision 160)                           |
| `Portal`                         | `<X>Portal` with `to`                | portal into the provider's `portalContainer` (`useTheme()`), as React's does         |
| `DirectionProvider`              | `ConfigProvider` `dir`               | `KozmosThemeProvider` already sets it                                                |
| `forceMount`                     | `force-mount`                        |                                                                                      |
| `data-state`, `data-orientation` | the same                             | compared by the parity check                                                         |

Check a primitive's attributes against Radix's in `node_modules/reka-ui/dist/<X>/` before
trusting the name: Reka's `Separator` defaults `decorative` to false where Kozmos's is true,
so `KozmosSeparator` sets it.

## 4. Name the API as React's: the contract

`test/contract/` reads React's built declarations and Vue's built options and declarations,
and fails on any difference (its header has every rule). In short:

| React                                  | Vue                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------- |
| a value prop `variant`                 | a prop `variant`, same type, required alike, same default                  |
| a controlled `open` + `onOpenChange`   | `v-model:open`: prop `open`, event `update:open` with React's arguments    |
| a controlled `value` + `onValueChange` | `v-model`: prop `modelValue`, event `update:modelValue`                    |
| another callback `onResetMixed`        | event `resetMixed` (camelCase, so Vue's types write `onResetMixed`)        |
| a DOM event (`onClick`)                | nothing: it falls through to the element                                   |
| `children`                             | the default slot                                                           |
| a node prop `icon`, `counter`          | a slot of the same name                                                    |
| a render prop `renderItem(item)`       | a scoped slot; its slot props are an exception, with why (`exceptions.ts`) |

Vue takes nothing React's does not. A deliberate difference goes in
`test/contract/exceptions.ts` by its finding id, with the reason; an exception that no
longer matches fails.

## 5. Analytics

React's parts report through `useKozmosAnalytics().trackEvent(component, eventName,
properties)`. `docs/analytics-events.json` names each part's events. A port of a part that
sends one calls Vue's own `useKozmosAnalytics`, from the native `KozmosAnalyticsProvider`
(GAP-230), as `KozmosButton` does:

```ts
import { useKozmosAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
// in setup:
const { trackEvent } = useKozmosAnalytics();
// where React's part calls it, with the same name and properties:
trackEvent("Button", "button_clicked", { variant: props.variant ?? "default" });
```

Inside a `KozmosAnalyticsProvider` the event joins its batches, with the bridged parts'
events; outside every provider it is dropped, as React's is. `test/parity/analytics.parity.spec.ts`
holds the provider to React's batching. Badge and Separator send no event.

## 6. Accessibility

The same roles, names, states and focus order as React's, which the parity check compares in
the server render (`role`, `aria-*`, `data-state`). What a server render cannot show —
focus moving, keyboard handling, a live region announcing — needs a mounted spec beside
React's (`test/parity/mounted.parity.spec.ts`, `listeners.parity.spec.ts`), and the Vue
browser suites run axe at WCAG 2.2 AA over every story.

## 7. Stories and parity

- The scaffolded stories are React's args stories. Draw each stub (a story React draws with
  its own `render`, or JSX args) as React's draws it, with Kozmos parts only, under the same
  name.
- `test/parity/stories.parity.spec.ts` draws every React args story in both frameworks, in a
  ThemeProvider, and holds the normalised server renders equal, then once more with an app's
  attributes added. Every story it cannot draw is named in `ports.ts`' `elsewhere`, with the
  spec that draws it; fill each generated test in `test/parity/<name>.parity.spec.ts`
  (Badge's and Separator's show how) and add the edges React's tests cover.
- Each event names the spec that fires it (`ports.ts` `events`): mount both, listen on the
  part with `h(KozmosX, { onUpdateOpen: … })`, act, and compare what each heard.
- In `scripts/vue/coverage.mjs`, name each story's interaction
  (`scripts/check-vue-interactions.mjs`), or why it has none.
- Every new Vue story is a new Visual Review baseline. Record nothing yourself: list the
  stories in the pull request for whoever records in Docker (AGENTS.md).

## 8. Docs

Point the Vue tab of `packages/react/src/components/<Name>/<Name>.mdx` at
`@kozmos-ds/vue` (`pnpm docs:snippets:vue:check` holds each import to the entry that exports
it), and add the part to the list in `apps/docs/src/platform-support.mdx`.

## 9. Take it out of the bridge

One name is one component: a part leaves `src/react-bridge/index.ts` when its port lands.
Take out its `createVueWrapper` line and its import, its cases in the bridge's specs
(`Listeners.spec.ts`, `VModel.spec.ts`, `Booleans.spec.ts`: grep for `Kozmos<Name>`), and
run `pnpm --filter @kozmos-ds/vue bridge:takes` to regenerate `part-takes.ts` (never edit
it). In `scripts/check-component-contracts.mjs`, an assertion that the bridge wraps the part
becomes one that the main entry exports it (Button's, Badge's).

`coverage.spec.ts` fails while both entries export the name. When another session owns the
bridge, name the part in `LEAVING_BRIDGE` in `test/ports.ts`, with why, and leave its bridge
entry to that session: an entry there that is not both native and bridged fails too.

## 10. Regenerate, then check

```bash
pnpm --filter "@kozmos-ds/react..." build && pnpm --filter @kozmos-ds/vue build
pnpm skills:build                               # docs/claude-design, after building React
pnpm --filter @kozmos-ds/vue test               # contract, parity, coverage, scaffold, React-free
pnpm --filter @kozmos-ds/vue test:react18
pnpm --filter @kozmos-ds/vue typecheck
pnpm --filter @kozmos-ds/vue lint
pnpm --filter @kozmos-ds/docs build-storybook:vue
pnpm components:contract:check
node scripts/release/changeset-required.mjs
```

Never hand-edit a generated file (AGENTS.md lists them).

## 11. Changeset

`@kozmos-ds/vue` is versioned by hand on `next`, outside Changesets: no changeset may name it
(`changeset-required.mjs` refuses one), and its version and CHANGELOG are set in the pull request that
plans its next release (`docs/release-process.md`). Moving a recipe changes
`@kozmos-ds/react`'s `src/`, so add a `patch` changeset for React saying its output is
byte-identical (`.changeset/badge-separator-recipes-shared-with-vue.md`). If
`@kozmos-ds/styles`' `style.css` changes (a Vue source draws a class nothing drew before),
it needs one too; when it is identical, it does not. `changeset-required.mjs` decides.

## Checklist before the pull request

- [ ] `port <Name>` scaffolded it; no `TODO(port)` is left (`test/port.spec.ts` checks)
- [ ] the recipe lives in `packages/react/src/recipes`; React's `index.d.ts` and
      `style.css` are byte-identical to main's, and React's tests for the part pass
- [ ] the element, classes, attributes and children match React's (parity specs green)
- [ ] the contract passes with no new exception, or each one says why
- [ ] every event fires in a spec; analytics events go through `useKozmosAnalytics`
- [ ] stories for every React story; registered in `scripts/vue/coverage.mjs`; listed for
      baselines in the pull request
- [ ] the MDX Vue tab and `platform-support.mdx` name the native part
- [ ] out of the bridge, or in `LEAVING_BRIDGE` with why
- [ ] generated files regenerated; changeset per `changeset-required.mjs`
- [ ] Vue's test, test:react18, typecheck, lint, the Vue Storybook build, the bundle gate
      and `pnpm ci:local` pass
