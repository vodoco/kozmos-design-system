package com.kozmos.components.radio

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import com.kozmos.components.KozmosControlText
import com.kozmos.components.KozmosInertAlpha
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
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
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
    error: Boolean = false,
    description: String? = null,
    variant: KozmosRadioGroupItemVariant = KozmosRadioGroupItemVariant.Default,
    media: (@Composable () -> Unit)? = null
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
        // Full ink from the theme's tokens, as a card's title is, not
        // Material's onSurface.
        else -> KozmosThemeTokens.primitivesColorsForeground0
    }

    val onClick = {
        trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "RadioGroup", eventName = "radio_selection_changed", properties = mapOf("value" to value.toString())))
        onOptionSelected(value)
    }
    val ring = when {
        !enabled -> disabledColor
        selected -> selectedColor
        else -> unselectedColor
    }
    val dot = if (enabled) dotColor else disabledColor

    if (variant != KozmosRadioGroupItemVariant.Default) {
        KozmosLogUntitledOption(variant, label)
        KozmosRadioBox(
            variant = variant,
            selected = selected,
            enabled = enabled,
            error = error,
            label = label,
            description = description,
            media = media,
            // Disabled, a card keeps its colours and is drawn at half.
            ring = if (selected) selectedColor else unselectedColor,
            dot = dotColor,
            onClick = onClick,
            modifier = modifier
        )
        return
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .selectable(
                selected = selected,
                enabled = enabled,
                onClick = onClick,
                role = Role.RadioButton
            )
            .padding(vertical = KozmosDimensions.primitivesLayoutSpacing100),
        // With a description the mark sits on the label's first line; the
        // row is one node, its label read first, the description after it.
        verticalAlignment = if (description != null) Alignment.Top else Alignment.CenterVertically
    ) {
        KozmosRadioMark(selected = selected, ring = ring, dot = dot)
        if (label != null || description != null) {
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
            KozmosControlText(
                label = label,
                labelColor = labelColor,
                description = description,
                labelStyle = MaterialTheme.typography.bodyLarge,
                topInset = 0.dp
            )
        }
    }
}

/** How a radio option is drawn (GAP-158). */
enum class KozmosRadioGroupItemVariant {
    /** A ring and its label, in a row. */
    Default,

    /** A bordered card: media on top, then the ring beside a title and a description. */
    Card,

    /** A bordered tile, its media, title and description centred; chosen, a check in its top-end corner. */
    Tile
}

/**
 * A radio card or tile (GAP-158): one radio, named by its title, its
 * description read after it, its media drawn and never read. Chosen, its
 * edge is theme 600 at 2dp, drawn inside the box so nothing moves, and it
 * shows the dot (a card) or a check (a tile): never the colour alone.
 */
