import { readFileSync } from "node:fs";
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
  MenuContent,
  MenuItem,
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
// Compose's AutoMirrored icons do. jsdom matches selectors, :dir() among
// them, but applies no stylesheet, so the transform an arrow is given is read
// by matching the shipped owned rules against it.
const OWNED = readFileSync(
  resolvePath(dirname(fileURLToPath(import.meta.url)), "owned-components.css"),
  "utf8",
);
function ownedTransform(element: Element): string | undefined {
  let transform: string | undefined;
  postcss.parse(OWNED).walkRules((rule: Rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name))
      return;
    const applies = rule.selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
    if (applies)
      rule.walkDecls("transform", (decl) => {
        transform = decl.value;
      });
  });
  return transform;
}
const expectMirroredOnlyRightToLeft = (
  arrow: Element | null,
  dir: "ltr" | "rtl",
  name: string,
) => {
  expect(arrow, `${name} draws an arrow`).toBeTruthy();
  expect(ownedTransform(arrow!), `${name}, ${dir}`).toBe(
    dir === "rtl" ? "scaleX(-1)" : undefined,
  );
};
// A class that sits on the left or the right whatever the reading direction.
const PHYSICAL =
  /(^|\s)(pl|pr|ml|mr|left|right)-[\d[]|(^|\s)text-(left|right)(\s|$)/;
const expectNoPhysicalSide = (element: Element, name: string) =>
  expect(element.getAttribute("class") ?? "", name).not.toMatch(PHYSICAL);

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
      expectMirroredOnlyRightToLeft(link.querySelector("svg"), dir, name);
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
    expectMirroredOnlyRightToLeft(
      container.querySelector('li[role="presentation"] svg'),
      dir,
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
            <MenuItem>Item</MenuItem>
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
    expectMirroredOnlyRightToLeft(trigger.querySelector("svg"), dir, "submenu");
    expectNoPhysicalSide(trigger.querySelector("svg")!, "submenu arrow");
    expectNoPhysicalSide(trigger, "submenu trigger");
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
              children: [{ id: "cafe", name: "Café" }],
            },
          ]}
        />
      </div>,
    );
    const item = screen.getByRole("treeitem", { name: /Level 1/ });
    expectMirroredOnlyRightToLeft(item.querySelector("svg"), dir, "tree");
    for (const node of [item, ...item.querySelectorAll("*")])
      expectNoPhysicalSide(node, "tree item");
  });
});
