// Runs the Figma Code Connect CLI with its output streamed as before, and runs
// it again when, and only when, Figma's API failed to answer while the CLI
// validated the files: "Failed to to fetch node info (503)", (429), or
// "fetch failed". Three of main's four CI failures from 4 to 5 Nov 2026 were
// that and nothing in the repository. Any other failure — a mapping that does
// not validate, a missing token, an unreadable file — ends the run at once.
import { spawn } from "node:child_process";

/** What Code Connect 1.4 prints when Figma's API, not the files, failed. */
export const TRANSIENT_FIGMA_FAILURE =
  /Failed to to fetch node info(?: \((?:429|5\d\d)\)|: TypeError: fetch failed)/;

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function runOnce(command, args, options, spawnImpl, out, err) {
  return new Promise((resolve) => {
    const child = spawnImpl(command, args, {
      ...options,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
      out.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
      err.write(chunk);
    });
    child.on("error", (error) => {
      output += String(error);
      resolve({ status: 1, output });
    });
    child.on("close", (status) => resolve({ status: status ?? 1, output }));
  });
}

/**
 * Runs `command` up to `attempts` times, waiting `waits[i]` ms before retry
 * i + 1, while it fails with Figma's transient API failure. Returns the last
 * exit status.
 */
export async function runFigmaConnect(
  command,
  args,
  options = {},
  {
    attempts = 3,
    waits = [15_000, 45_000],
    spawnImpl = spawn,
    sleep = defaultSleep,
    log = (message) => console.error(message),
    stdout = process.stdout,
    stderr = process.stderr,
  } = {},
) {
  let result;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    result = await runOnce(command, args, options, spawnImpl, stdout, stderr);
    if (result.status === 0) return 0;
    if (!TRANSIENT_FIGMA_FAILURE.test(result.output) || attempt === attempts) {
      return result.status;
    }
    const wait = waits[Math.min(attempt - 1, waits.length - 1)];
    log(
      `Figma's API failed to answer (attempt ${attempt} of ${attempts}); the files were not the cause. Running again in ${Math.round(wait / 1000)} s.`,
    );
    await sleep(wait);
  }
  return result.status;
}
