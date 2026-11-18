/**
 * Controls for `scripts/check-component-colour-references.mjs` (GAP-281).
 *
 * Each shape of a copy is put in front of the finder, with its reference form
 * beside it, and each step of the choosing rule with a value several
 * primitives share: a change that blinds the check, or that chooses another
 * primitive than the role implies, fails here.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  choosePrimitive,
  findCopiedColours,
  findExceptions,
  normalizeColour,
  preferredRamps,
} from "./component-colour-references.mjs";

const colour = (value) => ({ $type: "color", $value: value });

// Two themes shaped like the real sources: white is background/0 and
// foreground/1000 in light, background/1000 and foreground/0 in dark; the
// alert ramp is the accent ramp.
const tree = (theme, components) => ({
  Primitives: {
    Colors: {
      background:
        theme === "light"
          ? {
              0: colour("#FFFFFF"),
              700: colour("#464A53"),
              1000: colour("#000000"),
            }
          : {
              0: colour("#000000"),
              700: colour("#b9b5ac"),
              1000: colour("#ffffff"),
            },
      foreground:
        theme === "light"
          ? {
              0: colour("#000000"),
              300: colour("#464A53"),
              1000: colour("#FFFFFF"),
            }
          : {
              0: colour("#ffffff"),
              300: colour("#b9b5ac"),
              1000: colour("#000000"),
            },
      accent: { 100: colour("#FEEED0") },
      emotional: { alert: { 100: colour("#FEEED0") } },
      theme: {
        500: colour("#135BEC"),
        variant: { 1: { 500: colour("#135BEC") } },
      },
    },
  },
  Components: components,
});

test("a colour is one colour whatever its case and length", () => {
  assert.equal(normalizeColour("#fff"), "#FFFFFFFF");
  assert.equal(normalizeColour("#FFFFFF"), "#FFFFFFFF");
  assert.equal(normalizeColour("#ffffffff"), "#FFFFFFFF");
  assert.equal(normalizeColour("#17191C80"), "#17191C80");
  assert.equal(normalizeColour("{Primitives.Colors.theme.500}"), null);
  assert.equal(normalizeColour("rgba(0,0,0,0.5)"), null);
});

test("a role's ramps: its tone's first, then background for a fill and foreground for content", () => {
  assert.deepEqual(
    preferredRamps("Components.Primary Buttons.success.button.background.idle"),
    ["Primitives.Colors.emotional.success.", "Primitives.Colors.background."],
  );
  assert.deepEqual(
    preferredRamps(
      "Components.Primary Buttons.neutral.button.foreground.content.idle",
    ),
    ["Primitives.Colors.foreground."],
  );
  assert.deepEqual(
    preferredRamps(
      "Components.Primary Buttons.informative.foreground.dimmed.content.idle",
    ),
    ["Primitives.Colors.emotional.info.", "Primitives.Colors.foreground."],
  );
});

test("white content refers to the foreground ramp, a white fill to the background ramp", () => {
  const candidates = [
    "Primitives.Colors.background.0",
    "Primitives.Colors.foreground.1000",
  ];
  assert.equal(
    choosePrimitive(
      "Components.Primary Buttons.success.button.foreground.content.idle",
      candidates,
    ).choice,
    "Primitives.Colors.foreground.1000",
  );
  assert.equal(
    choosePrimitive(
      "Components.Secondary Buttons.neutral.button.background.idle",
      candidates,
    ).choice,
    "Primitives.Colors.background.0",
  );
});

test("an alert colour refers to the alert ramp, never the accent ramp it equals", () => {
  assert.equal(
    choosePrimitive(
      "Components.Primary Buttons.alert.foreground.dimmed.content.idle",
      ["Primitives.Colors.accent.100", "Primitives.Colors.emotional.alert.100"],
    ).choice,
    "Primitives.Colors.emotional.alert.100",
  );
});

test("the themed tone takes the theme ramp's own step, not a variant's", () => {
  assert.equal(
    choosePrimitive(
      "Components.Primary Buttons.themed.button.background.idle",
      ["Primitives.Colors.theme.variant.1.500", "Primitives.Colors.theme.500"],
    ).choice,
    "Primitives.Colors.theme.500",
  );
});

test("of a role's primitives, the one the other theme shares wins", () => {
  // A ramp may hold one value twice; the step the dark theme also is wins.
  const result = choosePrimitive(
    "Components.Primary Buttons.neutral.button.background.disabled",
    ["Primitives.Colors.background.800", "Primitives.Colors.background.850"],
    ["Primitives.Colors.background.850"],
  );
  assert.equal(result.choice, "Primitives.Colors.background.850");
});

test("with no primitive in its role's ramps it takes another, and says so", () => {
  const result = choosePrimitive(
    "Components.Tertiary Buttons.neutral.button.foreground.content.pressed",
    ["Primitives.Colors.background.300"],
  );
  assert.equal(result.choice, "Primitives.Colors.background.300");
  assert.equal(result.outsideRole, true);
});

test("two primitives the rule cannot split leave no choice", () => {
  const result = choosePrimitive("Components.Badge.surface", [
    "Primitives.Colors.background.0",
    "Primitives.Colors.foreground.1000",
  ]);
  assert.equal(result.choice, null);
  assert.equal(result.remaining.length, 2);
});

test("the finder reports a copied colour in each theme with its reference", () => {
  const components = (white, disabled) => ({
    "Primary Buttons": {
      success: {
        button: {
          foreground: {
            content: { idle: colour(white), disabled: colour(disabled) },
          },
        },
      },
    },
  });
  const copies = findCopiedColours({
    light: tree("light", components("#FFFFFF", "#464A53")),
    dark: tree("dark", components("#000000", "#B9B5AC")),
  });
  const byKey = Object.fromEntries(
    copies.map((copy) => [`${copy.theme} ${copy.path}`, copy.choice]),
  );
  const path = "Components.Primary Buttons.success.button.foreground.content";
  assert.deepEqual(byKey, {
    [`light ${path}.idle`]: "Primitives.Colors.foreground.1000",
    [`light ${path}.disabled`]: "Primitives.Colors.foreground.300",
    [`dark ${path}.idle`]: "Primitives.Colors.foreground.1000",
    [`dark ${path}.disabled`]: "Primitives.Colors.foreground.300",
  });
});

test("a reference, and a colour no primitive is, are not copies", () => {
  const components = {
    "Primary Buttons": {
      themed: {
        button: {
          background: {
            idle: colour("{Primitives.Colors.theme.500}"),
            disabled: colour("#5C6069"),
          },
        },
      },
    },
  };
  assert.deepEqual(
    findCopiedColours({
      light: tree("light", components),
      dark: tree("dark", components),
    }),
    [],
  );
});

test("a primitive's own value, or a semantic one, is not a component copy", () => {
  const light = tree("light", {});
  light.Semantics = { Surface: { 0: colour("#FFFFFF") } };
  assert.deepEqual(findCopiedColours({ light, dark: tree("dark", {}) }), []);
});

// Decision 223: white in both themes is the constant white.
const withWhite = (theme, components) => {
  const t = tree(theme, components);
  t.Primitives.Colors.white = colour("#FFFFFF");
  return t;
};
const themedWords = (light, dark) => ({
  light: {
    "Primary Buttons": {
      themed: { button: { foreground: { content: { idle: colour(light) } } } },
    },
  },
  dark: {
    "Primary Buttons": {
      themed: { button: { foreground: { content: { idle: colour(dark) } } } },
    },
  },
});

test("a colour white in both themes refers to the constant white, copy or ramp reference alike", () => {
  const path =
    "Components.Primary Buttons.themed.button.foreground.content.idle";
  for (const [light, dark] of [
    ["#FFFFFF", "#ffffff"],
    ["{Primitives.Colors.foreground.1000}", "{Primitives.Colors.foreground.0}"],
  ]) {
    const words = themedWords(light, dark);
    const copies = findCopiedColours({
      light: withWhite("light", words.light),
      dark: withWhite("dark", words.dark),
    });
    assert.deepEqual(
      copies.map((copy) => `${copy.theme} ${copy.path} ${copy.choice}`),
      [
        `light ${path} Primitives.Colors.white`,
        `dark ${path} Primitives.Colors.white`,
      ],
      `${light} / ${dark}`,
    );
  }
  const done = themedWords(
    "{Primitives.Colors.white}",
    "{Primitives.Colors.white}",
  );
  assert.deepEqual(
    findCopiedColours({
      light: withWhite("light", done.light),
      dark: withWhite("dark", done.dark),
    }),
    [],
  );
});

test("white in one theme only keeps its role's ramp, not the constant white", () => {
  const copies = findCopiedColours({
    light: withWhite("light", {
      "Primary Buttons": {
        success: {
          button: { foreground: { content: { idle: colour("#FFFFFF") } } },
        },
      },
    }),
    dark: withWhite("dark", {
      "Primary Buttons": {
        success: {
          button: { foreground: { content: { idle: colour("#000000") } } },
        },
      },
    }),
  });
  assert.deepEqual(
    copies.map((copy) => `${copy.theme} ${copy.choice}`),
    [
      "light Primitives.Colors.foreground.1000",
      "dark Primitives.Colors.foreground.1000",
    ],
  );
});

test("exceptions: a colour no primitive is, and a reference outside its role's ramps", () => {
  const components = (fill, words) => ({
    "Tertiary Buttons": {
      neutral: {
        button: {
          background: { idle: colour(fill) },
          foreground: { content: { pressed: colour(words) } },
        },
      },
    },
  });
  assert.deepEqual(
    findExceptions({
      light: withWhite(
        "light",
        components("#5C6069", "{Primitives.Colors.background.700}"),
      ),
      dark: withWhite(
        "dark",
        components(
          "{Primitives.Colors.background.0}",
          "{Primitives.Colors.white}",
        ),
      ),
    }).map((found) => `${found.theme} ${found.kind} ${found.path}`),
    [
      "light no-primitive Components.Tertiary Buttons.neutral.button.background.idle",
      "light outside-role Components.Tertiary Buttons.neutral.button.foreground.content.pressed",
    ],
  );
});
