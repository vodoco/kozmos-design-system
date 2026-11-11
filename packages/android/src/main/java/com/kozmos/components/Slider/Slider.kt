package com.kozmos.components.slider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A slider. With [showValue], its value is drawn at its end, beside the track,
 * at rest as well as while it moves (GAP-163), as [formatValue] writes it, or
 * as the number. The readout is for the eye: TalkBack hears the slider's own
 * value, which [formatValue] words when it is given, so it is said once.
 */
@Composable
fun KozmosSlider(
    value: Float,
    onValueChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
    valueRange: ClosedFloatingPointRange<Float> = 0f..1f,
    enabled: Boolean = true,
    showValue: Boolean = false,
    formatValue: ((Float) -> String)? = null
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val worded = formatValue?.invoke(value)
    val slider: @Composable (Modifier) -> Unit = { sliderModifier ->
        Slider(
            value = value,
            onValueChange = onValueChange,
            onValueChangeFinished = {
                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Slider", eventName = "slider_value_changed", properties = mapOf("value" to value.toString())))
            },
            modifier = if (worded != null) sliderModifier.semantics { stateDescription = worded } else sliderModifier,
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
    if (!showValue) {
        slider(modifier)
        return
    }
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        slider(Modifier.weight(1f))
        Text(
            text = worded ?: formatSliderValue(value),
            style = MaterialTheme.typography.bodyMedium.copy(fontFeatureSettings = "tnum"),
            color = if (enabled) KozmosThemeTokens.primitivesColorsForeground400 else KozmosThemeTokens.primitivesColorsForeground500,
            maxLines = 1,
            // Drawn for the eye; the slider says its value itself.
            modifier = Modifier.clearAndSetSemantics { }
        )
    }
}

/** The number as React shows it: a whole number without a decimal point. */
internal fun formatSliderValue(value: Float): String =
    if (value % 1f == 0f) value.toInt().toString() else value.toString()
