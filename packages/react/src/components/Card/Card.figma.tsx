import figma from "@figma/code-connect";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card";

const cardUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536";

figma.connect(Card, cardUrl, {
  variant: { Content: "Basic" },
  props: {
    body: figma.string("Body Text"),
  },
  example: ({ body }) => (
    <Card>
      <CardContent>{body}</CardContent>
    </Card>
  ),
});

figma.connect(Card, cardUrl, {
  variant: { Content: "Header" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    tone: figma.enum("HeaderTone", { Default: undefined, Subtle: "subtle" }),
    titleSize: figma.enum("TitleSize", {
      Large: "lg",
      Medium: "md",
      Small: "sm",
    }),
    // GAP-169: what acts on the card, at the header's end.
    headerActions: figma.boolean("Header Actions", {
      true: figma.slot("Header Actions Slot"),
      false: undefined,
    }),
  },
  example: ({ body, description, headerActions, title, titleSize, tone }) => (
    <Card>
      <CardHeader actions={headerActions} tone={tone}>
        <CardTitle size={titleSize}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  ),
});

figma.connect(Card, cardUrl, {
  variant: { Content: "Full" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    tone: figma.enum("HeaderTone", { Default: undefined, Subtle: "subtle" }),
    titleSize: figma.enum("TitleSize", {
      Large: "lg",
      Medium: "md",
      Small: "sm",
    }),
    actions: figma.children(["Secondary Action", "Primary Action"]),
    // GAP-169: what acts on the card, at the header's end.
    headerActions: figma.boolean("Header Actions", {
      true: figma.slot("Header Actions Slot"),
      false: undefined,
    }),
  },
  example: ({
    actions,
    body,
    description,
    headerActions,
    title,
    titleSize,
    tone,
  }) => (
    <Card>
      <CardHeader actions={headerActions} tone={tone}>
        <CardTitle size={titleSize}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
      <CardFooter className="justify-end gap-2">{actions}</CardFooter>
    </Card>
  ),
});
