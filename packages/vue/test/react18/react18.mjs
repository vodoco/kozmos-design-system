// The React 18 that `pnpm --filter @kozmos-ds/vue test:react18` runs the Vue
// specs on (vitest.react18.config.mts): apps/docs's react and react-dom,
// the React the Vue Storybook draws with (apps/docs/.storybook/pinned-react.ts),
// which the workspace already installs. packages/vue's own devDependencies are
// React 19; its peers take 18 or 19.
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fromDocs = createRequire(
  fileURLToPath(new URL("../../../../apps/docs/package.json", import.meta.url)),
);

/** apps/docs's react and react-dom, their folders. */
export const REACT_DIR = dirname(fromDocs.resolve("react/package.json"));
export const REACT_DOM_DIR = dirname(
  fromDocs.resolve("react-dom/package.json"),
);

const fromReactDom = createRequire(`${REACT_DOM_DIR}/index.js`);
/** The versions installed there, which the run must load (react18.probe.ts). */
export const REACT_VERSION = fromReactDom("react/package.json").version;
export const REACT_DOM_VERSION = fromDocs("react-dom/package.json").version;

/**
 * Each `react` and `react-dom` entry a part, Radix or the bridge imports,
 * with the file it is in the React 18 install, resolved as react-dom 18
 * itself resolves it, so react-dom's own `require("react")` is the same file.
 */
export const KNOWN = Object.fromEntries(
  [
    "react",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react/package.json",
    "react-dom",
    "react-dom/client",
    "react-dom/server",
    "react-dom/test-utils",
    "react-dom/package.json",
  ].map((specifier) => [specifier, fromReactDom.resolve(specifier)]),
);

/** A file inside react-dom 18, from where any other React subpath resolves. */
export const ANCHOR_URL = pathToFileURL(`${REACT_DOM_DIR}/index.js`).href;

/** Every `react…` and `react-dom…` specifier. */
export const REACT_SPECIFIER = /^(react|react-dom)(\/.*)?$/;

/**
 * Where every worker writes each React file Node resolved: one fixed folder,
 * which global-setup.mjs clears as the run starts and reads as it ends.
 */
export const LOG_DIR = fileURLToPath(
  new URL("../../node_modules/.cache/kozmos-react18/", import.meta.url),
);
export const LOG_FILE = `${LOG_DIR}resolutions.jsonl`;

/** Whether a resolved file is React 18's, react's or react-dom's. */
export const isReact18 = (file) =>
  file.startsWith(`${REACT_DIR}/`) || file.startsWith(`${REACT_DOM_DIR}/`);
