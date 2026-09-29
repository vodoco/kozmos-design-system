# Contributing to Kozmos Design System

Thank you for your interest in contributing to the Kozmos Design System! This document provides guidelines and instructions for contributing.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Component Guidelines](#component-guidelines)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Release Process](#release-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct inappropriate in a professional setting

Report violations to: kozmos-maintainers@pointr.tech

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/vodoco/kozmos-design-system.git
cd kozmos-design-system

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Project Structure

```
kozmos-design-system/
├── packages/
│   ├── tokens/        # Design tokens (Style Dictionary)
│   ├── react/         # React components
│   ├── vue/           # Vue 3 components
│   ├── ios/           # SwiftUI components
│   ├── android/       # Jetpack Compose components
│   ├── react-native/  # React Native components
│   └── icons/         # Icon library
├── apps/
│   └── docs/          # Documentation site
└── .ai-skills/        # AI agent reference docs
```

---

## Development Workflow

### Branch Naming

```
feature/   - New features (feature/button-loading-state)
fix/       - Bug fixes (fix/input-focus-ring)
docs/      - Documentation (docs/button-examples)
refactor/  - Code refactoring (refactor/token-structure)
chore/     - Maintenance (chore/update-dependencies)
```

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**

```
feat(button): add loading state variant
fix(input): correct focus ring color in dark mode
docs(readme): update installation instructions
```

### Development Commands

```bash
# Start Storybook (React)
pnpm --filter @kozmos-ds/react storybook

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Type check
pnpm typecheck

# Build all packages
pnpm build

# Build specific package
pnpm --filter @kozmos-ds/tokens build
```

---

## Pull Request Process

### Before Submitting

1. **Create an issue first** for significant changes
2. **Fork and clone** the repository
3. **Create a branch** from `main`
4. **Make your changes** following our guidelines
5. **Test thoroughly** (unit, visual, accessibility)
6. **Update documentation** if needed

### PR Requirements

- [ ] Descriptive title following commit conventions
- [ ] Clear description of changes
- [ ] Link to related issue(s)
- [ ] All tests passing
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Changeset added (for packages)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues

Fixes #123

## Testing

- [ ] Unit tests added/updated
- [ ] Visual tests pass (`pnpm test:visual`; record intended changes with `pnpm test:visual:update`)
- [ ] Accessibility tests pass
- [ ] Tested in Storybook

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Added changeset if needed
- [ ] Updated documentation
```

### Review Process

1. **Automated checks** must pass. Branch protection on `main` requires all 19 checks a pull
   request runs: CI's web build and tests, its twelve browser shards, the Android build and the iOS
   build, the bundle budget (`analyze-bundle`), Lighthouse's accessibility audit (`lighthouse`) and
   "Visual Review". The iOS build runs when a pull request touches what it builds (`packages/ios`,
   `packages/tokens`, its scripts, `ci.yml` or the dependencies) and is skipped, which counts as
   passing, otherwise; every push to `main` builds it. A pull request opened against another
   branch and then retargeted to `main` has no `analyze-bundle` or `lighthouse` run, because both
   run only for pull requests into `main`: push to it, or close and reopen it.

   A pull request must be **up to date with `main`** to merge, so its checks have run against the
   `main` it merges into and two pull requests that are each green cannot break `main` together.
   When `main` moves, update the branch (`gh pr update-branch <n>`, or "Update branch") and the
   checks run again; auto-merge then merges it once they pass. (A merge queue would do this
   automatically, but GitHub offers merge queues only to organisations, and this repository belongs
   to a personal account.)

2. **Code review** by at least one maintainer
3. **Visual review** for component changes: the "Visual Review" check compares every story with
   its committed baseline, and intended changes show in "Files changed" (see
   [docs/visual-review.md](docs/visual-review.md))
4. **Approval** from maintainer
5. **Merge with a merge commit** once all 19 checks pass on a branch that is up to date with `main`
   (`gh pr merge <n> --merge`, or auto-merge, which waits for them)

---

## Coding Standards

### TypeScript

```typescript
// Use explicit types
function Button(props: ButtonProps): React.ReactElement;

// Use interfaces for objects
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
}

// Use const assertions
const VARIANTS = ["primary", "secondary"] as const;

// Avoid any - use unknown if necessary
function handleData(data: unknown): void;
```

### React

```tsx
// Use function components
export function Button({ variant = "primary", children }: ButtonProps) {
  return <button className={styles[variant]}>{children}</button>;
}

// Use forwardRef for DOM refs
export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Use compound components for complex UIs
<Select>
  <Select.Trigger />
  <Select.Content>
    <Select.Option value="1">Option 1</Select.Option>
  </Select.Content>
</Select>;
```

### CSS

```css
/* Use CSS custom properties from tokens */
.button {
  background-color: var(--kozmos-color-primary);
  padding: var(--kozmos-spacing-3) var(--kozmos-spacing-4);
  border-radius: var(--kozmos-radius-md);
}

/* Use logical properties for RTL support */
.card {
  margin-inline-start: var(--kozmos-spacing-4);
  padding-block: var(--kozmos-spacing-3);
}

