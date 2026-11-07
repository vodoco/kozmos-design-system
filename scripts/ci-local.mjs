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
 * A run here stands for a pull request into main, because that is how every
 * change reaches main: a step CI keeps for pull requests runs here too, and
 * `${{ github.base_ref }}` is main (`--base` names another branch). The
 * changeset rule is one: skipped here, a branch that shipped a change with no
 * changeset passed locally and failed on its pull request.
 *
 * A step's `if` is read as GitHub Actions reads it, when the step's turn comes,
 * from the steps before it: `steps.build.outcome == 'success'` holds once the
 * build has passed, and `failure()` once something has failed. A condition
 * that reads anything else - a runner's own context, another function - is not
 * guessed at: the step is skipped, and its condition is the reason.
 *
 *   pnpm ci:local                 every step of the web job
 *   pnpm ci:local --list          what would run, what would be skipped, and
 *                                 what the run decides as it goes
 *   pnpm ci:local --job ios       another job
 *   pnpm ci:local --only token    only steps whose name contains "token"
 *   pnpm ci:local --from 12       resume at step 12
 *   pnpm ci:local --bail          stop at the first failure
 *   pnpm ci:local --base release  as a pull request into another branch
 *   pnpm ci:local --workflow bundle-size.yml --job analyze-bundle
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

/*
 * A step's `if`, in GitHub's expression language, as far as this repository's
 * workflows use it: `${{ }}` around the whole, `!`, `&&`, `||`, parentheses,
 * `==` and `!=`, literals ('text', numbers, true, false, null), `github.<key>`,
 * `steps.<id>.outcome` and `steps.<id>.conclusion`, and the status functions
 * success(), failure(), always() and cancelled(). Anything else - another
 * function, context or operator - leaves the whole condition undecided, which
 * only a runner can settle. So does a value this run cannot know: a `github`
 * key a local run does not have, or a step whose result it did not see,
 * unless an operand before it has already decided the condition. It is a
 * parser and a walk over what it parsed, never eval: the condition is data
 * from a workflow file.
 *
 * The rules are GitHub's: `&&` and `||` stop at the first operand that decides
 * them and give that operand back, `==` ignores case between strings and
 * compares other mixed types as numbers, and false, 0, '', null and NaN are
 * false.
 *
 * GitHub also reads function and context names in any case (`Success()`,
 * `GitHub.event_name`). This evaluator reads only the lowercase spellings
 * the workflows use; any other spelling fails safe, to undecided.
 */

const UNDECIDED = Symbol("undecided");
const STATUS_FUNCTIONS = new Set(["success", "failure", "always", "cancelled"]);

class Unsupported extends Error {}

function tokenize(text) {
  const tokens = [];
  let rest = text.trimStart();
  while (rest) {
    const token =
      rest.match(/^(?:==|!=|&&|\|\||[()!])/) ??
      rest.match(/^'(?:[^']|'')*'/) ??
      rest.match(
        /^-?(?:0x[0-9a-f]+|(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?)(?![\w.-])/i,
      ) ??
      rest.match(/^[a-z_][\w-]*(?:\.[a-z_][\w-]*)*/i);
    if (!token) return null;
    tokens.push(token[0]);
    rest = rest.slice(token[0].length).trimStart();
  }
  return tokens;
}

/** The condition as a tree, or null when it uses anything outside the subset. */
function parseCondition(condition) {
  const text = String(condition).trim();
  const body = text.match(/^\$\{\{([\s\S]*)\}\}$/)?.[1] ?? text;
  const tokens = tokenize(body);
  if (!tokens?.length) return null;
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];
  const binary = (operators, operand) => () => {
    let left = operand();
    while (operators.includes(peek()))
      left = { op: take(), left, right: operand() };
    return left;
  };
  const unary = () => {
    if (peek() !== "!") return primary();
    take();
    return { op: "!", operand: unary() };
  };
  const equality = binary(["==", "!="], unary);
  const and = binary(["&&"], equality);
  const or = binary(["||"], and);
  function primary() {
    const token = take() ?? "";
    if (token === "(") {
      const inner = or();
      if (take() !== ")") throw new Unsupported();
      return inner;
    }
    if (token.startsWith("'"))
      return { value: token.slice(1, -1).replaceAll("''", "'") };
    if (/^-?\d/.test(token))
      return {
        value: token.startsWith("-") ? -Number(token.slice(1)) : Number(token),
      };
    if (token === "true" || token === "false")
      return { value: token === "true" };
    if (token === "null") return { value: null };
    if (!/^[a-z_]/i.test(token)) throw new Unsupported();
    if (peek() === "(") {
      take();
      if (take() !== ")" || !STATUS_FUNCTIONS.has(token))
        throw new Unsupported();
      return { call: token };
    }
    const [context, ...keys] = token.split(".");
    if (context === "github" && keys.length) return { github: keys.join(".") };
    if (
      context === "steps" &&
      keys.length === 2 &&
      (keys[1] === "outcome" || keys[1] === "conclusion")
    )
      return { step: keys[0], property: keys[1] };
    throw new Unsupported();
  }
  try {
    const tree = or();
    return at === tokens.length ? tree : null;
  } catch (error) {
    if (error instanceof Unsupported) return null;
    throw error;
  }
}

