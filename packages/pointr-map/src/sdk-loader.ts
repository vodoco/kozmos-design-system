import { pointrSdkGlobal, type PointrWebSDKGlobal } from "./sdk";
import { pointrSdkFiles, type PointrSdkVersion } from "./sdk-versions";

/**
 * Why the SDK's files did not load: `script` or `style` did not arrive,
 * `global` ran but set no `window.PointrWebSDK`, and `version` was refused
 * before anything was fetched.
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

const loads = new Map<string, Promise<PointrWebSDKGlobal>>();
let loadedVersion: string | undefined;

const MARK = "data-kozmos-pointr-sdk";

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

/**
 * Adds the SDK's stylesheet and script for `version` to the document once,
 * each with its subresource integrity and `crossorigin="anonymous"` (the CDN
 * answers `Access-Control-Allow-Origin: *`), and resolves with
 * `window.PointrWebSDK` once both have loaded.
 *
 * A page holds one version: the bundle is a UMD that assigns one global, and
 * its MapWidget is a singleton. A global the host loaded itself is used as it
 * is. A failed load removes what it added, so a later mount tries again.
 */
export function loadPointrSdk(
  version: PointrSdkVersion,
): Promise<PointrWebSDKGlobal> {
  const existing = loads.get(version);
  if (existing) return existing;
  const files = pointrSdkFiles(version);
  if (!files)
    return Promise.reject(
      new PointrSdkLoadError(
        "version",
        "",
        `No integrity is recorded for Pointr SDK ${version}`,
      ),
    );
  if (loadedVersion && loadedVersion !== version)
    return Promise.reject(
      new PointrSdkLoadError(
        "version",
        files.script.url,
        `This page already loaded Pointr SDK ${loadedVersion}; a page holds one version`,
      ),
    );
  const present = pointrSdkGlobal();
  if (present) {
    const ready = Promise.resolve(present);
    loads.set(version, ready);
    return ready;
  }

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = files.style.url;
  const script = document.createElement("script");
  script.src = files.script.url;
  script.async = true;
  for (const [node, integrity] of [
    [style, files.style.integrity],
    [script, files.script.integrity],
  ] as const) {
    node.setAttribute("integrity", integrity);
    node.setAttribute("crossorigin", "anonymous");
    // The page's address (which may carry the SDK's ptr… options) stays home.
    node.setAttribute("referrerpolicy", "no-referrer");
    node.setAttribute(MARK, version);
  }
  const styled = settled(style, "style", files.style.url);
  const scripted = settled(script, "script", files.script.url);
  document.head.append(style, script);

  const load = Promise.all([styled, scripted]).then(() => {
    const sdk = pointrSdkGlobal();
    if (!sdk)
      throw new PointrSdkLoadError(
        "global",
        files.script.url,
        // The bundle is a UMD: under an AMD loader (`define.amd`) or a
        // CommonJS `module`, it registers a module instead of the global.
        "pointrwebsdk.js ran but set no window.PointrWebSDK (an AMD or CommonJS loader on the page takes it)",
      );
    loadedVersion = version;
    return sdk;
  });
  loads.set(version, load);
  load.catch(() => {
    loads.delete(version);
    style.remove();
    script.remove();
  });
  return load;
}

/** Tests only: forgets what was loaded, so each test starts from an empty page. */
export function resetPointrSdkLoaderForTests() {
  loads.clear();
  loadedVersion = undefined;
}
