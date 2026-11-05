# @kozmos-ds/react

## 0.15.1

### Patch Changes

- 13a3908: Button's recipe (`buttonVariants`, its emotions' tiers and custom properties) and the loading arc's drawing move into a module of their own inside the package, `recipes`, which `@kozmos-ds/vue` builds its Button from, so the two draw the same element (Vue 3 Phase 0). Nothing changes for a product: `Button`, `buttonVariants`, `BUTTON_EMOTIONS` and `ButtonEmotion` are exported as before, the package exports the same 276 names, and Button, its stories, every variant and emotion, and Pagination render the same HTML. The published files gain `dist/esm/recipes/`, and Button's, SpinnerArc's and Pagination's modules import from it.
- 141c343: **`@kozmos-ds/styles` is new: the Kozmos stylesheet, built once for every Kozmos web package** (Vue 3 Phase 0; Olcay's answer of 16 Oct). It holds `style.css` (the tokens for both themes and both densities, the owned `.kozmos-*` rules, the scoped preflight and the utilities the parts draw with) and `reset.css` (the opt-in host reset), exported as `@kozmos-ds/styles/style.css` and `@kozmos-ds/styles/reset.css`. Its Tailwind build reads React's and Vue's sources, so a class either draws is in it. It ships no JavaScript, and installs nothing else: the tokens are built into `style.css`, so `@kozmos-ds/tokens` is only what its build reads.

  `@kozmos-ds/react` now takes its stylesheets from it and still ships both, byte for byte as before: `@kozmos-ds/react/style.css`, `@kozmos-ds/react/reset.css` and `@kozmos-ds/react/dist/style.css` resolve as they did, so nothing changes for a product. React pins `@kozmos-ds/styles` exactly, and the two are released together, at one version.

  `@kozmos-ds/tokens` is named with no release: its check data (`src/contrast-contract.json`, which its tarball does not carry) points at the stylesheet sources' new folder.

- Updated dependencies [c1a9dec]
- Updated dependencies [141c343]
  - @kozmos-ds/icons@0.9.0
  - @kozmos-ds/styles@0.15.1
  - @kozmos-ds/tokens@0.8.1

## 0.15.0

### Minor Changes

- f651f02: Accordion has a boxed form (decision 149), for a form in steps, as Pointr Cloud's building editor is: `variant="boxed"` on `Accordion` draws each section as a box of its own, 8 apart, with a hairline while closed, `theme-900` while open, and the content in the panel's flow under its header. A header is the density's control height, 40 compact and 44 touch. `AccordionTrigger` takes `label`, the small line over the title, and `icon`, the boxed form's, and `loading`, in either form: a spinner where the chevron is, `aria-busy`, and the trigger disabled while it is set. `AccordionTriggerProps` is exported. The strings are the product's: there is no built-in step count. Every existing Accordion renders as it did, down to its attributes. The default form's keyframes now carry `overflow: hidden`, which changes nothing there: its content is `overflow-hidden` already. The published stylesheet grows by about 0.22 KB.
- 3c63da1: `CardTitle` takes `as`, `h2` to `h6`, as `Heading` does, and is an `h3` without it (GAP-205, decision 129). It was always an `h3`, so a card under a page titled with an `h1` skipped a level, and axe reported heading-order. The level follows the page's outline: under an `h1`, a card's title is `as="h2"`. There is no `h1`, the page's own title.
  - **It changes what a screen reader hears, not the title's look:** every level is drawn as the `h3` was.
  - **Its ref is typed `HTMLHeadingElement`;** it was `HTMLParagraphElement`. A ref of either type still fits, and it lands on the heading element as before.
  - **Nothing to migrate.** A title without `as` is the `h3` it was. A card that set `aria-level` on its title to work round this can drop it and pass `as`.

  SwiftUI's `KozmosCardTitle` and Compose's are now headings as well, with no level and no new API: see `packages/ios/CHANGELOG.md` and `packages/android/CHANGELOG.md`.

- ed6c330: **Production builds no longer carry component names.** Each part's `displayName` is now set only when `process.env.NODE_ENV` is not `"production"`, so a development build shows `Button`, `AdaptiveMapShell` and every other name in React DevTools and React's warnings as before, and a production build shows `ForwardRef` or `Anonymous` there. Kozmos reads no `displayName` itself.

  In exchange, an app's bundler now leaves out every part the app does not use, even one in the same module as something it does. The calls that make a part (`forwardRef`, `memo`, `createContext`, `cva` and the theme's portals) are marked pure, and the name that used to keep each part alive is gone from a production build. Importing `DEFAULT_PANEL_DETENTS` cost the whole map shell, about 8 KB gzipped; it is now about 140 bytes. `DialogTrigger` alone no longer brings in Dialog, nor `SelectValue` all of Select. Everything at once is about 2 KB smaller gzipped, and no part costs more than before on its own.

  Your bundler, or the ESM CDN that serves the package, must replace `process.env.NODE_ENV`, as React itself needs: Vite, webpack, esbuild and Rollup with `@rollup/plugin-replace` do, and so do esm.sh and jsDelivr's `+esm`. A page that loads the files in `dist` unbundled, with nothing to replace it, now throws `process is not defined` when it imports them. In 0.14.0 the same page threw later, when a `Backdrop` first rendered or a part reported an event with no `AnalyticsProvider` around it, since both already read the variable.

- 3305adc: Three control props, approved for 0.15.0 (decision 119):
  - **`IconButton` `counter`**, **`counterLabel`** and **`counterSeparator`** (GAP-197): a count over the icon's top-end corner (the top-left in right to left), drawn as Kozmos's `Counter` in the theme fill, its bottom on the button's centre line and its start 2px past it (on a 28 help button, where the MAP-64 design places it). It is read with the button's name, whether that is `aria-label`, `aria-labelledby` or the content: "Help, 3" by default, or in `counterLabel`'s words (`(count) => string`, in the product's language) after `counterSeparator` (", " by default). The drawn number is hidden from readers so it is not read twice. In forced colours it is outlined. `IconButtonProps` is now an interface of its own, extending `ButtonProps`.
  - **`CardHeader` `actions`** (GAP-169): what acts on the card at the header's inline end, after the title and description in reading and Tab order, centred on the title's line, whatever their size, without making the header taller for an icon button. `CardHeaderProps` is exported.
  - **`Input` `action`** (GAP-154): a button inside the field's end, drawn as PasswordInput's reveal is. `{ kind: "copy" }` copies the value and says "Copied" (`copiedLabel`) in a polite live region, again on a second copy, with a check in place of the copy icon for two seconds; `{ kind: "toggle" }` is a pressed button with its own name (the Featured star); pressed, it is a 32 disc of the theme fill under the icon in the fill's foreground, as a pressed ToggleButton is, so the state is not a colour alone, and a Highlight disc in forced colours. Giving a field an action, or taking it away, keeps the same input, its focus and its typed value. `InputAction` is exported.
  - **`inputVariants` and `InputStatus`** move to a module of their own and are exported as before, so the fields that share Input's recipe (PasswordInput, DatePicker, Search and the rest) no longer bundle Input's action.

  Nothing changes for a product that sets none of them.

- 4f33591: A product offers its own actions, with its own words and icons, on a search result and on the details card (GAP-028, GAP-130; decision 119): "Reserve a table" on a restaurant's result, "Get live directions in Pointr Express" on the details card, beside the actions Kozmos names.
  - **The contract.** `POIHostActionPresentation` is new in `@kozmos-ds/product-contracts`: `id` (the product's own name for the action, handed back when it is pressed, never shown), `label` (already localized), and optional `iconName` (a name in the Kozmos icon registry) and `disabled`. `POIResultPresentation.hostActions` and `POIDetailsPresentation.hostActions` carry them. SwiftUI's and Compose's contracts have the same shape (`KozmosPOIHostActionPresentation`), compared by `contracts:parity:check`.
  - **POIResultCard** draws `result.hostActions` after `result.actions`, in the order given, in the same row and revealed with it on the selected, available result, as outlined buttons: the icon before the words, hidden from screen readers. On the web the card draws the icon from the new `hostActionIcons`, the `@kozmos-ds/icons` components for the names the actions use (`{ calendar: Calendar }`), and none for a name it is not given. It is web only (decision 140): on the web a UI icon is a named import (decision 121), and a lookup by name would bundle every icon a name reaches, about 20 KB gzip, into an app that imports only `POIResultList` (measured 18.8 against 38.9 KB). SwiftUI and Compose draw `iconName` by name and take no such map. A press reaches the new `onHostAction(actionId, poiId)` and never selects; without it they are drawn disabled, as the card's own actions are without `onAction`. A result whose only actions are the product's says so through the select row's `aria-expanded` and `aria-controls`. `POIResultList` and `POIResultGroup` hand `onHostAction` and `hostActionIcons` to every card.
  - **Analytics:** a press sends `poi_result_action`, as the card's own actions do, with `action: "host"` and `hostActionId`, beside `poiId` and `resultIndex`. A disabled action sends nothing.
  - **POIDetailPanel** draws `details.hostActions` last in its action strip, after book and call, as outlined buttons with a 24px icon, drawn by its registry name, as the card's tags already are. A press reaches the new `onHostAction(actionId, poiId)`; without it they are drawn disabled. `hostActionStates`, by `id`, gives each the disabled, loading and message states a supplementary action has, and their messages follow the supplementary ones.
  - **SwiftUI and Compose** draw both the same way and send the same event: `onHostAction` on `KozmosPOIResultCard`, `KozmosPOIResultList` and `KozmosPOIResultGroup`, and `hostActionStates` and `onHostAction` on `KozmosPOIDetailPanel`, each after the released parameters. On Compose the card's, list's and group's `onHostAction` sits before `onAction`, which stays the trailing lambda, with an overload that keeps 0.14.0's positional calls. Compose's details strip no longer runs a disabled or loading action that TalkBack, or a test, invokes directly.
  - **Figma:** POIResultCard's action row and POIDetailPanel's action strip gain a hidden Host Action, shown by a Host Action boolean, its words a Host Action Text property. Code Connect's examples on all three platforms pass `onHostAction`.

  Nothing changes for a product that passes no host actions.

- a3e1e7e: Layout props for 0.15.0 (decisions 119, 147 and 150):
  - **`Navbar` `navigationAlign`** (GAP-196): `"start"`, `"center"` (the default, as before) or `"end"`, where the navigation sits in the room between the leading slots (logo, context, primary action) and the trailing ones (actions, utilities, account). Logical: `"end"` is the left in right to left. Pointr Cloud draws its main sections at the end.
  - **`Sidebar` `inset`** (GAP-199): `"flush"` drops the 24 above the first slot, and on a rail with no header the navigation's 16 too, so the first item sits flush under a fixed header. An expanded sidebar keeps the navigation's 16, the room its items' focus rings take outside them. `"default"` is the sidebar as before.
  - **`Drawer` `placement`** (GAP-198), as Backdrop's: `"inline"` draws the drawer in place, `absolute` against the nearest positioned box, so a panel sits in the region under a fixed header instead of covering it. `"fixed"`, the default, is the drawer as before. BottomSheet, which is Drawer, takes it too. `DrawerPlacement` is exported.
    - **It floats** (decisions 139 and 148): a right or left inline drawer sits 16 from every edge of the region it reaches, 420 wide (or the region less 16 each side), as tall as its content up to the region less 16 at the top and bottom, then scrolls, with its border and the container's corners all round. A top or bottom one stays at its edge.
    - **Not modal, the default inline, it is a panel, not a dialog:** a `complementary` landmark, with no focus guards round the page. It takes focus only when its `DrawerTrigger` opens it. Tab and Shift+Tab leave it, and a product's `onKeyDown` sees them. A press or focus outside leaves it open; to close it then, close it in `onInteractOutside`, which a press on its trigger doesn't reach. Escape closes it only from inside, and Escape in the page reaches the page unprevented, so a Search clears and an AICompanionPanel closes. Closing gives focus back only if it was inside. With `modal`, it is a dialog with its scrim over the region alone. Inline, a top or bottom drawer, and a BottomSheet, stop at the region.
  - **`Navbar` `logoInset`** (GAP-208, decisions 147 and 150): sets `logo` in a column as wide as Sidebar's rail, from the bar's edge, so a Home tile sits over the rail and what follows starts past it. Logical, so it mirrors right to left. A boolean: the only right width is the rail's. SwiftUI's and Compose's `KozmosNavbar` take it too.
  - **`DrawerContent` `closeLabel`:** the close's accessible name, "Close drawer" by default, as Dialog's. The close and the room `DrawerHeader` leaves for it are now on logical sides, and the header's words start at the inline start, so all three mirror right to left. Left to right nothing moves.
  - **`Tree` `divided`** (GAP-201): a 1px stroke in the border role under every row, outside the row's height, and an open parent row on background 50. The hover and selected fills keep their corners over the surface, and the focus ring is drawn inside the row. `bleed` (a length, or pixels) takes the stroke and the surface past the tree to the panel's edges while the rows stay put. Rows composed in a divided Tree are divided too; `TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` take `divided` of their own.

  Nothing changes for a product that sets none of them, except right to left, where Drawer's close and header now mirror.

- 8f2e6df: `Link` takes `external`: a link that opens in a new tab, and says so (GAP-202, decision 122), for the links that leave a product, such as Pointr Cloud's Privacy Policy, Terms of Service and Documentation.
  - **A new tab.** `target="_blank"` with `rel="noopener noreferrer"`, so the new page cannot reach the one that opened it. A caller's own `target` or `rel` still wins, whole.
  - **An icon.** The new-tab icon, `LinkExternal01` from `@kozmos-ds/icons`, at the link's inline end, after a no-break space: the text's size (1em) and colour, hovered too, and hidden from assistive technology. The no-break space and the icon are one unbreakable run with the link's last word, so the icon never starts a line alone. Right to left, it is mirrored to point to the link's end, as Compose's AutoMirrored new-tab icon and SwiftUI's forward arrow are.
  - **An announcement.** "opens in a new tab", read after the link's name ("Privacy Policy opens in a new tab"), and never drawn. `externalLabel` gives it the product's words; an empty one says nothing more. An `aria-label` on the link replaces its content, this announcement with it.
  - **A caller's `target`.** It wins, and one that keeps the link in this tab (`_self`, `_parent`, `_top`) opens no new tab, so the link adds no `rel` and draws neither the icon nor the announcement.
  - **New props:** `LinkProps` gains `external` and `externalLabel`. A link without `external` is unchanged.

  SwiftUI's and Compose's `KozmosLink` take `external` too, with the same icon: SwiftUI says "Opens in your browser" as an accessibility hint, and Compose "open in your browser" as the click's label. Figma's Link has an External property that shows the icon.

- 6fd18c2: `Progress` takes `shape="circular"`: a ring for a count out of a total, as MAP-64's Level Manager shows its levels added (decision 131, GAP-038). `shape` is `"linear"` by default, the bar as it was.
  - **The ring.** `size` is its diameter and stroke: `sm` 48 and 4, `md` 96 and 8 (the default), `lg` 128 and 12, the layout spacing tokens 600, 900 and 1000 and 50, 100 and 150. It is one SVG, a circle's two strokes, so nothing is inset and nothing sits off centre: the band measures its stroke all the way round in Chromium, Firefox and WebKit, at 1x and 2x. The track is background 100.
  - **Its tone.** `tone` says what its completion means, in Tag's and Button's emotions (`Emotion`): `themed` (the default), `neutral`, `success`, `informative`, `alert` or `danger`. The arc is the emotion's text colour, so `themed` is theme 600, the bar's own fill. Every tone reads 4.80:1 or more on the track in light and 5.18:1 or more in dark.
  - **Its direction.** The arc starts at 12 o'clock and runs clockwise for `value` of `max`, and a progress ring does not mirror: right to left draws the same ring, while the label follows the reading direction.
  - **The label.** `label` is drawn in the hole, inside the square it holds, or with `labelPlacement="end"` beside the ring, 12 from it at the inline end (on its left right to left) and centred on it; 12 on 16 unless its content says otherwise. It stays a `progressbar` with its value, and the label is said once wherever it is drawn: it names the bar, or describes it when `aria-label` or `aria-labelledby` already names it (after any `aria-describedby` of the caller's), and the drawn copy is `aria-hidden`. For a count, `getValueLabel` (Radix's) says "11 of 15" in place of "73%". A bar draws no ring: `size`, `tone`, `label` and `labelPlacement` draw nothing on it, and none reaches the DOM.
  - **Motion and forced colours.** A new value sweeps round over the standard duration; under reduced motion, the media query's or `DesignConfigProvider`'s, it is drawn there at once. In forced colours the arc is the system's Highlight on a GrayText track, whatever its tone.
  - **No value** draws the track alone; an indeterminate ring is GAP-159's.
  - **Over the total.** A value past `max` is all of it, a full ring, and `aria-valuenow` says `max`, as SwiftUI and Compose clamp it. The bar does the same: until now, on the web, it drew empty and Radix logged an error.
  - **Complete at `sm`.** "100%" is 31.8 wide at 12, in the 28.28 square an `sm` hole holds, so a whole `sm` ring with no `label` draws a check in its hole: `Check`, as Stepper's, at 24, in the ring's tone, and in forced colours Highlight, as the arc is. A value over `max` counts. It is decoration: `aria-valuetext` still says 100%, and a ring with no other name is named "100%". A `label` of the product's always wins, in the hole or beside the ring, and "100%" passed as a `label` is one; `md` and `lg` hold the number and draw no check.
  - **New type:** `ProgressProps`, `Progress`'s props with `shape`, `size`, `tone`, `label` and `labelPlacement`.

  SwiftUI's and Compose's `KozmosProgress` take `shape`, `size`, `tone` (a `KozmosEmotion`), `labelPlacement` and a `label`, drawing the same ring from the same tokens. Figma's Progress set gains Shape (Linear, Circular), Size (Small, Medium, Large) and Tone (the six emotions) axes, a Label with Show Label and Label Beside, drawn by the importer; its five variants keep their node ids. Both natives draw the check at `sm`, and Figma's Small ring at 100 draws it in place of the label, so Show Label has nothing to draw on those six variants; `Emotion/themed/text` and `Emotion/neutral/text` gain the stroke scope, as the other four tones have it.

- b6c660b: `AdaptiveMapShell` gets a `status` slot and two top corner slots, `controlsTopStart` and `controlsTopEnd`, which the shell places clear of its top bar, `controls` column, panel or sheet, credits, bottom corners and floor lists (GAP-123, SDK-UI-002, decision 119).
  - **`status`** is the map's status, a `MapStatusPill` saying "Route updated" or "Calculating step-free route". It sits between the bottom corners, level with them. It is centred on the whole map, as the credits are, and the credits give way to it, directly above it. With no middle slot between the corners it rises above them, and the credits above it. A pill kept rendered with no words takes no room. With no room above the sheet the status is not drawn, and it still announces. It never pads the camera, so a status coming and going does not move the map, and it moves only what it reaches: a tall side panel or `controls` column clear of it and the credits keeps its height.
  - **`controlsTopStart` and `controlsTopEnd`** are the logical top corners, 16 under the top bar and mirrored in right to left, beside a side panel. Exit building goes at the start, as a recipe with a labelled `MapControlButton` (SDK-UI-006), and the map's information at the end. They share a row, or the start sits above the end when both do not fit. A `controls` column starts 16 below them. They share one landmark, `topControlsLabel` (default "Map top corner controls"). They pad the camera's top only with `controlsPadCamera`. With no room above the sheet they stay mounted and leave the region, as the bottom corners do.
  - **What the shell reports.** `onLayoutChange().occlusions` reports the top corners' row as one `controls` rectangle, as it reports the bottom corners, and the status's slot as a new `status` kind, which `MapOcclusion` in `@kozmos-ds/product-contracts` now includes. A floor list opened in a bottom corner stays below the top corners.
  - SwiftUI and Compose do not have these slots yet.

- ac7487f: The stylesheet is 0.66 KB smaller gzip, and 7,255 bytes smaller raw, before what this release adds. Every Kozmos part draws as it did, and no element Kozmos renders carries what went. What a product could notice:
  - **55 utilities nothing in Kozmos uses are gone.** A class a product passes through `className` applies only if Kozmos's stylesheet has it, and these it no longer has. Tailwind made them because it read Kozmos's own CSS files, from each class an `@apply` names and from property names such as `flex-shrink`, and it no longer reads those files. A product that uses one needs its own Tailwind or its own CSS: `h-control`, `h-control-sm` and `h-control-lg` read `--density-control-height-md`, `--density-control-height-sm` and `--density-control-height-lg`.
    - the plain ones: `animate-spin`, `backdrop-filter`, `border-collapse`, `border-none`, `border-y`, `drop-shadow`, `flex-shrink`, `h-control`, `h-control-lg`, `h-control-sm`, `left-2`, `outline-2`, `outline-offset-2`, `outline-ring`, `pe-16`, `ps-9`, `rounded-e-control`, `rounded-s-control`, `transition-[max-width,opacity,margin]`, `transition-[max-width,padding,background-color,color]`;
    - the colours of Button's recipes, and one surface (eight more, three here and five among the states below, read Button's own `--kz-button-*` properties, which only Button sets): `bg-[var(--components-primary-buttons-danger-button-background-idle)]`, `bg-[var(--components-primary-buttons-neutral-button-background-idle)]`, `bg-[var(--components-primary-buttons-themed-button-background-idle)]`, `bg-[var(--primitives-colors-background-200)]`, `border-[var(--components-secondary-buttons-themed-button-foreground-content-idle)]`, `text-[var(--components-primary-buttons-danger-button-foreground-content-idle)]`, `text-[var(--components-primary-buttons-neutral-button-foreground-content-idle)]`, `text-[var(--components-primary-buttons-themed-button-foreground-content-idle)]`, `text-[var(--components-secondary-buttons-themed-button-foreground-content-idle)]`
    - hover, focus and pressed: `active:bg-[var(--components-primary-buttons-danger-button-background-pressed)]`, `active:bg-[var(--components-primary-buttons-neutral-button-background-pressed)]`, `active:bg-[var(--components-primary-buttons-themed-button-background-pressed)]`, `active:scale-[0.98]`, `focus-visible:bg-[var(--components-primary-buttons-danger-button-background-focus)]`, `focus-visible:bg-[var(--components-primary-buttons-neutral-button-background-focus)]`, `focus-visible:bg-[var(--components-primary-buttons-themed-button-background-focus)]`, `hover:bg-[var(--components-primary-buttons-danger-button-background-hover)]`, `hover:bg-[var(--components-primary-buttons-neutral-button-background-hover)]`, `hover:border-[var(--components-secondary-buttons-themed-button-foreground-content-hover)]`, `hover:text-[var(--components-secondary-buttons-themed-button-foreground-content-hover)]`
    - file and placeholder: `file:bg-transparent`, `file:border-0`, `file:font-medium`, `file:text-sm`, `disabled:placeholder:text-muted-foreground`, `placeholder:text-[color:var(--primitives-colors-foreground-400)]`, `placeholder:text-destructive/60`.
  - **`--tw-drop-shadow`.** The stylesheet registers 16 of Tailwind's compiler variables, down from 17: `drop-shadow` was the only rule that set or read this one.
  - **Value text.** `var( --semantics-radius-control )` and `calc(a * b)` are written `var(--semantics-radius-control)` and `calc(a*b)` in ordinary declarations. `+` and `-` keep their spaces, and strings and `url()` are left as they are. Every value computes as it did; only a tool that reads `style.css` as text sees the difference.

