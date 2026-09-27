# Embedded React modules: theme and stylesheet ownership

2026-09-17 · local pre-publication implementation on `astra/prepublish-foundations`.
Not published; browser/WebView support policy is still awaiting Olcay's decision.

## Contract

Import `@kozmos-ds/react/style.css` once. Wrap each independent module in the exported
`ThemeProvider`. It renders a layout-transparent `div` (`display: contents`) with
`data-kozmos-root`, `data-theme` and `dir`. The provider must therefore be placed where
a `div` is valid HTML, not directly inside a `select`, `table` or paragraph.

The provider does not change the document element, classes, theme or body styles.
Each provider gets one layout-transparent portal root under its own document's body;
it is removed on unmount, including under React StrictMode. Nested providers are
independent theme boundaries. They inherit direction and explicit token overrides,
but their own theme defaults to `system`, not the parent's preference.

| Input                    | Behavior                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTheme`           | Initial uncontrolled preference: `light`, `dark` or `system` (default).                                                                  |
| `theme`, `onThemeChange` | Controlled preference and requested-change callback. Caller owns persistence.                                                            |
| `storageKey`             | Optional uncontrolled persistence. No implicit key, no storage access during SSR, invalid values ignored, denied reads/writes tolerated. |
| `defaultSystemTheme`     | SSR/first-hydration fallback for `system`; defaults to `light`. Live system preference is applied after mount.                           |
| `dir`                    | CSS and Radix direction; inherits a parent provider or defaults to LTR. Set explicitly for RTL hosts.                                    |
| `tokens`                 | CSS custom-property overrides (`--…` keys); inherited by nested providers and copied to owned portals.                                   |

`useTheme()` returns only `theme`, `resolvedTheme` and `setTheme`; it throws outside
a provider. SSR is deterministic, not flash-free: a stored/system preference can
change colours after hydration. A server-known controlled theme avoids that change.
Storage is per-provider initialization plus local writes, not cross-tab synchronization.
Keep controlled/uncontrolled mode and storage keys stable for a provider's lifetime.

## Overlays

Dialog, Drawer, BottomSheet, Popover, Menu, Select and Tooltip content default to the
closest provider-owned root. Exported DialogPortal, DrawerPortal and MenuPortal use
the same policy. Theme, explicit token overrides and direction update with the owner.
Content waits for the root rather than mounting into body and immediately remounting.

An explicit `portalContainer`/portal `container` overrides this policy. Its DOM ancestry
then owns CSS inheritance; provide a styled Kozmos scope there. `null` deliberately
uses the body and loses automatic theme ownership. Outside a provider, legacy placement
is preserved (body, except inline Tooltip), but the new stylesheet still needs a scope.
For static markup, a `data-kozmos-root`/`data-theme` boundary supplies CSS only; it is
not a React provider and does not configure Radix navigation or automatic destinations.

The body-level destination avoids clipping/transforms on module ancestors, not on
the host's body itself. Custom destination identity should remain stable while open.
Arbitrary inline ancestor styles are not copied: use provider `tokens` for overrides
that must reach overlays. Radix Root `dir` can still explicitly override provider direction.
Toast and MenuSubContent remain inline by default.

**Modality remains document-wide.** Focus trapping, scroll locking and outside-content
hiding retain Radix semantics. This change does not promise independently modal sibling
widgets, Shadow DOM support or isolation from every third-party overlay manager.

## CSS architecture and compatibility gate

**Migration continuation:** `component-owned-css-2026-09-17.md` supersedes the
implementation description below for Input, Textarea, Button, Popover, FieldWrapper
and Label. Their recipes, token foundations and animation definitions no longer
require native scope. The remaining library still does; this is not a completed
cross-browser release. The paragraphs below retain the original foundation design
and the finding that prompted its replacement.

**2026-09-17 follow-up:** the existing green browser suite missed native form
controls. The built Input/Textarea fixture now reproduces scoped-style failures in
the installed WebKit 26.0, including sizing and theme colours. Chromium 145 and
Firefox 146 pass that fixture. See `browser-compatibility-2026-09-17.md` before using
the earlier evidence as a readiness claim. No workaround or support-floor decision
has been implemented; this remains a release blocker.

The React build processes the existing generated token CSS and Tailwind output into
bounded native `@scope` rules. Light values are established at every root; dark values
apply to that root's resolved theme. Dark utility scopes use `:scope` and stop at the
next boundary, so an outer dark module cannot darken a nested light module. Keyframes
and their animation references receive a `kozmos-` namespace. Token definitions and
native generated token artifacts are unchanged.

Scoped selectors include `:scope` specificity to beat ordinary host element resets
and generic utility classes. This is not Shadow DOM: high-specificity host selectors,
`!important`, inherited custom properties and document `rem` sizing remain relevant.
The integration fixture checks real computed host/component styles, not class presence.

The default CSS contains a **local** component reset. The separate exported
`@kozmos-ds/react/reset.css` is the optional global Tailwind preflight. It is never imported
by the JS entry or default stylesheet. Import it only when the application owns the
whole page and wants that reset. Importing `@kozmos-ds/tokens/css/light.css` separately
still applies the token package's documented global behavior; embedded React modules
do not need it.

This implementation requires native `@scope`, including its nested `:scope` behavior.
There is no legacy-browser fallback: an unsupported browser ignores the scoped rules.
MDN currently marks the full feature [Baseline 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@scope).
Current automated Chromium and WebKit checks are evidence for those installed engines,
**not certification of minimum browser versions or Pointr's embedded WebViews**.
Olcay was asked whether to adopt this browser floor; no answer has yet been recorded.
Do not release or declare this support policy approved until that decision and device
matrix are resolved. If older engines are required, select a different isolation
architecture before npm publication, not an untested selector/polyfill workaround.

## Migration

1. Wrap module roots in ThemeProvider; remove document-level theme mutations.
2. Opt into a product-owned storage key if desired; migrate old stored values explicitly.
3. Pass direction and portal-relevant token overrides to the provider.
4. Remove unnecessary per-component portal plumbing; audit deliberate custom targets.
5. Remove reliance on global preflight, or deliberately import the optional reset.
6. Audit standalone entry points, including the private Vue bridge, before adoption.

## Runtime configuration continuation

The subsequent batch consolidates `KozmosTheme` into `DesignConfigProvider`, which
composes the same ThemeProvider boundary instead of mutating CSSOM/document fallbacks.
It inherits a surrounding theme preference by default; explicit `theme`, `defaultTheme`
or theme `storageKey` starts an independent preference. Direction continues to inherit.

`initialConfig` seeds uncontrolled state. `config`/`onConfigChange` supplies controlled
state; omitted fields resolve to defaults, not stale previous props. This changes the
old `KozmosTheme config` one-shot initialization behavior: migrate to `initialConfig`
when descendants should own updates. Nested `glass` and `accessibility` updates merge
deeply. Untrusted persisted JSON is validated by a whitelist: booleans and enums must
match, roundness is clamped to 0–2 and glass numeric controls to 0–100; non-finite or
invalid inputs retain valid fallback values. Computed opacity is capped at 1.

Persistence has no default key. An explicit `persistKey` restores after hydration;
saved values override initial defaults only where valid. Persistence never writes
before restoration and failures are nonfatal. Controlled configuration ignores it.
Keep controlled/uncontrolled mode and keys stable over a mounted provider's lifetime.
`resetConfig` restores library defaults, not the initial overrides; it does not clear
the independent runtime token overrides. Storage changes in other tabs are not synced.

Declarative `tokens` replace the current override set and follow owned portals,
including when keys are removed. Primitive shorthand remains compatible; prefer
full `--…` names. The deprecated `injectRuntimeTokens` merges its own override set;
an empty string removes a key. Declarative values take precedence. The internal
`--kozmos-design-id` is reserved for event ownership, not caller customization.

The old fixed noise layer and window-level pointer listener are gone. Noise is a
deterministic, low-alpha SVG background on glass surfaces only (a CSP must permit
its data image, or set `noise: false`). Each configuration instance owns its surface
filter ID; unused displacement-filter definitions were removed. React `useId` is
preserved without lossy sanitization; independently hydrated roots need distinct
React `identifierPrefix` values, matching server/client. Filter reference existence
and prefixed IDs are exercised in real-browser tests.

Pointer events are delegated through the React owner, including portals, and checked
against the destination's configuration identity. Coordinates are relative to the
actual surface, compensating for ordinary scaling; arbitrary rotated/3D transforms
are not supported by this pointer-effect calculation. No document style or global
pointer state is written. The old dark glass selector now uses the actual nearest
theme scope. Depth and bevel compose rather than one hiding the other. Disabling
glass/reducing transparency removes its texture, noise, bevel and spotlight; reduced
motion removes its magnification/spotlight and scales token-based transitions.

Do not overstate the result: experimental effects are **not** semantic design tokens
or native/Figma visual parity. `preset`/`splay` remain deprecated, non-rendering legacy
fields. `roundness` and `shadow` are deprecated legacy aliases, not controls over
semantic radius/elevation roles. Use token overrides for those roles. This provider
does not automatically subscribe to OS reduced-motion preferences or control every
Framer Motion animation in the component library; a full motion/a11y policy remains
release work. The private Vue bridge still needs a separate adoption audit.

## Evidence

The five initial provider tests failed on the old provider. All seven overlay types
failed automatic provider containment before their correction. The host-style fixture
failed because preflight/utilities restyled unrelated host content. A subsequent probe
found a host `button { border: … }` leaking inward; it failed before specificity was fixed.
Hydration, controlled storage and StrictMode tests are additional passing coverage,
not claimed as independently reproduced old failures.

Build before dist-based checks:

```sh
pnpm --filter @kozmos-ds/react build
pnpm --filter @kozmos-ds/react test
pnpm test:themes
ADAPTIVE_BROWSER=webkit pnpm test:themes
pnpm test:config
ADAPTIVE_BROWSER=webkit pnpm test:config
pnpm test:overlays
ADAPTIVE_BROWSER=webkit pnpm test:overlays
pnpm test:adaptive
ADAPTIVE_BROWSER=webkit pnpm test:adaptive
pnpm packages:install:check
pnpm --filter @kozmos-ds/docs build-storybook
```

The browser fixtures use the built workspace React package and distributed CSS.
Separate tarball checks cover React 18/19 installation, exports, server rendering and
README type-checking; those are not browser interaction tests under both React majors.
The optional reset is checked both as a package export and for its actual global effect.

Measured for the initial scoped-theme batch: 368 React tests in 105 files; 14 adaptive, 21 overlay and 6 named
theme/reset browser checks per engine (Chromium and WebKit); React Storybook build;
React 18/19 tarball installation and 10 README samples. The three known declaration
issues and 62 inert class uses / 40 classes / 27 files remain unchanged. Remote CI,
minimum-version/device certification, full visual/a11y audit and native/live Figma
verification were not run for this batch.

The runtime-configuration continuation adds 11 tests, bringing React to **379 tests
in 106 files**. Six initial regression tests failed on the original provider; a later
test caught an observer callback suppressing inherited theme updates and was fixed.
The dark glass surface browser assertion also failed before its scoped-selector fix.
Five named configuration checks per engine extend the complete browser matrix to
**92 named checks** across Chromium and WebKit. They cover computed surfaces, live
portal updates without remounting, filter references, local pointer coordinates,
disabled effects, token removal and cleanup. React 18/19 tarball checks now type-check
11 README samples. Component contracts, snippets, radius/elevation checks, variant
report freshness, lint and the existing raw/class ratchets pass; React Storybook builds.
Those results do not remove the compatibility, native/device, full accessibility,
product-adapter or release-workflow gates above.
