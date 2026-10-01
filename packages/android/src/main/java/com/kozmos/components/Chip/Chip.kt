package com.kozmos.components.chip

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

enum class ChipVariant {
    Neutral, Brand, Destructive
}

enum class ChipSize {
    Sm, Default, Lg
}

/**
 * A compact filter, category or removable value.
 *
 * With [onClick] the chip is a button that TalkBack hears as selected or not
 * selected, as React's `aria-pressed` says it (review finding N4): selection
 * used to change only its colours. Without it the chip is a tag — it says
 * what a place is, it is not a choice — and is text, whatever its colours.
 * [onRemove] adds a remove button of its own, named by the chip. Disabled,
 * both are read as disabled and neither runs, however it is pressed.
 */
@Composable
fun KozmosChip(
    text: String,
    modifier: Modifier = Modifier,
    variant: ChipVariant = ChipVariant.Neutral,
    size: ChipSize = ChipSize.Default,
    selected: Boolean = false,
    active: Boolean? = null,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
    onRemove: (() -> Unit)? = null,
    onClick: (() -> Unit)? = null
) = KozmosChip(
    text = text, modifier = modifier, variant = variant, size = size,
    selected = selected, active = active, enabled = enabled, leadingIcon = leadingIcon,
    onRemove = onRemove, removeLabel = "Remove $text", onClick = onClick
)

/**
 * Localized form of [KozmosChip]. [removeLabel] names the remove button in full.
 * The original overload preserves positional arguments and trailing onClick lambdas.
 */
@Composable
fun KozmosChip(
    text: String,
    modifier: Modifier = Modifier,
    variant: ChipVariant = ChipVariant.Neutral,
    size: ChipSize = ChipSize.Default,
    selected: Boolean = false,
    active: Boolean? = null,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
    onRemove: (() -> Unit)? = null,
    removeLabel: String,
    onClick: (() -> Unit)? = null
) {
    val isSelected = active ?: selected
    val colors = chipColors(variant = variant, selected = isSelected)
    val metrics = chipMetrics(size)

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(percent = 50),
        color = colors.container,
        contentColor = colors.content,
        border = BorderStroke(1.dp, colors.border)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .heightIn(min = metrics.minHeight)
                .then(
                    if (onClick != null) {
                        // A button with a state, as the details card's
                        // favourite and save toggles are. The handler checks
                        // enabled itself: the click Compose 1.6 puts in a
                        // disabled node's semantics still runs it.
                        Modifier.selectable(
                            selected = isSelected,
                            enabled = enabled,
                            role = Role.Button,
                            onClick = { if (enabled) onClick() }
                        )
                    } else {
                        Modifier
                    }
                )
                .padding(
                    start = metrics.horizontalPadding,
                    end = if (onRemove != null) KozmosDimensions.primitivesLayoutSpacing50 else metrics.horizontalPadding,
                    top = metrics.verticalPadding,
                    bottom = metrics.verticalPadding
                )
        ) {
            if (leadingIcon != null) {
                Box(
                    modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing200),
                    contentAlignment = Alignment.Center
                ) {
                    leadingIcon()
                }
                Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
            }

            Text(
                text = text,
                color = colors.content,
                fontSize = metrics.fontSize,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )

            if (onRemove != null) {
                Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
                Box(
                    modifier = Modifier
                        .size(KozmosDimensions.primitivesLayoutSizing300)
                        .clip(CircleShape)
                        .clickable(enabled = enabled, role = Role.Button) { if (enabled) onRemove() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = removeLabel,
                        modifier = Modifier.size(12.dp),
                        tint = colors.content
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KozmosChipGroup(
    modifier: Modifier = Modifier,
    horizontalSpacing: Dp = KozmosDimensions.primitivesLayoutSpacing100,
    verticalSpacing: Dp = KozmosDimensions.primitivesLayoutSpacing100,
    content: @Composable () -> Unit
) {
    FlowRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(horizontalSpacing),
        verticalArrangement = Arrangement.spacedBy(verticalSpacing)
    ) {
        content()
    }
}

private data class ChipColors(
    val container: Color,
    val content: Color,
    val border: Color
)

private data class ChipMetrics(
    val horizontalPadding: Dp,
    val verticalPadding: Dp,
    val minHeight: Dp,
    val fontSize: androidx.compose.ui.unit.TextUnit
)

@Composable
@ReadOnlyComposable
private fun chipColors(variant: ChipVariant, selected: Boolean): ChipColors {
    if (selected) {
        return when (variant) {
            ChipVariant.Destructive -> ChipColors(
                container = KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle,
                content = KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentIdle,
                border = KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle
            )
            ChipVariant.Neutral,
            ChipVariant.Brand -> ChipColors(
                container = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle,
                content = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
                border = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
            )
        }
    }

    return when (variant) {
        ChipVariant.Neutral -> ChipColors(
            container = KozmosThemeTokens.primitivesColorsBackground0,
            content = KozmosThemeTokens.primitivesColorsForeground100,
            border = KozmosThemeTokens.primitivesColorsBackground200
        )
        ChipVariant.Brand -> ChipColors(
            container = KozmosThemeTokens.primitivesColorsTheme0,
            content = KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
            border = KozmosThemeTokens.primitivesColorsTheme200
        )
        ChipVariant.Destructive -> ChipColors(
            container = KozmosThemeTokens.primitivesColorsEmotionalDanger0,
            content = KozmosThemeTokens.componentsSecondaryButtonsDangerButtonForegroundContentIdle,
            border = KozmosThemeTokens.primitivesColorsEmotionalDanger200
        )
    }
}

private fun chipMetrics(size: ChipSize): ChipMetrics = when (size) {
    ChipSize.Sm -> ChipMetrics(
        horizontalPadding = KozmosDimensions.primitivesLayoutSpacing100,
        verticalPadding = 0.dp,
        minHeight = 28.dp,
        fontSize = 12.sp
    )
    ChipSize.Default -> ChipMetrics(
        horizontalPadding = KozmosDimensions.primitivesLayoutSpacing150,
        verticalPadding = 0.dp,
        minHeight = 32.dp,
        fontSize = 14.sp
    )
    ChipSize.Lg -> ChipMetrics(
        horizontalPadding = KozmosDimensions.primitivesLayoutSpacing200,
        verticalPadding = 0.dp,
        minHeight = 36.dp,
        fontSize = 14.sp
    )
}
