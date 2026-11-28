// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import * as KozmosReact from "@kozmos-ds/react";
import { h, ref, type VNode } from "vue";
import {
  KozmosButton,
  KozmosDialog,
  KozmosDialogContent,
  KozmosDialogDescription,
  KozmosDialogTitle,
  KozmosDialogTrigger,
  KozmosPopover,
  KozmosPopoverContent,
  KozmosPopoverTrigger,
  KozmosSearch,
  type KozmosAnalyticsEvent,
} from "../../src/index";
import {
  body,
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
 * Search in both: its stories, as a server draws them; the edges React's
 * tests cover (Search.test.tsx, Search.layers.test.tsx): the browser's own
 * clear hidden, a caller's description joined with the error, an error a
 * caller cannot conceal, a label and an id; and, mounted, `clearable`
 * (GAP-161): no clear unless asked or while empty, none disabled or read
 * only, named in the page's language, emptying a v-model and an
 * uncontrolled field through the field's own input event, `@clear`,
 * `search_cleared` with no query, the focus back in the field, Escape
 * clearing (and prevented) while it holds text and left alone once empty or
 * when not clearable, the caller's listeners kept; and in a native Dialog
 * and Popover, the first Escape clearing and the next closing.
 */

useOverlayPage();

/** React's props as Vue writes them. */
const asVue = ({
  className,
  readOnly,
  defaultValue,
  ...rest
}: Record<string, unknown>) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
  ...(readOnly === undefined ? {} : { readonly: readOnly }),
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

const field = () => document.querySelector<HTMLInputElement>("input")!;
/** Types as a keyboard does: the value's own setter, then an input event. */
const typeInto = (input: HTMLInputElement, text: string) => {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("KozmosSearch draws what React's Search draws", () => {
  it("Default and Clearable, as their stories draw them", async () => {
    for (const props of [
      { placeholder: "Search...", wrapperClassName: "w-72" },
      {
        label: "Find a place",
        defaultValue: "Gate B12",
        clearable: true,
        wrapperClassName: "w-72",
      },
    ]) {
      const { react, vue } = await serverBoth(
        e(KozmosReact.Search, props),
        () => h(KozmosSearch, asVue(props)),
      );
      expect(react).toContain("kozmos-search-input");
      expect(vue).toBe(react);
    }
  });

  it("a label, an id, a caller's description and class, and an error, boolean or with words, a caller cannot conceal", async () => {
    for (const props of [
      { label: "Find a place", id: "place" },
      {
        label: "Find a place",
        "aria-describedby": "search-hint",
        error: "Nothing matches",
      },
      {
        label: "Find a place",
        error: "Nothing matches",
        "aria-invalid": false,
      },
      { "aria-label": "Place", error: true, className: "kozmos-parity" },
      {
        "aria-label": "Place",
        value: "gate",
        clearable: true,
        disabled: true,
        readOnly: true,
        onChange: () => {},
      },
      {
        "aria-label": "Place",
        value: "gate",
        clearable: true,
        onChange: () => {},
      },
      {
        "aria-label": "Place",
        defaultValue: "kapı",
        clearable: true,
        clearLabel: "Aramayı temizle",
      },
    ]) {
      const { value, ...rest } = props as Record<string, unknown>;
      delete rest.onChange;
      const { react, vue } = await serverBoth(
        e(KozmosReact.Search, props),
        () =>
          h(KozmosSearch, {
            ...asVue(rest),
            ...(value === undefined ? {} : { modelValue: value }),
          }),
      );
      expect(vue).toBe(react);
    }
  });
});

/** Mounts each framework's field, held by an owner as an app holds it. */
async function inBoth(
  props: Record<string, unknown>,
  steps: ((side: "react" | "vue") => unknown)[],
  { controlled = false } = {},
) {
  const seen: Record<string, unknown[]> = { react: [], vue: [] };
  const events: Record<string, unknown> = {};
  for (const side of ["react", "vue"] as const) {
    const heard: string[] = [];
    const sent: KozmosAnalyticsEvent[] = [];
    if (side === "react") {
      function Owner() {
        const [query, setQuery] = React.useState(
          String(props.defaultValue ?? ""),
        );
        return e(
          "div",
          {
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === "Escape")
                heard.push(`outer Escape ${event.defaultPrevented}`);
            },
          },
          e(KozmosReact.Search, {
            ...props,
            ...(controlled
              ? {
                  value: query,
                  defaultValue: undefined,
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    heard.push(`change ${JSON.stringify(event.target.value)}`);
                    setQuery(event.target.value);
                  },
                }
              : {}),
            onClear: () => heard.push("clear"),
          }),
        );
      }
      await mountReact(() => e(Owner), sent);
    } else {
      const query = ref(String(props.defaultValue ?? ""));
      await mountVue(
        () =>
          h(
            "div",
            {
              onKeydown: (event: KeyboardEvent) => {
                if (event.key === "Escape")
                  heard.push(`outer Escape ${event.defaultPrevented}`);
              },
            },
            [
              h(KozmosSearch, {
                ...asVue(props),
                ...(controlled
                  ? {
                      modelValue: query.value,
                      defaultValue: undefined,
                      "onUpdate:modelValue": (next: string) => {
                        heard.push(`change ${JSON.stringify(next)}`);
                        query.value = next;
                      },
                    }
                  : {}),
                onClear: () => heard.push("clear"),
              }),
            ],
          ),
        sent,
      );
    }
    for (const step of steps) {
      if (side === "react") await act(async () => void (await step(side)));
      else await step(side);
      await settle();
      seen[side].push({
        value: field().value,
        clear: button(String(props.clearLabel ?? "Clear search"))
          ? "drawn"
          : "none",
        focus: document.activeElement === field() ? "field" : "elsewhere",
        heard: [...heard],
        // The field's own attributes: the DOM's value is compared above (a
        // default value is React's value attribute, which Vue's property
        // leaves as it was drawn).
        dom: body().replace(/ value(="[^"]*")?/g, ""),
      });
    }
    events[side] = read(sent);
  }
  return { seen, events };
}

