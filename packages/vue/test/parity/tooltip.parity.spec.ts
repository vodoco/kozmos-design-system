// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, type VNode } from "vue";
import {
  KozmosButton,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogTitle,
  KozmosTooltip,
  KozmosTooltipContent,
  KozmosTooltipProvider,
  KozmosTooltipTrigger,
} from "../../src/index";
import {
  e,
  key,
  press,
  mountReact,
  mountVue,
  serverBoth,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * Tooltip and its three parts, which React's story draws by hand (inside a
 * TooltipProvider), drawn in both from one description: closed on a server,
 * and open, mounted, in the theme's portal with its tip and its hidden
 * copy for a screen reader; each tone; a disabled trigger's focusable
 * wrapper, described by the tooltip (Tooltip.test.tsx); and, inside an open
 * Dialog, a tooltip on a button that Escape closes before the Dialog.
 */
type Props = Record<string, unknown>;
interface Spec {
  root?: Props;
  trigger?: Props;
  content?: Props;
  /** A disabled control in a disabled trigger. */
  disabledControl?: boolean;
  words?: string;
}
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

function reactTree(spec: Spec) {
  return e(
    KozmosReact.TooltipProvider,
    null,
    e(
      KozmosReact.Tooltip,
      spec.root ?? null,
      spec.disabledControl
        ? e(
            KozmosReact.TooltipTrigger,
            { disabled: true, ...spec.trigger },
            e("button", { disabled: true }, "Combine"),
          )
        : e(
            KozmosReact.TooltipTrigger,
            { asChild: true, ...spec.trigger },
            e(KozmosReact.Button, { variant: "outline" }, "Hover me"),
          ),
      e(
        KozmosReact.TooltipContent,
        spec.content ?? null,
        e("p", null, spec.words ?? "Add to library"),
      ),
    ),
  );
}

function vueTree(spec: Spec): VNode {
  return h(KozmosTooltipProvider, null, () =>
    h(KozmosTooltip, spec.root ?? null, () => [
      spec.disabledControl
        ? h(
            KozmosTooltipTrigger,
            { disabled: true, ...asVue(spec.trigger) },
            () => h("button", { disabled: true }, "Combine"),
          )
        : h(
            KozmosTooltipTrigger,
            { asChild: true, ...asVue(spec.trigger) },
            () => h(KozmosButton, { variant: "outline" }, () => "Hover me"),
          ),
      h(KozmosTooltipContent, asVue(spec.content), () =>
        h("p", null, spec.words ?? "Add to library"),
      ),
    ]),
  );
}

useOverlayPage();

describe("KozmosTooltip draws what React's Tooltip draws", () => {
  it("Default, closed: draws what React's story draws on a server", async () => {
    const { react, vue } = await serverBoth(reactTree({}), () => vueTree({}));
    expect(react).toContain('data-state="closed"');
    expect(vue).toBe(react);
  });

  it.each<[string, Spec]>([
    ["Default, open", { root: { open: true } }],
    [
      "the inverse tone",
      { root: { open: true }, content: { tone: "inverse" } },
    ],
    [
      "its own side, offset and label",
      {
        root: { open: true },
        content: { side: "right", sideOffset: 8, "aria-label": "Library" },
      },
    ],
    [
      "an app's class and attributes",
      {
        root: { open: true },
        trigger: { "data-parity": "trigger" },
        content: { className: "max-w-xs", "data-parity": "content" },
      },
    ],
    [
      "a disabled trigger, described by the tooltip",
      {
        root: { open: true },
        disabledControl: true,
        words: "Shift-click another feature first",
      },
    ],
    ["a disabled trigger, closed", { disabledControl: true }],
  ])("%s: mounted, as React's", async (_name, spec) => {
    const react = await mountReact(reactTree(spec));
    const vue = await mountVue(() => vueTree(spec));
    expect(vue).toBe(react);
    if (spec.disabledControl) {
      const wrapper = document.querySelector("[data-disabled-trigger]")!;
      expect(wrapper.getAttribute("tabindex")).toBe("0");
    }
    if (spec.root?.open) expect(react).toContain('role="tooltip"');
  });

  it("opens on focus and closes on Escape, telling v-model:open, as React's", async () => {
    const heard = { react: [] as boolean[], vue: [] as boolean[] };
    const steps = () => {
      const trigger = document.querySelector<HTMLElement>("button")!;
      return [() => trigger.focus(), () => void key(trigger, "Escape")];
    };
    const shots = { react: [] as number[], vue: [] as number[] };
    await mountReact(
      reactTree({
        root: { onOpenChange: (open: boolean) => heard.react.push(open) },
      }),
    );
    for (const step of steps()) {
      act(step);
      await settle();
      shots.react.push(document.querySelectorAll("[role=tooltip]").length);
    }
    await mountVue(() =>
      vueTree({
        root: h(KozmosTooltip, {
          "onUpdate:open": (open: boolean) => heard.vue.push(open),
        }).props as Props,
      }),
    );
    for (const step of steps()) {
      step();
      await settle();
      shots.vue.push(document.querySelectorAll("[role=tooltip]").length);
    }
    expect(heard.react).toEqual([true, false]);
    expect(shots.react).toEqual([1, 0]);
    expect(heard.vue).toEqual(heard.react);
    expect(shots.vue).toEqual(shots.react);
  });

  it("a KozmosTooltip outside every provider draws one of its own", async () => {
    await mountVue(() =>
      h(KozmosTooltip, { open: true }, () => [
        h(KozmosTooltipTrigger, null, () => "Hover me"),
        h(KozmosTooltipContent, null, () => "Words"),
      ]),
    );
    expect(document.querySelectorAll("[role=tooltip]")).toHaveLength(1);
  });
});

