import { render, screen, within } from "@testing-library/react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./Pagination";
import { describe, it, expect } from "vitest";

describe("Pagination", () => {
  it("renders correctly", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  // GAP-182: a product that is not in English passes its own words for
  // what Pagination draws and says; left out, they are today's English.
  it("draws and says a product's own words for Previous, Next and the landmark", () => {
    render(
      <Pagination aria-label="Seitennavigation">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              label="Zurück"
              aria-label="Zur vorherigen Seite"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              label="Weiter"
              aria-label="Zur nächsten Seite"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    const nav = screen.getByRole("navigation", { name: "Seitennavigation" });
    const previous = within(nav).getByRole("link", {
      name: "Zur vorherigen Seite",
    });
    const next = within(nav).getByRole("link", { name: "Zur nächsten Seite" });
    expect(previous).toHaveTextContent(/^Zurück$/);
    expect(next).toHaveTextContent(/^Weiter$/);
    expect(nav).not.toHaveTextContent(/Previous|Next/);
  });

  it("keeps the English words when a product passes none", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    const nav = screen.getByRole("navigation", { name: "pagination" });
    expect(
      within(nav).getByRole("link", { name: "Go to previous page" }),
    ).toHaveTextContent(/^Previous$/);
    expect(
      within(nav).getByRole("link", { name: "Go to next page" }),
    ).toHaveTextContent(/^Next$/);
  });
});
