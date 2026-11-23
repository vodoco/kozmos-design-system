import React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  ChevronRight,
  DotsHorizontal as MoreHorizontal,
} from "@kozmos-ds/icons";
import { cn } from "../../utils";
import {
  BREADCRUMB_ELLIPSIS_CLASS,
  BREADCRUMB_ELLIPSIS_ICON_CLASS,
  BREADCRUMB_ELLIPSIS_LABEL_CLASS,
  BREADCRUMB_ITEM_CLASS,
  BREADCRUMB_LINK_CLASS,
  BREADCRUMB_LIST_CLASS,
  BREADCRUMB_PAGE_CLASS,
  BREADCRUMB_SEPARATOR_CLASS,
  BREADCRUMB_SEPARATOR_ICON_CLASS,
} from "../../recipes/breadcrumb";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn(BREADCRUMB_LIST_CLASS, className)} {...props} />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn(BREADCRUMB_ITEM_CLASS, className)} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(BREADCRUMB_LINK_CLASS, className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn(BREADCRUMB_PAGE_CLASS, className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn(BREADCRUMB_SEPARATOR_CLASS, className)}
    {...props}
  >
    {children ?? <ChevronRight className={BREADCRUMB_SEPARATOR_ICON_CLASS} />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn(BREADCRUMB_ELLIPSIS_CLASS, className)}
    {...props}
  >
    <MoreHorizontal className={BREADCRUMB_ELLIPSIS_ICON_CLASS} />
    <span className={BREADCRUMB_ELLIPSIS_LABEL_CLASS}>More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
