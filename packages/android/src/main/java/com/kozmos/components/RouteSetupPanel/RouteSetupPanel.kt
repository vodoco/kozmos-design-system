package com.kozmos.components.routesetuppanel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonSize
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.kozmosMutedForeground
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.utils.KozmosRoutePanelSurface

/** Hosted setup. The host owns point validation, requests, cancellation, focus and dismissal. */
@Composable
fun KozmosRouteSetupPanel(
    ready: Boolean, onContinue: () -> Unit, onClose: () -> Unit, modifier: Modifier = Modifier,
    pending: Boolean = false, title: String = "Set up a route", description: String? = null,
    continueLabel: String = "Continue", closeLabel: String = "Close route setup",
    presentation: KozmosRoutePresentation = KozmosRoutePresentation.Hosted, surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid,
    content: @Composable ColumnScope.() -> Unit
) {
    KozmosRoutePanelSurface(presentation, surface, modifier) {
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)) {
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)) {
                Text(title, modifier = Modifier.weight(1f).semantics { heading() }, style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold, color = KozmosThemeTokens.primitivesColorsForeground100)
                KozmosIconButton(Icons.Default.Close, onClose, closeLabel, variant = KozmosIconButtonVariant.Outline, size = KozmosIconButtonSize.Lg)
            }
            if (!description.isNullOrEmpty()) Text(description, style = MaterialTheme.typography.bodyMedium, color = kozmosMutedForeground())
            content()
            KozmosButton(onClick = { if (ready && !pending) onContinue() }, enabled = ready && !pending, modifier = Modifier.fillMaxWidth()) { Text(continueLabel) }
        }
    }
}
