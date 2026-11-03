// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createApp, h, type App } from "vue";
import { KozmosLink } from "../../index";

/** React renders on its own schedule: wait until `ready` holds. */
async function until(ready: () => boolean) {
  for (let i = 0; i < 50 && !ready(); i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
}

describe("KozmosLink", () => {
  let app: App | undefined;
  afterEach(() => {
    app?.unmount();
    document.body.innerHTML = "";
  });

  const mount = async (attrs: Record<string, unknown>) => {
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp({
      render: () => h(KozmosLink, attrs, () => "Datenschutz"),
    });
    app.mount(host);
    await until(() => Boolean(host.querySelector("a")));
    return host.querySelector("a")!;
  };

  it("is the Vue wrapper of the React Link, under its name", () => {
    expect(KozmosLink).toMatchObject({
      name: "Link",
      setup: expect.any(Function),
    });
  });

  // GAP-202: a bare `external`, as a template writes it, is "" until it is a
  // Boolean prop, and React read "" as false.
  it("opens a new tab and draws the icon for a bare external", async () => {
    const link = await mount({
      href: "https://example.com/datenschutz",
      external: "",
      "external-label": "öffnet in einem neuen Tab",
    });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(link.querySelector(".kozmos-link-external-label")?.textContent).toBe(
      "öffnet in einem neuen Tab",
    );
  });

  it("opens in this tab without external", async () => {
    const link = await mount({ href: "/venues" });
    expect(link.hasAttribute("target")).toBe(false);
    expect(link.querySelector("svg")).toBeNull();
  });
});
