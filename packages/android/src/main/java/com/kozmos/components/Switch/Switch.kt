package com.kozmos.components.switch

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosInertAlpha
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    error: Boolean = false
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    // Checked, the track is the theme fill and the thumb on it a mark in the
    // theme foreground, the same in both themes (decision 59): background/0
    // turned the thumb black on it in the dark. Disabled, it keeps those
    // colours and the whole switch, label too, is drawn at half, as React's
    // `disabled:opacity-50` draws it: it was foreground/500 with a
    // background/0 thumb, a grey that was no longer the fill.
    val themed = checked && !error
    val checkedTrackColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }
    val uncheckedTrackColor = KozmosThemeTokens.primitivesColorsForeground500
    val trackColor = if (checked) checkedTrackColor else uncheckedTrackColor
    val trackBorderColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        trackColor
    }
    val thumbColor = if (themed) {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }
    val labelColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        MaterialTheme.colorScheme.onSurface
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .alpha(if (enabled) 1f else KozmosInertAlpha)
            .heightIn(min = 44.dp)
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Switch,
                onValueChange = {
                    trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Switch", eventName = "switch_toggled", properties = mapOf("checked" to it.toString())))
                    onCheckedChange(it)
                }
            )
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        Box(
            modifier = Modifier
                .width(44.dp)
                .height(24.dp)
                .background(trackColor, CircleShape)
                .border(2.dp, trackBorderColor, CircleShape)
        ) {
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .align(Alignment.CenterStart)
                    .offset(x = if (checked) 22.dp else 2.dp)
                    .background(thumbColor, CircleShape)
            )
        }
        if (label != null) {
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = labelColor
            )
        }
    }
}
