# Kozmos Design System - Architecture Decision Log

> **Purpose:** This document records all significant architectural decisions made for the Kozmos Design System using the ADR (Architecture Decision Record) format. Use this to understand why decisions were made and their implications.

---

## Table of Contents

1. [ADR Format Guide](#adr-format-guide)
2. [Decision Index](#decision-index)
3. [Foundation Decisions](#foundation-decisions)
4. [Component Architecture Decisions](#component-architecture-decisions)
5. [Tooling Decisions](#tooling-decisions)
6. [Platform Decisions](#platform-decisions)
7. [Process Decisions](#process-decisions)
8. [Decision Template](#decision-template)

---

## ADR Format Guide

### What is an ADR?

An Architecture Decision Record (ADR) documents a significant architectural decision along with its context and consequences. ADRs help future team members understand:

- **Why** a decision was made
- **What** alternatives were considered
- **What** trade-offs were accepted

### ADR Lifecycle

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│ DRAFT   │ →  │ PROPOSED │ →  │ ACCEPTED │ →  │ DEPRECATED │
└─────────┘    └──────────┘    └──────────┘    └────────────┘
                                      │              │
                                      └──── OR ──────┘
                                                     │
                                              ┌──────────────┐
                                              │ SUPERSEDED   │
                                              │ by ADR-XXX   │
                                              └──────────────┘
```

### When to Write an ADR

Write an ADR when:

- Choosing between multiple valid approaches
- Making a decision that's difficult to reverse
- The decision affects multiple parts of the system
- Team members might question the decision later
- Onboarding new team members would benefit from understanding the context

---

## Decision Index

| ID                                                                    | Title                                    | Status                              | Date       |
| --------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------- | ---------- |
| [ADR-001](#adr-001-css-variables--cva-for-web-styling)                | CSS Variables + CVA for Web Styling      | ✅ Accepted                         | 2026-01-15 |
| [ADR-002](#adr-002-style-dictionary-v4-for-token-generation)          | Style Dictionary v4 for Token Generation | ✅ Accepted; now Style Dictionary 5 | 2026-01-15 |
| [ADR-003](#adr-003-compound-component-pattern-for-complex-components) | Compound Component Pattern               | ✅ Accepted                         | 2026-01-20 |
| [ADR-004](#adr-004-figma-code-connect-as-primary-design-dev-bridge)   | Figma Code Connect Integration           | ✅ Accepted                         | 2026-01-22 |
| [ADR-005](#adr-005-lit-web-components-for-vue-support)                | Lit Web Components for Vue               | Not built                           | 2026-01-25 |
| [ADR-006](#adr-006-wide-gamut-colors-p3oklch-from-phase-1)            | Wide Gamut Colors from Phase 1           | Accepted, not built                 | 2026-01-28 |
| [ADR-007](#adr-007-turborepo--pnpm-for-monorepo-tooling)              | Turborepo + pnpm Monorepo                | ✅ Accepted                         | 2026-01-10 |
| [ADR-008](#adr-008-system-fonts-over-custom-fonts)                    | System Fonts over Custom Fonts           | ✅ Accepted                         | 2026-02-01 |
| [ADR-009](#adr-009-mit-license-for-open-source-readiness)             | MIT License                              | ✅ Accepted                         | 2026-02-05 |
| [ADR-010](#adr-010-callback-props-for-error-tracking)                 | Callback Props for Error Tracking        | ✅ Accepted                         | 2026-02-05 |

---

## Foundation Decisions

### ADR-001: CSS Variables + CVA for Web Styling

**Status:** ✅ Accepted
**Date:** 2026-01-15
**Decision Makers:** Core Team, Tech Lead

#### Context

We need a styling approach for web components (React, Vue) that:

- Works in SDK environments where consumers control the CSS context
- Supports runtime theming (light/dark mode, customer branding)
- Has zero or minimal runtime JavaScript overhead
- Enables tree-shaking for bundle optimization
- Works with React Server Components

#### Options Considered

| Option                  | Pros                                                     | Cons                                                                            |
| ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **CSS Variables + CVA** | Zero runtime, SSR-safe, native CSS, perfect tree-shaking | Requires CSS Variable support (IE11 excluded)                                   |
| **Tailwind CSS**        | Great DX, tree-shakes well                               | Utility-first not ideal for component library, conflicts with consumer Tailwind |
| **Styled Components**   | Great DX, component co-location                          | Runtime overhead, SSR complexity, bundle size                                   |
| **Emotion**             | Similar to Styled Components                             | Same runtime issues                                                             |
| **CSS Modules**         | Zero runtime, scoped                                     | Less flexible for theming, no variant system                                    |
| **Vanilla Extract**     | Zero runtime, type-safe                                  | Build complexity, newer/less adopted                                            |

#### Decision

Use **CSS Variables for tokens** + **CVA (class-variance-authority)** for component variants.

#### Rationale

1. **Zero runtime cost**: CSS Variables and CVA compile to static CSS/class strings
2. **SDK-friendly**: Consumers can override variables without JS access
3. **SSR/RSC compatible**: No client-side hydration issues
4. **Native platform**: Leverages browser's built-in CSS Variable engine
5. **Excellent DX**: CVA provides type-safe variant props

#### Consequences

**Positive:**

- Bundle size is minimal (CVA is ~1KB)
- Theming is purely CSS-based
- Works in all modern browsers
- RSC compatible out of the box

**Negative:**

- No IE11 support (acceptable for SDK target)
- Developers must learn CVA pattern
- Dynamic styles require CSS Variable manipulation

**Risks:**

- CVA is a relatively new library — mitigated by simple API surface

#### Implementation

```tsx
// Example CVA component
import { cva, type VariantProps } from "class-variance-authority";

const buttonStyles = cva(
  "kozmos-button", // Base class with CSS Variable references
  {
    variants: {
      variant: {
        solid: "kozmos-button--solid",
        outline: "kozmos-button--outline",
        ghost: "kozmos-button--ghost",
      },
      size: {
        sm: "kozmos-button--sm",
        md: "kozmos-button--md",
        lg: "kozmos-button--lg",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  },
);

export type ButtonProps = VariantProps<typeof buttonStyles>;
```

---

### ADR-002: Style Dictionary v4 for Token Generation

**Status:** ✅ Accepted, since superseded in part: the build runs Style Dictionary 5, and writes CSS, JavaScript, Swift and Kotlin; there is no React Native output (token-implementation.md)
**Date:** 2026-01-15
**Decision Makers:** Core Team, Design Lead

#### Context

We need a token transformation pipeline that:

- Generates output for 6 platforms (CSS, Swift, Kotlin, JS, React Native, Figma)
- Supports W3C DTCG token format
- Handles complex token types (composite tokens, references)
- Integrates with Figma Variables

#### Options Considered

| Option                  | Pros                                        | Cons                                  |
| ----------------------- | ------------------------------------------- | ------------------------------------- |
| **Style Dictionary v4** | Industry standard, DTCG support, extensible | Learning curve for custom transforms  |
| **Theo (Salesforce)**   | Simple, battle-tested                       | Less active, no DTCG support          |
| **Token Transformer**   | Figma-native, Tokens Studio integration     | Less flexible output formats          |
| **Custom Solution**     | Full control                                | Maintenance burden, reinventing wheel |

#### Decision

Use **Style Dictionary v4** with DTCG-compliant token structure.

#### Rationale

1. **DTCG compliance**: Future-proof token format
2. **Multi-platform**: Native transforms for all our targets
3. **Extensibility**: Custom transforms for edge cases
4. **Community**: Large ecosystem of plugins and examples
5. **Figma integration**: Works with Variables and Tokens Studio

#### Consequences

**Positive:**

- Single source of truth for all platforms
- Type generation for TypeScript/Swift/Kotlin
- Automatic documentation generation

**Negative:**

- v4 is newer with fewer production examples
- Complex transform pipeline to maintain

---

### ADR-006: Wide Gamut Colors (P3/oklch) from Phase 1

**Status:** Accepted, not built: the tokens are sRGB hex values, with no P3 or oklch colour
**Date:** 2026-01-28
**Decision Makers:** Core Team, Design Lead

#### Context

Modern displays (Apple devices, newer Android, monitors) support wider color gamuts than sRGB. We need to decide whether to:

- Use sRGB only (safe, compatible)
- Use wide gamut with fallbacks (modern, future-proof)

#### Options Considered

| Option                    | Pros                                              | Cons                                        |
| ------------------------- | ------------------------------------------------- | ------------------------------------------- |
| **sRGB only**             | Universal support                                 | Missing 30%+ of display capability          |
| **P3 with sRGB fallback** | Rich colors on modern displays, graceful fallback | More complex token system                   |
| **oklch everywhere**      | Best color space, perceptually uniform            | Newer, requires polyfill for older browsers |

#### Decision

Use **oklch as the primary color space** with **sRGB fallback** using CSS `@supports`.

#### Rationale

1. **Future-proof**: oklch is the recommended color space for design systems
2. **Perceptually uniform**: Better for programmatic color manipulation
3. **Wide gamut support**: Automatic P3/Display P3 on capable devices
4. **Graceful degradation**: CSS `@supports` ensures sRGB fallback

#### Consequences

**Positive:**

- Vibrant colors on modern devices
- Better color accessibility (uniform lightness)
- Ready for future display technology

**Negative:**

- Colors appear slightly different on sRGB displays
- Increased token complexity (two values per color)

#### Implementation

```css
/* Fallback for older browsers */
:root {
  --kozmos-color-brand-primary: #2563eb;
}

/* Modern browsers with oklch support */
@supports (color: oklch(0% 0 0)) {
  :root {
    --kozmos-color-brand-primary: oklch(55% 0.2 260);
  }
}
```

---

## Component Architecture Decisions

### ADR-003: Compound Component Pattern for Complex Components

**Status:** ✅ Accepted
**Date:** 2026-01-20
**Decision Makers:** Core Team

#### Context

Complex components like Modal, Tabs, Select need to:

- Allow flexible composition
- Share state between sub-components
- Maintain accessibility (ARIA relationships)
- Support customization without exposing internals

#### Options Considered

| Option                    | Pros                           | Cons                                  |
| ------------------------- | ------------------------------ | ------------------------------------- |
| **Compound Components**   | Flexible, composable, explicit | Verbose JSX, learning curve           |
| **Render Props**          | Flexible                       | Callback hell, performance concerns   |
| **Monolithic Components** | Simple API                     | Limited customization, prop explosion |
| **Headless UI**           | Maximum flexibility            | Requires more consumer code           |

#### Decision

Use **Compound Component Pattern** with Context for state sharing.

#### Rationale

1. **Explicit structure**: JSX shows component hierarchy
2. **Flexible slots**: Consumers control content placement
3. **Shared state**: Context provides clean state sharing
4. **Type safety**: Each sub-component has typed props
5. **Accessibility**: ARIA relationships are built-in

#### Implementation

```tsx
// Consumer usage
<Modal>
  <Modal.Trigger asChild>
    <Button>Open</Button>
  </Modal.Trigger>
  <Modal.Content>
    <Modal.Title>Confirm Action</Modal.Title>
    <Modal.Description>Are you sure?</Modal.Description>
    <Modal.Close asChild>
      <Button>Close</Button>
    </Modal.Close>
  </Modal.Content>
</Modal>
```

---

### ADR-004: Figma Code Connect as Primary Design-Dev Bridge

**Status:** ✅ Accepted
**Date:** 2026-01-22
**Decision Makers:** Core Team, Design Lead

#### Context

We need to connect Figma designs to production code to:

- Show developers correct code snippets in Figma Dev Mode
- Reduce design-to-code translation errors
- Enable AI-powered code generation

#### Options Considered

| Option                     | Pros                                     | Cons                             |
| -------------------------- | ---------------------------------------- | -------------------------------- |
| **Figma Code Connect**     | Native Figma integration, multi-platform | Requires Figma Organization plan |
| **Storybook Design Addon** | Shows Figma in Storybook                 | One-way (Figma → Storybook only) |
| **Custom Documentation**   | Full control                             | Manual maintenance, drift risk   |
| **Anima/Locofy**           | Auto-generates code                      | Generated code quality varies    |

#### Decision

Use **Figma Code Connect** as the primary bridge, with Storybook as secondary reference.

#### Rationale

1. **Native integration**: Code snippets appear directly in Figma Dev Mode
2. **Multi-platform**: Same Figma component shows React, Swift, Kotlin code
3. **AI-ready**: MCP integration enables AI agents to use design context
4. **Source of truth**: Designers work in Figma, developers see live code

#### Consequences

**Positive:**

- Designers and developers work from same source
- Reduced implementation errors
- AI assistants can generate accurate code

**Negative:**

- Requires Figma Organization tier ($$$)
- Additional maintenance of `.figma.*` files
- Learning curve for Code Connect syntax

---

## Tooling Decisions

### ADR-007: Turborepo + pnpm for Monorepo Tooling

**Status:** ✅ Accepted
**Date:** 2026-01-10
**Decision Makers:** Core Team

#### Context

We need monorepo tooling that:

- Manages 10+ packages efficiently
- Caches builds for CI performance
- Supports multiple languages (TypeScript, Swift, Kotlin)
- Works with existing pnpm workspace

#### Options Considered

| Option               | Pros                               | Cons                                       |
| -------------------- | ---------------------------------- | ------------------------------------------ |
| **Turborepo + pnpm** | Fast, simple config, great caching | Less features than Nx                      |
| **Nx**               | Full-featured, generators, plugins | Complex, overkill for our size             |
| **Lerna**            | Battle-tested                      | Slower, less maintained                    |
| **Rush**             | Enterprise-grade                   | Complex setup, Microsoft-specific patterns |

#### Decision

Use **Turborepo** with **pnpm workspaces**.

#### Rationale

1. **Speed**: Remote caching dramatically speeds up CI
2. **Simplicity**: Minimal configuration compared to Nx
3. **pnpm compatibility**: Native pnpm workspace support
4. **Vercel backing**: Active development and support

#### Consequences

**Positive:**

- 10x faster CI with remote caching
- Simple `turbo.json` configuration
- Works with existing pnpm setup

**Negative:**

- Fewer built-in generators than Nx
- Less mature plugin ecosystem

---

## Platform Decisions

### ADR-005: Lit Web Components for Vue Support

**Status:** Not built. Vue waits (decision 2): `@kozmos-ds/vue` is a private harness that mounts the React components in Vue, and there is no Lit component. The plan is kept in docs/proposals/other-platforms.md
**Date:** 2026-01-25
**Decision Makers:** Core Team

#### Context

We need Vue 3 support for the Dashboard platform. Options:

- Native Vue 3 components (duplicate effort)
- Web Components that work in Vue
- Shared core with Vue wrappers

#### Options Considered

| Option                                | Pros                                                | Cons                            |
| ------------------------------------- | --------------------------------------------------- | ------------------------------- |
| **Lit Web Components + Vue wrappers** | Standards-based, framework-agnostic, works anywhere | Two layers, learning Lit        |
| **Native Vue 3 components**           | Best Vue DX                                         | Duplicate implementation effort |
| **Stencil**                           | Similar to Lit, JSX-like                            | Less adopted than Lit           |
| **Mitosis**                           | Write once, output multiple frameworks              | Experimental, limited features  |

#### Decision

Use **Lit** for framework-agnostic Web Components with thin **Vue 3 wrappers** for idiomatic usage.

#### Rationale

1. **Standards-based**: Web Components work in any framework (Vue, Angular, Svelte, plain HTML)
2. **Small footprint**: Lit base is ~5KB
3. **Vue DX**: Thin wrappers provide v-model, events, slots
4. **Future-proof**: If Dashboard moves to another framework, components still work

#### Consequences

**Positive:**

- Single implementation for multiple frameworks
- Dashboard can adopt incrementally
- Could support Angular/Svelte in future if needed

**Negative:**

- Two layers (Lit + Vue wrapper)
- Some Vue-specific features need wrapper code

---

### ADR-008: System Fonts over Custom Fonts

**Status:** ✅ Accepted
**Date:** 2026-02-01
**Decision Makers:** Core Team, Design Lead

#### Context

Choosing fonts for a SDK that runs in customer apps:

- Custom fonts add bundle size
- Font licensing complexity
- Customer apps may have their own font preferences

#### Options Considered

| Option                    | Pros                          | Cons                     |
| ------------------------- | ----------------------------- | ------------------------ |
| **System fonts**          | Zero bundle size, native feel | Less brand control       |
| **Inter (bundled)**       | Nice open-source font         | Adds ~100KB+ per weight  |
| **Font loading (CDN)**    | No bundle impact              | Network dependency, FOUT |
| **Customer-configurable** | Maximum flexibility           | Complex implementation   |

#### Decision

Use **system font stack** as default, with **token override** for customers who want custom fonts.

#### Rationale

1. **Zero weight**: No fonts bundled in SDK
2. **Native feel**: Uses platform's preferred fonts
3. **Performance**: No font loading delay
4. **Flexibility**: Customers can override via token

#### Implementation

```css
:root {
  --kozmos-font-family-sans:
    system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --kozmos-font-family-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

/* Customer can override */
[data-brand="acme"] {
  --kozmos-font-family-sans: "Acme Brand Font", var(--kozmos-font-family-sans);
}
```

---

## Process Decisions

### ADR-009: MIT License for Open Source Readiness

**Status:** ✅ Accepted
**Date:** 2026-02-05
**Decision Makers:** Leadership, Legal

#### Context

Kozmos may be open-sourced. We need to choose a license that:

- Allows open source distribution
- Permits commercial use by Pointr customers
- Doesn't require consumers to open-source their code

#### Options Considered

| Option           | Pros                               | Cons                          |
| ---------------- | ---------------------------------- | ----------------------------- |
| **MIT**          | Most permissive, widely understood | No patent protection          |
| **Apache 2.0**   | Patent protection, permissive      | More complex, less common     |
| **BSD 3-Clause** | Similar to MIT                     | Less recognized               |
| **LGPL**         | Copyleft for library only          | Complexity, consumer concerns |

#### Decision

Use **MIT License**.

#### Rationale

1. **Maximum adoption**: MIT is the most recognized permissive license
2. **Commercial-friendly**: Customers can use without legal concerns
3. **Simple**: Short, easy to understand
4. **Industry standard**: Most JS libraries use MIT

---

### ADR-010: Callback Props for Error Tracking

**Status:** ✅ Accepted
**Date:** 2026-02-05
**Decision Makers:** Core Team

#### Context

Components may encounter errors (network failures, validation errors). We need to decide how to surface errors to consumers for tracking in their systems (Sentry, Datadog, etc.).

#### Options Considered

| Option                        | Pros                               | Cons                               |
| ----------------------------- | ---------------------------------- | ---------------------------------- |
| **Callback props**            | Consumer controls tracking service | More props to manage               |
| **Built-in integration**      | Zero config for common services    | Dependency bloat, not all services |
| **Global error context**      | Single configuration point         | Magic, less explicit               |
| **Error boundary + callback** | React-native pattern               | Limits implementation options      |

#### Decision

Use **callback props** for error tracking (e.g., `onError`).

#### Rationale

1. **Zero dependencies**: No Sentry/Datadog SDK bundled
2. **Consumer control**: Use any tracking service
3. **Explicit**: Clear where errors go
4. **Type-safe**: Error types are defined

#### Implementation

```tsx
// Consumer usage
<AICompanion
  onError={(error) => {
    Sentry.captureException(error);
    // or Datadog, or custom logger
  }}
/>
```

---

## Decision Template

Use this template for new ADRs:

```markdown
### ADR-XXX: [Title]

**Status:** 🟡 Proposed | ✅ Accepted | ❌ Rejected | 🔄 Superseded by ADR-XXX | ⚫ Deprecated
**Date:** YYYY-MM-DD
**Decision Makers:** [Names/Roles]

#### Context

[Describe the issue that needs a decision. What problem are we solving?
What constraints exist?]

#### Options Considered

| Option       | Pros | Cons |
| ------------ | ---- | ---- |
| **Option A** | ...  | ...  |
| **Option B** | ...  | ...  |
| **Option C** | ...  | ...  |

#### Decision

[State the decision clearly in one sentence.]

#### Rationale

[List the reasons for choosing this option. Number them for clarity.]

1. Reason one
2. Reason two
3. Reason three

#### Consequences

**Positive:**

- Benefit one
- Benefit two

**Negative:**

- Trade-off one
- Trade-off two

**Risks:**

- Risk and mitigation

#### Implementation

[Optional: Show code example or implementation details]

#### Related Decisions

- [ADR-XXX](link): Related decision
```

---

## Version History

| Version | Date       | Changes                           |
| ------- | ---------- | --------------------------------- |
| 1.0.0   | 2026-02-07 | Initial decision log with 10 ADRs |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
