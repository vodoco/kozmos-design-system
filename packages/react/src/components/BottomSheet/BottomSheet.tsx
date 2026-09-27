import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "../Drawer";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";

const BottomSheet = Drawer;
const BottomSheetTrigger = DrawerTrigger;
const BottomSheetClose = DrawerClose;

const BottomSheetTitle = DrawerTitle;

export interface BottomSheetContentProps extends React.ComponentPropsWithoutRef<
  typeof DrawerContent
> {
  /**
   * The sheet's accessible name.
   *
   * A dialog without a title is unnamed to a screen reader, and Radix says so
   * in the console — but a `Heading` inside the sheet type-checks, renders and
   * satisfies nothing, so the sheet ships unlabelled. That is what happened
   * while rebuilding the SDK's POI detail card.
   *
   * Pass `title` and the name is rendered for assistive technology and drawn
   * nowhere, which is what you want when your own markup already shows the
   * title. If the title should be visible, render a `BottomSheetTitle` in the
   * children instead and leave this unset.
   */
  title?: string;
}

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerContent>,
  BottomSheetContentProps
>(({ className, children, showClose = true, title, ...props }, ref) => (
  <DrawerContent
    ref={ref}
    side="bottom"
    showClose={false}
    className={cn(
      "inset-x-0 bottom-0 mt-24 flex h-auto max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] flex-col overscroll-contain rounded-t-container border-t bg-background !px-4 !pb-[max(1.5rem,env(safe-area-inset-bottom))] !pt-0",
      className,
    )}
    {...props}
  >
    <div
      aria-hidden="true"
      className="mx-auto my-2 h-[5px] w-12 shrink-0 rounded-pill bg-muted-foreground/40"
    />
    {title ? (
      <BottomSheetTitle className="sr-only">{title}</BottomSheetTitle>
    ) : null}
    {children}
    {showClose ? (
      <BottomSheetClose className="absolute right-0 top-2 inline-flex h-11 w-11 items-start justify-end rounded-control p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Close bottom sheet</span>
      </BottomSheetClose>
    ) : null}
  </DrawerContent>
));
BottomSheetContent.displayName = "BottomSheetContent";

const BottomSheetHeader = DrawerHeader;
const BottomSheetFooter = DrawerFooter;
const BottomSheetDescription = DrawerDescription;

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
};