/* Mobile-first responsive */
.container {
  padding: var(--kozmos-spacing-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--kozmos-spacing-6);
  }
}
```

---

## Component Guidelines

### Component Structure

```
Button/
├── Button.tsx           # Component implementation
├── Button.styles.css    # Component styles
├── Button.stories.tsx   # Storybook stories
├── Button.test.tsx      # Unit tests
├── Button.figma.tsx     # Code Connect mapping
└── index.ts             # Public exports
```

### Component Requirements

1. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Focus management

2. **Theming**
   - Use design tokens
   - Support light/dark modes
   - Support customer theming

3. **Internationalization**
   - RTL layout support
   - Externalized strings
   - Locale-aware formatting

4. **Performance**
   - Minimal bundle size
   - No unnecessary re-renders
   - Lazy loading where appropriate

### Prop Conventions

```typescript
interface ComponentProps {
  // Variant props (appearance)
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";

  // State props
  disabled?: boolean;
  loading?: boolean;

  // Content props
  children?: React.ReactNode;
  label?: string;

  // Event handlers
  onClick?: () => void;
  onChange?: (value: string) => void;

  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

---

## Testing Requirements

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Accessibility Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Accessible</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Coverage Requirements

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 80%     |
| Branches   | 80%     |
| Functions  | 80%     |
| Lines      | 80%     |

---

## Documentation

### Component Documentation

Every component needs:

1. **Storybook stories** with all variants
2. **JSDoc comments** on props
3. **Usage examples** in docs
4. **Accessibility notes**

### Story Template

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};
```

---

## Release Process

### Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
# Add a changeset for your changes
pnpm changeset

# Follow prompts:
# 1. Select packages that changed
# 2. Choose bump type (patch/minor/major)
# 3. Write summary of changes
```

**Every pull request that changes what a published package ships carries a changeset naming that
package** — `@kozmos-ds/react`, `@kozmos-ds/icons`, `@kozmos-ds/product-contracts` or
`@kozmos-ds/tokens`. "Ships" means its `src/` apart from tests, stories, `.mdx` pages and Code Connect
files, the build files beside it (`tsconfig*.json`, `vite.config.*` and the like), the files outside
it that its build runs or extends, and the consumer-facing fields of its `package.json`:

- **Files outside the package:** each file its build script names, each tsconfig its tsconfig
  extends, and what those import. The check reads them from the packages, so today that is
  `scripts/emit-format-declarations.mjs` (the react, icons and product-contracts builds run it)
  and `tsconfig.base.json` (the icons and product-contracts tsconfigs extend it). An edit to one
  needs a changeset for every package that reads it.
- **`package.json`:**
  - how it resolves (`type`, `exports`, `imports`, `main`, `module`, `browser`, `types`, `bin`,
    `sideEffects`);
  - what installs with it (the dependency fields, `engines`, `os`, `cpu`);
  - what it packs and how it publishes (`files`, `publishConfig`);
  - `browserslist`;
  - the scripts that build and pack it (`build`, `prepack`, `prepare`, `postpack`, the install
    scripts, and any script they run).

  A version bump alone, or a change to `test`, `lint` or `devDependencies`, needs none.

CI's "Web Build & Test" fails a pull request without
one (`scripts/release/changeset-required.mjs`; run it yourself with
`node scripts/release/changeset-required.mjs`). If a change genuinely needs no release, say so with
an empty changeset: `pnpm changeset --empty`. React pins its siblings exactly, so a react change that
needs a new icon or contract field needs their changesets too.

A Dependabot pull request that bumps a published package's runtime `dependencies` needs one too
(consumers install the new version): push a patch changeset to its branch. Bumps of
`devDependencies` need none.

### Version Bumps

| Type    | When to Use                        |
| ------- | ---------------------------------- |
| `patch` | Bug fixes, documentation           |
| `minor` | New features (backward compatible) |
| `major` | Breaking changes                   |

### Release Workflow

Releases are deliberate, not automatic; [docs/release-process.md](docs/release-process.md) is the
full procedure. In short:

1. PRs merged to `main` accumulate changesets (private packages are not versioned).
2. A **version PR** runs `pnpm version-packages`, writes `release/plan.json` (the exact packages,
   versions and npm tag it approves) and `pnpm skills:build`; it is reviewed and merged like any PR.
3. Once `main`'s CI on that merge is green, `pnpm release:preflight <sha> <ci-run-id>` makes the
   release job's checks in advance and prints the dispatch command.
4. The owner dispatches **Release Kozmos System** and approves the `npm-release` deployment; the
   workflow publishes the tested tarballs with npm provenance.
5. `pnpm release:tag <sha>` creates the git tags and GitHub Releases, with each version's
   changelog as the notes. It first checks that every tag and release already there points at
   `<sha>`. Only a stable React release on `latest` is marked Latest, and a prerelease version is
   a GitHub prerelease.

---

## Questions?

- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues
- **Email**: kozmos-maintainers@pointr.tech

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Kozmos Design System!**
