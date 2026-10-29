// FloorSelector.mdx's Compose snippet ("A building's floors"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project.
// KozmosBuildingPresentationTest draws it. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.floorselector.KozmosFloorSelector
import com.kozmos.contracts.KozmosBuildingPresentation

// The level to start on: Pointr's default for the building, else the ground
// level, which only the product can name.
fun startFloor(building: KozmosBuildingPresentation, ground: String): String =
    building.defaultFloorId ?: ground

// The building the map reports: its floors, top first, as the selector draws them.
@Composable
fun BuildingFloors(
    building: KozmosBuildingPresentation,
    selectedFloor: String,
    onFloorSelect: (String) -> Unit
) {
    KozmosFloorSelector(
        floors = building.floors,
        selectedFloor = selectedFloor,
        onFloorSelect = onFloorSelect
    )
}
