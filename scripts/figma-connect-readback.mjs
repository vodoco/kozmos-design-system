// Read published Code Connect back from Figma desktop's Dev Mode MCP server.
//
// `figma connect publish` reports what it sent, not what Dev Mode shows. This
// asks the Dev Mode server for every linked node on every platform, through its
// read-only get_code_connect_map tool, and fails when a node shows nothing or a
// snippet imports something a consumer cannot use. It needs Figma desktop with
// Preferences → Enable Dev Mode MCP Server, and the Kozmos DS - Core Library
// file open: node ids resolve in the file in front. Keep Figma in front: on
// 2026-09-21 the server answered no tool call for an hour and a half while
// Figma sat in the background, and answered at once when it was brought
// forward.
//
// Every call counts against a daily limit Figma sets per account, shared with
// any other use of the Dev Mode server. A full pass is 534 calls (178 nodes on
// each of three platforms: 98 component nodes and the 80 library icons), more
// than one day's allowance: on 2026-09-21, after some 500 in the day, it
// answered "Rate limit exceeded, please try again tomorrow". Run a full pass a
// label at a time, and narrow with --label and --node when you can. The script
// stops at the first rate-limit answer.
//
// --node asks the nodes it names, linked or not, so a variant or a nested
// instance can be read on its own. A set's answer holds every variant and
// every mapped instance under it; on 2026-10-16 ColorPicker's set (451:13566,
// 384 such nodes, the most of any) answered nothing on all three platforms,
// though the same nested mappings answered in other sets. Asking one variant
// tells a mapping that is missing from a set that is not read whole.
//
//   pnpm figma:connect:readback -- --label React
//   pnpm figma:connect:readback -- --label React --node 1933:9257
//   pnpm figma:connect:readback -- --label SwiftUI --node 451:12870
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SERVER =
  process.env.FIGMA_DEV_MODE_MCP_URL || "http://127.0.0.1:3845/mcp";
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = Number(
  process.env.FIGMA_DEV_MODE_TIMEOUT_MS || 90_000,
);
// This many unanswered calls in a row means the server has stopped answering.
const MAX_CONSECUTIVE_TIMEOUTS = 8;
let rateLimited = null;

const PLATFORMS = [
  {
    label: "React",
    config: "figma.linked.config.json",
    packageRoot: "packages/react",
    extension: ".figma.tsx",
    // Relative imports are the mapping file's own; no consumer can use them.
    importProblem: (imports) =>
      imports.find((line) => /from\s+['"]\./.test(line)),
  },
  {
    label: "SwiftUI",
    config: "packages/ios/figma.linked.config.json",
    packageRoot: "packages/ios",
    extension: ".figma.swift",
    importProblem: (imports, config) => {
      const expected = Object.values(config.codeConnect.importPaths || {});
      const missing = expected.filter((line) => !imports.includes(line));
      return missing.length ? `missing ${missing.join(", ")}` : null;
    },
  },
  {
    label: "Compose",
    config: "packages/android/figma.linked.config.json",
    packageRoot: "packages/android",
    extension: ".figma.kt",
    importProblem: (imports) =>
      imports.length === 0 ? "no import at all" : null,
  },
];

function argValues(flag) {
  const values = [];
  process.argv.forEach((arg, index) => {
    if (arg === flag && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  });
  return values;
}

function linkedNodes({ config, packageRoot, extension }) {
  const nodes = new Set();
  for (const includePath of JSON.parse(
    fs.readFileSync(path.join(ROOT, config), "utf8"),
  ).codeConnect.include) {
    if (!includePath.endsWith(extension)) continue;
    const filePath = [
      path.join(ROOT, path.dirname(config), includePath),
      path.join(ROOT, includePath),
      path.join(ROOT, packageRoot, includePath),
    ].find((candidate) => fs.existsSync(candidate));
    if (!filePath) continue;
    for (const match of fs
      .readFileSync(filePath, "utf8")
      .matchAll(/node-id=(\d+)-(\d+)/g)) {
      nodes.add(`${match[1]}:${match[2]}`);
    }
  }
  return [...nodes];
}

let session = null;
let nextId = 1;

async function rpc(method, params, notification = false) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (session) headers["mcp-session-id"] = session;
  const body = notification
    ? { jsonrpc: "2.0", method, params }
    : { jsonrpc: "2.0", id: nextId++, method, params };
  const response = await fetch(SERVER, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  session = response.headers.get("mcp-session-id") || session;
  const text = await response.text();
  if (notification) return null;
  const events = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  return JSON.parse(events.length ? events[events.length - 1] : text);
}

let consecutiveTimeouts = 0;

async function readMapping(nodeId, label) {
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
      return { error: "not asked: the server had stopped answering" };
    }
    if (rateLimited) {
      return { error: "not asked: the rate limit had been reached" };
    }
    try {
      const reply = await rpc("tools/call", {
        name: "get_code_connect_map",
        arguments: { nodeId, codeConnectLabel: label },
      });
      const text = (reply.result?.content || [])
        .map((part) => part.text || "")
        .join("");
      consecutiveTimeouts = 0;
      // An answer with no text is not an empty map. Read as "{}", it was
      // reported as "nothing published reads back", the verdict for a node
      // with no mapping at all.
      if (!reply.error && !reply.result?.isError && !text.trim()) {
        lastError = "the server answered with no text";
        continue;
      }
      if (reply.error || reply.result?.isError) {
        lastError = JSON.stringify(reply.error || text).slice(0, 200);
        // A retry spends another call of the day's allowance and fails the same way.
        if (/rate limit/i.test(lastError)) {
          rateLimited = rateLimited || lastError;
          break;
        }
        continue;
      }
      const map = JSON.parse(text);
      if (!map || typeof map !== "object" || Array.isArray(map)) {
        lastError = `the server answered ${text.slice(0, 120)}, not a map`;
        continue;
      }
      return { map };
    } catch (error) {
      if (error.name === "TimeoutError") {
        consecutiveTimeouts += 1;
        lastError = `no answer in ${REQUEST_TIMEOUT_MS / 1000} s`;
      } else {
        lastError = String(error.message || error).slice(0, 200);
      }
    }
  }
  return { error: lastError };
}

async function inBatches(items, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    results.push(
      ...(await Promise.all(
        items.slice(index, index + CONCURRENCY).map(worker),
      )),
    );
  }
  return results;
}

