import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import {
  audit,
  sdkComponentNames,
  webFindings,
} from "../audit-sdk-composition.mjs";
import * as composition from "../audit-sdk-composition.mjs";

test("Android saved-location guidance uses the shared success action and pointer", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/android/src/main/java/com/kozmos/components/SaveLocationCard/SaveLocationCard.kt",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(source, /emotion = KozmosButtonEmotion\.Success/);
  assert.match(source, /KozmosIcon\("navigation-pointer-01"/);
  assert.doesNotMatch(source, /Icons\.Default\.Navigation/);
});

test("Swift saved-location labelled actions compose Core Button", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/ios/Sources/Components/SaveLocationCard/SaveLocationCard.swift",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    source,
    /KozmosButton\(isSaved \? "Remove Location" : "Save Location"/,
  );
  assert.match(source, /KozmosButton\("Guide Me", emotion: \.success/);
  assert.doesNotMatch(
    source,
    /Label\(isSaved \? "Remove Location"|Label\("Guide Me"/,
  );
});

test("Swift legacy route ending delegates its danger action to Core", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/ios/Sources/Components/RouteSummary/RouteSummary.swift",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(source, /\bButton\(action: onEndRoute\)/);
  assert.match(
    source,
    /KozmosIconButton\(iconName: "xmark", variant: \.destructive, action: onEndRoute\)/,
  );
});

test("Swift map-shell fixture slots use Core actions", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/ios/UITestHost/App/InteractionHost.swift",
      import.meta.url,
    ),
    "utf8",
  );
  for (const label of ["Language", "Zoom", "Locate"]) {
    assert.match(source, new RegExp(`KozmosButton\\("${label}"`));
    assert.doesNotMatch(
      source,
      new RegExp(`(?<!Kozmos)\\bButton\\("${label}"`),
    );
  }
});

test("Android saved-location removal uses the same Core action as saving", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/android/src/main/java/com/kozmos/components/SaveLocationCard/SaveLocationCard.kt",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(source, /\bOutlinedButton\(/);
  assert.match(source, /KozmosButtonVariant\.Outline/);
});

