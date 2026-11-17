package com.kozmos.components.button

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosFillButton
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosButtonVariant {
    Default,
    Destructive,
    Outline,
    Secondary,
    Ghost,
    Link,
    Glass,
    // A pale fill of its own token tier, theme 0 under the theme's words
    // (GAP-200, decision 135); with KozmosButtonEmotion.Danger, the
    // destructive tone of Pointr Cloud's Delete Feature (decision 139).
    Subtle
}

enum class KozmosButtonEmotion {
    Themed,
    Neutral,
    Success,
    Danger,
    Informative,
    Alert
}

enum class KozmosButtonSize {
    Default,
    Sm,
    Lg,
    Icon
}

// The emotion decides the colour where the variant has a tier: Primary is
// filled, Secondary is bordered or text. Glass is an effect and keeps its
// own ground. A filled tier answers a touch with its own tokens: pressed,
// focus and hover (decision 59), never Material's ripple over it.
@Composable
private fun emotionPrimaryFill(e: KozmosButtonEmotion): KozmosFillStates = when (e) {
    KozmosButtonEmotion.Themed -> KozmosFillStates.themed
    KozmosButtonEmotion.Neutral -> KozmosFillStates.neutral
    KozmosButtonEmotion.Success -> KozmosFillStates.success
    KozmosButtonEmotion.Danger -> KozmosFillStates.danger
    KozmosButtonEmotion.Informative -> KozmosFillStates.informative
    KozmosButtonEmotion.Alert -> KozmosFillStates.alert
}

@Composable
private fun emotionSubtleFill(e: KozmosButtonEmotion): KozmosFillStates = when (e) {
    KozmosButtonEmotion.Themed -> KozmosFillStates.subtleThemed
    KozmosButtonEmotion.Neutral -> KozmosFillStates.subtleNeutral
    KozmosButtonEmotion.Success -> KozmosFillStates.subtleSuccess
    KozmosButtonEmotion.Danger -> KozmosFillStates.subtleDanger
    KozmosButtonEmotion.Informative -> KozmosFillStates.subtleInformative
    KozmosButtonEmotion.Alert -> KozmosFillStates.subtleAlert
}

@Composable
private fun emotionSecondaryForeground(e: KozmosButtonEmotion): Color = when (e) {
    KozmosButtonEmotion.Themed -> KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
    KozmosButtonEmotion.Neutral -> KozmosThemeTokens.componentsSecondaryButtonsNeutralButtonForegroundContentIdle
    KozmosButtonEmotion.Success -> KozmosThemeTokens.componentsSecondaryButtonsSuccessButtonForegroundContentIdle
    KozmosButtonEmotion.Danger -> KozmosThemeTokens.componentsSecondaryButtonsDangerButtonForegroundContentIdle
    KozmosButtonEmotion.Informative -> KozmosThemeTokens.componentsSecondaryButtonsInformativeButtonForegroundContentIdle
    KozmosButtonEmotion.Alert -> KozmosThemeTokens.componentsSecondaryButtonsAlertButtonForegroundContentIdle
}

