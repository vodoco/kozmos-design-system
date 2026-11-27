import type { Meta, StoryObj } from "@storybook/vue3";
import { h, ref } from "vue";
import {
  KozmosButton,
  KozmosHeading,
  KozmosPopover,
  KozmosPopoverAnchor,
  KozmosPopoverArrow,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
  KozmosText,
} from "../../index";

/**
 * Vue's Popover: the stories React's has, with the same names, each drawn as
 * React's story draws it, from Kozmos parts only, inside the
 * KozmosThemeProvider the Storybook's decorator gives every story.
 * test/parity/popover.parity.spec.ts draws them in both.
 */
type Args = Record<string, unknown>;

const meta: Meta<Args> = {
  title: "Vue/Core/Overlays/Popover",
  component: KozmosPopover,
};

export default meta;
type Story = StoryObj<Args>;

export const Default: Story = {
  render: () => ({
    setup: () => () =>
      h(KozmosPopover, null, () => [
        h(KozmosPopoverTrigger, { asChild: true }, () =>
          h(KozmosButton, { variant: "outline" }, () => "Open popover"),
        ),
        h(KozmosPopoverContent, { class: "w-80" }, () => [
          h("div", { class: "grid gap-4" }, [
            h("div", { class: "space-y-2" }, [
              h("h4", { class: "font-medium leading-none" }, "Dimensions"),
              h(
                "p",
                { class: "text-sm text-muted-foreground" },
                "Set the dimensions for the layer.",
              ),
            ]),
          ]),
        ]),
      ]),
  }),
};

/**
 * GAP-190: a popover the product opens beside a control it does not own, as
 * a tour opens its step. "Add desk" is a plain button: KozmosPopoverAnchor
 * adds no popover attributes to it and no click that toggles. Open from the
 * start, so the step shows beside it (on the docs page, shut); "Show the
 * step" opens it.
 */
export const AnchoredToAControl: Story = {
  render: (_args, { viewMode }) => ({
    setup: () => {
      // Shut on the docs page, where an open step would sit over its text.
      const open = ref(viewMode !== "docs");
      return () =>
        h("div", { class: "flex min-h-36 items-start gap-4" }, [
          h(
            KozmosPopover,
            {
              open: open.value,
              "onUpdate:open": (next: boolean) => (open.value = next),
            },
            () => [
              h(KozmosPopoverAnchor, { asChild: true }, () =>
                h(KozmosButton, null, () => "Add desk"),
              ),
              h(
                KozmosPopoverContent,
                {
                  side: "bottom",
                  align: "start",
                  sideOffset: 8,
                  "aria-label": "Step 2 of 5",
                },
                () => [
                  h("div", { class: "grid gap-3" }, [
                    h(KozmosHeading, { level: 4 }, () => "Add a desk"),
                    h(
                      KozmosText,
                      { size: "sm", color: "muted" },
                      () =>
                        "Press Add desk, then choose where it goes on the floor.",
                    ),
                    h(
                      KozmosButton,
                      { size: "sm", onClick: () => (open.value = false) },
                      () => "Got it",
                    ),
                  ]),
                  h(KozmosPopoverArrow),
                ],
              ),
            ],
          ),
          h(
            KozmosButton,
            { variant: "outline", onClick: () => (open.value = true) },
            () => "Show the step",
          ),
        ]);
    },
  }),
};

/**
 * KozmosPopoverAnchor's `virtual-ref`: anchored to a rect rather than an
 * element, here a point on a map, so it draws nothing of its own. The rect
 * names the map's canvas as its `contextElement`, so the popover follows
 * the canvas when a box it sits in scrolls, and `hide-when-detached` hides
 * it once the point is out of that box; it places itself again every frame
 * (`update-position-strategy="always"`), as a point that moves with the map
 * needs. It takes no focus as it opens.
 */
export const AnchoredToARect: Story = {
  render: () => ({
    setup: () => {
      const map = ref<HTMLDivElement | null>(null);
      const feature = {
        current: {
          getBoundingClientRect: () => {
            const box = map.value?.getBoundingClientRect();
            return DOMRect.fromRect({
              x: box ? box.left + box.width * 0.6 : 0,
              y: box ? box.top + box.height * 0.6 : 0,
              width: 0,
              height: 0,
            });
          },
          get contextElement() {
            return map.value ?? undefined;
          },
        },
      };
      return () =>
        h(KozmosPopover, { open: true }, () => [
          h("div", { ref: map, class: "h-64 w-80 rounded-control bg-muted" }),
          h(KozmosPopoverAnchor, { virtualRef: feature }),
          h(
            KozmosPopoverContent,
            {
              side: "top",
              sideOffset: 8,
              updatePositionStrategy: "always",
              hideWhenDetached: true,
              onOpenAutoFocus: (event: Event) => event.preventDefault(),
              "aria-label": "Reception desk",
              class: "w-auto",
            },
            () => [
              h(
                KozmosText,
                { size: "sm", weight: "semibold" },
                () => "Reception desk",
              ),
              h(KozmosPopoverArrow),
            ],
          ),
        ]);
    },
  }),
};
