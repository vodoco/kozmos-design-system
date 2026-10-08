package com.kozmos.components.routeoptioncard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Accessible
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A selectable route option.
 *
 * Mirrors the React `RouteOptionCard`. The card never changes its own selected
 * state — it reports selection and re-renders from the supplied presentation.
 */
@Composable
fun KozmosRouteOptionCard(
    option: KozmosRouteOptionPresentation,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: (@Composable () -> Unit)? = null
) {
    val isEnabled = enabled && option.available
    val accessibilityDescription = listOfNotNull(
        option.label,
        option.durationLabel,
        option.distanceLabel,
        option.warning
    ).joinToString(", ")

    Surface(
        onClick = { onSelect(option.id) },
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 96.dp)
            .semantics {
                contentDescription = accessibilityDescription
                selected = option.selected
            },
        enabled = isEnabled,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
        // A card of its own: the background colour, and the chosen one the
        // theme's 5% tint on it. The tint lay over nothing, so on a glass
        // sheet the map showed through the chosen option while the others
        // stood opaque. The tint, the chosen edge and the icon are theme/600,
        // as React's are (decision 59); they were theme/500.
        color = if (option.selected) {
            KozmosThemeTokens.primitivesColorsTheme600.copy(alpha = 0.05f)
                .compositeOver(KozmosThemeTokens.primitivesColorsBackground0)
        } else {
            KozmosThemeTokens.primitivesColorsBackground0
        },
        border = BorderStroke(
            width = if (option.selected) 2.dp else 1.dp,
            color = if (option.selected) {
                KozmosThemeTokens.primitivesColorsTheme600
            } else {
                KozmosThemeTokens.semanticsBorderSubtle
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing150),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                if (icon != null) {
                    icon()
                } else {
                    Icon(
                        imageVector = when (option.preference) {
                            KozmosRoutePreference.Quickest -> Icons.Default.Schedule
                            KozmosRoutePreference.StepFree -> Icons.AutoMirrored.Filled.Accessible
                            KozmosRoutePreference.Custom -> Icons.Default.Tune
                        },
                        contentDescription = null,
                        tint = KozmosThemeTokens.primitivesColorsTheme600
                    )
                }

                Text(
                    text = option.label,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = KozmosThemeTokens.primitivesColorsForeground100,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = option.durationLabel,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = KozmosThemeTokens.primitivesColorsForeground100
                )

                Text(
                    text = option.distanceLabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = KozmosThemeTokens.primitivesColorsForeground500
                )
            }

            option.warning?.let { warning ->
                Text(
                    text = warning,
                    style = MaterialTheme.typography.bodySmall,
                    color = KozmosThemeTokens.primitivesColorsEmotionalAlert600
                )
            }
        }
    }
}
