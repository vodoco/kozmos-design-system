package com.kozmos.components.arrivalpanel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.utils.KozmosRoutePanelSurface
import com.kozmos.utils.KozmosDestinationImage
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** Host-confirmed arrival content; never detects arrival, announces or dismisses itself. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KozmosArrivalPanel(
    destination: String,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    destinationImage: String? = null,
    locationText: String? = null,
    title: String = "You've arrived",
    message: String? = null,
    actualDurationText: String? = null,
    actualDistanceText: String? = null,
    durationLabel: String = "Journey time",
    distanceLabel: String = "Distance travelled",
    doneLabel: String = "Done",
    pending: Boolean = false,
    presentation: KozmosRoutePresentation = KozmosRoutePresentation.Hosted,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid
) {
    KozmosRoutePanelSurface(presentation, surface, modifier) {
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold,
                color = KozmosThemeTokens.primitivesColorsForeground100, modifier = Modifier.semantics { heading() })
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)) {
                if (!destinationImage.isNullOrEmpty()) KozmosDestinationImage(destinationImage)
                Column(Modifier.weight(1f)) {
                    Text(destination, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = KozmosThemeTokens.primitivesColorsForeground100)
                    if (!locationText.isNullOrEmpty()) Text(locationText, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
                }
            }
            if (!message.isNullOrEmpty()) Text(message, style = MaterialTheme.typography.bodyLarge, color = KozmosThemeTokens.primitivesColorsForeground100)
            if (!actualDurationText.isNullOrEmpty() || !actualDistanceText.isNullOrEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
                    if (!actualDurationText.isNullOrEmpty()) ArrivalMetric(durationLabel, actualDurationText)
                    if (!actualDistanceText.isNullOrEmpty()) ArrivalMetric(distanceLabel, actualDistanceText)
                }
            }
            KozmosButton(onClick = onDone, enabled = !pending, modifier = Modifier.fillMaxWidth()) { Text(doneLabel) }
        }
    }
}

@Composable private fun ArrivalMetric(label: String, value: String) {
    Column(Modifier.semantics(mergeDescendants = true) {}) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
        Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, color = KozmosThemeTokens.primitivesColorsForeground100)
    }
}
