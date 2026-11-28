import * as React from "react";
import { act } from "react";
import { defineComponent, h, ref, type Component, type VNode } from "vue";
import type { KozmosAnalyticsEvent } from "../../src/theme/injection";
import { body, e, mountReact, mountVue, read, settle } from "./overlays";

/**
 * What Menu's and ContextMenu's parity specs share: a menu described once
 * (`MenuSpec`) and drawn in both frameworks from the parts each spec names
 * (`MenuParts`), every callback React's parts take heard into one log under
 * the same name Vue's event hears, and a run of steps acted on both, each
 * step's outcome (focus, the open panels, the page made inert, the log)
 * compared. The checkbox and radio items are held by an owner as an app
 * holds them, through React's checked/onCheckedChange and value/
 * onValueChange and Vue's v-model:checked and v-model.
 */

type Pair = [React.ElementType, Component];
export interface MenuParts {
  Root: Pair;
  Trigger: Pair;
  Content: Pair;
  Portal: Pair;
  Item: Pair;
  CheckboxItem: Pair;
  RadioGroup: Pair;
  RadioItem: Pair;
  Group: Pair;
  Label: Pair;
  Separator: Pair;
  Shortcut: Pair;
  Sub: Pair;
  SubTrigger: Pair;
  SubContent: Pair;
}

type Props = Record<string, unknown>;
export type MenuNode =
  | {
      item: string;
      props?: Props;
      /** An app's `<a>` drawn as the row (`as-child`). */
      link?: Props;
      shortcut?: string;
      /** `preventDefault()` in its select: the menu stays open. */
      keepOpen?: boolean;
    }
  | { checkbox: string; checked?: boolean | "indeterminate"; props?: Props }
  | { radio: [string, string][]; value?: string; props?: Props }
  | { label: string; props?: Props }
  | { separator: true; props?: Props }
  | { group: MenuNode[]; props?: Props }
  | {
      sub: string;
      items: MenuNode[];
      props?: Props;
      subProps?: Props;
      contentProps?: Props;
    };

export interface MenuSpec {
  root?: Props;
  /** The trigger's props, and its child: a `<button>` as its own child, or text. */
  trigger?: Props;
  triggerWords?: string;
  /** Drawn as an app's child (`as-child`): Kozmos's Button in React and Vue. */
  triggerChild?: Pair;
  /** An app's element as the trigger (`as-child`), React's and Vue's. */
  triggerElement?: { react: () => React.ReactElement; vue: () => VNode };
  content?: Props;
  nodes: MenuNode[];
  /** Drawn before the menu: a host button, a live region holding a button. */
  page?: boolean;
}

/** A part's props as Vue writes them: `className` is `class`. */
const asVue = ({ className, ...rest }: Props = {}) => ({
  ...rest,
  ...(className === undefined ? {} : { class: className }),
});

/** The callbacks heard, React's by its name and Vue's by the same. */
export function useLog() {
  const log: string[] = [];
  const hear = (name: string) => (payload?: unknown) => {
    const detail =
      payload instanceof Event
        ? payload.defaultPrevented
          ? " (prevented)"
          : ""
        : payload === undefined
          ? ""
          : ` ${JSON.stringify(payload)}`;
    log.push(`${name}${detail}`);
  };
  return { log, hear };
}

/** React's listeners and Vue's, for the callbacks named, each heard as `name:Callback`. */
function listeners(
  hear: (name: string) => (payload?: unknown) => void,
  part: string,
  names: string[],
) {
  const react: Props = {};
  const vue: Props = {};
  for (const name of names) {
    react[`on${name[0].toUpperCase()}${name.slice(1)}`] = hear(
      `${part}:${name}`,
    );
    vue[`on${name[0].toUpperCase()}${name.slice(1)}`] = hear(`${part}:${name}`);
  }
  return { react, vue };
}