describe("KozmosSearch's clear (GAP-161), as React's", () => {
  const clearIt = () => press(button("Clear search")!);
  const escape = () => void key(field(), "Escape");

  it("draws its clear while it holds text, and none when emptied; typing draws it again", async () => {
    const { seen } = await inBoth(
      { label: "Find a place", defaultValue: "gate", clearable: true },
      [
        () => field().focus(),
        () => typeInto(field(), ""),
        () => typeInto(field(), "g"),
      ],
    );
    expect(seen.react.map((step) => (step as { clear: string }).clear)).toEqual(
      ["drawn", "none", "drawn"],
    );
    expect(seen.vue).toEqual(seen.react);
  });

  it("empties a controlled field through its v-model, emits clear, reports search_cleared with no query, and gives the focus back", async () => {
    const { seen, events } = await inBoth(
      { label: "Find a place", defaultValue: "gate", clearable: true },
      [clearIt],
      { controlled: true },
    );
    expect(seen.react[0]).toMatchObject({
      value: "",
      clear: "none",
      focus: "field",
      heard: ['change ""', "clear"],
    });
    expect(seen.vue).toEqual(seen.react);
    expect(events.react).toContainEqual(
      expect.objectContaining({
        component: "Search",
        eventName: "search_cleared",
      }),
    );
    expect(events.vue).toEqual(events.react);
  });

  it("empties an uncontrolled field and takes its clear away", async () => {
    const { seen } = await inBoth(
      { label: "Find a place", defaultValue: "gate", clearable: true },
      [clearIt],
    );
    expect(seen.react[0]).toMatchObject({
      value: "",
      clear: "none",
      focus: "field",
    });
    expect(seen.vue).toEqual(seen.react);
  });

  it("clears on Escape while it holds text, the Escape prevented; leaves it alone once empty, and when not clearable", async () => {
    for (const clearable of [true, false]) {
      const { seen } = await inBoth(
        { label: "Find a place", defaultValue: "gate", clearable },
        [() => field().focus(), escape, escape],
      );
      expect((seen.react.at(-1) as { heard: string[] }).heard).toEqual(
        clearable
          ? ["clear", "outer Escape true", "outer Escape false"]
          : ["outer Escape false", "outer Escape false"],
      );
      expect(seen.vue).toEqual(seen.react);
    }
  });

  it("keeps the caller's keydown and input listeners", async () => {
    const heard: Record<string, string[]> = { react: [], vue: [] };
    await mountReact(
      e(KozmosReact.Search, {
        label: "Find a place",
        clearable: true,
        onKeyDown: () => heard.react.push("keydown"),
        onInput: () => heard.react.push("input"),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          heard.react.push(`change ${event.target.value}`),
      }),
    );
    key(field(), "a");
    await act(async () => typeInto(field(), "a"));
    await mountVue(() =>
      h(KozmosSearch, {
        label: "Find a place",
        clearable: true,
        onKeydown: () => heard.vue.push("keydown"),
        onInput: () => heard.vue.push("input"),
        "onUpdate:modelValue": (next: string) =>
          heard.vue.push(`change ${next}`),
      }),
    );
    key(field(), "a");
    typeInto(field(), "a");
    await settle();
    expect(heard.react).toEqual(["keydown", "input", "change a"]);
    expect(heard.vue).toEqual(heard.react);
  });
});

