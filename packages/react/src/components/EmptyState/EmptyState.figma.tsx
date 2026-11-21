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
  // GAP-213, decision 194: an emotion's card. None is no card.
  tone: figma.enum("Tone", {
    None: undefined,
    Themed: "themed",
    Neutral: "neutral",
    Success: "success",
    Danger: "danger",
    Informative: "informative",
    Alert: "alert",
  }),
};

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Basic" },
  props: emptyStateTextProps,
  example: ({ description, list, title, tone }) => (
    <EmptyState
      description={description}
      list={list}
      title={title}
      tone={tone}
    />
  ),
});

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Icon" },
  props: emptyStateTextProps,
  example: ({ description, list, title, tone }) => (
    <EmptyState
      description={description}
      icon={<Search className="h-8 w-8" />}
      list={list}
      title={title}
      tone={tone}
    />
  ),
});

figma.connect(EmptyState, emptyStateUrl, {
  variant: { Content: "Action" },
  props: {
    ...emptyStateTextProps,
    action: figma.children(["Action"]),
  },
  example: ({ action, description, list, title, tone }) => (
    <EmptyState
      action={action}
      description={description}
      icon={<Search className="h-8 w-8" />}
      list={list}
      title={title}
      tone={tone}
    />
  ),
});