/** The trees, React's and Vue's, from one description. */
export function trees(
  parts: MenuParts,
  spec: MenuSpec,
  hear: (name: string) => (payload?: unknown) => void,
  /** The root's and the panels' callbacks to listen to. */
  heard: {
    root?: string[];
    content?: string[];
    sub?: string[];
    subOpen?: boolean;
    /** Vue's name for React's onOpenChange: a ContextMenu's is `openChange`. */
    rootModel?: boolean;
  } = {},
) {
  const rootListeners = listeners(hear, "root", heard.root ?? []);
  const contentListeners = listeners(hear, "content", heard.content ?? []);
  const subListeners = listeners(hear, "sub", heard.sub ?? []);
  const subOpen = heard.subOpen
    ? {
        react: { onOpenChange: hear("sub:openChange") },
        vue: { "onUpdate:open": hear("sub:openChange") },
      }
    : { react: {}, vue: {} };
  const P = parts;
  // What the checkbox and radio items hold, kept as their owner keeps it,
  // past the menu closing (its rows are drawn anew as it opens).
  const held = new Map<string, unknown>();

  const reactNode = (node: MenuNode, key: number): React.ReactElement => {
    if ("item" in node) {
      const onSelect = (event: Event) => {
        if (node.keepOpen) event.preventDefault();
        hear(`select:${node.item}`)(event);
      };
      const words = node.shortcut
        ? [node.item, e(P.Shortcut[0], { key: "s" }, node.shortcut)]
        : [node.item];
      return e(
        P.Item[0],
        {
          key,
          ...node.props,
          onSelect,
          ...(node.link ? { asChild: true } : {}),
        },
        node.link ? e("a", node.link, ...words) : words,
      );
    }
    if ("checkbox" in node) return e(ReactCheckbox, { key, node });
    if ("radio" in node) return e(ReactRadio, { key, node });
    if ("label" in node)
      return e(P.Label[0], { key, ...node.props }, node.label);
    if ("separator" in node) return e(P.Separator[0], { key, ...node.props });
    if ("group" in node)
      return e(
        P.Group[0],
        { key, ...node.props },
        node.group.map((child, i) => reactNode(child, i)),
      );
    return e(
      P.Sub[0],
      { key, ...node.subProps, ...subOpen.react },
      e(P.SubTrigger[0], node.props ?? {}, node.sub),
      e(
        P.SubContent[0],
        { ...node.contentProps, ...subListeners.react },
        node.items.map((child, i) => reactNode(child, i)),
      ),
    );
  };
  function ReactCheckbox({
    node,
  }: {
    node: Extract<MenuNode, { checkbox: string }>;
  }) {
    const [checked, setChecked] = React.useState(
      (held.get(node.checkbox) as boolean | "indeterminate" | undefined) ??
        node.checked ??
        false,
    );
    return e(
      P.CheckboxItem[0],
      {
        ...node.props,
        checked,
        onCheckedChange: (next: boolean) => {
          hear(`checked:${node.checkbox}`)(next);
          held.set(node.checkbox, next);
          setChecked(next);
        },
        onSelect: hear(`select:${node.checkbox}`),
      },
      node.checkbox,
    );
  }
  function ReactRadio({
    node,
  }: {
    node: Extract<MenuNode, { radio: unknown }>;
  }) {
    const [value, setValue] = React.useState(
      (held.get("radio") as string | undefined) ?? node.value,
    );
    return e(
      P.RadioGroup[0],
      {
        ...node.props,
        value,
        onValueChange: (next: string) => {
          hear("value")(next);
          held.set("radio", next);
          setValue(next);
        },
      },
      node.radio.map(([item, words]) =>
        e(
          P.RadioItem[0],
          { key: item, value: item, onSelect: hear(`select:${item}`) },
          words,
        ),
      ),
    );
  }

  const react = () =>
    e(
      React.Fragment,
      null,
      spec.page
        ? [
            e("button", { key: "host", type: "button", id: "host" }, "Host"),
            e(
              "div",
              { key: "live", role: "status", "aria-live": "polite" },
              e("button", { type: "button", id: "undo" }, "Undo"),
            ),
          ]
        : null,
      e(
        P.Root[0],
        { ...spec.root, ...rootListeners.react },
        e(
          P.Trigger[0],
          {
            ...spec.trigger,
            ...(spec.triggerChild || spec.triggerElement
              ? { asChild: true }
              : {}),
          },
          spec.triggerElement
            ? spec.triggerElement.react()
            : spec.triggerChild
              ? e(spec.triggerChild[0], null, spec.triggerWords ?? "Open")
              : (spec.triggerWords ?? "Open"),
        ),
        e(
          P.Content[0],
          { ...spec.content, ...contentListeners.react },
          spec.nodes.map((node, i) => reactNode(node, i)),
        ),
      ),
    );

  const vueNode = (node: MenuNode): VNode => {
    if ("item" in node) {
      const onSelect = (event: Event) => {
        if (node.keepOpen) event.preventDefault();
        hear(`select:${node.item}`)(event);
      };
      const words = () =>
        node.shortcut
          ? [node.item, h(P.Shortcut[1], null, () => node.shortcut)]
          : [node.item];
      return h(
        P.Item[1],
        {
          ...asVue(node.props),
          onSelect,
          ...(node.link ? { asChild: true } : {}),
        },
        () => (node.link ? h("a", asVue(node.link), words()) : words()),
      );
    }
    if ("checkbox" in node) return h(VueCheckbox, { node });
    if ("radio" in node) return h(VueRadio, { node });
    if ("label" in node)
      return h(P.Label[1], asVue(node.props), () => node.label);
    if ("separator" in node) return h(P.Separator[1], asVue(node.props));
    if ("group" in node)
      return h(P.Group[1], asVue(node.props), () => node.group.map(vueNode));
    return h(P.Sub[1], { ...node.subProps, ...subOpen.vue }, () => [
      h(P.SubTrigger[1], asVue(node.props), () => node.sub),
      h(
        P.SubContent[1],
        { ...asVue(node.contentProps), ...subListeners.vue },
        () => node.items.map(vueNode),
      ),
    ]);
  };
  const VueCheckbox = defineComponent({
    props: { node: { type: Object, required: true } },
    setup(props) {
      const node = props.node as Extract<MenuNode, { checkbox: string }>;
      const checked = ref(
        (held.get(node.checkbox) as boolean | "indeterminate" | undefined) ??
          node.checked ??
          false,
      );
      return () =>
        h(
          P.CheckboxItem[1],
          {
            ...asVue(node.props),
            checked: checked.value,
            "onUpdate:checked": (next: boolean) => {
              hear(`checked:${node.checkbox}`)(next);
              held.set(node.checkbox, next);
              checked.value = next;
            },
            onSelect: hear(`select:${node.checkbox}`),
          },
          () => node.checkbox,
        );
    },
  });
  const VueRadio = defineComponent({
    props: { node: { type: Object, required: true } },
    setup(props) {
      const node = props.node as Extract<MenuNode, { radio: unknown }>;
      const value = ref(
        (held.get("radio") as string | undefined) ?? node.value,
      );
      return () =>
        h(
          P.RadioGroup[1],
          {
            ...asVue(node.props),
            modelValue: value.value,
            "onUpdate:modelValue": (next: string) => {
              hear("value")(next);
              held.set("radio", next);
              value.value = next;
            },
          },
          () =>
            node.radio.map(([item, words]) =>
              h(
                P.RadioItem[1],
                { value: item, onSelect: hear(`select:${item}`) },
                () => words,
              ),
            ),
        );
    },
  });

  const vueRoot = { ...spec.root };
  const vue = () => [
    ...(spec.page
      ? [
          h("button", { type: "button", id: "host" }, "Host"),
          h("div", { role: "status", "aria-live": "polite" }, [
            h("button", { type: "button", id: "undo" }, "Undo"),
          ]),
        ]
      : []),
    h(
      P.Root[1],
      {
        ...vueRoot,
        ...(heard.rootModel === false
          ? rootListeners.vue
          : vueListenersOf(rootListeners.vue)),
      },
      () => [
        h(
          P.Trigger[1],
          {
            ...asVue(spec.trigger),
            ...(spec.triggerChild || spec.triggerElement
              ? { asChild: true }
              : {}),
          },
          () =>
            spec.triggerElement
              ? spec.triggerElement.vue()
              : spec.triggerChild
                ? h(
                    spec.triggerChild[1],
                    null,
                    () => spec.triggerWords ?? "Open",
                  )
                : (spec.triggerWords ?? "Open"),
        ),
        h(
          P.Content[1],
          { ...asVue(spec.content), ...contentListeners.vue },
          () => spec.nodes.map(vueNode),
        ),
      ],
    ),
  ];
  return { react, vue };
}

