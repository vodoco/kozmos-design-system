// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, h, ref, type App, type Component } from "vue";
import {
  KozmosCombobox,
  KozmosListbox,
  KozmosMultiSelect,
} from "../../react-bridge";

// Decision 215 (GAP-282) and GAP-260 in the harness: an option's `media`
// and `trailing` reach React's Combobox, Listbox and MultiSelect through
// the Vue wrappers' `options`, and Listbox's `activeValue` with its change
// through KozmosListbox's props.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const clients = [
  { value: "acme", label: "Acme Airport", media: { initials: "AA" } },
  { value: "pointr", label: "Pointr Cloud", media: {}, trailing: "3 sites" },
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

function mount(component: Component, props: () => Record<string, unknown>) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({ setup: () => () => h(component, props()) });
  app.mount(host);
}

/** Each option's initials, label and trailing words, as drawn. */
function drawn() {
  return [...document.querySelectorAll('[role="option"]')].map((option) => ({
    media: option.querySelector(".kozmos-option-media")?.textContent ?? null,
    label: option.querySelector(".kozmos-option-label")?.textContent,
    trailing:
      option.querySelector(".kozmos-option-trailing")?.textContent ?? null,
  }));
}

const EXPECTED = [
  { media: "AA", label: "Acme Airport", trailing: null },
  { media: "PC", label: "Pointr Cloud", trailing: "3 sites" },
];

describe("an option's media and trailing words through the Vue wrappers", () => {
  it("KozmosListbox draws them", async () => {
    mount(KozmosListbox, () => ({
      "aria-label": "Switch client",
      options: clients,
    }));
    await until(() => document.querySelector('[role="listbox"]'));
    expect(drawn()).toEqual(EXPECTED);
  });

  it.each([
    ["KozmosCombobox", KozmosCombobox],
    ["KozmosMultiSelect", KozmosMultiSelect],
  ] as const)("%s draws them when its list opens", async (_, part) => {
    mount(part, () => ({ label: "Clients", options: clients }));
    const input = await until(() =>
      document.querySelector<HTMLInputElement>('[role="combobox"]'),
    );
    input.focus();
    await until(() => document.querySelector('[role="listbox"]'));
    expect(drawn()).toEqual(EXPECTED);
  });

  it("KozmosListbox takes the active option as v-model:active-value", async () => {
    const active = ref<string | null>("acme");
    const asked: (string | null)[] = [];
    mount(KozmosListbox, () => ({
      "aria-label": "Switch client",
      options: clients,
      activeValue: active.value,
      "onUpdate:activeValue": (value: string | null) => {
        asked.push(value);
        active.value = value;
      },
    }));
    const list = await until(() =>
      document.querySelector<HTMLElement>('[role="listbox"]'),
    );
    const activeLabel = () =>
      document
        .getElementById(list.getAttribute("aria-activedescendant") ?? "")
        ?.querySelector(".kozmos-option-label")?.textContent;
    expect(activeLabel()).toBe("Acme Airport");
    list.focus();
    list.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    await until(() => activeLabel() === "Pointr Cloud");
    expect(asked).toEqual(["pointr"]);
  });
});
