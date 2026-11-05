import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

/**
 * Vue's tests (packages/vue) live in test/ as well as src/, compare React's
 * built dist, and read React's stories and recipes from source (Vue 3 Phase
 * 0). Turborepo must count all of them as the task's inputs, or a change to
 * one replays an old result from the cache, and must build React first.
 * Read from Turborepo's own plan, not from the config's spelling.
 */
const plan = JSON.parse(
  execFileSync(
    "pnpm",
    ["exec", "turbo", "run", "test", "--filter=@kozmos-ds/vue", "--dry=json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ),
);
const task = (id) => plan.tasks.find((candidate) => candidate.taskId === id);

test("Vue's tests count their own folder, and React's stories and recipes, as inputs", () => {
  const inputs = Object.keys(task("@kozmos-ds/vue#test").inputs);
  for (const file of [
    "test/parity/button.parity.spec.ts",
    "test/react-free.spec.ts",
    "src/components/Button/Button.spec.ts",
    "../react/src/components/Button/Button.stories.tsx",
    "../react/src/recipes/button.ts",
  ])
    assert.ok(
      inputs.includes(file),
      `${file} is not an input of @kozmos-ds/vue#test`,
    );
});

test("Vue's build counts the shared recipes it builds in as inputs", () => {
  const inputs = Object.keys(task("@kozmos-ds/vue#build").inputs);
  for (const file of [
    "../react/src/recipes/button.ts",
    "../react/src/utils.ts",
  ])
    assert.ok(
      inputs.includes(file),
      `${file} is not an input of @kozmos-ds/vue#build`,
    );
});

test("React is built before Vue's tests, which compare its dist", () => {
  assert.ok(
    task("@kozmos-ds/vue#test").dependencies.includes("@kozmos-ds/react#build"),
    "@kozmos-ds/vue#test does not depend on @kozmos-ds/react#build",
  );
});