describe("a Tooltip on a button inside an open Dialog", () => {
  it("opens on focus; Escape closes the tooltip first, then the Dialog, as React's", async () => {
    const result = { react: [] as number[][], vue: [] as number[][] };
    const count = () => [
      document.querySelectorAll("[role=dialog]").length,
      document.querySelectorAll("[role=tooltip]").length,
    ];
    await mountReact(
      e(
        KozmosReact.Dialog,
        { defaultOpen: true },
        e(
          KozmosReact.DialogContent,
          null,
          e(KozmosReact.DialogTitle, null, "Library"),
          e(KozmosReact.DialogDescription, null, "Add to your library"),
          reactTree({}),
        ),
      ),
    );
    const steps = () => {
      const trigger = [
        ...document.querySelectorAll<HTMLElement>("button"),
      ].find((b) => b.textContent === "Hover me")!;
      return [
        () => trigger.focus(),
        () => void key(trigger, "Escape"),
        () => void key(document.activeElement!, "Escape"),
      ];
    };
    for (const step of steps()) {
      act(step);
      await settle();
      result.react.push(count());
    }
    await mountVue(() =>
      h(KozmosDialog, { defaultOpen: true }, () =>
        h(KozmosDialogContent, null, () => [
          h(KozmosDialogTitle, null, () => "Library"),
          h(KozmosDialogDescription, null, () => "Add to your library"),
          vueTree({}),
        ]),
      ),
    );
    for (const step of steps()) {
      step();
      await settle();
      result.vue.push(count());
    }
    expect(result.react).toEqual([
      [1, 1],
      [1, 0],
      [0, 0],
    ]);
    expect(result.vue).toEqual(result.react);
  });
});

describe("KozmosTooltipContent tells what React's tells", () => {
  it("escapeKeyDown and pointerDownOutside, as React's", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    for (const side of ["react", "vue"] as const) {
      const log = heard[side];
      if (side === "react")
        await mountReact(
          e(
            KozmosReact.TooltipProvider,
            null,
            e(
              KozmosReact.Tooltip,
              { defaultOpen: true },
              e(KozmosReact.TooltipTrigger, null, "Hover me"),
              e(
                KozmosReact.TooltipContent,
                {
                  onEscapeKeyDown: () => log.push("escapeKeyDown"),
                  onPointerDownOutside: () => log.push("pointerDownOutside"),
                },
                "Words",
              ),
            ),
          ),
        );
      else
        await mountVue(() =>
          h(KozmosTooltipProvider, null, () =>
            h(KozmosTooltip, { defaultOpen: true }, () => [
              h(KozmosTooltipTrigger, null, () => "Hover me"),
              h(
                KozmosTooltipContent,
                {
                  onEscapeKeyDown: () => log.push("escapeKeyDown"),
                  onPointerDownOutside: () => log.push("pointerDownOutside"),
                },
                () => "Words",
              ),
            ]),
          ),
        );
      const outside = document.body.appendChild(document.createElement("div"));
      if (side === "react") await act(() => press(outside));
      else await press(outside);
      await settle();
      if (document.querySelector("[role=tooltip]")) {
        if (side === "react") act(() => void key(document.body, "Escape"));
        else key(document.body, "Escape");
      }
      await settle();
    }
    expect(heard.react).toContain("pointerDownOutside");
    expect(heard.vue).toEqual(heard.react);
  });
});
