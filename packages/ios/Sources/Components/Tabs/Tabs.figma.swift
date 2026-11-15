import SwiftUI
import Figma

struct KozmosTabsConnect: FigmaConnect {
    let component = KozmosTabs<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=90-3387"
    var variant = ["Content": "Label"]

    @FigmaEnum(
        "Active",
        mapping: [
            "One": "one",
            "Two": "two",
            "Three": "three",
            "Four": "four"
        ]
    )
    var activeValue: String = "one"

    @FigmaString("Tab 1 Text")
    var tab1Text: String = "Overview"

    @FigmaString("Tab 2 Text")
    var tab2Text: String = "Details"

    @FigmaString("Tab 3 Text")
    var tab3Text: String = "Usage"

    @FigmaString("Tab 4 Text")
    var tab4Text: String = "Settings"

    var body: some View {
        KozmosTabs(selection: .constant(self.activeValue)) {
            AnyView(
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                    KozmosTabsList {
                        KozmosTabsTrigger(
                            value: "one",
                            title: self.tab1Text,
                            selection: .constant(self.activeValue)
                        )
                        KozmosTabsTrigger(
                            value: "two",
                            title: self.tab2Text,
                            selection: .constant(self.activeValue)
                        )
                        KozmosTabsTrigger(
                            value: "three",
                            title: self.tab3Text,
                            selection: .constant(self.activeValue)
                        )
                        KozmosTabsTrigger(
                            value: "four",
                            title: self.tab4Text,
                            selection: .constant(self.activeValue)
                        )
                    }
                    KozmosTabsContent(
                        value: self.activeValue,
                        selection: .constant(self.activeValue)
                    ) {
                        Text("\(self.activeLabel) content")
                    }
                }
            )
        }
    }

    private var activeLabel: String {
        switch self.activeValue {
        case "two": return self.tab2Text
        case "three": return self.tab3Text
        case "four": return self.tab4Text
        default: return self.tab1Text
        }
    }
}

// GAP-152: each tab's icon over its title. The icons are the set's Tab N
// Icon swaps, read back as the KozmosIcon each Icon / * component maps to.
struct KozmosTabsIconOverLabelConnect: FigmaConnect {
    let component = KozmosTabs<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=90-3387"
    var variant = ["Content": "Icon Over Label"]

    @FigmaEnum(
        "Active",
        mapping: [
            "One": "one",
            "Two": "two",
            "Three": "three",
            "Four": "four"
        ]
    )
    var activeValue: String = "one"

    @FigmaString("Tab 1 Text")
    var tab1Text: String = "Overview"

    @FigmaString("Tab 2 Text")
    var tab2Text: String = "Details"

    @FigmaString("Tab 3 Text")
    var tab3Text: String = "Usage"

    @FigmaString("Tab 4 Text")
    var tab4Text: String = "Settings"

    @FigmaInstance("Tab 1 Icon")
    var tab1Icon: KozmosIcon = KozmosIcon("home-line")

    @FigmaInstance("Tab 2 Icon")
    var tab2Icon: KozmosIcon = KozmosIcon("home-line")

    @FigmaInstance("Tab 3 Icon")
    var tab3Icon: KozmosIcon = KozmosIcon("home-line")

    @FigmaInstance("Tab 4 Icon")
    var tab4Icon: KozmosIcon = KozmosIcon("home-line")

    var body: some View {
        KozmosTabs(selection: .constant(self.activeValue)) {
            AnyView(
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                    KozmosTabsList {
                        KozmosTabsTrigger(
                            value: "one",
                            title: self.tab1Text,
                            selection: .constant(self.activeValue)
                        ) {
                            self.tab1Icon
                        }
                        KozmosTabsTrigger(
                            value: "two",
                            title: self.tab2Text,
                            selection: .constant(self.activeValue)
                        ) {
                            self.tab2Icon
                        }
                        KozmosTabsTrigger(
                            value: "three",
                            title: self.tab3Text,
                            selection: .constant(self.activeValue)
                        ) {
                            self.tab3Icon
                        }
                        KozmosTabsTrigger(
                            value: "four",
                            title: self.tab4Text,
                            selection: .constant(self.activeValue)
                        ) {
                            self.tab4Icon
                        }
                    }
                    KozmosTabsContent(
                        value: self.activeValue,
                        selection: .constant(self.activeValue)
                    ) {
                        Text("\(self.activeLabel) content")
                    }
                }
            )
        }
    }

    private var activeLabel: String {
        switch self.activeValue {
        case "two": return self.tab2Text
        case "three": return self.tab3Text
        case "four": return self.tab4Text
        default: return self.tab1Text
        }
    }
}
