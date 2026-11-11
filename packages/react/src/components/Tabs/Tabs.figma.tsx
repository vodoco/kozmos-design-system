import figma from "@figma/code-connect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const tabsUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=90-3387";

figma.connect(Tabs, tabsUrl, {
  props: {
    defaultValue: figma.enum("Active", {
      One: "one",
      Two: "two",
      Three: "three",
      Four: "four",
    }),
    disabled: figma.enum("State", {
      Default: false,
      Focus: false,
      Disabled: true,
    }),
    autoFocus: figma.enum("State", {
      Default: false,
      Focus: true,
      Disabled: false,
    }),
    tab1Text: figma.string("Tab 1 Text"),
    tab2Text: figma.string("Tab 2 Text"),
    tab3Text: figma.string("Tab 3 Text"),
    tab4Text: figma.string("Tab 4 Text"),
    // GAP-152: at Content=Icon Over Label each tab draws its icon over its
    // words, from the set's Tab N Icon swaps.
    tab1Icon: figma.enum("Content", {
      "Icon Over Label": figma.instance("Tab 1 Icon"),
    }),
    tab2Icon: figma.enum("Content", {
      "Icon Over Label": figma.instance("Tab 2 Icon"),
    }),
    tab3Icon: figma.enum("Content", {
      "Icon Over Label": figma.instance("Tab 3 Icon"),
    }),
    tab4Icon: figma.enum("Content", {
      "Icon Over Label": figma.instance("Tab 4 Icon"),
    }),
  },
  example: ({
    autoFocus,
    defaultValue,
    disabled,
    tab1Text,
    tab2Text,
    tab3Text,
    tab4Text,
    tab1Icon,
    tab2Icon,
    tab3Icon,
    tab4Icon,
  }) => (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger
          autoFocus={autoFocus}
          disabled={disabled}
          icon={tab1Icon}
          value="one"
        >
          {tab1Text}
        </TabsTrigger>
        <TabsTrigger disabled={disabled} icon={tab2Icon} value="two">
          {tab2Text}
        </TabsTrigger>
        <TabsTrigger disabled={disabled} icon={tab3Icon} value="three">
          {tab3Text}
        </TabsTrigger>
        <TabsTrigger disabled={disabled} icon={tab4Icon} value="four">
          {tab4Text}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">{tab1Text} content</TabsContent>
      <TabsContent value="two">{tab2Text} content</TabsContent>
      <TabsContent value="three">{tab3Text} content</TabsContent>
      <TabsContent value="four">{tab4Text} content</TabsContent>
    </Tabs>
  ),
});
