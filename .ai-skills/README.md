# Kozmos Design System - AI Skills Reference

> **Purpose:** This directory contains detailed reference documents for AI agents (Claude, Cursor, Anti Gravity, Copilot, Codeium, Amazon Q, and others) to use when working on the Kozmos Design System. These documents provide deep context that helps AI generate accurate, consistent code and make informed decisions.

---

## Available Skill Documents

### Reference Documents (Conceptual)

| Document                                           | Purpose                                                      | When to Use                                                        |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| [design-philosophy.md](./design-philosophy.md)     | Visual language, interaction patterns, design principles     | Creating new components, reviewing designs, making UX decisions    |
| [component-lifecycle.md](./component-lifecycle.md) | Component stages from proposal to removal                    | Proposing features, understanding stability, planning deprecations |
| [incident-playbook.md](./incident-playbook.md)     | Production incident response, hotfixes, post-mortems         | Debugging issues, publishing urgent fixes, rollback decisions      |
| [code-patterns.md](./code-patterns.md)             | Templates for all 6 platforms (React, Vue, iOS, Android, RN) | Scaffolding new components, ensuring consistency across platforms  |
| [troubleshooting.md](./troubleshooting.md)         | Common issues and solutions by category                      | Debugging build errors, component issues, CI/CD failures           |

### Maintenance & Evolution Documents

| Document                                                 | Purpose                                            | When to Use                                                       |
| -------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| [migration-guide.md](./migration-guide.md)               | Version upgrades and implementation migrations     | Upgrading major versions, migrating from custom implementations   |
| [api-changelog.md](./api-changelog.md)                   | API changes, deprecations, breaking changes        | Tracking what changed between versions, planning migrations       |
| [decision-log.md](./decision-log.md)                     | Architecture Decision Records (ADRs)               | Understanding why decisions were made, proposing new decisions    |
| [performance-benchmarks.md](./performance-benchmarks.md) | Bundle size budgets, runtime metrics, optimization | Ensuring performance standards, catching regressions              |
| [platform-mapping.md](./platform-mapping.md)             | Cross-platform component and prop mapping          | Implementing features across platforms, understanding differences |
| [figma-audit.md](./figma-audit.md)                       | Figma component checklists for designers           | Preparing components for Code Connect, ensuring quality           |

### Technical Implementation Documents (Executable)

| Document                                                     | Purpose                                             | When to Use                                                    |
| ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------- |
| [getting-started.md](./getting-started.md)                   | Development environment setup, project structure    | Setting up the project from scratch, onboarding new developers |
| [component-creation-guide.md](./component-creation-guide.md) | Step-by-step component creation for all platforms   | Creating new components, following correct patterns            |
| [token-implementation.md](./token-implementation.md)         | Style Dictionary configuration, DTCG format, output | Setting up tokens, modifying token pipeline                    |
| [testing-patterns.md](./testing-patterns.md)                 | Platform-specific test examples, setup              | Writing tests, ensuring quality                                |
| [ci-cd-configuration.md](./ci-cd-configuration.md)           | GitHub Actions workflows, secrets, automation       | Setting up CI/CD, debugging pipelines                          |
| [publishing-guide.md](./publishing-guide.md)                 | npm, SPM, Maven publishing steps                    | Releasing packages, managing versions                          |
| [storybook-guide.md](./storybook-guide.md)                   | Storybook setup, addons, documentation              | Component development environment                              |
| [accessibility-guide.md](./accessibility-guide.md)           | WCAG 2.1 AA compliance, component checklists        | Ensuring accessibility standards                               |
| [i18n-guide.md](./i18n-guide.md)                             | Internationalization, RTL support, translations     | Multi-language implementation                                  |
| [theming-guide.md](./theming-guide.md)                       | White-labeling, customer themes, dark mode          | Theme customization                                            |
| [security-guide.md](./security-guide.md)                     | Security hardening, vulnerability prevention        | Secure component patterns                                      |

### AI Integration Documents

| Document                                                     | Purpose                                                                | When to Use                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| [mcp-server-specification.md](./mcp-server-specification.md) | MCP server design for `@kozmos-ds/mcp-server` package                  | Building AI-powered tooling, integrating with Claude/Cursor |
| [ai-integration-guide.md](./ai-integration-guide.md)         | Context files for Claude, Cursor, Anti Gravity, Copilot, Codeium, etc. | Setting up AI agents in consuming projects                  |

### Master Reference

| Document                                | Purpose                                       | When to Use                                          |
| --------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| [project-scope.md](../PROJECT_SCOPE.md) | Complete project specification (3,900+ lines) | Understanding architecture, tokens, platforms, CI/CD |

---

## Quick Context for AI Agents

### What is Kozmos?

Kozmos is a multi-platform design system for **Pointr's indoor navigation SDK**. It provides:

- **6 platforms:** React, Vue 3, iOS (SwiftUI), Android (Compose), React Native, Dashboard
- **60+ components** from primitives (Button, Input) to SDK-specific (MapView, WayfindingCard, AI Companion)
- **Design tokens** using Style Dictionary v4 with DTCG compliance and wide-gamut color support
- **Figma integration** via Code Connect for design-to-code accuracy

### Key Technical Decisions

