# Storybook screenshot audit — 2026-09-17

## Decision

**Do not publish to npm or call this production-ready yet.** The six supplied
screenshots exposed real defects, not merely cosmetic differences. Their targeted
regressions are fixed. A stricter, unsuppressed accessibility smoke test now exposes
a separate Select failure. That failure is deliberately still blocking CI.

Work is local on `astra/browser-compatibility` in
`/private/tmp/kozmos-browser-compat.uqPMBD`, continuing `2db8c2c`.
Shared main, the agent's worktrees, MAP-595, native code and Figma are untouched.
No push, merge, credentials, release settings or publication is part of this batch.

## What the screenshots revealed

| Evidence                                              | Root cause                                                                                                                                                | Correction                                                                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Listbox/MultiSelect blue active row, dark description | Description explicitly kept the muted foreground instead of the active foreground. Measured contrast was **1.02:1**. Combobox duplicated the same defect. | Internal `OptionRow` and one owned CSS recipe share state styling across all three controls. Active descriptions inherit the active foreground. |
| Listbox missing accessible name                       | Neither standalone story supplied `aria-label` or `aria-labelledby`.                                                                                      | Meaningful story name and corrected usage documentation. Consumer-owned labels are still required; no meaningless default name conceals misuse. |
| Label “Outline” looks identical                       | Label has no outline API; the story was a duplicate with different text.                                                                                  | Remove misleading story, replace with `WithInput`, demonstrate `htmlFor`/`id`. No invented variant.                                             |
| FileUpload clipped at 320px                           | Fixed-width story child inside padded/centered canvas; file-row grid could also expand to a long filename's intrinsic width.                              | Responsive Storybook host with bounded children; zero-minimum grid columns and shrinkable file rows. No global overflow hiding.                 |
| Dark canvas, white control, black label               | Storybook background paint and component theme were independent; nested provider defaults also disagreed.                                                 | A Light/Dark toolbar controls `DesignConfigProvider` and the token-based canvas together. Disable the misleading background-paint control.      |
| MultiSelect filled with chips                         | Search input had a fixed minimum width; active-row contrast duplicated Listbox.                                                                           | Owned, shrinkable input recipe; shared option row styling; regression includes all four selected chips.                                         |

## Additional defects caught while reproducing

- MultiSelect forwarded accessible naming/descriptions to a wrapper, not its input.
  Combobox could overwrite its own help/error relationship with caller descriptions.
  Both now put names on the control/popup and merge description IDs.
- Read-only MultiSelect could remove values using Backspace and open using arrows.
  Mutating handlers and keyboard paths now respect read-only/disabled state.
- Closing MultiSelect with the toggle could reopen it when input focus returned.
  Focus and the intended next open state are now applied in the correct order.
- Combo/Multi popups did not close when keyboard focus left their control.
- Hovering disabled Listbox options could make them active. MultiSelect keyboard
  navigation now respects the effective disabled options at the selection limit.
- Empty searches rendered a listbox with no options, failing `aria-required-children`.
  Empty feedback is a status, not a fabricated option. `aria-expanded`, controls and
  active descendant describe the real option popup, not the empty-status surface.
- Keyboard navigation could leave the active option outside the scroll viewport.
  Active rows now scroll into view; the built-package test reproduces End navigation.
- FileUpload exposed both a custom button and an invisible focusable file input.
  The visible picker is now one native button, with name, helper/error association,
  native Enter/Space behavior and native disabled behavior. The input is hidden.

## Verification and what the numbers mean

The original reproduction ran before the fixes: seven of eight selection regression
tests failed, the native upload focus test failed, Listbox End scrolling failed, and
the screenshot matrix reproduced naming, contrast, overflow and theme errors.
Adding populated/empty-result coverage then found eighteen further failing matrix
cases (two empty-result widgets and one long-filename widget across six settings).

After fixes:

- `pnpm --filter @kozmos/react test`: **409 tests / 108 files passed**.
- React package build, React lint and docs typecheck passed.
- Production React Storybook build passed (existing dependency/bundle warnings remain).
- `test:storybook-regressions`: **108 cases passed**: six stories × two themes ×
  three viewports × three browser engines. Each case audits the initial and populated
  or empty-result state with WCAG A/AA rules; it also asserts real story loading,
  theme, horizontal bounds and absence of runtime errors.
