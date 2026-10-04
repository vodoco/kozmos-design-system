import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

test("scaffolding requires a catalogue family and registers a stable story ID", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "kozmos-catalogue-scaffold-"),
  );
  try {
    fs.mkdirSync(path.join(temporary, "packages/react/src"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(temporary, "scripts/storybook"), {
      recursive: true,
    });
    fs.writeFileSync(path.join(temporary, "packages/react/src/index.ts"), "");
    fs.copyFileSync(
      new URL("catalogue.json", import.meta.url),
      path.join(temporary, "scripts/storybook/catalogue.json"),
    );
    const run = (...args) =>
      spawnSync(
        process.execPath,
        [
          createRequire(import.meta.url).resolve("tsx/cli"),
          fileURLToPath(
            new URL("../skills/generate-component.ts", import.meta.url),
          ),
          ...args,
        ],
        { cwd: temporary, encoding: "utf8" },
      );
    assert.notEqual(
      run("ExampleControl").status,
      0,
      "a missing family must stop before generating files",
    );
    assert.equal(
      fs.existsSync(
        path.join(temporary, "packages/react/src/components/ExampleControl"),
      ),
      false,
    );
    const result = run("ExampleControl", "Core/Inputs");
    assert.equal(result.status, 0, result.stderr);
    const catalog = JSON.parse(
      fs.readFileSync(
        path.join(temporary, "scripts/storybook/catalogue.json"),
        "utf8",
      ),
    );
    assert.deepEqual(
      catalog.entries.find((entry) => entry.component === "ExampleControl"),
      {
        file: "packages/react/src/components/ExampleControl/ExampleControl.stories.tsx",
        id: "core-inputs-examplecontrol",
        title: "Core/Inputs/ExampleControl",
        component: "ExampleControl",
        exports: ["Default", "Outline"],
      },
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
