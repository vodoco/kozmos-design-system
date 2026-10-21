// MapView.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.components.mapview.KozmosMapView

// The frame your map renderer sits in: a fill, a 1dp border, the control
// radius and a 400dp floor, always. There is no fill variant for a map that
// is the whole screen, and the frame names nothing: React's mapLabel and
// region have no counterpart. The renderer sizes itself.
@Composable
fun FramedMap(renderer: @Composable () -> Unit) {
    KozmosMapView(modifier = Modifier.fillMaxWidth()) {
        renderer()
    }
}
