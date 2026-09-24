package com.kozmos.components.routesummary

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.text.style.TextOverflow
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.button.KozmosButtonEmotion
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class KozmosRouteSummaryState {
    Active,
    Preview
}

@Composable
fun KozmosRouteSummary(
    etaText: String,
    distanceText: String,
    onEndRoute: () -> Unit,
    modifier: Modifier = Modifier,
    state: KozmosRouteSummaryState = KozmosRouteSummaryState.Active,
    onStartNavigation: (() -> Unit)? = null,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
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
                    Text(
                        text = distanceText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = KozmosThemeTokens.primitivesColorsForeground500
                    )
                }

                if (state == KozmosRouteSummaryState.Active) {
                    IconButton(
                        onClick = onEndRoute,
                        modifier = Modifier
                            .size(40.dp)
                            .semantics { contentDescription = "End route" }
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
                    Text("Start Navigation")
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
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = destination,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                    color = KozmosThemeTokens.primitivesColorsForeground100,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f).semantics { heading() }
                )
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
            Row(
                verticalAlignment = Alignment.Bottom,
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics(mergeDescendants = true) {}
            ) {
                CompositionLocalProvider(LocalContentColor provides KozmosThemeTokens.primitivesColorsForeground100) {
                    Text(
                        text = durationText,
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold)
                    )
                    Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing150))
                    Text(text = distanceText, style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.weight(1f))
                    if (arrivalText != null) {
                        Text(text = arrivalText, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
            progress?.invoke()
        }
    }
}
