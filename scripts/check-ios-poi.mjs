// Native render tests must run on a simulator: `swift test` on macOS excludes them.
// Set KOZMOS_IOS_TEST_DESTINATION to pin a device/runtime locally.
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const discovery = spawnSync(
  "xcrun",
  ["simctl", "list", "devices", "available", "--json"],
  { encoding: "utf8" },
);
if (discovery.status !== 0)
  throw new Error(discovery.stderr || "Simulator discovery failed");
const runtimes = Object.entries(JSON.parse(discovery.stdout).devices)
  .filter(([runtime]) => /\.iOS-/.test(runtime))
  .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }));
const device = runtimes
  .flatMap(([, devices]) => devices)
  .find((device) => device.isAvailable && device.name.startsWith("iPhone"));
const destination =
  process.env.KOZMOS_IOS_TEST_DESTINATION ??
  (device && `platform=iOS Simulator,id=${device.udid}`);
if (!destination)
  throw new Error(
    "No available iPhone simulator. Install an iOS runtime in Xcode.",
  );
const output = mkdtempSync(
  join(process.env.RUNNER_TEMP || tmpdir(), "kozmos-ios-poi-"),
);
console.log(`Native POI test destination: ${destination}\nResults: ${output}`);
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
    "-only-testing:KozmosTests/KozmosPOIDetailTests",
    "-only-testing:KozmosTests/KozmosPOIMediaGalleryTests",
    "-only-testing:KozmosTests/KozmosAdaptiveMapShellTests",
    // The sheet's panel header (row 73): rendered and dragged, so the
    // simulator is the only place it runs.
    "-only-testing:KozmosTests/KozmosMapShellPanelHeaderTests",
    // Skeleton's and FloorSelector's (rows 56 and 69): most of each runs in
    // `swift test` too, but their Dynamic Type cases and the open list's
    // render only run here — a Mac does not scale @ScaledMetric.
    "-only-testing:KozmosTests/KozmosSkeletonTests",
    "-only-testing:KozmosTests/KozmosFloorSelectorTests",
    "-only-testing:KozmosTests/ProductContractsTests",
    "CODE_SIGNING_ALLOWED=NO",
    "test",
  ],
  { cwd: join(root, "packages/ios"), stdio: "inherit" },
);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
