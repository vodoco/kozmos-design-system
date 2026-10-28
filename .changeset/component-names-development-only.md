---
"@kozmos-ds/react": patch
---

**Production builds no longer carry component names.** Each part's `displayName` is now set only when `process.env.NODE_ENV` is not `"production"`, so a development build shows `Button`, `AdaptiveMapShell` and every other name in React DevTools and React's warnings as before, and a production build shows `ForwardRef` or `Anonymous` there. Kozmos reads no `displayName` itself.

In exchange, an app's bundler now leaves out every part the app does not use, even one in the same module as something it does. The calls that make a part (`forwardRef`, `memo`, `createContext`, `cva` and the theme's portals) are marked pure, and the name that used to keep each part alive is gone from a production build. Importing `DEFAULT_PANEL_DETENTS` cost the whole map shell, about 8 KB gzipped; it is now a few bytes. `DialogTrigger` alone no longer brings in Dialog, nor `SelectValue` all of Select. Everything at once is about 2 KB smaller gzipped, and no part costs more than before on its own.

Your bundler, or the ESM CDN that serves the package, must replace `process.env.NODE_ENV`, as React itself needs: Vite, webpack, esbuild and Rollup with `@rollup/plugin-replace` do, and so do esm.sh and jsDelivr's `+esm`. A page that loads the files in `dist` unbundled, with nothing to replace it, now throws `process is not defined` when it imports them. In 0.14.0 the same page threw later, when a `Backdrop` first rendered or a part reported an event with no `AnalyticsProvider` around it, since both already read the variable.
