import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  DotsHorizontal as MoreHorizontal,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { type ButtonProps, buttonVariants } from "../Button/Button";
import { useKozmosAnalytics } from "../../utils/analytics";

type PaginationProps = React.ComponentProps<"nav"> & {
  /**
   * The navigation landmark's accessible name. "pagination" by default; a
   * product that translates passes its own.
   */
  "aria-label"?: string;
};

const Pagination = ({
  className,
  "aria-label": ariaLabel = "pagination",
  ...props
}: PaginationProps) => (
  <nav
    role="navigation"
    aria-label={ariaLabel}
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "flex flex-row flex-wrap justify-center items-center gap-1",
      className,
    )}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  onClick,
  ...props
}: PaginationLinkProps) => {
  const { trackEvent } = useKozmosAnalytics();
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      onClick={(e) => {
        trackEvent("Pagination", "page_changed");
        onClick?.(e);
      }}
      {...props}
    />
  );
};
PaginationLink.displayName = "PaginationLink";

type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink> & {
  /**
   * The word drawn beside the chevron. "Previous" by default; a product that
   * translates passes its own, and an `aria-label` in the same language.
   */
  label?: string;
  /**
   * The link's accessible name, which a screen reader says in place of
   * `label`. "Go to previous page" by default; a product that translates
   * passes its own, one that contains `label`'s word.
   */
  "aria-label"?: string;
};

const PaginationPrevious = ({
  className,
  label = "Previous",
  "aria-label": ariaLabel = "Go to previous page",
  ...props
}: PaginationPreviousProps) => (
  <PaginationLink
    aria-label={ariaLabel}
    // As tall as the page links at either density (decision 82): 44 in
    // touch, 32 in compact; the end keeps the default size's 16.
    size="sm"
    className={cn("gap-1 ps-2.5 pe-4", className)}
    {...props}
  >
    <ChevronLeft className="kozmos-rtl-mirror h-4 w-4" />
    <span>{label}</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

type PaginationNextProps = React.ComponentProps<typeof PaginationLink> & {
  /**
   * The word drawn beside the chevron. "Next" by default; a product that
   * translates passes its own, and an `aria-label` in the same language.
   */
  label?: string;
  /**
   * The link's accessible name, which a screen reader says in place of
   * `label`. "Go to next page" by default; a product that translates passes
   * its own, one that contains `label`'s word.
   */
  "aria-label"?: string;
};

const PaginationNext = ({
  className,
  label = "Next",
  "aria-label": ariaLabel = "Go to next page",
  ...props
}: PaginationNextProps) => (
  <PaginationLink
    aria-label={ariaLabel}
    // As tall as the page links (decision 82); the start keeps 16.
    size="sm"
    className={cn("gap-1 ps-4 pe-2.5", className)}
    {...props}
  >
    <span>{label}</span>
    <ChevronRight className="kozmos-rtl-mirror h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
