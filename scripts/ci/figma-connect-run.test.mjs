import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  TRANSIENT_FIGMA_FAILURE,
  runFigmaConnect,
} from "../lib/figma-connect-run.mjs";

// A fake CLI: each call prints the next scripted output and exits with its status.
function fakeSpawn(script) {
  const calls = [];
  const spawnImpl = (command, args, options) => {
    const step = script[calls.length] ?? script[script.length - 1];
    calls.push({ command, args, stdio: options.stdio });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setImmediate(() => {
      child.stderr.emit("data", step.output);
      child.emit("close", step.status);
    });
    return child;
  };
  return { spawnImpl, calls };
}

// The CLI's output goes to these sinks, not to the test runner's own stdout.
const sink = () => ({
  text: "",
  write(chunk) {
    this.text += chunk;
    return true;
  },
});
const quiet = () => ({
  sleep: async () => {},
  log: () => {},
  stdout: sink(),
  stderr: sink(),
});

// The three messages main's CI failed on, 4 and 5 Nov 2026.
const SEEN = [
  "Validating Code Connect files...\nFailed to to fetch node info (503): 503 undefined\n",
  "Validating Code Connect files...\nFailed to to fetch node info: TypeError: fetch failed\n",
];

test("the failures main's CI saw are recognised as Figma's, and a real one is not", () => {
  for (const output of SEEN) assert.match(output, TRANSIENT_FIGMA_FAILURE);
  assert.match(
    "Failed to to fetch node info (429): 429 undefined",
    TRANSIENT_FIGMA_FAILURE,
  );
  assert.doesNotMatch(
    "Failed to to fetch node info (403): 403 Forbidden",
    TRANSIENT_FIGMA_FAILURE,
  );
  assert.doesNotMatch(
    "Failed to to fetch node info (404): 404 Not Found",
    TRANSIENT_FIGMA_FAILURE,
  );
  assert.doesNotMatch(
    "Error: invalid Code Connect file KozmosButton.figma.swift",
    TRANSIENT_FIGMA_FAILURE,
  );
});

test("a 503 while validating runs again, and the next success passes", async () => {
  const fake = fakeSpawn([
    { output: SEEN[0], status: 1 },
    { output: "All Code Connect files are valid\n", status: 0 },
  ]);
  const streams = quiet();
  const status = await runFigmaConnect(
    "figma",
    ["connect"],
    {},
    { ...streams, spawnImpl: fake.spawnImpl },
  );
  assert.equal(status, 0);
  // Both runs' output reaches the log, the 503 first.
  assert.match(
    streams.stderr.text,
    /fetch node info \(503\)[\s\S]*All Code Connect files are valid/,
  );
  assert.equal(fake.calls.length, 2);
  assert.deepEqual(fake.calls[0].stdio, ["inherit", "pipe", "pipe"]);
});

test("a failed fetch runs again too", async () => {
  const fake = fakeSpawn([
    { output: SEEN[1], status: 1 },
    { output: "ok\n", status: 0 },
  ]);
  assert.equal(
    await runFigmaConnect(
      "figma",
      [],
      {},
      { ...quiet(), spawnImpl: fake.spawnImpl },
    ),
    0,
  );
  assert.equal(fake.calls.length, 2);
});

test("a file that does not validate fails at once, with no second run", async () => {
  const fake = fakeSpawn([
    { output: "Error: invalid Code Connect file\n", status: 1 },
  ]);
  assert.equal(
    await runFigmaConnect(
      "figma",
      [],
      {},
      { ...quiet(), spawnImpl: fake.spawnImpl },
    ),
    1,
  );
  assert.equal(fake.calls.length, 1);
});

test("an API that keeps failing fails after three runs, with the CLI's status", async () => {
  const waited = [];
  const fake = fakeSpawn([{ output: SEEN[0], status: 1 }]);
  const status = await runFigmaConnect(
    "figma",
    [],
    {},
    {
      ...quiet(),
      spawnImpl: fake.spawnImpl,
      sleep: async (ms) => waited.push(ms),
    },
  );
  assert.equal(status, 1);
  assert.equal(fake.calls.length, 3);
  assert.deepEqual(waited, [15_000, 45_000]);
});

test("one attempt means no retry at all", async () => {
  const fake = fakeSpawn([{ output: SEEN[0], status: 1 }]);
  assert.equal(
    await runFigmaConnect(
      "figma",
      [],
      {},
      { ...quiet(), attempts: 1, spawnImpl: fake.spawnImpl },
    ),
    1,
  );
  assert.equal(fake.calls.length, 1);
});

// Code Connect 1.4 prints "❌ <file>" for a file it could not parse, then
// leaves it out and exits 0: parse, and a dry run that says "All Code Connect
// files are valid". Seen 21 Nov 2026 with a figma.connect URL that was not a
// string literal. A run that left a file out has failed.
test("a run that left a file out because it could not parse it fails, naming the file", async () => {
  const output = [
    "Config file found, parsing packages/react using specified include globs",
    "❌ /repo/packages/react/src/components/Surface/Surface.figma.tsx",
    " -> /repo/packages/react/src/components/Surface/Surface.figma.tsx:10:23",
    "Validating Code Connect files...",
    "All Code Connect files are valid (29433ms)",
    "Dry run complete",
    "",
  ].join("\n");
  const { spawnImpl, calls } = fakeSpawn([{ status: 0, output }]);
  const messages = [];
  const status = await runFigmaConnect("figma", ["connect", "publish"], {}, {
    ...quiet(),
    spawnImpl,
    log: (message) => messages.push(message),
  });
  assert.equal(status, 1);
  assert.equal(calls.length, 1, "a file that does not parse is not retried");
  assert.match(
    messages.join("\n"),
    /could not parse 1 file.*\n.*Surface\.figma\.tsx/,
  );
});

test("a clean run that printed no unparsed file still passes", async () => {
  const { spawnImpl } = fakeSpawn([
    { status: 0, output: "All Code Connect files are valid (1ms)\n" },
  ]);
  assert.equal(
    await runFigmaConnect("figma", ["connect", "parse"], {}, { ...quiet(), spawnImpl }),
    0,
  );
});
