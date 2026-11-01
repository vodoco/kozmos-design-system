import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./Menu";

// GAP-193: a modal menu hides the page with aria-hidden's hideOthers as it
// opens, and left every control behind it focusable (axe aria-hidden-focus).
// It makes the page inert as Select does, kept in reach where hideOthers
// keeps it visible; a non-modal menu hides nothing and makes nothing inert.
function Page({ modal }: { modal?: boolean }) {
  return (
    <>
      <button type="button" id="host">
        Host
      </button>
      <div role="status" aria-live="polite">
        <button type="button" id="undo">
          Undo
        </button>
      </div>
      <Menu modal={modal}>
        <MenuTrigger>Open</MenuTrigger>
        <MenuContent>
          <MenuItem>Rename</MenuItem>
        </MenuContent>
      </Menu>
    </>
  );
}
const inert = (id: string) =>
  document.getElementById(id)!.closest("[inert]") !== null;

describe("Menu's page while it is open (GAP-193)", () => {
  it("makes the page inert while a modal menu is open, apart from live regions, and gives it back", async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(inert("host")).toBe(true);
    expect(inert("undo")).toBe(false);
    expect(
      screen.getByRole("menuitem", { name: "Rename" }).closest("[inert]"),
    ).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector("[inert]")).toBeNull());
  });

  it("makes nothing inert for a menu that is not modal", async () => {
    const user = userEvent.setup();
    render(<Page modal={false} />);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(document.querySelector("[inert]")).toBeNull();
  });
});
