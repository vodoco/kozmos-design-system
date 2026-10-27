// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosAnchoredPopover, KozmosButton } from "../../index";

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

  it("keeps a two-step tour's next step open, with focus on it", async () => {
    // Two steps, one KozmosAnchoredPopover each: step 1's Next closes it and
    // opens step 2 in the same update. Step 1's closing must not take focus
    // back from step 2, which would dismiss it.
    const step = ref(1);
    const closed: number[] = [];
    const first = ref<HTMLButtonElement | null>(null);
    const second = ref<HTMLButtonElement | null>(null);
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp({
      setup: () => () => [
        h("button", { ref: first, type: "button" }, "Add desk"),
        h("button", { ref: second, type: "button" }, "Choose a floor"),
        h(
          KozmosAnchoredPopover,
          {
            open: step.value === 1,
            "onUpdate:open": (open: boolean) => {
              if (!open) closed.push(1);
            },
            anchor: first.value,
            "aria-label": "Step 1 of 2",
          },
          {
            default: () =>
              h(
                "button",
                { type: "button", onClick: () => (step.value = 2) },
                "Next",
              ),
          },
        ),
        h(
          KozmosAnchoredPopover,
          {
            open: step.value === 2,
            "onUpdate:open": (open: boolean) => {
              if (!open) {
                closed.push(2);
                step.value = 0;
              }
            },
            anchor: second.value,
            "aria-label": "Step 2 of 2",
          },
          { default: () => h("button", { type: "button" }, "Done") },
        ),
      ],
    });
    app.mount(host);
    // Step 1 open, with focus in it, as a visitor reaches its Next.
    const next = await until(() =>
      document.activeElement?.textContent === "Next"
        ? (document.activeElement as HTMLButtonElement)
        : null,
    );
    next.click();
    await until(() =>
      document.querySelector('[role="dialog"][aria-label="Step 2 of 2"]'),
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(
      document.querySelector('[role="dialog"][aria-label="Step 2 of 2"]'),
    ).not.toBeNull();
    // Nothing asked step 2 to close. (Step 1, in a React root of its own, may
    // hear step 2 take focus before its own open={false} arrives: it is
    // closing either way.)
    expect(closed).not.toContain(2);
    expect(document.activeElement?.textContent).toBe("Done");
  });

  it("anchors to a Vue component's element, through a template ref", async () => {
    // ref on a KozmosButton gives its component instance, whose $el is the
    // wrapper's display: contents box: the anchor is the <button> in it.
    const open = ref(true);
    const target = ref<unknown>(null);
    const host = document.createElement("div");
    document.body.append(host);
    app = createApp({
      setup: () => () => [
        h(KozmosButton, { ref: target }, { default: () => "Add desk" }),
        h(
          KozmosAnchoredPopover,
          {
            open: open.value,
            "onUpdate:open": (next: boolean) => {
              open.value = next;
            },
            anchor: target.value,
            "aria-label": "Step 1 of 1",
          },
          { default: () => h("button", { type: "button" }, "Got it") },
        ),
      ],
    });
    app.mount(host);
    const button = await until(() =>
      [...document.querySelectorAll("button")].find(
        (node) => node.textContent === "Add desk",
      ),
    );
    const step = await until(() => document.querySelector('[role="dialog"]'));
    step.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await until(() => open.value === false);
    // Nothing had focus as it opened: focus goes to the anchor, the button.
    await until(() => document.activeElement === button);
  });
});
