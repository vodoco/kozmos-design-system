# Figma Change Workflow

Last checked: 2026-05-21

## Current Direction

The rebuild is code-first with controlled Figma feedback.

- Code owns component APIs, prop names, package behavior, and cross-platform contracts.
- Token JSON owns the canonical token names and generated platform outputs.
- Figma owns visual review, component documentation, layout quality, and designer-facing ergonomics.
- Code Connect links the two after a Figma component has a stable node ID.

The local importer plugin is not a fully automatic two-way sync tool. It is an importer and builder for controlled updates into Figma. Two-way sync should be deliberate: Figma changes become proposals, then code/token changes land through review.

## Designer Change Types

### Safe In Figma

Designers can change these directly in the published library, then request review:

- Component layout polish that does not change variant/property names
- Documentation frames and examples
- Internal layer naming
- Instance swap options
- Visual spacing within an existing token/prop model

After review, update screenshots/docs if needed. Code Connect usually does not need a change if the component set node ID remains the same.

### Needs Token Review

These changes should be exported or written down and converted into a token/code PR:

- New colors, spacing, radius, typography, shadows, or motion values
- Renaming variables
- Deleting variables
- Changing Light/Dark mode values

Because the current Figma token cannot read Variables REST, use a plugin/export path for audits until `file_variables:read` is available.

### Needs Code Review

These changes must start as a code issue or PR:

- New component variant/property names
- Removing a variant/property
- Changing a prop type
- Behavior changes such as loading, disabled, focus, keyboard interaction, or accessibility
- Native iOS/Android API changes

After code merges, regenerate the manifest, update the Figma component, then update Code Connect.

## Recommended Review Loop

1. Designer makes a branch/duplicate or edits a draft component area.
2. Reviewer checks whether the change is visual-only, token-level, or API-level.
3. If visual-only, merge into the canonical component set and keep the same node ID.
4. If token-level, update `packages/tokens/src/tokens-light.json` and `packages/tokens/src/tokens-dark.json`, run `pnpm tokens:build`, then re-import foundations.
5. If API-level, update React first, then iOS/Android as needed, then Update the Figma component in the importer, never Rebuild: Rebuild mints new node IDs, and Code Connect is pinned to the old ones.
6. Run `pnpm figma:manifest` and `pnpm exec tsx scripts/skills/check-completion.ts --check`.
7. Run `pnpm figma:publish:linked:dry` for the currently linked React library components.
8. Run `pnpm figma:publish:native:linked:dry` for the SwiftUI and Compose linked mappings.
9. Use root `pnpm figma:publish:dry` only after non-core scaffold mappings have real node IDs.
10. A new `.figma.*` file goes into its platform's `figma.linked.config.json` by name, beside its source file. The configs are lists, not globs: a file left off is never validated or published, and `pnpm components:contract:check` fails on it.
11. Publish only when asked: `pnpm figma:publish:linked` and `pnpm figma:publish:native:linked`, from a clean, pushed branch that holds every mapping `main` has, or from `main` after the merge. Each publish sends its platform's whole linked set.
12. Then `pnpm figma:connect:readback`, with Figma desktop open on the Core Library and its Dev Mode MCP server on: every linked node must show a snippet on every platform, with imports a consumer can use (`@kozmos-ds/react`, `import Kozmos`, the Compose package).

## Current Plugin Scope

`figma/foundations-importer` currently supports:

- Import foundations from `docs/figma-foundations-payload.json`
- Create foundation pages
- Create local variables and modes
- Build/update the current 37 canonical Core component sets with unsuffixed names
- Update existing component sets in place while preserving Code Connect node IDs
- Apply shared text styles/token bindings
- Reorganize the Components page without changing component set IDs
- Build the transparent surface QA page
- Audit the open Figma library and produce JSON for review

Next useful plugin features:

- Keep the 37 Core sets clean as React, SwiftUI, and Compose APIs evolve
- Add new platform-specific component sets only after the Core library stays stable
- Add controlled repair actions for recurring audit findings
