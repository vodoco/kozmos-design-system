package com.kozmos.components.savelocationcard

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.button.KozmosButton
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle

/**
 * [surface] is what the card is made of, as React's `surface` prop:
 * [KozmosSurfaceStyle.Solid] (the default) or [KozmosSurfaceStyle.Glass], for a
 * card over the map. Until 2026-09-22 Compose drew it solid only.
 */
@Composable
fun KozmosSaveLocationCard(
    modifier: Modifier = Modifier,
    surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    title: String = "Mark My Car",
    description: String = "Remember where you parked",
    isSaved: Boolean = false,
    onSaveToggle: (() -> Unit)? = null,
    onRouteToLocation: (() -> Unit)? = null,
    onEditNote: (() -> Unit)? = null
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
        Column(
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200),
            modifier = Modifier
                .fillMaxWidth()
                .padding(KozmosDimensions.primitivesLayoutSpacing300)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200),
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = CircleShape,
                    color = if (isSaved) KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle else KozmosThemeTokens.primitivesColorsBackground0,
                    border = BorderStroke(1.dp, KozmosThemeTokens.primitivesColorsForeground900.copy(alpha = 0.08f))
                ) {
                    androidx.compose.foundation.layout.Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.DirectionsCar,
                            contentDescription = null,
                            tint = if (isSaved) KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle else KozmosThemeTokens.primitivesColorsForeground100
                        )
                    }
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(text = title, style = MaterialTheme.typography.titleMedium, color = KozmosThemeTokens.primitivesColorsForeground100)
                    Text(text = description, style = MaterialTheme.typography.bodyMedium, color = KozmosThemeTokens.primitivesColorsForeground500)
                }

                if (isSaved && onEditNote != null) {
                    IconButton(
                        onClick = onEditNote,
                        modifier = Modifier.semantics { contentDescription = "Edit location note" }
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground500)
                    }
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isSaved) {
                    OutlinedButton(
                        onClick = {
                            trackEvent(KozmosAnalyticsEvent(component = "SaveLocationCard", eventName = "save_toggled", properties = mapOf("isSaved" to (!isSaved).toString())))
                            onSaveToggle?.invoke()
                        },
                        modifier = Modifier.weight(1f),
                        border = BorderStroke(1.dp, KozmosThemeTokens.primitivesColorsTheme500),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = KozmosThemeTokens.primitivesColorsTheme500)
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null)
                        Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing100))
                        Text("Remove Location")
                    }
                } else {
                    KozmosButton(
                        onClick = {
                            trackEvent(KozmosAnalyticsEvent(component = "SaveLocationCard", eventName = "save_toggled", properties = mapOf("isSaved" to (!isSaved).toString())))
                            onSaveToggle?.invoke()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null)
                        Text("Save Location")
                    }
                }

                if (isSaved && onRouteToLocation != null) {
                    KozmosButton(
                        onClick = {
                            trackEvent(KozmosAnalyticsEvent(component = "SaveLocationCard", eventName = "route_requested"))
                            onRouteToLocation()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Navigation, contentDescription = null)
                        Text("Guide Me")
                    }
                }
            }
        }
    }
}
