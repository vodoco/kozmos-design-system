import assert from "node:assert/strict";
import { test } from "node:test";
import { kozmosImports } from "./kozmos-imports";

test("lists value imports from @kozmos-ds/react, sorted", () => {
  const source = `
import { useState } from "react";
import { Tabs, Button as KozmosButton, type IconProps, Card } from "@kozmos-ds/react";
import type { ThemeTokens } from "@kozmos-ds/react";
import { Link } from "react-router";
`;
  assert.deepEqual(kozmosImports(source), ["Button", "Card", "Tabs"]);
});

test("reads imports that span several lines", () => {
  const source = `import {
  Alert,
  AlertDescription,
} from '@kozmos-ds/react';`;
  assert.deepEqual(kozmosImports(source), ["Alert", "AlertDescription"]);
});

test("ignores other packages", () => {
  assert.deepEqual(
    kozmosImports(`import { Tag } from "@kozmos-ds/icons";`),
    [],
  );
});
