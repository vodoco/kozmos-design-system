import figma from "@figma/code-connect";
import { SearchMd as Search } from "@kozmos-ds/icons";
import { EmptyState } from "./EmptyState";

const emptyStateUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316";

const emptyStateTextProps = {
  title: figma.string("Title Text"),
  description: figma.string("Description Text"),
};

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Basic" },
  props: emptyStateTextProps,
  example: ({ description, title }) => (
    <EmptyState description={description} title={title} />
  ),
});

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Icon" },
  props: emptyStateTextProps,
  example: ({ description, title }) => (
    <EmptyState
      description={description}
      icon={<Search className="h-8 w-8" />}
      title={title}
    />
  ),
});

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Action" },
  props: {
    ...emptyStateTextProps,
    action: figma.children(["Action"]),
  },
  example: ({ action, description, title }) => (
    <EmptyState
      action={action}
      description={description}
      icon={<Search className="h-8 w-8" />}
      title={title}
    />
  ),
});