describe("a native Search in a native Dialog and Popover", () => {
  const host = (
    kind: "dialog" | "popover",
    react: boolean,
  ): React.ReactElement | VNode => {
    const search = {
      "aria-label": "Place",
      defaultValue: "Gate",
      clearable: true,
    };
    if (react)
      return kind === "dialog"
        ? e(
            KozmosReact.Dialog,
            null,
            e(
              KozmosReact.DialogTrigger,
              { asChild: true },
              e(KozmosReact.Button, null, "Find"),
            ),
            e(
              KozmosReact.DialogContent,
              null,
              e(KozmosReact.DialogTitle, null, "Find a place"),
              e(KozmosReact.DialogDescription, null, "Search the venue"),
              e(KozmosReact.Search, search),
              e(KozmosReact.Button, null, "Done"),
            ),
          )
        : e(
            KozmosReact.Popover,
            null,
            e(
              KozmosReact.PopoverTrigger,
              { asChild: true },
              e(KozmosReact.Button, null, "Find"),
            ),
            e(
              KozmosReact.PopoverContent,
              { "aria-label": "Filter" },
              e(KozmosReact.Search, search),
            ),
          );
    return kind === "dialog"
      ? h(KozmosDialog, null, () => [
          h(KozmosDialogTrigger, { asChild: true }, () =>
            h(KozmosButton, null, () => "Find"),
          ),
          h(KozmosDialogContent, null, () => [
            h(KozmosDialogTitle, null, () => "Find a place"),
            h(KozmosDialogDescription, null, () => "Search the venue"),
            h(KozmosSearch, search),
            h(KozmosButton, null, () => "Done"),
          ]),
        ])
      : h(KozmosPopover, null, () => [
          h(KozmosPopoverTrigger, { asChild: true }, () =>
            h(KozmosButton, null, () => "Find"),
          ),
          h(KozmosPopoverContent, { "aria-label": "Filter" }, () =>
            h(KozmosSearch, search),
          ),
        ]);
  };

  it.each(["dialog", "popover"] as const)(
    "in a %s, the first Escape clears the field and the next closes it; Escape away from the field closes it and keeps the text",
    async (kind) => {
      const seen: Record<string, unknown[]> = { react: [], vue: [] };
      for (const side of ["react", "vue"] as const) {
        for (const away of [false, true]) {
          if (side === "react")
            await mountReact(host(kind, true) as React.ReactElement);
          else await mountVue(() => host(kind, false) as VNode);
          const steps = [
            () => press(button("Find")!),
            () => field().focus(),
            ...(away && kind === "dialog"
              ? [() => button("Done")!.focus()]
              : []),
            () => void key(document.activeElement!, "Escape"),
            () => void key(document.activeElement!, "Escape"),
          ];
          for (const step of steps) {
            if (side === "react") await act(async () => void (await step()));
            else await step();
            await settle();
            await settle();
            const input = document.querySelector("input");
            seen[side].push({
              open: document.querySelectorAll('[role="dialog"]').length,
              value: input?.value ?? null,
            });
          }
        }
      }
      expect(seen.react.slice(0, 4)).toEqual([
        { open: 1, value: "Gate" },
        { open: 1, value: "Gate" },
        { open: 1, value: "" },
        { open: 0, value: null },
      ]);
      expect(seen.vue).toEqual(seen.react);
    },
  );
});
