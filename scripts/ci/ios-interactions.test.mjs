import assert from "node:assert/strict";
import test from "node:test";
import { verifyInteractionResults } from "../check-ios-interactions.mjs";

const result = (state) => ({
  testNodes: [
    {
      children: [
        { nodeType: "Test Case", name: "testAction()", result: state },
      ],
    },
  ],
});

test("iOS interaction evidence accepts a named passing test", () => {
  verifyInteractionResults(result("Passed"), ["testAction()"]);
});
test("iOS interaction evidence rejects empty, wrong, skipped and failed targets", () => {
  assert.throws(() => verifyInteractionResults(result("Passed"), []));
  assert.throws(() =>
    verifyInteractionResults({ testNodes: [] }, ["testAction()"]),
  );
  assert.throws(() =>
    verifyInteractionResults(result("Passed"), ["testMissing()"]),
  );
  for (const state of ["Skipped", "Failed", undefined]) {
    assert.throws(() =>
      verifyInteractionResults(result(state), ["testAction()"]),
    );
  }
});
test("iOS interaction evidence rejects duplicate results", () => {
  const duplicate = result("Passed");
  duplicate.testNodes.push(...result("Passed").testNodes);
  assert.throws(() => verifyInteractionResults(duplicate, ["testAction()"]));
});
