import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import postcss, { type Rule } from "postcss";
import React from "react";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../components/Breadcrumb/Breadcrumb";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "../components/Menu/Menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../components/Pagination/Pagination";
import { Tree } from "../components/Tree/Tree";

// Right to left, an arrow that means back, forward or inside points to the
// start or the end edge, as SwiftUI's .backward and .forward symbols and
// Compose's AutoMirrored icons do. The mirror reads the nearest dir
// attribute through --kozmos-rtl, which jsdom cannot cascade, so this suite
// holds the structure: every such arrow carries the mirror class, the owned
// rule draws it from the variable, and no owned rule uses :dir(). What the
// engines draw is scripts/check-direction-rules.mjs's, in all three of them.
const STYLES = dirname(fileURLToPath(import.meta.url));
const OWNED = readFileSync(resolvePath(STYLES, "owned-components.css"), "utf8");
const OWNED_FILES = readdirSync(STYLES).filter((name) =>
  /^owned-.*\.css$/.test(name),
);

it("draws the mirror from the nearest dir attribute, never from :dir()", () => {
  const declarations: Record<string, string> = {};
  postcss.parse(OWNED).walkRules((rule: Rule) => {
    for (const selector of rule.selectors)
      rule.walkDecls((decl) => {
        declarations[`${selector} { ${decl.prop}`] = decl.value;
      });
  });
  expect(declarations['[dir="ltr" i] { --kozmos-rtl']).toBe("0");
  expect(declarations['[dir="rtl" i] { --kozmos-rtl']).toBe("1");
  expect(declarations[".kozmos-rtl-mirror { transform"]).toBe(
    "scaleX(calc(1 - 2 * var(--kozmos-rtl, 0)))",
  );
  // Chrome and Edge match :dir() only from 120 (the package declares 118),
  // and Vite 8's lightningcss rewrites it into :lang() guesses.
  expect(OWNED_FILES.length).toBeGreaterThan(1);
  for (const name of OWNED_FILES)
    postcss
      .parse(readFileSync(resolvePath(STYLES, name), "utf8"))
      .walkRules((rule: Rule) => {
        expect(rule.selector, `${name}: ${rule.selector}`).not.toMatch(
          /:dir\(/,
        );
      });
});

const expectMirrored = (arrow: Element | null, name: string) => {
  expect(arrow, `${name} draws an arrow`).toBeTruthy();
  expect(arrow!.classList.contains("kozmos-rtl-mirror"), name).toBe(true);
};
// A class that sits on the left or the right whatever the reading direction:
// padding, margin (auto and negative included), position, a side's corners
// or border, and alignment.
const PHYSICAL =
  /(^|\s)-?(pl|pr|ml|mr|left|right|rounded-[lr]|rounded-[tb][lr]|border-[lr])(-|\s|$)|(^|\s)text-(left|right)(\s|$)/;
const expectNoPhysicalSide = (element: Element, name: string) =>
  expect(element.getAttribute("class") ?? "", name).not.toMatch(PHYSICAL);

it("the physical-side pattern catches what it is for", () => {
  for (const name of [
    "ml-auto",
    "-ml-1",
    "mr-2",
    "pl-8",
    "left-0",
    "right-[2px]",
    "rounded-l-md",
    "rounded-tr-lg",
    "border-l",
    "border-r-2",
    "text-left",
  ])
    expect(name, name).toMatch(PHYSICAL);
  for (const name of [
    "ms-auto",
    "ps-8",
    "start-0",
    "rounded-lg",
    "border-light",
    "text-start",
    "html",
  ])
    expect(name, name).not.toMatch(PHYSICAL);
});

describe.each(["ltr", "rtl"] as const)("arrows and sides, %s", (dir) => {
  it("Pagination's Previous and Next", () => {
    render(
      <div dir={dir}>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>,
    );
    for (const name of ["Go to previous page", "Go to next page"]) {
      const link = screen.getByLabelText(name);
      expectMirrored(link.querySelector("svg"), name);
      expectNoPhysicalSide(link, name);
    }
  });

  it("the breadcrumb's separator", () => {
    const { container } = render(
      <div dir={dir}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Venues</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Harbour Point</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>,
    );
    expectMirrored(
      container.querySelector('li[role="presentation"] svg'),
      "separator",
    );
  });

  it("a submenu's trigger", async () => {
    const user = userEvent.setup();
    render(
      <div dir={dir}>
        <Menu dir={dir}>
          <MenuTrigger>Open</MenuTrigger>
          <MenuContent>
            <MenuLabel inset>Layers</MenuLabel>
            <MenuItem>
              Item
              <MenuShortcut>⌘I</MenuShortcut>
            </MenuItem>
            <MenuCheckboxItem checked>Shops</MenuCheckboxItem>
            <MenuRadioGroup value="all">
              <MenuRadioItem value="all">All levels</MenuRadioItem>
            </MenuRadioGroup>
            <MenuSub>
              <MenuSubTrigger>More</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem>Inner</MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuContent>
        </Menu>
      </div>,
    );
    await user.click(screen.getByText("Open"));
    const trigger = screen.getByText("More").closest('[role="menuitem"]')!;
    expectMirrored(trigger.querySelector("svg"), "submenu");
    const menu = screen.getAllByRole("menu")[0];
    for (const node of [menu, ...menu.querySelectorAll("*")])
      expectNoPhysicalSide(node, `menu ${node.textContent}`);
  });

  it("a closed tree item", () => {
    render(
      <div dir={dir}>
        <Tree
          ariaLabel="Map content"
          data={[
            {
              id: "level-1",
              name: "Level 1",
              actions: <button type="button">More</button>,
              children: [{ id: "cafe", name: "Café" }],
            },
          ]}
        />
      </div>,
    );
    const item = screen.getByRole("treeitem", { name: /Level 1/ });
    expectMirrored(item.querySelector("svg"), "tree");
    for (const node of [item, ...item.querySelectorAll("*")])
      expectNoPhysicalSide(node, "tree item");
    // Depth indents from the start edge, not the left one.
    const row = item.querySelector("[style]") ?? item;
    const style = row.getAttribute("style") ?? "";
    expect(style, "tree indent").not.toMatch(/padding-left/);
    expect(style, "tree indent").toMatch(/padding-inline-start/);
  });
});