function* nodesOf(node) {
  yield node;
  for (const child of [node.operand, node.left, node.right])
    if (child) yield* nodesOf(child);
}

const truthy = (value) =>
  !(
    value === false ||
    value === 0 ||
    value === "" ||
    value === null ||
    Number.isNaN(value)
  );

function toNumber(value) {
  if (value === null || value === "") return 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)
    ? Number(value)
    : NaN;
}

function equal(left, right) {
  const kind = (value) => (value === null ? "null" : typeof value);
  if (kind(left) !== kind(right)) return toNumber(left) === toNumber(right);
  if (typeof left === "string")
    return left.toLowerCase() === right.toLowerCase();
  return left === right;
}

function walk(node, context) {
  if ("value" in node) return node.value;
  if (node.github !== undefined)
    return Object.hasOwn(context.github ?? {}, node.github)
      ? context.github[node.github]
      : UNDECIDED;
  if (node.step !== undefined) {
    if (!context.steps) return UNDECIDED;
    // A step that has not run yet, or that the job does not have, reads as
    // null on a runner, and so here. One whose result this run did not see
    // is null in the context, and undecided.
    if (!Object.hasOwn(context.steps, node.step)) return null;
    return context.steps[node.step]?.[node.property] ?? UNDECIDED;
  }
  if (node.call !== undefined) {
    if (node.call === "always") return true;
    if (node.call === "cancelled") return false;
    if (typeof context.failed !== "boolean") return UNDECIDED;
    return node.call === "failure" ? context.failed : !context.failed;
  }
  if (node.op === "!") {
    const operand = walk(node.operand, context);
    return operand === UNDECIDED ? operand : !truthy(operand);
  }
  const left = walk(node.left, context);
  if (left === UNDECIDED) return left;
  if (node.op === "&&") return truthy(left) ? walk(node.right, context) : left;
  if (node.op === "||") return truthy(left) ? left : walk(node.right, context);
  const right = walk(node.right, context);
  if (right === UNDECIDED) return right;
  return equal(left, right) === (node.op === "==");
}

/**
 * Whether `condition` holds: true, false, or null when it cannot be decided
 * here. `context` holds what a local run knows:
 *
 *   github  the local run's `github` values, by key
 *   steps   the steps before this one that have an id, by id: their
 *           { outcome, conclusion } (success, failure or skipped), or null
 *           when this run did not see the step's result
 *   failed  whether a step before this one failed, for success() and
 *           failure(); null when that is not known
 *
 * success() holds when no step before this one failed, and failure() when
 * one did. always() holds, and cancelled() does not: nothing cancels a local
 * run. A context without `steps` or `failed` leaves what reads them
 * undecided.
 */
export function evaluateCondition(condition, context = {}) {
  const tree = parseCondition(condition);
  if (!tree) return null;
  const value = walk(tree, context);
  return value === UNDECIDED ? null : truthy(value);
}

/**
 * What a condition reads of the run so far: the steps it names, and whether it
 * calls success() or failure(). Null when it is outside the subset.
 */
export function conditionReads(condition) {
  const tree = parseCondition(condition);
  if (!tree) return null;
  const nodes = [...nodesOf(tree)];
  return {
    steps: nodes
      .filter((node) => node.step !== undefined)
      .map(({ step, property }) => ({ id: step, property })),
    status: nodes.some(
      (node) => node.call === "success" || node.call === "failure",
    ),
  };
}