- 588e61b: `toast()` and `<Toaster>` (GAP-167, decision 119), on the Radix Toast the parts already use, with no new dependency. Mount one `Toaster` inside the ThemeProvider and call `toast(title, options)` from anywhere: an event handler, a request's callback, a module outside React. It returns the toast's id.
  - **Tones.** `tone` is `neutral` (the default, no icon), `success`, `info`, `warning` or `critical`: Notice's tones, with the success GAP-160 asks of Notice. A tone is an icon at the inline start (the Alert set's icon for it in Figma), in the tone's text colour, which holds 3:1 on the toast's background; the surface stays the background (GAP-58). `Toast` takes the same optional `tone`; without it a toast is drawn exactly as before.
  - **Announced.** Each toast once, by Radix's live region, which says its `aria-live` out loud (GAP-193), so a modal Select, Menu or Dialog that hides the page does not silence it, while the toasts behind such a popup are hidden and inert together: a `critical` toast assertively, every other tone politely, unless `live` says otherwise. Radix joined a toast's words with nothing between them ("Could not saveTry again."); the Toaster's are spaced. The toasts themselves are not live regions, so nothing is said twice.
  - **Focus.** A toast never takes it. F8 (`hotkey`) moves focus to the toasts. Escape closes the focused toast, or, with focus anywhere else, the newest one (Radix's layers), and leaves focus where it is.
  - **Time and the queue.** `duration` (5 seconds, or the call's own; `Infinity` keeps it) runs from when a toast is drawn and pauses while the toasts are hovered or focused. `limit` (3) show at once, oldest first; the rest wait their turn. A call with an existing `id` replaces that toast where it is and announces it again. `toast.dismiss(id)` closes one and `toast.dismiss()` all; `onDismiss` runs once, however a toast closes (its close button, a swipe, Escape, its action or the call). Being replaced is not closing: a replaced toast's `onDismiss` runs when its replacement closes, before the replacement's own. A closing toast slides out before it goes.
  - **Words.** `label` names the region ("Notifications ({hotkey})"), `toastLabel` comes before each announcement ("Notification"), `closeLabel` names each close button ("Dismiss notification"), and an action's `altText` is what a screen reader hears in place of its button.
  - **Reduced motion.** Under `prefers-reduced-motion: reduce` or the design config's `motion: "reduced"`, which reaches the theme's portal, a Toaster's toast arrives, leaves and springs back without moving; a swipe still follows the finger.
  - **Where it draws.** In its ThemeProvider's portal, in that provider's theme, direction, density and tokens, so a box it is rendered in (a map that isolates its stacking, a panel that clips) cannot trap it. A Toaster with an `id` draws the toasts whose `toaster` option names it; of two Toasters with one id, the first mounted draws and the other stays empty.
  - **Beside a panel, and right to left.** The toasts sit at the window's bottom inline end, on layer 100, above every Kozmos overlay (50), an open Drawer's included. The Toaster's `style` reaches its list, so a product moves it clear of a panel that stays open there (`style={{ insetInlineEnd: 468 }}` beside a 420 panel floating 16 from the edge). Right to left the list sits at the inline end, the left, and a toast is swiped and leaves that way: `ToastViewport` is now at `sm:end-0`, where it was `sm:right-0` (the same left to right), and a `Toast` whose provider's `swipeDirection` is `left` leaves to the left. `ToastProvider` now takes that side from the ThemeProvider's `dir` when it isn't told, so a toast built from the parts swipes and leaves the same way, and a caller's `swipeDirection` still wins.
  - **On the server.** `toast()` does nothing and a Toaster renders no toast, with no warning under React 18 or 19.

  The existing parts work as they did left to right: `Toast` gains only the optional `tone`. SwiftUI and Compose have no `toast()` and no tones yet.

- 1dcdaf8: `Icon` and `getIconComponent` take a curated venue set by name (GAP-105, decisions 119 and 121): the categories, amenities and services a visitor looks for, 15 names from artwork the package already holds, on React, SwiftUI and Compose.
  - **Categories:** `utensils`, `medical-cross`, `plane`, `clapperboard`, `graduation-hat-01`, `beaker-01`.
  - **Amenities:** `accessibility`, `credit-card-01`, `battery-charging-01`, `droplets-01`.
  - **Services:** `luggage-01`, `passport`, `ticket-01`, `package`, `scissors-01`.

  Their definitions carry the categories `Venue categories`, `Venue amenities` and `Venue services`, and 40 new aliases take the names a product already holds: a taxonomy type (`food-beverage-space`, `boarding-gate`, `atm`, `charging-station`, `entrance-exit`), a service type in kebab case (`first-aid`, `ticketing`), or a word (`dining`, `shopping`, `information`, `favourite`). An alias can now stand for a name beyond the library, so `kozmosIconAliases` reaches `security-control` and `route-entrance-exit`.

  ```tsx
  <Icon name="utensils" />
  <Icon name="food-beverage-space" /> // the same glyph, by its taxonomy type
  ```

  `Icon` names grow only by this set: a UI icon stays a named import, `<Icon icon={Copy01} />`, and `copy-01`, `star-01` and `pencil-01` are not names. Toilets and parking have no glyph, so they have no name or alias; draw them with the taxonomy's `iconUrl`. The package README lists the set, how it was chosen and what was left out.

  **What it costs.** A lookup by name, which `Icon`, `getIconComponent`, `isKozmosIconKey` and POIDetailPanel all do, goes from 19.84 to 23.44 KB gzip, 101 icons where it was 86. It would be 24.93: a lookup no longer carries each definition's Figma node, category and description, so `kozmosIconRegistry` is built from a list of its own rather than from `kozmosIconDefinitions`, with the same names and components. A named import costs what it did.

  `kozmosIconRegistry` and `kozmosIconDefinitions` keep their shapes. `KozmosIconDefinition` gains the `KozmosOwnedIconDefinition` arm, `source: "owned"`, for `utensils` and `accessibility`, which have no `figmaNodeId` because the Pointr Icon Library has no such outline. A consumer that reads `figmaNodeId` from every definition narrows on `source` first, as it already had to for `KozmosTaxonomyIconDefinition`.

### Patch Changes

- ca31a09: **Notice draws each tone's own mark.** Every tone drew the warning triangle by default, so an `info` notice read as a warning. `info` now draws an info circle and `critical` an alert circle, the marks Toast gives the same tones, and `warning` keeps the triangle. A caller's `icon` still wins, and `icon={null}` still draws none.
- 99a6d00: TourStep's Close no longer takes a row, so the card fits itself. Close keeps its size (32 at
  compact density, 44 at touch) and sits out of the flow in the card's top corner, its icon on the
  eyebrow's line, or on the title's first line with no eyebrow. The eyebrow's row hugs its line and
  sits 8 above the title, where it was 12 below a 32 or 44 row, and with no eyebrow the title starts
  at the top of the card. The eyebrow and the title wrap before Close, and only when there is one.
  Close's focus ring is drawn inside its target. DOM order, focus order and the card's width do not
  change.

  A product that measured the card: with the same number of lines, a step is 32 shorter at touch
  density and 20 at compact; a card with Close and no eyebrow (a coachmark) 56 and 44; a card with an
  eyebrow and no Close (the welcome card) 4. With a Close, the eyebrow is 38 narrower at touch and 32 at compact, and
  so is the title at touch or with no eyebrow, so a title that only just fitted there may take
  another line, 28 tall. At compact, a title under the eyebrow keeps the card's width.
  `.kozmos-tour-step-header` now holds the title too, and renders on every card.

- Updated dependencies [5ac75f1]
- Updated dependencies [4f33591]
- Updated dependencies [b6c660b]
- Updated dependencies [1dcdaf8]
  - @kozmos-ds/product-contracts@0.10.0
  - @kozmos-ds/icons@0.8.0

## 0.14.0

### Minor Changes

- 1c4110a: `Backdrop` is drawn in the theme's portal, as Popover and Dialog are. Rendered inside a box that isolates its stacking (MapView, site GAP-40), clips or transforms what it holds, a fixed `Backdrop` was trapped in it: drawn under a sticky Navbar or the shell's top bar and panel, so the page was not dimmed. It now covers the window from wherever it is rendered, and its cut-out still lets presses through to its target.
  - **The DOM moves.** The backdrop's element, and its children (a step card), are in the provider's portal root, not in the markup it is rendered in; a product that queried it there finds it in the portal. Like every part drawn there, the element carries the provider's density (`data-kozmos-density`). Its own class, id, attributes and ref are unchanged, it adds no wrapper, and React still carries its children's events up the tree it is rendered in.
  - **Inside a modal** (Dialog, Drawer, BottomSheet), which makes everything outside its content inert, it is drawn in the modal's content instead, as it was drawn in place before: it blocks presses on what it dims, its children take focus inside the modal's focus trap, and neither is hidden from readers.
  - **`placement`** is new: `"fixed"` (the default) as above, or `"inline"`, drawn in place, `absolute` over the nearest positioned box, to dim one region (site GAP-34). **Migration:** a product that dimmed a region with `className="absolute"` passes `placement="inline"` now; a fixed backdrop given a positioning class (absolute, relative, static or sticky) warns once in development and says so.
  - **Its ref** is set with the element, in the commit the element arrives in, as before. The cut-out is drawn once the portal exists.
  - **Server rendering:** a fixed backdrop is no longer in the server's HTML; it is drawn a render or two after hydration, once the provider's portal exists. An inline one renders on the server as before.
  - **Stacking:** a fixed backdrop and the popovers share the portal and the layer, so whichever opened last is on top: a Backdrop opened while a Popover, Menu or Tooltip is open dims it, and one opened after is above the backdrop. Drawn in the page before, the backdrop was under every popover.

- a1e8b1b: `Backdrop` takes `target`, and lights it: a tour dims the page and lifts the one control its step points at (GAP-189, MAP-64). `target` is an element, a React ref to one, a virtual element (anything with `getBoundingClientRect()`), a rect in the viewport's coordinates, or a list of them lit as the one box round them all.
  - **The cut-out.** The dim covers everything else. The cut-out is the target padded by `targetPadding` and rounded by `targetRadius`, in pixels, which default to the tokens layout.spacing.100 (8) and radius.control (16), read where the backdrop is drawn. It is ringed 2px outside in the focus colour (`ring`, theme 600), with a border that forced colours keep and draw in the system's Highlight.
  - **Pointer events pass through the cut-out**, so the control can be pressed; the dim catches them everywhere else. The dim is an inner scrim whose clip-path leaves the cut-out out of both what it draws and what it hits, so the backdrop's own children (a step card) are never clipped and take the pointer as before, over the cut-out too. A 0 by 0 virtual element or rect (a map point) is lit as a point: the cut-out is the padding round it, its radius half its size.
  - **The target is never moved or re-stacked.** Nothing re-parents it or changes its z-index or style. The cut-out follows it: as it resizes (a ResizeObserver), as anything that scrolls it scrolls, as the window resizes, and, while it is lit, every frame, as Floating UI's autoUpdate can, so a target moved by layout above it or by a transform (a sheet still sliding in) is followed too, and a virtual element is read again each frame. It writes only when the cut-out moves. A ref is read every frame while the backdrop is open, so one whose element comes later in the tree, or is filled later, is lit when it is there. An element that draws no box of its own (`display: contents`) is lit by its children's box.
  - **Motion.** When the tour moves on, to other elements, the cut-out glides from where it was over the standard duration and easing; under reduced motion (the media query, or the config's) it moves at once. A cut-out that has not yet been painted is never glided from, and a rect or virtual element that moves (a map point as the map moves) is followed, never glided to.
  - **With no target**, or one that is not there (a ref to nothing, an element with no box, an empty list), the whole page is dimmed, as Backdrop did. Without `target` the backdrop is exactly the element it was, its children inside.

  Nothing in the dim is focusable and the ring is hidden from assistive technology: saying what is lit is the step's job. With a target, the backdrop's element carries `kozmos-backdrop`, and `data-lit` while it cuts one out; its dim is an inner `kozmos-backdrop-scrim`. The new types are `BackdropProps`, `BackdropTarget`, `BackdropTargetItem`, `BackdropRect` and `BackdropVirtualElement`. In Figma, Backdrop has a Target axis: `Cut-out` lights an example control; Code Connect maps it to `target`.

- 60a9ecd: `ComboboxOption` takes `group` (GAP-192), so Combobox, Listbox and MultiSelect list their options under their groups, as MAP-64's content type picker lists types under their families.
  - **Order.** Options with no `group` come first, unlabelled, before every group, so none reads as part of the group above it. Then come the groups, in the order they first appear in `options`, each group's options together in their own order. A group's name is trimmed, and a blank one is no group. A list with no groups draws as before.
  - **The label** is drawn as `SelectLabel` draws its own: 14/20 semibold, 6 above and below, 12 at the sides. It is an owned rule, `.kozmos-option-group-label`, so it holds where no `@scope` rule reaches.
  - **Spacing.** Combobox's and MultiSelect's lists keep their 2 between rows at every join: a label and its first row, a group's last row and the next label, and the rows with no group and the first label. Listbox's grid keeps its 4 throughout.
  - **Filtering** keeps a group's label while any of its options matches and drops it when none does. A group keeps its element and its label's id as filtering moves it.
  - **Accessibility.** Each group is a `role="group"` named by its label through `aria-labelledby`. The label is not an option: the arrow keys move through the options in the order they are drawn and never stop on a label, as Home and End do in Combobox and Listbox (MultiSelect has neither). With a group's first option active, the group's label is scrolled into view with it. Filtering, the first match made active and `aria-activedescendant` are unchanged.
  - **Presses.** A press on a group's label, or on the list's padding or the gap between rows, leaves Combobox's and MultiSelect's list open and focus in the field, where it closed the list and dropped focus to the page. A press on a row in a Listbox group keeps focus on the list.
  - **Figma.** Combobox, MultiSelect and Listbox take Show Group Labels, Group 1 Text and Group 2 Text. Their Code Connect maps them to `group` as two connections, so a snippet with the labels off names no group at all.

  SwiftUI and Compose do not group yet.

- a771f04: `PopoverAnchor` is exported (GAP-190), Radix's anchor, so a `PopoverContent` can sit beside any element or rect while the product opens it itself, with no `PopoverTrigger`, as a tour opens its step beside the control it points at. `PopoverAnchor asChild` anchors to its child and adds nothing to it, no `aria-haspopup`, no `aria-expanded` and no click that toggles, so a button, link or field keeps its own role. The product opens and closes it through `Popover`'s `open` and `onOpenChange`; `PopoverContent`'s `side`, `align`, `sideOffset` and collision handling place it as beside a trigger, and it follows an element anchor as the page scrolls and the window resizes.
  - **A rect.** `virtualRef`, a ref to anything with a `getBoundingClientRect()`, anchors to a rect, such as a point on a map, and draws no element. The popover follows a rect through scrolling only when the rect names the element it is drawn in as its `contextElement` (the map's canvas); with one, `hideWhenDetached` hides it once the point is scrolled out of the box the canvas sits in, where without one it hides only at the window's edge. A rect that moves on its own, as a panning map's point does, needs `updatePositionStrategy="always"`.
  - **Focus.** `PopoverContent` now gives focus back when it closes with focus lost (Escape, or a button in it that closes it): to what had focus as it opened, or, when that is gone or nothing had focus, to the anchor's element; a rect has none. It acts only when focus was lost, so a tour's next step that has taken focus keeps it, and `PopoverTrigger`'s own return of focus is unchanged; a press outside leaves focus where it landed, as before. `onCloseAutoFocus` with `event.preventDefault()` takes it over.
  - `Popover` is now a component of Kozmos's around Radix's root, taking the same props; `PopoverTrigger` and `PopoverArrow` are unchanged.

- 6fe162c: `Stepper` takes `variant="dots"`: a tour's progress, one dot per step and no label shown (GAP-191, MAP-64). `variant` is `"numbered"` by default, the stepper as it was.
  - **The dots.** Done and pending dots are 8 by 8 and the current one 20 by 8, 6 apart. Done and current are the theme fill (decision 59), so the current one is told by its shape as well as its colour. Pending ones are foreground 500. Every dot is 3:1 or more (WCAG 1.4.11) on the page, a popover and the muted fill, the surfaces measured in each engine: 4.24:1 on the light page and popover and 3.34:1 on the muted fill; 5.65:1 on the dark page and popover and 4.74:1 on the muted fill. The theme fill reads 5.62, 4.42, 3.74 and 3.13:1 on the same four. The wireframe's `#D5DAE3` read 1.4:1 on white. On background-200 (`bg-secondary`) the dots fall under 3:1, the light theme's pending ones 2.59:1 and the dark theme's done and current 2.32:1, so a tour's dots belong on the page, a popover or the muted fill. In forced colours done and current are the system's Highlight and pending ones an outline in CanvasText. Under reduced motion, the media query's or the config's, the current dot's width does not animate.
  - **What a screen reader hears.** The dots are a group named by the position, "Step 2 of 5" by default. `positionLabel` gives it the product's words: a function of the step (from 1) and the count, or a template with `{step}` and `{count}`. Each dot is a list item named by its step, in text that is never drawn, and the current one is `aria-current="step"`, as in the numbered stepper. Once every step is done, none is current and the position is the last step. As the numbered stepper reads them, no steps draws the root alone, with no group or list, and a step before the first, or one that is not a number, has nothing done or current and names the first.
  - **New types:** `StepperVariant`. `StepperProps` gains `variant` and `positionLabel`.

  In Figma, Stepper has a Variant axis, Numbered and Dots, and Count reaches 8 on both, with Step 5 Text to Step 8 Text; React's Code Connect maps both; SwiftUI's and Compose's map Numbered at Count 2 to 8 and show no snippet for Dots, which they do not draw yet. The variant is the indicator's style alone, so the later vertical orientation and status per step (GAP-173) sit beside it.

- 7f858f7: `TourStep` is new (GAP-188, decisions 116 and 136): one step of a product tour, drawn as the MAP-64 design draws it, beside the control the step points at, which Backdrop's cut-out lights while the rest of the page is dimmed. It is controlled and it is one step: the sequence, pausing and resuming stay the product's.
  - **What it carries.** The eyebrow, `tourLabel` and the position ("Add users and assign permissions · 1 of 4", from `step` and `stepCount`), in sentence case; Close, a ghost icon button, drawn only with `onClose`; a `title` (a level 2 heading at Heading 4's size); a `body` in the muted ink; an `instruction`, what to do now, as a Notice in `instructionTone` `"info"` (with a pointer) or `"warning"` (with the warning's mark), in a polite live region mounted with each step; `children`, any content after the instruction; the progress as a Progress bar with the position beside it; and the footer: a dismiss link at the start (`onDismiss`), then Back (`onBack`), a secondary outline action (`onSecondary`) and Next (`onNext`), every one size sm and drawn only with its handler. `nextDisabled` draws Next disabled rather than hiding it, for a step its own action completes. `backLabel` "Back", `nextLabel` "Next", `secondaryLabel` "Not now", `dismissLabel` "Don't show again", `closeLabel` "Close", `progressLabel` "Tour progress" and `positionLabel` "{step} of {count}" (a template or a function) are English defaults (decision 100).
  - **Where it sits.** `target` is an element, a ref, a virtual element or a rect, as Backdrop's is. The card sits on its `side` ("bottom") at `align` ("center"), its 24 by 12 arrow pointing at the target, its tip 3 past the cut-out's ring and its base over the card's edge, so the card is 14 past the ring; it flips where there is no room, keeps 16 from the window's edges, and is placed again every frame, so it moves with the cut-out. With no target, or one not on the page, the whole page is dimmed and the card, with no arrow, places itself in the middle of the window, 420 wide (decision 139).
  - **Pressing outside.** Escape and Close call `onClose`; with no `onClose`, there is no Close and Escape leaves the step open. A press on the dim or on the lit target does not close it, and the target takes the press through the cut-out. `onInteractOutside` is called on each, for a product that wants to close there.
  - **Accessibility.** A non-modal dialog named by its title and described by its tour, position, body and instruction, it takes focus when it opens, on Next (else, or when Next is disabled, on itself), whether a press or the page opened it, and each `step` is drawn as a dialog of its own, so moving on is heard. Closed with focus lost, PopoverContent gives focus back (GAP-190): to what had it as the step opened, else to the step's target, and a step's Next keeps focus as the next step opens. The progress bar is named by `progressLabel` and read as the position.
  - **The look.** Popover's surface with its edge all round and the Control corner (decision 118), 16 inside, sections 12 apart, 372 wide (23.25rem), and 432 (27rem) with the dismiss link, so its three actions sit on one line; in owned CSS with logical sides, so right to left mirrors it. Above its own Backdrop whatever their order in the portal, and below a popover opened while it is open; inside a modal, its dim is drawn in the modal's content and the card opens above the modal, taking focus from its trap. The card arrives without its zoom under reduced motion, the system's or the config's; forced colours draw its arrow in the system's text colour.
  - **A single hint (coachmark), a welcome, an ending.** With no `stepCount` there is no position and no progress: with no `onBack` or `onNext`, it is a coachmark (GAP-157), closed by its button and by Escape, focus on itself. There is no separate Coachmark part.

  New types: `TourStepProps`, `TourStepTarget`, `TourStepSide`, `TourStepAlign`, `TourStepInstructionTone` and `TourStepOutsideEvent`. In Figma, the importer draws a `TourStep` set with the design's states; SwiftUI and Compose come later (decision 116).

### Patch Changes

- 17760a9: `Accordion` opens and closes over its content's height, as it was written to. Its content carried `animate-accordion-down` and `animate-accordion-up` from the start, but no config defined their keyframes, so both compiled to nothing and it opened and closed at once.
  - **The keyframes** now run from and to Radix's `--radix-accordion-content-height`.
  - **Timing:** they run on the standard motion tokens, `--semantics-motion-duration-standard` (280ms) and `--semantics-motion-easing-standard`, as Kozmos's owned sheet and reveal motion do.
  - **The chevron** turns on the same two tokens, so it and the content move together. It turned in 200ms before.
  - **Reduced motion:** both snap, whether the browser asks (`prefers-reduced-motion`) or the design config does (`motion: "reduced"` or `accessibility.reduceMotion`). Like the rest of Kozmos's owned motion, they read the tokens directly rather than through the duration scale.

  `scripts/check-accordion-motion.mjs` reads the timing and the animation the content runs, and the chevron's turn, in Chromium, Firefox and WebKit. `components:classes:check` no longer lists the two classes as known to compile to nothing.

  The props are unchanged.

- 4109c72: Smaller, with nothing changed in what any part does or what the package exports. Everything at once, minified and gzipped as an app's build does, saves 1.38 KB, and AdaptiveMapShell alone 0.26 KB.
  - **The JavaScript is built for the browsers package.json declares,** as the stylesheet already was. Built for Vite's default target (Chrome 87, Edge 88, Safari 14, Firefox 78), esbuild wrote every optional chain, `a?.b`, out as `a == null ? void 0 : a.b`, because it trusts `?.` only from Chrome and Edge 91. It now writes `?.` as the source does. The syntax is no newer than before: the build already wrote `??`, which is ES2020 like `?.`, and it still writes out `x ??= y`, which is ES2021. An app whose own build targets a browser older than Chrome 91 rewrites the chains itself and gets the same size as before. The CommonJS bundle saves 1.87 KB gzipped.
  - **`surfaceClass` and `SURFACE_CLASSES` live in a module of their own,** which `Surface` re-exports, so the parts that only take a surface's class no longer bring the Surface component into an app's bundle: AdaptiveMapShell, RouteSummary, RouteSetupPanel, ArrivalPanel, FeedbackCard, ClientAppBanner, SaveLocationCard, ManoeuvreCard and RoutingInputGroup. The exports are the same.
  - **AdaptiveMapShell drops what it never used:** a first set of attribution bounds that every field of was overwritten before anything read it, and two null checks the optional chains before them already made.

- b42824b: Calendar renders on the server without a warning under React 18. 0.13.0's Calendar called `React.useLayoutEffect`, so each server render of it under React 18 printed "useLayoutEffect does nothing on the server"; it now takes the layout effect only in a browser, as every other Kozmos part does. What it draws and how it moves focus are unchanged.
- 422cfd9: `CardContent` and `CardFooter` pay the top when they are the card's first child (GAP-194). They pad their sides and bottom only, because a header above has already paid the top; with no `CardHeader`, the content (or a footer alone) touched the card's top edge. Now the part that is the card's own first child pads the top as well, by the card's padding: 24, or 16 with `padding="compact"`.
  - **A header-led card is drawn as before**, and so is a part that is not the card's first child: under a header, below other content, or inside a wrapper such as a `form` around the card's parts.
  - **A caller's own class still wins.** The top is the part's own `pt-*`, so `p-0`, `py-*` or `pt-*` on `CardContent` or `CardFooter` replaces it, through tailwind-merge, as it replaces the sides and bottom.
  - **How:** the card sets the custom property `--kozmos-card-lead` on its first child, and the parts read it as their top padding, `0px` unless they are that child. A card nested inside another's content takes nothing from the outer card.

  **Migration.** A header-less card that made its own room above the content, with a spacer or a top margin inside `CardContent` or `CardFooter`, now gets that room twice: remove the spacer. A top padding passed to the part (`className="pt-6"`, or `"p-6"`) replaces the new one rather than adding to it, and is now the default, so it can go too. A spacer element placed before the part, as the card's first child, keeps the part from being first: nothing changes until it is removed.

  SwiftUI's `KozmosCardContent`/`KozmosCardFooter` and Compose's `KozmosCardContent`/`KozmosCardFooter` have the same gap and are not changed here.

- 3742203: Kozmos's live parts keep speaking, and nothing behind an open Select or Menu is hidden yet focusable (GAP-193). A Select, a LanguageSwitcher's list, a Dialog, a Drawer and a modal Menu are Radix primitives that, as they open, hide the rest of the page from assistive technology with aria-hidden's `hideOthers`, and that keeps visible only boxes marked `aria-live`. Kozmos's live parts were named live by their role alone (`role="status"`, `role="alert"`), so with one of those open they were hidden and silenced, and a button inside one (an Alert's Retry, a Notice's More or its action) stayed focusable inside a hidden box: axe's `aria-hidden-focus`, serious.
  - **Every Kozmos part with a live role says the liveness it implies as well:** `aria-live="polite"` with `role="status"`, `aria-live="assertive"` with `role="alert"`. Alert and Notice (`live="polite"` and `"assertive"`, and a caller's own `role`), MapStatusPill, Spinner, LanguageSwitcher's pending line and error, FieldWrapper's error, POIDetailPanel's action message, AdaptiveMapShell's map status, RoutePreviewPanel's status and alert, and Combobox's and MultiSelect's empty status. A screen reader already read them so with nothing open; now it reads them with a popup open too. A caller's own `aria-live` still wins, and `live="off"` sets none.
  - **Select keeps the page in reach exactly where Radix keeps it visible.** Select already makes the page inert while its list is open, keeping live regions in reach; it kept regions named by their role alone too, which Radix hid. It now keeps only what `hideOthers` leaves visible: boxes marked `aria-live` that were there as it opened. A product's own region with a live role and no `aria-live` is hidden and out of reach together, and so is a live part mounted while the list is open inside a box Radix hid. AICompanionPanel, which hides nothing from assistive technology, still keeps regions named by their role.
  - **A modal Menu makes the page inert, as Select does.** Radix's modal DropdownMenu hides the page with the same `hideOthers` and traps focus, but left every control behind it focusable: with a Kozmos Menu open, axe reported each of them as `aria-hidden-focus`. `MenuContent` now makes the page inert while a modal menu is open, kept in reach where Radix keeps it visible, with a submenu in a portal of its own. A menu with `modal={false}`, or one force-mounted, makes nothing inert. `Menu` is now Kozmos's own root, which passes `modal` to Radix's as before.

  Dialog and Drawer trap focus behind an overlay, which axe reads as a modal, so a focusable box behind them is "needs review" rather than a violation; they are unchanged, and Kozmos's live parts now stay visible under them. Radix's Select is always modal, so the page behind an open list stays hidden from assistive technology; that is Radix's, and replacing it is a separate decision.

- 8a27706: The design config's reduced motion reaches the theme's portal. `DesignConfigProvider` marks its scope `data-kozmos-motion="reduced"` when its config reduces motion (`motion: "reduced"` or `accessibility.reduceMotion`), and every looping animation stops on that mark (GAP-50); but Popover, Dialog, Drawer and BottomSheet, Tooltip, Select, Menu and Combobox's list draw in the provider's portal, outside that scope, so a Spinner or Skeleton in one kept running. The portal of every `ThemeProvider` inside the config's provider now carries the same mark, kept in step as the config changes. Reduced motion carries downward: a provider nested inside a reduced one is reduced too, its mark and its motion scale and effects, in its portal as in place, where the rules that read the mark by ancestor already saw it so (`useDesignConfig()` still returns its own config). The theme, density, direction and tokens already reached the portal, and entry and exit animations were already cut by the config's motion scale; nothing else changes.
- b16aa3a: Seven defects the website found and recorded in its own register (`apps/site/GAPS.md`, the site's GAP-nn), each read in Chromium, Firefox and WebKit by `scripts/check-site-gaps.mjs`:
  - **`MapView` is its own stacking context** (site GAP-40), framed or filling. A `MapOverlay` is z-index 50, as a sticky `Navbar` is, so a map the page scrolled under its header drew its overlays over it; inside `AdaptiveMapShell`, anything the map drew with a z-index of its own, as a map engine's layers have, drew over the shell's top bar, controls and panel. What the map draws now stacks inside the map. The shell's controls, sheet, attribution and floor popups are its own layers or portals, outside the map, and draw as they did. A fixed element rendered inside the map that does not portal, a fixed `FloatingActionButton`, a `DynamicIsland` or a product's own, now stacks inside the map too, under a sticky header and the shell's chrome: render it outside the map, or portal it out. A `Backdrop` at its default placement portals itself since #419, so it still covers the page from inside the map; `placement="inline"`, absolute, stays in the map by design.
  - **A Button drawn on a link has no underline** (site GAP-09). `buttonVariants` on an anchor, the README's pattern for navigation, and `Pagination`'s page, Previous and Next links drew the browser's underline: `kozmos-reset` opts them out of the scoped preflight, which is what takes it off a plain link. The link variant still underlines on hover. A class that underlines the link wins only with more weight than Kozmos's rule: Kozmos's own `underline` utility does, but a host's own utility in a cascade layer, as Tailwind 4 writes them, never does, and an unlayered one only when it loads after Kozmos's stylesheet. Owned CSS, so it holds without `@scope`.
  - **`Listbox`'s one column is the list's width** (site GAP-55). A long label or description widened every option past the list, which scrolled sideways (658px in a 280px list) with the words cut at its edge; now they end in their ellipsis. An option row is `min-width: 0` too, so its words truncate whatever holds it, a group that is a grid of its own included (646px sideways in a 280px list before). Owned CSS. A cut option shows no `title`; its whole text stays its accessible name.
  - **`BottomNavigation`'s bar is as tall as its items** (site GAP-68), as Figma's is: 64 at the compact density and 72 at the default, with its 1px top line drawn inside, over the items, as Figma's inside stroke is. A fixed 64 with a border on top held the default density's 72px items spilling 3.5px over its top and 4.5px under its bottom, and the compact density's 64px items half a pixel under it. The line is a border on the bar's `::before`, in the subtle border colour it had, so forced colours draw it: Chromium and Firefox repaint it in the system's colours, where an inset shadow drew nothing. The bar also pads its bottom by `env(safe-area-inset-bottom)`, so its items sit above the iPhone's home indicator: the `pb-safe` it carried compiled to nothing.
  - **`SplitButton`'s outline variant keeps its outline** (site GAP-73). The seam's tint was a colour on all four sides of the main part, over the outline's own, so its edge was white at a fifth over the fill: 1.00:1 in light and 1.66:1 in dark. It tints the inline-end side alone now, on the right left to right and on the left right to left, and the outline reads 8.01:1 and 8.39:1.
  - **`Tooltip`'s tip, and `PopoverArrow`'s, overlap the body by 1px** (site GAP-74), as Figma's tip does. Flush against the bordered body, the border ran across the tail. The tip's box, which places the tooltip, is the same 8 by 4, so the tooltip sits where it did; its tip reaches 3px past the body, where it reached 4.
  - **A muted `Text` follows a glass surface** (site GAP-94), as Kozmos's own muted text does (decision 48): the foreground on glass, and the muted grey elsewhere, as before. On the glass, a solid surface, an opaque `Card` and a nested `ThemeProvider` of the other theme (DynamicIsland's dark one) are surfaces of their own, so muted text in them keeps its theme's muted colour: they now reset `--kozmos-surface-muted-foreground`, which the glass resolves to its own theme's foreground and which reached through them. Kozmos's own muted text (`.kozmos-muted-text`) follows the same rule. A nested provider of the same theme still reads the glass. Over the eight category fills, a muted `Text` on glass read 3.61:1 at worst in light (over red) and 4.38:1 in dark (over yellow) in Chromium, 3.76 and 4.39:1 in Firefox and WebKit; it reads 12.44 and 11.85:1, and 12.96 and 11.88:1. Owned CSS. SwiftUI's `KozmosText` with `tone: .muted` does not follow glass yet.

  The props are unchanged.

- ef6dfd2: `TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` are treeitems (GAP-204). A tree composed from them drew plain divs, so in `Tree`'s `role="tree"` container it had no items: axe failed it (aria-required-children, critical) and a screen reader heard an empty tree. Each row now carries `role="treeitem"` and its state from the props it already takes, with no new API:
  - **`depth`** gives `aria-level`, one more (0 is level 1).
  - **`expanded`** gives `aria-expanded`, on a row with children only.
  - **`selected`** gives `aria-selected`, `"false"` when it is not.
  - **`disabled`** gives `aria-disabled="true"`.

  `Tree`'s own renderer draws the same row, so a tree from `data` keeps its one treeitem per row and gains `aria-level`, the level browsers already computed from its groups.

  **A caller's own `role` or `aria-*` still wins**, so trees that pass them keep working. With a role other than `treeitem`, such as `role="none"` on a row inside a treeitem of the caller's own, the row adds no tree state.

  **Composing a tree:** a `Tree` with children is the container, and an expanded parent's children go in a `<div role="group">` right after its row, at `depth` one more. Tree's docs show it. A composed tree has no keyboard of its own: Tree moves focus with the arrow keys only through `data`.

  SwiftUI's and Compose's `KozmosTree` draw only from data and have no composed rows.

## 0.13.0

### Minor Changes

- f66ffd3: `Calendar`, a month grid to choose a day or a range in, one month or two side by side (decision 104). It is the panel Figma draws open under DatePicker and DateRangePicker, and both open it in a Popover. Days are `YYYY-MM-DD` strings, as DatePicker's value is.
  - **A day or a range.** `mode="single"` (the default) calls `onValueChange` with the day each time one is chosen, the chosen one included. `mode="range"` calls it with `{ start }`, then `{ start, end }` in order; while a range has no end, the day under the pointer or the focus shows where it would end. `value` controls it and `defaultValue` leaves it to the calendar.
  - **Months.** `months={2}` shows two side by side, 12 apart, wrapping where they do not fit. The first month shown is the value's, else today's; `month` with `onMonthChange` controls it, `defaultMonth` sets it. `today` names the day drawn as today, by default the reader's.
  - **Days that cannot be chosen.** `min` and `max` bound them, and `isDateUnavailable` closes any day a product decides; those are muted, cannot be chosen, and closed days are still reached and read.
  - **Drawn as Figma draws it.** 36px days in one month and 40px in a range, 4 apart, with the Control corner; a 32 header with 32 previous- and next-month buttons; the chosen day in the theme fill under the theme foreground (decision 59), today on background/100, a range's days on theme/100, another month's days and the weekdays in ink 400, in both themes. It draws no surface: a Popover's or a Card's is its own. The layout is owned CSS in logical sides only, so it holds in a host without `@scope`.
  - **The keyboard** follows the WAI-ARIA date picker dialog's grid, one tab stop after the two buttons: the arrows a day or a week, Home and End the week's ends, Page Up and Page Down a month, with Shift a year, Enter and Space choose. Right to left, the arrows follow the page.
  - **The locale.** `locale` names the months and the days and picks the first day of the week, by default the document's language, then the browser's: the locale's short weekdays and its digits, and `Intl.Locale`'s first day, or CLDR's where an engine has none (Firefox).
  - **Accessibility.** Each month is a grid named by its title, a polite live region. Each day is named by its full date and says whether it is chosen, today or unavailable; another month's days are drawn for the eye only. `previousMonthLabel` and `nextMonthLabel` name the buttons, `"Previous month"` and `"Next month"` by default. `disabled` and `readOnly` do as a field's do.

- 8b520aa: `DatePicker` opens Kozmos's `Calendar` (decisions 104 and 105), drawn as Figma's Open variant. The field keeps the browser's segmented typing and its value API: `value`, `defaultValue` and `onChange` on a `YYYY-MM-DD` string, unchanged.
  - **The button.** A button at the field's end, as tall as the field, opens the calendar in a modal Popover 6 under the field, 12 inside, on the field's day, else today; so do Alt+Down Arrow and F4 in the field, where Chromium would open its own picker. A day chosen there is typed into the field, so `onChange` and a form's change listeners hear it as typing; that or Escape closes it and returns focus to the button, as the WAI-ARIA date picker dialog does.
  - **Where it applies.** Only where the browser's own picker button can give way, read from the engine's CSS, never its name: Chromium and Edge hide theirs (`::-webkit-calendar-picker-indicator`), and Safari's segmented editor (`::-webkit-datetime-edit`) draws none. Firefox 146 draws one no page can hide, so there the field stays the browser's, untouched, and the new props do nothing; when Firefox supports the pseudo-element, it takes Kozmos's calendar with no change to a product's code.
  - **New props**, all optional: `open`, `defaultOpen` and `onOpenChange`; `chooseDateLabel` names the button and, with no `label`, the calendar (`"Choose date"`); `previousMonthLabel` and `nextMonthLabel`; `locale` for the calendar's names (the browser's still format the typed field); `isDateUnavailable` and `today`. `min` and `max` bound the calendar's days too.
  - **Disabled or read only**, the button cannot open it.

- e6cd61b: `DateRangePicker` opens Kozmos's range `Calendar` (decisions 104 and 105), drawn as Figma's Open variant. Each field keeps the browser's segmented typing, and the value API is unchanged: `value`, `defaultValue`, `onValueChange` and `onRangeChange` on `{ start, end }` strings.
  - **One panel for the range.** A button at each field's end, as tall as the field, opens one modal Popover under both fields: two months 12 apart where the window has room, one where it has not (`months` picks), on that field's day. Alt+Down Arrow and F4 in either field open it too, where Chromium would open its own picker. The first day chosen starts a range and clears the end; the days under the pointer or the focus show where it would end; the second closes it with both fields filled, in order. Escape closes it with nothing changed; focus returns to the button it opened from.
  - **Where it applies**, as DatePicker's: only where the browser's own picker button can give way, read from the engine's CSS (Chromium, Edge, Safari). In Firefox 146 both fields stay the browser's, untouched, as before.
  - **One label for the range (GAP-051).** `hideFieldLabels` reads the start and end labels to a screen reader and shows none, so the range's `label` names it once, for a one-line filter bar.
  - **New props**, all optional: `open`, `defaultOpen`, `onOpenChange`, `months`, `chooseDatesLabel` (`"Choose dates"`, each button described by its field's label), `hideFieldLabels`, and for the calendar `previousMonthLabel`, `nextMonthLabel`, `locale`, `isDateUnavailable` and `today`. `min` and `max` bound its days.
  - **Kozmos's fields are labelled beside their input**, not around it (a button cannot sit inside a `<label>`); the labels, their names and the layout are as before.

- 273a44f: `Icon` and `KozmosIconKey` take the 29 names SwiftUI's and Compose's `KozmosIcon` draw beyond the curated library (GAP-179): the 23 wayfinding glyphs of Pointr Maps - Express by the kebab case of their export names (`elevator-up`, `stairs-no-direction`, `route-entrance-exit`, `security-control`, `shuttle` and the rest), the Pointr outlines `log-in-01`, `log-out-01`, `arrow-up-right` and `arrow-down-right`, and the map controls' layers glyph and walking figure, `layers-three-01` (`LayersThree01`) and `walking` (`Walking`, GAP-181). `<Icon name="elevator-up" />` drew nothing; it now draws the `ElevatorUp` artwork. `@kozmos-ds/icons` exports them as `kozmosIconNamesBeyondTheLibrary`, `getIconComponent` and `isKozmosIconKey` accept them, `resolveIconName` returns them as themselves, and `getIconDefinition` returns `undefined` for them, as they have no definition. `kozmosIconNames` and `kozmosIconDefinitions`, the curated set the Figma Icons page pairs with the Pointr Icon Library, are unchanged. POIDetailPanel's tags draw their icons through `Icon` and the registry, where they kept a map of their own: they draw what they drew. An app that looks an icon up by name now ships the 29 too: `getIconComponent`, `isKozmosIconKey` and `Icon` bring in 19.9 KB gzip of icons where they brought in 11.8 KB. A named export still brings in its icon alone. Code that switches exhaustively over `KozmosIconKey`, or over what `resolveIconName` returns, now sees these 29 names too.
- e6097ef: `PaginationPrevious` and `PaginationNext` take `label`, the word drawn beside the chevron: "Previous" and "Next" by default, the words they drew before (GAP-182). A product that translates passes its own, with an `aria-label` in the same language: the links are still named "Go to previous page" and "Go to next page" by default, and `Pagination`'s landmark "pagination". Those three names already gave way to a caller's `aria-label`; the props now say so, with their defaults, and a test holds them. SwiftUI's and Compose's Previous and Next take `label` too. The Code Connect example draws the two parts with Figma's Previous Text and Next Text as their labels, where it rebuilt them from `PaginationLink`.
- e99d7c1: SplitButton takes `menuLabel`, the accessible name of its menu half, which shows only a chevron: "More options" by default, the name it had (GAP-168, GAP-182). A product that translates passes its own. SwiftUI's and Compose's `KozmosSplitButton` take `menuLabel` too, with the same default: VoiceOver read SwiftUI's menu half as the chevron's own "Go Down", and Compose named it "More actions".
- e8d4d69: The stylesheet is smaller: 30.14 KB gzip, down from 31.77 (30,864 bytes gzip, down from 32,537; 223,510 raw, down from 245,927). Every Kozmos part draws as it did; the rules are the same, written shorter, and rules nothing in Kozmos draws with are gone. What a product could notice:
  - **Utilities nothing in Kozmos uses are gone.** A class a product passes through `className` applies only if Kozmos's stylesheet has it, and these it no longer has:
    - the 21 that only Kozmos's own tests named, among them `ml-2`, `-ml-1`, `pl-8`, `rounded-lg`, `rounded-l-md`, `rounded-tr-lg`, `rounded-t-panel`, `rounded-tl-control`, `rounded-tl-marker`, `border-r-2`, `border-sm`, `border-lg`, `bg-success`, `ring-primary`, `w-[72px]` and `right-[2px]`. 0.12.2's `SelectLabel` drew with `pl-8`; it no longer does, in this same release;
    - `container`, with its seven breakpoints, and `hidden`, `visible`, `static`, `resize`, `transform`, `blur` and `filter`, which Tailwind made from words in the source;
    - the 14 bare side and corner radii, `rounded-t` to `rounded-bl` (0.25rem), made from the class-group names `cn()` teaches tailwind-merge. With a role, `rounded-t-container` and the rest, they are generated where a component uses them, as before.
  - **`ScrollArea`'s `hideScrollbar`** no longer carries `[-ms-overflow-style:none]`, which only Internet Explorer and the old Edge read, and neither runs `@scope`.
  - **Tailwind's compiler variables.** The stylesheet registers 17 of them. A variable Tailwind 4 registers without an initial value that no Kozmos utility sets, the two skews, eight filter and eight backdrop-filter terms and three numeric terms (with `blur` gone, nothing sets `--tw-blur`), never has a value, so each read of it is written as the value it always gave, and it is not registered. A product's own Tailwind utility that sets one of them (`skew-x-3`, `brightness-110`) on an element that also carries a Kozmos transform or filter utility no longer adds to Kozmos's value there. `var(--tw-shadow, 0 0 #0000)` and the like drop a fallback equal to the registered initial value, and tailwindcss-animate's rotation, which Kozmos only ever resets, is gone from the enter and exit animations.
  - **Token strings.** Read from script, some token values come back shorter: `#ffffff` is `#fff`, and `rgba(23, 25, 28, .05)` is `rgba(23,25,28,.05)`. The colours are the same.
  - **Licences.** The package now ships `THIRD-PARTY-NOTICES`, with the licences of Tailwind CSS, of its preflight (modern-normalize) and of tailwindcss-animate, whose output `style.css` and `reset.css` contain. Tailwind's one-line banner comment, which carried no copyright notice, is gone from `style.css`.
  - The stylesheet is minified for the browsers `package.json` declares (Chrome and Edge 118, Safari 17.4, Firefox 146), so `inset` is no longer written as four longhands, and `-webkit-appearance`, `-moz-appearance` and `-moz-tab-size` copies are gone.

- bc9ba5a: `TimePicker` opens a Kozmos list of times (decision 104), Combobox's list as Figma's Open variant draws it, in every engine. The field keeps the browser's segmented typing and its value API: `value`, `defaultValue` and `onChange` on an `HH:MM` string, unchanged.
  - **The list** draws Combobox's rows (decision 115) with Figma's 2 between the times (`TimePicker/listbox/gap`), where the standalone `Listbox` keeps its 4.
  - **The button.** A button at the field's end, as tall as the field, opens the list under the field, as wide as it, on the field's time; so do Alt+Down Arrow and F4 in the field, where Chromium would open its own picker. The list takes focus; the arrows, Home and End move in it; a time chosen by Enter, Space or the pointer is typed into the field, so `onChange` and a form's change listeners hear it as typing; that or Escape closes it and returns focus to the button.
  - **Every engine.** Chromium's own clock button gives way to Kozmos's (hidden with `::-webkit-calendar-picker-indicator`), and Safari and Firefox draw none, so they offer a list for the first time.
  - **The times** run from `min` to `max` (the input's own, `00:00` to `23:59` by default) every `step` seconds, or every 30 minutes when `step` asks for less than a minute or nothing, in the locale's own short time.
  - **New props**, all optional: `open`, `defaultOpen`, `onOpenChange`; `chooseTimeLabel` names the button and, with no `label`, the list (`"Choose time"`); `hourCycle` (`"h12"` or `"h23"`, by default the locale's) and `locale` for the list (the browser's still format the typed field). Disabled or read only, the button cannot open it.
  - **`Listbox` starts on its chosen option**, as the WAI-ARIA listbox does, where it started on the first; with nothing chosen it still starts on the first.

### Patch Changes

- fd1ef28: A bottom sheet fitted to its content (`"content"` in `panelDetents`, or `panelSizing="content"`) now comes to rest in every engine when it holds `AICompanionPanel` (owner, 25 Oct). It measured the assistant at the height the sheet had given it, since the assistant fills its panel, so the sheet was fitted to itself.
  - **The sheet fits the assistant as it lays out unstretched:** its header, its whole conversation and its input, between collapsed and large. One question and its answer under a grip came to 306px in a 390 by 800 shell, where the sheet stayed at the 192 it was first measured at.
  - **The assistant then fills the sheet.** At the collapsed floor its input sits on the sheet's bottom edge, and at large only its thread scrolls.
  - **It grows with the conversation,** and fits the same height whichever detent it comes from. Before, it kept its first height, unless it came down from a taller detent.
  - **WebKit on a page with no doctype:** the sheet no longer grows to large and drops its grip. There the assistant's `height: 100%` resolves against the panel rather than the content box, so each measurement read the grip's row more, and the sheet grew 16px at a time, without waiting for a frame, until it reached large.
  - **Other content is measured as before:** in Chromium, Firefox and WebKit a fitted list rests where it did.

  The props are unchanged.

- fd07968: The list rows of `Combobox`, `MultiSelect`, `Select` and `Listbox` follow Figma (owner, 21 Oct): 44 tall, the density's control height, so 40 at compact density (decision 82), where they were 36 at both; 12 at the sides, the Marker corner, 2 between rows (the standalone `Listbox` keeps its 4); the words 14/20 regular in full ink, where they were medium.
  - **The active row**, under the pointer or the keyboard, is a light row, background/50, in full ink, where it was filled with the theme's 600 under white. Reached by the keyboard it also draws a 2px inset ring in theme 600 (decision 26), 4.9:1 or more against the row in both themes, so the keyboard's place meets WCAG 1.4.11; under the pointer it draws none. The list reads which hand moved last from the events themselves, not `:focus-visible`, so it holds for Select's Radix items, which take focus under the pointer too, and for Combobox's, which never take it. A modifier pressed alone (Shift, Control, Alt, Meta, as for a Shift- or Cmd-click) is not the keyboard; a modifier with another key is.
  - **The chosen row** is background/100, its check at the end in theme 600; it had no fill. `Select`'s check moves from the start of its item to the end, as Combobox's is, and its items and labels lose the start indent the check kept.
  - No API changes: the same parts, props and states.

- 7374f95: In forced colours (Windows' high contrast), the list rows of `Combobox`, `MultiSelect`, `Select`, `Listbox` and the SDK's `LanguageSwitcher` mark the active row again. Forced colours drop the rows' fills and the keyboard's ring, so neither the pointer's row nor the keyboard's was marked, and every row drew a 2px outline round itself: each row's `outline-none` is a transparent outline, which forced colours paint. Now only the active row, under the pointer or the keyboard, draws an inset 2px outline in the system's `Highlight`, so nothing moves. The chosen row's check takes `CanvasText`, where Chromium kept its brand colour.
- bce6433: `MultiSelect`'s clear and open buttons are drawn as `Combobox`'s (owner, 24 Oct): each as tall as the field, 44 at touch density and 40 at compact (decision 82), where they were 28 at both. They sit at the field's end, inside its border, in either direction.
  - **On one line the field keeps its height**, 44, or 40 at compact. Taller content grows the field as before, and the buttons stay centred on it.
  - **Chips wrap sooner.** The field keeps Combobox's room for the buttons at its end: 96, or 48 without the clear, at touch; 88 or 44 at compact. So each line has 16px less room for chips and typing than before (4px less without the clear), and chips wrap 16px sooner.
  - **A caller's padding:** `px-*` still sets the field's start. A caller's `p-*` or `pe-*` replaces the room, and the chips and text then run under the buttons, as text does on Combobox.
  - **Forced colours** (Windows' high contrast): hovering Combobox's or MultiSelect's clear or open no longer erases the field's edge. Forced colours repaint the hover fill in the page's colour; these buttons now hover with no fill there.
  - **Focus:** with its clear or open focused, MultiSelect's field no longer draws its own ring around the button's. The button rings alone, as on Combobox. With the input focused, the field rings as before.

  The props and labels are unchanged.

- 2d3dbcd: In forced colours (Windows' high contrast), `MultiSelect`'s text input no longer draws a 2px box of its own inside the field. The input's `outline-none` hides the browser's focus ring, because the field draws the ring for it. That `outline-none` is a transparent outline, which forced colours paint, so the box showed at rest and while typing. Now the field draws the only edge. With the input focused, the field's outline still marks focus, as `Combobox`'s does. With the clear or open button focused, the button's outline alone marks focus. Normal colours are unchanged. `Combobox`'s input and `Select`'s trigger draw no such box, and are unchanged.
- 302fa49: POIDetailPanel's tags, services and group items draw `layers-three-01` and `walking`, the map controls' layers glyph and walking figure, which SwiftUI's and Compose's `KozmosIcon` now draw by name (GAP-181), so a tag draws the same icon on all three. Each draws `@kozmos-ds/icons`' own artwork, `LayersThree01` and `Walking`, the source the natives' copies are generated from, at 16px in the label's colour; on the web they drew only the label. `Icon`, its `name` prop and the `KozmosIconKey` type are unchanged.
- 1e83692: The stylesheet no longer declares Tailwind's 51 compiler-variable defaults (`--tw-translate-x`, `--tw-ring-color` and the rest) on every element inside a provider, on its pseudo-elements and on every owned part. It registers the 17 that its utilities both set and read with `@property` and `inherits: false` instead, so an element that sets none starts at its default without carrying its own copy, and no element inherits one from an ancestor. Where a name is registered without an initial value, the reads carry Tailwind 3's default as their fallback. What every utility draws is unchanged.

  Re-theming the site's home page now restyles it in 100 ms in WebKit, down from 124. Chromium takes 22 ms, up from 19, and Firefox 11, down from 13.

  A registration applies to the whole document. Each name is registered as Tailwind 4 (4.3.3) registers the same name: its syntax, and its initial value or none. A page that also runs Tailwind 4 therefore gets the same registrations whichever stylesheet loads last. Read from script, a registered name now gives its registered initial value on any element where nothing sets it, outside a provider too (`--tw-translate-x` reads `0` where it read an empty string). The names Tailwind 4 registers without an initial value read empty inside a provider: `--tw-skew-x` and `--tw-skew-y`, which read `0` before, and `--tw-ring-color`, which read `rgb(59 130 246 / .5)`.

- 43ffbac: `ToastClose` is named "Dismiss notification" when the caller passes no `aria-label`, as SwiftUI's and Compose's toast closes are (GAP-182). It shows only a cross, and had no accessible name of its own: a close left unnamed was a button a screen reader announced with no name. A caller's `aria-label` still replaces it, which is how a product that translates passes its own words.
- Updated dependencies [bfc1ce8]
- Updated dependencies [273a44f]
  - @kozmos-ds/tokens@0.8.1
  - @kozmos-ds/icons@0.7.0

## 0.12.2

### Patch Changes

- 9017b62: A framed `MapView` has the control radius, 16, as SwiftUI's and Compose's `KozmosMapView` have; it was the container radius, 20, on the web only. A `fill` MapView, the map that is the screen inside `AdaptiveMapShell`, still has no corners, and the map controls keep the control radius they had.
- 7109aa3: POIDetailPanel falls back to an item's `iconName` icon when its `iconUrl` is unsafe or fails to load, as iOS and Android do (GAP-178, the owner's rule): a service, a group's item and a tag draw the glyph their name draws, and a summary fact its kind's glyph, where they drew no icon at all. With no name Kozmos draws, the label still stands alone. A safe asset that loads draws as before, and root-relative URLs are still accepted on the web.
- 9a9605b: POIDetailPanel's tags, services and group items draw every icon name `KozmosIcon` draws on iOS and Android, so a tag draws the same icon on all three. The web looked a tag's `iconName` up in the `Icon` registry alone, so 27 names drew an icon in the SwiftUI and Compose tags and only the label on the web: the 23 wayfinding glyphs of Pointr Maps - Express by the kebab case of their export names (`elevator-up`, `elevator-down`, `stairs-up`, `stairs-down`, `escalator-up`, `escalator-down`, `ramp-up`, `ramp-down`, `route-enter`, `route-exit`, `elevator-up-and-down`, `escalator-no-direction`, `stairs-no-direction`, `ramp-no-direction`, `route-entrance-exit`, `hard-left`, `hard-right`, `turn-back`, `follow-the-line`, `arriving`, `custom-transition`, `security-control` and `shuttle`), and the Pointr outlines `log-in-01`, `log-out-01`, `arrow-up-right` and `arrow-down-right`. Each draws `@kozmos-ds/icons`' own artwork, the source the natives' copies are generated or taken from, at 16px in the label's colour. The registry's 57 names and 17 aliases draw as before, and a name Kozmos does not know still draws only the label. `Icon`, its `name` prop and the `KozmosIconKey` type are unchanged.
- a8b92cb: Stepper marks its current step `aria-current="step"`, so a screen reader hears which step the visitor is on; it set none, and the steps were heard in order with nothing of the progress. No other step carries it, and once `currentStep` is past the last step none does. The look, the props and the markup are otherwise unchanged.

## 0.12.1

### Patch Changes

- e86e8a3: **ColorPicker** mirrors in a right-to-left field. Its swatch sits 8 in from the inline start and its open button 4 in from the inline end, each inside the 48 the text keeps at that end; right to left, both sat at the wrong end, with the swatch over the end of the text and the button over its start. The panel's hue and opacity gradients now run the same way as their sliders, from the inline start. Right to left, a native range has its lowest value at the right, and the gradients still ran left to right, so the opacity slider showed clear under a thumb set to opaque. Left to right, nothing changes.
- e02d3bf: Safari 26.0 to 26.3 draw every Kozmos field as Chrome and Firefox do (GAP-174). Those versions, on macOS and iOS, apply no `@scope` rule to an `<input>` or a `<textarea>` (Apple fixed it in Safari 26.4), so a field there took only Kozmos's unscoped CSS and none of its utilities. The fields that relied on utilities now carry owned CSS, and nothing changes in Chrome, Edge or Firefox:
  - **OTPInput**'s cells are 44 squares with the digit centred at 18/28, at any density; in Safari they were 53 wide, 40 tall in compact, with 12 of padding and the digit at the start in 14px.
  - **ColorPicker**'s swatch sits over the field's start, 32 square with its border, radius and focus ring; in Safari it was a native colour well in the field's row, which pushed the text aside. The text starts 48 in, clear of the swatch, and ends 48 before the open button, in mono capitals; in Safari it started at 12, under the swatch, in the sans face and as typed. The panel's hue and opacity sliders fill its width at 20 tall, and its number and HEX fields are 36 tall with the control radius, border and fill, in light and dark; in Safari those were native.
  - **AIInputBar**'s field is bare inside its pill, in the pill's type and colours, and takes the width the pill leaves; in Safari it was a native field with a 2px inset border, a white fill and 11px text, 148 wide.
  - **RoutingInputGroup**'s and **FeedbackCard**'s fields sit on their wash with no edge (black at 5 % on light, white at 10 % on dark, more when focused), RoutingInputGroup's 40 tall and FeedbackCard's comment not resizable; in Safari they were the plain field on white with its border, RoutingInputGroup's 44 tall and the comment resizable.
  - **WayfindingInputRow**'s fields are 40 tall, raised on half the muted fill with no edge, and keep 64 at the end for the swap button; in Safari they were the plain field, 44 tall, and the text ran under the button.

  A utility class a caller passes to a field's `className` still wins in Chrome, Edge, Firefox and Safari 26.4. In Safari 26.0 to 26.3 it cannot reach the field, which keeps its own look: style a field there through its props, the provider's `tokens`, an inline `style` or your own CSS, and the layout around it through `wrapperClassName` (the README's "Fields in Safari").

## 0.12.0

### Minor Changes

- 8ceb3bb: `ThemeProvider density` (decision 82): `"touch"`, the default, or `"compact"`, for pointer-first desktop tools such as Pointr Cloud. Touch keeps every size as it was.
  - **Compact sizes:**
    - Button: 32 at `sm`, 40 by default, 48 at `lg`.
    - IconButton: 28, 32 and 40.
    - Single-line fields: 40. That covers Input, Select, Combobox, MultiSelect, NumberInput and PasswordInput, and DatePicker, DateRangePicker, TimePicker, Search and ColorPicker, which are drawn on Input's recipe. Combobox's clear and open, NumberInput's steppers and PasswordInput's show-password button are as tall as the field; MultiSelect's clear and open stay 28 at both densities.
    - A stacked Dialog footer's buttons: each its size's height, 40 by default, 32 at `sm` and 48 at `lg`.
    - Pagination's Previous and Next are the small Button now, as tall as the page links: 44 in touch as before, 32 in compact, with the same padding.
    - Dialog's and Drawer's close are the icon button's size, 32, and stay centred on the title as touch centres them; the title and Drawer's header leave room for them.
    - Combobox's input and PasswordInput's field leave exactly the room their actions take, under a caller's `px-*` too.
  - **Where it applies:**
    - The provider marks its root and its portal root, so popovers and menus follow it.
    - A nested provider inherits the density unless it names its own.
    - `DesignConfigProvider` and `KozmosTheme` take `density` too.
    - Outside any provider the controls draw at touch sizes.
  - **`DensityScope`**, new: one region at another density inside a provider, such as a compact tool panel on a touch page. Its controls, the providers nested in it and the popovers it opens take its `density`, and the theme, tokens and design configuration around it carry on. `asChild` marks its one child instead of adding an element; a fragment gets an element of its own. The elements a Kozmos portal renders directly now carry `data-kozmos-density` for the density where it opened; a fragment there, or a component that doesn't pass `data-*` on to its element, doesn't get the mark.
  - **SDK parts keep the SDK's touch geometry under any density** (decision 89): an SDK screen previewed in a compact page draws as the apps draw it. The root of every component the 42 SDK directories export, MapInfo included, is a touch `DensityScope`, so a provider nested in one and the popovers it opens stay touch too. A product's own content inside an SDK part, such as `AdaptiveMapShell`, is touch as well unless the product wraps it in `DensityScope density="compact"`.
  - **Overriding:** a caller's own `h-*`/`w-*` class still wins over a control's density size.
  - It needs `@kozmos-ds/tokens` with `css/density.css`, which `style.css` includes.

- 08207f4: LocationPin draws the SDK's map result markers (decision 71, GAP-120), as the boards draw them. In a product these come from the map style's sprite sheet, and a featured place's tile from the featured sprite Pointr's back end makes with its logo; LocationPin draws the same markers for prototypes and boards (decision 81).
  - **A result** is its number in a pill on a pointer, anchored at the pointer's tip: 32 tall, as wide as its number and 8 more each side (32 at least), theme 600 on background/0 at rest, filled theme 600 under foreground/1000 when selected. Without a number it shows a dot.
  - **A featured place** (`featured`) is its logo (`markerContent`, normally an image, fitted inside the rim, never cropped) in a 44 tile with a 3 rim in foreground/0, 52 when selected, on a dot whose centre is the anchor. It shows no number, no star and no accent colour. Its name still adds `featuredLabel`.
  - **A place on its own** (`place`, new) is the green pin, emotional success 800 round a disc, on a dot whose centre is the anchor. It is the marker for a place whose details are open, the only one shown, and it wins over `featured` and `number`.
  - **Its name** is `label`, whole, as your product writes it with the number in it ("Result 3, Burger King"); LocationPin adds only `featuredLabel` on a featured tile.
  - **`onOpen`** (new): a double tap on the marker opens the place's details rather than zooming the map, with the same gate as `POIResultList.onOpen`. The first tap is the ordinary press. Its target is 44 square at least.
    - **On a map:** with `onOpen`, a second touch tap within 500 ms stops at the pin, and so does its `dblclick`. MapLibre zooms on that second tap and cancels its click, so the pin would never open (measured with MapLibre GL 4.7.1 in Chromium and WebKit, a portalled marker too). A first tap, and a pan that starts on the pin, still reach the map.
    - **By keyboard:** Enter opens a pin that is already the current one (selected, or a place) or whose only action is `onOpen`. Otherwise Enter, and Space always, is the ordinary press. A held Enter opens once.
    - **`openHint`** (new): while Enter opens the pin, its description says so, "Press Enter to open details" by default. Pass it translated.
  - **Pointers:** a pin with no `onClick` or `onOpen`, or a disabled one, lets presses through to the map (`pointer-events: none`), as SwiftUI does. A disabled pin with an action is still a disabled button for assistive technology. Handlers passed through to a static pin (`onMouseEnter` and the like) no longer fire; give it `onClick` to make it interactive.
  - **Its name beside it** (`externalLabel`) is Semibold, as on SwiftUI and Compose. A label at the `left` or `right` is the map's left or right in either direction, as MapLibre places a symbol's text, and is centred on the marker's shape.
  - **A shadow** (new) under the marker: the floating elevation, `--semantics-elevation-floating`, as on SwiftUI and Compose, under `DesignConfigProvider` too.
  - **In forced colours** (Windows' high contrast), a selected result keeps the system's highlight.
  - **A featured tile's logo** fits inside the rim inside a wrapper too (a `<picture>`, an image component's span).
  - **`aria-current="location"`** is now on a place as well as on a selected result.
  - **Analytics:** `location_pin_clicked` carries `kind` where it carried `variant` and `size` (`number` and `selected` stay), and a new `location_pin_opened` event carries `kind` and `number`.

  **Removed** (decisions 79 and 80):
  - **`variant`, `size` and `tint`:** the SDK's markers have one look. Remove the props.
  - **`offFloor`:** don't mark results on another level. The level switcher counts them (`showResultCounts`). Remove the prop.

  **Styling hooks:** `data-featured` and `data-off-floor` are gone. `data-kind` (`result`, `featured` or `place`), `data-interactive` and `data-disabled` are new, and `data-selected` stays. The anchor's translate and the 44 target (a `::before`) are in Kozmos's own stylesheet, not utility classes, so the pin's box is its marker's size. A pin no longer grows on hover or when selected.

  **What you'll see:** every pin changes shape, from a teardrop to the pill, the tile or the green pin. A pin is still anchored by a physical point, but a featured tile and a place are anchored at their dot's centre, 3 above their foot, where the old pin's foot was its anchor. A selected result is filled in theme 600, as the SDK's sprite is, not the theme fill.

### Patch Changes

- 9a85dd7: Core fixes from an independent review:
  - **Switch** keeps a caller's `aria-describedby` and joins its own error to it, and keeps a caller's `aria-invalid`; it replaced both.
  - **Checkbox** runs a caller's `onCheckedChange` and still reports `checkbox_toggled`: the caller's handler replaced the analytics wrapper. A caller's `aria-describedby` is joined with the error's, and a caller cannot clear an error with `aria-invalid={false}`.
  - **Toast** reads its direction: the room for its close (`pe-8`), the close itself (`end-2`) and the space between its words and its action (`gap-4`, which was `space-x-4`) follow a right-to-left toast. A toast marked `destructive` draws its close in the destructive roles, not Tailwind's red-300 to red-600.
  - **Search**'s icon and the room the text leaves for it are at the inline start, in a right-to-left field too; in Safari the text no longer runs under the icon. A caller's `aria-describedby` is joined with the error's, a caller cannot clear an error, and a caller's `id` coming or going no longer breaks the hook order.
  - **Tag**'s remove button has a target 24 wide and the Tag's own height round its 16px mark (WCAG 2.2's 2.5.8, with its spacing), from owned CSS, so the Tag draws no larger and a flush scrolling row of Tags doesn't scroll for it, and a new `removeLabel` prop names it in the product's language ("Remove" by default).
  - **Slider** documents `thumbLabels`, which names each thumb in the product's language.

- 08207f4: POIResultCard's double tap and LocationPin's share one gate, so a result's card and its marker open alike: a second press within 300 ms of a touch tap, or a counted double click within 2 s, on the same target, with a quick third tap ignored. POIResultCard behaves as in 0.11.0.
- Updated dependencies [08207f4]
- Updated dependencies [8ceb3bb]
- Updated dependencies [08207f4]
  - @kozmos-ds/tokens@0.8.0
  - @kozmos-ds/product-contracts@0.9.1

## 0.11.0

### Minor Changes

- da7c7a7: `Notice` takes `iconAlign` (GAP-118): `start`, the default, keeps the icon on the first line of a summary that wraps; `center` centres it on a one-line summary that holds a control, such as "Not finding it? [Search with AI]". `icon={null}` or `icon={false}` now draws no icon and leaves no empty column: the summary, the detail and the action start at the notice's edge, where an 8px gap and a 24px indent were left before.
- da7c7a7: The map shell's panel and the scroll regions inside it.
  - **16 below the content's end** (GAP-085): AdaptiveMapShell's panel leaves 16px below its content, as it does above it, so a short result list ends 16px above the panel's edge, beside the map and in a sheet, where it sits above the device's safe area. It publishes `--kozmos-panel-inset-bottom`. The details card, the route preview and the category browser end with padding of their own and give it back, so they end where they did; a part that fills the panel (the assistant) gets none.
  - **No lasting scrollbar on a phone** (decision 75, GAP-138): in a sheet, the panel's content, ManoeuvreCard's open itinerary and FloorSelector's level list draw no scrollbar at rest, as touch platforms don't. They still scroll by touch, wheel and keys.
  - **Kozmos's thin scrollbar beside the map and alone** (GAP-139): the same regions draw a thin thumb in `--semantics-scrollbar-thumb` on a transparent track, kept off a rounded panel's corners in Chromium and Safari.

  **What you'll see:** a fitted panel is 16px taller under a short list. If your panel content pads its own bottom to stand in for this space, remove that padding, or the space doubles (Kozmos's own examples did, and no longer do). A desktop panel's scrollbar is thin and grey instead of the browser's own. A phone layout drawn by a desktop browser shows no scrollbar in the sheet, the direction card or the level list.

- da7c7a7: `POIResultList`, `POIResultGroup` and `POIResultCard` take `onOpen(poiId)` (decision 72, GAP-143). A double tap or double click on a result, selected or not, a group's member included, opens its details: `onOpen` is called once, and the second tap is not passed on as a second `onSelect`, so the first tap's selection stands. A second press counts when the same result took the first and the browser counts it as one (`detail` 2, which follows the OS's double-click setting), or, for a touch browser that reports each tap as 1, within 300 ms; a double click whose first press landed on another result (a group's "Show more" that moved the list), or whose first press on this result is more than 2 s old, selects. A quick tap after an open does nothing, as on SwiftUI and Compose. A keyboard press always selects; the action row's details action is the keyboard's way in. Without `onOpen`, every press selects, as before. It is reported as `poi_result_opened`.

### Patch Changes

- da7c7a7: AICompanionPanel's banner has 12px of space and a divider under it, as its header does (GAP-063), so the thread no longer scrolls up flush against a pinned notice.
- da7c7a7: AICompanionPanel's close button is the details card's close (decision 73, GAP-145): an outline, neutral `IconButton`, 44px square with a 20px X, as POIDetailPanel draws it. It was a 36px bordered pill with a 44px target drawn round it, so the assistant's header is 8px taller.
- da7c7a7: CategoryTile gives a name in Han, kana or Hangul a third line (decision 78, GAP-010), so a long word such as カスタマーサービス shows whole rather than cut at two lines; other scripts keep two. SwiftUI and Compose do the same.
- da7c7a7: Combobox's overlay popup and MultiSelect's popup are drawn in the theme's portal under the field, so a panel, a sheet or a card that clips its overflow no longer cuts the list off. Focus stays in the field, which keeps its keyboard, Escape (IME and host vetoes included) and outside-press handling, and the popup is as wide as the field. In its portal it is fixed to the window, so it is as tall as the room the window leaves, 16rem at most: on a phone on its side it no longer runs out of view. MultiSelect's list is a layer, as Combobox's is, so a press on it works inside a modal Dialog or Drawer, and Escape on the field's own buttons closes the list before the dialog. The listbox itself is now the scroll region, in both layouts, rather than an unnamed wrapper around it (GAP-137), so axe's scrollable-region-focusable no longer fails on an open list that overflows. The scrollbar follows the presentation: none at rest in a map shell's sheet, Kozmos's thin one elsewhere. `@radix-ui/react-popper` and `@radix-ui/react-portal`, already installed with Popover and Select, become direct dependencies.
- da7c7a7: LanguageSwitcher's menu opens straight above its trigger, from its start edge, over a side panel and anything else, as the Web SDK's does (decision 77, GAP-122). It kept to the map's popup region, which with a side panel open put it beside the panel, half way up the map. A long list stays above and scrolls in the room there rather than flipping below.
- da7c7a7: ManoeuvreCard's drag indicator sits 4px above the card's bottom edge and 12px under its content, so the closed card ends 21px under its instruction where it ended 60px under it: about 50px of empty space sat around the grip (decision 74, GAP-140). Its 44px target reaches up from the card's edge, over that space and the instruction's foot, invisibly; a press there opens the card, as the instruction does. Open, the itinerary stops 44px above the card's edge, outside what scrolls, so the target covers no row at any scroll position and the open card is 16px shorter than before. On the theme fill the grip is the guidance foreground at 62%, quieter than the instruction and still 3.09:1 on `#135BEC`, and so is the itinerary's thin scrollbar thumb, where the neutral thumb read about 1.4:1; the background card's grey bar is unchanged.
- da7c7a7: A result's button sets `touch-action: manipulation` (GAP-144), so a double tap on a result on a mobile browser never zooms the page instead of opening its details. Pinch zoom still works. The rule is owned, so it holds in a host without `@scope`.
- Updated dependencies [da7c7a7]
  - @kozmos-ds/tokens@0.7.0

## 0.10.0

### Minor Changes

- aabf75c: `ClientAppBanner`, Express's Client App Banner (GAP-127), for `AdaptiveMapShell`'s `topBar`. It draws the five fields a customer sets in Pointr Cloud and one action, and it can be dismissed. SwiftUI's `KozmosClientAppBanner` and Compose's `KozmosClientAppBanner` draw the same.
  - **Fields.** `promotionText` is the line above the name, `appName` the app's name, and `description` what the app is for, drawn on two lines at most but read in full. `appIconSrc` is the app's icon. `actionLabel` and `onAction` are the button. Every word is the customer's; nothing is invented when a field is left out.
  - **The icon** is 48 square at every text size, as on SwiftUI and Compose, with the Control corner and the subtle edge; an image of any size is cropped to the square, never stretched. Without one, or until it loads, the app's initial stands in for it, as an Avatar's fallback does, and it is gone once the icon loads, so it never shows through a transparent icon. It is decoration beside the name; `appIconAlt` names it only when it says more.
  - **Dismissing.** `onDismiss` adds a dismiss button named by `dismissLabel` ("Dismiss"), the 44 target at every text size. The banner never removes itself: the product does, decides for how long, and moves focus on, as the docs' example does. Left out, there is no dismiss button.
  - **The surface** is its own, since the top bar draws none: the solid surface, the Container corner and map chrome's floating elevation. It is 16 inside and fills the top bar's width.
  - **Narrow widths.** The words and the action share a line while the words keep 10rem beside the icon; past that, the action goes under the icon and the words and spans them both, so the words keep the width beside the icon. The layout, the icon and the targets are owned CSS in logical sides only, so they hold in a host without `@scope`, and right to left mirrors them.
  - **Accessibility.** It is a region named by the app (`aria-label` names it otherwise). It reads the promotion, the name and the description, then the action, then dismiss. The action's name is its words. Every target keeps 44, and nothing moves focus or is announced.

- 60944a9: EmptyState takes `progress`: a long wait it explains, such as a download, and how far it has got, drawn under the description and above the action with a label that names the bar and an optional value in words (`{ value: 40, label: "Downloading the assistant", valueText: "12 of 30 MB" }`, value from 0 to 100, clamped, and NaN as 0). The label is read once, as the bar's name. SwiftUI and Compose take the same, from 0 to 1 (GAP-115).
- 8186d4d: GAP-23: the stylesheet's token variables carry the tokens package's references, declared on each `ThemeProvider` root, so one override of `--primitives-colors-theme-500` in `tokens` re-brands every prominent fill: the filled Button, IconButton, FloatingActionButton, SplitButton, a filled MapControlButton, FloorSelector's selected level and CategoryField's count now follow it, as the Checkbox, Chip and Tag already did. With the ramp's other steps set, the filled Button's hover, focus and pressed and the outline, ghost and link Buttons' ink follow too. Every token computes the value it had, and `DesignConfigProvider`'s `shadow` option still reaches only its legacy `--shadow-*` aliases, not the elevation roles. `ThemeProvider`'s `tokens` also takes a set per theme, `{ light, dark }`: every provider, a nested one that forces the other theme included (DynamicIsland's island is always dark), applies the set for its own resolved theme and inherits both. A flat set still applies to both themes.

  **What you'll see:** nothing without an override. With one on the provider, the Buttons change with the ramp; set it on the provider, not a descendant, since a reference resolves where it is declared. Set the steps around 500 as well (600 and 700, 400 and 300 in the dark): the filled Button's hover, focus and pressed and the hover of a selected Chip, a default Tag, a default Badge and an on ToggleButton read them. With one flat set under a light app, a forced-dark island took the light set's 700 as its outline and link ink (2.26:1 on its black); pass `{ light, dark }`.

- eda3fe0: Itinerary can end its From and To rows in a Change button, as the Web SDK's route card has Edit beside them (GAP-104). Pass `onEditOrigin`, `onEditDestination` or both; a row whose callback is left out draws nothing new, so existing lists, ManoeuvreCard's among them, are unchanged. The button shows `changeLabel` ("Change", RouteLocationField's verb) and is named for its endpoint with that verb first: `editOriginLabel` and `editDestinationLabel`, which, left out, are `changeLabel` and the row's caption (`originLabel`, `destinationLabel`), "Change From" and "Change To" by default. Those are words the product already translates, so a translated verb never sits beside an English noun. It is a ghost button, 44 tall, on the name's first line at the row's inline end, and takes the next line when the name would keep under 80px beside it. SwiftUI and Compose take the same parameters after their released ones.

  The From and To rows' layout is now component-owned CSS, so it holds in a browser without `@scope`: a long unbroken endpoint name breaks rather than widen the page, and Change keeps its place at the row's end. With `@scope` the rows draw as before.

- 65f4d19: `LocationPin` draws its featured, accent and secondary pins as SwiftUI, Compose and Figma do (decisions 62, 66 and 68).
  - **Featured:** a featured pin is the accent, `--semantics-accent-fill` (`#FAB735` in both themes unless you set your own), whatever its variant or tint. It shows the place's logo, passed as `markerContent`, and without one a star in the accent's ink, `--semantics-accent-on-fill` (black), where the number would be. It never shows its number, and the star badge at its corner is gone. Its accessible name is `label` followed by the new `featuredLabel` prop ("Featured" by default; pass it translated), so the colour is never the only way to tell it.
  - **Accent:** the `accent` variant is brand variant 1's 500 (`#4135F1`) with a white number (6.99:1). At rest, its ring and number are the variant's 700. The variant keeps its name: it is brand variant 1, not the new accent colour.
  - **Secondary:** a filled `secondary` pin is foreground/400 under foreground/1000. It was background/200, 1.6:1 against the page.

  **What you'll see:**
  - A featured pin is amber with its logo, or a black star, where it was its variant's colour (blue for `primary`) with its number and a star badge.
  - A filled accent pin is violet with a white number, where it was the theme blue with black in the dark. A quiet accent pin's ring is violet.
  - A selected secondary pin is dark grey with a white number in light, and warm grey with a black number in dark.
  - Screen readers hear "…, Featured" on a featured pin. If your `label` already says it, drop it from the label.
  - To brand Featured, set your accent on `ThemeProvider`: `--primitives-colors-accent-500` and, for a dark accent, `--semantics-accent-on-fill`.

- 112fc78: Add optional `POIResultPresentation.summaryLanguage`, the BCP 47 tag for the language a result's summary is written in, when it differs from the interface language (GAP-125). The model writes the summary in the query's language, so a visitor who asks in Spanish on an English device gets a Spanish summary among English labels. POIResultCard sets it as the summary's `lang`, as it does `nameLanguage` on the name, in a card on its own, in POIResultList and in POIResultGroup, so a screen reader says the summary in its own language's voice (WCAG 3.1.2). With no tag the summary has no `lang` attribute, as before. Existing calls need no change.

  The card's name and summary now take their direction from their own words (`dir="auto"`), tagged or not: an Arabic or Hebrew summary in an English card runs right to left, with its full stop and a clamped summary's ellipsis at its end, and a Latin brand name in an Arabic card runs left to right. Their lines still start at the card's start, so text in the card's own direction draws as before.

  The SwiftUI and Compose contracts gain the same field, and their result cards give VoiceOver and TalkBack both languages. **Native migration:** the SwiftUI and Compose `KozmosPOIResultCard` now draw `result.summary`, muted and two lines at most, after the location, which they did not before: a native card for a result that already passes `summary` is taller, so review native screenshot baselines and any layout that assumes a fixed row height, or leave `summary` unset to keep the old card. On Compose the row gives TalkBack its words as semantics text, never as a content description, and the texts drawn inside it are no longer read a second time: a product UI test that found a row with `onNodeWithContentDescription(...)` now finds it with `onNodeWithText(...)`, `substring = true` for one phrase.

- f333b61: RouteSummary's navigation layout takes `actions` after its progress, for Previous and Next in static wayfinding, and draws them in equal columns in reading order, where a Kozmos Button wraps its label, keeps its 44px and reads `aria-disabled="true"` as unavailable. It can also draw the route preview: `onEndRoute` is optional in the navigation layout, End is drawn only when it is passed, and `locationText` adds the place's line under the destination. Every existing `<RouteSummary>` still compiles and draws as before; only code that reads the End handler from the props types needs one change:

  **Types:** `onEndRoute` is now optional on `RouteSummaryNavigationProps`, and so on the `RouteSummaryProps` union; it stays required on `RouteSummaryEstimateProps`. Code that calls it through those types, such as a wrapper's `props.onEndRoute()` or a `RouteSummaryNavigationProps["onEndRoute"]` handler, no longer type-checks (TS2722, "possibly 'undefined'"). Call it as `props.onEndRoute?.()`, or narrow to `RouteSummaryEstimateProps` where End is always there.

- 8186d4d: Decision 59: prominent filled parts draw the theme fill, theme 500 (the client's base colour), with the theme foreground, white, on it, in both themes. The filled primary Button, IconButton, FloatingActionButton and SplitButton (and every call to action drawn as a default Button) follow the token. A checked Checkbox, a checked Switch (its thumb white on the track), Radio's dot, a selected Chip, the default Tag and Badge, the brand Counter, FloorSelector's result-count badge, a filled primary LocationPin and its number, SaveLocationCard's saved disc, the Stepper's completed step, an on ToggleButton, ManoeuvreCard's `theme` appearance, the UserMessage bubble and POIResultCard's selected number tab move from theme 600 (black on it in the dark) to the new `theme-fill` role. Text, icons, borders and focus rings in the theme's colour stay theme 600: Radio's ring, the current step's ring, Slider, Progress, RouteProgressRail, the Menu, Select and Listbox highlight. On a list's selected level, itself the theme fill, FloorSelector's result count inverts: the theme foreground with its number in the fill, so it keeps an edge. CategoryField's default accent (its icon) moves from 500 to 600, and the MapSheet grip's focus ring from 500 to 600. Rating's chosen thumb is the theme's tint ringed in 600, as the other platforms draw it, instead of a 600 fill. No props change.

  **What you'll see:** primary buttons are brighter (`#135BEC` where they were `#0D44C2`), and in the dark theme they change from light blue with black text to `#135BEC` with white text. Checked checkboxes and switches, selected chips, default tags, badges and counters, filled pins and the visitor's message bubble are `#135BEC` with white on them in both themes; in the dark they were a lighter blue (`#5887F3`) with black on it.

  States on the fill (Olcay, 2026-10-07): the filled Button is its pressed token (`#0D44C2`) while the pointer holds it and its focus token (`#1051E8`) when focused from the keyboard, inside its focus ring; so are IconButton's default, FloatingActionButton, both halves of SplitButton (Firefox never applies `:active` to the menu half, because the menu opens on the press) and a filled MapControlButton. A press shows at once rather than fading in, and an unavailable filled Button (`aria-disabled`, as RouteSummary's Previous and Next) keeps its rest colour under the pointer and a press. Every filled emotion, and `destructive`, reads its own pressed and focus tokens. A hovered selected Chip, default Tag or default Badge is the hover token (`#1051E8`), opaque, where it was the fill at 90% (the Tag's at 80%), which let the page through; an on ToggleButton, which showed no hover, now does too. The default Badge's counter inverts: white with its number in the theme fill, in both themes; the destructive Badge's is unchanged. An on ToggleButton, a selected Chip's remove button and the default Tag's remove button draw Button's offset focus ring (the Tag's drew none), and the remove buttons hover in the theme foreground at 20% on the fill (a selected destructive chip's in its own foreground). Right to left, a checked Switch's thumb slides to the inline end instead of out of the track, and SplitButton's halves meet square on the right sides. No props change.

  **What you'll see:** a pressed primary button darkens to `#0D44C2`, and a keyboard-focused one is `#1051E8` inside its ring. A default Badge's counter is white with a blue number. Right-to-left switches stay in their track.

### Patch Changes

- 1d7ded1: AICompanionPanel's header joins the map shell panel's top inset. In a sheet with a grab handle its title and close button sat 8 lower than a panel header's search field; the header now tops its own 12 up to what the shell leaves rather than adding to it, so it sits where the search field does, and at 16 in a gripless sheet or side panel (GAP-121). Outside a shell it keeps its 12.
- 46612ad: AdaptiveMapShell never clips the map credits into a scroll region (GAP-135, decision 58: the logo first, then the corners, and the credits never clip). When an opened top-bar card and the sheet leave the attribution less room than its full height, MapAttribution's Pointr logo gives way first and the credits keep their full height, so nothing is cut off and no scroll area that a keyboard can't reach is left behind. On a phone where the two bottom corners lift the attribution above them, that room counts the lift; credits that would still reach the card send the corners away, hidden and inert as when they don't fit, and return to the bottom row. The logo comes back once it fits again: MapAttribution keeps a brand that has given way laid out, unseen and out of reach, so the shell measures it whatever is drawn. The panel's sizing is unchanged: it still reserves the attribution's full height, so the logo giving way never moves the sheet.
- a72c7cc: Right to left follows the reading direction, wherever the stylesheet goes.
  - **Arrows and sides.** Right to left, Pagination's Previous and Next, the breadcrumb's separator, a submenu's arrow, a closed tree item's arrow and RoutePreviewPanel's Back now point to the start or the end edge rather than staying left or right, as SwiftUI's `.forward` and `.backward` symbols and Compose's AutoMirrored icons do. Their spacing (Pagination's link padding, Menu's inset, indicator and shortcut, Tree's text, actions and depth indent) follows the reading direction too, so nested tree rows indent from the start edge. Left-to-right layouts are unchanged.
  - **Without `:dir()`.** The package's right-to-left rules, these and the ones it already had (POIMediaGallery's arrows, the gradient Progress track and its flow, the map overlay's and MapInfo's corners), read the nearest `dir` attribute through a `--kozmos-rtl` custom property instead of `:dir(rtl)`. Chrome and Edge match `:dir()` only from 120, below the package's declared 118, and a build that lowers CSS for those browsers (Vite 8's lightningcss) rewrites `:dir(rtl)` into `:lang()` guesses, which mirrored nothing on an English right-to-left page and everything on an Arabic left-to-right one. The only rules the stylesheet adds to elements it does not own set `--kozmos-rtl` on `[dir]` elements.

- 2f12ee8: Decision 68: POIResultCard's Featured tab and a featured card's edge draw the accent, `--semantics-accent-fill` under `--semantics-accent-on-fill`, as a featured `LocationPin` does. They were the alert fill pair.

  **What you'll see:** Featured tabs and edges are `#FAB735` in both themes. They were `#F9A707` in light and `#FBC459` in dark. To brand Featured, set your accent on `ThemeProvider`: `--primitives-colors-accent-500` and, for a dark accent, `--semantics-accent-on-fill`.

- 3dae9d5: The opt-in host reset, `@kozmos-ds/react/reset.css`, sets the page's font. It was Tailwind's preflight copied as written, with eight `theme('…')` calls that only Tailwind resolves, so browsers dropped those declarations and a page with the reset kept the browser's serif. Each now takes the default it names: the system sans stack on `html`, the system monospace stack for code, `currentColor` borders and `#9ca3af` placeholders.
- 3dae9d5: `NavigationItem`'s `asChild` works. It threw on every render ("React.Children.only expected to receive a single React element child"), so a router's link could not be the item. Now the one child, such as a router's link component, becomes the item: it takes the item's classes, `aria-current` and handlers, its own handler runs first, and the icon, the label (the child's own text) and the badge or trailing content are drawn inside it.
- 1d7ded1: A navigation RouteSummary passed to AdaptiveMapShell's `panelHeader` is now hosted there, as it is in the panel's content: no card, padding, radius or shadow of its own, on the panel's one surface (decision 43). It drew its standalone card in the header. An explicit `presentation` still wins, and SwiftUI and Compose already hosted it in either slot.
- c48e982: POIDetailPanel's summary tones show. A toned summary item (success, warning, danger, brand) set its colour on the item, but the value's own foreground won, and its mark inherited that, so every tone drew as plain foreground. The value and its mark now take the tone's text colour, as SwiftUI and Compose draw them; the detail line keeps its muted colour.
- 56ecafc: MapAttribution's Pointr logo ships as a shorter data URL: the artwork's own bytes, with only the characters a URL can't carry raw percent-encoded (spaces, `=`, `/`, `:` and `,` stay as they are). It decodes to the official artwork exactly, draws pixel for pixel as before in Chromium, Firefox and WebKit, and costs the bundle 0.2 KB less gzipped.
- a72c7cc: Progress fills from the inline start: right to left it now fills from the right, as SwiftUI's and Compose's bars do. Its indicator is as wide as the value instead of a full-width bar translated left. The native bars draw React's colours: SwiftUI theme 600 through `.tint` (it drew theme 500 through the deprecated `LinearProgressViewStyle(tint:)`), and Compose theme 600 on background 200 (theme 500 on background 300 read 2.56:1 against its track, 1.58:1 dark).
- a4cafcc: Decision 61: the secondary Button draws the neutral emotion's Primary Buttons tokens in every state, with their ink, as SwiftUI and Compose do. The same goes for IconButton, FloatingActionButton and SplitButton, which render it. It was `bg-secondary text-secondary-foreground` (background/200 under foreground/0), with no hover, focus or pressed colour.

  A press shows at once, and an `aria-disabled` secondary keeps its rest colour. The rules are owned, so they hold in a host without `@scope`. An explicit `emotion` still wins.

  **What you'll see:**
  - **In dark:** the secondary fill is `#464A53` (was `#2E3138`). Hovered and focused it is `#2E3138`, and pressed `#17191C`, under white.
  - **In light:** it stays `#C7CAD1` under black, now `#ABAFBA` hovered and focused, and `#9095A2` pressed.

- d35e14c: A disabled `SegmentedControl` is dimmed once. The group draws itself at 50%, and its segments no longer halve themselves again, so they are at 50%, not 25%. This is how SwiftUI and Compose draw a disabled control. A segment disabled on its own, in an enabled control, still dims itself.
- 01f231d: AICompanionPanel fills a map shell's side panel. Beside the map the shell's panel hugs its content, so the assistant grew with the conversation and its title, close button and input scrolled away with the thread. It now takes the panel's whole height, as it does in the phone sheet, and only the thread scrolls (GAP-124). Other side-panel content still hugs.
- 3dae9d5: `Toast` draws on the background, background/0 under the foreground ink, as SwiftUI and Compose do. It had a border and a shadow but no fill, so whatever was behind it showed through.
- Updated dependencies [2f12ee8]
- Updated dependencies [7471bf0]
- Updated dependencies [8186d4d]
- Updated dependencies [112fc78]
- Updated dependencies [8186d4d]
- Updated dependencies [7471bf0]
- Updated dependencies [2f12ee8]
  - @kozmos-ds/tokens@0.6.0
  - @kozmos-ds/product-contracts@0.9.0

## 0.9.0

### Minor Changes

- fc16560: Add a reusable decorative ProgressTrack and compact UserLocationMarker. RouteProgressRail can now show a host-selected active leg in theme colour or a theme-to-success gradient, fixed transition landmarks and a separate position dot. Invalid or unavailable route positions do not claim zero progress. Existing step-disc consumers retain their presentation until they supply activeLeg.

  Explicit static mode colours only the selected section without a position dot; live mode grows its fill and gradient from journey start to the supplied position, including across transitions. Opt-in directional dash flow is independent of progress, stops at the next transition, honours reduced motion and background lifecycle, and can be disabled by the host without changing position.

  Web respects both OS and application reduced-motion settings, and uses system colours for visible filled distance in forced-colour mode.

- fc16560: Add host-confirmed ArrivalPanel with optional actual journey metrics, localized labels, destination media and a full-width Done action. Extend navigation RouteSummary with hosted presentation, optional estimates and destination media, preserving its estimate layout. Left unset, its presentation is hosted in AdaptiveMapShell's panel (decision 43) and stays standalone anywhere else; pass `presentation="standalone"` to keep its card in the shell. Hosts continue to own routing, arrival confirmation, announcements and dismissal.
- fc16560: Share the semantic DirectionKind vocabulary across platforms while retaining DirectionType as a source-compatible alias. Add walking, enter, exit and directional ramps. Draw directions with Pointr's own wayfinding artwork from the Pointr Maps - Express design, generated from one source for React, SwiftUI and Compose as solid shapes in the current colour: distinct lift, escalator, stairs and ramp glyphs up and down replace the generic arrows, and turns, turning back, the destination, walking, entrance and exit take Express's HardLeft, HardRight, TurnBack, Arriving, FollowTheLine, Entrance and Exit. Straight on, level changes and transitions keep their arrows. The rest of the Express set (no-direction variants, entrance/exit, custom transition, security, shuttle) is exported by name. Existing lift-up/lift-down spellings remain unchanged; update exhaustive switches for the new cases. Native source consumers should rebuild: type aliases preserve source calls, not binary enum identity. Unknown engine directions must be handled by the adapter rather than guessed as a turn.
- fc16560: Correct navigation foundations: join optional direction metrics without stray separators, scope route warning descriptions to each rendered instance, disable stale route options outside ready state, use the proper two-way swap symbol, and provide independent localized route field and action labels. **Analytics:** the wayfinding swap event (`wayfinding_route_swapped`) no longer carries the raw origin and destination strings; a product that needs location analytics must make its own explicit privacy decision. Native source mirrors metric, readiness and labeling corrections and normalizes non-finite progress safely; native source delivery is separate from npm publication.
- fc16560: Add optional per-step distance and duration labels to Itinerary, with matching SwiftUI and Compose source APIs. Missing values remain absent; metrics retain instruction language and current-step semantics. Kotlin copy/destructuring compatibility is preserved. These labels are step estimates, not actual journey totals.
- fc16560: Add an explicit host-filtered RouteLocationField mode for SDK-ranked, synonym and translated search results while preserving local filtering by default. Prevent arrival and routing actions from submitting host forms, and allow long arrival/summary action labels to wrap at narrow widths and enlarged text sizes. The controlled journey restores focus after resolving or clearing either endpoint. Native location fields support the same opt-in filtering mode; existing Compose Combobox overloads remain source compatible.
- fc16560: **Analytics: one press, one event.** Where a component reports a press with its
  own event, the Core Button inside it no longer also sends the generic
  `Button:button_clicked`. Affected presses: SearchBar's clear (`search_cleared`),
  POIResultCard's actions (`poi_result_action`), WayfindingCard's close and swap,
  RoutingInputGroup's add, remove and swap, FeedbackCard's submit, SaveLocationCard's
  save and route, SplitButton's main action, FloorSelector's levels and stepper
  (`floor_selected`), FileUpload's remove and Dialog's close (`dialog_closed`).
  Presses no component reports (a plain Button, SaveLocationCard's note edit,
  SplitButton's menu, the collapsible floor tile) still send `button_clicked`.
  Dashboards that counted `button_clicked` for those presses should count the
  component's own event instead. No props change.
- fc16560: POIDetailPanel's labelled actions are text-only, apart from Go/Directions, which
  keeps the canonical outlined navigation pointer. **What you'll see:** Share,
  Order and the supplementary actions (Book, Call and the rest) lose their icons;
  Go keeps its arrow. Icon-only header controls (close, favourite, save) and
  loading feedback are unchanged. No props change.
- fc16560: Add RouteLocationField for controlled origin/destination search with stable resolved identity, secondary place context, explicit clearing and a separate map-selection action. Loading, empty and error states do not offer stale suggestions. SwiftUI and Compose counterparts are provided from the repository; native Combobox fields retain their accessible labels and SwiftUI selection no longer writes its binding twice.

  Combobox disclosure/clear controls have 44 px/pt web/iOS and 48 dp Android targets and localizable labels. Initial uncontrolled search drafts no longer disappear on mount; subsequent selected-identity changes still update the display. SwiftUI option accessibility includes secondary location context.

  RouteLocationField omits location IDs from automatic selection analytics. Generic web Combobox retains its legacy value event by default and gains an explicit includeValueInAnalytics opt-out.

- fc16560: Add explicit Change and Cancel callbacks for host-controlled location editing. RouteLocationField uses text actions to distinguish clearing a search or changing a place from closing its containing panel; the map action uses a map-pin icon. Hosts without onEdit retain the original clearing callback. The React preview includes cancellable drafts and focus restoration; native parity remains pending design review.

  Move map selection into the dropdown and offer an opt-in host-resolved current position independently of search results. Combobox supports keyboard-accessible popup commands separate from its selectable values; these never write a command label into the query. Current-position validation and lifecycle remain host-owned.

- fc16560: Add optional route transition waypoints and a static completed-track treatment to RouteProgressRail. Markers follow logical reading direction, avoid visual collisions and retain all valid localized descriptions for assistive technology. Invalid positions and ambiguous waypoint IDs are omitted; the host owns route identity and progress basis. Existing rails keep their plain track unless showCompletedTrack is enabled. Matching SwiftUI and Compose source APIs are included separately from native registry delivery.
- fc16560: Add RouteSetupPanel in React, SwiftUI and Compose for hosted setup and map-point confirmation content. Continue requires explicit host readiness and is disabled during calculation; cancellation remains available. Document resolved point identity, request cancellation, map/list alternatives, recovery and sheet/focus ownership.
- fc16560: Compose POI result actions, category clear/count, assistant close/send and wayfinding
  inputs from Core Button, IconButton, Counter and Input. Preserve domain callbacks
  and explicit form behavior while using shared focus, disabled and theme treatments.
  Core Button's generic `button_clicked` is not sent for a press the component already reports with its own event (see the analytics changeset). Custom selection,
  voice/input and native counterparts remain tracked migration work.
  The category group names its count once; its visual Counter is decorative rather
  than carrying an unsupported accessible label on a generic span.

  Allow translated POI action labels to wrap within their card at enlarged text
  sizes. Keep a Combobox's keyboard-highlighted choice by identity across host
  rerenders, and respect composition/caller-handled Escape when dismissing its popup.

  Native source mirrors also reuse Core for Swift saved-location Save/Remove and
  Guide actions and legacy route End, and Compose saved-location Remove. Preserve
  domain callbacks and telemetry while inheriting the Core target sizes and styles.
  Compose Guide now uses Core success styling and the canonical navigation pointer.
  Native neutral note-edit icon actions remain tracked work, not completed migration.

- fc16560: Make ManoeuvreCard theme-filled by default with contrast-paired text and itinerary content. A caller that already sets `surface` keeps that surface (the background appearance), so existing `surface="glass"` cards stay glass; `appearance="background"` asks for the neutral solid/glass surfaces explicitly, and `appearance="theme"` stays opaque whatever the surface; enlarge the disclosure target while retaining focus and language behavior. SwiftUI and Compose expose equivalent appearance choices in their source distributions.
- fc16560: Allow explicit unknown route progress and localized accessible value text. Use logical RTL timeline placement without mirroring turn symbols, and keep rail geometry bounded in narrow containers. Numeric non-finite inputs retain their defensive zero fallback; progress never confirms arrival.

### Patch Changes

- fc16560: Register open Combobox suggestions with Core overlays' dismissable-layer stack.
  Escape closes suggestions first, returns focus to the field, and leaves enclosing
  Dialog, Popover or assistant surfaces open until a subsequent Escape. Host-prevented
  and IME-composing Escape events retain the popup and parent without cancelling the
  browser's IME behavior. Inline popups follow the same contract; an open popup with
  nothing to show is not drawn and takes no layer, so it never swallows a parent's Escape.

  The already-used Radix dismissable-layer 1.1.11 is now a direct dependency; no
  dependency versions are upgraded. Native platform behavior is unchanged.

- fc16560: Refine Dialog typography and spacing and compose its dismiss control from Core IconButton. Add an opt-in `DialogFooter layout="stacked"` for full-width, wrapping actions in DOM order; existing responsive footer ordering remains the default. Navigation recovery examples distinguish the recommended action from returning to the map and restore focus to the actual action destination.
- 7097e1a: UserLocationMarker draws as SwiftUI and Compose do: the heading cone is native's 64-unit wedge, fading out 32 from the dot; the dot casts no shadow; the full marker's ring is white in both themes (the compact dot's stays the surface's colour); and the dot, halo, pulse and cone use the marker's own fixed blue, `Semantics.Map marker.dot`, so the dot reads against its ring in dark mode too.
- fc16560: Allow localized itinerary endpoint captions and long place names to wrap without overflowing. Native endpoints adapt to large type; iOS no longer truncates place names after two lines.
- fc16560: Give routing swap, add, remove and close actions actual 44px targets rather than 32–40px bounds. Reserve enough input space for the enlarged swap control. Native equivalents use 44pt on iOS and 48dp on Android; iOS WayfindingCard also accepts a localized closeLabel.
- fc16560: Prevent ambiguous navigation snapshots from choosing a route or current step silently. RoutePreviewPanel requires unique non-empty IDs and exactly one selected available option before continuation; Itinerary omits current emphasis when several steps are marked current. The host remains responsible for validating and correcting its snapshot. Matching SwiftUI and Compose protections are included.
- 33c1c8d: **MapAttribution links no credit that carries credentials, whitespace or control characters.**
  A credit's destination now passes the same rule as MapInfoPanel's links, shared by both and
  matched on iOS and Android: an absolute HTTP(S) URL with a host, with no user name or password
  (`https://maps.example@evil.example` reads as one host and goes to another) and no whitespace or
  control characters. Such a credit used to be a live link; it now shows as plain text, as any
  other unsafe destination does. Credits with ordinary HTTP(S) links are unchanged.
- fc16560: Omit blank and duplicate Combobox popup command IDs rather than allowing ambiguous
  keyboard activation. Commands remain distinct from selectable values even when
  their string IDs match. Render matching empty-state/supporting messages once while
  retaining field descriptions and nested-overlay Escape ownership. The entry made
  active as the query changes is the first option that can be chosen, never a command,
  so Enter on text that matches nothing chooses nothing; a command runs only when the
  visitor moves to it. Enter ignores Safari's composition commit (keyCode 229).
- fc16560: Make the existing web dialog dismiss control a full touch target, allow its accessible name to be localized, reserve heading clearance and bound overflowing content to the viewport. Text resizing updates the layout immediately without animating geometry independently of the close control; entrance animations are retained. Recovery examples preserve confirmed route points and restore focus through the existing dialog instead of introducing a separate modal implementation.
- 1b483be: RouteProgressRail's route-mode waypoints draw their 1px edge on the web, as SwiftUI and Compose do. The rule that drew it had one class's weight and lost to the scoped preflight's border reset, so each waypoint was a white disc with no edge.
- fc16560: Compose SearchBar's clear action from Core IconButton. Disabled and read-only
  fields now also disable clearing, so the action cannot mutate a locked value.
  The clear label, 44px target, decorative circle, non-submit behavior and domain
  callbacks are retained. Enabled clearing also emits Core's normal Button event.

  Clearing returns focus to the input before host callbacks run and preserves
  forwarded refs. Host keyboard handlers compose with search initiation; prevented
  or IME-composing Enter events do not initiate search analytics.

- fc16560: Preserve SearchBar input styling in WebKit using component-owned CSS instead of native-control scoped utilities. Its input remains shrinkable and chrome-free, keeping the Core clear action inside narrow layouts at enlarged text sizes. The recipe uses a SearchBar-specific class so Core Search retains its independent bordered field styling. The existing callbacks and public API are unchanged; this does not introduce the separately planned Core decorated-field capability.
- fc16560: Reduce stylesheet size by sharing identical light/dark token declarations while retaining both selectors and their original specificity. Public token names, values, utility styles and component styles are unchanged. Include PostCSS helpers in the build cache inputs so compiler changes cannot restore stale stylesheets.
- Updated dependencies [7097e1a]
- Updated dependencies [fc16560]
  - @kozmos-ds/tokens@0.5.0
  - @kozmos-ds/product-contracts@0.8.0
  - @kozmos-ds/icons@0.6.0

## 0.8.1

### Patch Changes

- 55239e5: Accessibility fixes found in the 0.8.0 audit. No props change.
  - **LanguageSwitcher keeps focus while the host applies a language.** In the documented async flow the trigger was disabled while `pending`, which dropped keyboard focus to the page for the whole wait. It is now `aria-disabled` and stays focusable; opening and requesting are still refused. The pending status region stays mounted, so its text is announced. A test that expected the trigger to be `disabled` while pending should expect `aria-disabled="true"`.
  - **MapInfo beside the map ignores an Escape from the map.** It closed on any Escape and moved focus to its trigger, even while the visitor typed in the map's search. It now closes on Escape only with focus in the pane, and hands focus to the trigger only if it was there. Its dialog is named once, by the panel's visible heading (no hidden copy), and inside the dialog the panel is no longer a second landmark of the same name.
  - **FloorSelector reads each level once.** The full-name hint is visual: no longer each button's description, which read every name twice. It no longer pops up for the focus the selector moves itself as the column opens or closes; keyboard focus and hover still show it.
  - **MapAttribution's credit line is a tab stop only when it overflows**, as a group named by `label`, so a keyboard can scroll it. A line that fits is no longer an unnamed stop before its link.
  - **The default result look keeps its layout without native `@scope`.** POIResultCard's selection button and its SDK name are owned rules, so the SDK tab stays flush with the card's top and long names wrap in a browser without `@scope`. Nothing changes where `@scope` is supported.

## 0.8.0

### Minor Changes

- b734587: Add optional `POIResultPresentation.languageNotListed` and localized result-card/list/group disclosure. Only explicit `true` renders a note; missing data, authored-name language and interface language never imply staff-language availability. Existing calls stay unchanged. Native source mirrors the contract, and Swift selection copies now preserve the existing summary as well as the new language evidence.
- aa32bb7: Correct the declared Firefox minimum from 128 to 146. This is a breaking support-policy correction: the remaining scoped utility CSS requires native `@scope`, enabled by default in Firefox 146. Firefox 128 was incorrectly advertised as supported; Badge and Separator lose their styling there even though owned-CSS controls such as Button and Input still render correctly.

  Consumers must use Firefox 146 or newer, or defer adoption while their browser requirements are reviewed. There is no legacy-browser polyfill or CSS fallback in this change. Existing published packages are not modified. Other declared browser minimums are unchanged, and this prerequisite does not certify every component or a product's embedded WebView. Add a manifest regression guard and exercise built scoped utility styles with nested themes in Firefox CI.

- b94423b: Accept ordered instruction parts in DirectionStep, ManoeuvreCard and Itinerary, preserving secondary emphasis, caller-supplied word order and per-part speech language alongside legacy strings. SwiftUI and Compose equivalents retain native string calls and itinerary source-copy compatibility. Hosts still own translated wording; physical assistive-technology and product adoption require separate acceptance.
- d096d4f: Make the approved SDK result presentation the default: shared neutral selected/hover surfaces, combined numbered Featured and badge tabs, matching corner radii, wrapping names and an outlined navigation icon on Go actions. Grouped and standalone results share the treatment. `presentationStyle="legacy"` preserves the prior appearance for staged migration; numbering remains opt-in and product-supplied.

  Add themed result surface tokens. SwiftUI and Compose source implementations adopt the same default and add directly composable expandable result groups. Existing callbacks and positional native calls remain supported. Review changed card heights and accessible names; SDK sprite integration and physical accessibility acceptance are separate from this source change.

### Patch Changes

- 13347cf: Give AdaptiveMapShell's controls and registered bottom corners distinct named accessibility regions. New optional controlsLabel and bottomControlsLabel props default to "Map controls" and "Map corner controls" and accept translated names. Child controls stay independently accessible, and hidden or omitted regions do not introduce navigable empty landmarks. SwiftUI and Compose source implementations expose equivalent named containers while preserving existing native call signatures. Layout and keyboard behavior are unchanged.
- 13347cf: Keep ManoeuvreCard's accessible container name when expanded, including with custom itinerary content. The existing manoeuvreLabel now names both states, while itinerary content and the close control remain separately accessible. Matching SwiftUI and Compose source changes preserve the same behavior.
- 59ff7d4: Disable POI result-card actions when no `onAction` handler is supplied, matching iOS and Android. The actions remain visible but cannot produce analytics-only presses. Supply an `onAction` handler to make them actionable; an explicitly disabled action stays disabled.
- 393cdc4: Give AdaptiveMapShell a 16-unit gap below its fixed panel header and a 16-unit top inset in gripless sheets. Hosted surfaceless POI, browse and route components consume that supplied inset instead of doubling it. Content-fitted sheets include their border and do not retain empty height after the grip appears. SwiftUI and Compose source follow the same spacing contract.

  Remove product-owned 16-unit spacer workarounds directly below panelHeader, and redundant top padding on outer content wrappers in gripless sheets or side panels. For example, a navigation panel wrapper using `p-4` becomes `px-4 pb-4`: the shell supplies its top 16. Bordered cards retain padding inside their own border; do not remove that padding. Publication, Figma regeneration and consuming-app adoption are separate steps.

- 13347cf: Give POIResultCard actions a 44px-equivalent minimum target instead of a fixed 40px height, allowing growth with larger text. SwiftUI and Compose source implementations and the Figma importer now use the same minimum painted height; SwiftUI includes padding in the tappable label and Android retains its larger platform touch-target policy. Selected results may be taller than before; handlers and disabled behavior are unchanged.
- Updated dependencies [b734587]
- Updated dependencies [b94423b]
- Updated dependencies [d096d4f]
- Updated dependencies [0d6b764]
  - @kozmos-ds/product-contracts@0.7.0
  - @kozmos-ds/tokens@0.4.0

## 0.7.0

### Minor Changes

- ccc6580: Add MapAttribution: provider-neutral, single-line horizontally scrollable credits with safe links and independently optional branding. The host supplies approved content and owns SDK provider resolution and map placement. Matching SwiftUI and Compose components accompany the web presentation.

  Use compact text-height credit rows and 4-unit spacing across all three platforms, without map-button minimum heights.

  Bundle the official Pointr logo by default on all three platforms. Supply brand to replace it for white-label use, or showBrand=false to hide branding without hiding credits. Artwork loads locally with no network dependency.

  Encode the web artwork as a compact SVG data URL without changing the canonical image, and keep generated branding stable under repository formatting.

  Default to transparent map appearance with tokenized grey text and a thin white halo across all three platforms. The optional surface appearance retains the opaque themed treatment. Preserve underlines, a single accessible label per credit, one-line scrolling and independent branding.

- ccc6580: Add a controlled, web-only LanguageSwitcher for AdaptiveMapShell's bottom-start slot. Show native language names, retain the committed locale during pending/failed changes, expose localized status and retry, and bound the selection menu to the registered shell region. Empty and already-selected single-language lists remain visible but disabled. Native apps deliberately keep device/app-language behavior without a language button.

  Mirror Select item padding and selection indicators correctly in right-to-left interfaces.

- ccc6580: Add MapInfoPanel and MapInfo for host-supplied venue information, FAQs, credits,
  support/legal links and labelled versions. Reserve a logical-end pane on wide
  maps and use a full-screen modal on compact hosts, preserving map/browse state.
  SwiftUI and Compose counterparts ship in the repository alongside the React API.
- ccc6580: Add a measured attribution slot to AdaptiveMapShell, matching SwiftUI and Compose.
  Credits stay centered across the full map, independent of side panels, or above bottom sheets.
  Equal reservations for the larger corner keep unequal controls from shifting attribution.
  Tall side panels leave the footer band clear.
  Controls retain equal side/bottom insets; only attribution moves above oversized corners
  when their middle gap is too narrow. Credits use one horizontally scrollable, scalable
  line (10px default on web); large sheets preserve attribution room.
  Transparent attribution aligns the credit line itself with the 16-unit bottom inset,
  without adding inner padding beneath it.
  Web layout snapshots identify attribution occlusions and include their bottom camera
  inset independently of optional control padding. Omitting the slot preserves existing layout.
- ccc6580: Refine the collapsible level switcher with floor-availability arrows and full-name hints. The whole tile opens the level list; arrows are non-interactive indicators. Preserve the 48px tile and close the list with one Escape even when a hint is open.

  Make per-floor result counts opt-in with `showResultCounts` (default `false`). Hosts upgrading from 0.6.0 must explicitly enable it to retain badges in the expanded, vertical or horizontal lists. Hidden badges are also omitted from accessible names. The collapsed tile and compact stepper never display counts.

  Add logical `top-start`, `top-end`, `bottom-start` and `bottom-end` MapOverlay positions that mirror in RTL while respecting physical collision insets. Existing web left/right positions remain physical. Corresponding SwiftUI and Compose source changes are included in the repository; native packages are not published to npm. Native left/right overlay positions now correctly stay physical in RTL—use start/end for mirroring.

  Correct compact-stepper separators in RTL. Native selectors preserve missing selected IDs instead of substituting the first floor or emitting fabricated selections; stepping stays disabled until the host selects a supplied floor. The Android source API retains existing positional count-formatter calls without implicitly enabling counts.

  Add independently measured logical `controlsBottomStart` and `controlsBottomEnd` slots to AdaptiveMapShell across React, SwiftUI and Compose. Opposite corners share a row when they fit and stack without shrinking controls when they do not. They clear the shell's panel and top controls, mirror in RTL, retain mounted state during resize, and become unavailable when the remaining vertical band cannot fit them. `bottomControlsPadCamera` is opt-in (false by default); React reports the region as a conservative controls occlusion regardless. The legacy controls slot remains supported.

  Native shells now respect a bounded host shorter than 448pt/dp. Give native shells a bounded parent; the shell no longer forces that old minimum. Compose now reports measured panel/top-bar/safe-area camera padding rather than echoing caller insets alone. These changes are source-only for native consumers and are not native registry releases.

  Bound expanded floor lists to the registered map-shell region, scroll long lists without shrinking targets, reveal the selected floor after measurement, and dismiss the popup when its region disappears. Preserve standalone viewport behavior and existing small-list geometry.

  Keep full-name tooltips inside the floor dialog's accessible ownership but outside its scrolling viewport, preserving keyboard descriptions and preventing clipped hints.

### Patch Changes

- ccc6580: Fit wide AdaptiveMapShell panels to short content and bound long content above
  the bottom control row. Keep bottom-start/end controls at the outer map edges
  in LTR and RTL, rather than pushing them beside the panel. Bound corner popups
  below short panels or in the clear map beside long panels.
  Permit a shell-bound floor menu to move horizontally away from its trigger when a
  same-side panel occupies that column, instead of overlapping the panel on web or
  refusing to open on native.

  SwiftUI and Compose mirror the layout policy. The iOS QA search header now uses
  equal top and side padding on wide screens.

- Updated dependencies [ccc6580]
- Updated dependencies [ccc6580]
  - @kozmos-ds/tokens@0.3.0
  - @kozmos-ds/product-contracts@0.6.0

## 0.6.0

### Minor Changes

- 58ca08d: `AICompanionPanel` gains an optional `open` prop. With `open` omitted, mounting the panel opens it and takes focus, as in 0.5.0; unmounting returns focus to its opener. Existing consumers that mount the panel to open it do not need to change that pattern.

  With `open` supplied, keep the panel mounted and turn it from `false` to `true` when the visitor opens it, usually from `AISearchButton`: that transition takes focus. A panel mounted with `open={true}` is already on screen and does not take focus or call `onOpenAutoFocus`. Closed, it draws nothing. Closing or unmounting returns focus to the opener unless the product has already moved focus outside the panel.

  `onOpenAutoFocus` and `onCloseAutoFocus` let the product prevent the default handoff and choose a focus target. Place the panel itself through its `className`, rather than a wrapper that would remain over the sheet after it closes.

- 7da92a8: `AIInputBar` draws a microphone that starts a spoken conversation with the assistant, which answers aloud, when the product passes `onVoiceStart`. Without it there is no microphone, so voice stays off unless the product has a voice model and turns it on: an App Clip leaves it out. The microphone sits between the field and send, 44px. The product keeps `voiceState` (`AIVoiceState`: `idle`, `connecting`, `listening`, `speaking`, `unavailable`, `error`) and ends the conversation in `onVoiceEnd`. Kozmos records and plays nothing: the voice model, its connection, the microphone permission and the audio are the product's.

  The control is named for what a press does, "Start voice conversation" or "End voice conversation", with no `aria-pressed`. A polite live region announces each change of state, and while the conversation is live the empty field shows it in place of its placeholder. `unavailable` is `aria-disabled`, so it stays focusable and a press does nothing. Offline, `disabled` shows a microphone that is not in use as unavailable, while a live one can still be ended. Every string is a prop with an English default (`voiceStartLabel`, `voiceEndLabel`, `voiceConnectingLabel`, `voiceListeningLabel`, `voiceSpeakingLabel`, `voiceEndedLabel`, `voiceUnavailableLabel`, `voiceErrorLabel`); an empty string leaves that announcement out.

- a67223c: `FloorSelector` gains `variant="collapsible"`, the SDK's level switcher for a control parked in a corner of a map (row 79, GAP-080), as iOS and Android have it. At rest it is one `MapControlButton` showing the current level's short label. Activated, it grows into a column of every level over itself in a `Popover`, in the supplied order: pass floors top-floor-first. The current level is outlined in the theme's primary and a closed level muted; the tile says `aria-expanded`. A choice, Escape or a press outside closes the column, and focus goes back to the tile, which is named by the level now shown, unless the press put focus on another control. The column's level counts sit at their bottom corner.

  It also gains `userFloor`, the level the visitor is on by the same id as `selectedFloor`, and `userFloorLabel` (default "your level"). The switcher marks that level with a dot: on the closed tile while it shows that level, and on that level in the open column. It is said with the level's name, "Level 1, your level". Only the switcher draws it; the other variants take the props and ignore them.

  Migration: exhaustive switches over React's floor-selector variant union or Android's `KozmosFloorSelectorVariant` must handle the added `collapsible`/`Collapsible` case. The existing variants remain supported.

- 00e857b: - **`MapControlsGroup` remembers heading** (decision 45). With `locationState="heading-paused"` the location control shows the SDK's rotational Off — the upright pointer in outline and "Focus / Off" in the off grey — and a screen reader hears `locationHeadingPausedDescription` after the words (default "press to turn the map with you again", for the product to translate). The next press should bring `heading` back, which is the product's to do. `"heading-paused"` is new in `@kozmos-ds/product-contracts`, released with this: react pins its siblings exactly, so the two go out together.
  - **`MapOverlay` passes presses in its room to the map** (decision 46). The room around what an overlay holds stays for the shadows, but while what it holds fits, only what it holds takes a press: a press or a drag in the room, or between the overlay's items, reaches the map beneath. While what it holds overflows, and only then, the room takes presses again, so that a wheel or a touch over what it holds scrolls the overlay in every engine (Linux WebKit scrolls a box from a wheel only if the box takes presses), and a scrollbar a platform draws there takes its drag; focus scrolls it either way. The overlay marks its stack `data-scrolls` while it overflows.

  Migration: consumers that switch exhaustively over `UserLocationState` must handle `heading-paused`. Existing values and callbacks remain available.

- 24c7530: LocationPin: a numbered pin is quiet at rest and filled when selected, so it pairs with the result card's number tab (decision 55). **The look of unselected numbered pins changes, by design; no prop changes.**
  - **At rest**, a pin with a `number` is the outlined marker on the background, with its ring and number in the pin's colour, as the SDK's map draws its unselected results. Before, every numbered pin was filled with a white number, selected or not.
  - **Selected**, it is filled as before, with the ink made for the fill on the number, and still grows.
  - **Unchanged:** a featured pin, a pin showing `markerContent` (a logo or an icon) and a pin with no number keep their fill.
  - **Off the floor**, the outlined marker's ring is now dashed, so it is never taken for a quiet pin at rest, in forced colours and for any colour vision. It still takes the number in the foreground and is never filled.
  - **Variants** keep their colours in the ring and number. `secondary`, whose own colour is a surface grey (1.6:1 on the background), takes the muted foreground as a ring and a number, off the floor too, where its ring had not shown.
  - **A tint** outlines a numbered pin at rest in the category's fill, with the number in the foreground: six of the eight fills fail 4.5:1 as text on the background.

  Measured in Chromium, Firefox and WebKit: the primary number reads 6.24:1 on the light background and 6.17:1 on the dark, and its ring at least 4.68:1 against Pointr's light map. On the dark map it reads 3.27:1 or more, except over food-and-drink rooms (2.76:1), where the filled pin is the same colour. iOS and Compose make the same change.

- 9070b0f: `ManoeuvreCard` shows the whole instruction, and the card grows with it (GAP-094). It cut the instruction at two lines, which lost ordinary words: "Take the escalator near Fountain Court up to…" lost the level, and German "Biegen Sie bei Marlow Apotheke auf der linke…" lost the turn itself, "rechts ab". This is a deliberate change of default, asked for by MAP-111 (US1-EC8): a card with a long instruction is now taller. A product that wants a limit passes the new `instructionLines`, the most lines drawn before an ellipsis (`instructionLines={2}` draws what 0.5 drew; under one line is no limit). Assistive technology hears the whole instruction either way, as it did. The itinerary keeps its own cap, `maxItineraryHeight`.

  Open, the itinerary that scrolls past the cap is a stop in the tab order (GAP-100): a group named after the itinerary it holds, by the new `itineraryLabel` ("Itinerary" until the product passes its own words, as `Itinerary`'s `label` is). It could not take focus, so a keyboard could not reach the steps past the cap (axe's `scrollable-region-focusable`, serious). It is a group, not a second landmark, and it draws the focus ring.

  Focus goes with the disclosure (review T4). Opening removed the instruction button that had focus, and focus fell to the page; closing from the grab bar left focus on the bar, hidden from assistive technology and out of the tab order. Now focus on the part that goes moves to the part in its place: from the instruction to the itinerary as the card opens, from Hide or from inside the itinerary to the instruction as it closes. Focus anywhere else is left where it is, whether a key, a pointer or the product changed `expanded`, and a pointer never puts focus on the closed, silent bar. Every existing prop and callback is unchanged.

  **Native (iOS and Android):** `KozmosManoeuvreCard` shows the whole instruction by default too, with `instructionLines` to cut it. On opening, iOS requests accessibility focus on the itinerary container and Android requests keyboard focus on Hide; closing requests focus back on the instruction when focus belonged to the removed part. Human VoiceOver and TalkBack behaviour still needs verification on a device with the product's actual itinerary; a focus request is not proof that assistive technology follows it. A ManoeuvreCard call written against 0.5.0 still compiles, on Android through an overload with 0.5.0's parameters.

- 36db8b6: The map controls take the SDK's current look (decision 40): the Tracking Indicator of Pointr's Location Tracking Buttons. Every map control wears it — `MapControlButton`, so the zoom pair, the compass, the location and step-free control and the floor tile.
  - **The surface.** A 48px square (above the 44px touch target), the Control corner (16), no border in any state, and the map controls' own elevation, three shadows, with the SDK's 32px backdrop blur. The zoom pair is one such surface, its buttons its segments. It is owned CSS now, so it holds in a host without `@scope`, and a caller's class still wins over it.
  - **The words.** Two equal lines, "Focus" over "Off" or "On", bold 16 on a 16 line. A toggle's state is its tone: off, the words and the mark are grey (foreground/400); on, the words are navy (theme/1000) and the mark the theme's blue (theme/600). "On" no longer draws a primary border or a lower shadow. A control that is not a toggle (`pressed` unset) keeps the ink. Marks are the SDK's 24px.
  - **`MapControlButton`** gains `stateDescription`, said after the state and never drawn, and `showLabel`, which draws a state alone while its name still starts the accessible name.
  - **`MapControlsGroup`**: with no position (`unavailable`, `permission-denied`) the location control reads its state alone, on one line — the SDK's "No Location". Heading reads "On", as following does; its mark tells them apart, and a screen reader hears `locationHeadingDescription` after the words (default "map turns with you", for the product to translate).
  - **`MapOverlay`**'s room is the reach of the map controls' shadow as well as the floating one's: 32px above and at the sides and 48px below, where it was 4, 8 and 12.

- e3cbdbf: `MapStatusPill`, one status on the map in five tones (decision 39). The SDK's PositionStatus, Downloading Content and Turn Back indicator are all this part, and so is the step-free route being calculated (GAP-102). The words, the tone and when it shows are the product's; place it in a `MapOverlay`, for example at the bottom centre.
  - **Tones.** `neutral` draws the words alone; `progress` turns the system's arc in the theme's blue; `success` draws a check and its words in the success colour; `danger` draws a warning triangle in the danger colour and keeps the words ink; `warning` fills the surface with the new `Emotion/alert/fill` under its `onFill`, the SDK's bright amber under black words in both themes (Turn Back), 10.56:1 light and 13.14:1 dark. The words read at 4.5:1 or more, and the marks at 3:1 or more, in both themes.
  - **The surface** is the map controls' own (decision 40), from the same owned rule: the page's surface, the Control corner, no border in either theme, the map controls' three shadows and the 32px blur, at least 48px tall, 8px above and below and 12px at the sides. The words are 13px on a 16px line in `foreground/300`; it wraps at 16rem rather than cutting them.
  - **`icon`** replaces the tone's own mark, drawn at 24px in the tone's colour; `icon={null}` draws none. The mark is never announced.
  - **Announced politely.** It is `role="status"` by default; `live` takes Alert's and Notice's `"off" | "polite" | "assertive"`. With no words it draws nothing and keeps its live region, so a product that keeps it rendered where it shows has its first words read too.
  - **`MapControlButton`'s surface rule** now dresses both parts; nothing about a map control changes.

- 31eb28d: `BottomNavigation` labels are now 11px on 14px lines, wrapping to at most two lines. It keeps its own items rather than reusing the rail's redesigned side-menu items: `compact` remains the default, with a 64px minimum item height and 6px padding; `default` uses a 72px minimum and 8px padding.

  This is a visible typography change for bottom navigation. Rail sizing and selection follow the separate side-menu change in this release; the intermediate 72px/64px rail-tile design does not ship.

- 9013c31: The rail takes the dashboard side menu's design. A `NavigationItem` with `placement="rail"` no longer draws a fixed 72px tile (64px compact): it fills the width of its rail, 96px, and grows with its label. It is padded 16px by 8px, with a 24px icon 6px above an 11px regular label on 14px lines that wraps to two lines, so an item is 76px tall, or 90px with two lines. At rest it is the muted foreground, with no fill. Selected, it is primary on the lightest theme tint (theme/0), with a 2px primary bar down its inline end (the right in LTR, the left in RTL), where it was primary on the grey muted fill. It is square, and its focus ring is drawn inside it. `density` still sizes top and side items; a rail item draws the same with `compact` as without it.

  `Sidebar`'s `rail` variant is that 96px rail: it was 80px with 8px of inline padding, and its items now fill it. Its background is the surface (`bg-surface-0`, the same colour as before), and its 1px edge is at its inline end (`border-e`) in both variants, so a right-to-left sidebar draws it on the left.

  `BottomNavigation` keeps its own items: it no longer renders `NavigationItem` rail tiles, so it does not take the rail's padding, width or selected bar. It preserves the icon-over-label layout, equal-width items and muted selected fill. Labels now use 11px text on 14px lines, as described in the separate typography change. Its items are no longer marked `data-placement="rail"`; they are `data-slot="bottom-navigation-item"`.

  This is a visible change: screenshot tests of a rail or a sidebar rail will see it, and a product that sized rail tiles itself (`className="w-24"`) no longer needs to.

- 6f9b048: `POIResultList`, `POIResultGroup` and `POIResultCard` take an optional `idPrefix`, and `getPOIResultDomId` an optional second argument, so a page can show the same place in two lists without drawing its ids twice. A card's id came from the place's id alone, and its action row's and unavailable note's from that, so a second list's `aria-controls` and `aria-describedby` resolved into the first list. With `idPrefix`, every id in the list becomes `getPOIResultDomId(poiId, idPrefix)` and its references stay inside it; a map pin names the intended card with the same call, through `LocationPin`'s `resultId`. Without it the ids are exactly what they were, and a card's own `id` still wins.

  Give each independent list a distinct, stable prefix when the same POI can appear more than once on a page. Keep that prefix consistent between server rendering and hydration, and use the matching prefix for a pin's result reference; do not change the POI's business identifier.

- 8eae92c: `POIResultList`, `POIResultGroup` and `POIResultCard` gain `numbered`, off unless the product turns it on. A numbered result shows its `result.resultIndex`, the number its pin shows on the map, in the card's tab (before its name in a group's row), for a list whose pins are numbered: quick access, where a category chosen in the browse grid lists that category's places. Kozmos draws the number it is given and never renumbers. One tab per card: Featured wins over the number, so a featured result keeps its Featured tab and no number, as its pin shows its logo; the number wins over a badge. At rest the number's tab is quiet, outlined on the card's grey edge; selected, it fills with the primary colour. The number leads the result's accessible name ("2, Burger King") and its tab is decorative; a `selectionLabel` replaces the whole name, as before.

  The badge tab is quiet, as the contract always said (GAP-054): a neutral tab with no star, on the card's grey edge. It drew the Featured star, colour and edge, so an "Alternative" read as featured. The tabs now sit inside the card's top-start corner, sharing its outer curve and edge, with only the inner corner rounded. They sit on the right in a right-to-left language, and their colours and corners are owned rules that hold without `@scope`.

  **A deliberate visual change to Featured:** the Featured tab is the SDK's bright amber under dark words, the alert fill pair (`--semantics-emotion-alert-fill` and `--semantics-emotion-alert-on-fill`), for its words and its star, and a featured card's edge takes the same amber, selected or not. It was the darker warning fill under white words, with a darker edge. The words read at 10.56:1 in the light theme and 13.14:1 in the dark.

- 15b5524: `POIResultCard` draws a walk as a band when the product sets `result.travelEstimate.band` (decision 50, GAP-088): **Nearby**, **1–2 min**, **2–5 min**, **5–10 min** or **More than 10 min**, in place of the exact minutes. Nearby is drawn in the success colour, the success emotion's Text role, which reads at 7.1:1 on the card in the light theme and 17.7:1 in the dark; the other bands keep the card's text colour. The word itself says Nearby, so the tone is never carried by colour alone. The colour is an owned rule, so it holds in a browser without `@scope`.

  The words are English until the product passes its own as `travelTimeBandLabels`, for one band or all five; `POIResultList` and `POIResultGroup` take the same prop and hand it to every result. A result with no band shows `durationLabel` as before, and `POIDetailPanel` keeps the exact minutes from the same estimate.

### Patch Changes

- 5a7f5da: `AICompanionPanel` keeps what it covers out of reach while it is open (the site's GAP-93, WCAG 2.2 2.4.11). It covers the frame and moves focus in, but Shift+Tab from the panel landed on the search's tiles beneath it, where nobody could see them. While open, a panel laid over the box it fills, `absolute inset-0` in its positioned container as its docs place it, now makes the rest of that box inert, and nothing beyond it; fixed over the whole viewport, it covers the page. It measures what it covers as it opens and again whenever it or that box changes size while it is open, so a layout that moves it from covering its frame to half of it gives the other half back, and the other way takes what it now covers, moving focus into the panel from a control it has just covered. Live regions beneath still speak, whether they are marked with `aria-live` or live by their role (`status`, `alert`, `log`, `marquee` or `timer`, or an `output`), as `MapStatusPill`, `Alert`, `Notice` and `Spinner` are; an open `Select` now leaves those role-only regions out of what it makes inert too. Popups a part inside the panel opens in the page's portal stay in reach. It gives everything back as it closes, before it hands focus back, so focus returns to the button it covered and `onCloseAutoFocus` can focus anything under it. A panel in flow, or over only part of its box, makes no background content inert. Initial focus follows the documented mount/controlled-open policy; responsive focus recovery applies only when the previously focused control becomes newly inert. A product's own `inert` on the covered box is left to it.
- 836257b: `AICompanionPanel` composes Escape with the product's own key handler. A product's `onKeyDown` replaced the panel's handler, so adding analytics or a shortcut stopped Escape from closing the panel; and an Escape a part inside had already handled, and marked with `preventDefault()`, closed the panel anyway. The product's `onKeyDown` now runs first, and Escape closes the panel after it unless the event has been default-prevented, by the product's handler or by a part inside. It still closes this panel only, and other keys never close it.
- 9e8d657: Keep focus on assistant inputs and other intentionally reachable controls when a responsive assistant panel grows to cover its frame. Move focus into the panel only when the previously focused control becomes inert.
- 641be45: `BottomNavigation`'s `density` says what it does for the bar: `compact`, the default, is an item at least 64px tall and 6px in from its edges; `default` is at least 72px tall and 8px in. It was typed as `NavigationItemProps["density"]`, whose docs describe the rail's item and say the compact tile is retired; it is now `"default" | "compact" | null`, the same values.
- dd06e4a: `POIDetailPanel`'s `sheet` presentation, hosted in `AdaptiveMapShell`'s sheet under a grip, now sits its close button as far from the panel's top as from its side: 17px and 17px, where it sat 21px and 17px (decision 51, row 82 / GAP-083).
  - The header tops its 16px up to the grip's row and no longer adds the grip's 4px clearance, wherever its buttons stay clear of the grip's target anyway. The grip is a 16px row, an undersized target, and WCAG 2.5.8 keeps a 24px circle on its centre clear of every other target.
  - Where they would not, on a narrow panel, the header keeps the clearance, 21px and 17px, as every other part at the panel's top does (decision 14). With favourite, save and close that is a panel under 340px wide, such as a 320px phone; with one toggle and close, under 240px; with close alone, under 140px.
  - The header reads the card's width from a container query. Hosted in `AdaptiveMapShell`'s panel, the details card is a size container of its own, inline size only, and fills the panel's content box; on its own, in a box that shrinks to fit, it is no container and keeps its width. The panel itself is not a container, so a product's own container queries in content it hosts, unnamed ones and `cqi` or `cqw` units among them, read the product's own containers. Fixed and absolutely positioned parts inside the card place as they did.

  In the `sheet` presentation the header's buttons now draw their keyboard focus ring inside their edge, as the actions strip draws its own. Flush against the card's top, in a side panel since the header first topped up and now under a grip, a ring drawn outside lost its top edge to the card's and the panel's scrolling boxes.

  A side panel, a single-detent sheet, a sheet with a `panelHeader`, and the `panel` and `inline` presentations keep their insets.

- ddfcc5a: Decision 48 on every glass surface: text that is muted elsewhere takes the foreground colour on glass, so it reads at 4.5:1 over any map.
  - The cards that take `surface` draw their muted text through `kozmos-muted-text`, which reads the glass surface's `--kozmos-surface-muted-foreground`. That covers `ManoeuvreCard`'s detail, `Itinerary`'s captions and origin (inside a glass manoeuvre card), `RouteSummary`'s distance, and the descriptions of `FeedbackCard` and `SaveLocationCard`. Muted over a saturated map they read 3.6:1 to 4.2:1; on glass they now read 9.7:1 or more. On a solid card they look as they did.
  - `POIMediaGallery`'s position follows wherever the gallery sits, hosted on its own too.
  - `POIDetailPanel`'s muted lines read the property directly. Its `panel` and `inline` presentations say they are a card of their own, so their text stays muted even on a glass sheet.
  - In `AdaptiveMapShell`'s panel, `POIDetailPanel`'s summary strip paints no fill of its own (decision 43): across a glass sheet it was an opaque band. On its own it keeps its fill.

- 04ed458: Every part at the top of `AdaptiveMapShell`'s panel now keeps the grip's clearance, not only the panel header and the details card (decision 14).
  - `BrowseCategoriesPanel`: as the panel's content, its first row (the search row, or the tiles when there is none) tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Its search field sat 33px from the panel's top and 17px from its side; it now sits 21px down under a sheet's grip and 17px down in a side panel or a single-detent sheet. The tiles under a search row keep their 16px, and on its own it is unchanged.
  - `POIResultList`: under a grip it keeps the grip's 4px above its first result, which sat inside the grip's 24px target circle (WCAG 2.5.8). It adds nothing anywhere else.

  The two custom properties describe the panel's top: a part placed under a row of your own should have both set to `0px`, or its row belongs in `panelHeader`.

- b51f1be: In `AdaptiveMapShell`'s panel, sheet or side, a hosted part paints no fill of its own: the panel's surface, solid or glass, is the one surface (decision 43).
  - The panel sets `--kozmos-panel-part-fill` to `transparent` on its content and its header, in a sheet and a side panel alike.
  - `BrowseCategoriesPanel` and `RoutePreviewPanel` paint nothing there. They filled their box with the background colour wherever they were, so on a glass panel each was an opaque block from under the grip's row down; the glass now shows through them. On a solid panel they look as they did, its fill being the same colour, and their text keeps the theme's foreground. On their own they keep the background colour.
  - Their fill moves from `bg-background` to owned CSS (`kozmos-browse-categories`, `kozmos-route-preview`), which reads the property. A background class passed in `className` still outranks it.

  On a glass surface, text that is muted elsewhere takes the foreground colour, so it reads at 4.5:1 over any map; the glass itself is unchanged (decision 48).
  - `.kozmos-surface-glass` sets `--kozmos-surface-muted-foreground` to the foreground colour, and `.kozmos-surface-solid` resets it. Owned CSS reads it, falling back to the muted colour: the `kozmos-muted-text` class, and `POIDetailPanel`'s `sheet` presentation.
  - The muted text a hosted part draws straight on the panel reads it: `RoutePreviewPanel`'s "To", its count of options and its status text; the empty states of `BrowseCategoriesPanel` and `POIResultList`; and, in `POIDetailPanel`'s `sheet` presentation, the level and hours line, the prices, the summaries' notes, the section headings and the gallery's position. Muted over a saturated map, they read as low as 3.6:1; they now read 9.7:1 or more, in light and dark.
  - Muted text on a card of its own keeps its colour: a result, a route option, and a `panel` or `inline` details card.

- 1213847: `MapControlsGroup` passes the presses in the gaps between its controls to the map (decision 46). Its box took every press in the 8px between the zoom pair, the compass and the location control; now only the controls take presses, so a press or a drag in a gap reaches the map beneath, as one in a `MapOverlay`'s room does. While the overlay holding the group overflows, a press in a gap is the overlay's, whose scroll box takes its room then, so a wheel there still scrolls it in every engine. The group keeps its role, its name and its controls' tab order. Its box is the owned `kozmos-map-controls-group` rule, and no longer carries `pointer-events-auto`.
- ddfcc5a: `AdaptiveMapShell`'s panel carries `data-slot="map-shell-panel"`, a short, stable name for a check that reads the panel's markup. Axe cuts every attribute value in a node's snippet to 20 characters once its opening tag passes 300, and the website's exclusion for the known nested-landmark finding (GAP-17), which read the panel's class, stopped matching when the panel's style grew. It now reads this attribute.
- b46112a: `@kozmos-ds/icons` gains `Walking`, the walking figure the SDK's position status draws beside "Walking improves accuracy", sourced from Pointr's Figma. It is a solid mark squared on the icon grid, 20 of 24 tall, in `currentColor`. `bluetooth-off`, the pill's No Bluetooth mark, joins the icon name list, so `getIconComponent("bluetooth-off")` and `<Icon name="bluetooth-off" />` reach Pointr's outline. React 0.6.0 requires icons 0.5.0; they are released together.

  ```tsx
  import { MapStatusPill } from "@kozmos-ds/react";
  import { BluetoothOff, Walking } from "@kozmos-ds/icons";

  <MapStatusPill tone="progress" icon={<Walking />}>
    Walking improves accuracy
  </MapStatusPill>;
  <MapStatusPill tone="danger" icon={<BluetoothOff />}>
    No Bluetooth
  </MapStatusPill>;
  ```

  Dedicated Turn Back and Wayfinding Unavailable marks are not included. Their examples explicitly pass `icon={null}` to omit a mark. A `warning` or `danger` pill without an `icon` prop still draws its default warning triangle; pass `icon={null}` when no fallback mark is appropriate.

- df63812: `MultiSelect` hands focus to its field when every choice is cleared. The clear button goes with the choices it clears, and a keyboard that pressed it lost focus to the page. The field now takes focus, with its list closed, since the visitor cleared the choice and did not ask for options; typing or an arrow key opens it, as before. Removing one chip still hands focus to the field, and a disabled or read-only field still offers nothing to clear.
- e141c57: `POIResultList` brings the selected result into view when its results arrive after the selection. A pin's tap that came before the search answered, or a batch of results without the selected place, used to mark the selection as shown with nothing to show, and the result then stayed out of sight when it arrived. Each selection is now brought in once, when its result is in `items`; a new array of the same results still moves nothing, and a result that leaves the list and comes back is brought in again. A selection made while `scrollSelectedIntoView` is off is brought in when it is turned back on.
- ddfcc5a: `RouteOptionCard`: the chosen option's 5% tint of the theme now sits on the option's own background colour (the owned `kozmos-route-option` class). It was `bg-primary/5` over nothing, so on a glass sheet the map showed through the chosen option while the others stood opaque; it now reads like them. On a solid sheet it looks as it did, the tint over the sheet's background colour being the same mix.
- 9c955d1: `RoutePreviewPanel` keeps the grip's clearance at the top of `AdaptiveMapShell`'s panel, as the category browser and the details card do (decision 14). As the panel's content, its destination row tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Under a sheet's grip and in a side panel, "To" sat 33px from the panel's top and 17px from its side; it now sits 21px down under a grip and 17px down in a side panel, as it already did in a single-detent sheet. The options under the row keep their 16px, and on its own it is unchanged.

  Placed under a row of your own inside the panel, the preview is not at the panel's top: set both custom properties to `0px` on it, or move that row into `panelHeader`.

- d6df00f: `SegmentedControl` can hold an empty choice: `value={null}` is nothing chosen. `onValueChange` still reports a choice taken back as `undefined`, so a product that holds the choice passes `value={choice ?? null}`; the segment it took back is no longer left pressed, and Radix no longer warns about the control switching between controlled and uncontrolled. `value={undefined}`, or no `value` at all, leaves the choice to the control, exactly as in 0.5.0, so a wrapper that forwards its own optional `value` keeps working when it is used without one.
- Updated dependencies [0956f93]
- Updated dependencies [8f51ba1]
- Updated dependencies [f028338]
- Updated dependencies [6ce1001]
- Updated dependencies [b46112a]
- Updated dependencies [a957142]
- Updated dependencies [a6f288d]
  - @kozmos-ds/tokens@0.2.0
  - @kozmos-ds/product-contracts@0.5.0
  - @kozmos-ds/icons@0.5.0

## 0.5.0

### Minor Changes

- 415e486: The assistant's parts can be found, named and told apart.

  **`AICompanionPanel` is a region named by its title**, and the title is a heading: an `h2` by
  default, set with `titleLevel` (2 to 6) to fit the page's outline. It was a `p`. The panel moves
  focus into itself when it mounts and hands it back when it closes; `onOpenAutoFocus` and
  `onCloseAutoFocus` let a product send focus elsewhere, or keep it where it is with
  `event.preventDefault()`.

  **`AIMessage` and `UserMessage` say who spoke.** Each begins with a visually hidden "Assistant said"
  or "You said", so a screen reader reading the log can tell the turns apart. The defaults are
  English; pass a translated `speakerLabel`.

  **`AIInputBar`** draws its focus ring around the whole bar while the field has focus, draws a
  disabled field as disabled, takes `inputRef` to reach the field, and its send button is 44px.

- 415e486: A one-of-several choice is a radio group, two small marks become targets you can hit, a notice can
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

- 415e486: The levels say where the results are.

  `FloorPresentation` gains `resultCount` (in the iOS and Android contracts too), and `FloorSelector`
  marks each level that holds results and says so in the level's name, worded by
  `resultCountLabel`. By default that is "1 result" or "3 results"; a count of zero or less is neither
  drawn nor said.

  ```tsx
  <FloorSelector
    floors={floors.map((floor) => ({
      ...floor,
      resultCount: counts[floor.id],
    }))}
    resultCountLabel={(count) => t("floors.results", { count })}
  />
  ```

- 415e486: The map's controls take the product's words, the location control shows its mode, and step-free
  has a control of its own.

  **Every label is the product's.** `MapControlsGroup` gains `zoomInLabel`, `zoomOutLabel` and
  `compassResetLabel` (`locationLabel` already existed), `UserLocationMarker` gains `label`, and
  `FloorSelector` gains `previousFloorLabel` and `nextFloorLabel`. The defaults stay English: a design
  system has no locale of its own, and the product now has somewhere to put one.

  **The location control draws each mode.** A mark per `locationState` — `off`, `locating`,
  `following`, `heading`, `permission-denied`, `stale`, `unavailable` — replaceable with
  `locationIcons`. `locationRevealOnChange` shows the mode's label when it changes, and
  `locationLabelPlacement` puts that label `inline` or `stacked`. `@kozmos-ds/icons` gains
  `LocationFollowing` and `LocationHeading`, which the control draws, so this react needs this icons.

  ```tsx
  <MapControlsGroup
    locationState={locationState}
    locationRevealOnChange
    zoomInLabel={t("map.zoomIn")}
    zoomOutLabel={t("map.zoomOut")}
    onStepFreeChange={onRoute ? setStepFree : undefined}
    stepFree={stepFree}
    stepFreeLabel={t("map.stepFree")}
  />
  ```

  **Step-free takes the location control's place on a route.** With `onStepFreeChange` the control
  is a step-free toggle (`stepFree`, `stepFreeLabel`, `stepFreeOnLabel`, `stepFreeOffLabel`,
  `stepFreeIcon`). It is keyed apart from the location control, so assistive technology meets a new
  control rather than the old one changing its name.

  **The marker admits it is elsewhere.** `UserLocationMarker` gains `offFloor` and `offFloorLabel`.
  Off the level in view it is hollow, without its halo, ping or heading cone — shape carries the
  state, not colour alone — where the map page used to hide it and the visitor lost their position.

  **Pins sit on their place right to left.** `LocationPin` anchors to a physical origin, to match its
  physical translate. In Arabic every pin drew one pin-width to the left of the place it marks.

  **The map fills its shell.** `MapView` gains `variant="fill"`: no border, radius or 400px minimum,
  and `role="group"` rather than a second landmark inside `AdaptiveMapShell`'s map region. The
  default, `"framed"`, draws what it always drew. The labels beside map controls keep their gap right
  to left.

- 415e486: `AdaptiveMapShell` learns the chrome it cannot see, stops padding the camera for its controls, and
  gains a header that stays put.

  **`deviceSafeAreaInsets`.** The device's safe areas as a prop, merged with CSS `env()` so the larger
  wins: passing them can only add room. `env()` isn't always the truth — inside a device frame on a
  canvas, or a web view whose host paints its own bar — and the controls ended up under the status bar.

  **`controlsPadCamera`, off by default.** Collision insets are edge bands, so a 44px column of
  controls handed the camera the whole edge it sat on, at every height (120px, measured), and a map
  following the visitor centred itself off to one side. The controls stay in the snapshot's
  `occlusions` with their true bounds, so a product that wants to fit around them still can;
  `controlsPadCamera` brings the old padding back.

  **The controls sit where map apps put them on a sheet.** They were placed opposite the panel — right
  for a docked side panel, wrong for a bottom sheet, which spans the width. On a sheet they now sit at
  the inline end, mirrored right to left.

  **`panelHeader` stays put while the content scrolls.** It is drawn under the grip and above the
  scrolling content, and counted in the detent heights (`PanelDetentMeasures.headerBottom`). Its first
  control keeps 4px under the grip, so the grip's 16px target keeps the spacing WCAG 2.5.8 asks for. A
  sheet fitted to its content now counts its grip as well: it is 16px taller when `content` is offered
  with another detent.

- 61b121d: `AdaptiveMapShell` now tells its panel content how much space it leaves above it, through two custom properties on that content (GAP-083):
  - `--kozmos-panel-inset-top`: the grip's row on a sheet, `1rem` in a side panel, `0px` with no grip or under a `panelHeader`;
  - `--kozmos-panel-clearance-top`: how far the first control must still sit below that — 4px under a grip, which keeps the grip's target clear (WCAG 2.5.8); `0px` otherwise.

  A `POIDetailPanel` hosted there with `presentation="sheet"` pads its header's top to `max(clearance, 16px − inset)` instead of adding 16px to what the panel leaves. Its close button used to sit 33px from the panel's top and 17px from its side; it now sits 17px down in a side panel and 21px down under a sheet's grip. The bordered `panel` and `inline` presentations keep their own padding. Host the card with `presentation="sheet"` in the shell.

- 415e486: A result says more of what it knows, and the search field stops fighting the product.

  **The result card draws the whole contract.** `unitLabel` and `nameLanguage` have been in the
  contract since 0.4.0, and `POIResultCard` drew neither. The unit now leads the location line
  (`Unit 214 · Level 2 · Building A`), and the name carries its own `lang`, so a screen reader reads an
  authored Japanese name in Japanese. `POIResultPresentation` gains `summary`: one generated line,
  already localised, clamped to two lines so a long one can't push the cards below it around.

  **The current result is current, not a button stuck unpressed.** The selected card says
  `aria-current="location"` — the word `LocationPin` uses for the same state — instead of
  `aria-pressed`: a second tap never released the selection, so "not pressed" described a toggle that
  was never there. A test that queries `{ pressed: true }` should query `{ current: "location" }`.

  **It moves between its states on owned rules.** Selecting a card transitions its border,
  background and shadow; its action row grows open and leaves when the selection does. It has no
  closing move on purpose: collapsed actions must not stay tabbable. Both honour reduced motion.

  **The list carries its notice, and speaks the product's words.** `POIResultList` gains a `header`
  slot inside its own region, so a notice that qualifies the results goes when they go. A grouped list
  now passes its two words on — `showMoreLabel` and `hideLabel`, set once on the list — and a group's
  `expanded` state can live in the product through `onGroupExpandedChange`, so it survives the panel
  closing.

  ```tsx
  <POIResultList
    header={allergenNotice}
    showMoreLabel={(hidden) => t("results.showMore", { count: hidden })}
    hideLabel={t("results.hide")}
    onGroupExpandedChange={(groupId, expanded) =>
      setExpanded(groupId, expanded)
    }
  />
  ```

  **The selected result comes into view.** `scrollSelectedIntoView` is on by default: a result
  selected from the map scrolls into the list, even at a sheet detent where a finger can't scroll. A
  product that scrolled the panel itself should pass `false`.

  **The browser's own clear is gone.** A `type="search"` field drew a second, unlabelled × in
  Chrome, Edge and Safari that emptied the field behind the product's back: the DOM cleared, the
  product's state didn't, and the next render put the text back. `SearchBar`, `Search` and the inputs
  built on `.kozmos-input` hide it; the component's own clear, which calls `onClear`, stays.

  **A search response says what it was limited to.** `SearchResponsePresentation` gains
  `appliedScope`, a `SearchScopePresentation` with `kind` (`SearchScopeKind`: `"building"` or
  `"area"`), `id`, `label` and an optional `queryWithoutScope`. Absent means the whole venue. The React
  parts draw nothing from it yet; the iOS and Android contracts carry the same fields.

### Patch Changes

- 273e562: `FloorSelector`'s compact stepper now calls its two buttons "Floor up" and "Floor down", as iOS and Android do. They were "Previous floor" and "Next floor". "Floor up" is the up chevron, which steps to the previous level in `floors`, so list the levels top first and up goes up.

  This is a behaviour change products may match on in their own tests: a query such as `getByRole("button", { name: "Previous floor" })` no longer finds the button, so use the new names. A product that passes `previousFloorLabel` and `nextFloorLabel` keeps its own words.

- ded56bc: `MapOverlay` no longer cuts what floats in it (GAP-082). Its content scrolls when it is taller than the map leaves room for, and that scroll box clipped at the content's own edges, so a `MapControlButton`'s or `FloorSelector`'s floating shadow was cut off on every side, and with it the 1px ring that draws a map control's edge. The scroll box now keeps the floating elevation's reach clear around its content (4px above, 8px at each side, 12px below, read from `--semantics-elevation-floating` when the package is built) and takes the same space back with negative margins, so nothing moves: content sits where it did, and controls in an overlay draw as the same controls placed by hand, focus rings included. The only pixels left out are a shadow tail one level (of 255) deep, which Chromium and Firefox draw a little past the blur distance on Linux. While the content scrolls, it shows through that room too, and a press on the room, as on the space between the overlay's items, does not reach the map.
- Updated dependencies [415e486]
- Updated dependencies [415e486]
- Updated dependencies [415e486]
  - @kozmos-ds/product-contracts@0.4.0
  - @kozmos-ds/icons@0.4.0

## 0.4.0

### Minor Changes

- 3e3a6d3: Four things a product could only work around, and the gate that should have
  caught the first of them.

  **The three product-contract files are one contract, and now something checks
  that.** `pnpm contracts:parity:check` compares
  `@kozmos-ds/product-contracts`, `ProductContracts.swift` and
  `ProductContracts.kt` — the set of types, the fields of every shared struct,
  whether a field may be omitted, and the wire values of every enumeration.
  Nothing compared them before. What it found on its first run was ten drifts:
  `POIResultMatch`, `SearchEmptyKind`, `SearchResponsePresentation`,
  `unitLabel`, `nameLanguage` and optional `floorId`/`floorLabel` existed on the
  web alone, so a single-storey venue still had to invent a floor on iOS and
  Android — and `CategoryPresentation.iconUrl`, the taxonomy's own category
  artwork, was web-only too, leaving a native SDK no way to show a category's
  image at all. All ten are fixed here.

  **`Card` takes a `padding`.** It was 24 on every side with no option, so the
  only route to 16 was a caller passing `className="p-4"` — restyling the
  component from outside, and on the web alone, since both native cards
  hard-coded 24 as well (GAP-034). It is set on the card and reaches the header,
  content and footer through context, because a card padded 16 at the top and 24
  at the bottom is the bug, not the fix. On all three platforms.

  **`Alert` no longer interrupts by default.** `role="alert"` was hard-coded
  with no way out. That is an assertive live region, so a static page notice —
  "View only. Only Dashboard admins can change these settings." — was read out
  over whatever the visitor was doing, every time the page opened (GAP-006).
  `live` is `off` by default, which is what SwiftUI and Compose already do:
  neither native Alert announces anything. `live="polite"` is `role="status"`
  and `live="assertive"` is the old behaviour, for a notice that really has just
  appeared.

  **`AlertTitle` has a size, and stops being an `h5`.** It carried no size class
  at all, and the reset makes every heading `font-size: inherit`, so the title
  rendered at the same size as the `text-sm` description below it, separated
  only by weight (GAP-007). It is `text-base` now, which is what Compose already
  uses. It is also a `<p>` by default, as it is on both native platforms — an
  alert's title labels a notice, it does not open a section of the document, and
  a hard-coded `h5` after a page's `h2` sections is a skipped level. Pass
  `level={3}` where the alert really is a region of the page.

  **`EmptyState` takes a `size`, and a slot can ask for it.** Measured inside
  `POIResultList`: the same no-result content came to 258px, of which 48 was the
  slot's own padding and 64 this component's. The slot stopped padding a
  component last release; `size="compact"` takes the rest, bringing it to about
  128 (GAP-009). A product does not have to know — the empty slot draws the box,
  so it asks for compact itself, and an explicit `size` still wins. On all three
  platforms.

- c7d802f: Six places that read wrongly in another language.

  `Text` aligns from the **start**, not the left, and `align` gains `start` and
  `end` beside the physical `left`. The default is what matters: almost nothing
  passes `align`, so whatever it defaults to is what an Arabic interface gets.
  `left` stays for the rare thing that means LEFT in any direction.

  `POIResultCard`'s row aligns from the start too.

  `SearchBar` takes `clearLabel` — its clear button said "Clear search" in
  English whatever the interface language — and uses logical margins, so the
  search icon sits before the field rather than always to its left.

  `AdaptiveMapShell` takes `panelHandleLabel`. The sheet handle is a slider, and
  "Panel height" was all a screen reader had to go on.

  `NavigationItem` wraps a rail label over two lines instead of truncating it:
  "Overvi…" loses the word where two lines shorten nothing. A side row stays
  truncated, because it is wide enough that one line is the right compromise.

  `CategoryTile` no longer breaks a CJK name mid-word. `line-clamp` alone splits
  レストラン across two lines as two words that do not exist.

- 4773abd: A thumbs scale, a character count, and the state `Rating` was actually in.

  **`Rating` takes a `variant`.** `thumbs` is the two-option form the Express
  Maps prompt asks on — "Are you enjoying this?" is a yes or a no, not a mark
  out of five. Stars are an ordinal scale, so choosing four fills four; thumbs
  are a choice between two, so exactly the one chosen fills. The value stays a
  number either way — **0 unanswered, 1 down, 2 up** — so a product stores one
  shape whichever scale it asks on, and choosing what is already chosen clears
  it. On all three platforms.

  **And four things that were wrong with it underneath.** Measured in a browser
  rather than read off the source:
  - `aria-checked` was taken from the _hover_ value, so a pointer passing over
    the fifth star made a screen reader announce five when the answer was three.
  - There were **five tab stops**. A radiogroup is one, with the arrows moving
    inside it. There were no arrow keys at all, so a keyboard visitor could
    reach the scale and not use it. Left and right now follow the writing
    direction, so the first option is still first in Arabic.
  - `readOnly` set `disabled` on every option, which drops the whole rating out
    of the tab order: a rating meant only to be read could not be reached. It is
    one `role="img"` with the rating as its label.
  - `"Rating"` and `"Rate 3 out of 5 stars"` were fixed English — and the second
    says "stars" whatever the scale is. `label`, `itemLabel` and `valueLabel`
    are the caller's now.

  On iOS every option was an `Image` with `.onTapGesture`: VoiceOver could not
  activate it and announced nothing, so the rating existed only for people using
  their eyes and a finger. On Compose every star carried
  `contentDescription = null` and a bare `clickable`, with the same result for
  TalkBack. Both are real controls now, with `Role.RadioButton` on Compose.

  **Android's star was a different colour.** `primitivesColorsEmotionalAlert600`
  — #f9a707 against iOS's and the web's #d97706, and #fbc459 against #fbbf24 in
  dark mode. It reads `semanticsDataYellow` now, like the other two.

  **`Input` and `Textarea` take a `count`.** `limit` is a **soft** maximum,
  deliberately not `maxLength`: a browser refuses the keystroke past
  `maxLength`, so someone pasting a long answer loses the end of it in silence
  instead of being told it is too long. `minimum` only applies once something
  has been typed — an empty field is unanswered, not wrong. The count is never
  in the `role="alert"` element while it is only a count, because it changes on
  every keystroke and a screen reader would read the number back after each
  letter; it joins the message there only when there is a reason to speak. It
  counts what a person sees rather than UTF-16 units, so an emoji is one
  character.

  **`FeedbackCard` passes both through**, and loses three things of its own: the
  success mark was `bg-green-100` / `dark:bg-green-900/30`, which compile to a
  fixed `rgb(220 252 231)` — a product that re-themed Kozmos got Tailwind green
  there and nowhere else — and the mark itself was the emoji 🎉, which a screen
  reader reads as "party popper". It takes the success role and a real icon.
  `submitLabel`, `submittingLabel` and `commentPlaceholder` were fixed English
  inside the component; the card's heading level is the caller's.

- f4dc59a: Show a result's attributes: access restrictions, dietary, accessibility and
  services.

  Four meanings and one shape — a short localized label with an optional icon —
  so they share `poi.services` rather than gaining three more lists.
  `POIAttributeKind` says which a chip is, so a card can order, tone or filter
  them:

  ```tsx
  services: [
    { id: "1", label: "Vegan", kind: "dietary" },
    { id: "2", label: "Step-free", kind: "accessibility" },
    { id: "3", label: "Takeaway" },
  ];
  ```

  A restriction is drawn apart from the rest. "Staff only" is not a feature like
  "Vegan": it is the reason a visitor cannot go, and a row of identical grey
  chips would bury it among the things they can have. It comes first, in the
  warning tone, and is folded in from `accessRestrictionsLabel` — which is its
  own field rather than a service.

  Android and iOS gain the same `kind`, and also `iconUrl` and
  `iconMonochrome`, which the web contract had and they did not.

- 942d7cd: Four result contracts MAP-474 needs, on all three platforms.

  **Opening and closing soon.** `POIAvailability` gains `openingSoon` and
  `closingSoon`, drawn in a third tone rather than folded into open or closed:
  "closing soon" is a reason to hurry or pick somewhere else, and drawing it as
  plain open is the difference between arriving and arriving too late. Where the
  boundary sits is the product's call.

  **Why a result is in the list.** `POIResultMatch` is `exact`, `alternative` or
  `unconfirmed`, so the further lists MAP-474 shows under their own headings come
  from data rather than from the order a product happened to build. A result also
  carries `unitLabel` for venues with units, and `nameLanguage` so an authored
  name can be announced in the language it was written in.

  **What an empty search means.** `SearchResponsePresentation` carries an
  `emptyKind` — no match, filtered out, or nothing mapped — plus `emptiedBy`,
  the filter that emptied the list, and `languageFallback` when results came back
  in another language. An empty list is not one situation, and "nothing found"
  leaves the visitor to guess what to undo.

  **Venues without levels.** `floorId` and `floorLabel` are optional on both
  `POIPresentation` and `POIResultPresentation`. A single-storey venue where
  every result reads "Ground Floor" is noise; the card now draws what is left.

  Android and iOS carry all four. They did not at first: when this was written
  only the availability change had crossed over, and `POIResultMatch`,
  `SearchResponsePresentation`, `SearchEmptyKind`, `unitLabel`, `nameLanguage`
  and the optional `floorId`/`floorLabel` existed on the web alone — so a
  single-storey venue still had to invent a floor on iOS and Android, which is
  the exact noise this was meant to remove. `pnpm contracts:parity:check` now
  compares the three files field by field, and it is what found this.

- b9467b1: Six pieces of search polish, four of them defects a product would have had to
  work around.

  **A search row is the component's, not the caller's.** `CategoryField` gains a
  `trailing` slot, the one `SearchBar` already has, because the field takes the
  search bar's place when a category is chosen and the row around it does not
  change. Without it the field shrinks to its content in a caller's flex row and
  will not grow: Storybook's own example knew to pass `flex-1` through
  `className`, and an integrator composing the same pair had no way to know. The
  slot draws a gapped row, so the assistant button beside Filters keeps the row's
  spacing rather than touching it — which is what both components did before.

  **One separator for a place.** `poiLocationLabel` joins floor and building the
  way Kotlin and Swift already join them on the model, with `·`. The web had no
  shared derivation, so `POIResultCard` and `POIDetailPanel` each built it by
  hand and the panel had drifted to `/`: the same place, described two ways, in
  one product. It is exported, so a product composing its own row joins them
  identically instead of inventing a third separator.

  **The empty slot pads a string and never a component.** `POIResultList` added
  `p-6` whatever it held. A string needs it. A component pads itself, and an
  `EmptyState` adds `p-8` on top, which turned a one-line "no results" into a
  222px box. The slot decides on what it is given rather than on a flag, because
  nothing was passing a flag and nothing would have.

  **`EmptyState` centres its own text.** `Text` aligns from the start now, so a
  block that centres itself does not centre the text inside it; a description
  that wrapped to two lines had its second line against the leading edge.

  **`Container` takes an `inset`.** `lg:px-8` reads the window, so a 390px side
  panel in a 1280px window took the widest step — the same content with 32px of
  padding each side on a desktop and 16px on a phone. `inset="panel"` holds 16
  whatever the window is doing. `window` stays the default.

  **A side panel gets the space the sheet's grip makes.** A sheet's content
  starts below its grip; a side panel has no grip and nothing stood in for one,
  so the search field sat a pixel under the panel's top edge.

### Patch Changes

- Updated dependencies [3e3a6d3]
- Updated dependencies [f4dc59a]
- Updated dependencies [942d7cd]
  - @kozmos-ds/product-contracts@0.3.0

## 0.3.0

### Minor Changes

- cc3dc32: Add the AI Companion parts, and let a selected result offer actions.

  **The assistant surface.** `AICompanionPanel`, `AIMessageList`, `AIMessage`,
  `UserMessage`, `ActionCard` and `AIInputBar` — the six parts MAP-474 Story 5
  needs. Built to the behaviours rather than to a screen:

  ```tsx
  <AICompanionPanel onClose={close}>
    <AIMessageList>
      <AIMessage>What are you looking for?</AIMessage>
      <UserMessage>Somewhere quiet to work.</UserMessage>
      <AIMessage status="streaming">Looking through this building…</AIMessage>
      <AIMessage actionCard={<ActionCard title="2 results">{rows}</ActionCard>}>
        The closest one is on the second floor.
      </AIMessage>
    </AIMessageList>
    <AIInputBar value={value} onValueChange={setValue} onSubmit={ask} />
  </AICompanionPanel>
  ```

  `AIMessageList` is a polite `role="log"` that follows a reply as it grows, not
  only as turns arrive. `AIMessage` streams its acknowledgement beside the dots,
  because Story 10 counts that as the first visible response, and draws a
  timed-out turn rather than falling silent. `AIInputBar` never emits an empty or
  whitespace-only question and hands over trimmed text. `AICompanionPanel` closes
  on Escape and works with no close button at all, which Story 18 allows.

  No new icon was needed: `Stars01` and `Send01` were already in the package.

  **A notice that is one line until asked.** `Notice` carries the Story 14
  dietary warning above AI-assisted results, where the full legal wording ran to
  four lines — 114px above the results that are the answer.

  ```tsx
  <Notice summary="AI results may be incomplete. Check allergens with the venue.">
    These results are AI-assisted and may be incomplete or out of date…
  </Notice>
  ```

  It is not `Alert` with a flag: an Accordion inside an Alert drew its own
  divider through the middle and barely shrank. Collapsed detail is hidden by the
  `hidden` attribute rather than a class, so it stays hidden when the stylesheet
  does not load and stays out of the accessibility tree either way. A `critical`
  tone with `collapsible={false}` and an `action` slot carries the emergency
  notice — help first, not a result list, so nothing is behind a "More" link.

  **A selected result offers what the product gave it.** `POIResultPresentation`
  gains `actions` and `badge`; `POIResultCard` gains `onAction`, and
  `POIResultList` forwards it.

  ```tsx
  result={{
    selected: true,
    actions: [
      { action: "navigate", label: "Go", primary: true },
      { action: "details", label: "Details" },
      { action: "bookmark", label: "Book" },
    ],
  }}
  ```

  The action row is a sibling of the select button, never inside it: a button
  within a button is invalid, and the browser closes the outer one. `featured`
  stays a boolean — it is set in the CMS and the map marker draws a featured POI
  with its logo — while `badge` carries "Alternative", "Similar", "Close by" in
  the same amber tab, since the label distinguishes them rather than the colour.

  `POIResultAction` is `POIAction | "details"`, kept separate so a detail panel's
  exhaustive maps never have to handle opening themselves.

  **One venue, many branches.** `POIResultGroup` shows one representative and
  folds the rest behind a count of what is HIDDEN — an airport has five Starbucks
  and a visitor asking for coffee wants one row, not five.

  ```tsx
  <POIResultGroup
    items={branches}
    onSelect={select}
    label="Starbucks, 9 results"
  />
  // collapsed: one row + "Show 8 more"   expanded: nine rows + "Hide"
  ```

  Which branch represents the group is the product's choice — nearest by walking
  distance when there is a blue dot, otherwise the current level — so the group
  takes them in the order it should show them and never reorders.

  `POIResultCard` gains `appearance="card" | "row"` for this: a member draws no
  border of its own, because nine bordered cards inside one bordered box reads as
  a mistake, and the container separates them with dividers instead. Nothing in
  the group is specific to a brand; a group is a representative and a remainder,
  as true of "other floors" as of Starbucks.

- 558344b: Take the taxonomy's eight quick-access symbols out of the icon set.

  `TaxonomyAmenitySpaceDesk`, `TaxonomyEntranceExit`, `TaxonomyFoodBeverageSpace`,
  `TaxonomyParkingSpace`, `TaxonomyRetailSpace`, `TaxonomySecuritySpace`,
  `TaxonomyServiceSpaceOffice` and `TaxonomyTransportationSpaceBoardingGate` are
  gone, with their `taxonomy-*` registry names and their Code Connect
  connections. 1183 icons become 1175.

  They were never the design system's to ship. A category symbol belongs to the
  venue's taxonomy, which Pointr publishes and versions on its own cadence;
  an icon here is drawn once and versioned with the components. Carrying both
  meant eight PNGs that went stale the moment a taxonomy release landed.

  Read the artwork from the taxonomy instead. Every quick-access category carries
  its own `iconUrl`, and the panel's `renderIcon` takes whatever you give it:

  ```tsx
  <BrowseCategoriesPanel
    renderIcon={(category) => <img src={category.iconUrl} alt="" aria-hidden />}
  />
  ```

  `CategoryPresentation` now carries `iconUrl` for exactly this - the venue's own
  artwork, beside `iconName` for a design system glyph. `BrowseCategoriesPanel`'s
  `AviationQuickAccess` story reads `quick-access/aviation_customer.json` at
  10.12.0.

  The `Accessibility` and `Utensils` glyphs added in 0.2.0 are unaffected: they
  are drawn here and stay.

### Patch Changes

- Updated dependencies [cc3dc32]
- Updated dependencies [558344b]
  - @kozmos-ds/product-contracts@0.2.0
  - @kozmos-ds/icons@0.3.0

## 0.2.0

### Minor Changes

- Every icon name now draws the Pointr Icon Library's own outline.

  `@kozmos-ds/icons` carries all 1,175 of them and no longer depends on
  lucide-react, which 43 of the 64 names still resolved to: the same concept in a
  different hand from the one Figma shows. Nothing maps onto a near-miss any
  more, and a consumer installs this package and React alone.

  Two glyphs the Pointr library does not have are drawn from elsewhere and
  carried here. `Accessibility` is the Accessible Icon Project's mark, which its
  makers put in the public domain. `Utensils` is lucide's outline under ISC, the
  artwork alone rather than a dependency.

  `@kozmos-ds/react` no longer depends on lucide-react either. The names it uses
  are unchanged, so no import needs editing; what changes is which outline each
  one draws.

### Patch Changes

- Updated dependencies
  - @kozmos-ds/icons@0.2.0

## 0.1.0

### Minor Changes

- a06ca47: Add optional platform-neutral POI detail sections, summaries, opening hours,
  descriptions, tags and supplementary book/call capabilities. Keep the existing
  required POI action labels unchanged. Update the detail anatomy for wrapping
  titles, optional logos, controlled header save actions and reachable actions.
  Add labelled media-error fallback and remove forced smooth gallery movement.
- eb68e53: Support decorative POI asset icons, generic highlighted properties, semantic metadata tones and price scales. Demonstrate taxonomy-driven attribute labels/icons/order with a pinned Pointr 10.12.0 dictionary outside the public component runtime.

### Patch Changes

- 0cf155f: `AISearchButton`'s gradient ring is a band two and a half wide all the way
  round. It was drawn as a 43 disc stacked inside a 48 circle, and Chromium
  painted the disc's rounded rect about 0.44px right and down of the ring's — at
  every device pixel ratio, animated or frozen — so the band ran 1.9 on one side
  and 3.1 on the other. WebKit and Firefox drew it evenly, which is why it looked
  like nothing, and the only check on it read `offsetWidth` and `offsetLeft` and
  called the difference the band.

  The band is cut out of the ring itself now, by a radial mask, so nothing else
  decides where it ends; the disc behind it moves to inset 2, inside the band, and
  is painted first. Measured in the paint on 36 rays at eight device pixels to the
  CSS pixel: a spread of 0.24 in Chromium and Firefox and 0.21 in WebKit, against
  1.33 before.

  No API change: the button is the same 48 circle with the same gradient and the
  same turn.

- 7775c73: Button keeps 8px between its icon and its label, as Figma's Button and iOS's
  always have (GAP-56). `.kozmos-button` takes the spacing scale's 100 as a gap,
  and the loading spinner loses its own `mr-2`, which spaced it on one side only:
  in right-to-left the spinner touched the label. An icon passed to a Button no
  longer needs `mr-2`; one that keeps it sits 16px away, so remove it.
- 71e31bd: Keep scoped preflight at zero specificity so it does not override consumer
  heading styles. Move Text and Heading to component-owned typography recipes,
  preserving their public type scale and props without requiring native CSS scope.
- 1edef7b: The package declares the browsers it actually works in: Chrome and Edge 118,
  Safari and iOS 17.4, Firefox 128, Android WebView 118. It declared nothing
  before, which promised everything.

  The floor is `@scope`, which fences the component styles off from a host page.
  A browser below those versions discards the whole block rather than ignoring
  the rule, and 955 of the stylesheet's 1,227 rules live inside one. What that
  costs is not all or nothing: measured across 43 elements, 30 render identically
  without `@scope` and 13 do not — the 31 components carrying their own CSS are
  unaffected, the 73 styled by utilities lose their layout and colour.

  Declaring it also narrows what autoprefixer emits: `-moz-user-select` and
  `-moz-column-gap` go, both unprefixed in Firefox long before 128. Nothing else
  in the stylesheet changes, and it is 1,189 bytes smaller.

  Lowering the floor is the work of moving the remaining components to owned CSS.
  Raising one would be a breaking change, so it starts where the code is.

- 42fbe70: Emotion text reads on every neutral surface. `Semantics.Emotion.*.Text` was
  measured on white alone, and four of six failed 4.5:1 on the greys a panel,
  card or sheet paints (background/50 and /100): success and alert move from 800
  to 900, informative from 700 to 800, danger from 600 to 700; themed and neutral
  already passed. The contrast contract now holds every emotion's text on
  background/0, /50 and /100 in both themes.

  React draws status text and glyphs with the new Tailwind `*-text` roles
  (`text-success-text`, `text-warning-text`, `text-info-text`,
  `text-destructive-text`), which read those tokens; `success`, `warning`, `info`
  and `destructive` stay the fills, edges and rings they were.

- de7a409: The map sheet's drag handle is a 16px row again, with a 40 × 4 grip (GAP-38).
  Its three declarations read layout tokens straight — `height:
var(--primitives-layout-spacing-200)` — and those tokens are bare numbers
  (`16`, `6`, `40`). A bare number is not a length, so every browser dropped all
  three: the handle rendered 4px tall, the grip 0px wide, in every engine since
  `AdaptiveMapShell` shipped. Each now converts with `calc(var(…) * 1px)`, the
  conversion the owned blur and slide rules already make, and iOS's grabber row
  and Android's `SheetHandle` already matched.

  `pnpm tokens:unitless:check` is new and fails on any owned length that reads a
  bare-number token without converting it.

- 3bedd72: AdaptiveMapShell's bottom sheet eases only between detents — after a new
  detent or a drag's release — and takes its first placement and a change of
  the host's size at once; it no longer flies in from the shell's top when it
  mounts. A panel with no room is hidden again (its flex display had outranked
  the `hidden` attribute), and map controls a bottom sheet leaves no band for
  are hidden rather than drawn under the sheet, where a keyboard or a screen
  reader still reached them; they no longer pad the camera then.
- 1d4e323: Use the shared 16px control radius throughout POI detail surfaces, chips and
  gallery media. IconButton now inherits Button's control radius instead of
  forcing a circular pill. Edge-attached POI sheets retain square bottom corners.
- c7c35d6: Synchronize the media gallery's controlled/default index, keyboard and native
  scroll position without scrolling ancestor panels. Preserve selection through
  resize and RTL changes, clamp stale indices, localize the controls group, and
  give the gallery component-owned CSS. Reset detail scroll when the POI changes
  and omit failed logos until their source changes.
  Reflow detail summary cells before normal words fragment on narrow hosts.
- ddb2656: Align POI navigation typography/icon sizes and compact informational chips with
  the supplied SDK measurements. Reuse Pointr action glyphs and show controlled
  save selection with a themed fill and outline icon. Detail group items now
  accept the existing optional service iconName field; unknown icons preserve text.
- ad1a23b: Keep POI action buttons on one horizontally scrollable row. Add a localizable action-group name, keyboard scrolling and visible focus, while preserving native button tab navigation and resetting scroll on POI changes.
- a9e9cb3: Compose POI summary facts with the shared MetaStrip instead of a wrapping
  duplicate. Keep facts on one keyboard-scrollable row and align icon/text groups
  and primary-action text. MetaStrip now owns its CSS and allows its minimum 64px
  height to grow with content instead of clipping enlarged text.
- 95ccf34: Cap POI highlighted metadata at three priority-ordered items and share the available width equally. Reflow labels/details within cells instead of scrolling the strip; keep the generic MetaStrip behavior unchanged.
- a03d3fd: The ES build ships one file per module, so an app's bundler keeps only what it
  imports. Importing `Button` alone cost an app 48.7 KB gzip of Kozmos code,
  nearly the whole library, because the build was one file its bundler could not
  trim; it now costs 1.1 KB, and the heaviest single component, POIDetailPanel,
  6.2 KB. Import paths do not change, and `require()` still gets one UMD file.
- 550b561: Every animation that loops now rests when the visitor has asked for less
  motion, and by either route (GAP-50). `Skeleton`'s pulse read neither the
  preference nor the design config; the spinner and the assistant's ring read the
  preference only. One owned rule governs all three, last in the owned block
  because they are all a single class and source order is what decides.

  The design config's `motion: reduced` reaches them too. It scales
  `--semantics-motion-duration-scale` to 0.001, which turns a transition into a
  cut — and a one-second spin into a strobe, so an animation that loops has to be
  told to stop rather than scaled. `DesignConfigProvider` marks its scope
  `data-kozmos-motion="reduced"` and the rules read the mark.

  On the natives the same: SwiftUI's skeleton holds its sheen still under
  `accessibilityReduceMotion`, and Compose's under the system's animation scale,
  as the spinner and the ring already did on both.

  `ToggleButton` keeps 8 between an icon and its label, and `Tag` 4 (GAP-75).
  `ToggleButton` is a Radix Toggle styled on its own, so `Button`'s fix left it at
  zero while SwiftUI and Compose had been drawing 8 all along; `Tag` takes
  arbitrary children on React alone, where an icon beside its text touched, and 4
  is the spacing SwiftUI's `Tag` uses. `Chip` is unchanged: its 6 is `Chip/gap`,
  bound to `Layout/spacing/75` in Figma.

- b9dd0d6: Keep Navbar context, navigation and actions available in narrow containers using
  content-driven wrapping. Navbar now has a minimum rather than fixed 64px height;
  hosts must allow it to grow. Add an optional navigation landmark label.

  Allow SearchBar inputs to shrink beside their controls. Make UserLocationMarker
  SVG gradient IDs instance-local and respect reduced-motion preferences for rings.

- 81812c4: `SearchBar` takes a `trailing` slot, and owns the row it makes. The field is as
  wide as its container and always has been, so a caller composing the assistant's
  button beside it got the field on one line and the button on the next, unless
  they happened to know to pass `flex-1` through `containerClassName`. Storybook's
  example knew; the reference site's did not, and neither would an integrator's.

  ```tsx
  <SearchBar placeholder="Search this building" trailing={<AISearchButton />} />
  ```

  The row's rules are owned CSS — `.kozmos-search-row` — not utilities, because
  the utility layer does not reach a browser without `@scope`, and a promise that
  holds only where Tailwind's layer applies is not one. `rowClassName` styles the
  row; `containerClassName` still styles the field inside it.

  The same slot on SwiftUI (`KozmosSearchBar(text:placeholder:) { … }`) and on
  Compose (`trailing = { … }`), where a row never wraps but the one-call form
  should be the same shape on every platform. Vue needs nothing: the adapter
  already bridges a named slot to the React prop of the same name, so
  `<template #trailing>` works.

- 4ef471f: The spinner is one drawing on every platform. It was four: lucide's `Loader2`
  in React, `ProgressView().tint(.blue)` on iOS — a hard-coded blue that ignored
  the theme, at a size the caller could not set — material3's
  `CircularProgressIndicator` on Android, and in Figma an ellipse with
  `dashPattern: [8, 4]`, a dashed ring standing in for motion a static node
  cannot show. No two matched.

  `Spinner` now draws the system's arc: three quarters of a circle of radius 9 in
  the icons' own 24 box, round caps, stroke 2, so its weight scales with its size
  as every Kozmos icon's does, in `currentColor` so it follows the text around it.
  `size` reaches iOS and Android for the first time — 16, 24, 32, 48 — and
  `label` names the wait for assistive technology. `Button`'s loading state draws
  the same arc, as do `KozmosButton` on SwiftUI and Compose.

  The turn now rests under `prefers-reduced-motion` (part of GAP-50), on one
  owned rule, so `Spinner` and a loading `Button` cannot drift apart; the status
  role keeps announcing the wait when the turn stops.

- Updated dependencies [42fbe70]
- Updated dependencies [c5ec97c]
- Updated dependencies [ddb2656]
- Updated dependencies [a06ca47]
- Updated dependencies [eb68e53]
  - @kozmos-ds/tokens@0.1.0
  - @kozmos-ds/icons@0.1.0
  - @kozmos-ds/product-contracts@0.1.0
