# Proposals: not built

**This folder is planning history, not an implementation reference.** These documents describe
unbuilt proposals or earlier designs that differ from what was implemented. Some familiar
packages, commands and concepts also exist in the current system; their presence here does not
validate the proposed APIs or architecture. Check current source and the maintained references
below before using any example. Headings are marked "Proposal" to retain that distinction when
a passage is read on its own.

What Kozmos is today:

- **Platforms:** React (`@kozmos-ds/react`), SwiftUI (`packages/ios`) and Jetpack Compose
  (`packages/android`). SwiftUI and Compose are used from a checkout and are not published.
- **Packages on npm:** `@kozmos-ds/react`, `@kozmos-ds/tokens`, `@kozmos-ds/icons` and
  `@kozmos-ds/product-contracts`.
- **Vue waits.** `@kozmos-ds/vue` is a private harness that mounts the React components in Vue; it
  is not published. There is no React Native package.

The facts are generated from the code: the
[component inventory](../../.ai-skills/component-inventory.md), the
[API cards](../claude-design/README.md) and the platform [status](../status.md).

| Proposal                                                 | What it describes                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [mcp-server.md](mcp-server.md)                           | An MCP server, `@kozmos-ds/mcp-server`, answering questions about components, tokens and patterns.    |
| [ai-editor-setup.md](ai-editor-setup.md)                 | A setup command, `kozmos-ai-setup`, and editor and agent configurations that start that server.       |
| [other-platforms.md](other-platforms.md)                 | React Native, and Lit Web Components with Vue wrappers: platforms in the original scope, never built. |
| [platform-mapping-plan.md](platform-mapping-plan.md)     | The cross-platform component, prop and token mapping planned before the code, across six platforms.   |
| [token-pipeline-plan.md](token-pipeline-plan.md)         | The token pipeline planned before the code: its files, configuration and outputs.                     |
| [migration-plan.md](migration-plan.md)                   | Upgrades across major versions that were never released, with a CLI and codemods that do not exist.   |
| [i18n-plan.md](i18n-plan.md)                             | Kozmos's own translation files, a locales package, an i18n provider and a translation workflow.       |
| [storybook-plan.md](storybook-plan.md)                   | Storybook customisations never added: a manager theme, the designs and pseudo-states addons.          |
| [code-patterns-plan.md](code-patterns-plan.md)           | Component, token, story and test templates for six platforms, written before the code.                |
| [component-creation-plan.md](component-creation-plan.md) | A Tooltip built step by step on every platform, unlike the real one.                                  |
| [testing-plan.md](testing-plan.md)                       | Test suites, helpers and budgets planned before the code, with `jest-axe` and invented paths.         |
| [performance-plan.md](performance-plan.md)               | Budgets and runtime targets no check measures, and a benchmark history of releases never made.        |
| [theming-plan.md](theming-plan.md)                       | Customer themes: theme files, a theme build, high-contrast tokens and a white-label onboarding.       |
