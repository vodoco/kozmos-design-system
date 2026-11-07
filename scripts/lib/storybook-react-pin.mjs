// The guard on the Storybooks' React pin (apps/docs/.storybook/pinned-react.ts).
// The pin gives Storybook's `resolvedReact`, a preset field Storybook uses
// inside and does not document, so an upgrade could stop it applying and
// let a build draw with whatever React pnpm's hidden hoist holds. Each check
// that loads a Storybook page reads, in the page, the react-dom that names
// itself to the devtools hook as it loads, and holds it to the react-dom
// apps/docs resolves: scripts/check-storybook-vue-smoke.mjs for Vue's, and
// scripts/audit-storybook.mjs for React's.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const fromDocs = createRequire(
  fileURLToPath(new URL("../../apps/docs/package.json", import.meta.url)),
);

/** The renderer the Storybooks must draw with: apps/docs's react-dom. */
export const PINNED_RENDERER = `react-dom@${fromDocs("react-dom/package.json").version}`;

/**
 * Before any of the page's scripts, a devtools hook that records each
 * renderer naming itself, as React DOM does when it loads.
 */
export async function recordRenderers(page) {
  await page.addInitScript(() => {
    const renderers = [];
    window.__kozmosRenderers = renderers;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      isDisabled: false,
      supportsFiber: true,
      renderers: new Map(),
      inject(internals) {
        renderers.push(`${internals.rendererPackageName}@${internals.version}`);
        return renderers.length;
      },
      onScheduleFiberRoot() {},
      onCommitFiberRoot() {},
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
      checkDCE() {},
    };
  });
}

/** The renderers the page recorded so far. */
export const renderersIn = (page) =>
  page.evaluate(() => window.__kozmosRenderers ?? []);

/** Fails unless every renderer seen is the pinned one, and one was seen. */
export function assertPinnedReact(seen, storybook) {
  const renderers = [...new Set(seen)];
  assert.deepEqual(
    renderers,
    [PINNED_RENDERER],
    `${storybook} draws with ${renderers.join(", ") || "no react-dom"}, not apps/docs's ${PINNED_RENDERER}: the React pin (apps/docs/.storybook/pinned-react.ts, Storybook's resolvedReact) no longer applies`,
  );
  return `${storybook} draws with ${PINNED_RENDERER}, apps/docs's`;
}
