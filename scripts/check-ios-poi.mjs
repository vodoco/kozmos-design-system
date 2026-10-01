// The whole iOS test target, on one pinned simulator. `swift test` on macOS
// compiles every `#if os(iOS)` test to nothing, so this is the only place the
// render tests run, in CI and in `ci-local --job ios`.
//
// It used to name its classes one by one, and the list drifted: on 2026-09-28,
// 18 of the 25 classes with iOS-only tests had never run in CI, among them the
// search sheet's 15 and the button's image snapshots, whose loading reference
// still showed the spinner the button lost on 2026-09-22. Running the target
// cannot leave a class out.
//
// The device is pinned because KozmosButtonImageSnapshotTests compares against
// images recorded on it, and a render differs across iOS versions. When a
// runner image drops this runtime, the run fails here rather than picking
// another device: record those images again on the new device (the test's
// header says how) and move the pin in the same change.
// KOZMOS_IOS_TEST_DESTINATION overrides the pin for a local run; on another
// device, expect the button's image snapshots to fail.
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkIOSInteractions } from "./check-ios-interactions.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const discovery = spawnSync(
  "xcrun",
  ["simctl", "list", "devices", "available", "--json"],
  { encoding: "utf8" },
);
if (discovery.status !== 0)
  throw new Error(discovery.stderr || "Simulator discovery failed");
const PINNED = { name: "iPhone 17 Pro", runtime: "iOS-26-5" };
const device = Object.entries(JSON.parse(discovery.stdout).devices)
  .filter(([runtime]) => runtime.endsWith(`.${PINNED.runtime}`))
  .flatMap(([, devices]) => devices)
  .find((device) => device.isAvailable && device.name === PINNED.name);
const destination =
  process.env.KOZMOS_IOS_TEST_DESTINATION ??
  (device && `platform=iOS Simulator,id=${device.udid}`);
if (!destination)
  throw new Error(
    `No ${PINNED.name} simulator on ${PINNED.runtime.replace(/-(\d+)-(\d+)$/, " $1.$2")}. ` +
      "Its images are what KozmosButtonImageSnapshotTests compares with: record them " +
      "on the device you move to, and move PINNED in the same change.",
  );
const output = mkdtempSync(
  join(process.env.RUNNER_TEMP || tmpdir(), "kozmos-ios-poi-"),
);
console.log(`Simulator test destination: ${destination}\nResults: ${output}`);
const run = spawnSync(
  "xcodebuild",
  [
    "-scheme",
    "Kozmos",
    "-destination",
    destination,
    "-derivedDataPath",
    join(output, "DerivedData"),
    "-resultBundlePath",
    join(output, "TestResults.xcresult"),
    "CODE_SIGNING_ALLOWED=NO",
    "test",
  ],
  { cwd: join(root, "packages/ios"), stdio: "inherit" },
);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
if (run.status === 0) checkIOSInteractions({ root, destination, output });
