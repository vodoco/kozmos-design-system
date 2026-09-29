# Kozmos Design System - AI Skills Reference

> **Purpose:** This directory contains detailed reference documents for AI agents (Claude, Cursor, Anti Gravity, Copilot, Codeium, Amazon Q, and others) to use when working on the Kozmos Design System. These documents provide deep context that helps AI generate accurate, consistent code and make informed decisions.

---

## Start with the facts

These are generated from the code, and `pnpm skills:check` fails when they and the code disagree.
Where anything else here disagrees with them, they are right.

| Document                                              | What it holds                                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [component-inventory.md](./component-inventory.md)    | Every component, whether SwiftUI and Compose have it, and every value each variant prop accepts, from the types |
| [docs/claude-design](../docs/claude-design/README.md) | Consuming Kozmos, and one API card per component: every prop and an example that compiles                       |
| [api-changelog.md](./api-changelog.md)                | What changed in each release, from each package's own changelog                                                 |
| [docs/status.md](../docs/status.md)                   | Which components exist on which platform, and which link to Figma                                               |

---

## Available Skill Documents

### Reference Documents (Conceptual)

| Document                                           | Purpose                                                   | When to Use                                                        |
| -------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| [design-philosophy.md](./design-philosophy.md)     | Visual language, interaction patterns, design principles  | Creating new components, reviewing designs, making UX decisions    |
| [component-lifecycle.md](./component-lifecycle.md) | Component stages from proposal to removal                 | Proposing features, understanding stability, planning deprecations |
| [incident-playbook.md](./incident-playbook.md)     | Production incident response, hotfixes, post-mortems      | Debugging issues, publishing urgent fixes, rollback decisions      |
| [code-patterns.md](./code-patterns.md)             | The real component to follow for each shape, per platform | Scaffolding new components, ensuring consistency across platforms  |
| [troubleshooting.md](./troubleshooting.md)         | Common issues and solutions by category                   | Debugging build errors, component issues, CI/CD failures           |

### Maintenance & Evolution Documents

| Document                                                 | Purpose                                                  | When to Use                                                       |
| -------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| [migration-guide.md](./migration-guide.md)               | Upgrading between releases, moving an app to Kozmos      | Upgrading Kozmos, migrating from custom implementations           |
| [api-changelog.md](./api-changelog.md)                   | API changes, deprecations, breaking changes              | Tracking what changed between versions, planning migrations       |
| [decision-log.md](./decision-log.md)                     | Architecture Decision Records (ADRs)                     | Understanding why decisions were made, proposing new decisions    |
| [performance-benchmarks.md](./performance-benchmarks.md) | The bundle budgets CI enforces, and what is not measured | Ensuring performance standards, catching regressions              |
| [platform-mapping.md](./platform-mapping.md)             | Cross-platform component and prop mapping                | Implementing features across platforms, understanding differences |
| [figma-audit.md](./figma-audit.md)                       | Figma component checklists for designers                 | Preparing components for Code Connect, ensuring quality           |

### Technical Implementation Documents (Executable)

| Document                                                     | Purpose                                                    | When to Use                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| [getting-started.md](./getting-started.md)                   | Development environment setup, project structure           | Setting up the project from scratch, onboarding new developers |
| [component-creation-guide.md](./component-creation-guide.md) | Step-by-step component creation for all platforms          | Creating new components, following correct patterns            |
| [token-implementation.md](./token-implementation.md)         | The token source, build, outputs and checks                | Setting up tokens, modifying token pipeline                    |
| [testing-patterns.md](./testing-patterns.md)                 | The tests on each platform, with excerpts of real ones     | Writing tests, ensuring quality                                |
| [ci-cd-configuration.md](./ci-cd-configuration.md)           | GitHub Actions workflows, secrets, automation              | Setting up CI/CD, debugging pipelines                          |
| [publishing-guide.md](./publishing-guide.md)                 | The npm release; SwiftUI and Compose are not published     | Releasing packages, managing versions                          |
| [storybook-guide.md](./storybook-guide.md)                   | Storybook setup, addons, documentation                     | Component development environment                              |
| [accessibility-guide.md](./accessibility-guide.md)           | WCAG 2.1 AA compliance, component checklists               | Ensuring accessibility standards                               |
| [i18n-guide.md](./i18n-guide.md)                             | Direction, and the words a product passes to the parts     | Multi-language implementation                                  |
| [theming-guide.md](./theming-guide.md)                       | Light and dark on each platform; the web's token overrides | Theme customization                                            |
| [security-guide.md](./security-guide.md)                     | Security hardening, vulnerability prevention               | Secure component patterns                                      |

### AI Integration Documents

| Document                                              | Purpose                                                            | When to Use                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| [ai-integration-guide.md](./ai-integration-guide.md)  | What an assistant should read, and a context file for your project | Setting up AI agents in consuming projects              |
| [docs/claude-design](../docs/claude-design/README.md) | Consuming Kozmos, and one API card per component, generated        | Designing with Kozmos in Claude Design, mounting a part |

### Proposals: not built

| Document                                      | Purpose                                                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/proposals](../docs/proposals/README.md) | Designs kept as planning history: an MCP server, an AI setup command, other platforms, customer themes, and the templates, tests and budgets these guides once presented as fact |

Nothing there exists: no package, command or API it names is built. It lives outside this
directory so that nothing here describes something that is not.

### The original specification

