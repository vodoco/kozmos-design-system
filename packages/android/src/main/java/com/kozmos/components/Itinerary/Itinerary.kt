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
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.components.instruction.instructionAnnotatedText
import com.kozmos.components.instruction.hasSpeechLanguage

/** One step of an itinerary, as the products present it. */
class KozmosItineraryStep(
    val id: String,
    instruction: List<KozmosInstructionPart>,
    val type: DirectionType,
    /** The step under way. */
    val isCurrent: Boolean = false
) {
    /** A snapshot: a caller mutating its input list cannot leave text and metadata inconsistent. */
    val instructionParts: List<KozmosInstructionPart> = instruction.toList()
    val instruction: String get() = instructionParts.joinToString("") { it.text }

    constructor(id: String, instruction: String, type: DirectionType, isCurrent: Boolean = false) :
        this(id, listOf(KozmosInstructionPart(instruction)), type, isCurrent)

    // Preserve the former data-class source API, without a second stale string/parts field.
    fun copy(id: String = this.id, type: DirectionType = this.type, isCurrent: Boolean = this.isCurrent) =
        KozmosItineraryStep(id, instructionParts, type, isCurrent)
    fun copy(id: String = this.id, instruction: String, type: DirectionType = this.type, isCurrent: Boolean = this.isCurrent) =
        KozmosItineraryStep(id, instruction, type, isCurrent)
    fun copy(id: String = this.id, instruction: List<KozmosInstructionPart>, type: DirectionType = this.type, isCurrent: Boolean = this.isCurrent) =
        KozmosItineraryStep(id, instruction, type, isCurrent)
    operator fun component1() = id
    operator fun component2() = instruction
    operator fun component3() = type
    operator fun component4() = isCurrent
    override fun equals(other: Any?): Boolean = other is KozmosItineraryStep &&
        id == other.id && instructionParts == other.instructionParts && type == other.type && isCurrent == other.isCurrent
    override fun hashCode(): Int = 31 * (31 * (31 * id.hashCode() + instructionParts.hashCode()) + type.hashCode()) + isCurrent.hashCode()
    override fun toString() = "KozmosItineraryStep(id=$id, instruction=$instruction, type=$type, isCurrent=$isCurrent)"
}

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
    val instruction = instructionAnnotatedText(step.instructionParts)
    val hasLanguage = step.instructionParts.hasSpeechLanguage()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) {
                if (hasLanguage) text = instruction else contentDescription = step.instruction
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
            text = instruction,
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (step.isCurrent) FontWeight.SemiBold else FontWeight.Normal),
            color = colour,
            modifier = Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing150)
                .then(if (hasLanguage) Modifier.clearAndSetSemantics {} else Modifier)
        )
    }
}
