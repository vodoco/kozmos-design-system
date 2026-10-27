// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, h, nextTick, ref, type App } from "vue";
import { KozmosTourStep } from "../../index";

// GAP-188 in the harness: a tour's step mounted from Vue, beside an element
// Vue draws, with its body from the default slot and its buttons from Vue's
// listeners.
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
  const step = ref(1);
  const closes = ref(0);
  const target = ref<HTMLButtonElement | null>(null);
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({
    setup: () => () => [
      h("button", { ref: target, type: "button" }, "Healthcare Center"),
      h(
        KozmosTourStep,
        {
          target: target.value,
          tourLabel: "How Pointr Cloud is organised",
          step: step.value,
          stepCount: 5,
          title: "Open a site",
          positionLabel: (at: number, count: number) => `${at}/${count}`,
          onNext: () => {
            step.value += 1;
          },
          onClose: () => {
            closes.value += 1;
          },
        },
        {
          default: () => "Each site in this client is listed here.",
          instruction: () => "Go ahead and open a site.",
        },
      ),
    ],
  });
  app.mount(host);
  return { step, closes };
}

describe("KozmosTourStep", () => {
  it("is the Vue wrapper of the React TourStep, under its name", () => {
    expect(KozmosTourStep).toMatchObject({
      name: "TourStep",
      setup: expect.any(Function),
    });
  });

  // Vue writes every undeclared attribute onto the wrapper's element, and a
  // component instance or a function cannot be written as one.
  it("declares target and positionLabel as props", () => {
    expect(Object.keys(KozmosTourStep.props ?? {})).toEqual(
      expect.arrayContaining(["target", "positionLabel"]),
    );
  });

  it("opens as a dialog named by its title, its body and status from the slots", async () => {
    mountStep();
    await nextTick();
    const dialog = await until(() =>
      document.querySelector<HTMLElement>('[role="dialog"]'),
    );
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toBe("Open a site");
    expect(dialog.textContent).toContain("1/5");
    expect(dialog.textContent).toContain(
      "Each site in this client is listed here.",
    );
    expect(dialog.querySelector('[role="status"]')?.textContent).toContain(
      "Go ahead and open a site.",
    );
  });

  it("draws Next for @next, no Back without @back, and closes through @close", async () => {
    const { step, closes } = mountStep();
    await until(() => document.querySelector('[role="dialog"]'));
    const buttons = () =>
      Array.from(document.querySelectorAll('[role="dialog"] button')).map(
        (button) => button.textContent || button.getAttribute("aria-label"),
      );
    expect(buttons()).toEqual(["Close", "Next"]);
    (
      Array.from(document.querySelectorAll('[role="dialog"] button')).find(
        (button) => button.textContent === "Next",
      ) as HTMLButtonElement
    ).click();
    await until(() => step.value === 2);
    // Each step is a dialog of its own.
    const second = await until(() =>
      document.querySelector('[role="dialog"]')?.textContent?.includes("2/5")
        ? document.querySelector<HTMLElement>('[role="dialog"]')
        : null,
    );
    second.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await until(() => closes.value === 1);
  });
});
