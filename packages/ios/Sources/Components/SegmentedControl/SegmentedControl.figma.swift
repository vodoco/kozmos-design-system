import SwiftUI
import Figma

struct KozmosSegmentedControlConnect: FigmaConnect {
    let component = KozmosSegmentedControl.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=309-5165"

    @FigmaString("Item 1 Text")
    var item1Text: String = "Overview"

    @FigmaString("Item 2 Text")
    var item2Text: String = "Details"

    @FigmaString("Item 3 Text")
    var item3Text: String = "Activity"

    @FigmaEnum(
        "Size",
        mapping: [
            "Small": KozmosSegmentedControlSize.sm,
            "Default": KozmosSegmentedControlSize.`default`,
            "Large": KozmosSegmentedControlSize.lg
        ]
    )
    var size: KozmosSegmentedControlSize = .default

    @FigmaEnum(
        "Active",
        mapping: [
            "One": 0,
            "Two": 1,
            "Three": 2
        ]
    )
    var activeIndex: Int = 0

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Error": "error",
            "Mixed": "mixed"
        ]
    )
    var state: String = "default"

    // Decision 191: no option chosen, and the "Multiple values" line. Mixed
    // Text is mapped once the owner's plugin Update has put it in the
    // library: the dry run reads the live file.

    var body: some View {
        KozmosSegmentedControl(
            selection: .constant(self.activeIndex),
            items: [self.item1Text, self.item2Text, self.item3Text],
            size: self.size,
            disabled: self.state == "disabled",
            mixed: self.state == "mixed"
        )
    }
}
