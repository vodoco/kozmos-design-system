package com.kozmos.components

import android.os.SystemClock
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Indication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalAbsoluteTonalElevation
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.surfaceColorAtElevation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * A filled control's colours in each state the tokens name: idle, hovered,
 * pressed and focused, for its container and for what sits on it.
 *
 * Decision 59's prominent fill answers a touch with its own tokens: pressed
 * is the pressed token (#0D44C2 for the theme fill), focused and hovered the
 * focus and hover tokens (#1051E8). A fill is drawn by [KozmosFillSurface],
 * which draws no ripple over it, so the darker container is the pressed
 * indication, and a ring is the focus indication.
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
    /**
     * What the fill draws for what [interactionSource] is doing now: pressed,
     * then focused, then hovered. A press stays drawn for at least
     * [KozmosPressedAtLeastMillis] ([collectIsPressedForAMomentAsState]).
     * While not [enabled] it is idle, whatever a shared source reports.
     *
     * Collect it whether or not the fill is drawn: an interaction source does
     * not replay, so focus given before a control turned filled is lost to a
     * collector that starts after it.
     */
    @Composable
    fun lookFor(interactionSource: InteractionSource, enabled: Boolean): KozmosFillLook {
        val pressed by interactionSource.collectIsPressedForAMomentAsState()
        val focused by interactionSource.collectIsFocusedAsState()
        val hovered by interactionSource.collectIsHoveredAsState()
        return when {
            !enabled -> KozmosFillLook(container, content, focusRing = false)
            pressed -> KozmosFillLook(containerPressed, contentPressed, focusRing = focused)
            focused -> KozmosFillLook(containerFocused, contentFocused, focusRing = true)
            hovered -> KozmosFillLook(containerHovered, contentHovered, focusRing = false)
            else -> KozmosFillLook(container, content, focusRing = false)
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

/** What a fill draws now: its container, what sits on it, and whether its focus ring shows. */
@Immutable
internal data class KozmosFillLook(val container: Color, val content: Color, val focusRing: Boolean)

/**
 * How long a press stays drawn. In scrolling content Compose holds a tap's
 * press back, to tell it from a scroll, and a quick tap then arrives as its
 * press and its release in one frame: watched as it is, it was never drawn.
 */
internal const val KozmosPressedAtLeastMillis = 150L

/**
 * Whether the source is pressed, as `collectIsPressedAsState`, except that a
 * press stays true for at least [KozmosPressedAtLeastMillis] after it began,
 * so a press and its release in one frame is still drawn. A cancelled press
 * (the touch became a scroll) ends at once.
 */
@Composable
internal fun InteractionSource.collectIsPressedForAMomentAsState(): State<Boolean> {
    val shown = remember { mutableStateOf(false) }
    LaunchedEffect(this) {
        val scope = this
        val presses = mutableListOf<PressInteraction.Press>()
        var since = 0L
        var letGo: Job? = null
        interactions.collect { interaction ->
            when (interaction) {
                is PressInteraction.Press -> {
                    presses += interaction
                    letGo?.cancel()
                    since = SystemClock.uptimeMillis()
                    shown.value = true
                }
                is PressInteraction.Release -> {
                    presses -= interaction.press
                    if (presses.isEmpty()) {
                        val wait = KozmosPressedAtLeastMillis - (SystemClock.uptimeMillis() - since)
                        letGo?.cancel()
                        letGo = scope.launch {
                            if (wait > 0) delay(wait)
                            shown.value = false
                        }
                    }
                }
                is PressInteraction.Cancel -> {
                    presses -= interaction.press
                    if (presses.isEmpty()) {
                        letGo?.cancel()
                        shown.value = false
                    }
                }
            }
        }
    }
    return shown
}

/**
 * React's focus ring (`focus-visible:ring-2 ring-offset-2`): a 2dp ring in
 * theme 600 (`ring`), 2dp outside the control's [shape], with the page's
 * colour, background/0, in the gap, so it reads against the fill and against
 * the page. It is drawn outside the control's bounds, so a parent that clips
 * them clips the ring.
 */
@Composable
internal fun Modifier.kozmosFocusRing(shown: Boolean, shape: Shape): Modifier {
    if (!shown) return this
    val ring = KozmosThemeTokens.primitivesColorsTheme600
    val gap = KozmosThemeTokens.primitivesColorsBackground0
    return drawBehind {
        val edge = Path().apply { addOutline(shape.createOutline(size, layoutDirection, this@drawBehind)) }
        val offset = 2.dp.toPx()
        val width = 2.dp.toPx()
        // Strokes centred on the edge: the control's own fill covers their
        // inner halves, leaving the gap, then the ring, outside it.
        drawPath(edge, ring, style = Stroke(width = 2 * (offset + width)))
        drawPath(edge, gap, style = Stroke(width = 2 * offset))
    }
}

/**
 * A filled control's surface: Material's `Surface(onClick = …)`, step for
 * step, but with its own clickable, so the ripple is ours to choose.
 *
 * A fill passes no [indication]: its pressed token is the press, and its
 * [focusRing] the focus. This holds on any Material version. Material's
 * controls draw their ripple themselves: up to Material3 1.2 (the 1.1.2 this
 * package pins) a `LocalRippleTheme` could quiet it, and from 1.3 only
 * `LocalRippleConfiguration`. Drawing the surface here needs neither.
 */
@Composable
internal fun KozmosClickableSurface(
    onClick: () -> Unit,
    modifier: Modifier,
    enabled: Boolean,
    shape: Shape,
    color: Color,
    contentColor: Color,
    interactionSource: MutableInteractionSource,
    indication: Indication?,
    focusRing: Boolean,
    role: Role? = Role.Button,
    shadowElevation: Dp = 0.dp,
    tonalElevation: Dp = 0.dp,
    border: BorderStroke? = null,
    /**
     * The whole control's opacity, its shadow included: a separate alpha
     * layer outside the shadow would draw the shadow into the control's
     * bounds and cut it off there.
     */
    alpha: Float = 1f,
    content: @Composable () -> Unit
) {
    val absoluteElevation = LocalAbsoluteTonalElevation.current + tonalElevation
    val background = if (color == MaterialTheme.colorScheme.surface) {
        MaterialTheme.colorScheme.surfaceColorAtElevation(absoluteElevation)
    } else {
        color
    }
    CompositionLocalProvider(
        LocalContentColor provides contentColor,
        LocalAbsoluteTonalElevation provides absoluteElevation
    ) {
        Box(
            modifier = modifier
                .then(if (role != null) Modifier.semantics { this.role = role } else Modifier)
                .minimumInteractiveComponentSize()
                // Material's shadow, as `Modifier.shadow` draws it, carrying
                // the control's alpha.
                .then(
                    if (shadowElevation > 0.dp || alpha < 1f) {
                        Modifier.graphicsLayer {
                            this.shadowElevation = shadowElevation.toPx()
                            this.shape = shape
                            this.clip = false
                            this.alpha = alpha
                        }
                    } else {
                        Modifier
                    }
                )
                // After the shadow, so the ring is drawn over it.
                .kozmosFocusRing(focusRing, shape)
                .then(if (border != null) Modifier.border(border, shape) else Modifier)
                .background(color = background, shape = shape)
                .clip(shape)
                .clickable(
                    interactionSource = interactionSource,
                    indication = indication,
                    enabled = enabled,
                    onClick = onClick
                ),
            propagateMinConstraints = true
        ) {
            content()
        }
    }
}

/** [KozmosClickableSurface] for a fill: its look for the source, no ripple, a focus ring. */
@Composable
internal fun KozmosFillSurface(
    onClick: () -> Unit,
    modifier: Modifier,
    enabled: Boolean,
    shape: Shape,
    fill: KozmosFillStates,
    interactionSource: MutableInteractionSource,
    role: Role? = Role.Button,
    shadowElevation: Dp = 0.dp,
    tonalElevation: Dp = 0.dp,
    content: @Composable () -> Unit
) {
    val look = fill.lookFor(interactionSource, enabled)
    KozmosClickableSurface(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        shape = shape,
        color = look.container,
        contentColor = look.content,
        interactionSource = interactionSource,
        indication = null,
        focusRing = look.focusRing,
        role = role,
        shadowElevation = shadowElevation,
        tonalElevation = tonalElevation,
        content = content
    )
}

/**
 * Material's filled `Button`, drawn on [KozmosFillSurface]: the label's type,
 * its minimum size and padding, centred in a row.
 */
@Composable
internal fun KozmosFillButton(
    onClick: () -> Unit,
    modifier: Modifier,
    enabled: Boolean,
    shape: Shape,
    fill: KozmosFillStates,
    interactionSource: MutableInteractionSource,
    contentPadding: PaddingValues = ButtonDefaults.ContentPadding,
    content: @Composable RowScope.() -> Unit
) {
    KozmosFillSurface(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        shape = shape,
        fill = fill,
        interactionSource = interactionSource
    ) {
        ProvideTextStyle(value = MaterialTheme.typography.labelLarge) {
            Row(
                Modifier
                    .defaultMinSize(minWidth = ButtonDefaults.MinWidth, minHeight = ButtonDefaults.MinHeight)
                    .padding(contentPadding),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
                content = content
            )
        }
    }
}

/**
 * What React draws a disabled or loading control at, `disabled:opacity-50`:
 * the whole control, with its own colours, at half.
 */
internal const val KozmosInertAlpha = 0.5f
