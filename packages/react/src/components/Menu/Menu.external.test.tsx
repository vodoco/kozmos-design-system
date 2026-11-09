import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./Menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ContextMenu/ContextMenu";

// Decision 152 (GAP-202): menu items take `external`, as Link's: the new-tab
// icon at the item's end, "opens in a new tab" read after its name, and
// around a caller's <a>, a new tab that isn't handed the page.
type Item = typeof MenuItem | typeof ContextMenuItem;

async function openMenu(items: React.ReactNode) {
  const user = userEvent.setup();
  render(
    <Menu>
      <MenuTrigger>Account</MenuTrigger>
      <MenuContent>{items}</MenuContent>
    </Menu>,
  );
  await user.click(screen.getByRole("button", { name: "Account" }));
  return screen.findByRole("menu");
}

async function openContextMenu(items: React.ReactNode) {
  const user = userEvent.setup();
  render(
    <ContextMenu>
      <ContextMenuTrigger>
        <div>Gate A12</div>
      </ContextMenuTrigger>
      <ContextMenuContent>{items}</ContextMenuContent>
    </ContextMenu>,
  );
  await user.pointer({
    keys: "[MouseRight]",
    target: screen.getByText("Gate A12"),
  });
  return screen.findByRole("menu");
}

describe.each([
  ["MenuItem", MenuItem as Item, openMenu],
  ["ContextMenuItem", ContextMenuItem as Item, openContextMenu],
] as const)("%s external (decision 152)", (_, Item, open) => {
  it("draws no icon and says nothing more unless external", async () => {
    await open(<Item>Settings</Item>);
    const item = screen.getByRole("menuitem", { name: "Settings" });
    expect(item.querySelector("svg")).toBeNull();
  });

  it("draws the new-tab icon at the item's end, hidden and mirrored right to left, and says it opens a new tab", async () => {
    await open(<Item external>Documentation</Item>);
    // jsdom's name drops the no-break space; the browsers keep it.
    const item = screen.getByRole("menuitem", {
      name: /^Documentation\s*opens in a new tab$/,
    });
    const icon = item.querySelector("svg")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("kozmos-rtl-mirror", "h-4", "w-4");
    const end = icon.parentElement!;
    expect(end).toHaveClass("ms-auto", "shrink-0");
    expect(end).toHaveAttribute("aria-hidden", "true");
    expect(end.parentElement).toBe(item);
  });

  it("says the product's own words, or nothing more with an empty label", async () => {
    await open(
      <>
        <Item external externalLabel="öffnet in einem neuen Tab">
          Dokumentation
        </Item>
        <Item external externalLabel="">
          Pointr
        </Item>
      </>,
    );
    expect(
      screen.getByRole("menuitem", {
        name: /^Dokumentation\s*öffnet in einem neuen Tab$/,
      }),
    ).toBeInTheDocument();
    const quiet = screen.getByRole("menuitem", { name: "Pointr" });
    expect(quiet.querySelector("svg")).not.toBeNull();
  });

  it("opens a caller's link in a new tab without handing it the page", async () => {
    await open(
      <Item external asChild>
        <a href="https://docs.example.com">Documentation</a>
      </Item>,
    );
    const item = screen.getByRole("menuitem", {
      name: /^Documentation\s*opens in a new tab$/,
    });
    expect(item.tagName).toBe("A");
    expect(item).toHaveAttribute("href", "https://docs.example.com");
    expect(item).toHaveAttribute("target", "_blank");
    expect(item).toHaveAttribute("rel", "noopener noreferrer");
    expect(item.querySelector("svg")).not.toBeNull();
  });

  it("keeps a caller's own target and rel", async () => {
    await open(
      <Item external asChild>
        <a href="https://docs.example.com" target="docs" rel="noopener">
          Documentation
        </a>
      </Item>,
    );
    const item = screen.getByRole("menuitem");
    expect(item).toHaveAttribute("target", "docs");
    expect(item).toHaveAttribute("rel", "noopener");
  });

  it.each(["_self", "_TOP", "_parent", ""])(
    "says nothing of a new tab when the caller's target is %j",
    async (target) => {
      await open(
        <Item external asChild>
          <a href="/docs" target={target}>
            Documentation
          </a>
        </Item>,
      );
      const item = screen.getByRole("menuitem", { name: "Documentation" });
      expect(item).not.toHaveAttribute("rel");
      expect(item.querySelector("svg")).toBeNull();
    },
  );

  it("leaves a link that isn't external as it is", async () => {
    await open(
      <Item asChild>
        <a href="/settings">Settings</a>
      </Item>,
    );
    const item = screen.getByRole("menuitem", { name: "Settings" });
    expect(item).not.toHaveAttribute("target");
    expect(item.querySelector("svg")).toBeNull();
  });
});
