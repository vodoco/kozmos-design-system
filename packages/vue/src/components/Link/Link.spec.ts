// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, type App } from "vue";
import { KozmosLink } from "../../index";

/**
 * KozmosLink as a template writes it (GAP-202), mounted: a bare `external`
 * is true, as a Vue Boolean prop reads it, and opens a new tab with the icon
 * and the product's words; without it the link stays in this tab. Moved from
 * the bridge's spec when Link was ported: what it proved holds of the port.
 */
describe("KozmosLink", () => {
  let app: App | undefined;
  afterEach(() => {
    app?.unmount();
    document.body.innerHTML = "";
  });

  const mount = (template: string) => {
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(defineComponent({ components: { KozmosLink }, template }));
    app.mount(host);
    return host.querySelector("a")!;
  };

  it("is the native part, not the bridge's wrapper", () => {
    expect(KozmosLink.name).toBe("KozmosLink");
  });

  it.each([
    ["external", true],
    ['external="external"', true],
    ['external=""', true],
    [':external="true"', true],
    [':external="false"', false],
    ["", false],
  ])("%s: a new tab is %s", (attribute, newTab) => {
    const link = mount(
      `<KozmosLink href="https://example.com/datenschutz" external-label="öffnet in einem neuen Tab" ${attribute}>Datenschutz</KozmosLink>`,
    );
    expect(link.getAttribute("target") === "_blank").toBe(newTab);
    expect(link.getAttribute("rel") === "noopener noreferrer").toBe(newTab);
    expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      newTab ? "true" : undefined,
    );
    expect(link.querySelector(".kozmos-link-external-label")?.textContent).toBe(
      newTab ? "öffnet in einem neuen Tab" : undefined,
    );
  });

  it("an app's target that keeps it in this tab opens no new tab", () => {
    const link = mount(
      `<KozmosLink href="/venues" external target="_self">Venues</KozmosLink>`,
    );
    expect(link.getAttribute("target")).toBe("_self");
    expect(link.hasAttribute("rel")).toBe(false);
    expect(link.querySelector("svg")).toBeNull();
  });

  it("an app's rel wins over the new tab's", () => {
    const link = mount(
      `<KozmosLink href="https://example.com" external rel="noopener">Example</KozmosLink>`,
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  });
});
