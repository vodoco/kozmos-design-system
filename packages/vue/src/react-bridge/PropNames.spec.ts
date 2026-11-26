// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { h, type Component } from "vue";
import React from "react";
import * as KozmosReact from "@kozmos-ds/react";
import * as Bridge from "./index";
import { createVueWrapper, withPropNames } from "./react-adapter";
import path from "node:path";
import {
  REPOSITORY,
  computeTakes,
  hyphenate,
} from "../../scripts/bridge-takes.mjs";
import {
  $,
  bridgedParts,
  eventually,
  mount,
  settle,
  unmount,
} from "../../test/react-bridge-harness";

// GAP-238: a prop written in kebab-case, as a Vue template is usually
// written, reaches React under its React name, as Vue gives a declared
// prop: `<KozmosOTPInput default-value="1234" helper-text="Sent by SMS" />`
// is React's `defaultValue` and `helperText`. Before, the bridge passed each
// attribute on as it was named, and React wrote both onto the DOM as
// attributes: the cells stayed empty and the helper text was not drawn.
// OTPInput is a native Vue part now (wave V2): test/parity/otpinput.parity.spec.ts
// holds its kebab-case props.
// `aria-*` and `data-*`, whose React names are kebab-case, pass as they are.
// React's types name no other prop in kebab-case (scripts/bridge-takes.mjs
// fails on one), so the bridge needs no list of names.

const table = computeTakes();

/**
 * What React is given for `part` when the wrapper `component` is drawn with
 * `props`: the part is drawn as a stand-in that draws nothing and keeps its
 * props, so every part takes any value.
 */
async function givenTo(
  component: Component,
  part: unknown,
  props: Record<string, unknown>,
) {
  const seen: Record<string, unknown>[] = [];
  const Stand = () => null;
  const original = React.createElement;
  // The part as the wrapper draws it: the bridge's own TooltipProvider
  // around a root is given no props.
  const spy = vi.spyOn(React, "createElement").mockImplementation(((
    type: unknown,
    given: unknown,
    ...rest: unknown[]
  ) => {
    const drawn = type === part && given !== null;
    if (drawn) seen.push(given as Record<string, unknown>);
    return (original as (...args: unknown[]) => unknown)(
      drawn ? Stand : type,
      given,
      ...rest,
    );
  }) as typeof React.createElement);
  try {
    mount(() => h(component, props));
    await eventually(() => expect(seen.length).toBeGreaterThan(0));
    await settle();
    return seen.at(-1)!;
  } finally {
    spy.mockRestore();
    unmount();
  }
}

/** A prop's spelling Vue would give for its kebab-case attribute. */
const kebab = (prop: string) => hyphenate(prop);

/** Each part's props in camelCase that are not listeners or booleans. */
function camelProps(react: string) {
  const booleans =
    table.booleans.parts[react] ?? table.booleans.adapters[react] ?? null;
  const flagged = new Set([
    ...(booleans?.flags ?? []),
    ...(booleans?.unions ?? []),
    ...(booleans?.texts ?? []),
  ]);
  return (table.props[react] as string[]).filter(
    (prop) =>
      /[A-Z]/.test(prop) && !/^on[A-Z]/.test(prop) && !flagged.has(prop),
  );
}

