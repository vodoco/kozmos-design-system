import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join, resolve } from "path";

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/react/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/react/src/**/*.mdx",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("storybook-addon-performance"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
      propFilter: () => true,
    },
  },
  // One public catalogue; Vue remains an opt-in internal verification harness.
  async viteFinal(config) {
    // Component stories import source files directly. Public imports in the
    // decorator and composed examples must share those same React contexts.
    // Keep stylesheet subpaths built; installed-package fixtures independently
    // verify the published JS/declaration graph.
    config.resolve = config.resolve || {};
    const aliases = config.resolve.alias || [];
    config.resolve.alias = [
      {
        find: /^@kozmos-ds\/react$/,
        replacement: resolve(__dirname, "../../../packages/react/src/index.ts"),
      },
      ...(Array.isArray(aliases)
        ? aliases
        : Object.entries(aliases).map(([find, replacement]) => ({
            find,
            replacement,
          }))),
    ];
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    // Allow serving files from one level up to the project root
    // apps/docs -> apps -> root
    config.server.fs.allow = ["../.."];

    // Physically force Vite to pre-compile the entire dependency graph instantly
    // bypassing the 2-minute 5-10x esbuild cache thrashing sequence natively.
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      "@mdx-js/react",
      "@storybook/blocks",
      "@storybook/react",
      "@storybook/test",
      "@storybook/components",
      "@storybook/theming",
      "@storybook/manager-api",
      "react",
      "react-dom",
      // @kozmos-ds/icons is a linked workspace package, and Vite excludes
      // linked packages from dependency pre-bundling. Left out, the dev server
      // transforms the package's single 769 KB module on demand before any
      // story can render. lucide-react is fast here for exactly this reason:
      // it arrives from node_modules and Vite pre-bundles it once with esbuild.
      "@kozmos-ds/icons",
    ];

    return config;
  },
};
export default config;
