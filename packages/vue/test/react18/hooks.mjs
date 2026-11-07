// Loaded with `--import` into every worker of the React 18 run
// (vitest.react18.config.mts). Vite resolves the specs, the bridge and
// @kozmos-ds/react's build, and the config's aliases send their React to
// React 18. The packages vitest leaves to Node (Radix, framer-motion,
// react-remove-scroll and its helpers) resolve `react` themselves, next to
// their own install, which is React 19: these hooks send those to React 18
// too, for `import` (module.register, Node 20.6 and later) and for
// `require` (Module._resolveFilename). A resolution outside React 18
// throws in the worker that makes it, so the spec that loaded it fails. Each
// resolution is also written to KOZMOS_REACT18_LOG, which global-setup.mjs
// checks over every worker as the run ends, and react18.probe.ts reads.
import Module, { register } from "node:module";
import { appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ANCHOR_URL, KNOWN, REACT_SPECIFIER, isReact18 } from "./react18.mjs";

const log = process.env.KOZMOS_REACT18_LOG;
const record = (entry) => {
  if (log)
    appendFileSync(log, `${JSON.stringify({ pid: process.pid, ...entry })}\n`);
  if (!isReact18(entry.file))
    throw new Error(
      `the React 18 run resolved ${entry.specifier} to ${entry.file}, outside React 18 (test/react18/hooks.mjs)`,
    );
};

// require(): resolved as if from inside react-dom 18.
const anchorFile = fileURLToPath(ANCHOR_URL);
const anchor = new Module(anchorFile);
anchor.filename = anchorFile;
anchor.paths = Module._nodeModulePaths(dirname(anchorFile));
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveReact18(request, parent, ...rest) {
  if (!REACT_SPECIFIER.test(request))
    return resolveFilename.call(this, request, parent, ...rest);
  const file =
    KNOWN[request] ?? resolveFilename.call(this, request, anchor, ...rest);
  record({
    kind: "require",
    specifier: request,
    parent: parent?.filename,
    file,
  });
  return file;
};

// import: the same, in Node's module loader (./esm-resolve.mjs).
register("./esm-resolve.mjs", import.meta.url, { data: { log } });
