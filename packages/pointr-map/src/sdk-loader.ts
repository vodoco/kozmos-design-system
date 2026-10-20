import { pointrSdkGlobal, type PointrWebSDKGlobal } from "./sdk";
import {
  pointrSdkFiles,
  type PointrSdkFiles,
  type PointrSdkVersion,
} from "./sdk-versions";

/**
 * Why the SDK's files did not load: `script` or `style` did not arrive,
 * `global` ran but set no `window.PointrWebSDK`, and `version` was refused
 * before anything was fetched (a version with no integrity, or a page that
 * holds another version already).
 */
export class PointrSdkLoadError extends Error {
  override readonly name = "PointrSdkLoadError";
  constructor(
    readonly resource: "script" | "style" | "global" | "version",
    readonly url: string,
    message: string,
  ) {
    super(message);
  }
}

/** One map's hold on the SDK's files: `ready` once both are in, `release` when the map is gone. */
export interface PointrSdkHold {
  ready: Promise<PointrWebSDKGlobal>;
  /** The last release takes the stylesheet away; the script stays. Safe to call twice. */
  release(): void;
}

const MARK = "data-kozmos-pointr-sdk";

/** Each version's script, added once and kept: a script that ran cannot be taken back. */
const scripts = new Map<string, Promise<PointrWebSDKGlobal>>();
/** The version whose script ran on this page. */
let loadedVersion: string | undefined;
/** The SDK's stylesheet, while a map holds it. */
let style:
  | { version: string; node: HTMLLinkElement; ready: Promise<void> }
  | undefined;
let holders = 0;
let removal: ReturnType<typeof setTimeout> | undefined;

/** Resolves when `node` loads, rejects with what failed when it does not. */
function settled(
  node: HTMLLinkElement | HTMLScriptElement,
  resource: "script" | "style",
  url: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    node.addEventListener("load", () => resolve(), { once: true });
    node.addEventListener(
      "error",
      () =>
        reject(
          new PointrSdkLoadError(
            resource,
            url,
            `The Pointr SDK's ${resource === "script" ? "script" : "stylesheet"} did not load from ${new URL(url).origin}: the network, a blocked host, a Content-Security-Policy or an integrity mismatch`,
          ),
        ),
      { once: true },
    );
  });
}

function mark(
  node: HTMLLinkElement | HTMLScriptElement,
  integrity: string,
  version: string,
) {
  node.setAttribute("integrity", integrity);
  // The CDN answers `Access-Control-Allow-Origin: *`.
  node.setAttribute("crossorigin", "anonymous");
  // The page's address (which may carry the SDK's options) stays home.
  node.setAttribute("referrerpolicy", "no-referrer");
  node.setAttribute(MARK, version);
}

