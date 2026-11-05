// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref, type App } from "vue";
import {
  KozmosButton,
  KozmosDensityScope,
  KozmosThemeProvider,
  useTheme,
} from "../../index";
// Internal: what the parts read their density with, not exported.
import { useKozmosDensity } from "../../theme/injection";

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.replaceChildren();
});

function mount(render: () => ReturnType<typeof h>) {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({ render });
  app.mount(host);
  return host;
}

describe("KozmosButton", () => {
  it("is a native button that fires its click, and none while disabled or loading", async () => {
    const clicks: string[] = [];
    const state = ref<{ disabled?: boolean; isLoading?: boolean }>({});
    const host = mount(() =>
      h(
        KozmosButton,
        { ...state.value, onClick: () => clicks.push("click") },
        { default: () => "Save" },
      ),
    );
    const button = host.querySelector("button")!;
    button.click();
    expect(clicks).toEqual(["click"]);

    state.value = { disabled: true };
    await nextTick();
    expect(button.disabled).toBe(true);
    button.click();
    expect(clicks).toEqual(["click"]);

    state.value = { isLoading: true };
    await nextTick();
    expect(button.disabled).toBe(true);
    const arc = button.querySelector("svg.kozmos-spinner-arc")!;
    expect(arc.getAttribute("aria-hidden")).toBe("true");
    expect(arc.getAttribute("width")).toBe("16");
    // The arc comes before the content, as React draws it.
    expect(button.firstElementChild).toBe(arc);
    expect(button.textContent).toBe("Save");
  });

  it("passes every other attribute and listener to the button", () => {
    const focused: string[] = [];
    const host = mount(() =>
      h(KozmosButton, {
        type: "submit",
        "aria-describedby": "hint",
        "data-test": "save",
        onFocus: () => focused.push("focus"),
      }),
    );
    const button = host.querySelector("button")!;
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.getAttribute("aria-describedby")).toBe("hint");
    expect(button.dataset.test).toBe("save");
    button.dispatchEvent(new FocusEvent("focus"));
    expect(focused).toEqual(["focus"]);
  });
});

describe("KozmosThemeProvider and KozmosDensityScope", () => {
  const Probe = defineComponent({
    name: "Probe",
    setup() {
      const density = useKozmosDensity();
      return () => h("output", { "data-density": density?.value ?? "none" });
    },
  });

  it("gives density to what is inside: the provider's, a scope's, a nested provider's", () => {
    const host = mount(() =>
      h(KozmosThemeProvider, { density: "compact" }, () => [
        h(Probe, { id: "a" }),
        h(KozmosDensityScope, { density: "touch" }, () => [
          h(Probe, { id: "b" }),
          h(KozmosThemeProvider, null, () => h(Probe, { id: "c" })),
        ]),
      ]),
    );
    const read = (id: string) =>
      host.querySelector(`#${id}`)?.getAttribute("data-density");
    expect(read("a")).toBe("compact");
    expect(read("b")).toBe("touch");
    // A provider nested in a scope inherits the scope's density.
    expect(read("c")).toBe("touch");
  });

  it("marks the one child with as-child, through Reka's Slot", () => {
    const host = mount(() =>
      h(KozmosThemeProvider, null, () =>
        h(KozmosDensityScope, { density: "compact", asChild: true }, () =>
          h(KozmosButton, null, () => "Tool"),
        ),
      ),
    );
    const button = host.querySelector("button")!;
    expect(button.getAttribute("data-kozmos-density")).toBe("compact");
    expect(button.parentElement?.hasAttribute("data-kozmos-root")).toBe(true);
  });

  it("draws its portal in the body once mounted, with the scope's marks", async () => {
    mount(() =>
      h(
        KozmosThemeProvider,
        { theme: "dark", density: "compact", dir: "rtl" },
        () => "x",
      ),
    );
    await nextTick();
    const portal = document.body.querySelector("[data-kozmos-portal]")!;
    expect(portal.parentElement).toBe(document.body);
    for (const [name, value] of [
      ["data-kozmos-root", ""],
      ["data-theme", "dark"],
      ["data-kozmos-density", "compact"],
      ["dir", "rtl"],
    ])
      expect(portal.getAttribute(name)).toBe(value);
  });

  it("sets the theme through useTheme, emits it, and persists it under storageKey", async () => {
    const emitted: string[] = [];
    let api: ReturnType<typeof useTheme> | undefined;
    const Setter = defineComponent({
      setup() {
        api = useTheme();
        return () => null;
      },
    });
    localStorage.setItem("kz-theme", "dark");
    const host = mount(() =>
      h(
        KozmosThemeProvider,
        {
          storageKey: "kz-theme",
          onThemeChange: (theme: string) => emitted.push(theme),
        },
        () => h(Setter),
      ),
    );
    await nextTick();
    const root = host.querySelector("[data-kozmos-root]")!;
    // The stored preference is read once mounted.
    expect(root.getAttribute("data-theme")).toBe("dark");
    api!.setTheme("light");
    await nextTick();
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(emitted).toEqual(["light"]);
    expect(localStorage.getItem("kz-theme")).toBe("light");
  });

  it("useTheme outside a provider says so", () => {
    const Lone = defineComponent({
      setup() {
        useTheme();
        return () => null;
      },
    });
    expect(() => mount(() => h(Lone))).toThrow(
      "useTheme must be used within a KozmosThemeProvider",
    );
  });
});