- Engines: bundled Chromium 145.0.7632.6, Firefox 146.0.1, WebKit 26.0.
  Viewports: 320×568, 568×320, 1280×800. These are not physical device tests.
- Owned CSS fixture passed with full CSS and with legacy `@scope` removed in all
  three engines, including active Listbox scrolling and existing host/theme tests.
- Existing built-package form compatibility, overlay ownership/dismissal, theme
  isolation and runtime configuration suites also passed in all three engines.
- CSS build's six tests, component contracts, documentation snippets and fifty
  token contrast pairs passed. Variant check passes its recorded baseline, not
  full cross-platform parity.
- Packed install checks passed for React 18/19, including ESM/CJS runtime, README
  samples and native Button types. They still report **three known declaration
  problems**: icons/react `FalseCJS`, product-contracts `CJSResolvesToESM`.
- Frozen debt remains: **59 inert class uses / 39 classes / 25 files**;
  **35 raw colour values / 7 components** and **7 raw radii / 6 components**.
  Passing debt checks means no increase, not that these defects are resolved.

### Still failing: Select accessibility smoke

`STORYBOOK_URL=http://127.0.0.1:6008 pnpm exec tsx scripts/skills/check-a11y.ts`
reports `aria-hidden-focus` for `components-select--default` while open.
Tabs, Dialog, Badge and Button smoke cases pass. The Select failure reproduces
even after waiting for actual option focus, so it is not a loading race.

Radix Select 2.2.6 calls `hideOthers(content)`: the background story root becomes
`aria-hidden="true"` but its native trigger remains focusable. Our previous smoke
disabled this rule and swallowed failed opening interactions. The new test does
neither. The prior overlay ownership tests prove placement, tokens and Escape focus
restoration; they did **not** prove this accessibility requirement.

Resolve the underlying focus/inert lifecycle as its own reviewed overlay change,
with controlled/uncontrolled opening, nested dialogs, custom portals, cleanup,
pre-existing host attributes, multiple roots, dismissal and focus restoration tested
in all three engines. Do not set fake `aria-modal` on a listbox, disable the rule,
hide the trigger only for axe, or remove host controls from the test.

Do not casually layer `aria-hidden` 1.2.6's `inertOthers` on Radix's `hideOthers`:
the installed implementation shares counters across both attributes, so nested
application/cleanup needs explicit verification. No dependency upgrade or ad-hoc
DOM patch was introduced here merely to make the audit green.

## Where to make changes

All paths below are relative to the implementation worktree above.

| Concern                                   | Files                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Shared option visuals                     | `packages/react/src/components/Listbox/OptionRow.tsx`, `packages/react/src/styles/owned-selection.css` |
| Selection behavior and ARIA               | `packages/react/src/components/{Listbox,Combobox,MultiSelect}/*.tsx`                                   |
| Upload semantics, validation, file layout | `packages/react/src/components/FileUpload/FileUpload.tsx` and `.test.tsx`                              |
| Selection unit regressions                | `packages/react/src/components/Listbox/selection-regressions.test.tsx`                                 |
| Storybook host/theme                      | `apps/docs/.storybook/preview.tsx`, `preview.css`                                                      |
| Label/Listbox examples                    | Their `.stories.tsx` and `.mdx` files                                                                  |
| Built-package keyboard/host proof         | `packages/react/tests/integration/owned-css-host.tsx`, `scripts/check-owned-css.mjs`                   |
| Screenshot matrix                         | `scripts/check-storybook-regressions.mjs`                                                              |
| Unsuppressed smoke and CI                 | `scripts/skills/check-a11y.ts`, `.github/workflows/ci.yml`                                             |

`OptionRow` is internal, not a new public API. The standalone Listbox and option-row
styles are owned; MultiSelect's input is owned. **Combobox/MultiSelect/FileUpload as
a whole still use legacy scoped styles**, as do other unmigrated components.
Do not interpret this fix as completing the CSS architecture migration.

### Integration changes to know

- FileUpload's `id` now addresses the visible native picker button; the hidden file
  input has `${id}-file`. Its forwarded ref still addresses the outer div. Use the
  public value/change APIs, not selectors that assume `id` is an input.
- Caller ARIA names/descriptions on MultiSelect now reach the interactive input.
- A meaningful label is required on your actual form; the Storybook fix does not
  automatically name anonymous controls in consumer applications.
- The old Label Outline story URL is replaced by `components-label--with-input`.
- Theme toolbar changes component tokens and canvas. The viewport toolbar changes
  geometry only. Explicitly themed demonstrations may deliberately override it.
