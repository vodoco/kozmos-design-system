// The React 18 run's global setup (vitest.react18.config.mts). As the run
// starts, it clears the one folder every worker writes its resolutions to
// (react18.mjs' LOG_DIR), so no run reads another's and none leaves a folder
// behind. As the run ends, it reads every worker's entries and fails the run
// unless each react and react-dom file Node resolved, in every worker, is
// React 18's. Vitest reports an error thrown here but still exits 0, so the
// teardown sets the exit code itself.
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { LOG_DIR, LOG_FILE, isReact18 } from "./react18.mjs";

export function setup() {
  rmSync(LOG_DIR, { recursive: true, force: true });
  mkdirSync(LOG_DIR, { recursive: true });
}

/** Fails the run: vitest exits 0 on a teardown error alone. */
function fail(message) {
  process.exitCode = 1;
  throw new Error(message);
}

export function teardown() {
  const entries = existsSync(LOG_FILE)
    ? readFileSync(LOG_FILE, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
  if (!entries.length)
    fail(
      `the React 18 run recorded no resolution of react or react-dom in ${LOG_FILE}: test/react18/hooks.mjs did not run`,
    );
  const outside = entries.filter(({ file }) => !isReact18(file));
  if (outside.length)
    fail(
      `the React 18 run resolved React outside React 18 in ${outside.length} of ${entries.length} resolutions: ${outside
        .slice(0, 5)
        .map(
          ({ pid, specifier, file }) => `${specifier} → ${file} (pid ${pid})`,
        )
        .join("; ")}`,
    );
  const workers = new Set(entries.map(({ pid }) => pid)).size;
  console.log(
    `React 18 run: ${entries.length} resolutions of react and react-dom over ${workers} workers, every one React 18's`,
  );
}
