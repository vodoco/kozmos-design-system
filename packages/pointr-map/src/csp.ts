import { POINTR_SDK_CDN } from "./sdk-versions";

/** A Content-Security-Policy violation that concerns the map: the directive, and the origin only. */
export interface PointrCspViolation {
  directive: string;
  /** `blob` for the map's workers, else the blocked origin; never a path or a query. */
  blocked: string;
}

// Every host the spike saw the SDK reach (POINTR-MAPS-SPIKE.md, finding 1):
// the token and API on the environment's *.pointr.cloud, published content
// and site tiles on *.blob.core.windows.net, outdoor tiles on
// mapscdn.pointr.tech and api.maptiler.com, the SDK's own files on its CDN.
const HOST_SUFFIXES = [
  ".pointr.cloud",
  ".pointr.tech",
  ".blob.core.windows.net",
  "api.maptiler.com",
  new URL(POINTR_SDK_CDN).host,
];

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
 * Reports each violation that names one of the map's hosts or a `blob:`
 * worker, once per directive and origin, until the returned function stops it.
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
    const { blockedURI, effectiveDirective, violatedDirective } =
      event as SecurityPolicyViolationEvent;
    const blocked = concerns(String(blockedURI ?? ""), apiHost);
    if (!blocked) return;
    const directive = String(effectiveDirective || violatedDirective || "");
    const key = `${directive} ${blocked}`;
    if (seen.has(key)) return;
    seen.add(key);
    onViolation({ directive, blocked });
  };
  document.addEventListener("securitypolicyviolation", listener);
  return () =>
    document.removeEventListener("securitypolicyviolation", listener);
}