try {
  const init = await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "kozmos-code-connect-readback", version: "1.0.0" },
  });
  if (!init.result) throw new Error(JSON.stringify(init).slice(0, 200));
  await rpc("notifications/initialized", {}, true);
} catch (error) {
  console.error(
    `Cannot reach the Dev Mode MCP server at ${SERVER} (${error.message}).`,
  );
  console.error(
    "Open Figma desktop, enable Preferences → Enable Dev Mode MCP Server, and open the Kozmos DS - Core Library file.",
  );
  process.exit(1);
}

const onlyLabels = argValues("--label");
const onlyNodes = argValues("--node").map((node) => node.replace("-", ":"));
const problems = [];
let totalAsked = 0;
let emptySets = 0;
const report = (problem) => {
  if (problems.includes(problem)) return;
  problems.push(problem);
  console.error(`  ${problem}`);
};

for (const platform of PLATFORMS) {
  if (onlyLabels.length && !onlyLabels.includes(platform.label)) continue;
  const config = JSON.parse(
    fs.readFileSync(path.join(ROOT, platform.config), "utf8"),
  );
  // Named nodes are asked whether this platform links them or not: a
  // variant or a nested instance is never linked, and a filter over the
  // linked nodes asked nothing for one and called that a pass.
  const linked = linkedNodes(platform);
  const nodes = onlyNodes.length ? onlyNodes : linked;
  let withSnippet = 0;
  let notAsked = 0;
  const results = await inBatches(nodes, async (nodeId) => ({
    nodeId,
    ...(await readMapping(nodeId, platform.label)),
  }));
  for (const { nodeId, map, error } of results) {
    if (error?.startsWith("not asked")) {
      notAsked += 1;
      continue;
    }
    if (error) {
      report(`${platform.label} ${nodeId}: no mapping read (${error})`);
      continue;
    }
    const entries = Object.values(map);
    withSnippet += entries.length;
    if (entries.length === 0) {
      if (linked.includes(nodeId)) emptySets += 1;
      report(
        `${platform.label} ${nodeId}: nothing published reads back${linked.includes(nodeId) ? "" : " (not a node this platform links)"}`,
      );
      continue;
    }
    for (const entry of entries) {
      if (entry.label && entry.label !== platform.label) {
        report(
          `${platform.label} ${nodeId}: ${entry.componentName} reads back under ${entry.label}`,
        );
      }
      const problem = platform.importProblem(
        entry.snippetImports || [],
        config,
      );
      if (problem) {
        report(
          `${platform.label} ${nodeId}: ${entry.componentName} import: ${problem}`,
        );
      }
    }
  }
  totalAsked += nodes.length - notAsked;
  console.log(
    `${platform.label}: ${nodes.length - notAsked} of ${nodes.length} ${onlyNodes.length ? "named" : "linked"} node(s) asked, ${withSnippet} variant or instance node(s) carry a snippet`,
  );
  if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
    console.error(
      "The Dev Mode server stopped answering. Bring Figma to the front, or restart it, and run again.",
    );
    process.exit(1);
  }
  if (rateLimited) {
    console.error(
      `Figma's rate limit for the Dev Mode server is reached (${rateLimited}); nothing more was asked. Run again when it resets, narrowed with --label and --node.`,
    );
    process.exit(1);
  }
}

if (totalAsked === 0) {
  console.error(
    `Nothing was asked: no platform is labelled ${onlyLabels.join(" or ")} (React, SwiftUI, Compose).`,
  );
  process.exit(1);
}
if (problems.length) {
  if (emptySets) {
    console.error(
      "A set's answer holds every variant and every mapped instance under it. Ask one of its variants with --node to tell a missing mapping from a set that is not read whole.",
    );
  }
  console.error(`${problems.length} problem(s), listed above.`);
  process.exit(1);
}
console.log(
  onlyNodes.length || onlyLabels.length
    ? "Every node asked reads back, with imports a consumer can use."
    : "Every linked node reads back on every platform, with imports a consumer can use.",
);
