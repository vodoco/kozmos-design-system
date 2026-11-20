// The analytics events each platform's components send, read from their
// sources outside tests, stories, docs snippets and Code Connect files
// (GAP-234): React's `trackEvent(component, name, …)` calls, read across
// lines; SwiftUI's and Compose's `KozmosAnalyticsEvent(…)`s, by their
// `eventName`, named or, on Compose, second by position.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// What is not a component's source, by its path inside the repository
// (forward slashes), never by where the repository sits: CI's container
// workspace is /__w/…, and a rule tested against the absolute path skipped
// every file there. Each rule is anchored on whole path segments.
const SKIP_FILE = /\.(?:test|spec|stories|figma)\.[^/]+$/;
const SKIP_DIRECTORY =
  /(?:^|\/)(?:test|tests|Tests|__tests__|__snapshots__|__Snapshots__|DocSnippets|docsnippets)(?:\/|$)/;

export function skipped(relativePath) {
  const path = relativePath.split(sep).join("/");
  return SKIP_FILE.test(path) || SKIP_DIRECTORY.test(path);
}

function walk(root, directory, extensions, found = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (name === "node_modules" || name === "dist") continue;
    const stat = statSync(path);
    if (stat.isDirectory()) walk(root, path, extensions, found);
    else if (
      extensions.some((ext) => name.endsWith(ext)) &&
      !skipped(relative(root, path))
    )
      found.push(path);
  }
  return found;
}

const NAME = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;

/** Map of event name to the sorted components that send it, and where. */
function collect(root, files, read) {
  const events = new Map();
  for (const file of files) {
    for (const { component, name } of read(readFileSync(file, "utf8"))) {
      if (!NAME.test(name)) continue;
      const entry = events.get(name) ?? {
        components: new Set(),
        files: new Set(),
      };
      entry.components.add(component ?? "?");
      entry.files.add(relative(root, file));
      events.set(name, entry);
    }
  }
  return events;
}

export function readReact(root) {
  const files = walk(root, join(root, "packages/react/src"), [".ts", ".tsx"]);
  return collect(root, files, (text) =>
    [
      ...text.matchAll(
        /trackEvent\(\s*(?:"([A-Za-z0-9]+)"|[A-Za-z_.]+)\s*,\s*"([a-z0-9_]+)"/g,
      ),
    ].map((m) => ({ component: m[1], name: m[2] })),
  );
}

/** Each `eventName` literal, with the `component` literal written beside it. */
function byEventName(text, separator) {
  const found = [];
  const name = new RegExp(`eventName\\s*${separator}\\s*"([a-z0-9_]+)"`, "g");
  const component = new RegExp(`component\\s*${separator}\\s*"([A-Za-z0-9]+)"`);
  for (const m of text.matchAll(name)) {
    const around = text.slice(Math.max(0, m.index - 200), m.index + 200);
    found.push({ component: around.match(component)?.[1], name: m[1] });
  }
  return found;
}

export function readSwiftUI(root) {
  const files = walk(root, join(root, "packages/ios/Sources"), [".swift"]);
  return collect(root, files, (text) => byEventName(text, ":"));
}

export function readCompose(root) {
  const files = walk(root, join(root, "packages/android/src/main/java"), [
    ".kt",
  ]);
  return collect(root, files, (text) => {
    const found = byEventName(text, "=");
    for (const m of text.matchAll(
      /KozmosAnalyticsEvent\(\s*"([A-Za-z0-9]+)"\s*,\s*"([a-z0-9_]+)"/g,
    ))
      found.push({ component: m[1], name: m[2] });
    return found;
  });
}
