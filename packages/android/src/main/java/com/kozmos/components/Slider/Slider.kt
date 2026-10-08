package com.kozmos.components.slider

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    enabled: Boolean = true
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    Slider(
        value = value,
        onValueChange = onValueChange,
        onValueChangeFinished = {
            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Slider", eventName = "slider_value_changed", properties = mapOf("value" to value.toString())))
        },
        modifier = modifier,
        valueRange = valueRange,
        enabled = enabled,
        colors = SliderDefaults.colors(
            // Theme/600, as React and Figma draw it (decision 59): the range
            // against its track fails contrast at theme/500.
            thumbColor = KozmosThemeTokens.primitivesColorsTheme600,
            activeTrackColor = KozmosThemeTokens.primitivesColorsTheme600,
            inactiveTrackColor = KozmosThemeTokens.primitivesColorsBackground300,
        )
    )
}