@Composable
fun KozmosButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosButtonVariant = KozmosButtonVariant.Default,
    emotion: KozmosButtonEmotion? = null,
    size: KozmosButtonSize = KozmosButtonSize.Default,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    // The presses, focus and hover the button answers, as Material's own
    // parameter: a caller can watch them or drive them. Unset, the button
    // keeps its own.
    interactionSource: MutableInteractionSource? = null,
    content: @Composable RowScope.() -> Unit
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    // Every size is drawn 44 tall, as on the web, on iOS and in Figma (D7).
    val height = when (size) {
        KozmosButtonSize.Default -> 44.dp
        KozmosButtonSize.Sm -> 44.dp
        KozmosButtonSize.Lg -> 44.dp
        KozmosButtonSize.Icon -> 44.dp
    }

    // A labelled surface grows with its label, and Material's minimum
    // interactive size keeps its touch target at Android's 48dp, the 44
    // centred in it. The icon size stays the fixed 44 square.
    //
    // Disabled, the button is drawn from the disabled pair (decision 197,
    // GAP-218), as React's is, not at half and not in Material's grey: its
    // label, icon and spinner in the disabled foreground; a filled variant,
    // any emotion's fill, and a ghost on the disabled fill, so a ghost never
    // reads as an enabled grey one; an outline on no fill, its edge in the
    // foreground too; a link on no fill, as an enabled one is coloured;
    // glass on its own glass. At half, a white label on the theme fill read
    // 2.24:1 on a white card.
    //
    // Loading is busy, not unavailable (decision 197, round two): it keeps
    // its variant's own fill, edge and label at full strength, its spinner
    // in the label's colour, and takes no press. Disabled and loading, it is
    // drawn disabled.
    val inert = !enabled || isLoading
    val disabled = !enabled
    val busy = enabled && isLoading
    val disabledInk = KozmosThemeTokens.semanticsDisabledForeground
    val disabledFill = KozmosThemeTokens.semanticsDisabledFill
    val rootModifier = if (size == KozmosButtonSize.Icon) {
        modifier.height(height).then(Modifier.width(44.dp))
    } else {
        modifier.minimumInteractiveComponentSize().heightIn(min = height)
    }
    
    val contentPadding = when (size) {
        KozmosButtonSize.Default -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing200, vertical = KozmosDimensions.primitivesLayoutSpacing100)
        KozmosButtonSize.Sm -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing150, vertical = KozmosDimensions.primitivesLayoutSpacing100)
        KozmosButtonSize.Lg -> PaddingValues(horizontal = KozmosDimensions.primitivesLayoutSpacing400, vertical = KozmosDimensions.primitivesLayoutSpacing100)
        KozmosButtonSize.Icon -> PaddingValues(0.dp)
    }

    // Dimension token graph synced from build.mjs
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    when (variant) {
        KozmosButtonVariant.Outline -> {
            val outlineColor = if (emotion != null) emotionSecondaryForeground(emotion)
                else KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
            OutlinedButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                shape = shape,
                interactionSource = source,
                contentPadding = contentPadding,
                border = BorderStroke(1.dp, if (disabled) disabledInk else outlineColor),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = outlineColor,
                    disabledContentColor = if (disabled) disabledInk else outlineColor
                )
            ) {
                ButtonContent(isLoading, content)
            }
        }
        KozmosButtonVariant.Ghost, KozmosButtonVariant.Link -> {
            val textColor = if (emotion != null) emotionSecondaryForeground(emotion)
                else KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
            TextButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                shape = shape,
                interactionSource = source,
                contentPadding = contentPadding,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = textColor,
                    // A disabled ghost on the disabled fill; a link on none.
                    disabledContainerColor = if (disabled && variant == KozmosButtonVariant.Ghost) disabledFill else Color.Transparent,
                    disabledContentColor = if (disabled) disabledInk else textColor
                )
            ) {
                ButtonContent(isLoading, content)
            }
        }
        else -> {
            // Default, Destructive, Secondary, Subtle, Glass. Every one but
            // Glass is a fill with its own pressed, focus and hover tokens;
            // Subtle's are its own tier's.
            val fill: KozmosFillStates? = when {
                variant == KozmosButtonVariant.Glass -> null
                variant == KozmosButtonVariant.Subtle -> emotionSubtleFill(emotion ?: KozmosButtonEmotion.Themed)
                emotion != null -> emotionPrimaryFill(emotion)
                variant == KozmosButtonVariant.Destructive -> KozmosFillStates.danger
                variant == KozmosButtonVariant.Secondary -> KozmosFillStates.neutral
                else -> KozmosFillStates.themed
            }
            if (fill != null) {
                // Drawn on Kozmos's own surface, not Material's Button: no
                // ripple over the fill on any Material version (the pressed
                // token is the press), React's ring for focus, and a quick
                // tap still drawn pressed. Disabled, the fill surface draws
                // the disabled pair; loading, its own fill.
                KozmosFillButton(
                    onClick = onClick,
                    modifier = rootModifier,
                    enabled = enabled && !isLoading,
                    shape = shape,
                    fill = fill,
                    interactionSource = source,
                    contentPadding = contentPadding,
                    busy = busy
                ) {
                    ButtonContent(isLoading, content)
                }
            } else {
                // The glass variant is the glass surface, composed from the
                // token, and keeps Material's ripple. Disabled, it keeps the
                // glass, an effect rather than a fill, and takes the
                // disabled foreground.
                val glass = KozmosSurfaceDefaults.tint(KozmosSurfaceStyle.Glass)
                val ink = KozmosThemeTokens.primitivesColorsForeground100
                Button(
                    onClick = onClick,
                    modifier = rootModifier,
                    enabled = enabled && !isLoading,
                    shape = shape,
                    interactionSource = source,
                    contentPadding = contentPadding,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = glass,
                        contentColor = ink,
                        disabledContainerColor = glass,
                        disabledContentColor = if (disabled) disabledInk else ink
                    ),
                    border = KozmosSurfaceDefaults.border(KozmosSurfaceStyle.Glass)
                ) {
                    ButtonContent(isLoading, content)
                }
            }
        }
    }
}

@Composable
private fun RowScope.ButtonContent(
    isLoading: Boolean,
    content: @Composable RowScope.() -> Unit
) {
    // GAP-56: the loader and the caller's children keep 8 apart, as Figma's Button (itemSpacing
    // 8) and iOS's (HStack spacing 100) do. Both used to touch the label.
    Row(
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (isLoading) {
            // The system's arc at the small size, not material3's indicator:
            // one drawing on all four platforms (2026-09-22). material3 1.1.2's
            // indeterminate indicator is also the one Paparazzi cannot render
            // against animation-core 1.6.0, so no golden has ever shown a
            // loading button. Cleared from semantics — the button is already
            // disabled and named. In the content colour: the label's, or the
            // disabled foreground when it is disabled too (decision 197).
            KozmosSpinner(
                modifier = Modifier.clearAndSetSemantics {},
                size = KozmosSpinnerSize.Sm,
                color = LocalContentColor.current
            )
        }
        content()
    }
}
