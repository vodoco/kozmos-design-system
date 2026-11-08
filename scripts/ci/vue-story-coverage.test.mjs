import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  VUE_STORIES,
  VUE_SUITES,
  coverageProblems,
  storyIdProblems,
} from "../vue/coverage.mjs";

/**
 * The register the Vue browser suites hold the built Vue Storybook to
 * (scripts/vue/coverage.mjs): every suite exits before drawing anything
 * when the two disagree. These hold the guard itself, on registers made up
 * here, so a guard that stops failing fails here.
 */
const register = {
  "vue-a--one": { interaction: "button" },
  "vue-a--two": {
    interaction: null,
    exempt: { interactions: "draws a status: nothing to focus or press" },
  },
};

test("a register that matches the build has no problems", () => {
  assert.deepEqual(
    coverageProblems(["vue-a--one", "vue-a--two"], register),
    [],
  );
});

test("a new story the register does not name fails", () => {
  const problems = coverageProblems(
    ["vue-a--one", "vue-a--two", "vue-a--three"],
    register,
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^vue-a--three is a Vue story with no entry/);
});

test("an entry whose story is gone fails", () => {
  const problems = coverageProblems(["vue-a--one"], register);
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^vue-a--two is in scripts\/vue\/coverage\.mjs but not in the built/,
  );
});

test("a story with no interaction and no reason fails, and so does an empty reason", () => {
  assert.match(
    coverageProblems(["vue-b--one"], {
      "vue-b--one": { interaction: null },
    })[0],
    /has no interaction and no reason/,
  );
  assert.match(
    coverageProblems(["vue-b--one"], {
      "vue-b--one": { interaction: null, exempt: { interactions: "no" } },
    })[0],
    /exempt from interactions without a reason/,
  );
});

test("an exemption from a suite that does not exist fails", () => {
  assert.match(
    coverageProblems(["vue-b--one"], {
      "vue-b--one": {
        interaction: "button",
        exempt: { visual: "a reason long enough to count as one" },
      },
    })[0],
    /exempt from "visual", which is no suite/,
  );
});

test("the register names only suites that run, and interactions the suite has", () => {
  const suite = fs.readFileSync(
    new URL("../check-vue-interactions.mjs", import.meta.url),
    "utf8",
  );
  const table = suite.slice(suite.indexOf("const INTERACTIONS = {"));
  for (const [id, entry] of Object.entries(VUE_STORIES)) {
    for (const name of Object.keys(entry.exempt ?? {}))
      assert.ok(VUE_SUITES.includes(name), `${id}: ${name}`);
    if (entry.interaction)
      assert.ok(
        table.includes(`async "${entry.interaction}"(`) ||
          table.includes(`async ${entry.interaction}(`),
        `${id} names "${entry.interaction}", which check-vue-interactions.mjs does not have`,
      );
  }
  for (const name of VUE_SUITES)
    assert.ok(
      fs.existsSync(new URL(`../check-vue-${name}.mjs`, import.meta.url)),
      `no scripts/check-vue-${name}.mjs`,
    );
});

test("a Vue story whose id does not start vue- fails, built or registered", () => {
  const built = coverageProblems(["vue-a--one", "vue-a--two", "poicard--x"], {
    ...register,
    "poicard--x": { interaction: "button" },
  });
  assert.equal(built.length, 1);
  assert.match(
    built[0],
    /^poicard--x is a Vue story whose id does not start "vue-"/,
  );
  const registered = coverageProblems(["vue-a--one", "vue-a--two"], {
    ...register,
    "button--y": { interaction: "button" },
  });
  assert.ok(
    registered.some((problem) =>
      /^button--y is a Vue story whose id does not start/.test(problem),
    ),
  );
});

test("a React story whose id starts vue- fails, and the two sides apart pass", () => {
  assert.deepEqual(
    storyIdProblems({
      vue: ["vue-poicard--default"],
      react: ["components-poicard--default", "core-actions-button--default"],
    }),
    [],
  );
  const problems = storyIdProblems({
    vue: ["vue-poicard--default"],
    react: ["components-poicard--default", "vue-poicard--default"],
  });
  assert.equal(problems.length, 1);
  assert.match(
    problems[0],
    /^vue-poicard--default is a React story whose id starts "vue-"/,
  );
});

test("every id in the register starts vue-", () => {
  assert.deepEqual(storyIdProblems({ vue: Object.keys(VUE_STORIES) }), []);
});
