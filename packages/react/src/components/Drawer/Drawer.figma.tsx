import figma from "@figma/code-connect";
import { Button } from "../Button/Button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./Drawer";

const drawerUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=232-2042";

figma.connect(DrawerContent, drawerUrl, {
  props: {
    // GAP-198: Fixed is the default, so its snippet says nothing.
    placement: figma.enum("Placement", { Fixed: undefined, Inline: "inline" }),
    side: figma.enum("Side", {
      Top: "top",
      Right: "right",
      Bottom: "bottom",
      Left: "left",
    }),
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
    content: figma.slot("Content Slot") ?? figma.children(["Content Slot"]),
    actions: figma.children(["Secondary Action", "Primary Action"]),
  },
  example: ({
    actions,
    body,
    content,
    description,
    placement,
    side,
    title,
  }) => (
    <Drawer placement={placement}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent side={side}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-1 flex-col gap-3">
          <p>{body}</p>
          {content}
        </div>
        <DrawerFooter>{actions}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
});
