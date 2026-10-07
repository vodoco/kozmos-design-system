package com.kozmos.components.badge

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.counter.CounterTone
import com.kozmos.components.counter.KozmosCounter
import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class BadgeVariant {
    Default, Secondary, Destructive, Outline, Ghost, Link
}

enum class BadgeSize {
    Default, Sm, Lg, Icon
}

@Composable
fun KozmosBadge(
    text: String,
    variant: BadgeVariant = BadgeVariant.Default,
    modifier: Modifier = Modifier,
    size: BadgeSize = BadgeSize.Default,
    counter: String? = null,
    showCounter: Boolean = false
) {
    val (containerColor, contentColor) = when (variant) {
        BadgeVariant.Default -> KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle to KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        BadgeVariant.Secondary -> KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonBackgroundIdle to KozmosThemeTokens.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        BadgeVariant.Destructive -> KozmosThemeTokens.componentsPrimaryButtonsDangerButtonBackgroundIdle to KozmosThemeTokens.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        BadgeVariant.Outline, BadgeVariant.Ghost, BadgeVariant.Link -> Color.Transparent to KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle
    }

    val horizontalPadding = when (size) {
        BadgeSize.Sm -> KozmosDimensions.primitivesLayoutSpacing150
        BadgeSize.Default -> KozmosDimensions.primitivesLayoutSpacing200
        BadgeSize.Lg -> KozmosDimensions.primitivesLayoutSpacing400
        BadgeSize.Icon -> 0.dp
    }

    val hasCounter = size != BadgeSize.Icon && showCounter && counter != null

    Box(
        modifier = modifier
            .height(44.dp)
            .then(if (size == BadgeSize.Icon) Modifier.width(44.dp) else Modifier)
            .background(containerColor, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .border(
                width = if (variant == BadgeVariant.Outline) 1.dp else 0.dp,
                color = if (variant == BadgeVariant.Outline) contentColor else Color.Transparent,
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            )
            .padding(horizontal = horizontalPadding, vertical = 0.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = text,
                color = contentColor,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                textDecoration = if (variant == BadgeVariant.Link) TextDecoration.Underline else TextDecoration.None
            )

            if (hasCounter) {
                KozmosCounter(
                    text = counter.orEmpty(),
                    tone = badgeCounterTone(variant),
                    fill = badgeCounterFill(variant)
                )
            }
        }
    }
}

/**
 * On the default badge, itself the theme fill, the counter inverts, as the
 * FloorSelector's count does on its selected level (Olcay, 2026-10-07): the
 * theme foreground, white in both themes, with its number in the fill. The
 * inverse tone is the page's background and foreground, a dark pill in the
 * dark. The destructive badge keeps the inverse tone.
 */
@Composable
private fun badgeCounterFill(variant: BadgeVariant): KozmosInkedFill? = when (variant) {
    BadgeVariant.Default -> KozmosInkedFill(
        fill = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
        ink = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle
    )
    else -> null
}

private fun badgeCounterTone(variant: BadgeVariant): CounterTone = when (variant) {
    BadgeVariant.Default,
    BadgeVariant.Destructive -> CounterTone.Inverse
    BadgeVariant.Secondary,
    BadgeVariant.Outline,
    BadgeVariant.Ghost,
    BadgeVariant.Link -> CounterTone.Neutral
}
