import { afterEach, describe, expect, it } from "vitest";
import { inertOutside } from "./modal-inert";

const releases: Array<() => void> = [];
afterEach(() => {
  releases.reverse().forEach((release) => release());
  releases.length = 0;
  document.body.replaceChildren();
});
const start = (target: HTMLElement, within?: Element) => {
  const release = inertOutside(target, within ? { within } : undefined);
  releases.push(release);
  return release;
};
function setup() {
  document.body.innerHTML =
    '<main><button>Host</button></main><aside inert="existing">Already inert</aside><div id="portal"><div id="one">One</div></div><div aria-live="polite">Announcement</div>';
  return document.getElementById("one")!;
}

describe("modal inert ownership", () => {
  it("excludes the popup and live regions, then restores exact host attributes", () => {
    const popup = setup(),
      release = start(popup);
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(popup.closest("[inert]")).toBeNull();
    expect(document.querySelector("[aria-live]")).not.toHaveAttribute("inert");
    release();
    release();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(document.querySelector("aside")).toHaveAttribute(
      "inert",
      "existing",
    );
    expect(document.querySelector("[aria-hidden]")).toBeNull();
  });
  it("hands interaction to the latest popup and restores the previous one", () => {
    const one = setup();
    start(one);
    const two = document.createElement("div");
    two.textContent = "Two";
    document.body.append(two);
    const closeTwo = start(two);
    expect(one.closest("[inert]")).not.toBeNull();
    expect(two.closest("[inert]")).toBeNull();
    closeTwo();
    expect(one.closest("[inert]")).toBeNull();
    expect(two).toHaveAttribute("inert");
  });
  it("handles dynamically added background roots and out-of-order releases", async () => {
    const one = setup(),
      closeOne = start(one);
    const late = document.createElement("button");
    document.body.append(late);
    await Promise.resolve();
    expect(late).toHaveAttribute("inert");
    const two = document.createElement("div");
    document.body.append(two);
    const closeTwo = start(two);
    closeOne();
    expect(two.closest("[inert]")).toBeNull();
    expect(late).toHaveAttribute("inert");
    closeTwo();
    expect(late).not.toHaveAttribute("inert");
  });
});

describe("modal inert within a frame (GAP-93)", () => {
  // A panel laid over a frame — the assistant over a phone's screen — makes
  // what it covers inert, and nothing else on the page.
  const el = (
    tag: string,
    attributes: Record<string, string>,
    ...children: (Node | string)[]
  ) => {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes))
      node.setAttribute(name, value);
    node.append(...children);
    return node;
  };
  function frames() {
    document.body.replaceChildren(
      el("button", { id: "toolbar" }, "Toolbar"),
      el(
        "div",
        { id: "phone-a" },
        el(
          "main",
          { id: "sheet-a" },
          el("button", {}, "Tile A"),
          el("p", { "aria-live": "polite" }, "3 places"),
        ),
        el("div", { id: "panel-a" }, "Assistant A"),
      ),
      el(
        "div",
        { id: "phone-b" },
        el("main", { id: "sheet-b" }, el("button", {}, "Tile B")),
        el("div", { id: "panel-b" }, "Assistant B"),
      ),
    );
    return { $: (id: string) => document.getElementById(id)! };
  }
  const inert = (node: Element) => node.closest("[inert]") !== null;

  it("makes the frame's content inert apart from the panel and its live regions, and leaves the page alone", () => {
    const { $ } = frames();
    const release = start($("panel-a"), $("phone-a"));
    expect(inert($("sheet-a").querySelector("button")!)).toBe(true);
    expect(inert($("panel-a"))).toBe(false);
    expect(inert($("sheet-a").querySelector("[aria-live]")!)).toBe(false);
    // Outside the frame, nothing changes.
    expect(inert($("toolbar"))).toBe(false);
    expect(inert($("sheet-b"))).toBe(false);
    release();
    expect(document.querySelector("[inert]")).toBeNull();
  });

  it("holds two frames at once, and releases each on its own", () => {
    const { $ } = frames();
    const closeA = start($("panel-a"), $("phone-a"));
    const closeB = start($("panel-b"), $("phone-b"));
    // A live region inside keeps its box reachable, and its parts are not.
    expect(inert($("sheet-a"))).toBe(false);
    expect(inert($("sheet-a").querySelector("button")!)).toBe(true);
    expect(inert($("sheet-b"))).toBe(true);
    expect(inert($("toolbar"))).toBe(false);
    closeB();
    expect(inert($("sheet-b"))).toBe(false);
    expect(inert($("sheet-a").querySelector("button")!)).toBe(true);
    closeA();
    expect(document.querySelector("[inert]")).toBeNull();
  });

  it("gives way to a popup over the whole page, and takes its frame back after", () => {
    const { $ } = frames();
    start($("panel-a"), $("phone-a"));
    const popup = el("div", {});
    document.body.append(popup);
    const closePopup = start(popup);
    expect(inert($("panel-a"))).toBe(true);
    expect(inert($("toolbar"))).toBe(true);
    expect(inert(popup)).toBe(false);
    closePopup();
    expect(inert($("panel-a"))).toBe(false);
    expect(inert($("toolbar"))).toBe(false);
    expect(inert($("sheet-a").querySelector("button")!)).toBe(true);
  });

  it("makes new content in the frame inert as it arrives", async () => {
    const { $ } = frames();
    start($("panel-a"), $("phone-a"));
    const tile = el("button", {});
    $("sheet-a").append(tile);
    const outside = el("button", {});
    document.body.append(outside);
    await Promise.resolve();
    expect(inert(tile)).toBe(true);
    expect(inert(outside)).toBe(false);
  });

  it("leaves standing a change a product made to a box's inert while it was held", () => {
    // GAP-93's workaround: a product that makes the covered box inert
    // itself, and takes it off as the panel closes. Put back, the box would
    // stay out of reach after the panel had gone.
    const { $ } = frames();
    const tile = $("sheet-b").querySelector("button")!;
    $("sheet-b").setAttribute("inert", "");
    const release = start($("panel-b"), $("phone-b"));
    expect(inert(tile)).toBe(true);
    $("sheet-b").removeAttribute("inert");
    release();
    expect($("sheet-b")).not.toHaveAttribute("inert");

    // And one a product set while it was held stays set.
    const again = start($("panel-b"), $("phone-b"));
    $("sheet-b").setAttribute("inert", "product");
    again();
    expect($("sheet-b")).toHaveAttribute("inert", "product");
  });
});
