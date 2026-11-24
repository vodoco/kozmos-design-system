// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, type App } from "vue";
import { KozmosEmptyState, KozmosLink } from "../../index";

/**
 * KozmosEmptyState's list as a template binds it, mounted (GAP-165): its
 * items arrive in order, in a list that keeps its role, and an item may be
 * the product's own inline content. Moved from the bridge's spec when
 * EmptyState was ported.
 */
describe("KozmosEmptyState's list", () => {
  let app: App | undefined;
  afterEach(() => {
    app?.unmount();
    document.body.innerHTML = "";
  });

  const mount = (template: string, setup: () => object = () => ({})) => {
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp(
      defineComponent({ components: { KozmosEmptyState }, setup, template }),
    );
    app.mount(host);
    return host;
  };

  it("arrives in order, in a list", () => {
    const host = mount(
      `<KozmosEmptyState title="No Map Content Found" list-label="What to try" :list="['Check the level', 'Clear the filters']" />`,
    );
    const list = host.querySelector("ul")!;
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-label")).toBe("What to try");
    expect(
      [...host.querySelectorAll("li")].map((item) => item.textContent),
    ).toEqual(["Check the level", "Clear the filters"]);
  });

  it("takes an item that is the product's own content", () => {
    const host = mount(
      `<KozmosEmptyState title="Nothing here" :list="list" />`,
      () => ({
        list: [
          "Check the level",
          h(KozmosLink, { href: "/help" }, () => "Read the help"),
        ],
      }),
    );
    const items = host.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[1].querySelector("a")?.getAttribute("href")).toBe("/help");
  });

  it("draws no list when it is empty", () => {
    const host = mount(`<KozmosEmptyState title="Nothing here" :list="[]" />`);
    expect(host.querySelector("ul")).toBeNull();
  });
});
