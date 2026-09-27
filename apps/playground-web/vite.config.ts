import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @kozmos-ds/icons is a linked workspace package, and Vite excludes linked
  // packages from dependency pre-bundling. Without this the dev server
  // transforms the package's one large module on demand before the first
  // render. lucide-react is fast here because it arrives from node_modules and
  // Vite pre-bundles it once with esbuild; this asks for the same treatment.
  optimizeDeps: {
    include: ["@kozmos-ds/icons"],
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
});
