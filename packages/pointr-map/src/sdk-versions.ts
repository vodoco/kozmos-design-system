/**
 * The Pointr Web SDK versions this package loads, each with the subresource
 * integrity of its two files on Pointr's CDN. The browser refuses a file whose
 * bytes do not hash to the value here, so a changed or replaced file on the
 * CDN fails to load instead of running.
 *
 * Pointr publishes no hashes (an ask for its SDK team). These were computed
 * from the files themselves, fetched twice on 17 Oct 2026 and never executed:
 * `pnpm --filter @kozmos-ds/pointr-map integrity` prints this table for the
 * versions given (`-- 10.14.0`), and `integrity:check` fetches every version
 * listed here again and fails on a hash that no longer matches. A new version
 * is added here by a pull request, after the live drive has run against it.
 */
export const POINTR_SDK_CDN = "https://pointr-websdk.azureedge.net";

export const POINTR_SDK_VERSIONS = {
  "10.13.0": {
    script:
      "sha384-8hyxsnKODQR0HCjng2xPlwCD4fGNGO10xtv9eLrv710Itru5lpf4+XbJpc8qzy/Q",
    style:
      "sha384-oSe/reJZKK8xJnHsZFJq0g5wnKYh3bjs73Z2SiBPgD1wSDa/k6zu703F/bvbAeax",
  },
} as const satisfies Record<string, { script: string; style: string }>;

/** A version this package has integrity for. */
export type PointrSdkVersion = keyof typeof POINTR_SDK_VERSIONS;

/** The version the spike measured, and the one PointrMap loads by default. */
export const POINTR_SDK_VERSION: PointrSdkVersion = "10.13.0";

export interface PointrSdkFiles {
  version: PointrSdkVersion;
  script: { url: string; integrity: string };
  style: { url: string; integrity: string };
}

/** The two files of a version, with their integrity; undefined for a version not listed. */
export function pointrSdkFiles(version: string): PointrSdkFiles | undefined {
  if (!Object.prototype.hasOwnProperty.call(POINTR_SDK_VERSIONS, version))
    return undefined;
  const known = version as PointrSdkVersion;
  const hashes = POINTR_SDK_VERSIONS[known];
  return {
    version: known,
    script: {
      url: `${POINTR_SDK_CDN}/${known}/pointrwebsdk.js`,
      integrity: hashes.script,
    },
    style: {
      url: `${POINTR_SDK_CDN}/${known}/css/pointr.css`,
      integrity: hashes.style,
    },
  };
}
