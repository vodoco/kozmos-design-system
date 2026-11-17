import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DescriptionList, DescriptionListItem } from "./DescriptionList";
import { Badge } from "../Badge";
import { IconButton } from "../IconButton";

// GAP-221, decision 199: a value under each label, with no field chrome,
// announced as label and value.
describe("DescriptionList (GAP-221)", () => {
  it("is a <dl> whose items are each a <dt> and its <dd>, a term and its definition", () => {
    render(
      <DescriptionList aria-label="Unit">
        <DescriptionListItem label="Name" value="Gate A12" />
        <DescriptionListItem label="Featured" value={true} />
        <DescriptionListItem label="Hidden from visitors" value={false} />
      </DescriptionList>,
    );
    const list = screen.getByLabelText("Unit");
    expect(list.tagName).toBe("DL");
    expect(list).toHaveAttribute("data-layout", "stack");
    const terms = within(list).getAllByRole("term");
    const definitions = within(list).getAllByRole("definition");
    expect(terms.map((term) => term.textContent)).toEqual([
      "Name",
      "Featured",
      "Hidden from visitors",
    ]);
    // A yes or a no is said in words.
    expect(definitions.map((value) => value.textContent)).toEqual([
      "Gate A12",
      "Yes",
      "No",
    ]);
    // Each term is followed by its own definition.
    expect(terms[0].nextElementSibling).toBe(definitions[0]);
  });

  it("takes tags, children as the value, words for yes and no, and an action after the value", () => {
    render(
      <DescriptionList layout="row" aria-label="Unit">
        <DescriptionListItem label="Personas">
          <Badge>Visitor</Badge>
          <Badge>Staff</Badge>
        </DescriptionListItem>
        <DescriptionListItem
          label="Accessible"
          value={true}
          yesLabel="Evet"
          noLabel="Hayır"
        />
        <DescriptionListItem
          label="FID"
          value="f-1209"
          action={<IconButton aria-label="Copy FID" size="sm" />}
        />
      </DescriptionList>,
    );
    expect(screen.getByLabelText("Unit")).toHaveAttribute("data-layout", "row");
    const definitions = screen.getAllByRole("definition");
    expect(within(definitions[0]).getByText("Staff")).toBeInTheDocument();
    expect(definitions[1]).toHaveTextContent("Evet");
    const copy = within(definitions[2]).getByRole("button", {
      name: "Copy FID",
    });
    expect(copy.closest(".kozmos-description-list-action")).not.toBeNull();
    expect(definitions[2]).toHaveTextContent("f-1209");
  });

  it("draws no field: no input, no textbox, nothing disabled", () => {
    render(
      <DescriptionList>
        <DescriptionListItem label="Name" value="Gate A12" />
      </DescriptionList>,
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector("[disabled],[aria-disabled]")).toBeNull();
  });
});
