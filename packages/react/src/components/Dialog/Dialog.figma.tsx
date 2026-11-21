import figma from "@figma/code-connect";
import { Button } from "../Button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

const dialogUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060";

figma.connect(DialogContent, dialogUrl, {
  variant: { Content: "Basic" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
  },
  example: ({ body, description, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p>{body}</p>
      </DialogContent>
    </Dialog>
  ),
});

figma.connect(DialogContent, dialogUrl, {
  variant: { Content: "Form" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
    fields: figma.children(["Name Input", "Username Input"]),
    actions: figma.children(["Secondary Action", "Primary Action"]),
  },
  example: ({ actions, body, description, fields, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p>{body}</p>
          {fields}
        </div>
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  ),
});

figma.connect(DialogContent, dialogUrl, {
  variant: { Content: "Footer" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
    actions: figma.children(["Secondary Action", "Primary Action"]),
  },
  example: ({ actions, body, description, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Review changes</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p>{body}</p>
        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  ),
});

// Decision 195, GAP-214: an illustration above the title, out to the
// dialog's edges and top corners, DialogHeader's media with mediaBleed.
figma.connect(DialogContent, dialogUrl, {
  variant: { Content: "Media" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
  },
  example: ({ body, description, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader media={<img alt="" src="illustration.svg" />} mediaBleed>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p>{body}</p>
      </DialogContent>
    </Dialog>
  ),
});

// Decision 202, GAP-259: the window less 16 on each side, for media shown
// large: DialogContent size="full".
figma.connect(DialogContent, dialogUrl, {
  variant: { Content: "Full" },
  props: {
    title: figma.string("Title Text"),
    description: figma.string("Description Text"),
    body: figma.string("Body Text"),
  },
  example: ({ body, description, title }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent size="full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <p>{body}</p>
      </DialogContent>
    </Dialog>
  ),
});
