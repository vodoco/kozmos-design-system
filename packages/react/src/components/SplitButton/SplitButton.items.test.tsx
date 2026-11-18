import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Download01 } from "@kozmos-ds/icons";
import { MenuItem, MenuLabel } from "../Menu";
import { SplitButton, type SplitButtonProps } from "./index";

// GAP-168 (decision 209): SplitButton's menu takes Menu's items: an icon, a
// separator, a disabled item and custom content, and its props are exported
// from the package.
const items: SplitButtonProps["menuItems"] = [
  {
    label: "Publish to staging",
    icon: <Download01 data-testid="staging-icon" />,
    onClick: vi.fn(),
  },
  { type: "separator" },
  { label: "Publish to production", disabled: true, onClick: vi.fn() },
];

async function open(props: Partial<SplitButtonProps> = {}) {
  const user = userEvent.setup();
  render(
    <SplitButton menuItems={items} {...props}>
      Publish
    </SplitButton>,
  );
  await user.click(screen.getByRole("button", { name: "More options" }));
  return user;
}

describe("SplitButton's menu items (GAP-168)", () => {
  it("draws an item's icon before its words, hidden from its name", async () => {
    await open();
    const item = screen.getByRole("menuitem", { name: "Publish to staging" });
    const icon = screen.getByTestId("staging-icon");
    expect(item).toContainElement(icon);
    expect(item.firstElementChild).toContainElement(icon);
    expect(item.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("draws a separator between items", async () => {
    await open();
    const separator = screen.getByRole("separator");
    const menu = screen.getByRole("menu");
    const children = Array.from(menu.children);
    expect(children.indexOf(separator)).toBe(1);
  });

  it("a disabled item is said disabled and runs nothing", async () => {
    const user = await open();
    const item = screen.getByRole("menuitem", {
      name: "Publish to production",
    });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("data-disabled");
    await user.click(item).catch(() => undefined);
    const disabled = items![2] as { onClick: () => void };
    expect(disabled.onClick).not.toHaveBeenCalled();
  });

  it("runs an enabled item's onClick", async () => {
    const user = await open();
    await user.click(
      screen.getByRole("menuitem", { name: "Publish to staging" }),
    );
    const staging = items![0] as { onClick: () => void };
    expect(staging.onClick).toHaveBeenCalledTimes(1);
  });

  it("draws custom content, Menu's own parts, after the items", async () => {
    const onSelect = vi.fn();
    const user = await open({
      menuContent: (
        <>
          <MenuLabel>Schedule</MenuLabel>
          <MenuItem onSelect={onSelect}>Publish tonight</MenuItem>
        </>
      ),
    });
    const menu = screen.getByRole("menu");
    const words = Array.from(menu.children).map((node) => node.textContent);
    expect(words).toEqual([
      "Publish to staging",
      "",
      "Publish to production",
      "Schedule",
      "Publish tonight",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "Publish tonight" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("still takes the plain { label, onClick } items", async () => {
    const onClick = vi.fn();
    const user = await open({ menuItems: [{ label: "Save draft", onClick }] });
    await user.click(screen.getByRole("menuitem", { name: "Save draft" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
