---
---

The React bridge's `v-model` (each wrapper names React's prop, its change callback and what React is given while the model is null), its listeners (routed by name to React or to the wrapper's own box, each run once) and its attributes (React's alone, never the wrapper's own box as well) change only `@kozmos-ds/vue`, which is private. Its sources are inputs to `@kozmos-ds/styles`' Tailwind build, but `style.css` and `reset.css` built from this branch are byte-identical to main's, so styles and React have nothing to release. Input's docs page changes only its Vue tab.
