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
- **Visual testing** — Chromatic integration
- **Accessibility** — Built-in a11y addon
- **Theming** — Light/dark mode preview
- **Responsive** — Viewport addon for mobile testing

---

## 2. Project Setup

### 2.1 Installation

```bash
# In packages/react directory
cd packages/react

# Install Storybook
pnpm dlx storybook@latest init --builder vite

# Install additional addons
pnpm add -D @storybook/addon-a11y \
  @storybook/addon-designs \
  @storybook/addon-storysource \
  @storybook/test \
  @chromatic-com/storybook
```

### 2.2 Directory Structure

```
packages/react/
├── .storybook/
│   ├── main.ts              # Storybook configuration
│   ├── preview.ts           # Global decorators & parameters
│   ├── preview-head.html    # Custom head elements
│   ├── manager.ts           # Manager UI customization
│   └── theme.ts             # Custom Storybook theme
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   └── stories/
│       ├── Introduction.mdx      # Welcome page
│       ├── GettingStarted.mdx    # Setup guide
│       └── DesignTokens.mdx      # Token documentation
```

---

## 3. Configuration

### 3.1 Main Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-designs",
    "@storybook/addon-storysource",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  docs: {
    autodocs: "tag",
    defaultName: "Documentation",
  },

  staticDirs: ["../public"],

  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        // Filter out HTML attributes unless explicitly defined
        if (prop.parent) {
          return !prop.parent.fileName.includes("node_modules/@types/react");
        }
        return true;
      },
    },
  },

  viteFinal: async (config) => {
    // Customize Vite config if needed
    return config;
  },
};

export default config;
```

### 3.2 Preview Configuration

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import { withThemeByDataAttribute } from "@storybook/addon-themes";

// Import Kozmos tokens and global styles
import "@kozmos/tokens/css/tokens.css";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    // Autodocs configuration
    docs: {
      toc: true, // Table of contents
      source: {
        type: "code",
        language: "tsx",
      },
    },

    // Actions configuration
    actions: { argTypesRegex: "^on[A-Z].*" },

    // Controls configuration
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: "requiredFirst",
    },

    // Backgrounds
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#1a1a1a" },
        { name: "gray", value: "#f5f5f5" },
      ],
    },

    // Viewports
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
        },
        wide: {
          name: "Wide Desktop",
          styles: { width: "1920px", height: "1080px" },
        },
      },
    },

    // Layout
    layout: "centered", // 'centered' | 'fullscreen' | 'padded'

    // Options
    options: {
      storySort: {
        order: [
          "Introduction",
          "Getting Started",
          "Design Tokens",
          "Primitives",
          ["Button", "Input", "Select", "Checkbox", "Radio", "Switch"],
          "Components",
          "Patterns",
          "SDK Components",
        ],
      },
    },
  },

  // Global decorators
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-color-scheme",
    }),
  ],

  // Global arg types
  argTypes: {
    // Common props across components
    className: {
      control: "text",
      description: "Additional CSS classes",
      table: { category: "Styling" },
    },
    style: {
      control: "object",
      description: "Inline styles",
      table: { category: "Styling" },
    },
  },

  // Tags
  tags: ["autodocs"],
};

export default preview;
```

### 3.3 Manager Configuration

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

### 3.4 Custom Theme

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

---

## 4. Addons

### 4.1 Essential Addons (Pre-installed)

| Addon                           | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `@storybook/addon-essentials`   | Controls, Actions, Docs, Viewport, Backgrounds, Measure, Outline |
| `@storybook/addon-links`        | Link between stories                                             |
| `@storybook/addon-interactions` | Test interactions                                                |
| `@storybook/addon-onboarding`   | First-time user guide                                            |

### 4.2 Accessibility Addon

```typescript
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

### 4.4 Chromatic (Visual Testing)

```typescript
// .storybook/main.ts
addons: [
  '@chromatic-com/storybook',
],

// In stories
export const Primary: Story = {
  parameters: {
    chromatic: {
      // Capture at multiple viewports
      viewports: [375, 768, 1280],
      // Delay before snapshot
      delay: 300,
      // Disable for specific stories
      // disableSnapshot: true,
    },
  },
};
```

### 4.5 Pseudo States Addon

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

---

## 5. Writing Stories

### 5.1 Basic Story Structure

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],

  // Decorators wrap stories
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],

  // Default args for all stories
  args: {
    onClick: fn(),
  },

  // Arg types for controls
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'destructive'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
  },

  // Parameters for this component
  parameters: {
    design: {
      type: 'figma',
      url: 'https://figma.com/file/.../Button',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
```

