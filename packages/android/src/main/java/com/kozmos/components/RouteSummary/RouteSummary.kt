package com.kozmos.components.routesummary

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.components.button.KozmosButtonEmotion
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelSurface
import com.kozmos.utils.KozmosRoutePanelSurface
import com.kozmos.utils.KozmosDestinationImage

enum class KozmosRoutePresentation { Standalone, Hosted }

enum class KozmosRouteSummaryState {
    Active,
    Preview
}

/**
 * The estimate layout: the time over the distance, End as an icon while the
 * route is active, Start while it is previewed. [endRouteLabel] names the End
 * icon button and [startNavigationLabel] is Start's label, as React's
 * `endRouteLabel` and `startNavigationLabel`; both come before
 * [transportModeIcon], so a trailing lambda is still the transport mode.
 */
@Composable
fun KozmosRouteSummary(
    etaText: String,
    distanceText: String,
    onEndRoute: () -> Unit,
    modifier: Modifier = Modifier,
    state: KozmosRouteSummaryState = KozmosRouteSummaryState.Active,
    onStartNavigation: (() -> Unit)? = null,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    endRouteLabel: String = "End route",
    startNavigationLabel: String = "Start Navigation",
    transportModeIcon: (@Composable () -> Unit)? = null
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
        color = KozmosSurfaceDefaults.tint(surface),
        tonalElevation = 6.dp,
        shadowElevation = 12.dp,
        border = KozmosSurfaceDefaults.border(surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(KozmosDimensions.primitivesLayoutSpacing200),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (transportModeIcon != null) {
                    Surface(
                        modifier = Modifier.size(40.dp),
                        shape = CircleShape,
                        color = KozmosThemeTokens.primitivesColorsTheme500.copy(alpha = 0.12f)
                    ) {
                        androidx.compose.foundation.layout.Box(contentAlignment = Alignment.Center) {
                            transportModeIcon()
                        }
                    }
                    Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing150))
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = etaText,
                        style = MaterialTheme.typography.titleLarge,
                        color = KozmosThemeTokens.primitivesColorsForeground100
                    )
                    // Muted, and on glass the foreground colour (decision 48).
                    Text(
                        text = distanceText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = kozmosMutedForeground(surface)
                    )
                }

                if (state == KozmosRouteSummaryState.Active) {
                    // Material's own size: its 40dp state layer in a 48dp
                    // target the row reserves. A size(40.dp) here made the
                    // box 40, the rest left to Compose's touch-only widening.
                    IconButton(
                        onClick = onEndRoute,
                        modifier = Modifier.semantics { contentDescription = endRouteLabel }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = null,
                            tint = KozmosThemeTokens.primitivesColorsEmotionalDanger600
                        )
                    }
                }
            }

            if (state == KozmosRouteSummaryState.Preview && onStartNavigation != null) {
                KozmosButton(
                    onClick = onStartNavigation,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null)
                    Text(startNavigationLabel)
                }
            }
        }
    }
}

/**
 * The navigation layout: the destination's name with End beside it in the
 * danger outline; the time, distance and arrival on one row; the caller's
 * `progress` — a `KozmosRouteProgressRail`, in the products — below. The
 * layout above is unchanged.
 */
@Composable
fun KozmosRouteSummary(
    destination: String,
    durationText: String,
    distanceText: String,
    onEndRoute: () -> Unit,
    modifier: Modifier = Modifier,
    arrivalText: String? = null,
    endLabel: String = "End",
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    progress: (@Composable () -> Unit)? = null
) = KozmosRouteSummary(destination, durationText, distanceText, onEndRoute, null,
    modifier, arrivalText, endLabel, surface, null, progress = progress)

