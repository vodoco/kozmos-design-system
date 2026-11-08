// Every Vue spec on React 18 (`pnpm --filter @kozmos-ds/vue test:react18`,
// CI's Vue job). The package's peers take react and react-dom 18 or 19, and
// its own devDependencies are 19, which `pnpm test` runs on. This run takes
// apps/docs's React 18, the Vue Storybook's (test/react18/react18.mjs):
// Vite's aliases below for what Vite loads, and test/react18/hooks.mjs for
// what Node loads itself. test/react18/react18.probe.ts proves both.
import { fileURLToPath, pathToFileURL } from "node:url";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import base from "./vite.config.mts";
import {
  LOG_FILE,
  REACT_DIR,
  REACT_DOM_DIR,
  REACT_DOM_VERSION,
  REACT_VERSION,
} from "./test/react18/react18.mjs";

// What the probe holds the run to, from the React 18 install itself, and
// where the hooks write each React file Node resolved.
// Listeners.spec.ts skips its one react-dom 19 test by it: a name filter
// would be replaced by any `-t` the run is given.
process.env.KOZMOS_REACT18 = JSON.stringify({
  reactDir: REACT_DIR,
  reactDomDir: REACT_DOM_DIR,
  reactVersion: REACT_VERSION,
  reactDomVersion: REACT_DOM_VERSION,
});
process.env.KOZMOS_REACT18_LOG = LOG_FILE;

export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: [
        { find: /^react$/, replacement: REACT_DIR },
        { find: /^react\/(.*)$/, replacement: `${REACT_DIR}/$1` },
        { find: /^react-dom$/, replacement: REACT_DOM_DIR },
        { find: /^react-dom\/(.*)$/, replacement: `${REACT_DOM_DIR}/$1` },
      ],
    },
    test: {
      include: [...configDefaults.include, "test/react18/react18.probe.ts"],
      globalSetup: [
        fileURLToPath(
          new URL("./test/react18/global-setup.mjs", import.meta.url),
        ),
      ],
      execArgv: [
        "--import",
        pathToFileURL(
          fileURLToPath(new URL("./test/react18/hooks.mjs", import.meta.url)),
        ).href,
      ],
    },
  }),
);
