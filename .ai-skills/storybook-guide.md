# Kozmos Design System - Storybook Configuration Guide

> **Purpose:** This document provides comprehensive Storybook setup, configuration, addon management, and best practices for documenting components in the Kozmos Design System.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Setup](#2-project-setup)
3. [Configuration](#3-configuration)
4. [Addons](#4-addons)
5. [Writing Stories](#5-writing-stories)
6. [Documentation](#6-documentation)
7. [Theming Storybook](#7-theming-storybook)
8. [Testing Integration](#8-testing-integration)
9. [Deployment](#9-deployment)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

### Storybook Stack

| Tool       | Version | Purpose                           |
| ---------- | ------- | --------------------------------- |
| Storybook  | 8.x     | Component development environment |
| Vite       | 5.x     | Build tool (fast HMR)             |
| React      | 18.x    | Component framework               |
| TypeScript | 5.x     | Type safety                       |

### Key Features

- **Component isolation** — Develop components in isolation
- **Documentation** — Auto-generated docs from props
- **Visual testing** — every story is compared with its baseline in light and dark (the Kozmos visual review (`tests/visual`, the "Visual Review" check))
- **Accessibility** — Built-in a11y addon
- **Theming** — Light/dark mode preview
- **Responsive** — Viewport addon for mobile testing

---

## 2. Project Setup

### 2.1 Installation

Storybook is already set up, in its own workspace package: `@kozmos-ds/docs` (`apps/docs`), on
Storybook 8 with the Vite builder. Nothing needs initialising; `pnpm install` at the root installs
it. To add an addon, add it to that package:

```bash
pnpm --filter @kozmos-ds/docs add -D <addon>
```

### 2.2 Directory Structure

```
apps/docs/
├── .storybook/
│   ├── main.ts              # Stories, addons, framework
│   ├── preview.tsx          # Global decorators & parameters
│   ├── preview-head.html    # Custom head elements
│   └── preview.css
├── .storybook-vue/          # The private Vue harness's Storybook
├── src/                     # Documentation pages and stories
└── stories/                 # Example stories
packages/react/src/components/Button/
├── Button.tsx
├── Button.stories.tsx       # Stories live beside their component
├── Button.mdx
├── Button.test.tsx
├── Button.figma.tsx
└── index.ts
```

`apps/docs/.storybook/main.ts` reads stories and MDX from `apps/docs/src`, `apps/docs/stories` and
`packages/react/src`.

---

## 3. Configuration

### 3.1 Main Configuration

```typescript
// kozmos-skills: template — abridged from apps/docs/.storybook/main.ts, whose packages are apps/docs's own
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/react/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/react/src/**/*.mdx",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "storybook-addon-performance",
  ],
  framework: { name: "@storybook/react-vite", options: {} },
  docs: { autodocs: "tag" },
  typescript: { reactDocgen: "react-docgen-typescript" },
};

export default config;
```

The real file resolves each addon to an absolute path, aliases `@kozmos-ds/react` to the package's
source (so the stories and the decorator share one set of React contexts), and has Vite pre-bundle
the dependencies.

### 3.2 Preview Configuration

```tsx
// kozmos-skills: template — abridged from apps/docs/.storybook/preview.tsx, whose packages are apps/docs's own
import type { Preview } from "@storybook/react";
import { DesignConfigProvider } from "@kozmos-ds/react";
import "../../../packages/react/dist/style.css";

const preview: Preview = {
  // A Theme toolbar: light or dark, for the components and the canvas together.
  globalTypes: {
    theme: {
      description: "Kozmos component theme (tokens and canvas)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  // Every story sits inside a provider, as an app's does.
  decorators: [
    (Story, context) => (
      <DesignConfigProvider
        theme={context.globals.theme === "dark" ? "dark" : "light"}
      >
        <Story />
      </DesignConfigProvider>
    ),
  ],
  parameters: {
    // A canvas paint selector is not a component theme.
    backgrounds: { disable: true },
  },
};

export default preview;
```

### 3.3 Manager Configuration

Storybook runs with its default manager UI: `apps/docs/.storybook` has no `manager.ts`. The
configuration planned before the code is kept in
[docs/proposals/storybook-plan.md](../docs/proposals/storybook-plan.md).

### 3.4 Custom Theme

Storybook's own chrome keeps its default theme: there is no `theme.ts`. The Kozmos components inside
it take the Theme toolbar's light or dark (3.2). The custom theme planned before the code is kept in
[docs/proposals/storybook-plan.md](../docs/proposals/storybook-plan.md).

---

## 4. Addons

### 4.1 Essential Addons (Pre-installed)

| Addon                           | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `@storybook/addon-essentials`   | Controls, Actions, Docs, Viewport, Backgrounds, Measure, Outline |
| `@storybook/addon-links`        | Link between stories                                             |
| `@storybook/addon-interactions` | Test interactions                                                |
| `@storybook/addon-a11y`         | axe's findings for the story in view                             |
| `storybook-addon-performance`   | Render timings for a story                                       |

### 4.2 Accessibility Addon

```typescript
// kozmos-skills: template — the parameters key of a story or a meta, shown on its own
// Configure a11y addon
parameters: {
  a11y: {
    // axe-core configuration
    config: {
      rules: [
        { id: 'color-contrast', enabled: true },
        { id: 'duplicate-id', enabled: true },
        { id: 'heading-order', enabled: true },
      ],
    },
    // Disable specific rules per story
    // options: { rules: [{ id: 'color-contrast', enabled: false }] },
  },
},
```

### 4.3 Designs Addon (Figma)

`@storybook/addon-designs` is not installed, so a story does not embed its Figma frame. A Kozmos
component reaches its Figma component through Code Connect instead. The designs addon, as planned
before the code, is kept in [docs/proposals/storybook-plan.md](../docs/proposals/storybook-plan.md).

### 4.4 Visual Review (Visual Testing)

Every story is drawn in light and dark by the repository's own visual review (`tests/visual`) and
compared with its committed baseline; a pull request that changes how a story looks shows the new
drawing in "Files changed". Stories must draw the same way every time: the suite fixes the clock,
seeds `Math.random`, prefers reduced motion and masks map canvases. A story that cannot be drawn
deterministically opts out with a tag:

```typescript
// kozmos-skills: template — a story of a stories file that declares Story
export const LiveFeed: Story = {
  tags: ["no-visual"],
};
```

See `docs/visual-review.md` for recording baselines and reading a difference.

### 4.5 Pseudo States Addon

`storybook-addon-pseudo-states` is not installed: a story that shows a state renders the state
itself. The addon, as planned before the code, is kept in
[docs/proposals/storybook-plan.md](../docs/proposals/storybook-plan.md).

---

## 5. Writing Stories

### 5.1 Basic Story Structure

```tsx
// kozmos-skills: template — a story file beside Button in packages/react/src/components/Button, importing its source
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],

  // Decorators wrap stories
  decorators: [
    (Story) => (
      <div style={{ padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],

  // Default args for all stories
  args: {
    onClick: fn(),
  },

  // Arg types for controls: Button's own values
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "glass",
      ],
      description: "Visual style variant",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "default" },
      },
    },
    size: {
      control: "radio",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
    isLoading: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
```

### 5.2 Story Variants

```tsx
// kozmos-skills: template — stories of the Button file above, which declares Story
// Default variant
export const Primary: Story = {
  args: {
    variant: "default",
    children: "Primary Button",
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

// All sizes
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
  args: {
    variant: "default",
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

// With icon: Button takes it as a child
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Icon name="arrow-right" size="sm" /> Navigate
      </>
    ),
  },
};

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Loading...",
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled",
  },
};
```

### 5.3 Interactive Stories

```typescript
// kozmos-skills: template — stories of the Button file above, which declares Story
import { within, userEvent, expect } from "@storybook/test";

export const ClickInteraction: Story = {
  args: {
    children: "Click Me",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Verify initial state
    await expect(button).toBeEnabled();

    // Simulate click
    await userEvent.click(button);

    // Verify onClick was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Tab to button
    await userEvent.tab();
    await expect(button).toHaveFocus();

    // Press Enter
    await userEvent.keyboard("{Enter}");
  },
};
```

### 5.4 Form Stories

```tsx
// kozmos-skills: template — stories of an Input stories file, which imports Input, Button and useState
// Input.stories.tsx
export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [error, setError] = useState<string>();

    const validate = (val: string) => {
      if (val.length < 3) {
        setError("Must be at least 3 characters");
      } else {
        setError(undefined);
      }
    };

    return (
      <Input
        label="Username"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          validate(e.target.value);
        }}
        error={error}
        helperText="Enter your username"
      />
    );
  },
};

export const FormExample: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <Input label="Email" type="email" required />
      <Input label="Password" type="password" required />
      <Button type="submit">Submit</Button>
    </form>
  ),
  parameters: {
    layout: "padded",
  },
};
```

---

## 6. Documentation

### 6.1 MDX Documentation

````mdx
{/* Introduction.mdx */}
import { Meta, Canvas, Story } from '@storybook/blocks';
import \* as ButtonStories from '../components/Button/Button.stories';

<Meta title="Introduction" />

# Kozmos Design System

Welcome to the Kozmos Design System documentation. This design system
powers Pointr's indoor navigation SDK on React, SwiftUI and Jetpack Compose.

## Getting Started

Install the package:

```bash
npm install @kozmos-ds/react
```

Import and use components:

```tsx
import { Button } from "@kozmos-ds/react";

function App() {
  return <Button variant="default">Navigate</Button>;
}
```

## Component Preview

<Canvas of={ButtonStories.Primary} />

## Design Principles

1. **Accessible** — WCAG 2.1 AA compliant
2. **Responsive** — Mobile-first approach
3. **Themeable** — Full white-labeling support
4. **Performant** — Zero runtime CSS-in-JS
````

### 6.2 Component Documentation

````mdx
{/* Button.mdx */}
import { Meta, ArgTypes, Canvas, Controls, Story } from '@storybook/blocks';
import \* as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Buttons allow users to take actions and make choices with a single tap.

## Import

```tsx
import { Button } from "@kozmos-ds/react";
```

## Usage

<Canvas of={ButtonStories.Primary} />

<Controls of={ButtonStories.Primary} />

## Variants

### Primary

Use for primary actions like "Navigate" or "Submit".

<Canvas of={ButtonStories.Primary} />

### Secondary

Use for secondary actions like "Cancel" or "Back".

<Canvas of={ButtonStories.Secondary} />

### Ghost

Use for tertiary actions or in toolbars.

<Canvas of={ButtonStories.Ghost} />

## Sizes

<Canvas of={ButtonStories.Sizes} />

## With Icons

<Canvas of={ButtonStories.WithIcon} />

## States

### Loading

<Canvas of={ButtonStories.Loading} />

### Disabled

<Canvas of={ButtonStories.Disabled} />

## Accessibility

- Uses native `<button>` element
- Supports keyboard navigation (Tab, Enter, Space)
- Is disabled while loading, and keeps its label: the label should say what is happening
- Focus visible outline meets WCAG contrast requirements

## Props

<ArgTypes of={ButtonStories} />

## Design Specs

See [Figma designs](https://figma.com/...) for detailed specifications.
````

### 6.3 Design Token Documentation

```mdx
{/* DesignTokens.mdx */}
import { Meta, ColorPalette, ColorItem } from '@storybook/blocks';

<Meta title="Design Tokens" />

# Design Tokens

Kozmos's tokens come in three collections: primitives, semantics and components. The swatches read
the variables, so they follow the Theme toolbar.

## Colors

<ColorPalette>
  <ColorItem
    title="Theme"
    subtitle="--primitives-colors-theme-*"
    colors={{
      500: "var(--primitives-colors-theme-500)",
      600: "var(--primitives-colors-theme-600)",
      700: "var(--primitives-colors-theme-700)",
    }}
  />
  <ColorItem
    title="Surface"
    subtitle="--semantics-surface-*"
    colors={{
      0: "var(--semantics-surface-0)",
      100: "var(--semantics-surface-100)",
      200: "var(--semantics-surface-200)",
    }}
  />
  <ColorItem
    title="Emotion text"
    subtitle="--semantics-emotion-*-text"
    colors={{
      Success: "var(--semantics-emotion-success-text)",
      Alert: "var(--semantics-emotion-alert-text)",
      Danger: "var(--semantics-emotion-danger-text)",
      Informative: "var(--semantics-emotion-informative-text)",
    }}
  />
</ColorPalette>

## Spacing

The spacing tokens are unitless numbers, shared with iOS and Android, so a rule multiplies them.

| Token                             | Value                                              |
| --------------------------------- | -------------------------------------------------- |
| `--primitives-layout-spacing-100` | `calc(var(--primitives-layout-spacing-100) * 1px)` |
| `--primitives-layout-spacing-200` | `calc(var(--primitives-layout-spacing-200) * 1px)` |
| `--primitives-layout-spacing-300` | `calc(var(--primitives-layout-spacing-300) * 1px)` |
```

---

## 7. Theming Storybook

### 7.1 Dark Mode Toggle

The Theme toolbar in `apps/docs/.storybook/preview.tsx` (3.2) is the toggle: it sets the
`DesignConfigProvider`'s theme for every story, and so its canvas and portals too. There is no
`@storybook/addon-themes`.

### 7.2 RTL Toggle

```tsx
// kozmos-skills: template — a sketch of a preview's globals and decorator, for a Direction toolbar Kozmos's Storybook does not have yet
export const globalTypes = {
  direction: {
    description: "Text direction",
    defaultValue: "ltr",
    toolbar: {
      title: "Direction",
      icon: "transfer",
      items: [
        { value: "ltr", title: "LTR" },
        { value: "rtl", title: "RTL" },
      ],
    },
  },
};

// DesignConfigProvider's dir reaches Radix's keyboard handling, which a bare
// <div dir> does not.
export const decorators = [
  (Story, context) => (
    <DesignConfigProvider dir={context.globals.direction}>
      <Story />
    </DesignConfigProvider>
  ),
];
```

### 7.3 Customer Theme Preview

```tsx
// kozmos-skills: template — a sketch of a Customer toolbar Kozmos's Storybook does not have; customerTokens is the app's
// Preview different customer themes through the provider's tokens
export const globalTypes = {
  customerTheme: {
    description: "Customer theme",
    defaultValue: "default",
    toolbar: {
      title: "Customer",
      icon: "paintbrush",
      items: [
        { value: "default", title: "Kozmos Default" },
        { value: "customer-a", title: "Customer A" },
        { value: "customer-b", title: "Customer B" },
      ],
    },
  },
};

export const decorators = [
  (Story, context) => (
    <DesignConfigProvider
      tokens={customerTokens[context.globals.customerTheme]}
    >
      <Story />
    </DesignConfigProvider>
  ),
];
```

---

## 8. Testing Integration

### 8.1 Test Runner

The Storybook test runner (`test-storybook`) is not used, and there is no `storybook:test` script.
The suites are Playwright scripts at the root that visit a served Storybook, named by
`STORYBOOK_URL`:

```bash
# Serve a Storybook first (the dev server listens on port 6006)
pnpm --filter @kozmos-ds/docs storybook

# Interactions, in light and dark at three viewports
STORYBOOK_URL=http://127.0.0.1:6006 pnpm test:storybook-interactions

# Two more of the suites CI runs against Storybook
STORYBOOK_URL=http://127.0.0.1:6006 pnpm test:storybook-docs
STORYBOOK_URL=http://127.0.0.1:6006 pnpm test:storybook-regressions
```

In CI the browser shards serve the built Storybook and run these suites in Chromium, Firefox and
WebKit ([ci-cd-configuration.md](./ci-cd-configuration.md)); locally, `ADAPTIVE_BROWSER=firefox`
or `ADAPTIVE_BROWSER=webkit` picks the browser.

### 8.2 Accessibility Tests

`pnpm test:storybook-audit` runs axe on stories through Playwright (`@axe-core/playwright`), in
light and dark at 320 and 1280 px, and fails on any violation; `STORY_SCOPE=all` audits every story,
as CI does, instead of one per component. `scripts/skills/check-a11y.ts` is a smaller axe check of
five stories. The `@storybook/addon-a11y` panel shows axe's findings while you work.

### 8.3 Visual Regression

The repository's own visual review draws every story in light and dark with Chromium in the
Playwright image and compares it with the baseline committed in `tests/visual/baselines`
(`.github/workflows/visual.yml`; the "Visual Review" check is required on every pull request).
Locally, `pnpm test:visual` compares and `pnpm test:visual:update` records, both in Docker, never on a
bare Mac, whose fonts draw differently. `docs/visual-review.md` explains how to read a difference and
how to accept one.

---

## 9. Deployment

### 9.1 Static Build

```bash
# Build static Storybook into apps/docs/storybook-static
pnpm --filter @kozmos-ds/docs build-storybook
```

CI, Visual Regression and Lighthouse CI build it this way to test it.

### 9.2 GitHub Pages

Storybook is published with the website on GitHub Pages, from `main`, by `pages.yml`, at
<https://vodoco.github.io/kozmos-design-system/storybook/>. It is the component reference: each
component's docs, stories, controls and code on every platform.

---

## 10. Best Practices

### 10.1 Story Organization

```typescript
// kozmos-skills: template — story titles, good and bad, not a module
// ✅ Good: Organized by component type
"Primitives/Button";
"Primitives/Input";
"Components/Card";
"Components/Dialog";
"Patterns/Forms";
"SDK Components/MapView";

// ❌ Bad: Flat structure
"Button";
"Input";
"Card";
```

### 10.2 Naming Conventions

```typescript
// kozmos-skills: template — story names, good and bad; each … is a story's body
// ✅ Good: Descriptive story names
export const PrimaryDefault: Story = { ... };
export const PrimaryWithIcon: Story = { ... };
export const PrimaryLoading: Story = { ... };
export const PrimaryDisabled: Story = { ... };

// ❌ Bad: Vague names
export const Story1: Story = { ... };
export const Test: Story = { ... };
```

### 10.3 Args Best Practices

```tsx
// kozmos-skills: template — stories of a Button stories file, the good way and the bad
// ✅ Good: Use args for reusability
export const Primary: Story = {
  args: {
    variant: "default",
    children: "Button",
  },
};

export const PrimarySmall: Story = {
  args: {
    ...Primary.args,
    size: "sm",
  },
};

// ❌ Bad: Hardcoded in render
export const PrimaryHardcoded: Story = {
  render: () => <Button variant="default">Button</Button>,
};
```

### 10.4 Documentation Checklist

```markdown
## Component Documentation Checklist

- [ ] Component has `title` in meta
- [ ] `autodocs` tag is present
- [ ] All props have descriptions
- [ ] Default values are documented
- [ ] At least one story per variant
- [ ] Interactive story for complex behavior
- [ ] Accessibility notes included
- [ ] Figma link in parameters
- [ ] Usage examples in MDX
```

### 10.5 Performance

```tsx
// kozmos-skills: template — stories of a stories file; Visualization is the app's
// Lazy load heavy stories
export const ComplexVisualization: Story = {
  loaders: [
    async () => ({
      data: await fetch("/api/large-dataset").then((r) => r.json()),
    }),
  ],
  render: (args, { loaded: { data } }) => (
    <Visualization data={data} {...args} />
  ),
};

// Leave a story that cannot draw the same way twice out of the visual review
export const HeavyAnimation: Story = {
  tags: ["no-visual"],
};
```

---

## Related Documents

- [Component Creation Guide](./component-creation-guide.md) — Story templates
- [Testing Patterns](./testing-patterns.md) — Integration with tests
- [CI/CD Configuration](./ci-cd-configuration.md) — the Visual Review workflow

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
