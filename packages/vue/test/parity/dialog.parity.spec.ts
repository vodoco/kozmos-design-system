// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref, type VNode } from "vue";
import {
  KozmosButton,
  KozmosDialog,
  KozmosDialogClose,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogFooter,
  KozmosDialogHeader,
  KozmosDialogTitle,
  KozmosDialogTrigger,
  KozmosInput,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import {
  button,
  e,
  key,
  mountReact,
  mountVue,
  press,
  read,
  serverBoth,
  settle,
  useOverlayPage,
} from "./overlays";

/**
 * Dialog and its seven parts, which React's story draws by hand, drawn in
 * both from one description (`Spec`): closed, as a server renders it, and
 * open, mounted, in the theme's portal with its scrim, its close and the
 * density; then what React's tests cover (Dialog.test.tsx): the close's
 * localized name, the stacked footer, the full size, the header's media,
 * decorative or named, and bleeding; the close giving focus back to the
 * trigger, Escape, v-model:open hearing what onOpenChange hears, the
 * content's events, and `dialog_opened` and `dialog_closed` reported.
 */

type Props = Record<string, unknown>;
interface Spec {
  root?: Props;
  content?: Props;
  header?: Props;
  /** The header's media, as words in a box. */
  media?: string;
  footer?: Props;
  /** A close of its own in the footer. */
  footerClose?: boolean;
  title?: string;
  description?: string;
  /** Fields in the body, as the story's. */
  fields?: boolean;
}

/** A part's props as Vue writes them: `className` is `class`. */
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

function reactTree(
  spec: Spec,
  listeners: { root?: Props; content?: Props } = {},
) {
  return e(
    KozmosReact.Dialog,
    { ...spec.root, ...listeners.root },
    e(
      KozmosReact.DialogTrigger,
      { asChild: true },
      e(KozmosReact.Button, { variant: "outline" }, "Edit Profile"),
    ),
    e(
      KozmosReact.DialogContent,
      { ...spec.content, ...listeners.content },
      e(
        KozmosReact.DialogHeader,
        {
          ...spec.header,
          ...(spec.media === undefined
            ? {}
            : { media: e("div", { className: "h-24" }, spec.media) }),
        },
        e(KozmosReact.DialogTitle, null, spec.title ?? "Edit profile"),
        e(
          KozmosReact.DialogDescription,
          null,
          spec.description ??
            "Make changes to your profile here. Click save when you're done.",
        ),
      ),
      spec.fields
        ? e(
            "div",
            { className: "flex flex-col gap-4 py-4" },
            e(KozmosReact.Input, {
              id: "name",
              label: "Name",
              defaultValue: "Pedro Duarte",
            }),
            e(KozmosReact.Input, {
              id: "username",
              label: "Username",
              defaultValue: "@peduarte",
            }),
          )
        : null,
      e(
        KozmosReact.DialogFooter,
        spec.footer ?? null,
        spec.footerClose
          ? e(
              KozmosReact.DialogClose,
              { asChild: true },
              e(
                KozmosReact.Button,
                { variant: "outline", type: "button" },
                "Cancel",
              ),
            )
          : e(
              KozmosReact.Button,
              { variant: "outline", type: "button" },
              "Cancel",
            ),
        e(KozmosReact.Button, { type: "submit" }, "Save changes"),
      ),
    ),
  );
}

function vueTree(
  spec: Spec,
  listeners: { root?: Props; content?: Props } = {},
): VNode {
  return h(KozmosDialog, { ...spec.root, ...listeners.root }, () => [
    h(KozmosDialogTrigger, { asChild: true }, () =>
      h(KozmosButton, { variant: "outline" }, () => "Edit Profile"),
    ),
    h(
      KozmosDialogContent,
      { ...asVue(spec.content), ...listeners.content },
      () => [
        h(KozmosDialogHeader, asVue(spec.header), {
          default: () => [
            h(KozmosDialogTitle, null, () => spec.title ?? "Edit profile"),
            h(
              KozmosDialogDescription,
              null,
              () =>
                spec.description ??
                "Make changes to your profile here. Click save when you're done.",
            ),
          ],
          ...(spec.media === undefined
            ? {}
            : { media: () => h("div", { class: "h-24" }, spec.media) }),
        }),
        spec.fields
          ? h("div", { class: "flex flex-col gap-4 py-4" }, [
              h(KozmosInput, {
                id: "name",
                label: "Name",
                defaultValue: "Pedro Duarte",
              }),
              h(KozmosInput, {
                id: "username",
                label: "Username",
                defaultValue: "@peduarte",
              }),
            ])
          : null,
        h(KozmosDialogFooter, asVue(spec.footer), () => [
          spec.footerClose
            ? h(KozmosDialogClose, { asChild: true }, () =>
                h(
                  KozmosButton,
                  { variant: "outline", type: "button" },
                  () => "Cancel",
                ),
              )
            : h(
                KozmosButton,
                { variant: "outline", type: "button" },
                () => "Cancel",
              ),
          h(KozmosButton, { type: "submit" }, () => "Save changes"),
        ]),
      ],
    ),
  ]);
}

useOverlayPage();

describe("KozmosDialog draws what React's Dialog draws", () => {
  it("Default, closed: draws what React's story draws on a server", async () => {
    const spec: Spec = { content: { className: "sm:max-w-md" }, fields: true };
    const { react, vue } = await serverBoth(reactTree(spec), () =>
      vueTree(spec),
    );
    expect(react).toContain('aria-haspopup="dialog"');
    expect(vue).toBe(react);
  });

  it.each<[string, Spec]>([
    ["Default, open", { content: { className: "sm:max-w-md" }, fields: true }],
    ["a localized close", { content: { closeLabel: "Fermer" } }],
    ["the stacked footer", { footer: { layout: "stacked" } }],
    ["the full size", { content: { size: "full" } }],
    ["decorative media", { media: "Picture" }],
    [
      "named media that bleeds",
      { media: "Picture", header: { mediaLabel: "A desk", mediaBleed: true } },
    ],
    [
      "an app's class and attributes",
      {
        content: { className: "kozmos-parity", "data-parity": "content" },
        header: { className: "px-2", "data-parity": "header" },
        footer: { className: "px-2", "data-parity": "footer" },
      },
    ],
  ])("%s: draws React's dialog in the portal, mounted", async (_name, spec) => {
    const open = { ...spec, root: { defaultOpen: true } };
    const react = await mountReact(reactTree(open));
    expect(react).toContain('role="dialog"');
    expect(react).toContain("data-kozmos-portal");
    const vue = await mountVue(() => vueTree(open));
    expect(vue).toBe(react);
  });
});

describe("KozmosDialog, mounted, behaves as React's", () => {
  /** Each opened from its trigger and closed by `close`, with what it heard. */
  async function run(
    close: (dialog: Element) => void | Promise<void>,
    spec: Spec = {},
  ) {
    const result = {} as Record<
      "react" | "vue",
      {
        heard: unknown[];
        events: KozmosAnalyticsEvent[];
        focus: string;
        open: boolean;
      }
    >;
    for (const side of ["react", "vue"] as const) {
      const heard: unknown[] = [];
      const events: KozmosAnalyticsEvent[] = [];
      if (side === "react") {
        const Owner = () => {
          const [open, setOpen] = React.useState(false);
          return reactTree(spec, {
            root: {
              open,
              onOpenChange: (next: boolean) => {
                heard.push(["open", next]);
                setOpen(next);
              },
            },
            content: {
              onOpenAutoFocus: () => heard.push("openAutoFocus"),
              onCloseAutoFocus: () => heard.push("closeAutoFocus"),
              onEscapeKeyDown: () => heard.push("escapeKeyDown"),
              onPointerDownOutside: () => heard.push("pointerDownOutside"),
              onFocusOutside: () => heard.push("focusOutside"),
              onInteractOutside: () => heard.push("interactOutside"),
            },
          });
        };
        await mountReact(e(Owner), events);
      } else {
        const open = ref(false);
        await mountVue(
          () =>
            vueTree(spec, {
              root: h(KozmosDialog, {
                open: open.value,
                "onUpdate:open": (next: boolean) => {
                  heard.push(["open", next]);
                  open.value = next;
                },
              }).props as Props,
              content: h(KozmosDialogContent, {
                onOpenAutoFocus: () => heard.push("openAutoFocus"),
                onCloseAutoFocus: () => heard.push("closeAutoFocus"),
                onEscapeKeyDown: () => heard.push("escapeKeyDown"),
                onPointerDownOutside: () => heard.push("pointerDownOutside"),
                onFocusOutside: () => heard.push("focusOutside"),
                onInteractOutside: () => heard.push("interactOutside"),
              }).props as Props,
            }),
          events,
        );
      }
      const trigger = button("Edit Profile")!;
      trigger.focus();
      await (side === "react" ? act(() => press(trigger)) : press(trigger));
      await settle();
      const dialog = document.querySelector("[role=dialog]")!;
      expect(dialog, `${side} opens`).toBeTruthy();
      await (side === "react"
        ? act(async () => void (await close(dialog)))
        : close(dialog));
      await settle();
      await settle();
      result[side] = {
        heard,
        events: read(events) as KozmosAnalyticsEvent[],
        focus: document.activeElement?.textContent?.trim() ?? "",
        open: !!document.querySelector("[role=dialog]"),
      };
    }
    return result;
  }

  it("closes from its close, giving the trigger focus back, and reports it", async () => {
    const { react, vue } = await run(() => press(button("Close")!));
    expect(react.open).toBe(false);
    expect(react.focus).toBe("Edit Profile");
    // The trigger is a Button, which reports its press; the close reports
    // none of its own (WithoutGenericClick).
    expect(react.events.map((event) => event.eventName)).toEqual([
      "button_clicked",
      "dialog_opened",
      "dialog_closed",
    ]);
    expect(vue).toEqual(react);
  });

  it("closes on Escape, telling the content", async () => {
    const { react, vue } = await run((dialog) => void key(dialog, "Escape"));
    expect(react.open).toBe(false);
    expect(react.heard).toContain("escapeKeyDown");
    expect(vue).toEqual(react);
  });

  it("closes on a press outside, telling the content", async () => {
    const { react, vue } = await run(() =>
      press(document.querySelector(".kozmos-modal-overlay")!),
    );
    expect(react.open).toBe(false);
    expect(react.heard).toContain("pointerDownOutside");
    expect(vue).toEqual(react);
  });

  it("closes from a DialogClose of its own in the footer", async () => {
    const { react, vue } = await run(() => press(button("Cancel")!), {
      footerClose: true,
    });
    expect(react.open).toBe(false);
    expect(vue).toEqual(react);
  });
});
