/**
 * The recipes every Kozmos framework draws with: classes, custom properties
 * and drawings, with nothing that renders. React's parts import them by
 * path; `@kozmos-ds/vue` builds them in through its `#kozmos-recipes` alias,
 * so the two draw the same element from one source (Vue 3 Phase 0). A recipe
 * moves here when its part gets a Vue port. `recipes.framework-free.test.ts`
 * holds this folder, and `cn` in `../utils`, to framework-free imports.
 */
export { cn } from "../utils";
export * from "./button";
export * from "./spinner-arc";
