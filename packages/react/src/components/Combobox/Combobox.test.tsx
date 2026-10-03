import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";

const options = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];

describe("Combobox", () => {
  it("keeps an initial search query until the selected identity changes", () => {
    const { rerender } = render(
      <Combobox options={options} value="" defaultInputValue="draft" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("draft");
    rerender(
      <Combobox options={options} value="overview" defaultInputValue="draft" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Overview");
    rerender(<Combobox options={options} value="" defaultInputValue="draft" />);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
  it("localizes disclosure and clearing controls", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        options={options}
        inputValue="Overview"
        clearLabel="Effacer"
        openLabel="Ouvrir"
        closeLabel="Fermer"
      />,
    );
    expect(screen.getByRole("button", { name: "Effacer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });
  it("selects an option with keyboard navigation", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Combobox
        label="View"
        options={options}
        onValueChange={handleValueChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "View" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("Details");
    expect(handleValueChange).toHaveBeenCalledWith("details", options[1]);
  });

  it("filters options from typed input", async () => {
    const user = userEvent.setup();

    render(<Combobox options={options} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "act");

    expect(
      screen.getByRole("option", { name: "Activity" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Details" }),
    ).not.toBeInTheDocument();
  });

  it("links error text through aria-describedby", () => {
    render(<Combobox options={options} error="Choose a view" />);

    const input = screen.getByRole("combobox");
    const error = screen.getByText("Choose a view");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("uses stable active option ids independent of option values", async () => {
    const user = userEvent.setup();

    render(
      <Combobox
        id="view-combobox"
        options={[{ value: "activity stream", label: "Activity stream" }]}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "view-combobox-option-0",
    );
    expect(screen.getByRole("option")).toHaveAttribute(
      "id",
      "view-combobox-option-0",
    );
  });
});