/** Whether a condition can be decided only as the job runs. */
export function decidedAsTheJobRuns(condition) {
  const reads = conditionReads(condition);
  return Boolean(reads && (reads.steps.length || reads.status));
}

async function main() {
  const argv = process.argv.slice(2);
  const valueOptions = new Set([
    "--workflow",
    "--job",
    "--only",
    "--from",
    "--base",
    "--shard",
  ]);
  const switches = new Set(["--help", "--list", "--bail", "--verbose"]);
  for (let index = 0; index < argv.length; index++) {
    const option = argv[index];
    if (valueOptions.has(option)) {
      if (!argv[index + 1] || argv[index + 1].startsWith("--")) {
        console.error(`${option} requires a value`);
        process.exit(2);
      }
      index++;
    } else if (!switches.has(option)) {
      console.error(`Unknown option: ${option}. Use --help for usage.`);
      process.exit(2);
    }
  }
  if (argv.includes("--help")) {
    console.log(`Usage: pnpm ci:local [options]
  --list                 List steps without running them
  --workflow NAME.yml    Workflow file (default: ci.yml)
  --job NAME             Job (default: web)
  --only TEXT            Select step names containing TEXT
  --from NUMBER          Start at step NUMBER
  --shard TEXT           Select shard names containing TEXT
  --base BRANCH          Pull request base (default: main)
  --bail                 Stop on first failure
  --verbose              Stream step output
  --help                 Show this help without running steps`);
    process.exit(0);
  }
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
  const flag = (name, fallback) => {
    const at = argv.indexOf(`--${name}`);
    return at === -1 ? fallback : argv[at + 1];
  };
  const has = (name) => argv.includes(`--${name}`);

  const workflowName = flag("workflow", "ci.yml");
  if (
    path.basename(workflowName) !== workflowName ||
    !/\.ya?ml$/.test(workflowName)
  ) {
    throw new Error("--workflow must name a YAML file in .github/workflows");
  }
  const workflow = parse(
    fs.readFileSync(path.join(root, ".github/workflows", workflowName), "utf8"),
  );

  const jobKey = flag("job", "web");
  const job = workflow.jobs[jobKey];
  if (!job) {
    console.error(
      `no job "${jobKey}" in ${workflowName}. Jobs: ${Object.keys(workflow.jobs).join(", ")}`,
    );
    process.exit(2);
  }

  /**
   * The GitHub context a local run has: a pull request into main, or into
   * `--base`. A step that reads anything else from `github` needs a runner.
   */
  const localGithub = {
    event_name: "pull_request",
    base_ref: flag("base", "main"),
  };

  /** The `github.*` values a step reads through `${{ }}`, by key. */
  function githubRead(step) {
    const text = JSON.stringify(step.env ?? {}) + String(step.run ?? "");
    return [...text.matchAll(/\$\{\{\s*github\.([A-Za-z0-9_.]+)\s*\}\}/g)].map(
      (m) => m[1],
    );
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

  /** A step's `if` as written, or null when it has none. */
  function conditionOf(step) {
    return step.if === undefined || step.if === null || step.if === ""
      ? null
      : String(step.if);
  }

  /**
   * What can be said of a step before the job starts: why it cannot run here
   * (`skip`), or the condition that only the run itself can decide (`when`),
   * or neither, when it runs. `conditionFalse` is a condition that is false
   * for any local run: GitHub's outcome for that step is `skipped`.
   */
  function planOf(step) {
    const condition = conditionOf(step);
    const when =
      condition !== null && decidedAsTheJobRuns(condition) ? condition : null;
    const holds =
      condition === null || when
        ? true
        : evaluateCondition(condition, { github: localGithub });
    const plan = (skip) => ({
      skip,
      when: skip ? null : when,
      conditionFalse: holds === false,
    });
    if (step.uses) return plan(`provisions the runner (${step.uses})`);
    if (!step.run) return plan("has nothing to run");
    const missing = secretsUsed(step).filter((name) => !process.env[name]);
    if (missing.length)
      return plan(`needs ${missing.join(", ")} in the environment`);
    if (holds === null) return plan(`runs only when ${condition}`);
    if (!holds)
      return plan(
        /\bgithub\./.test(condition)
          ? `runs only when ${condition}, and a local run is a pull request into ${localGithub.base_ref}`
          : `runs only when ${condition}, which is false here`,
      );
    const unknown = githubRead(step).filter(
      (key) => !Object.hasOwn(localGithub, key),
    );
    if (unknown.length)
      return plan(
        `reads ${unknown.map((key) => `github.${key}`).join(", ")}, which only a runner has`,
      );
    return plan(null);
  }

  /**
   * `${{ secrets.X }}` becomes this machine's X, and `${{ github.X }}` the local
   * run's (a pull request into main: `origin/${{ github.base_ref }}` is
   * origin/main).
   */
  function resolveEnv(step) {
    const out = {};
    for (const [key, value] of Object.entries(step.env ?? {})) {
      out[key] = String(value)
        .replace(
          /\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}/g,
          (_, name) => process.env[name] ?? "",
        )
        .replace(/\$\{\{\s*github\.([A-Za-z0-9_.]+)\s*\}\}/g, (whole, name) =>
          Object.hasOwn(localGithub, name) ? localGithub[name] : whole,
        );
    }
    return out;
  }

  /** The fixed ports a step serves on, if any. */
  function portsOf(run) {
    return [
      ...new Set(
        [...String(run ?? "").matchAll(/127\.0\.0\.1:(\d{4,5})/g)].map(
          (m) => m[1],
        ),
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
  if (wantedShard && !shards) {
    console.error(`Job "${jobKey}" has no shard matrix`);
    process.exit(2);
  }

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
        id: step.id ?? null,
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
        ...planOf(step),
        // GitHub: a failure under continue-on-error concludes as a success and
        // fails nothing after it. Only a plain true or false is read here.
        continueOnError:
          step["continue-on-error"] === undefined
            ? false
            : typeof step["continue-on-error"] === "boolean"
              ? step["continue-on-error"]
              : null,
        shard: shard ? expand(shard.name, shard) : null,
      };
    });
  }

  if (shards && wantedShard) {
    const picked = shards.filter((shard) =>
      String(shard.name)
        .toLowerCase()
        .includes(String(wantedShard).toLowerCase()),
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
  if (!Number.isInteger(from) || from < 0) {
    console.error("--from requires a nonnegative integer");
    process.exit(2);
  }
  const chosen = steps.filter(
    (s) =>
      s.number >= from &&
      (!only || s.name.toLowerCase().includes(String(only).toLowerCase())),
  );
  if (chosen.length === 0) {
    console.error(
      "No steps match the requested selection; nothing was verified.",
    );
    process.exit(2);
  }

  if (has("list")) {
    console.log(
      `${shards ? `${jobKey} — ${shards.length} shard(s)` : (job.name ?? jobKey)}: ${steps.length} step(s)\n`,
    );
    for (const s of chosen) {
      const [label, note] = s.skip
        ? ["SKIP", s.skip]
        : s.when
          ? ["WHEN", `runs when ${s.when}, decided as the job runs`]
          : ["RUN ", null];
      console.log(
        `${String(s.number).padStart(2)}. ${label}  ${s.name}${note ? `  — ${note}` : ""}`,
      );
    }
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
    const probe = spawnSync(
      "lsof",
      ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"],
      {
        encoding: "utf8",
      },
    );
    return probe.status === 0 && probe.stdout.trim();
  });
  if (held.length) {
    console.error(
      `These steps serve on ${held.join(", ")}, and something already listens there:\n`,
    );
    for (const port of held) {
      const who = spawnSync(
        "bash",
        [
          "-lc",
          `lsof -nP -iTCP:${port} -sTCP:LISTEN | tail -n +2 | awk '{print $1, $2}' | sort -u`,
        ],
        { encoding: "utf8" },
      );
      console.error(`  ${port}  ${who.stdout.trim().replace(/\n/g, ", ")}`);
    }
    console.error(
      "\nStop them, or run with --only to pick steps that do not need those ports.",
    );
    process.exit(2);
  }

  console.log(
    `${workflowName}: ${job.name ?? jobKey}, locally — ${chosen.length} step(s)\n`,
  );
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];
  // CI commands can legitimately print more than spawnSync's pipe buffer (for
  // example Code Connect's parsed JSON). Stream to retained files instead of
  // terminating a successful check when its output fills that buffer.
  const logDirectory = has("verbose")
    ? null
    : fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-ci-local-logs-"));
  if (logDirectory) console.log(`Full step logs: ${logDirectory}\n`);
  const stepFileDirectory =
    logDirectory ??
    fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-ci-local-step-files-"));
  let stepNumber = 0;

  // A step's condition is decided at its turn, from the steps before it in the
  // same job run (each shard of a matrix is a run of its own): what each one
  // with an id came to, and whether any failed.
  //
  // This is where a local run parts from CI on purpose. On a runner, a step
  // with no `if`, or with an `if` that calls no status function, carries an
  // implicit `success() &&`, so after the first failure every such step is
  // skipped. Here it runs anyway, unless --bail: a local run is for finding
  // what is broken, and one run that shows every failure beats a run per
  // failure, each stopping at the next one. A condition that does call
  // success(), failure(), always() or cancelled() is read as CI reads it.
  //
  // What this run did not see, it does not guess. A step it did not run - left
  // out by --only or --from, or skipped here because it needs a runner, a
  // secret or a condition only a runner can decide - may have passed or
  // failed on GitHub. `steps.<id>` of such a step is undecided, and so are
  // success() and failure() after one, until a step that ran here fails:
  // then failure() holds and success() does not, whatever the others did.
  const SKIPPED = { outcome: "skipped", conclusion: "skipped" };
  const results = new Map();

  /** The steps before `current` in its job run (a shard is a run of its own). */
  const earlierThan = (current) =>
    steps.filter(
      (earlier) =>
        earlier.shard === current.shard && earlier.number < current.number,
    );

  /**
   * An earlier step's result as this run knows it: what it came to here, or
   * `skipped` when its condition is false for any local run, or null when
   * this run did not see it.
   */
  const resultOf = (earlier) =>
    results.get(earlier) ?? (earlier.conditionFalse ? SKIPPED : null);

  /**
   * The `steps` context at a step's turn: each step before it in its job run
   * that has an id, with its result, or null where this run did not see one.
   */
  function stepsContext(current) {
    const context = {};
    for (const earlier of earlierThan(current))
      if (earlier.id) context[earlier.id] = resultOf(earlier);
    return context;
  }

  /**
   * Whether a step before `current` failed, for success() and failure(): true
   * once one that ran here concluded as a failure, false when every one is
   * known and none did, and null otherwise, with what this run did not see.
   */
  function failedBefore(current) {
    const earlier = earlierThan(current);
    if (earlier.some((step) => resultOf(step)?.conclusion === "failure"))
      return { failed: true, unseen: [], unread: [] };
    const unseen = earlier.filter((step) => resultOf(step) === null);
    const unread = earlier.filter(
      (step) => resultOf(step) && resultOf(step).conclusion === null,
    );
    return {
      failed: unseen.length || unread.length ? null : false,
      unseen,
      unread,
    };
  }

  const named = (list) =>
    list.length > 3
      ? `${list
          .slice(0, 3)
          .map((step) => step.name)
          .join(", ")} and ${list.length - 3} more`
      : list.map((step) => step.name).join(", ");

  /** Why a condition decided at a step's turn keeps the step from running. */
  function conditionSkip(step) {
    const status = failedBefore(step);
    const context = {
      github: localGithub,
      steps: stepsContext(step),
      failed: status.failed,
    };
    const holds = evaluateCondition(step.when, context);
    if (holds) return null;
    const reads = conditionReads(step.when);
    if (holds === false) {
      results.set(step, SKIPPED);
      const facts = reads.steps.map(
        ({ id, property }) =>
          `steps.${id}.${property} is ${context.steps[id]?.[property] ?? "null"}`,
      );
      if (reads.status)
        facts.push(
          status.failed
            ? "a step before it failed"
            : "no step before it failed",
        );
      return `runs only when ${step.when}, which is false here: ${facts.join(", ")}`;
    }
    const unknown = new Set();
    for (const { id, property } of reads.steps) {
      if (context.steps[id] === null)
        unknown.add(`steps.${id} did not run here`);
      else if (context.steps[id] && context.steps[id][property] === null)
        unknown.add(
          `steps.${id}.${property} turns on a continue-on-error it cannot read`,
        );
    }
    if (reads.status && status.failed === null) {
      if (status.unseen.length)
        unknown.add(
          `whether a step before it failed: ${named(status.unseen)} did not run here`,
        );
      if (status.unread.length)
        unknown.add(
          `whether a step before it failed turns on ${named(status.unread)}'s continue-on-error, which it cannot read`,
        );
    }
    return `runs only when ${step.when}, which this run cannot decide: ${unknown.size ? [...unknown].join(", ") : "it reads what only a runner has"}`;
  }

  for (const step of chosen) {
    stepNumber += 1;
    const skip = step.skip ?? (step.when ? conditionSkip(step) : null);
    if (skip) {
      console.log(`  SKIP  ${step.name}  — ${skip}`);
      skipped += 1;
      continue;
    }
    const started = Date.now();
    const logFile =
      logDirectory && path.join(logDirectory, `${stepNumber}.log`);
    const logFd = logFile ? fs.openSync(logFile, "w") : null;
    // A runner gives every step files to append to: the job summary, and the
    // environment and outputs it hands the steps after it. A step that writes
    // to one with nowhere to write fails here with "No such file or
    // directory" (visual.yml's summary, ios-next-xcode.yml's Xcode pick), so
    // each step gets its own, beside its log. They are not read back:
    // GITHUB_ENV and GITHUB_OUTPUT do not reach the steps after it here.
    const stepFiles = Object.fromEntries(
      [
        ["GITHUB_STEP_SUMMARY", "summary.md"],
        ["GITHUB_ENV", "env"],
        ["GITHUB_OUTPUT", "output"],
        ["GITHUB_PATH", "path"],
      ].map(([name, suffix]) => {
        const file = path.join(stepFileDirectory, `${stepNumber}.${suffix}`);
        fs.writeFileSync(file, "");
        return [name, file];
      }),
    );
    let result;
    try {
      result = spawnSync("bash", ["-lc", step.run], {
        cwd: step.cwd ? path.join(root, step.cwd) : root,
        env: {
          ...process.env,
          ...stepFiles,
          ...resolveEnv(step.env),
          CI: "1",
        },
        stdio: logFd === null ? "inherit" : ["ignore", logFd, logFd],
        encoding: "utf8",
      });
    } finally {
      if (logFd !== null) fs.closeSync(logFd);
    }
    const took = ((Date.now() - started) / 1000).toFixed(0);
    if (step.ports.length) releasePorts(step.ports);
    if (result.status === 0) {
      results.set(step, { outcome: "success", conclusion: "success" });
      console.log(`  PASS  ${step.name}  (${took}s)`);
      passed += 1;
    } else {
      const conclusion =
        step.continueOnError === null
          ? null
          : step.continueOnError
            ? "success"
            : "failure";
      results.set(step, { outcome: "failure", conclusion });
      console.log(`  FAIL  ${step.name}  (${took}s)`);
      failed += 1;
      failures.push({ step, result, logFile });
      if (has("bail")) break;
    }
  }

  for (const { step, result, logFile } of failures) {
    console.log(`\n---- ${step.name}\n`);
    // A served-storybook step ends with hundreds of request log lines, and the
    // assertion that actually failed is above them. Drop the noise first, then
    // keep enough of what is left to read.
    const meaningful = [];
    if (logFile) {
      const lines = createInterface({
        input: fs.createReadStream(logFile),
        crlfDelay: Infinity,
      });
      for await (const line of lines) {
        if (/^\[[A-Z]+\] 127\.0\.0\.1 - -|GET \/|^\[STATIC\]/.test(line))
          continue;
        meaningful.push(line);
        if (meaningful.length > 60) meaningful.shift();
      }
      console.log(`Full output: ${logFile}`);
    }
    if (result.error) meaningful.push(result.error.message);
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
      "Skipped steps are not verified here. Visual Review (`pnpm test:visual`, in\n" +
        "Docker) and anything needing a secret still only run on GitHub.",
    );
  process.exit(failed ? 1 : 0);
}

// Run as `node scripts/ci-local.mjs`, this is the CLI. Imported - as its tests
// import the condition evaluator - it runs nothing.
const entry = process.argv[1];
if (
  entry &&
  fs.existsSync(entry) &&
  fs.realpathSync(entry) === fs.realpathSync(fileURLToPath(import.meta.url))
)
  await main();