@Composable
private fun KozmosRadioBox(
    variant: KozmosRadioGroupItemVariant,
    selected: Boolean,
    enabled: Boolean,
    error: Boolean,
    label: String?,
    description: String?,
    media: (@Composable () -> Unit)?,
    ring: Color,
    dot: Color,
    onClick: () -> Unit,
    modifier: Modifier
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
    val edge = when {
        error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
        selected -> KozmosThemeTokens.primitivesColorsTheme600
        else -> KozmosThemeTokens.semanticsBorderSubtle
    }
    val edgeWidth = if (selected) 2.dp else 1.dp
    val titleColor = KozmosThemeTokens.primitivesColorsForeground0
    val mutedColor = KozmosThemeTokens.primitivesColorsForeground400
    Box(
        modifier = modifier
            .alpha(if (enabled) 1f else KozmosInertAlpha)
            // A card and a tile both fill the width they are given, a grid
            // cell or a weighted slot, as React's w-full and SwiftUI's do.
            .fillMaxWidth()
            .heightIn(min = if (variant == KozmosRadioGroupItemVariant.Tile) 96.dp else 44.dp)
            .clip(shape)
            .border(edgeWidth, edge, shape)
            .selectable(
                selected = selected,
                enabled = enabled,
                onClick = onClick,
                role = Role.RadioButton
            )
            .padding(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        if (variant == KozmosRadioGroupItemVariant.Card) {
            Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)) {
                if (media != null) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            // Concentric with the card: its radius less its
                            // 12dp inset (docs/nested-radius.md).
                            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer - KozmosDimensions.primitivesLayoutSpacing150))
                            .clearAndSetSemantics {}
                    ) {
                        // An icon given no tint of its own takes the theme's
                        // full ink, foreground/0, as React's text-foreground
                        // does: Material's content colour was black on the
                        // dark surface, and the icon vanished.
                        CompositionLocalProvider(LocalContentColor provides titleColor) { media() }
                    }
                }
                Row(verticalAlignment = Alignment.Top) {
                    KozmosRadioMark(selected = selected, ring = ring, dot = dot)
                    Spacer(Modifier.width(KozmosDimensions.primitivesLayoutSpacing100))
                    Column(
                        modifier = Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing25),
                        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
                    ) {
                        if (label != null) {
                            Text(text = label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = titleColor)
                        }
                        if (description != null) {
                            Text(text = description, style = MaterialTheme.typography.bodySmall, color = mutedColor)
                        }
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
            ) {
                if (media != null) {
                    Box(Modifier.clearAndSetSemantics {}) {
                        // A tile's icon: full ink, theme 600 when chosen, as
                        // SwiftUI's and React's are.
                        val ink = if (selected && enabled) KozmosThemeTokens.primitivesColorsTheme600 else titleColor
                        CompositionLocalProvider(LocalContentColor provides ink) { media() }
                    }
                }
                if (label != null) {
                    Text(text = label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = titleColor, textAlign = TextAlign.Center)
                }
                if (description != null) {
                    Text(text = description, style = MaterialTheme.typography.labelSmall, color = mutedColor, textAlign = TextAlign.Center)
                }
            }
            if (selected) {
                // The check is the chosen tile's mark beside its edge: drawn,
                // never read, as the node already says it is selected. The
                // box's 12dp pad less 4 puts it 8dp in from the corner.
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = KozmosDimensions.primitivesLayoutSpacing50, y = -KozmosDimensions.primitivesLayoutSpacing50)
                        .size(20.dp)
                        .background(if (error) KozmosThemeTokens.primitivesColorsEmotionalDanger600 else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle, CircleShape)
                        .clearAndSetSemantics {},
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
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

/**
 * GAP-158: a card or tile with no title is named by nothing but its words.
 * The message for one drawn as [variant] with [label], or null.
 */
internal fun kozmosUntitledOptionWarning(variant: KozmosRadioGroupItemVariant, label: String?): String? {
    if (variant == KozmosRadioGroupItemVariant.Default || !label.isNullOrEmpty()) return null
    val kind = if (variant == KozmosRadioGroupItemVariant.Card) "card" else "tile"
    return "KozmosRadioGroupItem: a $kind has no label, so TalkBack names it by its description or by nothing. " +
        "Pass label, or Modifier.semantics { contentDescription = ... } for an icon-only tile."
}

private val kozmosUntitledOptionLogged = java.util.concurrent.atomic.AtomicBoolean(false)

/** Logs [kozmosUntitledOptionWarning] once, only in a debuggable app. */
@Composable
private fun KozmosLogUntitledOption(variant: KozmosRadioGroupItemVariant, label: String?) {
    val context = androidx.compose.ui.platform.LocalContext.current
    androidx.compose.runtime.LaunchedEffect(variant, label) {
        val debuggable = (context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
        val message = kozmosUntitledOptionWarning(variant, label) ?: return@LaunchedEffect
        if (debuggable && kozmosUntitledOptionLogged.compareAndSet(false, true)) {
            android.util.Log.w("Kozmos", message)
        }
    }
}
