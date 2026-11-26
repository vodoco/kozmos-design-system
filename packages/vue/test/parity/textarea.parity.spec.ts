// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import * as KozmosReact from "@kozmos-ds/react";
import { createApp, h, nextTick, ref, type App } from "vue";
import {
  KozmosThemeProvider,
  KozmosLabel,
  KozmosTextarea,
} from "../../src/index";
import { renderBoth, type Drawn } from "./render";

/**
 * React's Textarea stories draw with their own render, so the stories
 * parity check cannot draw them from args: here each is, drawn in both,
 * with the field's edges (a caller's description and aria-invalid, a count
 * in each of its states). Then, mounted, typing: `update:modelValue` hears
 * what React's onChange hears, and an uncontrolled field's count follows.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const inTheme = (...children: Drawn[]): Drawn => ({
  react: KozmosReact.ThemeProvider,
  vue: KozmosThemeProvider,
  children,
});
const textarea = (props: Record<string, unknown>): Drawn => {
  const vueProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props))
    vueProps[
      key === "className" ? "class" : key === "value" ? "modelValue" : key
    ] = value;
  return { react: KozmosReact.Textarea, vue: KozmosTextarea, props, vueProps };
};
const box = (className: string, ...children: (Drawn | string)[]): Drawn => ({
  react: "div",
  vue: "div",
  props: { className },
  vueProps: { class: className },
  children,
});
const label = (id: string): Drawn => ({
  react: KozmosReact.Label,
  vue: KozmosLabel,
  props: { htmlFor: id },
  vueProps: { for: id },
  children: ["Your message"],
});

describe("KozmosTextarea draws what React's Textarea draws", () => {
  it("Default: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-full gap-1.5",
          label("message"),
          textarea({ placeholder: "Type your message here.", id: "message" }),
        ),
      ),
      { keepIds: ["message"] },
    );
    expect(react).toContain("<textarea");
    expect(vue).toBe(react);
  });

  it("WithError: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "grid w-full gap-1.5",
          label("message-error"),
          textarea({
            placeholder: "Type your message here.",
            id: "message-error",
            error: true,
          }),
          {
            react: "span",
            vue: "span",
            props: { className: "text-sm font-medium text-destructive-text" },
            vueProps: { class: "text-sm font-medium text-destructive-text" },
            children: ["Message cannot be empty."],
          },
        ),
      ),
      { keepIds: ["message-error"] },
    );
    expect(react).toContain("kozmos-textarea-error");
    expect(vue).toBe(react);
  });

  it("CharacterCount: draws what React's story draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(
        box(
          "flex max-w-[420px] flex-col gap-6",
          textarea({
            count: { limit: 512, minimum: 50 },
            defaultValue: "",
            label: "Empty — unanswered, not yet wrong",
          }),
          textarea({
            count: { limit: 512, minimum: 50 },
            defaultValue:
              "I reached my destination with such ease and comfort, and the signage was clear.",
            label: "Long enough",
          }),
          textarea({
            count: { limit: 512, minimum: 50 },
            defaultValue: "I got lost while navigating.",
            label: "Too short",
          }),
          textarea({
            count: { limit: 60 },
            defaultValue:
              "Express Maps has completely revolutionized my travel experience and I could not do without it.",
            label: "Over the limit",
          }),
        ),
      ),
    );
    expect(react).toContain("Please enter at least 50 characters.");
    expect(react).toContain("Maximum character limit exceeded");
    expect(vue).toBe(react);
  });

  it("draws what React's Textarea draws", async () => {
    const { react, vue } = await renderBoth(
      inTheme(textarea({ label: "Note", placeholder: "Tell us" })),
    );
    expect(vue).toBe(react);
  });

  it.each([
    ["a string error", { error: "Required" }],
    ["an empty error", { error: "" }],
    [
      "a caller's description beside its error",
      { "aria-describedby": "hint", error: "Required" },
    ],
    ["a caller's aria-invalid", { "aria-invalid": true }],
    [
      "aria-invalid false under an error",
      { "aria-invalid": false, error: true },
    ],
    ["a controlled value", { value: "Gate 4", onChange: () => {} }],
    [
      "a count beside the caller's error",
      { count: { limit: 2 }, error: "Mine", defaultValue: "Gate" },
    ],
    [
      "a count of a controlled value",
      { count: { limit: 10 }, value: "👍👍", onChange: () => {} },
    ],
    [
      "a wrapper class and its own class",
      { wrapperClassName: "mt-4", className: "min-h-40" },
    ],
  ] as const)("%s", async (_name, given) => {
    const drawn = textarea({ label: "Note", ...given });
    // React's controlled value's onChange is Vue's update:modelValue.
    delete drawn.vueProps!.onChange;
    const { react, vue } = await renderBoth(inTheme(drawn), {
      keepIds: ["hint"],
    });
    expect(vue).toBe(react);
  });
});

describe("KozmosTextarea, mounted", () => {
  let reactRoot: Root | undefined;
  let vueApp: App | undefined;
  afterEach(() => {
    act(() => reactRoot?.unmount());
    vueApp?.unmount();
    reactRoot = undefined;
    vueApp = undefined;
    document.body.replaceChildren();
  });
  const host = () => {
    const element = document.createElement("div");
    document.body.append(element);
    return element;
  };

  it("update:modelValue hears each change, as React's onChange", async () => {
    const heard = { react: [] as string[], vue: [] as string[] };
    const reactHost = host();
    reactRoot = createRoot(reactHost);
    await act(async () =>
      reactRoot!.render(
        React.createElement(KozmosReact.Textarea, {
          "aria-label": "Note",
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) =>
            heard.react.push(event.target.value),
        }),
      ),
    );
    const reactField = reactHost.querySelector("textarea")!;
    const { set } = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!;
    act(() => {
      set!.call(reactField, "Gate 42");
      reactField.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const note = ref("Gate 4");
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosTextarea, {
          "aria-label": "Note",
          count: { limit: 10 },
          modelValue: note.value,
          "onUpdate:modelValue": (next: string) => {
            heard.vue.push(next);
            note.value = next;
          },
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    const field = vueHost.querySelector("textarea")!;
    expect(field.value).toBe("Gate 4");
    field.value = "Gate 42";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(heard.vue).toEqual(heard.react);
    expect(note.value).toBe("Gate 42");
    expect(vueHost.textContent).toContain("7/10");
  });

  it("takes back a change the parent refuses, and shows the model it sets", async () => {
    const note = ref("Gate");
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosTextarea, {
          "aria-label": "Note",
          modelValue: note.value,
          "onUpdate:modelValue": (next: string) => {
            if (!/\d/.test(next)) note.value = next;
          },
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    const field = vueHost.querySelector("textarea")!;
    for (let i = 0; i < 2; i++) {
      field.value = "Gate 4";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(field.value).toBe("Gate");
    }
    note.value = "Lounge";
    await nextTick();
    expect(field.value).toBe("Lounge");
  });

  it("an uncontrolled field's count follows typing", async () => {
    const vueHost = host();
    vueApp = createApp({
      render: () =>
        h(KozmosTextarea, {
          label: "Note",
          count: { limit: 512, minimum: 5 },
        }),
    });
    vueApp.mount(vueHost);
    await nextTick();
    const field = vueHost.querySelector("textarea")!;
    expect(vueHost.textContent).toContain("0/512");
    expect(vueHost.querySelector('[role="alert"]')).toBeNull();
    field.value = "Gate";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await nextTick();
    expect(field.value).toBe("Gate");
    expect(vueHost.textContent).toContain("4/512");
    expect(vueHost.querySelector('[role="alert"]')?.textContent).toContain(
      "Please enter at least 5 characters.",
    );
  });
});
