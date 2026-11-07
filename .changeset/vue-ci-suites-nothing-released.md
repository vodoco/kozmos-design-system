---
---

CI, the visual review and the bundle analyzer now check `@kozmos-ds/vue` (Vue 3 Phase 0, P0.5): a Vue job, four browser suites over the Vue Storybook, Vue baselines and a budget. The Vue Storybook's decorator and stories, and the React bridge's v-model fix, change only `@kozmos-ds/vue`, which is private. Its sources are inputs to `@kozmos-ds/styles`' Tailwind build, but `style.css` and `reset.css` built from this branch are byte-identical to main's, so styles and React have nothing to release.
