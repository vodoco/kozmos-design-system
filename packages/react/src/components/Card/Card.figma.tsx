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
  },
  example: ({ body, description, title }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
    actions: figma.children(["Secondary Action", "Primary Action"]),
  },
  example: ({ actions, body, description, title }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
      <CardFooter className="justify-end gap-2">{actions}</CardFooter>
    </Card>
  ),
});
