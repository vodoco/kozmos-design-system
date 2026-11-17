// Checkbox.mdx's SwiftUI snippet ("Mixed"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// "All floors" is mixed while only some floors are shown; a tap shows them all.
struct FloorFilter: View {
    let floors = ["Ground floor", "First floor"]
    @State private var shown: Set<String> = ["Ground floor"]

    private var all: Binding<KozmosCheckboxState> {
        Binding(
            get: { shown.isEmpty ? .unchecked : shown.count == floors.count ? .checked : .indeterminate },
            set: { shown = $0 == .checked ? Set(floors) : [] }
        )
    }

    var body: some View {
        VStack(alignment: .leading) {
            KozmosCheckbox(checked: all, label: "All floors")
            ForEach(floors, id: \.self) { floor in
                KozmosCheckbox(
                    checked: Binding(
                        get: { shown.contains(floor) },
                        set: { isOn in
                            if isOn {
                                shown.insert(floor)
                            } else {
                                shown.remove(floor)
                            }
                        }
                    ),
                    label: floor
                )
            }
        }
    }
}
