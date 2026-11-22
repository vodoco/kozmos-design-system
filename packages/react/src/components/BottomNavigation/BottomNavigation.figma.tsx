import figma from "@figma/code-connect";
import {
  Bell01,
  DotsHorizontal,
  Home01,
  Route,
  SearchMd,
} from "@kozmos-ds/icons";
import { BottomNavigation } from "./BottomNavigation";

const bottomNavigationUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=728-6447";

// Active is the item drawn active: each item's `active`, true for that one.
const bottomNavigationProps = {
  item1Active: figma.enum("Active", {
    One: true,
    Two: false,
    Three: false,
    Four: false,
    Five: false,
  }),
  item2Active: figma.enum("Active", {
    One: false,
    Two: true,
    Three: false,
    Four: false,
    Five: false,
  }),
  item3Active: figma.enum("Active", {
    One: false,
    Two: false,
    Three: true,
    Four: false,
    Five: false,
  }),
  item4Active: figma.enum("Active", {
    One: false,
    Two: false,
    Three: false,
    Four: true,
    Five: false,
  }),
  item5Active: figma.enum("Active", {
    One: false,
    Two: false,
    Three: false,
    Four: false,
    Five: true,
  }),
  item1Label: figma.string("Item 1 Text"),
  item2Label: figma.string("Item 2 Text"),
  item3Label: figma.string("Item 3 Text"),
  item4Label: figma.string("Item 4 Text"),
  item5Label: figma.string("Item 5 Text"),
};

// Count is how many items there are: one connection per Count, each listing
// its items, because Code Connect substitutes a property only where the
// example uses it, never in items sliced and mapped from all five.

figma.connect(BottomNavigation, bottomNavigationUrl, {
  variant: { Count: "Three" },
  props: bottomNavigationProps,
  example: ({
    item1Active,
    item1Label,
    item2Active,
    item2Label,
    item3Active,
    item3Label,
  }) => (
    <BottomNavigation
      items={[
        {
          active: item1Active,
          icon: <Home01 className="h-5 w-5" />,
          label: item1Label,
        },
        {
          active: item2Active,
          icon: <SearchMd className="h-5 w-5" />,
          label: item2Label,
        },
        {
          active: item3Active,
          icon: <Route className="h-5 w-5" />,
          label: item3Label,
        },
      ]}
    />
  ),
});

figma.connect(BottomNavigation, bottomNavigationUrl, {
  variant: { Count: "Four" },
  props: bottomNavigationProps,
  example: ({
    item1Active,
    item1Label,
    item2Active,
    item2Label,
    item3Active,
    item3Label,
    item4Active,
    item4Label,
  }) => (
    <BottomNavigation
      items={[
        {
          active: item1Active,
          icon: <Home01 className="h-5 w-5" />,
          label: item1Label,
        },
        {
          active: item2Active,
          icon: <SearchMd className="h-5 w-5" />,
          label: item2Label,
        },
        {
          active: item3Active,
          icon: <Route className="h-5 w-5" />,
          label: item3Label,
        },
        {
          active: item4Active,
          icon: <Bell01 className="h-5 w-5" />,
          label: item4Label,
        },
      ]}
    />
  ),
});

figma.connect(BottomNavigation, bottomNavigationUrl, {
  variant: { Count: "Five" },
  props: bottomNavigationProps,
  example: ({
    item1Active,
    item1Label,
    item2Active,
    item2Label,
    item3Active,
    item3Label,
    item4Active,
    item4Label,
    item5Active,
    item5Label,
  }) => (
    <BottomNavigation
      items={[
        {
          active: item1Active,
          icon: <Home01 className="h-5 w-5" />,
          label: item1Label,
        },
        {
          active: item2Active,
          icon: <SearchMd className="h-5 w-5" />,
          label: item2Label,
        },
        {
          active: item3Active,
          icon: <Route className="h-5 w-5" />,
          label: item3Label,
        },
        {
          active: item4Active,
          icon: <Bell01 className="h-5 w-5" />,
          label: item4Label,
        },
        {
          active: item5Active,
          icon: <DotsHorizontal className="h-5 w-5" />,
          label: item5Label,
        },
      ]}
    />
  ),
});
