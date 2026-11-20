package com.kozmos.components.iconbutton

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.material3.LocalTextStyle
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosFillSurface
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.CircleShape
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosIconButtonVariant {
    Default,
    Destructive,
    Outline,
    Secondary,
    Ghost,
    Link,
    Glass
}

enum class KozmosIconButtonSize {
    Default,
    Sm,
    Lg
}

/**
 * @param counter A count at the button's top-end corner (GAP-197): the tours
 * left on a help button, unread notices. Drawn as [KozmosCounter][com.kozmos.components.counter.KozmosCounter]
 * is, small, in the theme fill (Brand), not a Badge, which is a status
 * (decision 93). Its bottom edge is on the button's centre line and its start
 * edge 2 past it, so it covers the icon's top-end corner, and the top-left
 * right to left. It takes no tap. TalkBack reads it with the button's name,
 * "Help, 3", in [counterLabel]'s words when given; the number drawn is not read
 * again. Null, the default, draws no counter: pass null rather than 0 to hide it.
 * @param counterLabel What the count is read as, in the product's language:
 * `{ "$it tours left" }`. The number alone by default.
 * @param counterSeparator What stands between the button's name and its count
 * when they are read, so TalkBack pauses there: ", " by default, as English
 * writes it; a product that translates passes its own, "、" in Japanese.
 * @param loadingLabel What TalkBack says the button's state is while it loads,
 * after its name (GAP-253): "Loading" by default; a product that translates
 * passes its own. The name and the count are the button's, not its icon's, so
 * they stay while the spinner is drawn in the icon's place.
 */
@Composable
fun KozmosIconButton(
    icon: ImageVector,
    onClick: () -> Unit,
    contentDescription: String? = null,
    modifier: Modifier = Modifier,
    variant: KozmosIconButtonVariant = KozmosIconButtonVariant.Ghost,
    size: KozmosIconButtonSize = KozmosIconButtonSize.Default,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    // The presses, focus and hover it answers, as Material's own parameter.
    // After every parameter it had, so a call by position still compiles.
    interactionSource: MutableInteractionSource? = null,
    counter: Int? = null,
    counterLabel: (Int) -> String = { it.toString() },
    counterSeparator: String = ", ",
    loadingLabel: String = "Loading"
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    // The count is read with the button's name, as React's "Help, 3".
    val said = counter?.let(counterLabel)
    val description = when {
        said == null -> contentDescription
        contentDescription == null -> said
        else -> "$contentDescription$counterSeparator$said"
    }
    // The large size is the prototype's 48: Filters and the AI search beside a 44 field.
    // Disabled, it is drawn from the disabled pair (decision 197, GAP-218),
    // as Button is, not at half and not in Material's grey: its icon in the
    // disabled foreground; a filled variant and a ghost on the disabled fill;
    // an outline on no fill, its ring in the foreground too; a link on no
    // fill; glass on its own glass; and its counter the pair inverted, the
    // foreground's pill under the fill's digits (4.80:1 light, 6.51:1 dark).
    // Loading is busy, not unavailable: it keeps its variant's own colours
    // at full strength, the spinner in the icon's colour. Disabled and
    // loading, it is drawn disabled.
    val inert = !enabled || isLoading
    val disabled = !enabled
    val busy = enabled && isLoading
    val disabledInk = KozmosThemeTokens.semanticsDisabledForeground
    val disabledFill = KozmosThemeTokens.semanticsDisabledFill
    val themedInk = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
    // The name, and the count, are the button's own (GAP-253): on the icon,
    // they went with it when the spinner took its place. Loading, the button
    // says it is busy, as its state, since Compose has no busy property.
    val rootModifier = modifier.size(if (size == KozmosIconButtonSize.Lg) 48.dp else 44.dp)
        .semantics {
            // `this.`: the parameter of the same name would be taken instead.
            if (description != null) this.contentDescription = description
            if (isLoading) stateDescription = loadingLabel
        }
        // Outside the button's clip, which would cut it.
        .then(if (counter != null) Modifier.iconButtonCounter(counter, disabled) else Modifier)
    val iconSize = when (size) {
        KozmosIconButtonSize.Sm -> 14.dp
        KozmosIconButtonSize.Lg -> 20.dp
        KozmosIconButtonSize.Default -> 16.dp
    }

    val content: @Composable () -> Unit = {
        if (isLoading) {
            // The system's arc at the small size, taking the control's own
            // content colour — one drawing on all four platforms (2026-09-22).
            // Both sizes draw 16: a loader inside a control is one size, and
            // the 14 the small one used matched nothing else in the system.
            KozmosSpinner(
                modifier = Modifier.clearAndSetSemantics {},
                size = KozmosSpinnerSize.Sm,
                color = LocalContentColor.current
            )
        } else {
            Icon(
                imageVector = icon,
                // Named on the button, so the name stays while it loads.
                contentDescription = null,
                modifier = Modifier.size(iconSize)
            )
        }
    }

    when (variant) {
        KozmosIconButtonVariant.Outline -> {
            OutlinedIconButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                interactionSource = source,
                shape = CircleShape,
                colors = IconButtonDefaults.outlinedIconButtonColors(
                    contentColor = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
                    disabledContentColor = if (disabled) disabledInk else themedInk
                ),
                border = if (disabled) BorderStroke(1.dp, disabledInk) else IconButtonDefaults.outlinedIconButtonBorder(enabled = true),
                content = content
            )
        }
        KozmosIconButtonVariant.Ghost, KozmosIconButtonVariant.Link -> {
            IconButton(
                onClick = onClick,
                modifier = rootModifier,
                enabled = enabled && !isLoading,
                interactionSource = source,
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
                    // A disabled ghost on the disabled fill; a link on none.
                    disabledContainerColor = if (disabled && variant == KozmosIconButtonVariant.Ghost) disabledFill else Color.Transparent,
                    disabledContentColor = if (disabled) disabledInk else themedInk
                ),
                content = content
            )
        }
        else -> {
            // Every one but Glass is a fill with its own pressed, focus and
            // hover tokens (decision 59).
            val fill: KozmosFillStates? = when (variant) {
                KozmosIconButtonVariant.Destructive -> KozmosFillStates.danger
                KozmosIconButtonVariant.Secondary -> KozmosFillStates.neutral
                KozmosIconButtonVariant.Glass -> null
                else -> KozmosFillStates.themed
            }
            if (fill != null) {
                // Material's FilledIconButton, drawn on Kozmos's own surface:
                // no ripple over the fill on any Material version, React's
                // ring for focus, and a quick tap still drawn pressed.
                KozmosFillSurface(
                    onClick = onClick,
                    modifier = rootModifier,
                    enabled = enabled && !isLoading,
                    shape = CircleShape,
                    fill = fill,
                    interactionSource = source,
                    busy = busy
                ) {
                    Box(Modifier.size(40.dp), contentAlignment = Alignment.Center) { content() }
                }
            } else {
                // The glass variant is the glass surface, composed from the
                // token, and keeps Material's ripple.
                val glass = KozmosSurfaceDefaults.tint(KozmosSurfaceStyle.Glass)
                val ink = KozmosThemeTokens.primitivesColorsForeground100
                FilledIconButton(
                    onClick = onClick,
                    modifier = rootModifier.border(KozmosSurfaceDefaults.border(KozmosSurfaceStyle.Glass), CircleShape),
                    enabled = enabled && !isLoading,
                    interactionSource = source,
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = glass,
                        contentColor = ink,
                        disabledContainerColor = glass,
                        disabledContentColor = if (disabled) disabledInk else ink
                    ),
                    content = content
                )
            }
        }
    }
}

