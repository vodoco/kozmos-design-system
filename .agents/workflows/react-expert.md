---
description: React & Vue Web SDK Development Expert Rules
---

# Frontend Web Expert Rules (Kozmos Design System)

When operating on the `packages/react` or `packages/vue` workspaces, strictly adhere to the following performance and typing regulations:

1. **Topological Build Awareness**:
   - **Rule**: Never run raw package scripts (`pnpm build`) in isolation if the component relies on local workspace maps (`workspace:*`).
   - You MUST utilize `turborepo` (`pnpm turbo run build --filter=@kozmos-ds/...`) to mathematically guarantee transitive dependencies (like Design Tokens) compile first.

2. **TypeScript Strict Boundaries**:
   - The ecosystem leverages `verbatimModuleSyntax`.
   - **Rule**: Implicitly passing types at runtime will throw fatal `TS1484` isolated module exceptions. You MUST explicitly map syntax bounds using `import type { ... }`.

3. **React Engine Safety**:
   - **Rule**: Prevent stale-closure cascading loops when implementing native hooks (`useEffect`, `useCallback`).
   - Any external callback passed from a Consumer (like `onDispatch`) MUST be stabilized using a synchronised `useRef` to prevent instantaneous re-rendering traps.

4. **DOM Translation Scaling**:
   - **Rule**: When wrapping React components for Vue (Stream 4), disregard heavy Web Component HTML serializers in favor of running native `createRoot` handlers directly inside `display: contents` virtualization domains.
