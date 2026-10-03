package com.kozmos.components.directionstep

import com.kozmos.tokens.KozmosDimensions
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.utils.instructionAnnotatedText

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.DirectionsWalk
import com.kozmos.utils.KozmosNavigationGlyphs
import androidx.compose.material.icons.filled.UTurnLeft
import androidx.compose.material.icons.filled.ArrowRightAlt
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.TurnLeft
import androidx.compose.material.icons.filled.TurnRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

/** Legacy source import retained; the wire values live in the shared contract. */
typealias DirectionType = com.kozmos.contracts.KozmosDirectionKind

@Composable
fun KozmosDirectionStep(
    type: DirectionType,
    instruction: String,
    modifier: Modifier = Modifier,
    distance: String? = null,
    duration: String? = null
) = KozmosDirectionStep(type, listOf(KozmosInstructionPart(instruction)), modifier, distance, duration)

/**
 * The arrow for a direction, one table for every part that draws one.
 * Turn icons must NOT auto-mirror: "turn left" stays a physical left turn
 * in RTL locales. Only reading-order affordances (back, forward, chevrons)
 * belong to Icons.AutoMirrored. Transport/ramp/entry drawings use the same
 * original Kozmos vector source as web and Swift; the words remain authoritative.
 */
fun DirectionType.icon(): ImageVector = when (this) {
    DirectionType.Straight -> Icons.Default.ArrowUpward
    DirectionType.Left -> Icons.Default.TurnLeft
    DirectionType.Right -> Icons.Default.TurnRight
    DirectionType.Destination -> Icons.Default.LocationOn
    DirectionType.LiftUp -> KozmosNavigationGlyphs.ElevatorUp
    DirectionType.LiftDown -> KozmosNavigationGlyphs.ElevatorDown
    DirectionType.EscalatorUp -> KozmosNavigationGlyphs.EscalatorUp
    DirectionType.EscalatorDown -> KozmosNavigationGlyphs.EscalatorDown
    DirectionType.StairsUp -> KozmosNavigationGlyphs.StairsUp
    DirectionType.StairsDown -> KozmosNavigationGlyphs.StairsDown
    DirectionType.LevelUp -> Icons.Default.ArrowUpward
    DirectionType.LevelDown -> Icons.Default.ArrowDownward
    DirectionType.Transition -> Icons.Default.ArrowRightAlt
    DirectionType.TurnBack -> Icons.Default.UTurnLeft
    DirectionType.Walking -> Icons.Default.DirectionsWalk
    DirectionType.Enter -> KozmosNavigationGlyphs.RouteEnter
    DirectionType.Exit -> KozmosNavigationGlyphs.RouteExit
    DirectionType.RampUp -> KozmosNavigationGlyphs.RampUp
    DirectionType.RampDown -> KozmosNavigationGlyphs.RampDown
}

@Composable
fun KozmosDirectionStep(
    type: DirectionType,
    instruction: List<KozmosInstructionPart>,
    modifier: Modifier = Modifier,
    distance: String? = null,
    duration: String? = null
) {
    val icon = type.icon()

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .background(KozmosThemeTokens.primitivesColorsBackground0)
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .padding(KozmosDimensions.primitivesLayoutSpacing150),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(KozmosDimensions.primitivesLayoutSizing500)
                .clip(CircleShape)
                .background(KozmosThemeTokens.primitivesColorsTheme500.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = KozmosThemeTokens.primitivesColorsTheme500,
                modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300)
            )
        }
        
        Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing150))
        
        Column(Modifier.weight(1f)) {
            Text(
                text = instructionAnnotatedText(instruction),
                style = MaterialTheme.typography.titleMedium,
                color = KozmosThemeTokens.primitivesColorsForeground100
            )
            val metrics = listOfNotNull(distance, duration).filter { it.isNotEmpty() }.joinToString(" • ")
            if (metrics.isNotEmpty()) {
                Text(
                    text = metrics,
                    style = MaterialTheme.typography.bodySmall,
                    color = KozmosThemeTokens.primitivesColorsForeground500
                )
            }
        }
    }
}
