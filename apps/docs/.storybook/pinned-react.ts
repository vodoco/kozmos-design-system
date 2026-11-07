import { dirname, join } from "path";

/** apps/docs, whose package.json names the React both Storybooks draw with. */
const DOCS_DIR = join(__dirname, "..");

/**
 * The React both Storybooks draw with, React's (`./main.ts`) and Vue's
 * (`../.storybook-vue/main.ts`): the `react` and `react-dom` apps/docs
 * declares (^18.2.0, 18.3.1 in the lockfile), resolved from apps/docs itself.
 *
 * Storybook's addon-docs aliases `react` and `react-dom` for every import in
 * the preview, the parts' own included, to this preset value. Storybook core
 * sets it from its own install, which pnpm gives no React, so Node's
 * resolution falls through to the hidden hoist
 * (`node_modules/.pnpm/node_modules/react`): 18.3.1 or 19.2.4 by install,
 * with one lockfile (both seen on 7 Nov 2026). `@storybook/react` sets it
 * again from its React peer, so React's Storybook drew with 18.3.1 by the
 * lockfile, and Vue's, which has no `@storybook/react`, by the hoist. A main
 * config is the last preset, so the value it gives is the one addon-docs
 * reads.
 */
export async function resolvedReact(existing: Record<string, unknown> = {}) {
  const fromDocs = { paths: [DOCS_DIR] };
  return {
    ...existing,
    react: dirname(require.resolve("react/package.json", fromDocs)),
    reactDom: dirname(require.resolve("react-dom/package.json", fromDocs)),
  };
}

/** A main config that gives `resolvedReact`, which Storybook's types leave out. */
export type PinsReact = { resolvedReact: typeof resolvedReact };
