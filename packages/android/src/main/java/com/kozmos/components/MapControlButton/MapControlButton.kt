package com.kozmos.components.mapcontrolbutton

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkHorizontally
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.KozmosTransitions
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class KozmosMapControlButtonPresentation {
    IconOnly,
    Labelled
}

/**
 * How an active map control reads.
 *
 * [Tinted] keeps the map surface and colours the icon and the edge, which is
 * what the SDK draws — a control over a map has to stay legible against the
 * tiles behind it, and a solid fill hides the very thing it sits on.
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
 * ruling changes — tinted became the default on 2026-09-15 — and it can be
 * tested without rendering anything.
 */
internal data class KozmosMapControlButtonAppearance(
    val surface: Surface,
    val icon: Tone,
    val label: Tone,
    /** The small line above a stacked state; muted only on the map's surface. */
    val caption: Tone,
    val edge: Edge
) {
    enum class Surface { Chrome, Filled }
    enum class Tone { Ink, Muted, Theme, OnFill }
    enum class Edge { Subtle, Theme }

    companion object {
        fun resolve(
            pressed: Boolean,
            emphasis: KozmosMapControlButtonEmphasis
        ): KozmosMapControlButtonAppearance = when {
            pressed && emphasis == KozmosMapControlButtonEmphasis.Filled ->
                KozmosMapControlButtonAppearance(Surface.Filled, Tone.OnFill, Tone.OnFill, Tone.OnFill, Edge.Subtle)
            // Only the glyph and the edge take the theme, so the label keeps its
            // contrast against a surface that stays the map's.
            pressed ->
                KozmosMapControlButtonAppearance(Surface.Chrome, Tone.Theme, Tone.Ink, Tone.Muted, Edge.Theme)
            else ->
                KozmosMapControlButtonAppearance(Surface.Chrome, Tone.Ink, Tone.Ink, Tone.Muted, Edge.Subtle)
        }
    }
}

@Composable
@ReadOnlyComposable
private fun KozmosMapControlButtonAppearance.Tone.color() = when (this) {
    KozmosMapControlButtonAppearance.Tone.Ink -> KozmosThemeTokens.primitivesColorsForeground100
    KozmosMapControlButtonAppearance.Tone.Muted -> KozmosThemeTokens.primitivesColorsForeground400
    KozmosMapControlButtonAppearance.Tone.Theme -> KozmosThemeTokens.primitivesColorsTheme600
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
 * A single floating map control.
 *
 * Mirrors the React `MapControlButton`. [label] is the localized action name
 * and always becomes the accessible name; [stateLabel] is appended so screen
 * reader users hear the current state without relying on visual styling.
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
    presentation: KozmosMapControlButtonPresentation = KozmosMapControlButtonPresentation.IconOnly,
    emphasis: KozmosMapControlButtonEmphasis = KozmosMapControlButtonEmphasis.Tinted,
    labelPlacement: KozmosMapControlButtonLabelPlacement = KozmosMapControlButtonLabelPlacement.Inline,
    pressed: Boolean = false,
    enabled: Boolean = true,
    revealOnChange: Boolean = false,
    revealDurationMillis: Long = 2500L,
    revealDelayMillis: Long = 0L,
    isLoading: Boolean = false
) {
    val accessibleLabel = if (stateLabel != null) "$label, $stateLabel" else label
    val appearance = KozmosMapControlButtonAppearance.resolve(pressed, emphasis)
    // Either half of the state can be what changed: a toggle flips `pressed`,
    // while a control that cycles through modes changes only its state label —
    // following and heading are both pressed.
    val revealed = rememberRevealOnChange(
        value = pressed to stateLabel,
        enabled = revealOnChange,
        durationMillis = revealDurationMillis,
        delayMillis = revealDelayMillis
    )
    val shown = resolvedPresentation(presentation, revealOnChange, revealed)
    val borderColor by animateColorAsState(
        targetValue = if (appearance.edge == KozmosMapControlButtonAppearance.Edge.Theme) {
            KozmosThemeTokens.primitivesColorsTheme600
        } else {
            KozmosThemeTokens.primitivesColorsForeground300
        },
        label = "MapControlButtonBorder"
    )

    val labelled = shown == KozmosMapControlButtonPresentation.Labelled
    // The label arrives and leaves rather than snapping, as React's and
    // SwiftUI's do. Compose times it on the frame clock, which the system's
    // animator setting scales: a visitor who has turned animations off sees
    // the new width at once — and still reads the label, for as long.
    val labelState = remember { MutableTransitionState(labelled) }.apply { targetState = labelled }
    // Its content's width only while the label shows or is moving. At rest
    // icon-only it is the exact 44 it always was: given any slack, a clickable
    // Surface reserves the 48 Material asks for a touch target.
    val widthFollowsContent = labelState.currentState || labelState.targetState
    val horizontalPadding by animateDpAsState(
        targetValue = if (labelled) KozmosDimensions.primitivesLayoutSpacing150 else 0.dp,
        animationSpec = KozmosTransitions.standard(),
        label = "MapControlButtonPadding"
    )

    Surface(
        onClick = onClick,
        modifier = modifier
            .height(44.dp)
            .then(
                if (widthFollowsContent) {
                    Modifier.widthIn(max = 256.dp).defaultMinSize(minWidth = 44.dp)
                } else {
                    Modifier.size(44.dp)
                }
            )
            .semantics {
                contentDescription = accessibleLabel
                selected = pressed
            },
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = if (appearance.surface == KozmosMapControlButtonAppearance.Surface.Filled) {
            KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
        } else {
            KozmosThemeTokens.primitivesColorsBackground0.copy(alpha = 0.9f)
        },
        contentColor = appearance.label.color(),
        border = BorderStroke(1.dp, borderColor),
        shadowElevation = if (pressed) 2.dp else 8.dp
    ) {
        Row(
            modifier = Modifier.padding(horizontal = horizontalPadding),
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
                        Column(horizontalAlignment = Alignment.Start) {
                            // The SDK sets these at 11sp over 13sp semibold. The
                            // type scale has no role at either size yet, so this
                            // reaches for the nearest roles and the deviation is
                            // recorded in the gap list rather than hard-coded here.
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall,
                                color = appearance.caption.color(),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            if (stateLabel != null) {
                                Text(
                                    text = stateLabel,
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1
                                )
                            }
                        }
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.bodyMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            if (stateLabel != null) {
                                Text(
                                    text = stateLabel,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
