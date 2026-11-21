# @kozmos-ds/vue

Kozmos for Vue 3, on Reka UI (Vue 3 Phase 0, decision 76). It ships as prereleases on npm's `next` tag,
one after each Vue porting wave, and never on `latest` (decision 162):

```bash
npm install @kozmos-ds/vue@next vue
```

A version reads `<styles version>-next.<n>`: `0.17.0-next.2` is the third built on `@kozmos-ds/styles`
and `@kozmos-ds/react` 0.17.0, which it pins exactly (it installs that stylesheet itself). React is needed only for the bridge, below.

## Two entries

- **`@kozmos-ds/vue`**: the Vue parts. Each draws the element its React counterpart draws, from the same
  recipes, imports no React and renders on the server: `KozmosThemeProvider`, `KozmosDensityScope`,
  `KozmosAnalyticsProvider` (with `useKozmosAnalytics`) and `KozmosButton`, with `useTheme`.
- **`@kozmos-ds/vue/react-bridge`**: every part not ported yet, each a Vue wrapper that mounts the React
  part. It needs `react`, `react-dom` and `@kozmos-ds/react`. A part leaves the bridge when its Vue port
  lands in the main entry, so one name is never two components.

Import the stylesheet once: `import "@kozmos-ds/styles/style.css"`.

## The bridge

**One React tree per compound (GAP-230).** A bridged part in no other bridged part's slot is a React
root. One in another's slot is drawn in that part's React tree, by a portal into its own box where the
React part draws the slot, so it finds the context its compound gives it:

```vue
<script setup>
import { ref } from "vue";
import {
  KozmosRadioGroup,
  KozmosRadioGroupItem,
  KozmosSelect,
  KozmosSelectContent,
  KozmosSelectItem,
  KozmosSelectTrigger,
  KozmosSelectValue,
} from "@kozmos-ds/vue/react-bridge";
const level = ref("1");
</script>

<template>
  <KozmosRadioGroup v-model="level" aria-label="Level">
    <KozmosRadioGroupItem value="1" label="Level 1" />
    <KozmosRadioGroupItem value="2" label="Level 2" />
  </KozmosRadioGroup>
  <KozmosSelect v-model="level">
    <KozmosSelectTrigger aria-label="Level"
      ><KozmosSelectValue
    /></KozmosSelectTrigger>
    <KozmosSelectContent>
      <KozmosSelectItem value="1">Level 1</KozmosSelectItem>
      <KozmosSelectItem value="2">Level 2</KozmosSelectItem>
    </KozmosSelectContent>
  </KozmosSelect>
</template>
```

The parts of Accordion, Card, Dialog, Drawer, Select, Tabs, Tooltip and Toast are bridged, and
`KozmosToaster` draws what `toast()` (React's own, exported here) shows. A slot the React part does not
draw (an inactive tab's panel) shows nothing. Two things are not bridged: a trigger cannot take a Vue
element as its child (`as-child`), so it draws its own button (open a dialog or drawer from a
`KozmosButton` by `v-model:open`); and Table's rows and cells, since a `<table>` holds no box a Vue
slot is drawn in.

**Vue's providers reach the React parts (decision 172).** Every React root the bridge mounts is drawn
inside React's providers, given what the nearest Vue provider holds, and follows its changes:

| Vue provider              | What a bridged part reads                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KozmosThemeProvider`     | React's `ThemeProvider`: the theme, direction, density and tokens; its portal, so dialogs and toasts are in the theme; `useTheme().setTheme` sets Vue's |
| `KozmosDensityScope`      | React's `DensityScope`: the density                                                                                                                     |
| `KozmosAnalyticsProvider` | React's `AnalyticsProvider`, which hands each event to the Vue provider's batch                                                                         |
| (none)                    | a Radix `TooltipProvider`, so a `KozmosTooltip` needs none; `KozmosTooltipProvider` sets the delays inside it                                           |

A part drawn in a compound's tree is given only the providers that sit between it and the compound.
`DesignConfigProvider`'s configuration and reduced motion have no Vue provider yet, and reach no bridged
part.

```vue
<script setup lang="ts">
import {
  KozmosAnalyticsProvider,
  KozmosButton,
  KozmosThemeProvider,
  type KozmosAnalyticsEvent,
} from "@kozmos-ds/vue";
import { KozmosCheckbox } from "@kozmos-ds/vue/react-bridge";
const send = (events: KozmosAnalyticsEvent[]) => console.log(events);
</script>

<template>
  <KozmosThemeProvider theme="dark" density="compact">
    <KozmosAnalyticsProvider @dispatch="send">
      <!-- reports checkbox_toggled -->
      <KozmosCheckbox aria-label="Step-free" />
      <!-- reports button_clicked -->
      <KozmosButton>Save</KozmosButton>
    </KozmosAnalyticsProvider>
  </KozmosThemeProvider>
</template>
```

**Props in either case (GAP-238).** An attribute in kebab-case reaches React by its camelCase name, as
Vue gives a declared prop: `<KozmosOTPInput default-value="1234" helper-text="Sent by SMS" />` is React's
`defaultValue` and `helperText`. `aria-*` and `data-*` pass as written; React's types name no other
prop in kebab-case (`pnpm --filter @kozmos-ds/vue bridge:takes` fails on one). Write a custom attribute
as `data-*`.

**Listeners, `v-model` and booleans** are read from React's types: `src/react-bridge/react-adapter.ts`
says how, and `src/react-bridge/part-takes.ts` is generated by `pnpm --filter @kozmos-ds/vue bridge:takes`
after building React. Never edit it by hand.

## Tests

```bash
pnpm --filter "@kozmos-ds/react..." build
pnpm --filter @kozmos-ds/vue build
pnpm --filter @kozmos-ds/vue test
pnpm --filter @kozmos-ds/vue test:react18
```
