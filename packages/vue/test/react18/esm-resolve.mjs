// Node's module-loader hook for the React 18 run (./hooks.mjs registers it):
// every `react…` and `react-dom…` a package Node loads itself imports
// resolves to React 18's file, or, for a subpath not listed, as if imported
// from inside react-dom 18.
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

let known = {};
let anchor = "";
let pattern = /^$/;
let log;

export async function initialize(data) {
  known = data.known;
  anchor = data.anchor;
  pattern = new RegExp(data.pattern);
  log = data.log;
}

export async function resolve(specifier, context, nextResolve) {
  if (!pattern.test(specifier)) return nextResolve(specifier, context);
  const url = known[specifier];
  const result = url
    ? {
        url,
        format: url.endsWith(".json") ? "json" : "commonjs",
        shortCircuit: true,
      }
    : await nextResolve(specifier, { ...context, parentURL: anchor });
  if (log)
    appendFileSync(
      log,
      `${JSON.stringify({
        pid: process.pid,
        kind: "import",
        specifier,
        parent: context.parentURL ? fileURLToPath(context.parentURL) : null,
        file: fileURLToPath(result.url),
      })}\n`,
    );
  return result;
}
