import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-react";
import base from "./playwright.config";

// The parts on React 18, the React Storybook and the Vue bridge draw with:
// apps/docs's react and react-dom. React 19 forgives what 18 does not (a
// callback ref that sets state, which Radix's Slot gives a new identity each
// render, looped only on 18: #513), so the specs that need it run here too.
const fromDocs = createRequire(
  resolve(__dirname, "../../apps/docs/package.json"),
);
const reactDir = dirname(fromDocs.resolve("react/package.json"));
const reactDomDir = dirname(fromDocs.resolve("react-dom/package.json"));

export default defineConfig({
  ...base,
  testMatch: ["FieldPopupOpen.spec.tsx"],
  use: {
    ...base.use,
    ctPort: 3102,
    ctCacheDir: "playwright/.cache/react18",
    ctViteConfig: {
      resolve: {
        alias: [
          { find: /^react$/, replacement: reactDir },
          { find: /^react\/(.*)$/, replacement: `${reactDir}/$1` },
          { find: /^react-dom$/, replacement: reactDomDir },
          { find: /^react-dom\/(.*)$/, replacement: `${reactDomDir}/$1` },
        ],
      },
    },
  },
  projects: [
    { name: "chromium-react18", use: { ...devices["Desktop Chrome"] } },
  ],
});
