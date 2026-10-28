// FloorSelector.mdx's SwiftUI snippet ("A building's floors"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project.
// KozmosBuildingPresentationTests draws it. Change the two together.
import SwiftUI
import Kozmos

// The level to start on: Pointr's default for the building, else the ground
// level, which only the product can name.
func startFloor(of building: KozmosBuildingPresentation, ground: String) -> String {
    building.defaultFloorId ?? ground
}

// The building the map reports: its floors, top first, as the selector draws them.
struct BuildingFloors: View {
    let building: KozmosBuildingPresentation
    @Binding var selectedFloor: String

    var body: some View {
        KozmosFloorSelector(
            floors: building.floors,
            selectedFloor: $selectedFloor
        )
    }
}
