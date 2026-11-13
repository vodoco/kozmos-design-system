import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AnalyticsProvider } from "../../utils/analytics";
import { Checkbox } from "./Checkbox";
import "@testing-library/jest-dom/vitest";

describe("Checkbox", () => {
  it("renders correctly", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders label with correct htmlFor association", () => {
    render(<Checkbox label="Accept terms" />);
    const checkbox = screen.getByRole("checkbox");
    const label = screen.getByText("Accept terms");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", checkbox.id);
  });

  it("renders error message with aria-describedby linkage", () => {
    render(<Checkbox error="You must accept" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-describedby");

    const errorMessage = screen.getByText("You must accept");
    expect(errorMessage).toBeInTheDocument();
    expect(checkbox.getAttribute("aria-describedby")).toBe(errorMessage.id);
  });

  it("renders boolean error without error text", () => {
    render(<Checkbox error={true} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
  });

  it("runs the caller's onCheckedChange and still reports the toggle", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const dispatched = vi.fn();
    render(
      <AnalyticsProvider batchDelayMs={0} onDispatch={dispatched}>
        <Checkbox label="Accept terms" onCheckedChange={onCheckedChange} />
      </AnalyticsProvider>,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await waitFor(() =>
      expect(dispatched.mock.calls.flat(2)).toContainEqual(
        expect.objectContaining({
          component: "Checkbox",
          eventName: "checkbox_toggled",
          properties: { checked: true },
        }),
      ),
    );
  });

  it("joins a caller's aria-describedby with its own error", () => {
    render(
      <>
        <p id="terms-hint">You can change this later</p>
        <Checkbox
          label="Accept terms"
          aria-describedby="terms-hint"
          error="You must accept"
        />
      </>,
    );
    const ids = screen
      .getByRole("checkbox")
      .getAttribute("aria-describedby")
      ?.split(" ");
    expect(ids).toEqual(["terms-hint", screen.getByText("You must accept").id]);
  });

  it("keeps its error state when a caller sets aria-invalid", () => {
    render(<Checkbox error="You must accept" aria-invalid={false} />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

describe("Checkbox description (GAP-162)", () => {
  it("is read as the checkbox's description, not its name", () => {
    render(
      <Checkbox
        label="Route updates"
        description="Tell me when a faster route opens"
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAccessibleName("Route updates");
    expect(checkbox).toHaveAccessibleDescription(
      "Tell me when a faster route opens",
    );
  });

  it("joins the caller's description, its own and the error, in that order", () => {
    render(
      <>
        <p id="terms-hint">Read the terms first</p>
        <Checkbox
          label="Accept terms"
          description="We email you a copy"
          aria-describedby="terms-hint"
          error="You must accept"
        />
      </>,
    );
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "Read the terms first We email you a copy You must accept",
    );
  });

  it("toggles when its label is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox
        label="Route updates"
        description="Tell me when a faster route opens"
      />,
    );
    // The label stays the checkbox's label with a description beside it.
    expect(
      screen.getByText("Tell me when a faster route opens"),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Route updates"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