| Area              | Decision                             |
| ----------------- | ------------------------------------ |
| Styling (Web)     | CSS Variables + CVA (zero runtime)   |
| Tokens            | Style Dictionary v4 + DTCG format    |
| Colors            | Wide gamut P3/oklch for all colors   |
| Monorepo          | Turborepo + pnpm                     |
| Build (React)     | tsup (ESM + CJS)                     |
| Testing           | Vitest + Testing Library + axe-core  |
| Visual Regression | Chromatic                            |
| Figma             | Code Connect for 5 platforms         |
| i18n              | 13+ languages including RTL (Arabic) |

### npm Packages

```
@kozmos-ds/tokens            - Design tokens (CSS vars, Swift, Kotlin)
@kozmos-ds/react             - React components
@kozmos-ds/icons             - Cross-platform icons
@kozmos-ds/product-contracts - The presentation contracts the SDK components take
```

Four, and only four. `@kozmos-ds/vue` exists in the workspace but is
**private** — an internal harness for checking the components render outside
React, not something to install. There is no React Native package. SwiftUI and
Compose ship as source in `packages/ios` and `packages/android`, not on npm.

### File Structure

```
kozmos-design-system-dev/
├── packages/
│   ├── tokens/          # Style Dictionary source
│   ├── react/           # React components + Storybook
│   ├── ios/             # SwiftUI components (SPM)
│   ├── android/         # Compose components (Gradle)
│   ├── react-native/    # RN components
│   ├── vue/             # Lit Web Components + Vue wrappers
│   └── icons/           # SVG source + generated icons
├── apps/
│   └── docs/            # Documentation site
├── .ai-skills/          # This directory
└── PROJECT_SCOPE.md     # Full specification
```

---

## How to Use These Documents

### For Code Generation

When generating component code, reference:

1. **code-patterns.md** - Ready-to-use templates for all 6 platforms
2. **design-philosophy.md** - For interaction patterns and visual guidelines
3. **PROJECT_SCOPE.md §5** - For component API patterns (CVA, compound components)
4. **PROJECT_SCOPE.md §8** - For platform-specific patterns

### For Decision Making

When making architectural decisions, reference:

1. **PROJECT_SCOPE.md §28** - Decisions already made
2. **design-philosophy.md** - Design decision framework
3. **component-lifecycle.md** - For component maturity decisions

### For Issue Response

When debugging or fixing issues, reference:

1. **troubleshooting.md** - Quick solutions for common issues
2. **incident-playbook.md** - For severity assessment and response process
3. **PROJECT_SCOPE.md §15** - For security considerations
4. **PROJECT_SCOPE.md Appendix G** - For CI/CD details

### For Version Upgrades

When planning or executing version migrations:

1. **migration-guide.md** - Step-by-step upgrade process
2. **api-changelog.md** - What changed between versions
3. **decision-log.md** - Why breaking changes were made

### For Performance Optimization

When optimizing or measuring performance:

1. **performance-benchmarks.md** - Budgets and baselines
2. **code-patterns.md** - Performance-optimized patterns
3. **troubleshooting.md §13** - Performance issue solutions

### For Cross-Platform Development

When implementing across multiple platforms:

1. **platform-mapping.md** - Component and prop equivalents
2. **code-patterns.md** - Platform-specific templates
3. **PROJECT_SCOPE.md §8** - Platform considerations

### For Figma/Design Work

When preparing Figma components or reviewing designs:

1. **figma-audit.md** - Component quality checklists
2. **design-philosophy.md** - Visual language principles
3. **PROJECT_SCOPE.md §6** - Code Connect requirements

### For AI Integration in Consuming Projects

When setting up AI agents in projects that use Kozmos:

1. **ai-integration-guide.md** - Context files for all major AI agents
2. **mcp-server-specification.md** - MCP server integration for Claude/Cursor

Supported AI agents:

- **Claude** (Claude Desktop, Claude Code, claude.ai)
- **Cursor** (IDE with AI)
- **Anti Gravity** (Custom agent platform)
- **GitHub Copilot** (VS Code, JetBrains)
- **Codeium** (Multi-IDE)
- **Amazon Q** (AWS-focused)
- **JetBrains AI** (IntelliJ, WebStorm)
- **Tabnine** (Multi-IDE)
- **Sourcegraph Cody** (Code intelligence)

---

## Example AI Prompts

### Creating a New Component

```
Using the Kozmos design system patterns from .ai-skills/code-patterns.md
and PROJECT_SCOPE.md §5, create a Tooltip component for React that:
- Uses CVA for variants
- Follows the compound component pattern
- Includes proper ARIA attributes
- Has Storybook stories
- Includes a Code Connect mapping
```

### Reviewing a PR

```
Review this PR against:
1. Kozmos design philosophy (.ai-skills/design-philosophy.md)
2. Component lifecycle requirements (.ai-skills/component-lifecycle.md)
3. Accessibility requirements (PROJECT_SCOPE.md §12)
4. Testing requirements (PROJECT_SCOPE.md §9)
```

### Handling an Incident

```
A consumer reported that Button is crashing on iOS 16.
Using .ai-skills/incident-playbook.md:
1. Assess severity (P0-P3)
2. Determine fix vs. rollback
3. Draft communication
```

---

## Keeping Documents Updated

These documents should be updated when:

- New architectural decisions are made
- Processes change
- Post-mortems identify gaps
- New platforms or tools are added

**Maintainer:** Kozmos Design System Core Team
**Last updated:** 2026-02-08
