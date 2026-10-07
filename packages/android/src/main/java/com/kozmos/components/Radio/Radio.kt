package com.kozmos.components.radio

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosRadioGroup(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = modifier.selectableGroup()) {
        content()
    }
}

@Composable
fun KozmosRadioGroupItem(
    value: String,
    selectedValue: String,
    onOptionSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    enabled: Boolean = true,
    error: Boolean = false
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    val selected = value == selectedValue
    // Selected, the ring is a border on the surface, theme 600, and the dot a
    // fill, the theme fill, theme 500 in both themes (decision 59). They were
    // one colour, theme 500, which read 3.13:1 as a ring on the dark greys.
    val selectedColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.primitivesColorsTheme600
    }
    val dotColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }
    val unselectedColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }
    val disabledColor = KozmosThemeTokens.primitivesColorsForeground500
    val labelColor = when {
        error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        !enabled -> disabledColor
        else -> MaterialTheme.colorScheme.onSurface
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .selectable(
                selected = selected,
                enabled = enabled,
                onClick = { 
                    trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "RadioGroup", eventName = "radio_selection_changed", properties = mapOf("value" to value.toString())))
                    onOptionSelected(value) 
                },
                role = Role.RadioButton
            )
            .padding(vertical = KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically
    ) {
        KozmosRadioMark(
            selected = selected,
            ring = when {
                !enabled -> disabledColor
                selected -> selectedColor
                else -> unselectedColor
            },
            dot = if (enabled) dotColor else disabledColor
        )
        if (label != null) {
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge,
                color = labelColor
            )
        }
    }
}

/**
 * The radio itself, drawn to Material's RadioButton measure — a 20dp ring of
 * 2dp in a 2dp pad, its 12dp dot growing in over 100ms — because Material's
 * draws its ring and its dot in one colour, and decision 59 tells them apart:
 * the ring is a border, the dot a fill. Like Material's with no `onClick`, it
 * has no semantics of its own: the row it sits in is the selectable.
 */
@Composable
private fun KozmosRadioMark(selected: Boolean, ring: Color, dot: Color) {
    val dotRadius by animateDpAsState(if (selected) 6.dp else 0.dp, tween(100), label = "kozmos-radio-dot")
    val ringColor by animateColorAsState(ring, tween(100), label = "kozmos-radio-ring")
    val dotColor by animateColorAsState(dot, tween(100), label = "kozmos-radio-dot-colour")
    Canvas(Modifier.wrapContentSize(Alignment.Center).padding(2.dp).requiredSize(20.dp)) {
        val stroke = 2.dp.toPx()
        drawCircle(ringColor, radius = 10.dp.toPx() - stroke / 2, style = Stroke(stroke))
        if (dotRadius > 0.dp) drawCircle(dotColor, radius = dotRadius.toPx() - stroke / 2)
    }
}
