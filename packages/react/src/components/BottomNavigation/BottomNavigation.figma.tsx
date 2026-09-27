import figma from "@figma/code-connect";
import {
  Bell01 as Bell,
  Home01 as Home,
  DotsHorizontal as MoreHorizontal,
  Route,
  SearchMd as Search,
} from "@kozmos-ds/icons";
import { BottomNavigation } from "./BottomNavigation";

const bottomNavigationUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=728-6447";

const bottomNavigationIcons = [
  <Home key="home" className="h-5 w-5" />,
  <Search key="search" className="h-5 w-5" />,
  <Route key="route" className="h-5 w-5" />,
  <Bell key="bell" className="h-5 w-5" />,
  <MoreHorizontal key="more" className="h-5 w-5" />,
];

figma.connect(BottomNavigation, bottomNavigationUrl, {
  props: {
    count: figma.enum("Count", {
      Three: 3,
      Four: 4,
      Five: 5,
    }),
    activeIndex: figma.enum("Active", {
      One: 0,
      Two: 1,
      Three: 2,
      Four: 3,
      Five: 4,
    }),
    item1Label: figma.string("Item 1 Text"),
    item2Label: figma.string("Item 2 Text"),
    item3Label: figma.string("Item 3 Text"),
    item4Label: figma.string("Item 4 Text"),
    item5Label: figma.string("Item 5 Text"),
  },
  example: ({
    activeIndex,
    count,
    item1Label,
    item2Label,
    item3Label,
    item4Label,
    item5Label,
  }) => {
    const labels = [item1Label, item2Label, item3Label, item4Label, item5Label];

    return (
      <BottomNavigation
        items={labels.slice(0, count).map((label, index) => ({
          active: index === activeIndex,
          icon: bottomNavigationIcons[index],
          label,
        }))}
      />
    );
  },
});
