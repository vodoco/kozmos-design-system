package com.kozmos.components.mapcontrolbutton

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkHorizontally
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.KozmosTransitions
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class KozmosMapControlButtonPresentation {
    IconOnly,
    Labelled
}

/**
 * How an active map control reads.
 *
 * [Tinted] keeps the map surface and lets the mark and the words carry the
 * state, which is what the SDK draws — a control over a map has to stay
 * legible against the tiles behind it, and a solid fill hides the very thing
 * it sits on. Off, the mark and the words are grey; on, the mark is the
 * theme's blue and the words navy. No edge, in either (decision 40).
 * [Filled] is the inverted treatment this component shipped before
 * 2026-09-15, kept for callers that want the heavier emphasis.
 */
enum class KozmosMapControlButtonEmphasis {
    Tinted,
    Filled
}

/**
 * Where a control's state sits relative to its label.
 *
 * [Inline] runs them along one line. [Stacked] sets the state under the label,
 * which is how a map pill fits a two-word state into a control that has to
 * stay thumb-sized.
 */
enum class KozmosMapControlButtonLabelPlacement {
    Inline,
    Stacked
}

/**
 * What a map control's state resolves to, before any colour is chosen.
 *
 * Kept apart from the composable because this decision is the part a design
 * ruling changes — tinted became the default on 2026-09-15, and the SDK's
 * tones and no edge on 2026-09-28 (decision 40) — and it can be tested
 * without rendering anything.
 */
internal data class KozmosMapControlButtonAppearance(
    val surface: Surface,
    /** The mark's tone. */
    val icon: Tone,
    /** Both lines' tone: the SDK sets the name and the state as equals. */
    val label: Tone
) {
    enum class Surface { Chrome, Filled }

    /**
     * [ThemeText] is the theme ramp's deepest step, the SDK's navy "On"; the
     * ramp turns over in the dark, where it is the palest.
     */
    enum class Tone { Ink, Muted, Theme, ThemeText, OnFill }

    companion object {
        fun resolve(
            pressed: Boolean?,
            emphasis: KozmosMapControlButtonEmphasis
        ): KozmosMapControlButtonAppearance = when (pressed) {
            true -> if (emphasis == KozmosMapControlButtonEmphasis.Filled) {
                KozmosMapControlButtonAppearance(Surface.Filled, Tone.OnFill, Tone.OnFill)
            } else {
                // The SDK's "Focus On": the mark in the theme's blue, the words
                // navy, and no edge — the words and the mark carry the state.
                KozmosMapControlButtonAppearance(Surface.Chrome, Tone.Theme, Tone.ThemeText)
            }
            // The SDK's "Focus⏎Off": the mark and the words grey.
            false -> KozmosMapControlButtonAppearance(Surface.Chrome, Tone.Muted, Tone.Muted)
            // Not a toggle — zoom, compass — so neither off nor on: the ink, as
            // the SDK's own floor tile keeps.
            null -> KozmosMapControlButtonAppearance(Surface.Chrome, Tone.Ink, Tone.Ink)
        }
    }
}

@Composable
@ReadOnlyComposable
private fun KozmosMapControlButtonAppearance.Tone.color() = when (this) {
    KozmosMapControlButtonAppearance.Tone.Ink -> KozmosThemeTokens.primitivesColorsForeground100
    KozmosMapControlButtonAppearance.Tone.Muted -> KozmosThemeTokens.primitivesColorsForeground400
    KozmosMapControlButtonAppearance.Tone.Theme -> KozmosThemeTokens.primitivesColorsTheme600
    KozmosMapControlButtonAppearance.Tone.ThemeText -> KozmosThemeTokens.primitivesColorsTheme1000
    KozmosMapControlButtonAppearance.Tone.OnFill -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
}

/**
 * While a control reveals on change it decides its own presentation: icon-only
 * at rest, labelled while it says its new state, whatever `presentation` says.
 */
internal fun resolvedPresentation(
    presentation: KozmosMapControlButtonPresentation,
    revealOnChange: Boolean,
    revealed: Boolean
): KozmosMapControlButtonPresentation = when {
    !revealOnChange -> presentation
    revealed -> KozmosMapControlButtonPresentation.Labelled
    else -> KozmosMapControlButtonPresentation.IconOnly
}

/**
 * The words a labelled control draws: the name over the state, or the state
 * alone when the name is not shown — the SDK's "No Location" — and the name
 * when there is no state to show.
 */
