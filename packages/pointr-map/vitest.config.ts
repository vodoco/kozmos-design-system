import { defineConfig } from "vitest/config";

// The tests run against a fake Pointr SDK (tests/fake-sdk.ts): no network, no
// keys, no script from Pointr's CDN. @kozmos-ds/react resolves to its built
// dist, as it does for a product.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
