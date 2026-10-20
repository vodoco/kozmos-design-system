import { POINTR_SDK_CDN } from "./sdk-versions";

/** A Content-Security-Policy violation that concerns the map: the directive, and the origin only. */
export interface PointrCspViolation {
  directive: string;
  /** `blob` for the map's workers, else the blocked origin; never a path or a query. */
  blocked: string;
  /**
   * The script the browser names as the violation's source: the SDK's,
   * another (a `blob` violation from another script is the page's, and never
   * reported), or none. Chromium and WebKit name the script that made a
   * blocked worker; Firefox 146 names none (measured 20 Oct).
   */
  source: "sdk" | "other" | "none";
}

// Every host the spike saw the SDK reach (POINTR-MAPS-SPIKE.md, finding 1):
// the token and API on the environment's *.pointr.cloud, published content
// and site tiles on *.blob.core.windows.net, outdoor tiles on
// mapscdn.pointr.tech and api.maptiler.com, the SDK's own files on its CDN.
const SDK_HOST = new URL(POINTR_SDK_CDN).host;
const HOST_SUFFIXES = [
  ".pointr.cloud",
  ".pointr.tech",
  ".blob.core.windows.net",
  "api.maptiler.com",
  SDK_HOST,
];

/** The host of a violation's source file; empty when the browser names none. */
function sourceHost(sourceFile: string) {
  try {
    return new URL(sourceFile).host;
  } catch {
    return "";
  }
}

function concerns(blocked: string, apiHost: string | undefined) {
  if (blocked === "blob") return "blob";
  let url: URL;
  try {
    url = new URL(blocked);
  } catch {
    return undefined;
  }
  const host = url.host;
  const ours =
    host === apiHost ||
    HOST_SUFFIXES.some(
      (suffix) => host === suffix.replace(/^\./, "") || host.endsWith(suffix),
    );
  return ours ? url.origin : undefined;
}

/**
 * Reports each enforced violation that names one of the map's hosts or a
 * `blob:` worker, once per directive and origin, until the returned function
 * stops it. A report-only policy blocks nothing and is not reported. Only
 * violations fired at the document are seen: one inside a worker (MapLibre's
 * tile requests) fires on the worker, and never reaches this listener.
 */
export function watchCsp(
  apiBaseUrl: string,
  onViolation: (violation: PointrCspViolation) => void,
): () => void {
  let apiHost: string | undefined;
  try {
    apiHost = new URL(apiBaseUrl).host;
  } catch {
    apiHost = undefined;
  }
  const seen = new Set<string>();
  const listener = (event: Event) => {
    const {
      blockedURI,
      effectiveDirective,
      violatedDirective,
      disposition,
      sourceFile,
    } = event as SecurityPolicyViolationEvent;
    if (disposition === "report") return;
    const blocked = concerns(String(blockedURI ?? ""), apiHost);
    if (!blocked) return;
    const host = sourceHost(String(sourceFile ?? ""));
    const source = !host ? "none" : host === SDK_HOST ? "sdk" : "other";
    // Another script's worker is the page's business, not the map's.
    if (blocked === "blob" && source === "other") return;
    const directive = String(effectiveDirective || violatedDirective || "");
    const key = `${directive} ${blocked}`;
    if (seen.has(key)) return;
    seen.add(key);
    onViolation({ directive, blocked, source });
  };
  document.addEventListener("securitypolicyviolation", listener);
  return () =>
    document.removeEventListener("securitypolicyviolation", listener);
}
