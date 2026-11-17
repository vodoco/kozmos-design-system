package com.kozmos.components.switch

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.selection.triStateToggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosControlText
import com.kozmos.components.KozmosInertAlpha
import com.kozmos.components.fieldwrapper.KozmosMixedDash
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A switch, on or off. With several features selected whose settings differ
 * it can be [mixed] (decisions 188, 189), as React's and SwiftUI's can:
 * drawn neither on nor off, the track filled as when on with a dash in place
 * of the thumb. TalkBack is given Compose's mixed state, Indeterminate, with
 * [mixedLabel], "Multiple values", said as its state in place of on or off:
 * a switch is never "partially checked". A click turns it on:
 * [onCheckedChange] gets `true`, and the product clears [mixed].
 * [onResetMixed] offers [resetMixedLabel] under the switch once it is no
 * longer mixed, never while it is disabled; pressed, focus goes back to the
 * switch and the product sets [mixed] again.
 */
@Composable
fun KozmosSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: String? = null,
    error: Boolean = false,
    description: String? = null,
    showStateLabel: Boolean = false,
    onLabel: String = "On",
    offLabel: String = "Off",
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    // The reset stacks under the switch only when it is offered, so a switch
    // without one is the row it always was, the caller's modifier its own.
    // The reset goes as the switch turns mixed again, and the row is drawn
    // anew without it: focus goes back to the switch once it is, as on the
    // web.
    val focus = remember { FocusRequester() }
    var refocus by remember { mutableStateOf(false) }
    val rowModifier = if (onResetMixed != null) modifier.focusRequester(focus) else modifier
    if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled)) {
        Column {
            KozmosSwitchRow(
                checked, onCheckedChange, rowModifier, enabled, label, error,
                description, showStateLabel, onLabel, offLabel, mixed, mixedLabel
            )
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                refocus = true
                onResetMixed?.invoke()
            })
        }
    } else {
        KozmosSwitchRow(
            checked, onCheckedChange, rowModifier, enabled, label, error,
            description, showStateLabel, onLabel, offLabel, mixed, mixedLabel
        )
    }
    if (refocus) {
        LaunchedEffect(Unit) {
            focus.requestFocus()
            refocus = false
        }
    }
}

@Composable
private fun KozmosSwitchRow(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier,
    enabled: Boolean,
    label: String?,
    error: Boolean,
    description: String?,
    showStateLabel: Boolean,
    onLabel: String,
    offLabel: String,
    mixed: Boolean,
    mixedLabel: String
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    // Checked, the track is the theme fill and the thumb on it a mark in the
    // theme foreground, the same in both themes (decision 59): background/0
    // turned the thumb black on it in the dark. Disabled, it keeps those
    // colours and the whole switch, label too, is drawn at half, as React's
    // `disabled:opacity-50` draws it: it was foreground/500 with a
    // background/0 thumb, a grey that was no longer the fill.
    // Mixed, the track is filled as when on (decision 189).
    val filled = checked || mixed
    val themed = filled && !error
    val checkedTrackColor = if (error) {
        KozmosThemeTokens.primitivesColorsEmotionalDanger600
    } else {
        KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }
    // Unchecked, the track is the muted colour, foreground/400, as React's
    // `border-muted-foreground bg-muted-foreground` is (owner, 24 Oct); it was
    // foreground/500, which a disabled switch keeps.
    val uncheckedTrackColor = if (enabled) {
        KozmosThemeTokens.primitivesColorsForeground400
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }
    val trackColor = if (filled) checkedTrackColor else uncheckedTrackColor
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
        // Full ink, foreground/0, as React's text-foreground label is: every
        // control's label is the same colour on every platform.
        KozmosThemeTokens.primitivesColorsForeground0
    }

    // With a description the track sits on the label's first line; the row
    // is still one node, its label read first and the description after it
    // (GAP-162).
    Row(
        verticalAlignment = if (description != null) Alignment.Top else Alignment.CenterVertically,
        modifier = modifier
            .alpha(if (enabled) 1f else KozmosInertAlpha)
            .heightIn(min = 44.dp)
            .then(
                if (mixed) {
                    // Compose's mixed state, said as the mixed label in
                    // place of on or off; a click turns it on.
                    Modifier
                        .semantics { stateDescription = mixedLabel }
                        .triStateToggleable(
                            state = ToggleableState.Indeterminate,
                            enabled = enabled,
                            role = Role.Switch,
                            onClick = {
                                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Switch", eventName = "switch_toggled", properties = mapOf("checked" to "true")))
                                onCheckedChange(true)
                            }
                        )
                } else {
                    Modifier.toggleable(
                        value = checked,
                        enabled = enabled,
                        role = Role.Switch,
                        onValueChange = {
                            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Switch", eventName = "switch_toggled", properties = mapOf("checked" to it.toString())))
                            onCheckedChange(it)
                        }
                    )
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
            if (mixed) {
                // No thumb: Checkbox's dash, React's minus at 16, in the
                // thumb's colour, in the middle of the track.
                KozmosMixedDash(color = thumbColor, modifier = Modifier.align(Alignment.Center))
            } else {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .align(Alignment.CenterStart)
                        .offset(x = if (checked) 22.dp else 2.dp)
                        .background(thumbColor, CircleShape)
                )
            }
        }
        if (showStateLabel) {
            // The state in words, after the track (GAP-162). Drawn, never
            // read: the Switch role already says on or off, in the visitor's
            // language, and the words would say it twice.
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            Text(
                text = if (mixed) mixedLabel else if (checked) onLabel else offLabel,
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground400,
                modifier = Modifier
                    .padding(top = if (description != null) KozmosDimensions.primitivesLayoutSpacing25 else 0.dp)
                    .clearAndSetSemantics {}
            )
        }
        if (label != null || description != null) {
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            KozmosControlText(label = label, labelColor = labelColor, description = description)
        }
    }
}

