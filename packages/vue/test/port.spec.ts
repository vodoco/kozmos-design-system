import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { planPort, PortRefusal, writePort } from "../scripts/port";

/**
 * The porting kit's scaffold (`pnpm --filter @kozmos-ds/vue port <Name>`,
 * PORTING.md): it refuses a part that is already native and never
 * overwrites, and it names the API as the contract does. Each case writes
 * into a copy of the package's two edited files, never into the package.
 */
const PACKAGE = path.resolve(__dirname, "..");
let roots: string[] = [];
afterEach(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  roots = [];
});

/**
 * A scratch package holding copies of the files the scaffold edits:
 * src/index.ts, test/ports.ts and the repository's Vue story register.
 */
function scratch() {
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-port-"));
  roots.push(repository);
  const root = path.join(repository, "packages/vue");
  for (const file of [
    "src/index.ts",
    "test/ports.ts",
    "../../scripts/vue/coverage.mjs",
  ]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(PACKAGE, file), path.join(root, file));
  }
  return root;
}

const file = (plan: ReturnType<typeof planPort>, name: string) =>
  plan.files.find((f) => f.file === name)?.content ?? "";

// Each plan reads React's built types, which takes seconds on CI's runners:
// "refuses a name React does not export" timed out at Vitest's 5 s there
// (20 Nov), as the react-dom event table did before #527 gave it 30 s.
describe("port <Name>", { timeout: 30_000 }, () => {
  it("refuses a part that is already native", () => {
    expect(() => planPort("Button", scratch())).toThrow(PortRefusal);
    expect(() => planPort("Button", scratch())).toThrow(/already native/);
  });

  it("refuses a name React does not export", () => {
    expect(() => planPort("NotAKozmosPart", scratch())).toThrow(
      /no part NotAKozmosPart/,
    );
    expect(() => planPort("kbd", scratch())).toThrow(PortRefusal);
  });

  it("never overwrites a file", () => {
    const root = scratch();
    const existing = path.join(root, "src/components/Kbd/Kbd.ts");
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.writeFileSync(existing, "// the porter's own work\n");
    expect(() => planPort("Kbd", root)).toThrow(
      /exists: the scaffold never overwrites/,
    );
    expect(fs.readFileSync(existing, "utf8")).toBe(
      "// the porter's own work\n",
    );
  });

  it("writes the part, its stories, its export and its ports entry", async () => {
    const root = scratch();
    const plan = planPort("Kbd", root);
    await writePort(plan, root);
    for (const f of [
      "src/components/Kbd/Kbd.ts",
      "src/components/Kbd/Kbd.stories.ts",
    ])
      expect(fs.existsSync(path.join(root, f)), f).toBe(true);
    expect(fs.readFileSync(path.join(root, "src/index.ts"), "utf8")).toContain(
      'export { KozmosKbd } from "./components/Kbd/Kbd";',
    );
    const ports = fs.readFileSync(path.join(root, "test/ports.ts"), "utf8");
    expect(ports).toContain('vue: "KozmosKbd"');
    expect(ports).toContain('stories: "components/Kbd/Kbd.stories.tsx"');
    // React's args stories, by name and args.
    expect(file(plan, "src/components/Kbd/Kbd.stories.ts")).toMatch(
      /export const Default: Story = \{ args: \{\s*"children": "Esc"/,
    );
    // Each story is in the Vue browser suites' register, for the porter to
    // name its interaction.
    const register = fs.readFileSync(
      path.join(root, "../../scripts/vue/coverage.mjs"),
      "utf8",
    );
    expect(register).toContain('"vue-core-data-display-kbd--default": {');
    // Run twice, it refuses: the part is native now.
    expect(() => planPort("Kbd", root)).toThrow(/already native/);
  });

  it("names a v-model, an event and a slot as the contract names them", () => {
    const plan = planPort("Switch", scratch());
    const part = file(plan, "src/components/Switch/Switch.ts");
    // `checked` with `onCheckedChange` is a v-model: a prop and update:checked.
    expect(part).toMatch(/\n {4}checked: \{ type: Boolean/);
    expect(part).toContain('"update:checked": (_checked: boolean) => true');
    expect(part).not.toMatch(/\n {4}onCheckedChange:/);
    // Another callback is a camelCase event.
    expect(part).toContain('"resetMixed": () => true');
    // React's defaults, and a union of primitives.
    expect(part).toContain('onLabel: { type: String, default: "On" }');
    expect(part).toContain(
      "error: { type: [Boolean, String] as PropType<boolean | string>",
    );
    expect(part).toContain("default?: () => VNode[];");
    // The events are named in ports.ts, each with the spec that fires it,
    // and that spec fails until the porter writes it.
    expect(file(plan, "test/ports.ts")).toContain(
      '"update:checked": "parity/switch.parity.spec.ts"',
    );
    expect(file(plan, "test/parity/switch.parity.spec.ts")).toContain(
      'throw new Error("TODO(port): update:checked fires',
    );
  });

  it("names the stories React draws by hand, for the porter to draw", () => {
    const plan = planPort("Kbd", scratch());
    expect(plan.next.join("\n")).toContain("src/react-bridge/index.ts:");
    const tabs = planPort("Tabs", scratch());
    expect(file(tabs, "test/ports.ts")).toContain(
      'Default: "parity/tabs.parity.spec.ts"',
    );
    expect(file(tabs, "src/components/Tabs/Tabs.stories.ts")).toContain(
      "TODO(port): React's Default is not drawn from its args",
    );
  });
});

/**
 * A finished port leaves no `TODO(port)` the scaffold wrote: its drawing,
 * its types, its hand-written stories and its parity spec are all done.
 */
describe("no port is left half-done", () => {
  it("has no TODO(port) in src/, test/ or the Vue story register", () => {
    const left: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (
          /\.(ts|vue)$/.test(entry.name) &&
          full !== __filename &&
          fs.readFileSync(full, "utf8").includes("TODO(port)")
        )
          left.push(path.relative(PACKAGE, full));
      }
    };
    walk(path.join(PACKAGE, "src"));
    walk(path.join(PACKAGE, "test"));
    const register = path.join(PACKAGE, "../../scripts/vue/coverage.mjs");
    if (fs.readFileSync(register, "utf8").includes("TODO(port)"))
      left.push("../../scripts/vue/coverage.mjs");
    expect(left).toEqual([]);
  });
});
