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
import {
  BOTTOM_SHEET_CLOSE_CLASS,
  BOTTOM_SHEET_CLOSE_LABEL,
  BOTTOM_SHEET_CONTENT_CLASS,
  BOTTOM_SHEET_GRIP_CLASS,
} from "../../recipes/bottom-sheet";
import {
  MODAL_CLOSE_ICON_CLASS,
  MODAL_CLOSE_NAME_CLASS,
} from "../../recipes/drawer";

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
   * A sheet without a title is unnamed to a screen reader, and the console says
   * so — but a `Heading` inside the sheet type-checks, renders and satisfies
   * nothing, so the sheet ships unlabelled. That is what happened while
   * rebuilding the SDK's POI detail card.
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
    className={cn(BOTTOM_SHEET_CONTENT_CLASS, className)}
    {...props}
  >
    <div aria-hidden="true" className={BOTTOM_SHEET_GRIP_CLASS} />
    {title ? (
      <BottomSheetTitle className="sr-only">{title}</BottomSheetTitle>
    ) : null}
    {children}
    {showClose ? (
      <BottomSheetClose className={BOTTOM_SHEET_CLOSE_CLASS}>
        <X aria-hidden="true" className={MODAL_CLOSE_ICON_CLASS} />
        <span className={MODAL_CLOSE_NAME_CLASS}>
          {BOTTOM_SHEET_CLOSE_LABEL}
        </span>
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
