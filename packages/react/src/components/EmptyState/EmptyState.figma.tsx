import figma from "@figma/code-connect";
import { SearchMd as Search } from "@kozmos-ds/icons";
import { EmptyState } from "./EmptyState";

const emptyStateUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316";

const emptyStateTextProps = {
  title: figma.string("Title Text"),
  description: figma.string("Description Text"),
  // GAP-165: what to try, under the description.
  list: figma.boolean("List", {
    true: [
      figma.string("List Item 1 Text"),
      figma.string("List Item 2 Text"),
      figma.string("List Item 3 Text"),
    ],
    false: undefined,
  }),
};

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Basic" },
  props: emptyStateTextProps,
  example: ({ description, list, title }) => (
    <EmptyState description={description} list={list} title={title} />
  ),
});

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Icon" },
  props: emptyStateTextProps,
  example: ({ description, list, title }) => (
    <EmptyState
      description={description}
      icon={<Search className="h-8 w-8" />}
      list={list}
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
  example: ({ action, description, list, title }) => (
    <EmptyState
      action={action}
      description={description}
      icon={<Search className="h-8 w-8" />}
      list={list}
      title={title}
    />
  ),
});