internal fun drawnLines(label: String, stateLabel: String?, showLabel: Boolean): List<String> =
    (if (showLabel || stateLabel == null) listOf(label) else emptyList()) + listOfNotNull(stateLabel)

/**
 * The name TalkBack hears: the name, the state, and what the words leave out,
 * in that order, so it still begins with what is shown.
 */
internal fun accessibleLabel(label: String, stateLabel: String?, stateDescription: String?): String =
    listOfNotNull(label, stateLabel, stateDescription).joinToString(", ")


/**
 * A single floating map control.
 *
 * Mirrors the React `MapControlButton`. [label] is the localized action name
 * and always becomes the accessible name; [stateLabel] is appended so screen
 * reader users hear the current state without relying on visual styling.
 *
 * It wears the SDK's Tracking Indicator (decision 40, Figma
 * `ce7phRJR1sCkH6zT8EMH8I`, `434:31572`): a 48 square, the page's own surface
 * with no edge, the Control corner and the map controls' elevation, and its
 * words bold on a 16 line, in the toggle's tone. Compose draws the elevation
 * with Material's light, not the SDK's three layers: see [KozmosShadows].
 *
 * [stateDescription] is said after the state and never drawn: what the words
 * on the control leave out. The location control's heading mode shows "On",
 * as following does — the SDK's "Focus / On" — and its mark tells them apart
 * on screen; TalkBack hears "Focus, On, map turns with you". After the words,
 * so the name still begins with what is shown. It is not a change to reveal:
 * the words did not change.
 *
 * [showLabel] draws the name beside the state. Off, a labelled control draws
 * its state alone — the SDK's "No Location" has no "Focus" over it — and the
 * name still starts what TalkBack hears. With no state to draw, the name is
 * drawn anyway.
 *
 * [pressed] is a toggle's state. Leave it unset for a control that is not a
 * toggle — zoom, compass — which keeps the ink; `false` is a toggle that is
 * off, drawn grey, and `true` one that is on.
 *
 * [revealOnChange] lets the control resolve its own presentation: icon-only at
 * rest, widening to labelled for [revealDurationMillis] whenever [pressed] or
 * [stateLabel] changes, then collapsing so it stops covering the map — the
 * SDK's map toggles, and React's `revealOnChange`. While it is set,
 * [presentation] is ignored. [revealDelayMillis] holds the reveal back for a
 * change that takes time to settle, such as a route being recalculated. Off
 * by default (row 77).
 *
 * [isLoading] turns the system's arc in the icon's place, and the control
 * waits: React's Button disables itself while it loads, and so does this. The
 * name still says what is happening.
 */
