import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  holdPointrSdk,
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

describe("holdPointrSdk", () => {
  const links = () => files().filter((f) => f.tagName === "LINK");
  const scripts = () => files().filter((f) => f.tagName === "SCRIPT");
  const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("adds each file once, however many hold it, and resolves with the global", async () => {
    const first = holdPointrSdk("10.13.0");
    const second = holdPointrSdk("10.13.0");
    expect(files()).toHaveLength(2);
    arrive();
    const sdk = await first.ready;
    expect(await second.ready).toBe(sdk);
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

  it("takes the stylesheet away after the last release, a task later, and keeps the script", async () => {
    const first = holdPointrSdk("10.13.0");
    const second = holdPointrSdk("10.13.0");
    arrive();
    await first.ready;
    first.release();
    first.release(); // twice is once
    await nextTask();
    expect(links()).toHaveLength(1);
    second.release();
    expect(links()).toHaveLength(1);
    await nextTask();
    expect(links()).toHaveLength(0);
    expect(scripts()).toHaveLength(1);
    // The next hold adds it again, and waits for it.
    const third = holdPointrSdk("10.13.0");
    expect(links()).toHaveLength(1);
    links()[0].dispatchEvent(new Event("load"));
    await third.ready;
  });

  it("keeps the stylesheet when a hold follows a release in the same task (a restart)", async () => {
    const first = holdPointrSdk("10.13.0");
    arrive();
    await first.ready;
    const link = links()[0];
    first.release();
    const second = holdPointrSdk("10.13.0");
    await nextTask();
    expect(links()).toEqual([link]);
    await second.ready;
  });

  it("uses a global the host loaded itself, adding the stylesheet it lacks", async () => {
    installFakeSdk();
    const hold = holdPointrSdk("10.13.0");
    expect(scripts()).toHaveLength(0);
    expect(links()).toHaveLength(1);
    links()[0].dispatchEvent(new Event("load"));
    await hold.ready;
  });

  it("refuses a global the host loaded at another version, adding nothing", async () => {
    installFakeSdk();
    (
      window as unknown as { PointrWebSDK: { version?: string } }
    ).PointrWebSDK.version = "10.12.0";
    await expect(holdPointrSdk("10.13.0").ready).rejects.toMatchObject({
      resource: "version",
    });
    expect(files()).toHaveLength(0);
  });

  it("takes away what failed, so the next mount tries again", async () => {
    const hold = holdPointrSdk("10.13.0");
    scripts()[0].dispatchEvent(new Event("error"));
    await expect(hold.ready).rejects.toMatchObject({ resource: "script" });
    hold.release();
    await nextTask();
    expect(files()).toHaveLength(0);
    const again = holdPointrSdk("10.13.0");
    expect(files()).toHaveLength(2);
    arrive();
    await again.ready;
  });

  it("says when the script ran but set no global (an AMD loader takes it)", async () => {
    const hold = holdPointrSdk("10.13.0");
    for (const file of files()) file.dispatchEvent(new Event("load"));
    const error = await hold.ready.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PointrSdkLoadError);
    expect(error).toMatchObject({ resource: "global" });
  });

  it("refuses a version it has no integrity for, fetching nothing", async () => {
    await expect(holdPointrSdk("9.9.9" as never).ready).rejects.toMatchObject({
      resource: "version",
    });
    expect(files()).toHaveLength(0);
  });
});