| Document                                     | Purpose                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [project-scope.md](../docs/project-scope.md) | The original specification, written before the code. Where the two disagree, the code is right |

---

## Quick Context for AI Agents

### What is Kozmos?

Kozmos is a multi-platform design system for **Pointr's indoor navigation SDK**. It provides:

- **3 platforms:** React, SwiftUI (iOS) and Jetpack Compose (Android). Vue waits: `@kozmos-ds/vue`
  is a private harness that mounts the React components in Vue, not a package to install. There
  is no React Native package.
- **Components** from primitives (Button, Input) to SDK-specific ones (MapView, WayfindingCard, the
  AI Companion): [component-inventory.md](./component-inventory.md) lists every one.
- **Design tokens** in the DTCG format, built with Style Dictionary 5 into CSS, JavaScript, Swift
  and Kotlin.
- **Figma integration** through Code Connect, on all three platforms.

### Key Technical Decisions

| Area              | Decision                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Styling (Web)     | Token CSS variables; CVA recipes of Tailwind role classes and owned CSS, in one stylesheet scoped to `ThemeProvider` |
| Tokens            | Style Dictionary 5 + DTCG format                                                                                     |
| Monorepo          | Turborepo + pnpm                                                                                                     |
| Build (React)     | Vite library mode (ES modules + UMD)                                                                                 |
| Testing           | Vitest + Testing Library + axe-core                                                                                  |
| Visual Regression | Own visual review (`tests/visual`)                                                                                   |
| Figma             | Code Connect for React, SwiftUI and Compose                                                                          |
| i18n              | RTL through `dir="rtl"` on `ThemeProvider`; a component's words are its props                                        |

### npm Packages

```
@kozmos-ds/tokens            - Design tokens (CSS vars, Swift, Kotlin)
@kozmos-ds/react             - React components
@kozmos-ds/icons             - React icon components and the icon name registry
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
│   ├── tokens/              # The design tokens: DTCG source, CSS, JS, Swift and Kotlin output
│   ├── react/               # React components
│   ├── icons/               # SVG source and the generated icon components
│   ├── product-contracts/   # The shapes a product passes the Product / SDK components
│   ├── ios/                 # SwiftUI components (Swift package, library Kozmos)
│   ├── android/             # Compose components (Gradle module, com.kozmos)
│   └── vue/                 # Private: mounts the React components in Vue
├── apps/
│   ├── docs/                # Storybook
│   └── site/                # The website
├── docs/
│   ├── claude-design/       # Consuming Kozmos, and an API card per component, generated
│   ├── proposals/           # Designs that are not built
│   └── project-scope.md     # The original specification
└── .ai-skills/              # This directory
```

---

## How to Use These Documents

Where a document here or `docs/project-scope.md` disagrees with the generated facts above, or with
the code, the facts and the code are right.

### For Code Generation

When generating component code, reference:

1. **docs/claude-design/** - Every component's props and an example that compiles, generated
2. **code-patterns.md** - The real component to follow for each shape, on each platform
3. **component-creation-guide.md** - The steps, commands and checks for a new component
4. **design-philosophy.md** - For interaction patterns and visual guidelines

### For Decision Making

When making architectural decisions, reference:

1. **decision-log.md** - The architecture decisions, and what was built of each
2. **design-philosophy.md** - Design decision framework
3. **component-lifecycle.md** - For component maturity decisions

### For Issue Response

When debugging or fixing issues, reference:

1. **troubleshooting.md** - Quick solutions for common issues
2. **incident-playbook.md** - For severity assessment and response process
3. **security-guide.md** - For security considerations
4. **ci-cd-configuration.md** - For what CI runs and how a release is made
   (docs/project-scope.md's Appendix G describes workflows and secrets this repository does not
   have)

### For Version Upgrades

When planning or executing version migrations:

1. **migration-guide.md** - Step-by-step upgrade process
2. **api-changelog.md** - What changed between versions
3. **decision-log.md** - Why breaking changes were made

### For Performance Optimization

When optimizing or measuring performance:

1. **performance-benchmarks.md** - The budgets CI enforces, and what is not measured
2. **troubleshooting.md §13** - Performance issue solutions

### For Cross-Platform Development

When implementing across multiple platforms:

1. **platform-mapping.md** - Component and prop equivalents
2. **code-patterns.md** - The conventions on each platform
3. **docs/status.md** - Which components exist on which platform, generated

### For Figma/Design Work

When preparing Figma components or reviewing designs:

1. **figma-audit.md** - Component quality checklists
2. **design-philosophy.md** - Visual language principles
3. **component-creation-guide.md §8** - Code Connect setup, and the commands that parse it

### For AI Integration in Consuming Projects

When setting up AI agents in projects that use Kozmos:

1. **ai-integration-guide.md** - What an assistant should read, and a context file for the project
2. **docs/claude-design/** - The API cards, for Claude Design and any assistant

Any assistant that reads a project instructions file (`CLAUDE.md`, `AGENTS.md`,
`.github/copilot-instructions.md`) or can be handed files can use them. There is no Kozmos MCP
server or setup command: see docs/proposals.

---

## Example AI Prompts

### Creating a New Component

```
Using .ai-skills/code-patterns.md and .ai-skills/component-creation-guide.md,
create a Carousel component for React that:
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
3. Accessibility requirements (.ai-skills/accessibility-guide.md)
4. Testing requirements (.ai-skills/testing-patterns.md)
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
**Last updated:** 2026-09-29
