import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadPointrSdk,
  PointrSdkLoadError,
  resetPointrSdkLoaderForTests,
} from "../src/sdk-loader";
import {
  POINTR_SDK_CDN,
  POINTR_SDK_VERSIONS,
  pointrSdkFiles,
} from "../src/sdk-versions";
import { installFakeSdk, resetFakeSdk } from "./fake-sdk";

const files = () => [
  ...document.head.querySelectorAll<HTMLElement>("[data-kozmos-pointr-sdk]"),
];
const arrive = () => {
  installFakeSdk();
  for (const file of files()) file.dispatchEvent(new Event("load"));
};

beforeEach(() => {
  resetFakeSdk();
  resetPointrSdkLoaderForTests();
  for (const file of files()) file.remove();
});
afterEach(() => resetFakeSdk());

describe("the version table", () => {
  it("records a sha384 for both files of every version, and the CDN's URLs", () => {
    for (const [version, hashes] of Object.entries(POINTR_SDK_VERSIONS)) {
      expect(hashes.script).toMatch(/^sha384-[A-Za-z0-9+/]{64}$/);
      expect(hashes.style).toMatch(/^sha384-[A-Za-z0-9+/]{64}$/);
      expect(pointrSdkFiles(version)).toEqual({
        version,
        script: {
          url: `${POINTR_SDK_CDN}/${version}/pointrwebsdk.js`,
          integrity: hashes.script,
        },
        style: {
          url: `${POINTR_SDK_CDN}/${version}/css/pointr.css`,
          integrity: hashes.style,
        },
      });
    }
    expect(pointrSdkFiles("0.0.1")).toBeUndefined();
    expect(pointrSdkFiles("constructor")).toBeUndefined();
  });
});

describe("loadPointrSdk", () => {
  it("adds each file once, however many ask, and resolves with the global", async () => {
    const first = loadPointrSdk("10.13.0");
    const second = loadPointrSdk("10.13.0");
    expect(second).toBe(first);
    expect(files()).toHaveLength(2);
    arrive();
    const sdk = await first;
    expect(sdk).toBe(
      (window as unknown as { PointrWebSDK: unknown }).PointrWebSDK,
    );
    expect(
      files().every((f) => f.getAttribute("crossorigin") === "anonymous"),
    ).toBe(true);
    expect(
      files().every((f) => f.getAttribute("referrerpolicy") === "no-referrer"),
    ).toBe(true);
    expect(
      files().every((f) => f.getAttribute("integrity")?.startsWith("sha384-")),
    ).toBe(true);
  });

  it("uses a global the host loaded itself, adding nothing", async () => {
    installFakeSdk();
    await loadPointrSdk("10.13.0");
    expect(files()).toHaveLength(0);
  });

  it("takes away what failed, so the next mount tries again", async () => {
    const load = loadPointrSdk("10.13.0");
    files()[1].dispatchEvent(new Event("error"));
    await expect(load).rejects.toMatchObject({ resource: "script" });
    expect(files()).toHaveLength(0);
    const again = loadPointrSdk("10.13.0");
    expect(again).not.toBe(load);
    expect(files()).toHaveLength(2);
    arrive();
    await again;
  });

  it("says when the script ran but set no global (an AMD loader takes it)", async () => {
    const load = loadPointrSdk("10.13.0");
    for (const file of files()) file.dispatchEvent(new Event("load"));
    const error = await load.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PointrSdkLoadError);
    expect(error).toMatchObject({ resource: "global" });
  });

  it("refuses a version it has no integrity for, fetching nothing", async () => {
    await expect(loadPointrSdk("9.9.9" as never)).rejects.toMatchObject({
      resource: "version",
    });
    expect(files()).toHaveLength(0);
  });
});
