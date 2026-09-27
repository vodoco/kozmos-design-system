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
git clone https://github.com/AirGateway/kozmos-design-system.git
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
- [ ] Visual tests pass
- [ ] Accessibility tests pass
- [ ] Tested in Storybook

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Added changeset if needed
- [ ] Updated documentation
```

### Review Process

1. **Automated checks** must pass (CI, tests, linting)
2. **Code review** by at least one maintainer
3. **Visual review** for component changes (Chromatic)
4. **Approval** from maintainer
5. **Squash and merge** to main

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

### Version Bumps

| Type    | When to Use                        |
| ------- | ---------------------------------- |
| `patch` | Bug fixes, documentation           |
| `minor` | New features (backward compatible) |
| `major` | Breaking changes                   |

### Release Workflow

1. PRs merged to `main` accumulate changesets
2. Release PR auto-created by Changesets bot
3. Maintainer reviews and merges release PR
4. CI publishes packages to npm
5. GitHub release created automatically

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
