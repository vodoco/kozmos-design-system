import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../Checkbox";
import { Label } from "../Label";
import { PersonaMark, PersonaMarkGroup } from "./PersonaMark";

// GAP-106 (decision 132): the feature panel's persona visibility list marks
// each persona with its colour, and a tree row shows the personas it is
// visible to as a group of marks.
describe("PersonaMark (GAP-106)", () => {
  it("is decoration beside the persona's name: a Checkbox labelled with it reads the name once", () => {
    render(
      <>
        <Checkbox id="persona-customer" />
        <Label htmlFor="persona-customer">
          <PersonaMark color="#FF9800" data-testid="mark" /> Customer
        </Label>
      </>,
    );
    // The label is the name alone: the mark adds nothing to it.
    expect(screen.getByRole("checkbox", { name: "Customer" })).toBeTruthy();
    const mark = screen.getByTestId("mark");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("stands alone as an image named by the persona", () => {
    render(<PersonaMark color="#2196F3" name="Visitor" />);
    const mark = screen.getByRole("img", { name: "Visitor" });
    expect(mark).not.toHaveAttribute("aria-hidden");
  });

  it("draws a diamond in the persona's colour, as given", () => {
    const { container } = render(<PersonaMark color="#FF9800" />);
    const mark = container.firstElementChild as HTMLElement;
    expect(mark).toHaveClass("kozmos-persona-mark");
    expect(mark.style.getPropertyValue("--kozmos-persona-color")).toBe(
      "#FF9800",
    );
    const svg = mark.querySelector("svg")!;
    expect(svg).toHaveClass("kozmos-persona-mark-shape");
    expect(svg).toHaveAttribute("viewBox", "0 0 12 12");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelector("path")).toHaveAttribute(
      "d",
      "M6 0 12 6 6 12 0 6Z",
    );
  });

  it("passes the caller's props, style and ref on", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <PersonaMark
        ref={ref}
        className="extra"
        color="rgb(1 2 3)"
        data-testid="mark"
        style={{ marginInlineEnd: 4 }}
        title="Customer"
      />,
    );
    const mark = screen.getByTestId("mark");
    expect(ref.current).toBe(mark);
    expect(mark).toHaveClass("kozmos-persona-mark", "extra");
    expect(mark).toHaveAttribute("title", "Customer");
    expect(mark.style.marginInlineEnd).toBe("4px");
    expect(mark.style.getPropertyValue("--kozmos-persona-color")).toBe(
      "rgb(1 2 3)",
    );
  });
});

describe("PersonaMarkGroup (GAP-106)", () => {
  const personas = [
    { name: "Customer", color: "#FF9800" },
    { name: "Visitor", color: "#2196F3" },
    { name: "Staff", color: "#4CAF50" },
  ];

  it("is one image, named by its label and every persona's name", () => {
    render(<PersonaMarkGroup personas={personas} data-testid="group" />);
    const group = screen.getByRole("img", {
      name: "Assigned personas: Customer, Visitor, Staff",
    });
    expect(group).toBe(screen.getByTestId("group"));
    expect(group).toHaveClass("kozmos-persona-marks");
    // Its marks are drawn, in order, each hidden on its own.
    const marks = [...group.querySelectorAll(".kozmos-persona-mark")];
    expect(
      marks.map((mark) =>
        (mark as HTMLElement).style.getPropertyValue("--kozmos-persona-color"),
      ),
    ).toEqual(["#FF9800", "#2196F3", "#4CAF50"]);
    for (const mark of marks)
      expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("reads the product's own words before the names", () => {
    render(
      <PersonaMarkGroup label="Zugewiesene Personas" personas={personas} />,
    );
    expect(
      screen.getByRole("img", {
        name: "Zugewiesene Personas: Customer, Visitor, Staff",
      }),
    ).toBeTruthy();
  });

  it("draws nothing with no persona", () => {
    const { container } = render(<PersonaMarkGroup personas={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PersonaMark's owned rule", () => {
  const css = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../../../styles/src/styles/owned-components.css",
    ),
    "utf8",
  );
  const rules = (selector: string) =>
    [
      ...css.matchAll(
        new RegExp(`${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`, "g"),
      ),
    ].map((match) => match[1].replace(/\s+/g, ""));

  it("draws the shape 12 by 12 in the persona's colour, its group 2 apart", () => {
    const [shape] = rules(".kozmos-persona-mark .kozmos-persona-mark-shape");
    expect(shape).toContain("width:12px;");
    expect(shape).toContain("height:12px;");
    expect(shape).toContain("fill:var(--kozmos-persona-color,currentColor);");
    expect(rules(".kozmos-persona-marks")).toContain(
      "gap:calc(var(--primitives-layout-spacing-25)*1px);",
    );
  });

  it("keeps the shape in forced colours, in CanvasText", () => {
    const forced = css.slice(
      css.indexOf("@media (forced-colors: active)", css.indexOf("PersonaMark")),
    );
    const [shape] = [
      ...forced.matchAll(
        /\.kozmos-persona-mark \.kozmos-persona-mark-shape\s*\{([^}]*)\}/g,
      ),
    ].map((match) => match[1].replace(/\s+/g, ""));
    expect(shape).toBe("forced-color-adjust:none;fill:CanvasText;");
  });
});
