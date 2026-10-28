import figma from "@figma/code-connect";
import { Sidebar } from "./Sidebar";

const sidebarUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6807";

const sidebarProps = {
  footer: figma.slot("Footer Slot"),
  header: figma.slot("Header Slot"),
  // GAP-199: Default is the default, so its snippet says nothing.
  inset: figma.enum("Inset", {
    Default: undefined,
    Flush: "flush",
  }),
  navigation: figma.slot("Navigation Slot"),
  tools: figma.slot("Tools Slot"),
};

figma.connect(Sidebar, sidebarUrl, {
  variant: { Content: "Basic" },
  props: sidebarProps,
  example: ({ footer, header, inset, navigation }) => (
    <Sidebar
      footer={footer}
      header={header}
      inset={inset}
      navigation={navigation}
    />
  ),
});

figma.connect(Sidebar, sidebarUrl, {
  variant: { Content: "Sections" },
  props: sidebarProps,
  example: ({ footer, header, inset, navigation }) => (
    <Sidebar
      footer={footer}
      header={header}
      inset={inset}
      navigation={navigation}
    />
  ),
});

figma.connect(Sidebar, sidebarUrl, {
  variant: { Content: "Tools" },
  props: sidebarProps,
  example: ({ footer, header, inset, navigation, tools }) => (
    <Sidebar
      footer={footer}
      header={header}
      inset={inset}
      navigation={navigation}
      tools={tools}
    />
  ),
});

figma.connect(Sidebar, sidebarUrl, {
  variant: { Content: "Rail" },
  props: sidebarProps,
  example: ({ footer, header, inset, navigation }) => (
    <Sidebar
      footer={footer}
      header={header}
      inset={inset}
      navigation={navigation}
      variant="rail"
    />
  ),
});
