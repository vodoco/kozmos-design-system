import figma from "@figma/code-connect";
import { ChevronLeft, ChevronRight } from "@kozmos-ds/icons";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "./Pagination";

const paginationUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157";

const paginationProps = {
  size: figma.enum("Size", {
    Small: "sm",
    Default: "icon",
  }),
  previousText: figma.string("Previous Text"),
  nextText: figma.string("Next Text"),
};

figma.connect(Pagination, paginationUrl, {
  variant: { Content: "Basic" },
  props: {
    ...paginationProps,
    page1: figma.string("Page 1 Text"),
    page2: figma.string("Page 2 Text"),
    page3: figma.string("Page 3 Text"),
  },
  example: ({ nextText, page1, page2, page3, previousText, size }) => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink className="gap-1 pl-2.5" href="#" size="default">
            <ChevronLeft className="h-4 w-4" />
            <span>{previousText}</span>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size={size}>
            {page1}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive size={size}>
            {page2}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size={size}>
            {page3}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink className="gap-1 pr-2.5" href="#" size="default">
            <span>{nextText}</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});

figma.connect(Pagination, paginationUrl, {
  variant: { Content: "Ellipsis" },
  props: {
    ...paginationProps,
    page1: figma.string("Page 1 Text"),
    page2: figma.string("Page 2 Text"),
    page3: figma.string("Page 3 Text"),
    lastPage: figma.string("Last Page Text"),
  },
  example: ({
    lastPage,
    nextText,
    page1,
    page2,
    page3,
    previousText,
    size,
  }) => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink className="gap-1 pl-2.5" href="#" size="default">
            <ChevronLeft className="h-4 w-4" />
            <span>{previousText}</span>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size={size}>
            {page1}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive size={size}>
            {page2}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size={size}>
            {page3}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" size={size}>
            {lastPage}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink className="gap-1 pr-2.5" href="#" size="default">
            <span>{nextText}</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});

figma.connect(Pagination, paginationUrl, {
  variant: { Content: "Compact" },
  props: {
    ...paginationProps,
    compactText: figma.string("Compact Text"),
  },
  example: ({ compactText, nextText, previousText }) => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink className="gap-1 pl-2.5" href="#" size="default">
            <ChevronLeft className="h-4 w-4" />
            <span>{previousText}</span>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <span className="inline-flex h-11 items-center px-3 text-sm font-medium text-muted-foreground">
            {compactText}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink className="gap-1 pr-2.5" href="#" size="default">
            <span>{nextText}</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
});
