// Not a docs tab: no MDX page shows it; the Android CHANGELOG points here.
// How a prototype puts LocationPin's markers on a map, compiled here so the
// positioning API it shows cannot drift from the code. In production the map
// style's sprite sheet draws these markers.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.IntOffset
import com.kozmos.components.locationpin.KozmosLocationPin
import com.kozmos.components.locationpin.kozmosLocationPinAt

/** One result on the level in view, and where the map draws its place on screen, in pixels. */
data class MappedResult(val id: String, val name: String, val number: Int, val screenPoint: () -> IntOffset)

// Each marker's anchor (a Result's pointer tip, a tile's or a place's dot)
// lands on its place's screen point; the point is read at placement, so the
// markers follow the map as it moves without composing again.
@Composable
fun ResultMarkersOnAMap(
    results: List<MappedResult>,
    selectedId: String?,
    onSelect: (String) -> Unit,
    onOpen: (String) -> Unit
) {
    Box(Modifier.fillMaxSize()) {
        results.forEach { result ->
            KozmosLocationPin(
                modifier = Modifier.kozmosLocationPinAt { result.screenPoint() },
                label = "${result.number}, ${result.name}",
                number = result.number,
                selected = result.id == selectedId,
                onClick = { onSelect(result.id) },
                onOpen = { onOpen(result.id) }
            )
        }
    }
}
