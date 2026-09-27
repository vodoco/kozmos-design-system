import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Stack,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function Pages() {
  const [page, setPage] = useState(2);
  const total = 8;
  const go = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(Math.max(next, 1), total));
  };
  const shown = [1, 2, 3];
  return (
    <Stack gap={2} align="start">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#main" onClick={go(page - 1)} />
          </PaginationItem>
          {shown.map((number) => (
            <PaginationItem key={number}>
              <PaginationLink
                href="#main"
                isActive={page === number}
                onClick={go(number)}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#main"
              isActive={page === total}
              onClick={go(total)}
            >
              {total}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#main" onClick={go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <Text size="sm" color="muted" aria-live="polite">
        Page {page} of {total}
      </Text>
    </Stack>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "Eight pages",
    description:
      "Links for the pages, an ellipsis for the gap, previous and next. isActive marks the current page.",
    Component: Pages,
  },
];
