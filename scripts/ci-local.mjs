/**
 * Run CI's own steps on this machine.
 *
 * The step list is not copied here: it is read out of .github/workflows/ci.yml,
 * so the two cannot drift. A hand-kept copy would agree on the day it was
 * written and quietly stop agreeing after that, which is the failure this is
 * meant to prevent - a green run locally that means nothing.
 *
 * What it will not do is pretend. A step that needs a GitHub-hosted runner, a
 * repository secret, or an uploaded artifact is reported as skipped with the
 * reason, never as passed.
 *
 *   pnpm ci:local                 every step of the web job
 *   pnpm ci:local --list          what would run, and what would be skipped
 *   pnpm ci:local --job ios       another job
 *   pnpm ci:local --only token    only steps whose name contains "token"
 *   pnpm ci:local --from 12       resume at step 12
 *   pnpm ci:local --bail          stop at the first failure
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = execSync("git rev-parse --show-toplevel").toString().trim();

// This repository keeps FIGMA_ACCESS_TOKEN in .env, and CI keeps it as a
// secret. Reading it here lets the two Figma steps run rather than be skipped.
const dotenv = path.join(root, ".env");
if (fs.existsSync(dotenv)) {
  for (const line of fs.readFileSync(dotenv, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]])
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
}
const workflow = parse(
  fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8"),
);

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? fallback : argv[at + 1];
};
const has = (name) => argv.includes(`--${name}`);

const jobKey = flag("job", "web");
const job = workflow.jobs[jobKey];
if (!job) {
  console.error(
    `no job "${jobKey}" in ci.yml. Jobs: ${Object.keys(workflow.jobs).join(", ")}`,
  );
  process.exit(2);
}

/**
 * The secrets a step reads, by the name CI gives them. A secret is not a
 * reason to skip on its own: this machine may already hold the same value, and
 * .env is where this repository keeps it. Only a missing one is.
 */
function secretsUsed(step) {
  const text = JSON.stringify(step.env ?? {}) + String(step.run ?? "");
  return [...text.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]);
}

/** Why a step cannot run here, or null when it can. */
function skipReason(step) {
  if (step.uses) return `provisions the runner (${step.uses})`;
  if (!step.run) return "has nothing to run";
  const missing = secretsUsed(step).filter((name) => !process.env[name]);
  if (missing.length) return `needs ${missing.join(", ")} in the environment`;
  if (step.if && !/always\(\)/.test(String(step.if)))
    return `runs only when ${step.if}`;
  return null;
}

/** `${{ secrets.X }}` becomes this machine's X. */
function resolveEnv(step) {
  const out = {};
  for (const [key, value] of Object.entries(step.env ?? {})) {
    out[key] = String(value).replace(
      /\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}/g,
      (_, name) => process.env[name] ?? "",
    );
  }
  return out;
}

/** The fixed ports a step serves on, if any. */
function portsOf(run) {
  return [
    ...new Set(
      [...String(run ?? "").matchAll(/127\.0\.0\.1:(\d{4,5})/g)].map((m) => m[1]),
    ),
  ];
}

/**
 * concurrently kills its siblings with SIGTERM, and a python http.server does
 * not always go. One that survives makes the next step fail with "Address
 * already in use", which is how five steps failed on the first run here and
 * none of them for a reason worth reading.
 */
function releasePorts(ports) {
  for (const port of ports) {
    const pids = spawnSync(
      "lsof",
      ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      { encoding: "utf8" },
    );
    for (const pid of (pids.stdout ?? "").split("\n").filter(Boolean)) {
      spawnSync("kill", [pid]);
    }
  }
}

// A matrix job is one job to GitHub and many runs. Locally there is one
// machine, so its shards are laid end to end: `--shard` picks one, and
// without it every shard runs in turn. Expanding here rather than in the
// runner keeps `--only`, `--from` and `--list` working on the real step
// list, which is what makes the local run comparable to the remote one.
const shards = job.strategy?.matrix?.shard ?? null;
const wantedShard = flag("shard");

function expand(text, shard) {
  if (typeof text !== "string" || !shard) return text;
  return text.replace(
    /\$\{\{\s*matrix\.shard\.([A-Za-z0-9_]+)\s*\}\}/g,
    (whole, key) => (key in shard ? String(shard[key]) : whole),
  );
}

function stepsFor(shard) {
  return (job.steps ?? []).map((step, index) => {
    const run = expand(step.run, shard);
    return {
      number: index + 1,
      name: expand(step.name, shard) ?? `step ${index + 1}`,
      run,
      env: step,
      // GitHub runs a step from its working-directory; ci-local ran every one
      // from the repository root. Four steps declare one - both iOS steps and
      // both Android ones - and all four failed here with "Could not find
      // Package.swift", which reads as a broken build rather than a broken
      // runner. A local gate that cannot run the steps it lists is worse than
      // no local gate.
      cwd: step["working-directory"] ?? null,
      ports: portsOf(run),
      skip: skipReason(step),
      shard: shard ? expand(shard.name, shard) : null,
    };
  });
}