@Composable
fun KozmosMapControlButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: (@Composable () -> Unit)? = null,
    stateLabel: String? = null,
    stateDescription: String? = null,
    showLabel: Boolean = true,
    presentation: KozmosMapControlButtonPresentation = KozmosMapControlButtonPresentation.IconOnly,
    emphasis: KozmosMapControlButtonEmphasis = KozmosMapControlButtonEmphasis.Tinted,
    labelPlacement: KozmosMapControlButtonLabelPlacement = KozmosMapControlButtonLabelPlacement.Inline,
    pressed: Boolean? = null,
    enabled: Boolean = true,
    revealOnChange: Boolean = false,
    revealDurationMillis: Long = 2500L,
    revealDelayMillis: Long = 0L,
    isLoading: Boolean = false
) {
    val accessibleLabel = accessibleLabel(label, stateLabel, stateDescription)
    val appearance = KozmosMapControlButtonAppearance.resolve(pressed, emphasis)
    // Either half of the state can be what changed: a toggle flips `pressed`,
    // while a control that cycles through modes changes only its state label.
    // `pressed` is read as a boolean, as React reads it, so a toggle going from
    // unset to false while its state loads does not announce a change.
    val revealed = rememberRevealOnChange(
        value = (pressed == true) to stateLabel,
        enabled = revealOnChange,
        durationMillis = revealDurationMillis,
        delayMillis = revealDelayMillis
    )
    val shown = resolvedPresentation(presentation, revealOnChange, revealed)
    val lines = drawnLines(label, stateLabel, showLabel)

    val labelled = shown == KozmosMapControlButtonPresentation.Labelled
    // The label arrives and leaves rather than snapping, as React's and
    // SwiftUI's do. Compose times it on the frame clock, which the system's
    // animator setting scales: a visitor who has turned animations off sees
    // the new width at once — and still reads the label, for as long.
    val labelState = remember { MutableTransitionState(labelled) }.apply { targetState = labelled }
    // Its content's width only while the label shows or is moving. At rest
    // icon-only it is the SDK's exact 48 square, which is also the target
    // Material asks for, so a clickable Surface reserves nothing more.
    val widthFollowsContent = labelState.currentState || labelState.targetState
    val horizontalPadding by animateDpAsState(
        targetValue = if (labelled) KozmosDimensions.primitivesLayoutSpacing150 else 0.dp,
        animationSpec = KozmosTransitions.standard(),
        label = "MapControlButtonPadding"
    )
    // One style for both lines, the SDK's "Focus⏎Off": the type scale's 16,
    // bold, on a line as tall as the type. Compose sets a 16sp line on this
    // type at about 25dp whatever its line height says, so each line is a box
    // as tall as the type, in dp at the reader's font scale, and the glyphs
    // are centred in it — as Figma's 16/16 line and iOS's do.
    val lineStyle = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
    val lineHeight = with(LocalDensity.current) { lineStyle.fontSize.toDp() }

    Surface(
        onClick = onClick,
        modifier = modifier
            .then(
                if (widthFollowsContent) {
                    Modifier
                        .widthIn(min = KozmosMapControlSize, max = 256.dp)
                        .heightIn(min = KozmosMapControlSize)
                } else {
                    Modifier.size(KozmosMapControlSize)
                }
            )
            .semantics {
                contentDescription = accessibleLabel
                selected = pressed == true
            },
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        // The page's own surface, opaque, as the SDK's is. It was 90% of it.
        color = if (appearance.surface == KozmosMapControlButtonAppearance.Surface.Filled) {
            KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
        } else {
            KozmosThemeTokens.primitivesColorsBackground0
        },
        contentColor = appearance.label.color(),
        // No edge in any state, and one lift: the words and the mark carry the
        // state.
        shadowElevation = KozmosShadows.semanticsElevationMapControl
    ) {
        Row(
            modifier = Modifier.padding(
                horizontal = horizontalPadding,
                vertical = KozmosDimensions.primitivesLayoutSpacing100
            ),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (icon != null || isLoading) {
                CompositionLocalProvider(LocalContentColor provides appearance.icon.color()) {
                    Box(contentAlignment = Alignment.Center) {
                        // Kept in place, unseen, under the spinner, so a
                        // labelled control's text does not move while it waits.
                        if (icon != null) {
                            Box(Modifier.alpha(if (isLoading) 0f else 1f)) { icon() }
                        }
                        if (isLoading) {
                            // The system's arc, as a loading Button draws it:
                            // one drawing on all four platforms. Cleared from
                            // semantics — the control is already named and
                            // waiting.
                            KozmosSpinner(
                                modifier = Modifier.clearAndSetSemantics {},
                                size = KozmosSpinnerSize.Sm,
                                color = appearance.icon.color()
                            )
                        }
                    }
                }
            }

            AnimatedVisibility(
                visibleState = labelState,
                // Uncovered from its start, as React's max-width reveals it: the
                // name is read first, not the tail of the state.
                enter = expandHorizontally(KozmosTransitions.standard(), expandFrom = Alignment.Start) +
                    fadeIn(KozmosTransitions.standard()),
                exit = shrinkHorizontally(KozmosTransitions.standard(), shrinkTowards = Alignment.Start) +
                    fadeOut(KozmosTransitions.standard())
            ) {
                // The gap from the icon travels with the label, so nothing
                // jumps when it arrives or leaves.
                Box(
                    Modifier.padding(
                        start = if (icon != null || isLoading) KozmosDimensions.primitivesLayoutSpacing100 else 0.dp
                    )
                ) {
                    if (labelPlacement == KozmosMapControlButtonLabelPlacement.Stacked) {
                        // Two equal lines.
                        Column(horizontalAlignment = Alignment.Start) {
                            lines.forEach { line -> MapControlLine(line, lineStyle, lineHeight) }
                        }
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
                        ) {
                            lines.forEach { line -> MapControlLine(line, lineStyle, lineHeight) }
                        }
                    }
                }
            }
        }
    }
}

/** The SDK's 48 square. 44 stays the floor of every target; this is above it. */
internal val KozmosMapControlSize = KozmosDimensions.primitivesLayoutSizing600

/** One line of the SDK's words, in a box as tall as its type. */
@Composable
private fun MapControlLine(text: String, style: TextStyle, height: Dp) {
    Box(Modifier.height(height), contentAlignment = Alignment.CenterStart) {
        Text(
            text = text,
            style = style,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.wrapContentHeight(unbounded = true)
        )
    }
}
