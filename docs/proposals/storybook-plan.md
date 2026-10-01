# Proposal: not built — Storybook customisations

> **Proposal: not built.** These are Storybook customisations planned before the code: a custom
> manager configuration and theme, the Figma designs addon and the pseudo-states addon. None was
> added. Storybook, in `apps/docs`, runs with its default manager and theme, and with the addons
> `apps/docs/.storybook/main.ts` lists: links, essentials, interactions, a11y and
> storybook-addon-performance. It is kept as planning history; the sections below were in
> `.ai-skills/storybook-guide.md` until 2026-09-29.

## Proposal: from `.ai-skills/storybook-guide.md`

These sections were in [`storybook-guide.md`](../../.ai-skills/storybook-guide.md), where each heading now says what is built instead.

#### Proposal: 3.3 Manager Configuration

```typescript
// .storybook/manager.ts
import { addons } from "@storybook/manager-api";
import { kozmosTheme } from "./theme";

addons.setConfig({
  theme: kozmosTheme,
  sidebar: {
    showRoots: true,
    collapsedRoots: ["examples"],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: true },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
```

#### Proposal: 3.4 Custom Theme

```typescript
// .storybook/theme.ts
import { create } from "@storybook/theming/create";

export const kozmosTheme = create({
  base: "light",

  // Brand
  brandTitle: "Kozmos Design System",
  brandUrl: "https://kozmos.pointr.tech",
  brandImage: "/kozmos-logo.svg",
  brandTarget: "_self",

  // Colors
  colorPrimary: "#2563EB",
  colorSecondary: "#7C3AED",

  // UI
  appBg: "#F5F5F5",
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#E5E5E5",
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontCode: '"JetBrains Mono", monospace',

  // Text colors
  textColor: "#171717",
  textInverseColor: "#FAFAFA",
  textMutedColor: "#737373",

  // Toolbar
  barTextColor: "#737373",
  barSelectedColor: "#2563EB",
  barHoverColor: "#2563EB",
  barBg: "#FFFFFF",

  // Form colors
  inputBg: "#FFFFFF",
  inputBorder: "#E5E5E5",
  inputTextColor: "#171717",
  inputBorderRadius: 6,
});

export const kozmosDarkTheme = create({
  base: "dark",
  brandTitle: "Kozmos Design System",
  brandUrl: "https://kozmos.pointr.tech",
  brandImage: "/kozmos-logo-dark.svg",
  colorPrimary: "#60A5FA",
  colorSecondary: "#A78BFA",
  appBg: "#1A1A1A",
  appContentBg: "#262626",
  appPreviewBg: "#1A1A1A",
});
```

#### Proposal: 4.3 Designs Addon (Figma)

```typescript
// Link to Figma designs
parameters: {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/xxx/Kozmos?node-id=123-456',
  },
},

// Or embed Figma
parameters: {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/embed?embed_host=share&url=...',
    allowFullscreen: true,
  },
},
```

#### Proposal: 4.5 Pseudo States Addon

```bash
pnpm add -D storybook-addon-pseudo-states
```

```typescript
// Preview hover, focus, active states
export const States: Story = {
  parameters: {
    pseudo: {
      hover: true,
      focus: true,
      active: true,
    },
  },
};
```
