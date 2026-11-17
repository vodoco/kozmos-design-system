package com.kozmos.components.togglebutton

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.components.fieldwrapper.KozmosMixedDash
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

/**
 * A button that holds a pressed state. With several features selected that
 * differ it can be [mixed] (decisions 188, 190), as React's
 * `aria-pressed="mixed"` toggle: a dashed theme edge on the muted fill and a
 * dash before its label. TalkBack is given Compose's own mixed state,
 * Indeterminate, which it says as "Partially checked". A click turns it on:
 * [onCheckedChange] gets `true`, and the product clears [mixed].
 * [onResetMixed] offers [resetMixedLabel] under the toggle once it is no
 * longer mixed; pressed, focus goes back to the toggle and the product sets
 * [mixed] again.
 */
@Composable
fun KozmosToggleButton(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    icon: ImageVector? = null,
    variant: KozmosToggleButtonVariant = KozmosToggleButtonVariant.Default,
    size: KozmosToggleButtonSize = KozmosToggleButtonSize.Default,
    // What TalkBack calls the icon, in the product's words, as
    // KozmosIconButton's. A toggle with only an icon needs it, as React's
    // needs an `aria-label`: without it the toggle has no name. Beside a
    // label, leave it out: the label names the toggle, and TalkBack would say
    // both. Last, so a call by position still compiles.
    contentDescription: String? = null,
    mixed: Boolean = false,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    // The reset stacks under the toggle only when it is offered, so a toggle
    // without one is the surface it always was, the caller's modifier its
    // own. The reset goes as the toggle turns mixed again, and the surface
    // is drawn anew without it: focus goes back to the toggle once it is.
    val focus = remember { FocusRequester() }
    var refocus by remember { mutableStateOf(false) }
    val surfaceModifier = if (onResetMixed != null) modifier.focusRequester(focus) else modifier
    if (KozmosMixedValue.showsReset(mixed, onResetMixed, enabled = true)) {
        Column {
            KozmosToggleButtonSurface(
                checked, onCheckedChange, surfaceModifier, label, icon,
                variant, size, contentDescription, mixed
            )
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                refocus = true
                onResetMixed?.invoke()
            })
        }
    } else {
        KozmosToggleButtonSurface(
            checked, onCheckedChange, surfaceModifier, label, icon,
            variant, size, contentDescription, mixed
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
private fun KozmosToggleButtonSurface(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier,
    label: String?,
    icon: ImageVector?,
    variant: KozmosToggleButtonVariant,
    size: KozmosToggleButtonSize,
    contentDescription: String?,
    mixed: Boolean
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
    // Mixed (decision 190): the muted fill, background/100, under the
    // page's ink, in either variant.
    val backgroundColor = if (mixed) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else if (checked) {
        if (variant == KozmosToggleButtonVariant.Outline) KozmosThemeTokens.primitivesColorsBackground200 else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    } else {
        if (variant == KozmosToggleButtonVariant.Outline) Color.Transparent else KozmosThemeTokens.primitivesColorsBackground100
    }

    val contentColor = if (mixed) {
        KozmosThemeTokens.primitivesColorsForeground0
    } else if (checked) {
        if (variant == KozmosToggleButtonVariant.Outline) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    } else {
        KozmosThemeTokens.primitivesColorsForeground100
    }

    Surface(
        // Mixed, the surface is given unpressed, so a click turns it on.
        checked = checked && !mixed,
        onCheckedChange = { 
            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "ToggleButton", eventName = "toggle_pressed", properties = mapOf("pressed" to it.toString())))
            onCheckedChange(it) 
        },
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = backgroundColor,
        modifier = modifier
            // Mixed, Compose's own mixed state, set outside the surface's
            // toggle so it is the one TalkBack is given.
            .then(if (mixed) Modifier.semantics { toggleableState = ToggleableState.Indeterminate } else Modifier)
            .defaultMinSize(minHeight = minHeight)
            .then(
                if (mixed) {
                    // A dashed edge in the theme fill, 1 wide, inside the
                    // shape: dashes of 3 and gaps of 3, as a 1px CSS dashed
                    // border draws them.
                    val edge = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
                    val radius = KozmosDimensions.semanticsRadiusControl
                    Modifier.drawWithContent {
                        drawContent()
                        val width = 1.dp.toPx()
                        val dash = 3.dp.toPx()
                        val corner = radius.toPx() - width / 2f
                        drawRoundRect(
                            color = edge,
                            topLeft = androidx.compose.ui.geometry.Offset(width / 2f, width / 2f),
                            size = androidx.compose.ui.geometry.Size(this.size.width - width, this.size.height - width),
                            cornerRadius = CornerRadius(corner, corner),
                            style = Stroke(width = width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash, dash)))
                        )
                    }
                } else if (variant == KozmosToggleButtonVariant.Outline) {
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
            if (mixed) {
                // Checkbox's dash, before the label.
                KozmosMixedDash(color = contentColor)
                if (icon != null || label != null) {
                    Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
                }
            }
            if (icon != null) {
                Icon(
                    icon,
                    contentDescription = contentDescription,
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
