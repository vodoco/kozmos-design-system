import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle } from "./Card";

/**
 * CardTitle's heading level (GAP-205). It was always an `h3`, so a card under
 * a page whose title is an `h1` skipped a level (axe's heading-order). It
 * takes `as`, `h2` to `h6`, as Heading does, and stays `h3` without it.
 */
describe("CardTitle", () => {
  it("is an h3 unless told otherwise, drawn as before", () => {
    render(<CardTitle>Client details</CardTitle>);
    const title = screen.getByRole("heading", {
      level: 3,
      name: "Client details",
    });
    expect(title.tagName).toBe("H3");
    expect(title).toHaveClass(
      "text-2xl",
      "font-semibold",
      "leading-none",
      "tracking-tight",
    );
  });

  it.each([2, 3, 4, 5, 6] as const)(
    "is an h%s with as, and looks the same at every level",
    (level) => {
      render(
        <CardTitle as={`h${level}`} className="text-base">
          Client details
        </CardTitle>,
      );
      const title = screen.getByRole("heading", {
        level,
        name: "Client details",
      });
      expect(title.tagName).toBe(`H${level}`);
      // The caller's class still wins over the title's own size.
      expect(title).toHaveClass("text-base", "font-semibold");
      expect(title).not.toHaveClass("text-2xl");
    },
  );

  it("follows the page's outline inside a card", () => {
    render(
      <main>
        <h1>Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Client details</CardTitle>
          </CardHeader>
        </Card>
      </main>,
    );
    expect(
      screen.getAllByRole("heading").map((heading) => heading.tagName),
    ).toEqual(["H1", "H2"]);
  });

  it("forwards its ref to the heading, typed either way it was", () => {
    // The ref was typed HTMLParagraphElement before `as`; it is
    // HTMLHeadingElement now. Both kinds of ref still compile (pnpm
    // typecheck reads this file) and land on the heading element.
    const heading = React.createRef<HTMLHeadingElement>();
    const paragraph = React.createRef<HTMLParagraphElement>();
    let called: HTMLParagraphElement | null = null;
    const callback = (element: HTMLParagraphElement | null) => {
      called = element;
    };
    render(
      <>
        <CardTitle as="h2" ref={heading}>
          One
        </CardTitle>
        <CardTitle ref={paragraph}>Two</CardTitle>
        <CardTitle as="h4" ref={callback}>
          Three
        </CardTitle>
      </>,
    );
    expect(heading.current?.tagName).toBe("H2");
    expect(paragraph.current?.tagName).toBe("H3");
    expect((called as HTMLElement | null)?.tagName).toBe("H4");
  });

  it("takes no h1: that is the page's title, not a card's", () => {
    // @ts-expect-error -- `as` is h2 to h6.
    const title = <CardTitle as="h1">Settings</CardTitle>;
    expect(title).toBeTruthy();
  });
});
