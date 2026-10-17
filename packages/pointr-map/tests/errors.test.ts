import { describe, expect, it } from "vitest";
import { checkConfig, sdkOptions, tokenClaims } from "../src/config";
import {
  PointrMapError,
  pointrMapStatus,
  redact,
  sdkErrorText,
} from "../src/errors";

describe("pointrMapStatus", () => {
  it("maps every code to the shell's status", () => {
    expect(pointrMapStatus("webgl")).toBe("unsupported");
    expect(pointrMapStatus("storage")).toBe("unsupported");
    for (const code of ["config", "instance", "csp", "auth"] as const) {
      expect(pointrMapStatus(code)).toBe("error");
      expect(pointrMapStatus(code, true)).toBe("error");
    }
    for (const code of ["script", "data"] as const) {
      expect(pointrMapStatus(code)).toBe("error");
      expect(pointrMapStatus(code, true)).toBe("offline");
    }
  });

  it("is carried by the error, fatal unless said otherwise", () => {
    const error = new PointrMapError("script", "x", { offline: true });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "PointrMapError",
      code: "script",
      status: "offline",
      fatal: true,
    });
    expect(new PointrMapError("csp", "y", { fatal: false }).fatal).toBe(false);
  });
});

describe("redact", () => {
  it("takes out the secrets, anything shaped like a token, and every URL's query", () => {
    expect(
      redact(
        "key abcd-1234 at https://fake-account.blob.core.windows.net/a/b?sv=1&sig=2 with eyJa.eyJb.c",
        ["abcd-1234", undefined, "", "ab"],
      ),
    ).toBe(
      "key <redacted> at https://fake-account.blob.core.windows.net/a/b?<redacted> with <redacted token>",
    );
  });

  it("reads each shape of SDK error", () => {
    expect(sdkErrorText("plain")).toBe("plain");
    expect(sdkErrorText(new TypeError("boom"))).toBe("boom");
    expect(
      sdkErrorText({ errorTitle: "Invalid settings", errorMsg: "no site" }),
    ).toBe("Invalid settings: no site");
    expect(sdkErrorText({})).toBe("no message");
  });
});

describe("config", () => {
  const base = { baseUrl: "https://pointr-map-test.invalid" };

  it("reads a token's claims without verifying it, and nothing from what is not one", () => {
    const claims = btoa(
      JSON.stringify({ exp: 5, clientIdentifiers: ["c"] }),
    ).replace(/=+$/, "");
    expect(tokenClaims(`h.${claims}.s`)).toEqual({
      exp: 5,
      clientIdentifiers: ["c"],
    });
    expect(tokenClaims("opaque-token")).toBeUndefined();
    expect(tokenClaims("a.%%%.b")).toBeUndefined();
  });

  it("accepts an opaque token with its client, and keys", () => {
    expect(
      checkConfig({
        ...base,
        auth: { cloudToken: "opaque", clientIdentifier: "c" },
      }),
    ).toBeUndefined();
    expect(
      checkConfig({
        ...base,
        auth: { clientIdentifier: "c", licenseKey: "k" },
      }),
    ).toBeUndefined();
    expect(checkConfig({ ...base, auth: { cloudToken: "opaque" } })?.code).toBe(
      "config",
    );
  });

  it("passes a token's own client through only when one is given", () => {
    expect(
      sdkOptions({ ...base, auth: { cloudToken: "t", clientIdentifier: "c" } }),
    ).toMatchObject({ pointrCloudToken: "t", clientIdentifier: "c" });
  });
});
