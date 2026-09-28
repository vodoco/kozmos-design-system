/**
 * The main checks that run on every pull request, from
 * `.github/workflows/ci.yml` on the branch the site is built on, and the
 * scripts they call. Grouped as the workflow's steps are. The workflow also
 * checks the documentation's code samples, an installed product's build,
 * the internal Vue harness and its own governance; those are left out here.
 */
export interface Gate {
  title: string;
  detail: string;
  /** The pnpm script or command the step runs, where there is one to name. */
  command?: string;
}

export const ciGates: readonly Gate[] = [
  {
    title: "Lint, build and unit tests",
    detail:
      "The workspace lints (the example app’s lint reports without blocking), every package builds, and the unit tests run, with axe on Button, IconButton, Card, Input and Tooltip.",
    command: "pnpm lint && pnpm build && pnpm test",
  },
  {
    title: "Contracts between platforms",
    detail:
      "Each platform’s component sources are compared against the shared contract, the web’s Pact contracts are verified, and the POI examples and taxonomy the iOS playground apps carry must still match the web’s.",
    command: "pnpm components:contract:check",
  },
  {
    title: "Token contracts: contrast, radius, border, elevation, type family",
    detail:
      "The contract’s contrast pairs, every button emotion and state, and the category inks are measured in both themes from the generated CSS. Radius, border and elevation are held to the same values on every platform, nested radii are checked, and every platform reads the one type family.",
    command: "pnpm tokens:contrast:check",
  },
  {
    title: "No new raw values",
    detail:
      "A ratchet over a known backlog: every React component and its CSS recipe is scanned for raw Tailwind colours and radii. The count may not rise, and a fall must lower the recorded baseline.",
    command: "pnpm tokens:raw:check",
  },
  {
    title: "No classes that compile to nothing",
    detail:
      "A Tailwind class with an opacity or fraction modifier the build cannot generate is dropped without a word; each one is looked up in the built stylesheet, against a ratchet.",
    command: "pnpm components:classes:check",
  },
  {
    title: "Packages install from their tarballs",
    detail:
      "Every public package is packed and installed into an empty project with npm, once for React 18 and once for 19: every export and README import resolves, the README samples type-check, and a Button with an Icon renders on the server.",
    command: "pnpm packages:install:check",
  },
  {
    title: "Figma plugin stamp and painters",
    detail:
      "The importer plugin’s build must match its source, and its painters run against a stand-in for Figma’s Plugin API, where what they draw is measured.",
    command: "pnpm figma:painters:check",
  },
  {
    title: "Code Connect parses on three platforms",
    detail:
      "The React, SwiftUI and Compose mappings are parsed, and dry-run against the Figma file when the token is present.",
    command: "pnpm figma:parse:linked",
  },
  {
    title: "Browser checks in Chromium, Firefox and WebKit",
    detail:
      "Built output is driven in three engines: adaptive layout geometry, overlay ownership, theme and stylesheet isolation, scoped configuration, and form-control compatibility.",
    command: "pnpm test:adaptive",
  },
  {
    title: "Storybook, audited",
    detail:
      "Every React story is opened and checked with axe in Chromium; a set of stories' keyboard and scroll interactions run in three engines, and the documentation pages and the SDK’s POI reference screens are checked too.",
    command: "pnpm test:storybook-audit",
  },
  {
    title: "iOS: build, test and render",
    detail:
      "The Swift package builds and its tests pass, the POI views render on an iOS simulator, and the SwiftUI Code Connect parses.",
    command: "swift build && swift test",
  },
  {
    title: "Android: build and screenshot tests",
    detail:
      "The Compose library builds, its Paparazzi screenshots are compared, and the Compose Code Connect parses.",
    command: "./gradlew verifyPaparazziDebug",
  },
];
