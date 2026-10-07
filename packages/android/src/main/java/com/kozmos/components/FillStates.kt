package com.kozmos.components

import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material.ripple.RippleAlpha
import androidx.compose.material.ripple.RippleTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A filled control's colours in each state the tokens name: idle, hovered,
 * pressed and focused, for its container and for what sits on it.
 *
 * Decision 59's prominent fill answers a touch with its own tokens: pressed
 * is the pressed token (#0D44C2 for the theme fill), focused and hovered the
 * focus and hover tokens (#1051E8). Material's white ripple lightened the fill
 * instead, to about #2F6FEE, so a press drew a paler blue than the tokens'
 * darker one. A control that draws a fill this way draws no ripple on it
 * ([KozmosNoRipple]): the darker container is its pressed indication.
 */
@Immutable
internal data class KozmosFillStates(
    val container: Color,
    val containerHovered: Color,
    val containerPressed: Color,
    val containerFocused: Color,
    val content: Color,
    val contentHovered: Color,
    val contentPressed: Color,
    val contentFocused: Color
) {
    /** The container and the content for what [interactionSource] is doing now: pressed, then focused, then hovered. */
    @Composable
    fun colorsFor(interactionSource: InteractionSource): Pair<Color, Color> {
        val pressed by interactionSource.collectIsPressedAsState()
        val focused by interactionSource.collectIsFocusedAsState()
        val hovered by interactionSource.collectIsHoveredAsState()
        return when {
            pressed -> containerPressed to contentPressed
            focused -> containerFocused to contentFocused
            hovered -> containerHovered to contentHovered
            else -> container to content
        }
    }

    companion object {
        /** The theme fill, theme 500, with the theme foreground on it (decision 59). */
        val themed: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentFocus
            )

        val neutral: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentFocus
            )

        val success: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonForegroundContentFocus
            )

        val danger: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentFocus
            )

        val informative: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsInformativeButtonForegroundContentFocus
            )

        val alert: KozmosFillStates
            @Composable get() = KozmosFillStates(
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundHover,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundPressed,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundFocus,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentIdle,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentHover,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentPressed,
                KozmosThemeTokens.componentsPrimaryButtonsAlertButtonForegroundContentFocus
            )
    }
}

/**
 * No ripple: provided as `LocalRippleTheme` around a control whose fill
 * answers through [KozmosFillStates], so Material's white ripple and its
 * hover and focus layers do not lighten the token's colour. What the control
 * holds that ripples of its own, a menu it opens, is given the ripple back.
 */
internal object KozmosNoRipple : RippleTheme {
    @Composable
    override fun defaultColor(): Color = Color.Transparent

    @Composable
    override fun rippleAlpha(): RippleAlpha = RippleAlpha(0f, 0f, 0f, 0f)
}

/**
 * What React draws a disabled or loading control at, `disabled:opacity-50`:
 * the whole control, with its own colours, at half.
 */
internal const val KozmosInertAlpha = 0.5f
