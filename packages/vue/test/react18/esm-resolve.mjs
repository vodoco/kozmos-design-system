// Node's module-loader hook for the React 18 run (./hooks.mjs registers it):
// every `react…` and `react-dom…` a package Node loads itself imports
// resolves to React 18's file, or, for a subpath not listed, as if imported
// from inside react-dom 18. A resolution outside React 18 throws, so the
// import fails in the worker that made it.
import { appendFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ANCHOR_URL, KNOWN, REACT_SPECIFIER, isReact18 } from "./react18.mjs";

const known = Object.fromEntries(
  Object.entries(KNOWN).map(([specifier, file]) => [
    specifier,
    pathToFileURL(file).href,
  ]),
);
let log;

export async function initialize(data) {
  log = data.log;
}

export async function resolve(specifier, context, nextResolve) {
  if (!REACT_SPECIFIER.test(specifier)) return nextResolve(specifier, context);
  const url = known[specifier];
  const result = url
    ? {
        url,
        format: url.endsWith(".json") ? "json" : "commonjs",
        shortCircuit: true,
      }
    : await nextResolve(specifier, { ...context, parentURL: ANCHOR_URL });
  const file = fileURLToPath(result.url);
  if (log)
    appendFileSync(
      log,
      `${JSON.stringify({
        pid: process.pid,
        kind: "import",
        specifier,
        parent: context.parentURL ? fileURLToPath(context.parentURL) : null,
        file,
      })}\n`,
    );
  if (!isReact18(file))
    throw new Error(
      `the React 18 run resolved ${specifier} to ${file}, outside React 18 (test/react18/esm-resolve.mjs)`,
    );
  return result;
}
