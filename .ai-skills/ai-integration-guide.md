# Kozmos Design System - AI Integration Guide

> **Purpose:** This document provides configuration templates and integration guides for using Kozmos Design System with various AI coding assistants including Claude, Cursor, Anti Gravity, GitHub Copilot, and others.

---

## Table of Contents

1. [Overview](#1-overview)
2. [MCP Server Integration](#2-mcp-server-integration)
3. [Claude Integration](#3-claude-integration)
4. [Cursor Integration](#4-cursor-integration)
5. [Anti Gravity Integration](#5-anti-gravity-integration)
6. [GitHub Copilot Integration](#6-github-copilot-integration)
7. [Other AI Agents](#7-other-ai-agents)
8. [Context File Templates](#8-context-file-templates)
9. [Project Setup Script](#9-project-setup-script)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

### Integration Methods

| Method                | Agents Supported             | Features                       | Setup Complexity |
| --------------------- | ---------------------------- | ------------------------------ | ---------------- |
| **MCP Server**        | Claude, Cursor, Anti Gravity | Full tools, resources, prompts | Medium           |
| **Context Files**     | All agents                   | Static documentation           | Low              |
| **VS Code Extension** | Copilot, Codeium             | IntelliSense + snippets        | Low              |
| **Custom Prompts**    | All agents                   | Standardized instructions      | Low              |

### Quick Start

```bash
# For MCP-compatible agents (Claude, Cursor, Anti Gravity)
pnpm add -D @kozmos/mcp-server
npx kozmos-ai-setup

# For all agents (adds context files)
npx kozmos-ai-setup --all
```

---

## 2. MCP Server Integration

### Installation

```bash
# Install MCP server
pnpm add -D @kozmos/mcp-server

# Or globally
npm install -g @kozmos/mcp-server
```

### Verification

```bash
# Test the MCP server
npx @kozmos/mcp-server --test

# Output:
# ✅ Kozmos MCP Server v1.0.0
# ✅ Found @kozmos/tokens
# ✅ Found @kozmos/react
# ✅ Loaded 45 components
# ✅ Loaded 156 tokens
# ✅ Ready for connections
```

### Available Tools

| Tool                         | Description                            |
| ---------------------------- | -------------------------------------- |
| `kozmos_get_component`       | Get component details, props, examples |
| `kozmos_get_token`           | Get token values for any platform      |
| `kozmos_search_tokens`       | Search tokens by name or value         |
| `kozmos_scaffold_component`  | Generate component code                |
| `kozmos_validate_code`       | Check code against patterns            |
| `kozmos_list_components`     | List all available components          |
| `kozmos_get_pattern`         | Get code patterns and best practices   |
| `kozmos_check_accessibility` | Audit accessibility                    |

---

## 3. Claude Integration

### Claude Desktop Configuration

Create or update `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos/mcp-server"],
      "env": {
        "KOZMOS_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

### Claude Code Configuration

Create `.claude/settings.json` in your project root:

```json
{
  "mcpServers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos/mcp-server"],
      "cwd": "."
    }
  }
}
```

### Claude Code with CLAUDE.md

Create `CLAUDE.md` in your project root for additional context:

```markdown
# Project Context

This project uses the **Kozmos Design System** for UI components.

## Design System

- Use components from `@kozmos/react` (or platform-specific packages)
- Never use hardcoded colors - always use Kozmos tokens
- Follow the compound component pattern for complex components
- All components must pass accessibility tests

## MCP Server

The Kozmos MCP server is available. Use these tools:

- `kozmos_get_component` - Look up any component
- `kozmos_get_token` - Get token values
- `kozmos_scaffold_component` - Generate new components
- `kozmos_validate_code` - Validate your code

## Key Patterns

1. Import components: `import { Button, Input } from '@kozmos/react'`
2. Use tokens via CSS variables: `var(--kozmos-color-text-primary)`
3. Use CVA for variants
4. Follow compound component pattern for Modal, Tabs, etc.

## File Structure
```

src/
├── components/ # Use Kozmos components here
├── features/ # Feature-specific code
└── pages/ # Page components

```

```

### Claude Projects Integration

For Claude Projects, add the `.ai-skills` directory contents:

1. Upload key skill files as Project Knowledge
2. Configure MCP server in project settings
3. Add custom instructions referencing Kozmos patterns

---

## 4. Cursor Integration

### MCP Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "servers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos/mcp-server"],
      "cwd": "${workspaceFolder}",
      "env": {}
    }
  }
}
```

### Cursor Rules

Create `.cursor/rules.md` for Cursor-specific instructions:

```markdown
# Cursor Rules for Kozmos Project

## Component Development

When creating or modifying components:

1. ALWAYS use Kozmos components from `@kozmos/react`
2. NEVER hardcode colors, spacing, or typography values
3. Use the `kozmos_get_component` tool to check component APIs
4. Use the `kozmos_scaffold_component` tool for new components

## Token Usage

- Check token existence with `kozmos_get_token` before using
- Use CSS variables: `var(--kozmos-color-*)`
- For dynamic values, use token constants

## Code Quality

Before completing any component:

1. Run `kozmos_validate_code` to check patterns
2. Run `kozmos_check_accessibility` to verify a11y
3. Ensure all props match Kozmos conventions

## File Patterns

- Components: `src/components/ComponentName/ComponentName.tsx`
- Tests: `src/components/ComponentName/ComponentName.test.tsx`
- Stories: `src/components/ComponentName/ComponentName.stories.tsx`
```

### Cursor Settings

Add to `.cursor/settings.json`:

```json
{
  "ai": {
    "contextFiles": [
      ".ai-skills/code-patterns.md",
      ".ai-skills/design-philosophy.md"
    ],
    "customInstructions": "Always use Kozmos Design System components and tokens. Check component APIs with the kozmos MCP tools."
  }
}
```

---

## 5. Anti Gravity Integration

### Configuration

Create `antigravity.config.yaml` in your project root:

```yaml
# Anti Gravity Configuration for Kozmos

mcp:
  servers:
    - name: kozmos
      command: npx @kozmos/mcp-server
      transport: stdio
      env:
        KOZMOS_PROJECT_ROOT: .

context:
  include:
    - .ai-skills/*.md
    - src/components/**/*.tsx
  exclude:
    - node_modules
    - dist
    - "*.test.tsx"

rules:
  - name: use-kozmos-components
    description: Always use Kozmos Design System components
    pattern: |
      When creating UI:
      1. Check if a Kozmos component exists using kozmos_get_component
      2. If it exists, use it instead of creating custom components
      3. Follow the documented prop API exactly

  - name: use-tokens
    description: Never hardcode design values
    pattern: |
      Replace any hardcoded values:
      - Colors → var(--kozmos-color-*)
      - Spacing → var(--kozmos-space-*)
      - Typography → Kozmos text components

  - name: accessibility
    description: Ensure accessibility compliance
    pattern: |
      Before completing any component:
      1. Run kozmos_check_accessibility
      2. Fix any issues before proceeding
      3. Ensure ARIA attributes are correct

prompts:
  component:
    template: |
      Create a new component following Kozmos patterns.

      1. First, check if this component already exists: kozmos_list_components
      2. If not, scaffold it: kozmos_scaffold_component
      3. Implement the logic
      4. Validate: kozmos_validate_code
      5. Check a11y: kozmos_check_accessibility
```

### Anti Gravity Project Setup

```bash
# Initialize Anti Gravity with Kozmos
antigravity init --template kozmos

# Or add to existing project
antigravity add-mcp kozmos
```

---

## 6. GitHub Copilot Integration

GitHub Copilot doesn't support MCP natively, but we can optimize for it:

### .github/copilot-instructions.md

````markdown
# Copilot Instructions for Kozmos Design System

## Design System

This project uses the Kozmos Design System. When writing code:

### Component Imports

```typescript
// ✅ Correct
import { Button, Input, Modal } from "@kozmos/react";

// ❌ Wrong - don't create custom components when Kozmos has them
import { CustomButton } from "./CustomButton";
```
````

### Available Components

Primitives: Box, Stack, Grid, Text, Heading, Button, IconButton, Link
Forms: Input, TextArea, Checkbox, Radio, Select, Switch, Slider
Feedback: Modal, Drawer, Toast, Alert, Tooltip, Popover, Progress, Spinner
Navigation: Tabs, Accordion, Breadcrumb, Pagination, Menu

### Token Usage

```typescript
// ✅ Correct - use CSS variables
<div style={{ color: 'var(--kozmos-color-text-primary)' }}>

// ✅ Better - use className
<div className="text-primary">

// ❌ Wrong - hardcoded values
<div style={{ color: '#171717' }}>
```

### Token Reference

Colors:

- `--kozmos-color-text-primary` - Primary text
- `--kozmos-color-text-secondary` - Secondary text
- `--kozmos-color-background-primary` - Main background
- `--kozmos-color-interactive-primary` - Buttons, links

Spacing:

- `--kozmos-space-100` (4px)
- `--kozmos-space-200` (8px)
- `--kozmos-space-400` (16px)
- `--kozmos-space-600` (24px)

### Patterns

1. Use CVA for component variants
2. Use compound components for complex UI (Modal.Content, Tabs.List)
3. Always include accessibility attributes
4. Use Kozmos tokens, never hardcode values

````

### VS Code Settings for Copilot

```json
// .vscode/settings.json
{
  "github.copilot.enable": {
    "*": true
  },
  "github.copilot.advanced": {
    "inlineSuggest.enable": true
  },
  "editor.inlineSuggest.enabled": true,

  // Help Copilot understand the project
  "files.associations": {
    "*.figma.tsx": "typescriptreact"
  }
}
````

### Copilot Snippets

Create `.vscode/kozmos.code-snippets`:

```json
{
  "Kozmos Button": {
    "prefix": "kbutton",
    "body": [
      "<Button variant=\"${1|solid,outline,ghost|}\" size=\"${2|sm,md,lg|}\">",
      "  $3",
      "</Button>"
    ],
    "description": "Kozmos Button component"
  },
  "Kozmos Modal": {
    "prefix": "kmodal",
    "body": [
      "<Modal open={${1:isOpen}} onOpenChange={${2:setIsOpen}}>",
      "  <Modal.Content>",
      "    <Modal.Title>$3</Modal.Title>",
      "    <Modal.Description>$4</Modal.Description>",
      "    $5",
      "    <Modal.Close asChild>",
      "      <Button variant=\"ghost\">Close</Button>",
      "    </Modal.Close>",
      "  </Modal.Content>",
      "</Modal>"
    ],
    "description": "Kozmos Modal with compound components"
  },
  "Kozmos Form Field": {
    "prefix": "kformfield",
    "body": [
      "<FormField label=\"$1\" ${2:required}>",
      "  <Input",
      "    value={$3}",
      "    onChange={(e) => $4(e.target.value)}",
      "    placeholder=\"$5\"",
      "  />",
      "</FormField>"
    ],
    "description": "Kozmos Form Field with Input"
  },
  "Kozmos Token": {
    "prefix": "ktoken",
    "body": "var(--kozmos-${1|color-text-primary,color-background-primary,space-400,radius-200|})",
    "description": "Kozmos CSS variable token"
  }
}
```

---

## 7. Other AI Agents

### Codeium

Create `.codeium/config.json`:

```json
{
  "context": {
    "include": [
      ".ai-skills/code-patterns.md",
      ".ai-skills/design-philosophy.md",
      "src/components/**/*.tsx"
    ]
  },
  "suggestions": {
    "preferredImports": {
      "@kozmos/react": ["Button", "Input", "Modal", "Select", "Tabs"]
    }
  }
}
```

### Amazon Q Developer

Create `.amazonq/context.md`:

```markdown
# Amazon Q Context for Kozmos

## Design System

This project uses Kozmos Design System (@kozmos/react).

## Key Rules

1. Use Kozmos components instead of custom ones
2. Use CSS variable tokens for all design values
3. Follow compound component patterns
4. Ensure accessibility compliance

## Component Reference

[Include abbreviated component list]

## Token Reference

[Include abbreviated token list]
```

### JetBrains AI Assistant

Create `.idea/ai-assistant.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="AIAssistantSettings">
    <option name="customContext">
      <list>
        <option value=".ai-skills/code-patterns.md" />
        <option value=".ai-skills/design-philosophy.md" />
      </list>
    </option>
    <option name="customInstructions" value="Use Kozmos Design System components from @kozmos/react. Never hardcode colors or spacing - use tokens." />
  </component>
</project>
```

### Tabnine

Create `.tabnine.json`:

```json
{
  "context": {
    "include": [".ai-skills/*.md"],
    "exclude": ["node_modules", "dist"]
  },
  "preferences": {
    "preferImports": ["@kozmos/react", "@kozmos/tokens"],
    "avoidImports": ["styled-components", "@emotion/styled"]
  }
}
```

### Sourcegraph Cody

Create `.cody/context.md`:

```markdown
# Cody Context for Kozmos

## Design System

This project uses the Kozmos Design System.

### Component Usage

Always import from @kozmos/react:

- Button, Input, Select for forms
- Modal, Drawer, Toast for feedback
- Tabs, Accordion for navigation

### Tokens

Use CSS variables for design values:

- Colors: var(--kozmos-color-\*)
- Spacing: var(--kozmos-space-\*)
- Typography: var(--kozmos-font-\*)

### Patterns

1. Compound components for complex UI
2. CVA for variant management
3. Accessibility-first development
```

---

## 8. Context File Templates

### Universal Context File

Create `.ai-context/kozmos.md` (works with most AI agents):

````markdown
# Kozmos Design System Context

## Overview

This project uses the Kozmos Design System, a multi-platform design system
for Pointr's SDK products.

## Package Imports

```typescript
// React
import { Button, Input, Modal } from "@kozmos/react";

// Vue
import { KozmosButton, KozmosInput } from "@kozmos/vue";

// React Native
import { Button, Input } from "@kozmos/react-native";
```
````

## Available Components

### Primitives

- Box, Stack, Grid - Layout containers
- Text, Heading - Typography
- Button, IconButton, Link - Actions
- Icon - Iconography

### Form Controls

- Input, TextArea - Text input
- Checkbox, Radio, Switch - Selection
- Select - Dropdown
- Slider - Range input
- FormField - Label + input wrapper

### Feedback

- Modal, Drawer - Overlays
- Toast, Alert - Messages
- Tooltip, Popover - Contextual
- Progress, Spinner, Skeleton - Loading

### Navigation

- Tabs, Accordion - Content organization
- Breadcrumb, Pagination - Navigation
- Menu - Dropdown menus

## Token System

### Colors

```css
--kozmos-color-text-primary
--kozmos-color-text-secondary
--kozmos-color-background-primary
--kozmos-color-background-secondary
--kozmos-color-interactive-primary
--kozmos-color-interactive-primary-hover
--kozmos-color-status-error
--kozmos-color-status-success
```

### Spacing

```css
--kozmos-space-100  /* 4px */
--kozmos-space-200  /* 8px */
--kozmos-space-300  /* 12px */
--kozmos-space-400  /* 16px */
--kozmos-space-600  /* 24px */
--kozmos-space-800  /* 32px */
```

### Typography

```css
--kozmos-font-size-100  /* 12px */
--kozmos-font-size-200  /* 14px */
--kozmos-font-size-300  /* 16px */
--kozmos-font-size-400  /* 18px */
```

## Code Patterns

### Component with Variants (CVA)

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonStyles = cva("kozmos-button", {
  variants: {
    variant: {
      solid: "kozmos-button--solid",
      outline: "kozmos-button--outline",
    },
    size: {
      sm: "kozmos-button--sm",
      md: "kozmos-button--md",
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});
```

### Compound Component

```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <Modal.Trigger asChild>
    <Button>Open Modal</Button>
  </Modal.Trigger>
  <Modal.Content>
    <Modal.Title>Title</Modal.Title>
    <Modal.Description>Description</Modal.Description>
    <Modal.Close asChild>
      <Button variant="ghost">Close</Button>
    </Modal.Close>
  </Modal.Content>
</Modal>
```

## Rules

1. **Use Kozmos components** - Don't create custom components when Kozmos has them
2. **Use tokens** - Never hardcode colors, spacing, or typography
3. **Accessibility first** - All components must be accessible
4. **Compound patterns** - Use compound components for complex UI
5. **CVA for variants** - Use CVA for component variants

````

### Project-Specific Context Template

Create this in consuming projects:

```markdown
# Project AI Context

## Project Overview

[Brief description of the project]

## Tech Stack

- Framework: React 18 / Next.js 14
- Design System: Kozmos (@kozmos/react)
- State: [Your state management]
- API: [Your API approach]

## Kozmos Usage

This project uses Kozmos Design System for all UI components.
See `.ai-context/kozmos.md` for full component and token reference.

### Custom Components

Components we've built on top of Kozmos:
- `FeatureCard` - Uses Card, Badge, Button
- `DataTable` - Uses Table with custom sorting
- `SearchPanel` - Uses Input, Select, Button

### Theme Customization

We use a custom brand theme:
```css
[data-brand="ourcompany"] {
  --kozmos-color-interactive-primary: #custom-color;
}
````

## File Structure

```
src/
├── components/     # Custom components using Kozmos
├── features/       # Feature modules
├── pages/          # Page components
└── styles/         # Custom styles (minimal)
```

## AI Guidelines

1. Always check if Kozmos has a component before creating custom
2. Use our custom components when they exist
3. Follow our file naming conventions
4. Include tests for new components

````

---

## 9. Project Setup Script

### Automated Setup CLI

```typescript
// packages/mcp-server/src/cli/setup.ts
#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SetupOptions {
  all?: boolean;
  claude?: boolean;
  cursor?: boolean;
  antigravity?: boolean;
  copilot?: boolean;
  mcp?: boolean;
}

async function setup(options: SetupOptions) {
  const projectRoot = process.cwd();
  console.log('🎨 Setting up Kozmos AI integration...\n');

  // Create directories
  const dirs = [
    '.ai-context',
    '.claude',
    '.cursor',
    '.vscode',
    '.github',
  ];

  dirs.forEach(dir => {
    const path = resolve(projectRoot, dir);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      console.log(`  Created ${dir}/`);
    }
  });

  // MCP Configuration (Claude, Cursor, Anti Gravity)
  if (options.all || options.mcp || options.claude) {
    writeFileSync(
      resolve(projectRoot, '.claude/settings.json'),
      JSON.stringify({
        mcpServers: {
          kozmos: {
            command: 'npx',
            args: ['@kozmos/mcp-server'],
            cwd: '.',
          },
        },
      }, null, 2)
    );
    console.log('  ✅ Created .claude/settings.json');
  }

  if (options.all || options.mcp || options.cursor) {
    writeFileSync(
      resolve(projectRoot, '.cursor/mcp.json'),
      JSON.stringify({
        servers: {
          kozmos: {
            command: 'npx',
            args: ['@kozmos/mcp-server'],
            cwd: '${workspaceFolder}',
          },
        },
      }, null, 2)
    );
    console.log('  ✅ Created .cursor/mcp.json');
  }

  if (options.all || options.antigravity) {
    writeFileSync(
      resolve(projectRoot, 'antigravity.config.yaml'),
      `# Anti Gravity Configuration for Kozmos
mcp:
  servers:
    - name: kozmos
      command: npx @kozmos/mcp-server
      transport: stdio
`
    );
    console.log('  ✅ Created antigravity.config.yaml');
  }

  // Context Files (all agents)
  if (options.all) {
    // Copy universal context
    copyFileSync(
      resolve(__dirname, '../templates/kozmos-context.md'),
      resolve(projectRoot, '.ai-context/kozmos.md')
    );
    console.log('  ✅ Created .ai-context/kozmos.md');

    // Copilot instructions
    writeFileSync(
      resolve(projectRoot, '.github/copilot-instructions.md'),
      getCopilotInstructions()
    );
    console.log('  ✅ Created .github/copilot-instructions.md');

    // VS Code snippets
    writeFileSync(
      resolve(projectRoot, '.vscode/kozmos.code-snippets'),
      JSON.stringify(getVSCodeSnippets(), null, 2)
    );
    console.log('  ✅ Created .vscode/kozmos.code-snippets');
  }

  // CLAUDE.md
  if (options.all || options.claude) {
    writeFileSync(
      resolve(projectRoot, 'CLAUDE.md'),
      getClaudeMd()
    );
    console.log('  ✅ Created CLAUDE.md');
  }

  // Cursor rules
  if (options.all || options.cursor) {
    writeFileSync(
      resolve(projectRoot, '.cursor/rules.md'),
      getCursorRules()
    );
    console.log('  ✅ Created .cursor/rules.md');
  }

  console.log('\n✨ Kozmos AI integration setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Restart your AI agent to pick up new configuration');
  console.log('  2. Try asking: "Show me how to use the Kozmos Button component"');
  console.log('  3. For MCP tools, try: kozmos_get_component("Button")');
}

// Template functions
function getCopilotInstructions(): string {
  return `# Copilot Instructions for Kozmos Design System
...`;  // Full content from earlier
}

function getVSCodeSnippets(): object {
  return {
    // Snippets from earlier
  };
}

function getClaudeMd(): string {
  return `# Project Context
...`;  // Full content from earlier
}

function getCursorRules(): string {
  return `# Cursor Rules for Kozmos
...`;  // Full content from earlier
}

// CLI entry point
const args = process.argv.slice(2);
const options: SetupOptions = {
  all: args.includes('--all') || args.length === 0,
  claude: args.includes('--claude'),
  cursor: args.includes('--cursor'),
  antigravity: args.includes('--antigravity'),
  copilot: args.includes('--copilot'),
  mcp: args.includes('--mcp'),
};

setup(options);
````

### Usage

```bash
# Full setup (all agents)
npx kozmos-ai-setup

# Or specific agents
npx kozmos-ai-setup --claude --cursor
npx kozmos-ai-setup --copilot
npx kozmos-ai-setup --mcp
```

---

## 10. Best Practices

### For Project Teams

1. **Commit AI configuration files** - Include `.claude/`, `.cursor/`, etc. in version control
2. **Keep context files updated** - Update when components or patterns change
3. **Standardize across team** - Everyone should use the same AI configuration
4. **Review AI-generated code** - Always verify against design system guidelines

### For AI Prompts

```markdown
## Good Prompts

✅ "Create a form with name and email fields using Kozmos components"
✅ "Convert this div to use Kozmos tokens instead of hardcoded colors"
✅ "Add a confirmation modal using Kozmos Modal compound components"
✅ "What Kozmos component should I use for a dropdown menu?"

## Bad Prompts

❌ "Create a button" (too vague, might not use Kozmos)
❌ "Style this component" (might use inline styles instead of tokens)
❌ "Make a popup" (unclear which component to use)
```

### For Code Review

When reviewing AI-generated code, check:

1. ✅ Uses Kozmos components (not custom or third-party)
2. ✅ Uses Kozmos tokens (no hardcoded values)
3. ✅ Follows compound component pattern (for complex components)
4. ✅ Includes accessibility attributes
5. ✅ Matches documented prop API
6. ✅ Uses correct import paths

### Troubleshooting

| Issue                       | Solution                                                    |
| --------------------------- | ----------------------------------------------------------- |
| MCP server not connecting   | Check config file syntax, restart AI agent                  |
| Wrong component suggestions | Update context files, use MCP tools explicitly              |
| Hardcoded values in output  | Add token rules to context, use validation tool             |
| Missing accessibility       | Add a11y check to prompts, use `kozmos_check_accessibility` |

---

## Version History

| Version | Date       | Changes                      |
| ------- | ---------- | ---------------------------- |
| 1.0.0   | 2026-02-07 | Initial AI integration guide |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