describe("every prop React's types name reaches React by its name, in either case", () => {
  // Each part by the name index.ts imports it under, as part-takes.ts keys
  // it, or its adapter's: two React exports may be one component.
  const parts = bridgedParts().map((part) => {
    const drawn = part.bridge?.part as { name?: string } | undefined;
    const key =
      Object.keys(table.props).find(
        (name) => (KozmosReact as Record<string, unknown>)[name] === drawn,
      ) ?? (drawn?.name && table.props[drawn.name] ? drawn.name : null);
    return { ...part, key };
  });

  it("reads every bridged part's props from React's types", () => {
    expect(parts.filter((part) => !part.key).map((part) => part.name)).toEqual(
      [],
    );
  });

  // A prop named for an ARIA attribute in camelCase (Tree's `ariaLabel`)
  // shares its kebab-case with the attribute, which passes as it is: the
  // wrapper declares it, so Vue gives `aria-label` to it by its name.
  it("declares each camelCase aria or data prop on its wrapper", () => {
    const undeclared = parts.flatMap(({ name, component, key }) =>
      (table.props[key!] as string[])
        .filter((prop) => /^(aria|data)[A-Z]/.test(prop))
        .filter(
          (prop) =>
            !Object.keys(
              (component as { props?: object }).props ?? {},
            ).includes(prop),
        )
        .map((prop) => `${name}.${prop}`),
    );
    expect(undeclared).toEqual([]);
  });

  it.each(parts.map((part) => [part.name, part] as const))(
    "%s",
    async (_name, { component, bridge, key }) => {
      const props = camelProps(key!);
      if (!props.length) return;
      const value = (prop: string) => `${prop} value`;
      const camel = await givenTo(
        component,
        bridge!.part,
        Object.fromEntries(props.map((prop) => [prop, value(prop)])),
      );
      const kebabbed = await givenTo(
        component,
        bridge!.part,
        Object.fromEntries(props.map((prop) => [kebab(prop), value(prop)])),
      );
      expect(kebabbed).toEqual(camel);
      for (const prop of props) {
        expect.soft(kebabbed[prop], prop).toBe(value(prop));
        expect.soft(kebabbed, prop).not.toHaveProperty(kebab(prop));
      }
    },
  );
});

describe("the names the bridge keeps", () => {
  it("passes aria-* and data-* as they are", async () => {
    const given = await givenTo(
      Bridge.KozmosToggleButton,
      KozmosReact.ToggleButton,
      {
        "aria-label": "Two new",
        "data-test-id": "counter",
        "aria-describedby": "note",
      },
    );
    expect(given).toMatchObject({
      "aria-label": "Two new",
      "data-test-id": "counter",
      "aria-describedby": "note",
    });
    expect(given).not.toHaveProperty("ariaLabel");
    expect(given).not.toHaveProperty("dataTestId");
  });

  it("keeps React's own spelling when both are given", () => {
    expect(
      withPropNames({ "helper-text": "kebab", helperText: "camel" }),
    ).toEqual({ helperText: "camel" });
    expect(withPropNames({ "helper-text": "kebab" })).toEqual({
      helperText: "kebab",
    });
  });

  it("does the same for a part of the caller's, which has no description", async () => {
    const Part = (props: { helperText?: string }) =>
      React.createElement("output", null, props.helperText);
    mount(() => h(createVueWrapper(Part), { "helper-text": "Sent by SMS" }));
    await eventually(() =>
      expect($("output")?.textContent).toBe("Sent by SMS"),
    );
  });
});

describe("the generator holds React's names to the rule", () => {
  const FIXTURE = path.join(
    REPOSITORY,
    "packages/react/dist/prop-names.fixture.d.ts",
  );
  const fixture = `import type * as React from "react";
export declare const Kebab: (props: { "helper-text"?: string; "aria-label"?: string; "data-id"?: string }) => React.ReactElement | null;
export declare const Camel: (props: { helperText?: string; "aria-label"?: string; "data-id"?: string }) => React.ReactElement | null;
`;
  const fromFixture = (parts: string[]) =>
    computeTakes(REPOSITORY, {
      declarations: FIXTURE,
      virtual: new Map([[FIXTURE, fixture]]),
      parts,
      adapters: {},
    });

  it("fails on a prop named in kebab-case that is not aria-* or data-*, naming it", () => {
    expect(() => fromFixture(["Kebab"])).toThrow(
      /^Kebab: its props helper-text are named in kebab-case/,
    );
  }, 60_000);

  it("takes camelCase, aria-* and data-*", () => {
    expect(fromFixture(["Camel"]).props.Camel.sort()).toEqual([
      "aria-label",
      "data-id",
      "helperText",
    ]);
  }, 60_000);
});
