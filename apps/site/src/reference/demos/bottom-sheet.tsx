import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
  Button,
  Stack,
  Text,
} from "@kozmos-ds/react";
import type { DemoModule } from "../types";

function FromTheBottom() {
  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="outline">Open the sheet</Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Bookshop</BottomSheetTitle>
          <BottomSheetDescription>
            First floor · 3 min on foot
          </BottomSheetDescription>
        </BottomSheetHeader>
        <Text size="sm">
          New and second-hand books, with a reading corner by the window. Open
          today until 20:00.
        </Text>
        <BottomSheetFooter>
          <Stack direction="row" gap={2}>
            <Button>Directions</Button>
            <BottomSheetClose asChild>
              <Button variant="outline">Close</Button>
            </BottomSheetClose>
          </Stack>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function NamedWithoutAVisibleTitle() {
  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="outline">Open a quiet sheet</Button>
      </BottomSheetTrigger>
      <BottomSheetContent title="Route options">
        <Text size="sm">
          The sheet’s name reaches assistive technology through the title prop,
          without drawing a heading.
        </Text>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "From the bottom",
    description:
      "A dialog that slides up: header, content, footer, and a close button by default.",
    Component: FromTheBottom,
  },
  {
    title: "Named without a visible title",
    description:
      "title gives the sheet its accessible name when no BottomSheetTitle is drawn.",
    Component: NamedWithoutAVisibleTitle,
  },
];