- FileUpload's `accept` is a picker hint, not security/content validation. Keep
  server-side validation. Analytics' existing filename payload needs a privacy
  review before product adoption; this batch does not change telemetry contracts.

## Run and maintain it yourself

Use Node/pnpm versions declared in the root package. Build **before** consumers that
read `dist`; never rebuild a checkout while its Storybook or browser tests use it.

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm --filter './packages/*' build
pnpm --filter @kozmos/react test
pnpm --filter @kozmos/react lint
pnpm --filter @kozmos/docs typecheck
pnpm test:css-build
pnpm components:contract:check
pnpm components:classes:check
pnpm tokens:raw:check
pnpm tokens:contrast:check
pnpm docs:snippets:check
pnpm components:variant:check
pnpm packages:install:check
pnpm --filter @kozmos/docs build-storybook
```

In a separate terminal, serve the already built static Storybook:

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD
python3 -m http.server 6008 --bind 127.0.0.1 --directory apps/docs/storybook-static
```

Then run the independent matrices (stop on any failure):

```sh
for browser in chromium firefox webkit; do
  STORYBOOK_URL=http://127.0.0.1:6008 ADAPTIVE_BROWSER="$browser" pnpm test:storybook-regressions || exit 1
  ADAPTIVE_BROWSER="$browser" pnpm test:owned-css || exit 1
  ADAPTIVE_BROWSER="$browser" pnpm test:browser-compatibility || exit 1
  ADAPTIVE_BROWSER="$browser" pnpm test:overlays || exit 1
  ADAPTIVE_BROWSER="$browser" pnpm test:themes || exit 1
  ADAPTIVE_BROWSER="$browser" pnpm test:config || exit 1
done
STORYBOOK_URL=http://127.0.0.1:6008 pnpm exec tsx scripts/skills/check-a11y.ts
```

The last command currently **fails for Select**. Keep it blocking. Browser scripts
set Storybook's supported `a11y.manual` global only to prevent its addon running axe
concurrently with the independent test; no rule is disabled in those tests.

For the live preview use the separate verification checkout described in
`component-owned-css-2026-09-17.md`. Stop its specific Storybook process before
advancing/rebuilding it; do not terminate all Node processes. After building:

```sh
pnpm --filter @kozmos/docs exec storybook dev -p 6006 --host 127.0.0.1 --ci
```

The optional Vue Storybook reference points at port 6007; if that separate server
is not running, its sidebar reports a load error. That is distinct from the React
canvas. It is not included in this React verification.

To add a regression: reproduce it before fixing; add a case/state to the matrix or
the built fixture; assert actual computed style, focus and geometry, not only class
strings; test both themes and all three engines. Keep failures actionable. For
rollback, revert the relevant commit on a new branch; never reset shared main or
silently remove the regression test.

## Recommended sequence before npm

1. Resolve Select's exposed accessibility failure and extend the unsuppressed audit
   across all interactive components and their states, not just these eleven stories.
2. Complete owned CSS migration and the alpha-token/inert-utility backlog. Include
   popup collision/short-height behavior, 200–400% zoom, long/localized labels,
   forced colours, reduced motion, keyboard/typeahead and screen-reader review.
3. Repair the three package declaration problems and review the public API before
   a version is published. Audit analytics payloads and opt-in behavior.
4. Agree exact Pointr browser/WebView minimums; certify those actual versions and
   physical portrait/landscape/foldable/hinge/keyboard devices. Current viewport
   emulation does not establish foldable support or native parity.
5. Complete the existing native, Figma, icon, Chromatic and real-map integration
   gates recorded in `ds-handoff.md` and the owned-CSS guide. Rebuild representative
   product modules using exports only, reporting missing primitives explicitly.
6. Review release-safeguard PR #54 separately, recheck its current state, and seek
   explicit approval for a `next` prerelease only when required gates are green.

Automated accessibility results are not a WCAG conformance certificate. An extensive
pass can reduce uncertainty, not prove that nothing remains overlooked.

Primary references: [WAI listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/),
[combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
[accessible names/descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/),
[Storybook globals](https://storybook.js.org/docs/8/essentials/toolbars-and-globals),
[Radix Select](https://www.radix-ui.com/primitives/docs/components/select),
[aria-hidden utility](https://github.com/theKashey/aria-hidden).
