// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, h, type App, type Component } from "vue";
import { KozmosCombobox, KozmosListbox, KozmosMultiSelect } from "../../index";

// GAP-192 in the harness: an option's `group` reaches React's Combobox,
// Listbox and MultiSelect through the Vue wrappers' `options`, and each draws
// its groups, named by their labels, in the order they first appear.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const contentTypes = [
  { value: "office-desk", label: "Office Desk", group: "Interior Asset" },
  { value: "reception-desk", label: "Reception Desk", group: "POI" },
  { value: "hot-desk", label: "Hot Desk", group: "Interior Asset" },
];

async function until<T>(read: () => T | null | undefined | false) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("timed out");
}

let app: App | null = null;
afterEach(() => {
  app?.unmount();
  app = null;
  document.body.replaceChildren();
});

function mount(component: Component, props: Record<string, unknown>) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({ setup: () => () => h(component, props) });
  app.mount(host);
}

function groups() {
  return [...document.querySelectorAll('[role="group"]')].map((group) => ({
    name: document.getElementById(group.getAttribute("aria-labelledby") ?? "")
      ?.textContent,
    options: [...group.querySelectorAll('[role="option"]')].map(
      (option) => option.textContent,
    ),
  }));
}

const EXPECTED = [
  { name: "Interior Asset", options: ["Office Desk", "Hot Desk"] },
  { name: "POI", options: ["Reception Desk"] },
];

describe("option groups through the Vue wrappers", () => {
  it("KozmosListbox draws the groups", async () => {
    mount(KozmosListbox, {
      "aria-label": "Content type",
      options: contentTypes,
    });
    await until(() => document.querySelector('[role="listbox"]'));
    expect(groups()).toEqual(EXPECTED);
  });

  it.each([
    ["KozmosCombobox", KozmosCombobox, "Content type"],
    ["KozmosMultiSelect", KozmosMultiSelect, "Content types"],
  ] as const)(
    "%s draws the groups when its list opens",
    async (_, part, label) => {
      mount(part, { label, options: contentTypes });
      const input = await until(() =>
        document.querySelector<HTMLInputElement>('[role="combobox"]'),
      );
      input.focus();
      await until(() => document.querySelector('[role="listbox"]'));
      expect(groups()).toEqual(EXPECTED);
    },
  );
});
