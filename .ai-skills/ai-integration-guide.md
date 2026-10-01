# Kozmos Design System - AI Integration Guide

> **Purpose:** how to give an AI coding assistant what it needs to build with Kozmos in your own
> project, using what exists today. There is no Kozmos MCP server and no setup command. Their
> design is kept, marked as a proposal, in [`docs/proposals/`](../docs/proposals/README.md).

---

## 1. What an assistant can read

| Source                  | Where                                                                        | What it holds                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| The package's types     | `node_modules/@kozmos-ds/react/dist/index.d.ts`, in your project             | Every export and every prop of the version you installed.                                                 |
| The API cards           | [`docs/claude-design/`](../docs/claude-design/README.md), in this repository | How to consume Kozmos, and one card per component: every prop, its default, and an example that compiles. |
| The component inventory | [`component-inventory.md`](./component-inventory.md)                         | Every component, whether SwiftUI and Compose have it, and every value each variant prop accepts.          |
| Storybook               | <https://vodoco.github.io/kozmos-design-system/storybook/>                   | Every component running, with its docs and its code on each platform.                                     |

The cards and the inventory are generated from the built types by `pnpm skills:build`, and
`pnpm skills:check` fails when they disagree with the code. They describe this repository's
`main`, which can be ahead of the last release: for the version your project has installed, its
own `dist/index.d.ts` is the authority.

## 2. What Kozmos is

- **Platforms:** React, SwiftUI and Jetpack Compose. The React components are on npm; SwiftUI
  (`packages/ios`, library `Kozmos`) and Compose (`packages/android`, `com.kozmos`) are used from a
  checkout of this repository.
- **Packages:** `@kozmos-ds/react`, which installs `@kozmos-ds/tokens`, `@kozmos-ds/icons` and
  `@kozmos-ds/product-contracts` with it. There is no Vue package to install (`@kozmos-ds/vue` is
  a private harness) and no React Native package.
- **Setup:** import `@kozmos-ds/react/style.css` once, and put everything inside a
  `ThemeProvider`. Its styles are scoped to the provider: outside one, nothing is themed.

```tsx
import "@kozmos-ds/react/style.css";
import { Button, ThemeProvider } from "@kozmos-ds/react";

export function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Button>Take me there</Button>
    </ThemeProvider>
  );
}
```

## 3. A context file for your project

Assistants read project instructions from a file of their own: `CLAUDE.md` for Claude Code,
`AGENTS.md` for the agents that read it, and `.github/copilot-instructions.md` for GitHub Copilot,
among others. Put these rules in yours:

```markdown
# Kozmos in this project

This app's interface is built with the Kozmos design system.

- Components come from `@kozmos-ds/react`. Its types, in
  `node_modules/@kozmos-ds/react/dist/index.d.ts`, list every export and every prop of the version
  installed here. Read them before using a component, and use only the props and values they
  declare.
- `@kozmos-ds/react/style.css` is imported once, and everything Kozmos renders sits inside a
  `ThemeProvider` from `@kozmos-ds/react`.
- Colours, spacing and radii come from Kozmos tokens: the CSS variables the stylesheet defines,
  such as `var(--primitives-colors-background-0)`, or the named exports of `@kozmos-ds/tokens`
  for a value in code (these are the light theme's). Never a literal colour.
- Icons come from `@kozmos-ds/icons`.
- Before building a part, look for it in Storybook:
  <https://vodoco.github.io/kozmos-design-system/storybook/>. When Kozmos cannot do something, say
  so rather than working around it.
```

## 4. In Claude Design

[`docs/claude-design/README.md`](../docs/claude-design/README.md) is what the Kozmos artifact in
Claude Design carries: the global its bundle assigns, the load order, and mounting the real
components rather than drawing lookalikes.

## 5. Checking what an assistant wrote

Type-check it against the installed types (`tsc --noEmit`): a component the package does not
export, a prop it does not take and a value a variant does not accept are all compile errors. The
cards' examples show a complete, compiling use of each component.

## 6. Not built

Designs for a Kozmos MCP server, a `kozmos-ai-setup` command, and editor configurations and
snippets that would use them, are kept in [`docs/proposals/`](../docs/proposals/README.md). None of
their packages exists on npm: an `npx` of one of those names would run whatever someone else had
published under it.
