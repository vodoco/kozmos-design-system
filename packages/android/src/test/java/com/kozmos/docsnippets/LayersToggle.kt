// MapControlButton.mdx's Compose snippet, word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and composed by MapControlDocSnippetsTest.
// Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement

// A map toggle: grey while off, the theme's blue and navy while on. It rests
// icon-only and says its new state for a moment when it changes.
@Composable
fun LayersToggle(showsLayers: Boolean, onShowsLayersChange: (Boolean) -> Unit) {
    KozmosMapControlButton(
        label = "Layers",
        onClick = { onShowsLayersChange(!showsLayers) },
        icon = { KozmosIcon(name = "layers-three-01", size = KozmosIconSize.Lg) },
        stateLabel = if (showsLayers) "On" else "Off",
        labelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
        pressed = showsLayers,
        revealOnChange = true
    )
}
