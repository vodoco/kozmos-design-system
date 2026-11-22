import figma from "@figma/code-connect";
// Figma's search-md, by its own name: Code Connect imports what the example
// names, so an alias reached Dev Mode as an import of a "Search" icons lacks.
import { SearchMd } from "@kozmos-ds/icons";
import { EmptyState } from "./EmptyState";

const emptyStateUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316";

const emptyStateTextProps = {
  title: figma.string("Title Text"),
  description: figma.string("Description Text"),
  // GAP-165: what to try, under the description. Code Connect cannot put a
  // property's words inside an array (it shows `undefined` for each), so the
  // list is the set's default items, and List Item 1 to 3 Text are not read.
  list: figma.boolean("List", {
    true: [
      "Check the building and level",
      "Clear the type filters",
      "Search by another name or an ID",
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
      icon={<SearchMd className="h-8 w-8" />}
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
      icon={<SearchMd className="h-8 w-8" />}
      list={list}
      title={title}
      tone={tone}
    />
  ),
});
