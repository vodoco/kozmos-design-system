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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.clearAndSetSemantics
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosInertAlpha
import com.kozmos.components.KozmosFillSurface
import com.kozmos.components.spinner.KozmosSpinner
import com.kozmos.components.spinner.KozmosSpinnerSize
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
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
    interactionSource: MutableInteractionSource? = null
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    // The large size is the prototype's 48: Filters and the AI search beside a 44 field.
    // Disabled or loading, it keeps its own colours and the whole of it is
    // drawn at half, as React's `disabled:opacity-50` draws it, not in
    // Material's grey (decision 59): a filled icon button stays the fill.
    val inert = !enabled || isLoading
    val rootModifier = modifier.size(if (size == KozmosIconButtonSize.Lg) 48.dp else 44.dp)
        .alpha(if (inert) KozmosInertAlpha else 1f)
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
                contentDescription = contentDescription,
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
                    disabledContentColor = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
                ),
                border = IconButtonDefaults.outlinedIconButtonBorder(enabled = true),
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
                    disabledContentColor = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
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
                    interactionSource = source
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
                        disabledContentColor = ink
                    ),
                    content = content
                )
            }
        }
    }
}
