package com.kozmos.components.routeprogressrail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.progressSemantics
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/** A host-owned transition positioned on the same basis as route progress. */
data class KozmosRouteProgressWaypoint(val id: String, val position: Float, val type: DirectionType, val label: String)

/** The rail's geometry: the end dots, the travelling disc, the track. */
object KozmosRouteProgressRailGeometry {
    val dot = 10.dp
    val disc = 34.dp
    val track = KozmosDimensions.primitivesLayoutSpacing75

    fun clamp(progress: Float): Float = if (progress.isFinite()) progress.coerceIn(0f, 1f) else 0f

    fun validWaypoints(points: List<KozmosRouteProgressWaypoint>): List<KozmosRouteProgressWaypoint> {
        val counts = points.groupingBy { it.id }.eachCount()
        return points.filter { it.id.isNotBlank() && it.label.isNotBlank() && counts[it.id] == 1 &&
            it.position.isFinite() && it.position in 0f..1f }.sortedBy { it.position }
    }

    fun visibleWaypoints(points: List<KozmosRouteProgressWaypoint>, width: Dp, progress: Float?): List<KozmosRouteProgressWaypoint> {
        if (width < 54.dp) return emptyList()
        val travel = width.value - 54
        var last = Float.NEGATIVE_INFINITY
        return validWaypoints(points).filter { point ->
            val x = 27 + travel * point.position
            if ((progress != null && kotlin.math.abs(27 + travel * progress - x) < 33) || x - last < 28) false
            else { last = x; true }
        }
    }

    /**
     * Where the disc's leading edge sits for a progress, in a rail `width`
     * wide: from just after the start dot to just before the end dot.
     */
    fun discLeading(progress: Float, width: Dp): Dp {
        val inset = minOf(dot, width.coerceAtLeast(0.dp) * 0.2f)
        val diameter = minOf(disc, width.coerceAtLeast(0.dp) * 0.6f)
        val travel = (width - inset * 2 - diameter).coerceAtLeast(0.dp)
        return inset + travel * clamp(progress)
    }
}

/**
 * How far along the route the visitor is, as a rail: a dot where it starts,
 * a disc carrying the current manoeuvre's arrow that travels the track, a
 * dot where it ends. TalkBack hears the label and the progress.
 */
@Composable
fun KozmosRouteProgressRail(
    progress: Float,
    type: DirectionType,
    label: String,
    modifier: Modifier = Modifier
) = KozmosRouteProgressRail(progress, type, label, modifier, valueText = null)

/** Null progress is unavailable, not zero; the host supplies its localized description. */
@Composable
fun KozmosRouteProgressRail(
    progress: Float?,
    type: DirectionType,
    label: String,
    modifier: Modifier = Modifier,
    valueText: String? = null,
    waypoints: List<KozmosRouteProgressWaypoint> = emptyList(),
    showCompletedTrack: Boolean = false
) {
    val clamped = KozmosRouteProgressRailGeometry.clamp(progress ?: 0f)
    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .height(KozmosRouteProgressRailGeometry.disc)
            .then(if (progress == null) Modifier.progressSemantics() else Modifier.progressSemantics(clamped))
            .semantics {
                contentDescription = (listOf(label) + KozmosRouteProgressRailGeometry.validWaypoints(waypoints).map { it.label }).joinToString("; ")
                if (valueText != null) stateDescription = valueText
            }
    ) {
        val dot = minOf(KozmosRouteProgressRailGeometry.dot, maxWidth.coerceAtLeast(0.dp) * 0.2f)
        val disc = minOf(KozmosRouteProgressRailGeometry.disc, maxWidth.coerceAtLeast(0.dp) * 0.6f)
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(horizontal = dot)
                .fillMaxWidth()
                .height(KozmosRouteProgressRailGeometry.track)
                .background(KozmosThemeTokens.primitivesColorsBackground300, CircleShape)
        )
        if (showCompletedTrack && progress != null && clamped > 0f) Box(
            Modifier.align(Alignment.CenterStart).offset(x = dot)
                .width(disc / 2 + (maxWidth - dot * 2 - disc).coerceAtLeast(0.dp) * clamped)
                .height(KozmosRouteProgressRailGeometry.track)
                .background(KozmosThemeTokens.primitivesColorsTheme500, CircleShape)
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .size(dot)
                .background(if (progress == null) KozmosThemeTokens.primitivesColorsBackground300 else KozmosThemeTokens.primitivesColorsTheme500, CircleShape)
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .size(dot)
                .background(KozmosThemeTokens.primitivesColorsBackground300, CircleShape)
        )
        KozmosRouteProgressRailGeometry.visibleWaypoints(waypoints, maxWidth, if (progress == null) null else clamped).forEach { point ->
            Box(Modifier.align(Alignment.CenterStart).offset(x = 15.dp + (maxWidth - 54.dp).coerceAtLeast(0.dp) * point.position)
                .size(24.dp).background(KozmosThemeTokens.primitivesColorsBackground300, CircleShape)
                .border(1.dp, KozmosThemeTokens.primitivesColorsBackground400, CircleShape), contentAlignment = Alignment.Center) {
                Icon(point.type.icon(), contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100, modifier = Modifier.size(16.dp))
            }
        }
        if (progress != null) Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = KozmosRouteProgressRailGeometry.discLeading(clamped, maxWidth))
                .size(disc)
                .background(KozmosThemeTokens.primitivesColorsTheme500, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = type.icon(),
                contentDescription = null,
                tint = KozmosThemeTokens.primitivesColorsBackground0,
                modifier = Modifier.size(minOf(KozmosDimensions.primitivesLayoutSizing300, disc * (24f / 34f)))
            )
        }
    }
}
