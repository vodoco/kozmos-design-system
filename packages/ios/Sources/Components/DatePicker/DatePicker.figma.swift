import SwiftUI
import Figma

struct KozmosDatePickerConnect: FigmaConnect {
    let component = KozmosDatePicker.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=438-4292"

    @FigmaString("Label Text")
    var label: String = "Date"

    // GAP-255: State=Mixed, the field of a multi-selection whose values
    // differ.
    @FigmaEnum(
        "State",
        mapping: [
            "Default": false,
            "Focus": false,
            "Disabled": false,
            "Readonly": false,
            "Mixed": true
        ]
    )
    var mixed: Bool = false

    // GAP-255: Reset Mixed, Mixed Text and Reset Mixed Text are mapped once
    // the owner's plugin Update has put them in the library.

    var body: some View {
        KozmosDatePicker(
            selection: .constant(Date()),
            label: self.label,
            mixed: self.mixed
        )
    }
}
