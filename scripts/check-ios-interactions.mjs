import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Run the offline public-XCUITest host and reject absent or skipped tests. */
export function checkIOSInteractions({ root, destination, output }) {
  const host = join(root, "packages/ios/UITestHost");
  const resultPath = join(output, "InteractionResults.xcresult");
  const run = spawnSync(
    "xcodebuild",
    [
      "-project",
      join(host, "KozmosInteractionHost.xcodeproj"),
      "-scheme",
      "KozmosInteractions",
      "-destination",
      destination,
      "-derivedDataPath",
      join(output, "InteractionDerivedData"),
      "-resultBundlePath",
      resultPath,
      "CODE_SIGNING_ALLOWED=NO",
      "test",
    ],
    { cwd: host, stdio: "inherit" },
  );
  if (run.error) throw run.error;
  if (run.status !== 0)
    throw new Error(`iOS interaction tests failed (${run.status})`);
  const readback = spawnSync(
    "xcrun",
    ["xcresulttool", "get", "test-results", "tests", "--path", resultPath],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (readback.status !== 0)
    throw new Error(readback.stderr || "No interaction result readback");
  const declared = [
    ...readFileSync(
      join(host, "UITests/InteractionTests.swift"),
      "utf8",
    ).matchAll(/\bfunc (test\w+)\(/g),
  ].map((match) => `${match[1]}()`);
  verifyInteractionResults(JSON.parse(readback.stdout), declared);
  console.log(
    `Verified ${declared.length} named iOS interaction tests: ${resultPath}`,
  );
}

export function verifyInteractionResults(results, declared) {
  if (!declared.length) throw new Error("No interaction tests declared");
  const cases = [];
  function visit(node) {
    if (node.nodeType === "Test Case") cases.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  for (const node of results.testNodes ?? []) visit(node);
  for (const name of declared) {
    const matches = cases.filter((node) => node.name === name);
    if (matches.length !== 1 || matches[0].result !== "Passed") {
      throw new Error(
        `Interaction ${name}: expected one Passed result, got ${JSON.stringify(matches)}`,
      );
    }
  }
}