const SDK_SCRIPT_PATH =
  /\/(\d+\.\d+\.\d+)\/pointrwebsdk(?:\.min)?\.js(?:[?#]|$)/;
const SDK_STYLE_PATH = /\/css\/pointr\.css(?:[?#]|$)/;

/**
 * The version of an SDK the page loaded itself: the one its global states, or
 * the one in the CDN path of the page's own script. Undefined when neither
 * says (a bundled copy), and then the global is used as it is.
 */
function hostVersion(sdk: PointrWebSDKGlobal): string | undefined {
  const stated = (sdk as { version?: unknown }).version;
  if (typeof stated === "string" && stated) return stated;
  for (const node of document.querySelectorAll<HTMLScriptElement>(
    "script[src]",
  )) {
    const found = node.src.match(SDK_SCRIPT_PATH);
    if (found) return found[1];
  }
  return undefined;
}

function versionError(files: PointrSdkFiles, held: string) {
  return new PointrSdkLoadError(
    "version",
    files.script.url,
    `This page already holds Pointr SDK ${held}, and PointrMap asked for ${files.version}; a page holds one version`,
  );
}

function holdScript(files: PointrSdkFiles): Promise<PointrWebSDKGlobal> {
  const cached = scripts.get(files.version);
  if (cached) return cached;
  const present = pointrSdkGlobal();
  let load: Promise<PointrWebSDKGlobal>;
  if (present) {
    loadedVersion = files.version;
    load = Promise.resolve(present);
  } else {
    const node = document.createElement("script");
    node.src = files.script.url;
    node.async = true;
    mark(node, files.script.integrity, files.version);
    load = settled(node, "script", files.script.url).then(() => {
      // It ran: the page holds this version now, whatever else fails.
      loadedVersion = files.version;
      const sdk = pointrSdkGlobal();
      if (!sdk)
        throw new PointrSdkLoadError(
          "global",
          files.script.url,
          // The bundle is a UMD: under an AMD loader (`define.amd`) or a
          // CommonJS `module`, it registers a module instead of the global.
          "pointrwebsdk.js ran but set no window.PointrWebSDK (an AMD or CommonJS loader on the page takes it)",
        );
      return sdk;
    });
    load.catch(() => {
      scripts.delete(files.version);
      node.remove();
    });
    document.head.append(node);
  }
  scripts.set(files.version, load);
  return load;
}

function holdStyle(files: PointrSdkFiles): Promise<void> {
  if (style?.version === files.version) return style.ready;
  style?.node.remove();
  style = undefined;
  // A stylesheet the page added itself is the page's: used, never removed.
  const theirs = [
    ...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
  ].some((link) => !link.hasAttribute(MARK) && SDK_STYLE_PATH.test(link.href));
  if (theirs) return Promise.resolve();
  const node = document.createElement("link");
  node.rel = "stylesheet";
  node.href = files.style.url;
  mark(node, files.style.integrity, files.version);
  const ready = settled(node, "style", files.style.url);
  const entry = { version: files.version, node, ready };
  style = entry;
  ready.catch(() => {
    node.remove();
    if (style === entry) style = undefined;
  });
  document.head.append(node);
  return ready;
}

function releaseStyle() {
  style?.node.remove();
  style = undefined;
}

/**
 * Adds the SDK's stylesheet and script for `version` to the document, each
 * with its subresource integrity, and holds them for one map: `ready`
 * resolves with `window.PointrWebSDK` once both are in.
 *
 * A page holds one version: the bundle is a UMD that assigns one global, and
 * its MapWidget is a singleton. The script is added once and stays, as a
 * script that ran must; the stylesheet (which sets `html, body { height:
 * 100% }`) leaves with the last map that holds it and comes back with the
 * next. A global the page loaded itself is used if its version is the one
 * asked for or unknown, with the SDK's stylesheet added when the page has
 * none. A file that fails is taken away, so a later mount tries again.
 */
export function holdPointrSdk(version: PointrSdkVersion): PointrSdkHold {
  holders += 1;
  clearTimeout(removal);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    holders -= 1;
    // A task later, so a restart (a new config, StrictMode's second mount)
    // keeps the stylesheet rather than dropping and fetching it again.
    if (holders === 0) removal = setTimeout(releaseStyle, 0);
  };
  return { ready: load(version), release };
}

function load(version: PointrSdkVersion): Promise<PointrWebSDKGlobal> {
  const files = pointrSdkFiles(version);
  if (!files)
    return Promise.reject(
      new PointrSdkLoadError(
        "version",
        "",
        `No integrity is recorded for Pointr SDK ${version}`,
      ),
    );
  // The version the page holds or is loading: what ran, another version's
  // script still on its way, or what a global the page loaded says it is.
  const present = pointrSdkGlobal();
  const held =
    loadedVersion ??
    [...scripts.keys()].find((other) => other !== version) ??
    (present ? hostVersion(present) : undefined);
  if (held && held !== version)
    return Promise.reject(versionError(files, held));
  const scripted = holdScript(files);
  const styled = holdStyle(files);
  return Promise.all([scripted, styled]).then(([sdk]) => sdk);
}

/** Tests only: forgets what was loaded, so each test starts from an empty page. */
export function resetPointrSdkLoaderForTests() {
  scripts.clear();
  loadedVersion = undefined;
  clearTimeout(removal);
  style?.node.remove();
  style = undefined;
  holders = 0;
}
