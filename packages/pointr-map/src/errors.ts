import type { MapReadiness } from "@kozmos-ds/product-contracts";

/**
 * What went wrong, by its remedy:
 *
 * - `config`: the config cannot start the SDK (no base URL, no keys, a
 *   building without its site, an SDK version with no integrity recorded),
 *   or the Cloud refused the site or building it names.
 * - `instance`: another map holds the page's one Pointr map.
 * - `storage`: the page has no `localStorage` (a sandbox without
 *   `allow-same-origin`), which the SDK reads unguarded.
 * - `webgl`: the browser gives no WebGL context.
 * - `script`: the SDK's script or stylesheet did not load (the network, a
 *   blocked host or an integrity mismatch).
 * - `csp`: a Content-Security-Policy blocked one of the SDK's hosts or its
 *   map workers.
 * - `auth`: the keys or the cloud token were refused, or the token expired.
 * - `data`: the site's data did not load, or the map did not become ready.
 */
export type PointrMapErrorCode =
  | "config"
  | "instance"
  | "storage"
  | "webgl"
  | "script"
  | "csp"
  | "auth"
  | "data";

/**
 * A failure of the map, for `onError`, with the shell's map status it means.
 *
 * Its message is for a developer, in English, and never carries a key: a
 * product shows its own localized words in `AdaptiveMapShell`'s
 * `mapStatusContent`, chosen by `code`. A `fatal` error leaves the map
 * unusable until it is mounted again; one that is not (a non-blocking SDK
 * problem, a blocked tile host) leaves the status as it was.
 */
export class PointrMapError extends Error {
  override readonly name = "PointrMapError";
  readonly code: PointrMapErrorCode;
  readonly fatal: boolean;
  /** The shell's `mapStatus` while this error stands. */
  readonly status: MapReadiness;

  constructor(
    code: PointrMapErrorCode,
    message: string,
    options: { fatal?: boolean; offline?: boolean } = {},
  ) {
    super(message);
    this.code = code;
    this.fatal = options.fatal ?? true;
    this.status = pointrMapStatus(code, options.offline ?? false);
  }
}

/** The shell's `mapStatus` for an error code. */
export function pointrMapStatus(
  code: PointrMapErrorCode,
  offline = false,
): MapReadiness {
  if (code === "webgl" || code === "storage") return "unsupported";
  if (offline && (code === "script" || code === "data")) return "offline";
  return "error";
}

/**
 * Takes the secrets back out of a message the SDK wrote: the configured keys
 * and token, anything shaped like a JSON Web Token, and every URL's query
 * (the content's SAS tokens and the tile host's key travel in it).
 */
export function redact(text: string, secrets: readonly unknown[] = []) {
  let out = String(text);
  for (const secret of secrets)
    if (typeof secret === "string" && secret.length >= 4)
      out = out.split(secret).join("<redacted>");
  return out
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "<redacted token>")
    .replace(/(https?:\/\/[^\s?#"'<>]+)\?[^\s"'<>]*/g, "$1?<redacted>");
}

/** An SDK error's words, as `UiController.showError` receives it. */
export function sdkErrorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const { errorMsg, errorTitle, message } = error as Record<string, unknown>;
    const words = [errorTitle, errorMsg ?? message]
      .filter(
        (part): part is string => typeof part === "string" && part.length > 0,
      )
      .join(": ");
    if (words) return words;
  }
  return "no message";
}