test("adaptive shell peek fixture delegates its Go control to Core", () => {
  const source = fs.readFileSync(
    new URL(
      "../../packages/react/src/components/AdaptiveMapShell/AdaptiveMapShell.stories.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.deepEqual(
    webFindings(source).filter((finding) => finding.kind === "native-control"),
    [],
    "Product-like fixture actions must compose Core controls",
  );
  assert.match(source, /data-testid="card-go"[\s\S]*?panelPeekAnchorProps/);
});

test("example audit includes contextual stories and follows their helpers without claiming Core compliance", () => {
  assert.equal(typeof composition.auditExamples, "function");
  const examples = composition.auditExamples();
  assert.ok(
    examples.some((entry) => entry.title === "Examples/Navigation/Guidance"),
  );
  assert.ok(
    examples.some(
      (entry) => entry.title === "SDK/Navigation/RouteProgressRail",
    ),
  );
  assert.ok(
    examples.some(
      (entry) => entry.title === "Guides/Design gap references/POI details",
    ),
  );
  assert.ok(examples.every((entry) => entry.files.length > 0));
  assert.ok(
    examples.some((entry) =>
      entry.files.some((file) => file.findings.length > 0),
    ),
    "Existing raw controls remain visible for migration",
  );
});

test("native result action adapters compose Core Button rather than reimplement it", () => {
  const root = new URL("../../", import.meta.url);
  for (const [file, boundary] of [
    [
      "packages/ios/Sources/Components/POIResultCard/POIResultCard.swift",
      "private struct KozmosPOIResultActionButton",
    ],
    [
      "packages/android/src/main/java/com/kozmos/components/POIResultCard/POIResultCard.kt",
      "private fun KozmosPOIResultActionButton",
    ],
  ]) {
    const helper = fs
      .readFileSync(new URL(file, root), "utf8")
      .split(boundary)[1]
      ?.split("private fun POILogo")[0];
    assert.ok(helper, file);
    assert.match(helper, /KozmosButton\(/, file);
    assert.doesNotMatch(helper, /(?:\bButton|\bSurface)\(/, file);
    assert.doesNotMatch(
      helper,
      /componentsPrimaryButtons|semanticsBorderSubtle/,
      file,
    );
  }
});

test("follows helper imports/re-exports, but leaves another component at its ownership boundary", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "kozmos-composition-"),
  );
  try {
    const components = path.join(directory, "components");
    fs.mkdirSync(path.join(components, "SDK"), { recursive: true });
    fs.mkdirSync(path.join(components, "Core"));
    fs.mkdirSync(path.join(directory, "helpers"));
    fs.writeFileSync(
      path.join(components, "SDK", "SDK.tsx"),
      `import '../../helpers'; import '../Core';`,
    );
    fs.writeFileSync(
      path.join(components, "Core", "index.tsx"),
      `export const Core = () => <button/>;`,
    );
    fs.writeFileSync(
      path.join(directory, "helpers", "index.ts"),
      `export * from './control.js';`,
    );
    fs.writeFileSync(
      path.join(directory, "helpers", "control.ts"),
      `import { createElement } from 'react'; export const control = createElement('button');`,
    );
    assert.equal(
      typeof composition.implementationGraph,
      "function",
      "audit must inspect helper dependencies",
    );
    const graph = composition.implementationGraph(
      path.join(components, "SDK"),
      components,
    );
    assert.deepEqual(
      graph.files.map((file) => path.relative(directory, file)).sort(),
      ["components/SDK/SDK.tsx", "helpers/control.ts", "helpers/index.ts"],
    );
    assert.ok(
      graph.boundaries.some(
        (item) => item.target === path.join(components, "Core", "index.tsx"),
      ),
    );
    assert.deepEqual(graph.unresolved, []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("reports React factory controls, intrinsic aliases and implicit disclosure interactions", () => {
  const hits = webFindings(`import R, { createElement as h } from 'react';
    const Tag = 'button'; const ui = <><Tag/><summary>More</summary><div role="button" tabIndex={0}/></>;
    h('input'); R.createElement('textarea');`);
  assert.deepEqual(
    hits
      .filter((hit) => hit.kind === "native-control")
      .map((hit) => hit.detail),
    ["button", "summary", "input", "textarea"],
  );
  assert.ok(
    hits.some(
      (hit) =>
        hit.kind === "custom-interaction" && hit.detail === "div.role=button",
    ),
  );
});

test("SDK browser regressions run in the existing three-engine navigation lane", () => {
  const root = new URL("../../", import.meta.url);
  const pkg = JSON.parse(
    fs.readFileSync(new URL("package.json", root), "utf8"),
  );
  assert.ok(
    pkg.scripts["test:navigation"].includes(
      "node scripts/check-sdk-core-controls.mjs",
    ),
  );
  const script = fs.readFileSync(
    new URL("scripts/check-sdk-core-controls.mjs", root),
    "utf8",
  );
  assert.ok(
    script.includes('"http://127.0.0.1:6006"'),
    "default must use the CI Storybook port",
  );
  const workflow = YAML.parse(
    fs.readFileSync(new URL(".github/workflows/ci.yml", root), "utf8"),
  );
  const shards = workflow.jobs.browsers.strategy.matrix.shard;
  const navigation = shards.filter((shard) =>
    shard.run.includes("test:navigation"),
  );
  assert.equal(navigation.length, 3);
  assert.ok(
    navigation.some((shard) => shard.run.includes("ADAPTIVE_BROWSER=firefox")),
  );
  assert.ok(
    navigation.some((shard) => shard.run.includes("ADAPTIVE_BROWSER=webkit")),
  );
  assert.ok(
    workflow.jobs.browsers.steps.some((step) =>
      step.with?.path?.includes("test-results/sdk-core-controls"),
    ),
  );
});

test("covers both inventories, including previously omitted SDK families", () => {
  const names = sdkComponentNames();
  for (const name of [
    "AICompanionPanel",
    "AIInputBar",
    "POIResultGroup",
    "CategoryField",
    "ManoeuvreCard",
    "Itinerary",
    "RouteProgressRail",
    "SearchBar",
  ])
    assert.ok(names.includes(name), name);
});
test("parses raw controls and style-only aliases, not prose or examples in comments", () => {
  const result =
    webFindings(`import { inputVariants as styles } from '../Input';
    // <button> is not an element here
    const text = '<input>';
    const ui = <><button onClick={go}>Go</button><input/><div onClick={go}/></>;`);
  assert.deepEqual(
    result.map(({ kind, detail }) => [kind, detail]),
    [
      ["style-only-reuse", "inputVariants"],
      ["native-control", "button"],
      ["native-control", "input"],
      ["custom-interaction", "div.onClick"],
    ],
  );
});
test("Core composition is not reported as a raw-control candidate", () => {
  assert.deepEqual(
    webFindings(`const ui = <Button onClick={go}><Icon/></Button>;`),
    [],
  );
});

test("migrated SDK control paths cannot reintroduce raw controls", () => {
  const report = audit();
  for (const name of ["AICompanionPanel", "CategoryField", "WayfindingCard"]) {
    const hits = report
      .find((component) => component.name === name)
      .platforms.react.files.flatMap((file) =>
        file.findings.filter((hit) =>
          ["native-control", "style-only-reuse"].includes(hit.kind),
        ),
      );
    assert.deepEqual(hits, [], `${name} must compose Core controls`);
  }
  // Explicit remaining migration debt, not a claim these two modules are pure.
  // Pin the residual controls so another ordinary action cannot be added quietly.
  for (const [name, remaining] of [
    ["POIResultCard", ["button"]],
    ["AIInputBar", ["input", "button"]],
  ]) {
    const hits = report
      .find((component) => component.name === name)
      .platforms.react.files.flatMap((file) =>
        file.findings
          .filter((hit) => hit.kind === "native-control")
          .map((hit) => hit.detail),
      );
    assert.deepEqual(
      hits,
      remaining,
      `${name}: update the migration map when removing debt; do not add copied controls`,
    );
  }
});
