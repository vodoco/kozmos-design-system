# Kozmos Design System - Token Implementation Guide

> **Purpose:** how the Kozmos design tokens are made and shipped: their source, the build, what it
> writes, how each platform reads the result, and the checks that keep the platforms in agreement.
> The pipeline planned before the code is kept, marked as a proposal, in
> [docs/proposals/token-pipeline-plan.md](../docs/proposals/token-pipeline-plan.md).

---

## 1. The source

The tokens live in `packages/tokens/src`, in the W3C Design Tokens (DTCG) format: every token has a
`$value` and a `$type`, and a value can refer to another token as `{Collection.path}`.

| File                                                 | What it holds                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `tokens-light.json`                                  | Every token for the light theme: the `Primitives`, `Semantics` and `Components` collections, and `shadow` |
| `tokens-dark.json`                                   | The same for the dark theme                                                                               |
| `raw/`                                               | Exports of the Figma file's variable collections                                                          |
| `component-contracts.json`, `contrast-contract.json` | What the component and contrast checks hold the tokens to                                                 |

`pnpm tokens:sync` (`scripts/sync-figma.ts`) fetches the Figma file's variables into `src/` as DTCG
tokens. It reads `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY` from the environment.

## 2. The build

```bash
pnpm tokens:build    # pnpm --filter @kozmos-ds/tokens build, which runs node build.mjs
```

`packages/tokens/build.mjs` runs Style Dictionary 5 with Tokens Studio's transforms
(`@tokens-studio/sd-transforms`) over the two source files, and writes `packages/tokens/dist/`:

| Output                                                                                              | For                                                   |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `dist/css/variables-light.css`, `dist/css/variables-dark.css`                                       | The web: CSS custom properties                        |
| `dist/js/tokens.mjs`, `tokens.js`, `tokens.d.ts`, `tokens.d.mts`                                    | JavaScript and TypeScript: one named export per token |
| `dist/ios/*.swift`                                                                                  | SwiftUI                                               |
| `dist/android/src/main/java/com/kozmos/tokens/*.kt`, `dist/android/src/main/res/values*/colors.xml` | Compose and Android resources                         |

## 3. What the package exports

`@kozmos-ds/tokens` publishes `dist/`, through its manifest's `exports`:

| Import                            | Resolves to                    |
| --------------------------------- | ------------------------------ |
| `@kozmos-ds/tokens`               | The JavaScript named exports   |
| `@kozmos-ds/tokens/css/light.css` | `dist/css/variables-light.css` |
| `@kozmos-ds/tokens/css/dark.css`  | `dist/css/variables-dark.css`  |
| `@kozmos-ds/tokens/dist/*`        | Any built file, by its path    |

The light file defines every variable on `:root`, and the dark file redefines them under
`[data-theme="dark"]`. The variables are named for their collection and path:
`--primitives-colors-background-0`, `--semantics-radius-container`, `--components-…`. The semantic
radius roles are unitless numbers, shared with iOS and Android, so a web rule multiplies them:
`calc(var(--semantics-radius-container) * 1px)`.

`@kozmos-ds/react` needs none of this set up: its stylesheet, `@kozmos-ds/react/style.css`, holds the
token variables for both themes, scoped to its `ThemeProvider`.

## 4. On each platform

| Platform        | How it reads the tokens                                                         | Example                                           |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| Web, CSS        | The variables                                                                   | `var(--primitives-colors-background-0)`           |
| Web, JavaScript | The named exports, which are the light theme's values (there is no dark module) | `PrimitivesColorsTheme500`                        |
| SwiftUI         | `KozmosThemeTokens`, which follows the theme                                    | `KozmosThemeTokens.primitivesColorsForeground100` |
| Compose         | `KozmosThemeTokens`, which follows the theme                                    | `KozmosThemeTokens.primitivesColorsForeground100` |

The iOS and Android packages carry copies of the generated sources. After a build,
`pnpm tokens:native:copy` copies them over, and `pnpm tokens:copies:check` fails while any copy
differs from the build.

## 5. The checks

Each check runs by its name, and each script's opening comment says what it holds the tokens to:

- `pnpm tokens:theme:check`, `pnpm tokens:border:check`, `pnpm tokens:radius:check`,
  `pnpm tokens:typography:check`, `pnpm tokens:elevation:check`, `pnpm tokens:glass:check` and
  `pnpm tokens:motion:check` compare the platforms with each other;
- `pnpm tokens:contrast:check` holds colour pairs to their contrast;
- `pnpm tokens:raw:check` finds a component value that bypasses a role the tokens already have, and
  `pnpm tokens:unitless:check` a unitless token used where CSS needs a length;
- `pnpm tokens:radius:nesting` reports nested radii (docs/nested-radius.md);
- `pnpm tokens:copies:check` compares the native copies with the build.
