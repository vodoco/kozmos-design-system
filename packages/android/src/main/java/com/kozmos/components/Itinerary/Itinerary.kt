package com.kozmos.components.itinerary

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** One step of an itinerary, as the products present it. */
data class KozmosItineraryStep(
    val id: String,
    /** The routing engine's own wording. */
    val instruction: String,
    val type: DirectionType,
    /** The step under way. */
    val isCurrent: Boolean = false
)

/**
 * The whole route as a list: where it starts, every step with the current
 * one emphasised, where it ends. TalkBack hears the endpoints as "From,
 * name" and "To, name", each step as one element, the current one selected.
 */
@Composable
fun KozmosItinerary(
    origin: String,
    steps: List<KozmosItineraryStep>,
    destination: String,
    modifier: Modifier = Modifier,
    originLabel: String = "From",
    destinationLabel: String = "To",
    label: String = "Itinerary"
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Endpoint(originLabel, origin, emphasised = false)
        steps.forEach { step -> StepRow(step) }
        Endpoint(destinationLabel, destination, emphasised = true)
    }
}

@Composable
private fun Endpoint(label: String, name: String, emphasised: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) { contentDescription = "$label, $name" },
        verticalAlignment = Alignment.Top
    ) {
        // The caption and the origin are muted, and on glass, in a glass
        // manoeuvre card, the foreground colour (decision 48).
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = kozmosMutedForeground(),
            modifier = Modifier.width(KozmosDimensions.primitivesLayoutSizing500).padding(top = 3.dp)
        )
        Text(
            text = name,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (emphasised) FontWeight.SemiBold else FontWeight.Normal),
            color = if (emphasised) KozmosThemeTokens.primitivesColorsForeground100 else kozmosMutedForeground(),
            modifier = Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing150)
        )
    }
}

@Composable
private fun StepRow(step: KozmosItineraryStep) {
    val colour = if (step.isCurrent) KozmosThemeTokens.primitivesColorsTheme500 else KozmosThemeTokens.primitivesColorsForeground100
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) {
                contentDescription = step.instruction
                selected = step.isCurrent
            },
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = step.type.icon(),
            contentDescription = null,
            tint = if (step.isCurrent) KozmosThemeTokens.primitivesColorsTheme500 else KozmosThemeTokens.primitivesColorsForeground500,
            modifier = Modifier
                .width(KozmosDimensions.primitivesLayoutSizing500)
                .height(20.dp)
                .padding(end = KozmosDimensions.primitivesLayoutSpacing300)
        )
        Text(
            text = step.instruction,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (step.isCurrent) FontWeight.SemiBold else FontWeight.Normal),
            color = colour,
            modifier = Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing150)
        )
    }
}
