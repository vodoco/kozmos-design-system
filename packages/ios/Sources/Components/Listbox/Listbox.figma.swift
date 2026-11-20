import SwiftUI
import Figma

struct KozmosListboxConnect: FigmaConnect {
    let component = KozmosListbox.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9475"

    @FigmaEnum(
        "Selection",
        mapping: [
            "Single": false,
            "Multiple": true
        ]
    )
    var multiple: Bool = false

    @FigmaEnum(
        "State",
        mapping: [
            "Default": false,
            "Focus": false,
            "Disabled": true
        ]
    )
    var disabled: Bool = false

    @FigmaString("Option 1 Text")
    var option1: String = "Metro Station"

    @FigmaString("Option 1 Description")
    var option1Description: String = "Fast transit connection"

    @FigmaString("Option 2 Text")
    var option2: String = "Bus Stop"

    @FigmaString("Option 2 Description")
    var option2Description: String = "Frequent local service"

    @FigmaString("Option 3 Text")
    var option3: String = "Bike Parking"

    @FigmaString("Option 3 Description")
    var option3Description: String = "Secure racks nearby"

    // Decision 215, GAP-282: Show Media is each option's Sm Avatar, its
    // initials the label's. GAP-260: Show Trailing is each option's muted
    // words at its end, before the check.
    @FigmaBoolean("Show Media", mapping: [true: KozmosOptionMedia(), false: nil])
    var media: KozmosOptionMedia? = nil

    @FigmaBoolean("Show Trailing")
    var showTrailing: Bool = false

    @FigmaString("Option 1 Trailing")
    var option1Trailing: String = "Text"

    @FigmaString("Option 2 Trailing")
    var option2Trailing: String = "Number"

    @FigmaString("Option 3 Trailing")
    var option3Trailing: String = "Image"

    var body: some View {
        KozmosListbox(
            options: [
                KozmosListboxOption(value: "metro-station", label: self.option1, description: self.option1Description, media: self.media, trailing: self.showTrailing ? self.option1Trailing : nil),
                KozmosListboxOption(value: "bus-stop", label: self.option2, description: self.option2Description, media: self.media, trailing: self.showTrailing ? self.option2Trailing : nil),
                KozmosListboxOption(value: "bike-parking", label: self.option3, description: self.option3Description, media: self.media, trailing: self.showTrailing ? self.option3Trailing : nil)
            ],
            selectedValues: .constant(self.multiple ? ["metro-station", "bus-stop"] : ["metro-station"]),
            multiple: self.multiple,
            disabled: self.disabled
        )
    }
}