/**
 * The navigation layout with optional remaining estimates and decorative
 * destination media. [presentation] null follows where it is: hosted in the
 * map shell's panel, with no surface, radius, shadow or padding of its own
 * (decision 43), and standalone elsewhere.
 *
 * [actions] follow the [progress]: the journey's actions, Previous and Next
 * in static wayfinding, Go and Details in the route preview. They are laid
 * out in equal columns in reading order, each as tall as the tallest, and a
 * KozmosButton there fills its column, its label wrapping, its 48dp touch
 * target kept. The host owns what they do, when they are disabled, and
 * announcing the new step. [actions] comes before [progress], so a trailing
 * lambda is still the progress.
 *
 * Without [onEndRoute] there is no End: the route preview, where
 * [locationText] is the place's line under the destination, muted.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KozmosRouteSummary(
    destination: String,
    durationText: String? = null,
    distanceText: String? = null,
    onEndRoute: (() -> Unit)? = null,
    presentation: KozmosRoutePresentation? = null,
    modifier: Modifier = Modifier,
    arrivalText: String? = null,
    endLabel: String = "End",
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    destinationImage: String? = null,
    locationText: String? = null,
    actions: (@Composable () -> Unit)? = null,
    progress: (@Composable () -> Unit)? = null
) {
    val placed = presentation
        ?: if (LocalKozmosPanelSurface.current == null) KozmosRoutePresentation.Standalone else KozmosRoutePresentation.Hosted
    KozmosRoutePanelSurface(placed, surface, modifier) {
        Column(
            modifier = Modifier
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                if (!destinationImage.isNullOrEmpty()) {
                    KozmosDestinationImage(destinationImage)
                    Spacer(Modifier.size(KozmosDimensions.primitivesLayoutSpacing150))
                }
                if (locationText.isNullOrEmpty()) {
                    RouteSummaryTitle(destination, Modifier.weight(1f))
                } else {
                    Column(Modifier.weight(1f)) {
                        RouteSummaryTitle(destination)
                        // Muted, and on glass the foreground colour (decision 48).
                        Text(text = locationText, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
                    }
                }
                if (onEndRoute != null) {
                    Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing150))
                    KozmosButton(
                        onClick = onEndRoute,
                        variant = KozmosButtonVariant.Outline,
                        emotion = KozmosButtonEmotion.Danger,
                        size = KozmosButtonSize.Sm
                    ) {
                        Text(endLabel)
                    }
                }
            }
            if (!durationText.isNullOrEmpty() || !distanceText.isNullOrEmpty() || !arrivalText.isNullOrEmpty()) FlowRow(
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50),
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics(mergeDescendants = true) {}
            ) {
                CompositionLocalProvider(LocalContentColor provides KozmosThemeTokens.primitivesColorsForeground100) {
                    if (!durationText.isNullOrEmpty()) Text(
                        text = durationText,
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                    )
                    if (!distanceText.isNullOrEmpty()) Text(text = distanceText, style = MaterialTheme.typography.bodyLarge)
                    if (!arrivalText.isNullOrEmpty()) {
                        Text(text = arrivalText, style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier.weight(1f), textAlign = TextAlign.End)
                    }
                }
            }
            progress?.invoke()
            if (actions != null) KozmosEqualColumns(KozmosDimensions.primitivesLayoutSpacing100, Modifier.fillMaxWidth(), actions)
        }
    }
}

@Composable
private fun RouteSummaryTitle(destination: String, modifier: Modifier = Modifier) {
    Text(
        text = destination,
        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
        color = KozmosThemeTokens.primitivesColorsForeground100,
        modifier = modifier.semantics { heading() }
    )
}

/**
 * One column per child, all the same width, [spacing] apart, in reading
 * order (placed relative, so they mirror in right-to-left): the route
 * summary's actions, as the web's `.kozmos-route-summary-actions` grid draws
 * them. Not a weighted Row: a weight that does not fill leaves space at the
 * row's end. Each child is measured to its column's width; one shorter than
 * the tallest is stretched to it, and one as tall keeps its own measure, so
 * a KozmosButton still draws 44dp inside its 48dp touch target. Children
 * are measured by their intrinsic height, so they are Buttons, not lazy
 * lists.
 */
@Composable
internal fun KozmosEqualColumns(spacing: Dp, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Layout(content, modifier) { measurables, constraints ->
        if (measurables.isEmpty()) return@Layout layout(constraints.minWidth, constraints.minHeight) {}
        val count = measurables.size
        val gap = spacing.roundToPx()
        val width = if (constraints.hasBoundedWidth) constraints.maxWidth
            else measurables.maxOf { it.maxIntrinsicWidth(Constraints.Infinity) } * count + gap * (count - 1)
        val column = ((width - gap * (count - 1)) / count).coerceAtLeast(0)
        val heights = measurables.map { it.maxIntrinsicHeight(column) }
        val row = heights.max().coerceIn(constraints.minHeight, constraints.maxHeight)
        val placeables = measurables.mapIndexed { index, child ->
            child.measure(Constraints(column, column, if (heights[index] < row) row else 0, row))
        }
        layout(width, row) {
            placeables.forEachIndexed { index, placeable ->
                placeable.placeRelative(index * (column + gap), (row - placeable.height) / 2)
            }
        }
    }
}
