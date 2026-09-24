import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

/**
 * Scans component implementation status across Web, iOS, and Android.
 *
 * Default: writes STATUS.md.
 * --check: fails when STATUS.md is stale without mutating the workspace.
 * --no-write: prints only.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
const STATUS_PATH = path.join(ROOT_DIR, "STATUS.md");
const args = new Set(process.argv.slice(2));
const INTERNAL_COMPONENT_NAMES = new Set(["GlassSettingsPanel"]);
// Folders under a platform's components root that hold no component. Compose
// keeps KozmosTransitions in components/Motion; iOS keeps it beside the
// components (Sources/KozmosTransitions.swift), and React has none.
const NON_COMPONENT_DIRECTORIES = new Set(["Motion"]);
const PRODUCT_SDK_COMPONENT_NAMES = new Set([
  "AdaptiveMapShell",
  "BrowseCategoriesPanel",
  "CategoryTile",
  "DirectionStep",
  "FloorSelector",
  "LocationPin",
  "MapControlsGroup",
  "MapControlButton",
  "MapOverlay",
  "MapView",
  "POICard",
  "POIDetailPanel",
  "POIMediaGallery",
  "POIResultCard",
  "POIResultList",
  "RouteSummary",
  "RouteOptionCard",
  "RoutePreviewPanel",
  "RoutingInputGroup",
  "SaveLocationCard",
  "UserLocationMarker",
  "WayfindingCard",
]);
const CODE_ONLY_UTILITY_COMPONENT_NAMES = new Set([
  "Heading",
  "Label",
  "NavigationAnnouncer",
  "Text",
  "ThemeProvider",
]);
const PLATFORM_FORM_FACTOR_COMPONENT_NAMES = new Set([
  "DynamicIsland",
  "FeedbackCard",
]);
const CODE_CONNECT_NOT_APPLICABLE_REASONS: Record<string, string> = {
  Heading:
    "Typography primitive maintained through text styles/tokens rather than a Figma component set.",
  Label:
    "Typography/form-label primitive maintained through text styles/tokens and FieldWrapper anatomy.",
  NavigationAnnouncer:
    "Nonvisual accessibility utility with no visible Figma component anatomy.",
  Text: "Typography primitive maintained through text styles/tokens rather than a Figma component set.",
  ThemeProvider:
    "Runtime provider infrastructure; it does not have a visible Figma component set.",
};
const CODE_CONNECT_FILE_OVERRIDES: Record<
  "web" | "ios" | "android",
  Record<string, string>
> = {
  web: {
    FieldWrapper:
      "packages/react/src/components/FieldWrapper/FormField.figma.tsx",
  },
  ios: {},
  android: {},
};

type ComponentLaneId =
  | "core"
  | "code-only"
  | "product-sdk"
  | "platform-form-factor";

const COMPONENT_LANES: Array<{
  id: ComponentLaneId;
  title: string;
  description: string;
}> = [
  {
    id: "core",
    title: "Core",
    description:
      "Domain-neutral design-system components expected to reach Figma, Code Connect, and platform parity.",
  },
  {
    id: "code-only",
    title: "Code-Only / Utility",
    description:
      "Runtime, typography, or nonvisual primitives that are intentionally not Figma component sets.",
  },
  {
    id: "product-sdk",
    title: "Product / SDK",
    description:
      "Map, wayfinding, CMS, dashboard, or product-specific compositions that should consume Core primitives.",
  },
  {
    id: "platform-form-factor",
    title: "Platform / Form-Factor",
    description:
      "Dynamic Island, watch, kiosk, spatial, landscape, and other device-specific surfaces that need separate platform validation before Core promotion.",
  },
];

const PATHS = {
  web: {
    root: "packages/react/src/components",
    component: (name: string) =>
      `packages/react/src/components/${name}/${name}.tsx`,
    story: (name: string) =>
      `packages/react/src/components/${name}/${name}.stories.tsx`,
    test: (name: string) =>
      `packages/react/src/components/${name}/${name}.test.tsx`,
    figma: (name: string) =>
      CODE_CONNECT_FILE_OVERRIDES.web[name] ??
      `packages/react/src/components/${name}/${name}.figma.tsx`,
    barrel: (name: string) => `packages/react/src/components/${name}/index.ts`,
  },
  ios: {
    root: "packages/ios/Sources/Components",
    component: (name: string) =>
      `packages/ios/Sources/Components/${name}/${name}.swift`,
    figma: (name: string) =>
      CODE_CONNECT_FILE_OVERRIDES.ios[name] ??
      `packages/ios/Sources/Components/${name}/${name}.figma.swift`,
  },
  android: {
    root: "packages/android/src/main/java/com/kozmos/components",
    component: (name: string) =>
      `packages/android/src/main/java/com/kozmos/components/${name}/${name}.kt`,
    figma: (name: string) =>
      CODE_CONNECT_FILE_OVERRIDES.android[name] ??
      `packages/android/src/main/java/com/kozmos/components/${name}/${name}.figma.kt`,
  },
};

interface ComponentStatus {
  name: string;
  lane: ComponentLaneId;
  codeConnectApplicable: boolean;
  codeConnectReason?: string;
  web: {
    component: boolean;
    story: boolean;
    test: boolean;
    figmaFile: boolean;
    codeConnect: boolean;
    barrel: boolean;
    exported: boolean;
  };
  ios: {
    component: boolean;
    figmaFile: boolean;
    codeConnect: boolean;
  };
  android: {
    component: boolean;
    figmaFile: boolean;
    codeConnect: boolean;
  };
}

function exists(repoPath: string): boolean {
  return fs.existsSync(path.join(ROOT_DIR, repoPath));
}

function read(repoPath: string): string {
  return fs.readFileSync(path.join(ROOT_DIR, repoPath), "utf-8");
}

function hasRealCodeConnectMapping(repoPath: string): boolean {
  if (!exists(repoPath)) return false;

  const content = read(repoPath);
  const placeholderPatterns = [
    /node-id=TBD/i,
    /TODO:\s*Replace node-id/i,
    /^\s*\/\/\s*Placeholder\b/im,
    /BUTTON_NODE_ID/,
    /FILE_KEY/,
    /https:\/\/(?:www\.)?figma\.com\/(?:file|design)\/XXXXX/i,
  ];

  if (placeholderPatterns.some((pattern) => pattern.test(content))) {
    return false;
  }

  return /figma\.connect\(|@FigmaConnect|figmaNodeUrl|FigmaConnect\(/.test(
    content,
  );
}

function hasCodeConnectFile(repoPath: string): boolean {
  return exists(repoPath);
}

function readComponentDirectories(repoPath: string): string[] {
  const absPath = path.join(ROOT_DIR, repoPath);
  if (!fs.existsSync(absPath)) return [];

  return fs
    .readdirSync(absPath)
    .filter((name) => fs.statSync(path.join(absPath, name)).isDirectory())
    .filter((name) => !INTERNAL_COMPONENT_NAMES.has(name))
    .filter((name) => !NON_COMPONENT_DIRECTORIES.has(name))
    .sort((a, b) => a.localeCompare(b));
}

function discoverComponents(): string[] {
  const names = new Set<string>([
    ...readComponentDirectories(PATHS.web.root),
    ...readComponentDirectories(PATHS.ios.root),
    ...readComponentDirectories(PATHS.android.root),
  ]);

  return [...names].sort((a, b) => a.localeCompare(b));
}

function codeConnectReason(name: string): string | undefined {
  return CODE_CONNECT_NOT_APPLICABLE_REASONS[name];
}

function componentLane(name: string): ComponentLaneId {
  if (CODE_ONLY_UTILITY_COMPONENT_NAMES.has(name)) return "code-only";
  if (PRODUCT_SDK_COMPONENT_NAMES.has(name)) return "product-sdk";
  if (PLATFORM_FORM_FACTOR_COMPONENT_NAMES.has(name))
    return "platform-form-factor";
  return "core";
}

async function checkExports(componentNames: string[]): Promise<Set<string>> {
  const indexPath = path.join(ROOT_DIR, "packages/react/src/index.ts");
  const exportedSet = new Set<string>();

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, "utf-8");
    componentNames.forEach((name) => {
      if (content.includes(`./components/${name}`)) {
        exportedSet.add(name);
      }
    });
  }

  return exportedSet;
}

async function runCheck() {
  console.log("🔍 Checking Component Implementation Status...");
  console.log(`📂 Root: ${ROOT_DIR}\n`);

  const components = discoverComponents();
  const exportedComponents = await checkExports(components);
  const statuses: ComponentStatus[] = [];

  for (const component of components) {
    const webFigmaPath = PATHS.web.figma(component);
    const iosFigmaPath = PATHS.ios.figma(component);
    const androidFigmaPath = PATHS.android.figma(component);
    const notApplicableReason = codeConnectReason(component);
    const codeConnectApplicable = !notApplicableReason;

    statuses.push({
      name: component,
      lane: componentLane(component),
      codeConnectApplicable,
      codeConnectReason: notApplicableReason,
      web: {
        component: exists(PATHS.web.component(component)),
        story: exists(PATHS.web.story(component)),
        test: exists(PATHS.web.test(component)),
        figmaFile: codeConnectApplicable && hasCodeConnectFile(webFigmaPath),
        codeConnect:
          codeConnectApplicable && hasRealCodeConnectMapping(webFigmaPath),
        barrel: exists(PATHS.web.barrel(component)),
        exported: exportedComponents.has(component),
      },
      ios: {
        component: exists(PATHS.ios.component(component)),
        figmaFile: codeConnectApplicable && hasCodeConnectFile(iosFigmaPath),
        codeConnect:
          codeConnectApplicable && hasRealCodeConnectMapping(iosFigmaPath),
      },
      android: {
        component: exists(PATHS.android.component(component)),
        figmaFile:
          codeConnectApplicable && hasCodeConnectFile(androidFigmaPath),
        codeConnect:
          codeConnectApplicable && hasRealCodeConnectMapping(androidFigmaPath),
      },
    });
  }

  printTable(statuses);

  const markdown = await formatMarkdown(generateMarkdown(statuses));

  if (args.has("--check")) {
    const current = fs.existsSync(STATUS_PATH)
      ? fs.readFileSync(STATUS_PATH, "utf-8")
      : "";
    if (current !== markdown) {
      console.error(
        "\n❌ STATUS.md is out of date. Run `pnpm tsx scripts/skills/check-completion.ts --write` and commit the result.",
      );
      process.exit(1);
    }
    console.log("\n✅ STATUS.md is up to date.");
  } else if (args.has("--write") || !args.has("--no-write")) {
    fs.writeFileSync(STATUS_PATH, markdown);
    console.log("\n✅ STATUS.md updated.");
  }

  printSummary(statuses);
}

function printTable(statuses: ComponentStatus[]) {
  const headers = [
    "Component",
    "Lane",
    "Web (C)",
    "Web (S)",
    "Web (T)",
    "Web (CCF)",
    "Web (CCL)",
    "Web (B)",
    "Web (E)",
    "iOS (C)",
    "iOS (CCF)",
    "iOS (CCL)",
    "And (C)",
    "And (CCF)",
    "And (CCL)",
  ];

  const pad = (str: string, len: number) => str.padEnd(len);
  const colWidths = [22, 24, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
  const rowLine = colWidths.map((w) => "-".repeat(w)).join(" | ");

  console.log(headers.map((h, i) => pad(h, colWidths[i])).join(" | "));
  console.log(rowLine);

  statuses.forEach((s) => {
    const codeConnectIcon = (value: boolean) =>
      s.codeConnectApplicable ? icon(value) : "—";
    const row = [
      s.name,
      laneTitle(s.lane),
      icon(s.web.component),
      icon(s.web.story),
      icon(s.web.test),
      codeConnectIcon(s.web.figmaFile),
      codeConnectIcon(s.web.codeConnect),
      icon(s.web.barrel),
      icon(s.web.exported),
      icon(s.ios.component),
      codeConnectIcon(s.ios.figmaFile),
      codeConnectIcon(s.ios.codeConnect),
      icon(s.android.component),
      codeConnectIcon(s.android.figmaFile),
      codeConnectIcon(s.android.codeConnect),
    ];
    console.log(row.map((c, i) => pad(c, colWidths[i])).join(" | "));
  });
}

function generateMarkdown(statuses: ComponentStatus[]): string {
  const headers = [
    "Component",
    "Web (Comp)",
    "Web (Story)",
    "Web (Test)",
    "Web (Code Connect File)",
    "Web (Code Connect Linked)",
    "Web (Barrel)",
    "Web (Export)",
    "iOS (Comp)",
    "iOS (Code Connect File)",
    "iOS (Code Connect Linked)",
    "Android (Comp)",
    "Android (Code Connect File)",
    "Android (Code Connect Linked)",
  ];

  let md = "# Kozmos Design System - Implementation Status\n\n";
  md +=
    "Generated from the component directories by `scripts/skills/check-completion.ts`.\n\n";
  md +=
    "`Code Connect File` means a scaffold or mapping file exists. `Code Connect Linked` means the mapping uses a real Figma node ID and has no placeholder markers such as `node-id=TBD`.\n\n" +
    "Variant and API parity are **not** covered here. Run `pnpm components:variant:check` and see `docs/component-variant-gap-analysis.md` for which variant axes and values each platform can actually express.\n\n";
  md +=
    "`—` means Code Connect is not expected because the component is a code-only, nonvisual, provider, or typography-token primitive.\n\n";
  md +=
    "Internal-only component directories are excluded from the table. Current exclusions: " +
    [...INTERNAL_COMPONENT_NAMES]
      .sort((a, b) => a.localeCompare(b))
      .join(", ") +
    ".\n\n";
  md +=
    "Folders in a platform's component directory that hold no component are skipped too: " +
    [...NON_COMPONENT_DIRECTORIES]
      .sort((a, b) => a.localeCompare(b))
      .join(", ") +
    ".\n\n";

  md += "## Scope Of This Report\n\n";
  md +=
    "A checkmark confirms repository structure only: the expected implementation, story, test, export, or Code Connect mapping file was found. It does not grade the depth or correctness of that file.\n\n";
  md +=
    "This report does **not** prove visual fidelity, accessibility conformance, behavioral completeness, responsive coverage, API parity between React, Vue, SwiftUI, and Compose, meaningful test assertions, or production readiness. Those require separate contract, interaction, accessibility, visual-regression, and cross-platform review gates. Vue is not included in this table.\n\n";

  md += "## Lane Summary\n\n";
  md += generateLaneSummary(statuses);

  for (const lane of COMPONENT_LANES) {
    const laneStatuses = statuses.filter((s) => s.lane === lane.id);
    if (laneStatuses.length === 0) continue;

    md += `\n## ${lane.title}\n\n`;
    md += `${lane.description}\n\n`;
    md += `| ${headers.join(" | ")} |\n`;
    md += `| ${headers.map(() => "---").join(" | ")} |\n`;

    laneStatuses.forEach((s) => {
      const codeConnectIcon = (value: boolean) =>
        s.codeConnectApplicable ? icon(value) : "—";
      const row = [
        s.name,
        icon(s.web.component),
        icon(s.web.story),
        icon(s.web.test),
        codeConnectIcon(s.web.figmaFile),
        codeConnectIcon(s.web.codeConnect),
        icon(s.web.barrel),
        icon(s.web.exported),
        icon(s.ios.component),
        codeConnectIcon(s.ios.figmaFile),
        codeConnectIcon(s.ios.codeConnect),
        icon(s.android.component),
        codeConnectIcon(s.android.figmaFile),
        codeConnectIcon(s.android.codeConnect),
      ];
      md += `| ${row.join(" | ")} |\n`;
    });
  }

  const notApplicable = statuses.filter((s) => !s.codeConnectApplicable);
  if (notApplicable.length > 0) {
    md += "\n## Code Connect Not Applicable\n\n";
    notApplicable.forEach((s) => {
      md += `- ${s.name}: ${s.codeConnectReason}\n`;
    });
  }

  md += "\n## Summary\n";
  md += summaryLines(statuses)
    .map((line) => `- ${line}`)
    .join("\n");
  md += "\n";

  return md;
}

async function formatMarkdown(markdown: string): Promise<string> {
  const config = (await prettier.resolveConfig(STATUS_PATH)) ?? {};

  return prettier.format(markdown, {
    ...config,
    parser: "markdown",
  });
}

function printSummary(statuses: ComponentStatus[]) {
  console.log("\n📊 Summary:");
  summaryLines(statuses).forEach((line) => console.log(line));
}

function generateLaneSummary(statuses: ComponentStatus[]): string {
  const headers = [
    "Lane",
    "Components",
    "Web",
    "Web Tests",
    "Web CCL",
    "iOS",
    "iOS CCL",
    "Android",
    "Android CCL",
  ];

  let md = `| ${headers.join(" | ")} |\n`;
  md += `| ${headers.map(() => "---").join(" | ")} |\n`;

  for (const lane of COMPONENT_LANES) {
    const laneStatuses = statuses.filter((s) => s.lane === lane.id);
    if (laneStatuses.length === 0) continue;

    md += `| ${[
      lane.title,
      laneStatuses.length.toString(),
      ratio(laneStatuses, (s) => s.web.component),
      ratio(laneStatuses, (s) => s.web.test),
      codeConnectRatio(laneStatuses, (s) => s.web.codeConnect),
      ratio(laneStatuses, (s) => s.ios.component),
      codeConnectRatio(laneStatuses, (s) => s.ios.codeConnect),
      ratio(laneStatuses, (s) => s.android.component),
      codeConnectRatio(laneStatuses, (s) => s.android.codeConnect),
    ].join(" | ")} |\n`;
  }

  return `${md}\n`;
}

function summaryLines(statuses: ComponentStatus[]): string[] {
  const total = statuses.length;
  const codeConnectApplicableStatuses = statuses.filter(
    (status) => status.codeConnectApplicable,
  );
  const codeConnectTotal = codeConnectApplicableStatuses.length;
  const count = (selector: (status: ComponentStatus) => boolean) =>
    statuses.filter(selector).length;
  const codeConnectCount = (selector: (status: ComponentStatus) => boolean) =>
    codeConnectApplicableStatuses.filter(selector).length;

  return [
    `Web components: ${count((s) => s.web.component)}/${total}`,
    `Web stories: ${count((s) => s.web.story)}/${total}`,
    `Web tests: ${count((s) => s.web.test)}/${total}`,
    `Web Code Connect files: ${codeConnectCount((s) => s.web.figmaFile)}/${codeConnectTotal}`,
    `Web Code Connect scaffolds: ${codeConnectCount((s) => s.web.figmaFile && !s.web.codeConnect)}/${codeConnectTotal}`,
    `Web Code Connect linked: ${codeConnectCount((s) => s.web.codeConnect)}/${codeConnectTotal}`,
    `iOS components: ${count((s) => s.ios.component)}/${total}`,
    `iOS Code Connect files: ${codeConnectCount((s) => s.ios.figmaFile)}/${codeConnectTotal}`,
    `iOS Code Connect scaffolds: ${codeConnectCount((s) => s.ios.figmaFile && !s.ios.codeConnect)}/${codeConnectTotal}`,
    `iOS Code Connect linked: ${codeConnectCount((s) => s.ios.codeConnect)}/${codeConnectTotal}`,
    `Android components: ${count((s) => s.android.component)}/${total}`,
    `Android Code Connect files: ${codeConnectCount((s) => s.android.figmaFile)}/${codeConnectTotal}`,
    `Android Code Connect scaffolds: ${codeConnectCount((s) => s.android.figmaFile && !s.android.codeConnect)}/${codeConnectTotal}`,
    `Android Code Connect linked: ${codeConnectCount((s) => s.android.codeConnect)}/${codeConnectTotal}`,
    `Code Connect not applicable: ${count((s) => !s.codeConnectApplicable)}/${total}`,
  ];
}

function laneTitle(lane: ComponentLaneId): string {
  return (
    COMPONENT_LANES.find((definition) => definition.id === lane)?.title ?? lane
  );
}

function ratio(
  statuses: ComponentStatus[],
  selector: (status: ComponentStatus) => boolean,
): string {
  return `${statuses.filter(selector).length}/${statuses.length}`;
}

function codeConnectRatio(
  statuses: ComponentStatus[],
  selector: (status: ComponentStatus) => boolean,
): string {
  const applicableStatuses = statuses.filter(
    (status) => status.codeConnectApplicable,
  );
  if (applicableStatuses.length === 0) return "—";
  return `${applicableStatuses.filter(selector).length}/${applicableStatuses.length}`;
}

function icon(bool: boolean): string {
  return bool ? "✅" : "❌";
}

runCheck();
