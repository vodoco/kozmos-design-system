<!-- kozmos-skills: specification -->

# Kozmos MCP Server Specification

> **Not built.** This specifies a server that does not exist yet, so the
> package name and install commands below are proposals rather than something
> you can run today. `pnpm skills:check` allows them because of the marker on
> the first line of this file.

> **Purpose:** This document specifies the Model Context Protocol (MCP) server for Kozmos Design System, enabling AI agents (Claude, Cursor, Anti Gravity, Copilot, and others) to interact with components, tokens, and patterns programmatically.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Installation & Configuration](#3-installation--configuration)
4. [MCP Tools](#4-mcp-tools)
5. [MCP Resources](#5-mcp-resources)
6. [MCP Prompts](#6-mcp-prompts)
7. [Implementation](#7-implementation)
8. [Client Configuration](#8-client-configuration)
9. [Security Considerations](#9-security-considerations)
10. [Extending the Server](#10-extending-the-server)

---

## 1. Overview

### What is the Kozmos MCP Server?

The Kozmos MCP Server exposes the design system to AI agents via the Model Context Protocol, enabling:

- **Component Discovery** — Query available components, their props, and usage
- **Token Lookup** — Get token values, CSS variables, and platform equivalents
- **Code Generation** — Scaffold components with correct patterns
- **Validation** — Check code for design system compliance
- **Documentation** — Access patterns, guidelines, and examples

### Supported AI Agents

| Agent                  | Integration Method        | Status          |
| ---------------------- | ------------------------- | --------------- |
| **Claude** (Anthropic) | MCP Native                | ✅ Full Support |
| **Claude Code**        | MCP Native                | ✅ Full Support |
| **Cursor**             | MCP via config            | ✅ Full Support |
| **Anti Gravity**       | MCP Native                | ✅ Full Support |
| **GitHub Copilot**     | Context files + Extension | 🟡 Partial      |
| **Codeium**            | Context files             | 🟡 Partial      |
| **Amazon Q**           | Context files             | 🟡 Partial      |
| **JetBrains AI**       | Context files             | 🟡 Partial      |

### Key Benefits

1. **Consistent Code Generation** — AI always uses correct patterns
2. **Real-time Token Access** — Current values, not stale documentation
3. **Cross-Platform Awareness** — Knows how to generate for all 6 platforms
4. **Validation** — Catches design system violations before commit
5. **Self-Updating** — Reads from installed packages, always current

---

## 2. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI Agent (Claude, Cursor, etc.)                │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ MCP Protocol (JSON-RPC over stdio)
                                      │
┌─────────────────────────────────────┴───────────────────────────────────┐
│                         @kozmos-ds/mcp-server                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Tools     │  │  Resources  │  │   Prompts   │  │  Validators │   │
│  │             │  │             │  │             │  │             │   │
│  │ • component │  │ • kozmos:// │  │ • scaffold  │  │ • a11y      │   │
│  │ • token     │  │   components│  │ • review    │  │ • tokens    │   │
│  │ • scaffold  │  │   tokens    │  │ • migrate   │  │ • patterns  │   │
│  │ • validate  │  │   patterns  │  │             │  │             │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │          │
│         └────────────────┴────────────────┴────────────────┘          │
│                                   │                                    │
│  ┌────────────────────────────────┴────────────────────────────────┐  │
│  │                      Data Layer                                  │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │ @kozmos-ds/     │  │ @kozmos-ds/     │  │ .ai-skills/  │          │  │
│  │  │ tokens       │  │ react (etc.) │  │ (docs)       │          │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
packages/mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts                # Server implementation
│   ├── tools/
│   │   ├── component.ts         # Component lookup tools
│   │   ├── token.ts             # Token lookup tools
│   │   ├── scaffold.ts          # Code generation tools
│   │   ├── validate.ts          # Validation tools
│   │   └── index.ts
│   ├── resources/
│   │   ├── components.ts        # Component resources
│   │   ├── tokens.ts            # Token resources
│   │   ├── patterns.ts          # Pattern resources
│   │   └── index.ts
│   ├── prompts/
│   │   ├── scaffold.ts          # Scaffolding prompts
│   │   ├── review.ts            # Code review prompts
│   │   ├── migrate.ts           # Migration prompts
│   │   └── index.ts
│   ├── data/
│   │   ├── component-registry.ts
│   │   ├── token-registry.ts
│   │   └── pattern-registry.ts
│   └── utils/
│       ├── parser.ts
│       └── formatter.ts
├── bin/
│   └── kozmos-mcp               # CLI entry point
├── package.json
└── tsconfig.json
```

---

## 3. Installation & Configuration

### Installing the MCP Server

```bash
# Global installation (recommended for system-wide use)
npm install -g @kozmos-ds/mcp-server

# Or in a project
pnpm add -D @kozmos-ds/mcp-server
```

### Configuration for Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos-ds/mcp-server"],
      "env": {
        "KOZMOS_PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

### Configuration for Claude Code

```json
// .claude/settings.json in project root
{
  "mcpServers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos-ds/mcp-server"],
      "cwd": "."
    }
  }
}
```

### Configuration for Cursor

```json
// .cursor/mcp.json in project root
{
  "servers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos-ds/mcp-server"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Configuration for Anti Gravity

```json
// Anti Gravity MCP configuration
{
  "mcp": {
    "servers": [
      {
        "name": "kozmos",
        "command": "npx @kozmos-ds/mcp-server",
        "transport": "stdio"
      }
    ]
  }
}
```

---

## 4. MCP Tools

### Tool: `kozmos_get_component`

Retrieves detailed information about a component.

**Input Schema:**

```typescript
{
  name: string;           // Component name (e.g., "Button", "Modal")
  platform?: string;      // "react" | "vue" | "ios" | "android" | "react-native"
  includeExamples?: boolean;
}
```

**Output:**

```typescript
{
  name: string;
  description: string;
  status: "stable" | "beta" | "alpha" | "deprecated";
  platforms: string[];
  props: PropDefinition[];
  examples: CodeExample[];
  accessibility: AccessibilityInfo;
  relatedComponents: string[];
  figmaNodeId?: string;
}
```

**Example Usage:**

```
AI: I need to use the Button component in React

Tool Call: kozmos_get_component({ name: "Button", platform: "react" })

Response:
{
  "name": "Button",
  "description": "Primary action trigger for user interactions",
  "status": "stable",
  "platforms": ["react", "vue", "ios", "android", "react-native"],
  "props": [
    { "name": "variant", "type": "'solid' | 'outline' | 'ghost'", "default": "'solid'" },
    { "name": "size", "type": "'sm' | 'md' | 'lg'", "default": "'md'" },
    { "name": "disabled", "type": "boolean", "default": "false" },
    { "name": "loading", "type": "boolean", "default": "false" }
  ],
  "examples": [
    {
      "title": "Basic Button",
      "code": "<Button variant=\"solid\">Click me</Button>"
    }
  ]
}
```

---

### Tool: `kozmos_get_token`

Retrieves token values across platforms.

**Input Schema:**

```typescript
{
  path: string;           // Token path (e.g., "color.text.primary", "space.400")
  platform?: string;      // Target platform for formatting
  includeAliases?: boolean;
}
```

**Output:**

```typescript
{
  path: string;
  type: "color" | "dimension" | "fontWeight" | "duration" | etc;
  value: {
    css: string;          // CSS variable or value
    js: string | number;  // JavaScript value
    swift: string;        // Swift code
    kotlin: string;       // Kotlin code
  };
  description?: string;
  aliases?: string[];     // Other paths that resolve to same value
}
```

**Example Usage:**

```
AI: What's the primary text color token?

Tool Call: kozmos_get_token({ path: "color.text.primary" })

Response:
{
  "path": "color.text.primary",
  "type": "color",
  "value": {
    "css": "var(--kozmos-color-text-primary)",
    "js": "#171717",
    "swift": "KozmosTokens.color.text.primary",
    "kotlin": "KozmosTokens.color.text.primary"
  },
  "description": "Primary text color for body content",
  "aliases": ["color.neutral.900"]
}
```

---

### Tool: `kozmos_search_tokens`

Searches for tokens by name or value.

**Input Schema:**

```typescript
{
  query: string;          // Search query
  type?: string;          // Filter by token type
  limit?: number;         // Max results (default: 10)
}
```

**Output:**

```typescript
{
  results: TokenResult[];
  totalCount: number;
}
```

---

### Tool: `kozmos_scaffold_component`

Generates component code following Kozmos patterns.

**Input Schema:**

```typescript
{
  name: string;           // Component name (PascalCase)
  platform: string;       // Target platform
  type?: "simple" | "compound" | "polymorphic";
  props?: PropDefinition[];
  variants?: VariantDefinition[];
  includeTests?: boolean;
  includeStory?: boolean;
  includeCodeConnect?: boolean;
}
```

**Output:**

```typescript
{
  files: GeneratedFile[];
  instructions: string;   // Next steps for the developer
}
```

**Example Usage:**

```
AI: Create a Tooltip component for React

Tool Call: kozmos_scaffold_component({
  name: "Tooltip",
  platform: "react",
  type: "simple",
  variants: [
    { name: "position", values: ["top", "bottom", "left", "right"] }
  ],
  includeTests: true,
  includeStory: true
})

Response:
{
  "files": [
    { "path": "Tooltip.tsx", "content": "..." },
    { "path": "Tooltip.test.tsx", "content": "..." },
    { "path": "Tooltip.stories.tsx", "content": "..." },
    { "path": "Tooltip.css", "content": "..." },
    { "path": "index.ts", "content": "..." }
  ],
  "instructions": "1. Add export to packages/react/src/index.ts\n2. Run tests with pnpm test\n3. View in Storybook"
}
```

---

### Tool: `kozmos_validate_code`

Validates code against Kozmos patterns and guidelines.

**Input Schema:**

```typescript
{
  code: string;           // Code to validate
  platform: string;       // Platform context
  checks?: string[];      // Specific checks: "tokens", "a11y", "patterns", "naming"
}
```

**Output:**

```typescript
{
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}
```

**Example Usage:**

```
AI: Is this Button usage correct?

Tool Call: kozmos_validate_code({
  code: "<Button style={{ color: '#ff0000' }}>Click</Button>",
  platform: "react",
  checks: ["tokens"]
})

Response:
{
  "valid": false,
  "errors": [
    {
      "type": "hardcoded-value",
      "message": "Hardcoded color '#ff0000' should use token",
      "suggestion": "Use 'color: var(--kozmos-color-status-error)' or remove inline style"
    }
  ],
  "warnings": [],
  "suggestions": [
    {
      "message": "Consider using the 'destructive' variant for error actions",
      "code": "<Button variant=\"destructive\">Click</Button>"
    }
  ]
}
```

---

### Tool: `kozmos_list_components`

Lists all available components with filtering.

**Input Schema:**

```typescript
{
  platform?: string;      // Filter by platform
  category?: string;      // "primitives" | "forms" | "feedback" | "navigation" | "sdk"
  status?: string;        // "stable" | "beta" | "alpha" | "deprecated"
}
```

**Output:**

```typescript
{
  components: ComponentSummary[];
  totalCount: number;
}
```

---

### Tool: `kozmos_get_pattern`

Retrieves a code pattern or best practice.

**Input Schema:**

```typescript
{
  pattern: string;        // Pattern name (e.g., "compound-component", "form-validation")
  platform?: string;
}
```

**Output:**

```typescript
{
  name: string;
  description: string;
  when: string;           // When to use this pattern
  example: CodeExample;
  antiPatterns?: AntiPattern[];
}
```

---

### Tool: `kozmos_check_accessibility`

Performs accessibility audit on component code.

**Input Schema:**

```typescript
{
  code: string;
  componentType?: string; // Helps with context-specific checks
}
```

**Output:**

```typescript
{
  score: number;          // 0-100
  issues: A11yIssue[];
  passed: A11yCheck[];
}
```

---

## 5. MCP Resources

Resources provide read-only access to Kozmos data.

### Resource: `kozmos://components`

Lists all component documentation.

```
URI: kozmos://components
URI: kozmos://components/Button
URI: kozmos://components/Button/react
```

### Resource: `kozmos://tokens`

Access token definitions.

```
URI: kozmos://tokens
URI: kozmos://tokens/color
URI: kozmos://tokens/color/text/primary
```

### Resource: `kozmos://patterns`

Access code patterns and best practices.

```
URI: kozmos://patterns
URI: kozmos://patterns/compound-component
URI: kozmos://patterns/form-validation
```

### Resource: `kozmos://changelog`

Access API changelog and breaking changes.

```
URI: kozmos://changelog
URI: kozmos://changelog/3.0.0
```

### Resource: `kozmos://migration`

Access migration guides.

```
URI: kozmos://migration/2-to-3
```

---

## 6. MCP Prompts

Prompts are pre-built prompt templates for common tasks.

### Prompt: `scaffold_component`

Interactive component scaffolding.

```typescript
{
  name: "scaffold_component",
  description: "Interactively create a new Kozmos component",
  arguments: [
    { name: "component_name", description: "Name of the component", required: true },
    { name: "platform", description: "Target platform", required: true }
  ]
}
```

### Prompt: `review_component`

Code review against Kozmos standards.

```typescript
{
  name: "review_component",
  description: "Review component code for Kozmos compliance",
  arguments: [
    { name: "code", description: "Component code to review", required: true }
  ]
}
```

### Prompt: `migrate_version`

Guide migration between versions.

```typescript
{
  name: "migrate_version",
  description: "Help migrate code between Kozmos versions",
  arguments: [
    { name: "from_version", description: "Current version", required: true },
    { name: "to_version", description: "Target version", required: true }
  ]
}
```

### Prompt: `explain_token`

Explain a token's purpose and usage.

```typescript
{
  name: "explain_token",
  description: "Explain what a token is for and how to use it",
  arguments: [
    { name: "token_path", description: "Token path", required: true }
  ]
}
```

---

## 7. Implementation

### Server Entry Point

```typescript
// packages/mcp-server/src/index.ts
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";
import { loadKozmosData } from "./data/index.js";

async function main() {
  // Load Kozmos data from installed packages
  const kozmosData = await loadKozmosData();

  // Create MCP server
  const server = new Server(
    {
      name: "kozmos",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register all capabilities
  registerTools(server, kozmosData);
  registerResources(server, kozmosData);
  registerPrompts(server, kozmosData);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Kozmos MCP Server running");
}

main().catch(console.error);
```

### Tool Implementation Example

```typescript
// packages/mcp-server/src/tools/component.ts
import { z } from "zod";
import type { KozmosData } from "../data/index.js";

export const GetComponentSchema = z.object({
  name: z.string().describe("Component name"),
  platform: z
    .enum(["react", "vue", "ios", "android", "react-native"])
    .optional(),
  includeExamples: z.boolean().optional().default(true),
});

export function registerComponentTools(server: Server, data: KozmosData) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "kozmos_get_component",
        description: "Get detailed information about a Kozmos component",
        inputSchema: zodToJsonSchema(GetComponentSchema),
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "kozmos_get_component") {
      const args = GetComponentSchema.parse(request.params.arguments);
      const component = data.components.get(args.name);

      if (!component) {
        return {
          content: [
            {
              type: "text",
              text: `Component "${args.name}" not found. Available components: ${Array.from(data.components.keys()).join(", ")}`,
            },
          ],
        };
      }

      // Filter by platform if specified
      let result = component;
      if (args.platform) {
        result = {
          ...component,
          examples: component.examples.filter(
            (e) => e.platform === args.platform,
          ),
          props: component.props[args.platform] || component.props.common,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  });
}
```

### Resource Implementation Example

```typescript
// packages/mcp-server/src/resources/tokens.ts
import type { KozmosData } from "../data/index.js";

export function registerTokenResources(server: Server, data: KozmosData) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "kozmos://tokens",
        name: "Kozmos Design Tokens",
        description: "All design tokens in the Kozmos system",
        mimeType: "application/json",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === "kozmos://tokens") {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(data.tokens, null, 2),
          },
        ],
      };
    }

    // Handle kozmos://tokens/{path}
    if (uri.startsWith("kozmos://tokens/")) {
      const path = uri.replace("kozmos://tokens/", "").replace(/\//g, ".");
      const token = getTokenByPath(data.tokens, path);

      if (token) {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(token, null, 2),
            },
          ],
        };
      }
    }

    throw new Error(`Resource not found: ${uri}`);
  });
}
```

### Data Loading

```typescript
// packages/mcp-server/src/data/index.ts
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export interface KozmosData {
  components: Map<string, ComponentDefinition>;
  tokens: TokenDefinition;
  patterns: Map<string, PatternDefinition>;
  changelog: ChangelogEntry[];
}

export async function loadKozmosData(): Promise<KozmosData> {
  const projectRoot = process.env.KOZMOS_PROJECT_ROOT || process.cwd();

  // Try to load from installed packages first
  const tokensPath = resolvePackage(
    "@kozmos-ds/tokens/build/json/tokens.json",
    projectRoot,
  );
  const componentsPath = resolvePackage(
    "@kozmos-ds/react/dist/components.json",
    projectRoot,
  );

  // Fall back to .ai-skills directory
  const skillsPath = resolve(projectRoot, ".ai-skills");

  const tokens = tokensPath
    ? JSON.parse(readFileSync(tokensPath, "utf-8"))
    : loadFromSkills(skillsPath, "tokens");

  const components = componentsPath
    ? JSON.parse(readFileSync(componentsPath, "utf-8"))
    : loadFromSkills(skillsPath, "components");

  const patterns = loadFromSkills(skillsPath, "patterns");
  const changelog = loadFromSkills(skillsPath, "changelog");

  return {
    components: new Map(Object.entries(components)),
    tokens,
    patterns: new Map(Object.entries(patterns)),
    changelog,
  };
}

function resolvePackage(packagePath: string, root: string): string | null {
  const paths = [
    resolve(root, "node_modules", packagePath),
    resolve(root, "..", "node_modules", packagePath),
  ];

  for (const p of paths) {
    if (existsSync(p)) return p;
  }

  return null;
}
```

---

## 8. Client Configuration

### Claude Desktop / Claude Code

```json
{
  "mcpServers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos-ds/mcp-server"],
      "env": {
        "KOZMOS_PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### Cursor

```json
// .cursor/mcp.json
{
  "servers": {
    "kozmos": {
      "command": "npx",
      "args": ["@kozmos-ds/mcp-server"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Anti Gravity

```yaml
# antigravity.config.yaml
mcp:
  servers:
    - name: kozmos
      command: npx @kozmos-ds/mcp-server
      transport: stdio
      env:
        KOZMOS_PROJECT_ROOT: .
```

### Generic MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["@kozmos-ds/mcp-server"],
});

const client = new Client({
  name: "my-app",
  version: "1.0.0",
});

await client.connect(transport);

// Use the Kozmos tools
const result = await client.callTool("kozmos_get_component", {
  name: "Button",
  platform: "react",
});
```

---

## 9. Security Considerations

### Data Access

The MCP server only provides read access to:

- Installed Kozmos packages
- Local `.ai-skills` documentation
- Project configuration

It does **not**:

- Modify files
- Access network resources
- Read sensitive data (env vars, credentials)
- Execute arbitrary code

### Sandboxing

```typescript
// The server runs with restricted permissions
const server = new Server(
  { name: "kozmos", version: "1.0.0" },
  {
    capabilities: {
      tools: {}, // Read-only tools
      resources: {}, // Read-only resources
      prompts: {}, // Template prompts only
      // No 'sampling' capability - server cannot make AI calls
    },
  },
);
```

### Validation

All inputs are validated using Zod schemas before processing.

---

## 10. Extending the Server

### Adding Custom Tools

```typescript
// custom-tools.ts
export function registerCustomTools(server: Server, data: KozmosData) {
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    // Add your custom tools to the list
    return {
      tools: [
        ...existingTools,
        {
          name: "kozmos_custom_tool",
          description: "Your custom tool",
          inputSchema: {
            /* ... */
          },
        },
      ],
    };
  });
}
```

### Adding Company-Specific Patterns

```typescript
// Load additional patterns from company config
const companyPatterns = loadCompanyPatterns();
data.patterns = new Map([...data.patterns, ...companyPatterns]);
```

### Plugin System (Future)

```typescript
// kozmos.mcp.config.js
export default {
  plugins: ["@company/kozmos-mcp-plugin", "./local-plugin.js"],
  customTools: {
    // ...
  },
};
```

---

## Package.json

```json
{
  "name": "@kozmos-ds/mcp-server",
  "version": "1.0.0",
  "description": "MCP server for Kozmos Design System AI integration",
  "bin": {
    "kozmos-mcp": "./bin/kozmos-mcp.js"
  },
  "main": "./dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "zod-to-json-schema": "^3.22.0"
  },
  "peerDependencies": {
    "@kozmos-ds/tokens": "*",
    "@kozmos-ds/react": "*"
  },
  "peerDependenciesMeta": {
    "@kozmos-ds/tokens": { "optional": true },
    "@kozmos-ds/react": { "optional": true }
  },
  "files": ["dist", "bin"],
  "keywords": ["mcp", "model-context-protocol", "design-system", "kozmos", "ai"]
}
```

---

## Version History

| Version | Date       | Changes                          |
| ------- | ---------- | -------------------------------- |
| 1.0.0   | 2026-02-07 | Initial MCP server specification |

---

**Maintainer:** Kozmos Design System Core Team
**Last Updated:** 2026-02-07
