import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h, provide } from "vue";
import { renderToString } from "vue/server-renderer";
import { useKozmosAnalytics } from "../src/analytics/analytics";

/**
 * The analytics hook native ports call (PORTING.md, step 5): it reaches a
 * provider that knows only the key's name, and drops events without one.
 */
const Reporter = defineComponent({
  setup() {
    const { trackEvent } = useKozmosAnalytics();
    trackEvent("Button", "button_clicked", { variant: "default" });
    return () => h("span");
  },
});

describe("useKozmosAnalytics", () => {
  it("reports to a provider that provides under the key's name alone", async () => {
    const heard: unknown[] = [];
    const Provider = defineComponent({
      setup(_, { slots }) {
        provide(Symbol.for("@kozmos-ds/vue:analytics"), {
          trackEvent: (...event: unknown[]) => heard.push(event),
        });
        return () => slots.default?.();
      },
    });
    await renderToString(
      createSSRApp({ render: () => h(Provider, () => h(Reporter)) }),
    );
    expect(heard).toEqual([
      ["Button", "button_clicked", { variant: "default" }],
    ]);
  });

  it("drops events outside a provider", async () => {
    await expect(
      renderToString(createSSRApp({ render: () => h(Reporter) })),
    ).resolves.toBe("<span></span>");
  });
});