/** React's onOpenChange is Vue's `update:open` on a Menu, `openChange` on a ContextMenu. */
function vueListenersOf(listeners: Props) {
  const out: Props = {};
  for (const [name, handler] of Object.entries(listeners))
    out[name === "onOpenChange" ? "onUpdate:open" : name] = handler;
  return out;
}

/** The element focus is on, by its role and words. */
export function focusedOn() {
  const active = document.activeElement as HTMLElement | null;
  if (!active || active === document.body) return "the page";
  const role = active.getAttribute("role") ?? active.localName;
  if (role === "menu") return "menu";
  const label = active.getAttribute("aria-label");
  return `${role} ${label ?? active.textContent?.trim()}`;
}

/** What a step leaves, as each framework draws it. */
export function stateOf(log: string[]) {
  return {
    focus: focusedOn(),
    menus: document.querySelectorAll('[role="menu"]').length,
    inert: !!document.getElementById("host")?.closest("[inert]"),
    log: [...log],
  };
}

export interface Step {
  name: string;
  act: () => unknown;
  /** The document as drawn after the step, normalised, is compared too. */
  dom?: boolean;
}

/**
 * The same steps on React's menu, then on Vue's, each mounted alone in the
 * page: what each step leaves (and the document, where a step asks), and
 * the analytics each sent.
 */
export async function inBoth(
  draw: (hear: (name: string) => (payload?: unknown) => void) => {
    react: () => React.ReactElement;
    vue: () => VNode | VNode[];
  },
  steps: Step[],
) {
  const seen = {
    react: [] as unknown[],
    vue: [] as unknown[],
    events: { react: [] as unknown[], vue: [] as unknown[] },
  };
  for (const side of ["react", "vue"] as const) {
    const { log, hear } = useLog();
    const events: KozmosAnalyticsEvent[] = [];
    const tree = draw(hear);
    if (side === "react") await mountReact(tree.react, events);
    else await mountVue(tree.vue, events);
    for (const step of steps) {
      if (side === "react") await act(async () => void (await step.act()));
      else await step.act();
      await settle();
      await settle();
      seen[side].push({
        step: step.name,
        ...stateOf(log),
        ...(step.dom ? { dom: body() } : {}),
      });
    }
    seen.events[side] = read(events);
  }
  if (process.env.MENUS_DEBUG)
    (await import("node:fs")).appendFileSync(
      process.env.MENUS_DEBUG,
      steps
        .map((step, i) => {
          const r = JSON.stringify(seen.react[i]);
          const v = JSON.stringify(seen.vue[i]);
          return r === v ? `  ${r}` : `≠ R ${r}\n  V ${v}`;
        })
        .join("\n") + "\n\n",
    );
  return seen;
}
