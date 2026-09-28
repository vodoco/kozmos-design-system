package com.kozmos.components.navigationitem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosNavigationItemPlacement {
    Top,
    Side,
    Rail
}

enum class KozmosNavigationItemDensity {
    Default,
    Compact
}

enum class KozmosNavigationItemContent {
    Label,
    IconLabel,
    IconOnly,
    Badge,
    Trailing
}

enum class KozmosNavigationItemState {
    Default,
    Hover,
    Selected,
    Focus,
    Disabled
}

@Composable
fun KozmosNavigationItem(
    label: String? = null,
    modifier: Modifier = Modifier,
    placement: KozmosNavigationItemPlacement = KozmosNavigationItemPlacement.Side,
    density: KozmosNavigationItemDensity = KozmosNavigationItemDensity.Default,
    content: KozmosNavigationItemContent = KozmosNavigationItemContent.Label,
    state: KozmosNavigationItemState = KozmosNavigationItemState.Default,
    selected: Boolean = false,
    enabled: Boolean = true,
    focusVisible: Boolean = false,
    onClick: () -> Unit = {},
    icon: (@Composable () -> Unit)? = null,
    badge: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null
) {
    val isSelected = selected || state == KozmosNavigationItemState.Selected
    val isDisabled = !enabled || state == KozmosNavigationItemState.Disabled
    val isFocusVisible = focusVisible || state == KozmosNavigationItemState.Focus
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val minHeight = when (placement) {
        KozmosNavigationItemPlacement.Rail -> if (density == KozmosNavigationItemDensity.Compact) 64.dp else 72.dp
        else -> 44.dp
    }
    val sizeModifier = when (placement) {
        KozmosNavigationItemPlacement.Side -> Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = minHeight)
        KozmosNavigationItemPlacement.Rail -> Modifier
            .width(if (density == KozmosNavigationItemDensity.Compact) 64.dp else 72.dp)
            .defaultMinSize(minHeight = minHeight)
        KozmosNavigationItemPlacement.Top -> Modifier.defaultMinSize(minHeight = minHeight)
    }
    val backgroundColor = when {
        isSelected || state == KozmosNavigationItemState.Hover || state == KozmosNavigationItemState.Focus ->
            KozmosThemeTokens.primitivesColorsBackground100
        else -> Color.Transparent
    }
    val contentColor = when {
        isDisabled -> KozmosThemeTokens.primitivesColorsForeground500
        isSelected -> KozmosThemeTokens.primitivesColorsTheme500
        else -> KozmosThemeTokens.primitivesColorsForeground100
    }
    val horizontalPadding = when {
        placement == KozmosNavigationItemPlacement.Rail -> 8.dp
        density == KozmosNavigationItemDensity.Compact -> 10.dp
        else -> 12.dp
    }
    val verticalPadding = if (placement == KozmosNavigationItemPlacement.Rail) 8.dp else 8.dp

    val rootModifier = modifier
        .then(sizeModifier)
        .clip(shape)
        .background(backgroundColor, shape)
        .then(
            if (isFocusVisible) {
                Modifier.border(2.dp, KozmosThemeTokens.primitivesColorsTheme500, shape)
            } else {
                Modifier
            }
        )
        .clickable(
            enabled = !isDisabled,
            role = Role.Button,
            onClick = onClick
        )
        .semantics {
            if (isSelected) this.selected = true
            if (isDisabled) disabled()
        }
        .padding(horizontal = horizontalPadding, vertical = verticalPadding)

    CompositionLocalProvider(LocalContentColor provides contentColor) {
        if (placement == KozmosNavigationItemPlacement.Rail) {
            RailNavigationItemContent(
                label = label,
                content = content,
                icon = icon,
                modifier = rootModifier
            )
        } else {
            RowNavigationItemContent(
                label = label,
                placement = placement,
                content = content,
                icon = icon,
                badge = badge,
                trailing = trailing,
                modifier = rootModifier
            )
        }
    }
}

@Composable
private fun RowNavigationItemContent(
    label: String?,
    placement: KozmosNavigationItemPlacement,
    content: KozmosNavigationItemContent,
    icon: (@Composable () -> Unit)?,
    badge: (@Composable () -> Unit)?,
    trailing: (@Composable () -> Unit)?,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (shouldRenderIcon(content) && icon != null) {
            Box(
                modifier = Modifier.size(20.dp),
                contentAlignment = Alignment.Center
            ) {
                icon()
            }
        }

        if (shouldRenderLabel(content) && label != null) {
            Text(
                text = label,
                modifier = if (placement == KozmosNavigationItemPlacement.Side) Modifier.weight(1f) else Modifier,
                color = LocalContentColor.current,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )
        }

        if (content == KozmosNavigationItemContent.Badge && badge != null) {
            Box(
                modifier = Modifier
                    .defaultMinSize(minHeight = 20.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(KozmosThemeTokens.primitivesColorsBackground0)
                    .border(1.dp, KozmosThemeTokens.primitivesColorsBackground200, RoundedCornerShape(999.dp))
                    .padding(horizontal = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                CompositionLocalProvider(LocalContentColor provides KozmosThemeTokens.primitivesColorsForeground100) {
                    badge()
                }
            }
        }

        if (content == KozmosNavigationItemContent.Trailing && trailing != null) {
            CompositionLocalProvider(LocalContentColor provides KozmosThemeTokens.primitivesColorsForeground500) {
                trailing()
            }
        }
    }
}

@Composable
private fun RailNavigationItemContent(
    label: String?,
    content: KozmosNavigationItemContent,
    icon: (@Composable () -> Unit)?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (shouldRenderIcon(content) && icon != null) {
            Box(
                modifier = Modifier.size(24.dp),
                contentAlignment = Alignment.Center
            ) {
                icon()
            }
        }

        if (shouldRenderLabel(content) && label != null) {
            // Every rail tile's label is labelSmall, 11sp, on 14sp lines and
            // up to two of them, as React's is 11px on 14px (decision 36); a
            // third line is cut at the end of the second. labelSmall's own
            // 16sp line made a two-line tile 76dp tall; 14 keeps it 72.
            // The lines are set as CSS sets them, the leading split evenly
            // above and below each: Material 3 1.1 pads each line with the
            // font's own padding, which a 14sp line cannot hold (two lines
            // took 29dp and the tile 73), and Compose trims the leading above
            // the first line and below the last (27dp); two lines are 28.
            Text(
                text = label,
                color = LocalContentColor.current,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                lineHeight = 14.sp,
                style = MaterialTheme.typography.labelSmall.copy(
                    platformStyle = PlatformTextStyle(includeFontPadding = false),
                    lineHeightStyle = LineHeightStyle(
                        alignment = LineHeightStyle.Alignment.Center,
                        trim = LineHeightStyle.Trim.None
                    )
                ),
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

private fun shouldRenderIcon(content: KozmosNavigationItemContent): Boolean {
    return content != KozmosNavigationItemContent.Label
}

private fun shouldRenderLabel(content: KozmosNavigationItemContent): Boolean {
    return content != KozmosNavigationItemContent.IconOnly
}
