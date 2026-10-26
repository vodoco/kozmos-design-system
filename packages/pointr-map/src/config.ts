import { PointrMapError } from "./errors";
import { CONTAINER_ID, POINTR_UI_OFF } from "./sdk";
import {
  POINTR_SDK_VERSION,
  pointrSdkFiles,
  type PointrSdkVersion,
} from "./sdk-versions";

/**
 * How the SDK proves who is asking.
 *
 * A product passes a short-lived Pointr Cloud token its own back end issues:
 * the SDK reads the client and the environment from the token's claims, and
 * no secret reaches the browser. The client identifier and licence key are
 * for prototypes, typed in at run time (a form, an environment variable), and
 * are never written into source, a story or a bundle.
 */
export type PointrMapAuth =
  | {
      cloudToken: string;
      /** Only for a token whose claims name no client. */
      clientIdentifier?: string;
      licenseKey?: never;
    }
  | { clientIdentifier: string; licenseKey: string; cloudToken?: never };

/** What the map starts with. A change to any of it starts the map again. */
export interface PointrMapConfig {
  /** The environment's API, `https://<environment>.pointr.cloud`. */
  baseUrl: string;
  auth: PointrMapAuth;
  /** The site's internal identifier. */
  site?: string;
  /** The building's internal identifier; the SDK needs its site with it. */
  building?: string;
  /** The level index the map opens on. */
  level?: number;
  /** The SDK's language, a code such as `en` or `ar` (`ar` lays the map out right to left). */
  language?: string;
  /** The persona the map is drawn for, a Pointr persona identifier. */
  persona?: string;
  /** The SDK version, loaded from Pointr's CDN; defaults to the one this package was measured with. */
  sdkVersion?: PointrSdkVersion;
}

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** The claims of a JSON Web Token, read without verifying it; undefined when it is not one. */
export function tokenClaims(
  token: string,
): Record<string, unknown> | undefined {
  const part = token.split(".")[1];
  if (!part) return undefined;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const claims: unknown = JSON.parse(json);
    return claims && typeof claims === "object"
      ? (claims as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Refuses, before the SDK sees it, every config its own validation would
 * refuse, because the SDK writes a client identifier or a licence key it
 * refuses into the console (`licenseKey(<the value>) is not valid`). `baseUrl`
 * is needed with a token too: the SDK goes to the token's `iss` instead when
 * it has one. `now` is for tests.
 */
export function checkConfig(
  config: PointrMapConfig | undefined,
  now = Date.now(),
): PointrMapError | undefined {
  const refuse = (message: string) => new PointrMapError("config", message);
  if (!config || typeof config !== "object")
    return refuse("PointrMap needs a config");
  if (!text(config.baseUrl)) return refuse("config.baseUrl is empty");
  let url: URL;
  try {
    url = new URL(config.baseUrl);
  } catch {
    return refuse("config.baseUrl is not a URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return refuse("config.baseUrl must be an http or https URL");
  const auth = config.auth as Record<string, unknown> | undefined;
  if (!auth || typeof auth !== "object")
    return refuse(
      "config.auth needs a cloudToken, or a clientIdentifier and a licenseKey",
    );
  if (auth.cloudToken !== undefined) {
    if (!text(auth.cloudToken))
      return refuse("config.auth.cloudToken is empty");
    const claims = tokenClaims(auth.cloudToken);
    const exp = claims?.exp;
    if (typeof exp === "number" && exp * 1000 <= now)
      return new PointrMapError("auth", "The Pointr cloud token has expired");
    const clients = claims?.clientIdentifiers;
    const named = Array.isArray(clients) && clients.some(text);
    if (!named && !text(auth.clientIdentifier))
      return refuse(
        "The cloud token names no client: pass config.auth.clientIdentifier with it",
      );
  } else if (!text(auth.clientIdentifier) || !text(auth.licenseKey)) {
    return refuse(
      "config.auth needs a cloudToken, or a clientIdentifier and a licenseKey",
    );
  }
  if (config.building !== undefined && !text(config.building))
    return refuse("config.building is empty");
  if (config.site !== undefined && !text(config.site))
    return refuse("config.site is empty");
  if (config.building !== undefined && config.site === undefined)
    return refuse(
      "config.building needs config.site: the SDK opens a building within its site",
    );
  if (config.level !== undefined && !Number.isInteger(config.level))
    return refuse("config.level must be an integer level index");
  if (config.language !== undefined && !text(config.language))
    return refuse("config.language is empty");
  if (config.persona !== undefined && !text(config.persona))
    return refuse("config.persona is empty");
  const version = config.sdkVersion ?? POINTR_SDK_VERSION;
  if (!pointrSdkFiles(version))
    return refuse(
      `No integrity is recorded for Pointr SDK ${String(version)}; add it to sdk-versions.ts`,
    );
  return undefined;
}

/**
 * The SDK's options that decide where the keys or the token go, and whose
 * they are. Its Options constructor takes every option from the page's
 * address over what it is given (`?<option>=`, or `?ptr<Option>=`, which
 * wins: `QueryParameterController.updateOptionsWithQueryString`, read from the
 * 10.13.0 bundle). Its token request is `POST <baseUrl>/identity/clients/
 * <clientIdentifier>/auth/token` with the licence key in the body, and a
 * token goes as a Bearer to `baseUrl` (or to the token's own `iss`, which the
 * SDK puts over it), so `?baseUrl=` in a link would send them elsewhere.
 */
const CREDENTIAL_OPTIONS = [
  "baseUrl",
  "clientIdentifier",
  "licenseKey",
  "pointrCloudToken",
];
const REFUSED_IN_ADDRESS = new Set(
  CREDENTIAL_OPTIONS.flatMap((option) => [
    option.toLowerCase(),
    `ptr${option}`.toLowerCase(),
  ]),
);

/**
 * The names in the page's address that the SDK would read over the config's
 * host, keys or token: names only, never their values. Read from the query
 * and the hash, ignoring case, because how the SDK's own reader matches them
 * was not read.
 */
export function addressOverrides(
  location: Pick<Location, "search" | "hash"> = window.location,
): string[] {
  const names: string[] = [];
  for (const part of [location.search, location.hash]) {
    const query = part.replace(/^[?#]/, "").replace(/\?/g, "&");
    for (const name of new URLSearchParams(query).keys())
      if (REFUSED_IN_ADDRESS.has(name.toLowerCase()) && !names.includes(name))
        names.push(name);
  }
  return names;
}

/** The refusal of a page whose address would redirect the keys. */
export function addressError(names: readonly string[]) {
  return new PointrMapError(
    "config",
    `The page's address carries ${names.join(", ")}, which the Pointr SDK reads over PointrMap's config; it could send the keys or the token to another host, so the map does not start`,
  );
}

/** The secrets in a config, to take back out of anything written. */
export function configSecrets(config: PointrMapConfig | undefined) {
  const auth = (config?.auth ?? {}) as Record<string, unknown>;
  return [auth.cloudToken, auth.clientIdentifier, auth.licenseKey];
}

/**
 * The `PointrWebSDK.Options` a checked config starts: every interface switch
 * off, and only keys the SDK knows (it warns about any other).
 */
export function sdkOptions(config: PointrMapConfig): Record<string, unknown> {
  const auth = config.auth;
  const options: Record<string, unknown> = {
    container: CONTAINER_ID,
    baseUrl: config.baseUrl,
    // The spike's maximum: the SDK's own is 23.
    mapMaxZoom: 21,
    ...POINTR_UI_OFF,
  };
  if (auth.cloudToken !== undefined) {
    options.pointrCloudToken = auth.cloudToken;
    if (auth.clientIdentifier) options.clientIdentifier = auth.clientIdentifier;
  } else {
    options.clientIdentifier = auth.clientIdentifier;
    options.licenseKey = auth.licenseKey;
  }
  if (config.site !== undefined) options.siteInternalIdentifier = config.site;
  if (config.building !== undefined)
    options.buildingInternalIdentifier = config.building;
  if (config.level !== undefined) options.levelIndex = config.level;
  if (config.language !== undefined) options.language = config.language;
  if (config.persona !== undefined) options.personaIdentifier = config.persona;
  return options;
}
