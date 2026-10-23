// MapStatusPill.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and composed by
// MapStatusPillDocSnippetsTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsWalk
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.mapstatuspill.KozmosMapStatusPill
import com.kozmos.components.mapstatuspill.KozmosMapStatusPillTone

// The product's words, in the visitor's language, and its tone for each.
@Composable
fun PositioningStatus(isCalculating: Boolean) {
    KozmosMapStatusPill(
        text = if (isCalculating) "Calculating Precise Position" else "Established",
        tone = if (isCalculating) KozmosMapStatusPillTone.Progress else KozmosMapStatusPillTone.Success
    )
}

// A mark in place of the tone's, by its Kozmos name, as on every platform.
@Composable
fun BluetoothStatus() {
    KozmosMapStatusPill(
        text = "No Bluetooth",
        tone = KozmosMapStatusPillTone.Danger,
        icon = { KozmosIcon(name = "bluetooth-off", size = KozmosIconSize.Lg) }
    )
}

// Material's walking figure, in the progress tone's blue.
@Composable
fun WalkingStatus() {
    KozmosMapStatusPill(
        text = "Walking improves accuracy",
        tone = KozmosMapStatusPillTone.Progress,
        icon = { Icon(Icons.AutoMirrored.Filled.DirectionsWalk, contentDescription = null) }
    )
}
