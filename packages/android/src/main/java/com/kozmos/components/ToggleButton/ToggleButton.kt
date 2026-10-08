package com.kozmos.components.togglebutton

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class KozmosToggleButtonVariant {
    Default, Outline
}

enum class KozmosToggleButtonSize {
    Small, Default, Large
}

@Composable
fun KozmosToggleButton(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    icon: ImageVector? = null,
    variant: KozmosToggleButtonVariant = KozmosToggleButtonVariant.Default,
    size: KozmosToggleButtonSize = KozmosToggleButtonSize.Default
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val hPadding = when (size) {
        KozmosToggleButtonSize.Small -> KozmosDimensions.primitivesLayoutSpacing150
        KozmosToggleButtonSize.Default -> KozmosDimensions.primitivesLayoutSpacing200
        KozmosToggleButtonSize.Large -> KozmosDimensions.primitivesLayoutSpacing300
    }
    
    val vPadding = when (size) {
        KozmosToggleButtonSize.Small -> KozmosDimensions.primitivesLayoutSpacing50
        KozmosToggleButtonSize.Default -> KozmosDimensions.primitivesLayoutSpacing100
        KozmosToggleButtonSize.Large -> KozmosDimensions.primitivesLayoutSpacing150
    }

    val minHeight = when (size) {
        KozmosToggleButtonSize.Small -> 32.dp
        KozmosToggleButtonSize.Default -> 36.dp
        KozmosToggleButtonSize.Large -> 40.dp
    }

    // On, the default variant is the theme fill with the theme foreground on
    // it, the same in both themes (decision 59): background/0 turned its
    // label black on it in the dark.
    val backgroundColor = if (checked) {
        if (variant == KozmosToggleButtonVariant.Outline) KozmosThemeTokens.primitivesColorsBackground200 else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    } else {
        if (variant == KozmosToggleButtonVariant.Outline) Color.Transparent else KozmosThemeTokens.primitivesColorsBackground100
    }

    val contentColor = if (checked) {
        if (variant == KozmosToggleButtonVariant.Outline) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    } else {
        KozmosThemeTokens.primitivesColorsForeground100
    }

    Surface(
        checked = checked,
        onCheckedChange = { 
            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "ToggleButton", eventName = "toggle_pressed", properties = mapOf("pressed" to it.toString())))
            onCheckedChange(it) 
        },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = backgroundColor,
        modifier = modifier
            .defaultMinSize(minHeight = minHeight)
            .then(
                if (variant == KozmosToggleButtonVariant.Outline) {
                    Modifier.border(
                        1.dp,
                        if (checked) KozmosThemeTokens.primitivesColorsBackground400 else KozmosThemeTokens.primitivesColorsBackground300,
                        RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
                    )
                } else Modifier
            )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.padding(horizontal = hPadding, vertical = vPadding)
        ) {
            if (icon != null) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = contentColor
                )
                if (label != null) {
                    Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
                }
            }
            if (label != null) {
                Text(
                    text = label,
                    color = contentColor,
                    style = when (size) {
                        KozmosToggleButtonSize.Small -> MaterialTheme.typography.labelMedium
                        KozmosToggleButtonSize.Default -> MaterialTheme.typography.labelLarge
                        KozmosToggleButtonSize.Large -> MaterialTheme.typography.titleMedium
                    }
                )
            }
        }
    }
}