if (shards && wantedShard) {
  const picked = shards.filter((shard) =>
    String(shard.name).toLowerCase().includes(String(wantedShard).toLowerCase()),
  );
  if (picked.length === 0) {
    console.error(
      `no shard matching "${wantedShard}". Shards: ${shards.map((shard) => shard.name).join(" | ")}`,
    );
    process.exit(2);
  }
  shards.length = 0;
  shards.push(...picked);
}

const steps = shards
  ? shards.flatMap((shard) => stepsFor(shard))
  : stepsFor(null);

const only = flag("only");
const from = Number(flag("from", 0));
const chosen = steps.filter(
  (s) =>
    s.number >= from &&
    (!only || s.name.toLowerCase().includes(String(only).toLowerCase())),
);

if (has("list")) {
  console.log(
    `${shards ? `${jobKey} — ${shards.length} shard(s)` : (job.name ?? jobKey)}: ${steps.length} step(s)\n`,
  );
  for (const s of chosen)
    console.log(
      `${String(s.number).padStart(2)}. ${s.skip ? "SKIP" : "RUN "}  ${s.name}${s.skip ? `  — ${s.skip}` : ""}`,
    );
  process.exit(0);
}

// A step that serves storybook-static binds a fixed port. On a hosted runner
// nothing else is listening; here a Storybook left over from another worktree
// is, and the step dies inside Python with "Address already in use", which
// names neither the port nor what holds it. Say so first instead.
const wanted = [
  ...new Set(
    chosen
      .filter((s) => !s.skip)
      .flatMap((s) => [...String(s.run).matchAll(/127\.0\.0\.1:(\d{4,5})/g)])
      .map((m) => m[1]),
  ),
];
const held = wanted.filter((port) => {
  const probe = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  return probe.status === 0 && probe.stdout.trim();
});
if (held.length) {
  console.error(
    `These steps serve on ${held.join(", ")}, and something already listens there:\n`,
  );
  for (const port of held) {
    const who = spawnSync(
      "bash",
      ["-lc", `lsof -nP -iTCP:${port} -sTCP:LISTEN | tail -n +2 | awk '{print $1, $2}' | sort -u`],
      { encoding: "utf8" },
    );
    console.error(`  ${port}  ${who.stdout.trim().replace(/\n/g, ", ")}`);
  }
  console.error(
    "\nStop them, or run with --only to pick steps that do not need those ports.",
  );
  process.exit(2);
}

console.log(`${job.name ?? jobKey}, locally — ${chosen.length} step(s)\n`);
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

for (const step of chosen) {
  if (step.skip) {
    console.log(`  SKIP  ${step.name}  — ${step.skip}`);
    skipped += 1;
    continue;
  }
  const started = Date.now();
  const result = spawnSync("bash", ["-lc", step.run], {
    cwd: step.cwd ? path.join(root, step.cwd) : root,
    env: { ...process.env, ...resolveEnv(step.env), CI: "1" },
    stdio: has("verbose") ? "inherit" : "pipe",
    encoding: "utf8",
  });
  const took = ((Date.now() - started) / 1000).toFixed(0);
  if (step.ports.length) releasePorts(step.ports);
  if (result.status === 0) {
    console.log(`  PASS  ${step.name}  (${took}s)`);
    passed += 1;
  } else {
    console.log(`  FAIL  ${step.name}  (${took}s)`);
    failed += 1;
    failures.push({ step, result });
    if (has("bail")) break;
  }
}

for (const { step, result } of failures) {
  console.log(`\n---- ${step.name}\n`);
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trimEnd();
  // A served-storybook step ends with hundreds of request log lines, and the
  // assertion that actually failed is above them. Drop the noise first, then
  // keep enough of what is left to read.
  const meaningful = output
    .split("\n")
    .filter((line) => !/^\[[A-Z]+\] 127\.0\.0\.1 - -|GET \/|^\[STATIC\]/.test(line));
  console.log(
    meaningful.length
      ? meaningful.slice(-60).join("\n")
      : "(no output captured)",
  );
}

console.log(
  `\n${passed} passed, ${failed} failed, ${skipped} skipped of ${chosen.length}`,
);
if (skipped)
  console.log(
    "Skipped steps are not verified here. Chromatic's baselines and anything\n" +
      "needing a secret still only run on GitHub.",
  );
process.exit(failed ? 1 : 0);
