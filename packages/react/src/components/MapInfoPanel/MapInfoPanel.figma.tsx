import figma from "@figma/code-connect";
import type React from "react";
import { MapInfoPanel, type MapInfoPanelProps } from "./MapInfoPanel";

const mapInfoPanelUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const faqs: NonNullable<MapInfoPanelProps["content"]["faqs"]>;
declare const credits: NonNullable<MapInfoPanelProps["content"]["credits"]>;
declare const links: NonNullable<MapInfoPanelProps["content"]["links"]>;
declare const versions: NonNullable<MapInfoPanelProps["content"]["versions"]>;
declare const brandMark: React.ReactElement;
declare const closeInfo: MapInfoPanelProps["onClose"];
declare const openFAQ: NonNullable<MapInfoPanelProps["onExpandedFAQChange"]>;

/**
 * Figma Code Connect: MapInfoPanel (GAP-206)
 *
 * Content is the content given: Default the whole panel, ExpandedFAQ the
 * same with
 * expandedFAQ set to the first question, Minimal a title alone.
 * Title Text is content.title, Introduction Text content.introduction, Show
 * Brand the brand.
 */
const props = {
  title: figma.string("Title Text"),
  introduction: figma.string("Introduction Text"),
  brand: figma.boolean("Show Brand", { true: brandMark, false: undefined }),
};

figma.connect(MapInfoPanel, mapInfoPanelUrl, {
  variant: { Content: "Default" },
  props,
  example: ({ title, introduction, brand }) => (
    <MapInfoPanel
      content={{ title, introduction, faqs, credits, links, versions }}
      brand={brand}
      onClose={() => closeInfo()}
    />
  ),
});

figma.connect(MapInfoPanel, mapInfoPanelUrl, {
  variant: { Content: "ExpandedFAQ" },
  props,
  example: ({ title, introduction, brand }) => (
    <MapInfoPanel
      content={{ title, introduction, faqs, credits, links, versions }}
      brand={brand}
      expandedFAQ={faqs[0]?.id}
      onExpandedFAQChange={(id) => openFAQ(id)}
      onClose={() => closeInfo()}
    />
  ),
});

figma.connect(MapInfoPanel, mapInfoPanelUrl, {
  variant: { Content: "Minimal" },
  props: {
    title: figma.string("Title Text"),
    brand: figma.boolean("Show Brand", { true: brandMark, false: undefined }),
  },
  example: ({ title, brand }) => (
    <MapInfoPanel
      content={{ title }}
      brand={brand}
      onClose={() => closeInfo()}
    />
  ),
});
