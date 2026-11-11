import SwiftUI
import Figma

// Content is the set's closed and open drawings. SwiftUI writes one call for
// both: the system menu opens it. Each option's count (GAP-164) is its
// Option N Count while Show Counts is on. Code Connect writes a text
// property as a string and a count is an Int, so Show Counts writes the
// set's own counts, 128, 96 and 32, as numbers: an instance with other
// counts shows these.
struct KozmosSelectConnect: FigmaConnect {
    let component = KozmosSelect<Text, KozmosSelectItem>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432"
    var variant = ["Content": "Closed"]

    @FigmaString("Placeholder Text")
    var placeholder: String = "Select option"

    @FigmaString("Option 1 Text")
    var option1Text: String = "Everything"

    @FigmaString("Option 2 Text")
    var option2Text: String = "POI"

    @FigmaString("Option 3 Text")
    var option3Text: String = "Interior asset"

    @FigmaBoolean("Show Counts", mapping: [true: 128, false: nil])
    var option1Count: Int? = 128

    @FigmaBoolean("Show Counts", mapping: [true: 96, false: nil])
    var option2Count: Int? = 96

    @FigmaBoolean("Show Counts", mapping: [true: 32, false: nil])
    var option3Count: Int? = 32

    var body: some View {
        KozmosSelect {
            Text(self.placeholder)
        } content: {
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
    let component = KozmosSelect<Text, KozmosSelectItem>.self
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

    @FigmaBoolean("Show Counts", mapping: [true: 128, false: nil])
    var option1Count: Int? = 128

    @FigmaBoolean("Show Counts", mapping: [true: 96, false: nil])
    var option2Count: Int? = 96

    @FigmaBoolean("Show Counts", mapping: [true: 32, false: nil])
    var option3Count: Int? = 32

    var body: some View {
        KozmosSelect {
            Text(self.placeholder)
        } content: {
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