/**
 * The counter (GAP-197), as React's `.kozmos-icon-button-counter`: Counter's
 * Brand recipe at Sm (18 tall, at least 18 wide, 5 each side, 11 semibold in
 * tabular figures, a pill in the theme fill), drawn over the button with its
 * bottom edge on the centre line and its start edge 2 past it, at every size.
 * On a [disabled] button it is the disabled pair inverted (decision 197): a
 * pill of the disabled foreground under digits of the disabled fill.
 * Drawn, not composed, so it is no node of its own: it takes no tap and
 * TalkBack hears the count in the button's name instead.
 */
@Composable
private fun Modifier.iconButtonCounter(count: Int, disabled: Boolean): Modifier {
    val measurer = rememberTextMeasurer()
    val fill = if (disabled) KozmosThemeTokens.semanticsDisabledForeground
        else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    val ink = if (disabled) KozmosThemeTokens.semanticsDisabledFill
        else KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    val style = LocalTextStyle.current.merge(
        TextStyle(fontSize = 11.sp, fontWeight = FontWeight.SemiBold, fontFeatureSettings = "tnum")
    )
    val number = remember(count, style) {
        measurer.measure(text = count.toString(), style = style, maxLines = 1, softWrap = false)
    }
    return drawWithContent {
        drawContent()
        val height = 18.dp.toPx()
        val width = maxOf(height, number.size.width + 2 * 5.dp.toPx())
        val gap = 2.dp.toPx()
        val left = if (layoutDirection == LayoutDirection.Ltr) center.x + gap else center.x - gap - width
        val top = center.y - height
        drawRoundRect(fill, topLeft = Offset(left, top), size = Size(width, height), cornerRadius = CornerRadius(height / 2))
        drawText(
            number,
            color = ink,
            topLeft = Offset(left + (width - number.size.width) / 2f, top + (height - number.size.height) / 2f)
        )
    }
}
