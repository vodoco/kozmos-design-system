import SwiftUI
import Figma

// Content is the set's closed and open drawings. SwiftUI writes one call for
// both: the system menu opens it. Each option's count (GAP-164) is its
// Option N Count while Show Counts is on. The Figma `Option N Count` text
// is not carried to the native snippet: Code Connect gives Swift a text
// property as a String, and `count` is an Int, so Show Counts writes the
// set's own counts, 128, 96 and 32, as literal numbers. An instance with
// other counts still shows these.
struct KozmosSelectConnect: FigmaConnect {
    let component = KozmosSelect<KozmosSelectField, KozmosSelectItem>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432"
    var variant = ["Content": "Closed"]

    @FigmaString("Placeholder Text")
    var placeholder: String = "Select option"

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Mixed": "mixed"
        ]
    )
    var state: String = "default"

    @FigmaEnum(
        "Status",
        mapping: [
            "Default": false,
            "Error": true
        ]
    )
    var error: Bool = false

    // GAP-153: its way back to the several values, once chosen.
    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    @FigmaString("Mixed Text")
    var mixedLabel: String = "Multiple values"

    @FigmaString("Reset Mixed Text")
    var resetMixedLabel: String = "Reset to multiple values"

    @FigmaString("Option 1 Text")
    var option1Text: String = "Everything"

    @FigmaString("Option 2 Text")
    var option2Text: String = "POI"

    @FigmaString("Option 3 Text")
    var option3Text: String = "Interior asset"

    // Literal counts: `Option N Count` is a text property, a String in
    // Swift, so it is not carried; `count` is an Int.
    @FigmaBoolean("Show Counts", mapping: [true: 128, false: nil])
    var option1Count: Int? = 128

    @FigmaBoolean("Show Counts", mapping: [true: 96, false: nil])
    var option2Count: Int? = 96

    @FigmaBoolean("Show Counts", mapping: [true: 32, false: nil])
    var option3Count: Int? = 32

    var body: some View {
        KozmosSelect(
            value: nil,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            error: self.error,
            mixed: self.state == "mixed",
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        ) {
            KozmosSelectItem(
                value: "option-1",
                label: self.option1Text,
                count: self.option1Count,
                selection: .constant("")
            )
            KozmosSelectItem(
                value: "option-2",
                label: self.option2Text,
                count: self.option2Count,
                selection: .constant("")
            )
            KozmosSelectItem(
                value: "option-3",
                label: self.option3Text,
                count: self.option3Count,
                selection: .constant("")
            )
        }
    }
}

struct KozmosSelectOpenConnect: FigmaConnect {
    let component = KozmosSelect<KozmosSelectField, KozmosSelectItem>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432"
    var variant = ["Content": "Open"]

    @FigmaString("Placeholder Text")
    var placeholder: String = "Select option"

    @FigmaString("Option 1 Text")
    var option1Text: String = "Everything"

    @FigmaString("Option 2 Text")
    var option2Text: String = "POI"

    @FigmaString("Option 3 Text")
    var option3Text: String = "Interior asset"

    // Literal counts: `Option N Count` is a text property, a String in
    // Swift, so it is not carried; `count` is an Int.
    @FigmaBoolean("Show Counts", mapping: [true: 128, false: nil])
    var option1Count: Int? = 128

    @FigmaBoolean("Show Counts", mapping: [true: 96, false: nil])
    var option2Count: Int? = 96

    @FigmaBoolean("Show Counts", mapping: [true: 32, false: nil])
    var option3Count: Int? = 32

    @FigmaEnum(
        "Status",
        mapping: [
            "Default": false,
            "Error": true
        ]
    )
    var error: Bool = false

    // Open is drawn at State=Default only: no focus, disabled or mixed.
    var body: some View {
        KozmosSelect(value: nil, placeholder: self.placeholder, error: self.error) {
            KozmosSelectItem(
                value: "option-1",
                label: self.option1Text,
                count: self.option1Count,
                selection: .constant("")
            )
            KozmosSelectItem(
                value: "option-2",
                label: self.option2Text,
                count: self.option2Count,
                selection: .constant("")
            )
            KozmosSelectItem(
                value: "option-3",
                label: self.option3Text,
                count: self.option3Count,
                selection: .constant("")
            )
        }
    }
}
