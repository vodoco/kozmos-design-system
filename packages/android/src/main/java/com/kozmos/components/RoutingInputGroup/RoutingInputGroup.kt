package com.kozmos.components.routinginputgroup

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.input.KozmosWashedField
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle

data class KozmosRoutePoint(
    val id: String,
    val value: String,
    val placeholder: String? = null,
    val label: String? = null
)

/** Localized action names; field identities belong to each route point. */
data class KozmosRoutingInputLabels(
    val swap: String = "Swap route points",
    val addPoint: String = "Add route point",
    val removePoint: (KozmosRoutePoint) -> String = { "Remove ${it.label ?: it.placeholder ?: it.value.ifEmpty { "route point" }}" }
)

/** Preserves the original positional and trailing-removal-lambda calls. */
@Composable
fun KozmosRoutingInputGroup(
    points: List<KozmosRoutePoint>,
    onPointChange: (String, String) -> Unit,
    modifier: Modifier = Modifier,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    onSwap: (() -> Unit)? = null,
    onAddPoint: (() -> Unit)? = null,
    onRemovePoint: ((String) -> Unit)? = null
) = KozmosRoutingInputGroup(points, onPointChange, KozmosRoutingInputLabels(), modifier, surface, onSwap, onAddPoint, onRemovePoint)

/**
 * [surface] is what the group is made of, as React's `surface` prop:
 * [KozmosSurfaceStyle.Solid] (the default) or [KozmosSurfaceStyle.Glass], for a
 * card over the map. Until 2026-09-22 Compose drew it solid only.
 */
@Composable
fun KozmosRoutingInputGroup(
    points: List<KozmosRoutePoint>,
    onPointChange: (String, String) -> Unit,
    labels: KozmosRoutingInputLabels,
    modifier: Modifier = Modifier,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    onSwap: (() -> Unit)? = null,
    onAddPoint: (() -> Unit)? = null,
    onRemovePoint: ((String) -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
        // The solid surface React's card sits on by default, themed: the
        // background with the subtle border. It was the background at 90 %
        // under a near-black hairline at 8 % until 2026-09-22.
        color = KozmosSurfaceDefaults.tint(surface),
        tonalElevation = 6.dp,
        shadowElevation = 12.dp,
        border = KozmosSurfaceDefaults.border(surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(KozmosDimensions.primitivesLayoutSpacing200),
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.Top
        ) {
            RouteTimeline(points)

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
            ) {
                points.forEachIndexed { index, point ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
                    ) {
                        KozmosWashedField(
                            value = point.value,
                            onValueChange = { onPointChange(point.id, it) },
                            placeholder = point.placeholder ?: defaultPlaceholder(index),
                            label = point.label ?: if (index == 0) "Origin" else if (index == points.lastIndex) "Destination" else "Stop $index",
                            modifier = Modifier.weight(1f)
                        )

                        if (points.size > 2 && index > 0 && index < points.lastIndex && onRemovePoint != null) {
                            RoutingAction(
                                icon = Icons.Default.Close,
                                label = labels.removePoint(point),
                                filled = false
                            ) {
                                trackEvent(KozmosAnalyticsEvent(component = "RoutingInputGroup", eventName = "point_removed", properties = mapOf("pointId" to point.id)))
                                onRemovePoint(point.id)
                            }
                        }
                    }
                }
            }

            // React's action column: with two points the swap sits 24 down,
            // between the fields, in the secondary fill, and the add 20 below
            // it (8 apart and its own 20); with more, the add is at the top.
            // They were 48 Material icon buttons with no fill until 2026-09-22.
            Column {
                val swaps = points.size == 2 && onSwap != null
                if (swaps) {
                    RoutingAction(
                        icon = Icons.Default.SwapVert,
                        label = labels.swap,
                        filled = true,
                        modifier = Modifier.padding(top = 24.dp)
                    ) {
                        trackEvent(KozmosAnalyticsEvent(component = "RoutingInputGroup", eventName = "points_swapped"))
                        onSwap?.invoke()
                    }
                }

                if (onAddPoint != null) {
                    RoutingAction(
                        icon = Icons.Default.Add,
                        label = labels.addPoint,
                        filled = false,
                        modifier = Modifier.padding(top = if (points.size == 2) 20.dp + (if (swaps) 8.dp else 0.dp) else 0.dp)
                    ) {
                        trackEvent(KozmosAnalyticsEvent(component = "RoutingInputGroup", eventName = "point_added"))
                        onAddPoint()
                    }
                }
            }
        }
    }
}

/**
 * React's rail: 12 down, a 14 ring for each point but the last — the start's
 * in the accent over a fifth of it, a waypoint's in the muted foreground — a
 * 2 × 36 connector in the border role between each, and a 16 pin for the end,
 * 8 apart. It was theme/500 with an 18 pin, touching, and its connectors
 * foreground/300 until 2026-09-22.
 */
@Composable
private fun RouteTimeline(points: List<KozmosRoutePoint>) {
    val accent = KozmosThemeTokens.primitivesColorsTheme600
    Column(
        modifier = Modifier.padding(top = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        points.forEachIndexed { index, _ ->
            if (index == points.lastIndex) {
                Icon(
                    imageVector = Icons.Default.Place,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(16.dp)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .background(if (index == 0) accent.copy(alpha = 0.2f) else Color.Transparent, CircleShape)
                        .border(2.dp, if (index == 0) accent else KozmosThemeTokens.primitivesColorsForeground400, CircleShape)
                )
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(36.dp)
                        .background(KozmosThemeTokens.semanticsBorderSubtle, CircleShape)
                )
            }
        }
    }
}

/**
 * One of the group's 48dp icon actions, with the control radius. `filled` is the
 * swap's secondary fill with the page ink; the others are ghost in the muted
 * foreground, as React's are.
 */
@Composable
private fun RoutingAction(
    icon: ImageVector,
    label: String,
    filled: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(48.dp)
            .clip(shape)
            .background(if (filled) KozmosThemeTokens.primitivesColorsBackground200 else Color.Transparent, shape)
            .clickable(role = Role.Button, onClickLabel = label, onClick = onClick)
            .semantics { contentDescription = label }
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (filled) KozmosThemeTokens.primitivesColorsForeground0 else KozmosThemeTokens.primitivesColorsForeground400,
            modifier = Modifier.size(16.dp)
        )
    }
}

private fun defaultPlaceholder(index: Int): String {
    return if (index == 0) "Choose Starting Point" else "Choose Destination"
}
