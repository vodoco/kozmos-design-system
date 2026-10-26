// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosAnchoredPopover } from "../../index";

// GAP-190 in the harness: the anchored popover is mounted from Vue, beside an
// element Vue draws, opened and closed through v-model:open.
beforeAll(() => {
  // Radix measures through ResizeObserver, which jsdom does not have.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

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

function mountStep() {
  const open = ref(true);
  const target = ref<HTMLButtonElement | null>(null);
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({
    setup: () => () => [
      h("button", { ref: target, type: "button" }, "Add desk"),
      h(
        KozmosAnchoredPopover,
        {
          open: open.value,
          "onUpdate:open": (next: boolean) => {
            open.value = next;
          },
          anchor: target.value,
          side: "bottom",
          "aria-label": "Step 2 of 5",
        },
        { default: () => h("button", { type: "button" }, "Got it") },
      ),
    ],
  });
  app.mount(host);
  return { open, target };
}

describe("KozmosAnchoredPopover", () => {
  it("exports a Vue adapter for React's anchored Popover", () => {
    expect(KozmosAnchoredPopover).toMatchObject({
      name: "AnchoredPopover",
      setup: expect.any(Function),
    });
  });

  it("opens beside a plain element, with the slot as its content", async () => {
    const { target } = mountStep();
    await nextTick();
    const step = await until(() =>
      document.querySelector('[role="dialog"][aria-label="Step 2 of 5"]'),
    );
    expect(step.textContent).toContain("Got it");
    // The target is Vue's own button: no popover attributes on it.
    for (const attribute of ["aria-haspopup", "aria-expanded", "aria-controls"])
      expect(target.value?.hasAttribute(attribute)).toBe(false);
  });

  it("closes through v-model:open on Escape and gives focus back", async () => {
    const { open, target } = mountStep();
    const step = await until(() => document.querySelector('[role="dialog"]'));
    step.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await until(() => open.value === false);
    await until(() => !document.querySelector('[role="dialog"]'));
    await until(() => document.activeElement === target.value);
  });
});
