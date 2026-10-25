import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { check, scan, stripSwift, SYMMETRIC } from "../check-ios-shape-direction.mjs";

const shapes = (source) => scan(source, "X.swift").shapes.map((s) => [s.name, s.declares]);
const drawn = (source) => scan(source, "X.swift").drawn.map((d) => `${d.what}@${d.owner}`);

test("a type that conforms to Shape is found, and whether it declares", () => {
  assert.deepEqual(shapes(`struct A: Shape { func path(in rect: CGRect) -> Path { Path() } }`), [["A", false]]);
  assert.deepEqual(
    shapes(`private struct B: InsettableShape {
      func path(in rect: CGRect) -> Path { Path() }
      @available(iOS 17.0, macOS 14.0, *)
      var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
    }`),
    [["B", true]],
  );
  assert.deepEqual(shapes(`struct C: SwiftUI.Shape, Sendable { }`), [["C", false]]);
});

test("a generic constraint on Shape is not a shape", () => {
  assert.deepEqual(shapes(`struct Style<HoverShape: Shape>: ButtonStyle { let shape: HoverShape }`), []);
  assert.deepEqual(shapes(`func surface<Outline: Shape>(_ outline: Outline) -> some View { outline }`), []);
});

test("a declaration in an extension counts", () => {
  const source = `struct D: Shape { func path(in rect: CGRect) -> Path { Path() } }
extension D { var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed } }`;
  assert.deepEqual(scan(source, "X.swift").extensionsDeclaring, ["D"]);
});

test("a Path drawn in a view is found; one built for a shape or in a Canvas is not", () => {
  assert.deepEqual(
    drawn(`struct Track: View {
      var body: some View {
        GeometryReader { g in Path { p in p.move(to: .zero) }.stroke(Color.red) }
      }
    }`),
    ["Path@Track"],
  );
  assert.deepEqual(drawn(`struct E: Shape { func path(in rect: CGRect) -> Path { var p = Path(); return p } }`), []);
  assert.deepEqual(drawn(`struct V: View { var body: some View { Canvas { c, s in c.fill(Path(CGRect.zero), with: .color(.red)) } } }`), []);
  assert.deepEqual(drawn(`enum Paths { static func path(_ name: String) -> Path? { var p = Path(); return p } }`), []);
  assert.deepEqual(
    scan(`struct G: Shape { static func outline() -> G? { var p = Path(); return nil } }`, "X.swift", ["G"]).drawn,
    [],
  );
});

test("a closure typed as returning a Path is drawn, not built", () => {
  // KozmosProgressTrack's line before #348: a Path made in a closure and stroked.
  assert.deepEqual(
    drawn(`struct T: View { func drawing() -> some View {
      let line: (Double, Double) -> Path = { a, b in Path { p in p.move(to: .zero) } }
      return line(0, 1).stroke(Color.red)
    } }`),
    ["Path@T"],
  );
});

test("an UnevenRoundedRectangle drawn as a shape is found", () => {
  // KozmosSplitButton's halves before #356.
  assert.deepEqual(
    drawn(`struct S: View {
      private var half: UnevenRoundedRectangle { UnevenRoundedRectangle(topLeadingRadius: 16) }
      var body: some View { Text("a").clipShape(.rect(topLeadingRadius: 16)) }
    }`),
    ["UnevenRoundedRectangle@S", "UnevenRoundedRectangle@S"],
  );
  assert.deepEqual(drawn(`struct R: Shape { func path(in rect: CGRect) -> Path { UnevenRoundedRectangle(topLeadingRadius: 4).path(in: rect) } }`), []);
});

test("comments, strings and signatures are not read as drawing", () => {
  assert.deepEqual(drawn(`// Path { } and UnevenRoundedRectangle(\n/* Path() */ let s = "Path()"`), []);
  assert.deepEqual(drawn(`struct E: Shape { func path(in rect: CGRect) -> Path { .init() } }`), []);
  assert.equal(stripSwift(`a // b\nc`), `a     \nc`);
});

test("the repository's own shapes all say how they read right to left", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const { problems } = check(root);
  assert.deepEqual(problems, []);
});

test("a listed shape that is gone, or that now declares, is a problem", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-shapes-"));
  const dir = path.join(root, "packages/ios/Sources/Components/POIDetailPanel");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "POIDetailPanel.swift"),
    `struct KozmosPanelShape: InsettableShape { var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed } }`,
  );
  const { problems } = check(root);
  assert.ok(problems.some((p) => p.includes("KozmosPanelShape") && p.includes("take it off the list")));
  const others = Object.keys(SYMMETRIC).filter((key) => !key.includes("KozmosPanelShape"));
  for (const key of others) assert.ok(problems.some((p) => p.startsWith(key) && p.includes("no longer")), key);
});
