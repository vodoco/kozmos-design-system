package com.kozmos.components.checkbox

import com.kozmos.components.KozmosControlText
import com.kozmos.components.KozmosInertAlpha
import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.selection.toggleable
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosCheckbox(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String? = null,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    error: Boolean = false,
    description: String? = null
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    // Checked, the box is the theme fill and its check the theme foreground,
    // the same in both themes (decision 59): background/0 turned the check
    // black on it in the dark.
    val checkedColor = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    val uncheckedColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }
    val labelColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        // Full ink, foreground/0, as React's text-foreground label is: every
        // control's label is the same colour on every platform.
        KozmosThemeTokens.primitivesColorsForeground0
    }

    // Disabled, the checkbox keeps its own colours, checked the theme fill
    // and its check, and the whole of it, label too, is drawn at half, as
    // React's `disabled:opacity-50` draws it, not in Material's grey
    // (decision 59).
    // With a description the box sits on the label's first line, not halfway
    // down the two; the row is still one node, its label read first and the
    // description after it (GAP-162).
    Row(
        verticalAlignment = if (description != null) Alignment.Top else Alignment.CenterVertically,
        modifier = modifier
            .alpha(if (enabled) 1f else KozmosInertAlpha)
            .heightIn(min = 44.dp)
            // A checkbox to TalkBack, checked or not: a bare clickable row
            // was heard as its words and nothing of its state.
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Checkbox,
                onValueChange = {
                    trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Checkbox", eventName = "checkbox_toggled", properties = mapOf("checked" to it.toString())))
                    onCheckedChange(it)
                }
            )
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        Checkbox(
            checked = checked,
            onCheckedChange = null, // Handled by Row clickable for better touch target
            enabled = enabled,
            colors = CheckboxDefaults.colors(
                checkedColor = checkedColor,
                uncheckedColor = uncheckedColor,
                checkmarkColor = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
                disabledCheckedColor = checkedColor,
                disabledUncheckedColor = uncheckedColor,
                disabledIndeterminateColor = checkedColor
            )
        )
        
        if (label != null || description != null) {
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            KozmosControlText(label = label, labelColor = labelColor, description = description)
        }
    }
}
