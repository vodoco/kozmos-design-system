# Storybook catalogue

Storybook separates reusable APIs from complete tasks:

- **Foundations:** tokens, typography, icons and theming.
- **Core:** actions, inputs, layout, feedback, overlays and data display.
- **SDK:** map controls, search/browse, place details, navigation and assistant compositions.
- **Examples:** end-to-end or contextual product scenarios, with fixture controls clearly identified.
- **Guides:** platform guidance and retained design-gap references.

The navigation catalogue lives in `scripts/storybook/catalogue.json`. Each CSF file has a literal `title` for indexing and an explicit stable `id`. The catalogue check compares these with the registry and retains every scenario export. The site and generated API documentation respect explicit IDs, so moving a sidebar entry does not break saved URLs, tests or documentation links.

## Find the right page

`SDK/Place details/POIDetailPanel` is the component reference. `Examples/Place details/Venue scenarios` shows contextual venue data, failure and stress scenarios. `Guides/Design gap references/POI details` retains the older Core-composition experiment and its gap annotations; it is not another production POI component.

`Examples/Navigation/Guidance` contains the direction-card and phone/language demonstrations. `Examples/Navigation/Journey` covers the host-driven setup, recovery, navigation and arrival flow. Language and accessibility cases are retained, not removed to simplify the sidebar.

## Make a change safely

The component scaffolder requires a family, for example
`pnpm exec tsx scripts/skills/generate-component.ts ExampleControl "Core/Inputs"`.
It registers the new file, stable ID and initial exports automatically. Its generated implementation
still needs design/API review; the chosen family does not certify it.

1. Select the family and update the catalogue entry and CSF `title` together.
2. Keep the existing `id` and exported story names. For a new file, assign a unique stable ID once.
3. Register new scenario exports; do not delete regression coverage merely to shorten the sidebar.
4. Run `pnpm test:storybook-catalogue`, build React before consumers, then build Storybook and verify its generated index and affected stories.
5. Preserve canonical Linux visual checks. A folder move is not permission to replace visual baselines.

The catalogue is a **discovery structure, not architecture certification**. Implementation/platform coverage still comes from the status inventory. `auditSdkComponents` preserves the previous SDK composition audit scope even if a generic primitive moves to Core; new SDK entries also join the audit. Remaining migrations are listed in [SDK Core composition](sdk-core-composition.md). A component is not proven Core-only by being moved to a new folder.
