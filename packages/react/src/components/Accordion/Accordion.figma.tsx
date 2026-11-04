import figma from "@figma/code-connect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion";

const accordionUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977";

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Default", State: "Closed" },
  props: {
    trigger: figma.string("Trigger Text"),
  },
  example: ({ trigger }) => (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>{trigger}</AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ),
});

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Default", State: "Open" },
  props: {
    trigger: figma.string("Trigger Text"),
    content: figma.string("Content Text"),
  },
  example: ({ content, trigger }) => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>{trigger}</AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
});

const boxedProps = {
  trigger: figma.string("Trigger Text"),
  label: figma.boolean("Show Label", {
    true: figma.string("Label Text"),
    false: undefined,
  }),
  icon: figma.boolean("Show Icon", {
    true: figma.instance("Icon"),
    false: undefined,
  }),
};

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Boxed", State: "Closed" },
  props: boxedProps,
  example: ({ icon, label, trigger }) => (
    <Accordion type="single" variant="boxed" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={icon} label={label}>
          {trigger}
        </AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ),
});

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Boxed", State: "Open" },
  props: {
    trigger: figma.string("Trigger Text"),
    content: figma.string("Content Text"),
    label: figma.boolean("Show Label", {
      true: figma.string("Label Text"),
      false: undefined,
    }),
    icon: figma.boolean("Show Icon", {
      true: figma.instance("Icon"),
      false: undefined,
    }),
  },
  example: ({ content, icon, label, trigger }) => (
    <Accordion type="single" variant="boxed" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger icon={icon} label={label}>
          {trigger}
        </AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
});

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Boxed", State: "Disabled" },
  props: boxedProps,
  example: ({ icon, label, trigger }) => (
    <Accordion type="single" variant="boxed" collapsible>
      <AccordionItem value="item-1" disabled>
        <AccordionTrigger icon={icon} label={label}>
          {trigger}
        </AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ),
});

figma.connect(Accordion, accordionUrl, {
  variant: { Variant: "Boxed", State: "Loading" },
  props: boxedProps,
  example: ({ icon, label, trigger }) => (
    <Accordion type="single" variant="boxed" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger icon={icon} label={label} loading>
          {trigger}
        </AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ),
});