### 5.2 Story Variants

```typescript
// Primary variant (default)
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

// All sizes
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="default">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
  args: {
    variant: 'primary',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

// With icon
export const WithIcon: Story = {
  args: {
    children: 'Navigate',
    startIcon: <ArrowRightIcon />,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};
```

### 5.3 Interactive Stories

```typescript
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

```typescript
// Input.stories.tsx
export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string>();

    const validate = (val: string) => {
      if (val.length < 3) {
        setError('Must be at least 3 characters');
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
        hint="Enter your username"
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
    layout: 'padded',
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
powers Pointr's indoor navigation SDK across 6 platforms.

## Getting Started

Install the package:

```bash
npm install @kozmos/react
```
````

Import and use components:

```tsx
import { Button } from "@kozmos/react";

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

```mdx
{/* Button.mdx */}
import { Meta, ArgTypes, Canvas, Controls, Story } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Buttons allow users to take actions and make choices with a single tap.

## Import

```tsx
import { Button } from '@kozmos/react';
````

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
- Announces loading state to screen readers
- Focus visible outline meets WCAG contrast requirements

## Props

<ArgTypes of={ButtonStories} />

## Design Specs

See [Figma designs](https://figma.com/...) for detailed specifications.

````

### 6.3 Design Token Documentation

```mdx
{/* DesignTokens.mdx */}
import { Meta } from '@storybook/blocks';
import { ColorPalette, ColorItem, Typeset } from '@storybook/blocks';

<Meta title="Design Tokens" />

# Design Tokens

Kozmos uses a three-tier token system: primitives, semantic, and component tokens.

## Colors

### Brand Colors

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="--kozmos-color-primary"
    colors={{ Primary: '#2563EB' }}
  />
  <ColorItem
    title="Secondary"
    subtitle="--kozmos-color-secondary"
    colors={{ Secondary: '#7C3AED' }}
  />
</ColorPalette>

### Semantic Colors

<ColorPalette>
  <ColorItem
    title="Background"
    subtitle="--kozmos-color-background-*"
    colors={{
      Default: '#FFFFFF',
      Subtle: '#F5F5F5',
      Muted: '#E5E5E5',
    }}
  />
  <ColorItem
    title="Foreground"
    subtitle="--kozmos-color-foreground-*"
    colors={{
      Default: '#171717',
      Muted: '#737373',
      Subtle: '#A3A3A3',
    }}
  />
</ColorPalette>

### Status Colors

<ColorPalette>
  <ColorItem
    title="Status"
    colors={{
      Success: '#22C55E',
      Warning: '#F59E0B',
      Error: '#EF4444',
      Info: '#3B82F6',
    }}
  />
</ColorPalette>

## Typography

<Typeset
  fontSizes={['0.75rem', '0.875rem', '1rem', '1.125rem', '1.25rem', '1.5rem', '1.875rem']}
  fontWeight={400}
  sampleText="The quick brown fox jumps over the lazy dog"
  fontFamily="Inter, sans-serif"
/>

## Spacing

| Token | Value | Preview |
|-------|-------|---------|
| `--kozmos-spacing-1` | 4px | <div style={{width: '4px', height: '16px', background: '#2563EB'}} /> |
| `--kozmos-spacing-2` | 8px | <div style={{width: '8px', height: '16px', background: '#2563EB'}} /> |
| `--kozmos-spacing-4` | 16px | <div style={{width: '16px', height: '16px', background: '#2563EB'}} /> |
| `--kozmos-spacing-6` | 24px | <div style={{width: '24px', height: '16px', background: '#2563EB'}} /> |
| `--kozmos-spacing-8` | 32px | <div style={{width: '32px', height: '16px', background: '#2563EB'}} /> |
````

---

## 7. Theming Storybook

### 7.1 Dark Mode Toggle

```typescript
// .storybook/preview.ts
import { withThemeByDataAttribute } from "@storybook/addon-themes";

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "light",
    attributeName: "data-color-scheme",
  }),
];

// Add toolbar button
export const globalTypes = {
  theme: {
    description: "Global theme for components",
    defaultValue: "light",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: [
        { value: "light", icon: "sun", title: "Light" },
        { value: "dark", icon: "moon", title: "Dark" },
      ],
      dynamicTitle: true,
    },
  },
};
```

### 7.2 RTL Toggle

```typescript
// Add RTL support
export const globalTypes = {
  direction: {
    description: 'Text direction',
    defaultValue: 'ltr',
    toolbar: {
      title: 'Direction',
      icon: 'transfer',
      items: [
        { value: 'ltr', title: 'LTR' },
        { value: 'rtl', title: 'RTL' },
      ],
    },
  },
};

export const decorators = [
  (Story, context) => {
    const dir = context.globals.direction;
    return (
      <div dir={dir} style={{ direction: dir }}>
        <Story />
      </div>
    );
  },
];
```

### 7.3 Customer Theme Preview

```typescript
// Preview different customer themes
export const globalTypes = {
  customerTheme: {
    description: 'Customer theme',
    defaultValue: 'default',
    toolbar: {
      title: 'Customer',
      icon: 'paintbrush',
      items: [
        { value: 'default', title: 'Kozmos Default' },
        { value: 'customer-a', title: 'Customer A' },
        { value: 'customer-b', title: 'Customer B' },
      ],
    },
  },
};

export const decorators = [
  (Story, context) => {
    const theme = context.globals.customerTheme;
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    return <Story />;
  },
];
```

---

## 8. Testing Integration

### 8.1 Test Runner

```bash
# Install test runner
pnpm add -D @storybook/test-runner

# Run tests
pnpm storybook:test

# Run in CI
pnpm storybook:test --ci
```

```json
// package.json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "storybook:test": "test-storybook"
  }
}
```

### 8.2 Accessibility Tests

```typescript
// .storybook/test-runner.ts
import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, checkA11y } from "axe-playwright";

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
```

### 8.3 Visual Regression with Chromatic

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install dependencies
        run: pnpm install

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: storybook:build
          onlyChanged: true
          exitZeroOnChanges: true
```

---

## 9. Deployment

### 9.1 Static Build

```bash
# Build static Storybook
pnpm storybook:build

# Output in storybook-static/
# Deploy to any static host
```

### 9.2 GitHub Pages

```yaml
# .github/workflows/deploy-storybook.yml
name: Deploy Storybook

on:
  push:
    branches: [main]
    paths:
      - "packages/react/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: pnpm install

      - name: Build Storybook
        run: pnpm --filter @kozmos/react storybook:build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/react/storybook-static
```

### 9.3 Versioned Documentation

```typescript
// storybook-static/.storybook/versions.json
{
  "current": "2.0.0",
  "versions": [
    { "version": "2.0.0", "url": "/v2" },
    { "version": "1.5.0", "url": "/v1.5" },
    { "version": "1.0.0", "url": "/v1" }
  ]
}
```

---

## 10. Best Practices

### 10.1 Story Organization

```typescript
// ✅ Good: Organized by component type
"Primitives/Button";
"Primitives/Input";
"Components/Card";
"Components/Modal";
"Patterns/Forms";
"SDK Components/MapView";

// ❌ Bad: Flat structure
"Button";
"Input";
"Card";
```

### 10.2 Naming Conventions

```typescript
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

```typescript
// ✅ Good: Use args for reusability
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const PrimarySmall: Story = {
  args: {
    ...Primary.args,
    size: 'sm',
  },
};

// ❌ Bad: Hardcoded in render
export const Primary: Story = {
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

```typescript
// Lazy load heavy stories
export const ComplexVisualization: Story = {
  loaders: [
    async () => ({
      data: await fetch('/api/large-dataset').then(r => r.json()),
    }),
  ],
  render: (args, { loaded: { data } }) => (
    <Visualization data={data} {...args} />
  ),
};

// Skip heavy stories in Chromatic
export const HeavyAnimation: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

---

## Related Documents

- [Component Creation Guide](./component-creation-guide.md) — Story templates
- [Testing Patterns](./testing-patterns.md) — Integration with tests
- [CI/CD Configuration](./ci-cd-configuration.md) — Chromatic setup

---

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
