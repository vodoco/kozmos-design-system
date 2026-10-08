package com.kozmos.components.categoryfield

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The search field's form once a quick-access category is chosen — the
 * prototype's, measured: 48 tall, the control radius, the category's colour
 * at 12 % with a 1-dp border of it, the icon at 28, the name at 15 semibold,
 * a 22-tall count pill filled with the colour, a 32 clear at the end. It
 * takes the field's place in the search row.
 *
 * Mirrors `CategoryField` on the web and `KozmosCategoryField` on iOS.
 */
@Composable
fun KozmosCategoryField(
    label: String,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
    count: Int? = null,
    // null is the field with no category, the theme's own tint, as the
    // tile's and the pin's are and React's undefined; it could not be null
    // until 2026-09-22, so Code Connect's Theme had to spell light colours out.
    tint: KozmosCategoryTint? = null,
    clearLabel: String = "Clear category",
    countLabel: (Int) -> String = { "$it places" },
    icon: (@Composable () -> Unit)? = null
) {
    // No category: the theme's accent, theme/600, for the border, the icon
    // and the wash, as they are on a surface (decision 59), and the theme
    // fill pair for the count pill.
    val categoryTint = tint ?: KozmosCategoryTint(
        KozmosThemeTokens.primitivesColorsTheme600,
        KozmosInkedFill(KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle, KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
    )
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Row(
        modifier = modifier
            .height(48.dp)
            .clip(shape)
            .background(categoryTint.accent.copy(alpha = 0.12f))
            .border(1.dp, categoryTint.accent, shape)
            .padding(start = KozmosDimensions.primitivesLayoutSpacing150, end = KozmosDimensions.primitivesLayoutSpacing25)
            .semantics(mergeDescendants = false) {
                contentDescription = if (count == null) label else "$label, ${countLabel(count)}"
            },
        verticalAlignment = Alignment.CenterVertically
    ) {
        CompositionLocalProvider(LocalContentColor provides categoryTint.accent) {
            if (icon != null) {
                // Decorative: the name beside it says what it shows.
                Box(
                    modifier = Modifier.size(28.dp).clearAndSetSemantics {},
                    contentAlignment = Alignment.Center
                ) { icon() }
                Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing100))
            }
            // The name and its count take what the icon and the clear leave:
            // the name shrinks first, the pill follows it, and the clear stays
            // at the trailing edge, as on React and iOS. A spacer weighted
            // against the weighted, non-filling name left the name's unused
            // share after the clear, so the clear floated inward (2026-09-21).
            Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                // The name and the clear's cross in the foreground, themed:
                // the category colour on its own wash failed 4.5:1 for seven
                // tints (Olcay, 2026-09-21).
                Text(
                    text = label,
                    color = KozmosThemeTokens.primitivesColorsForeground0,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                if (count != null) {
                    Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSpacing100))
                    Box(
                        modifier = Modifier
                            .defaultMinSize(minWidth = 22.dp, minHeight = 22.dp)
                            .clip(CircleShape)
                            .background(categoryTint.fill.fill)
                            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing75)
                            .semantics { contentDescription = countLabel(count) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = count.toString(), color = categoryTint.fill.ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            // The clear: a 32 circle to see, the 44 target around it to hit,
            // as the search bar's (Olcay, 2026-09-21). The row's end padding
            // is 2, so the circle sits 8 from the edge; the press shows on
            // the circle.
            val clearInteraction = remember { MutableInteractionSource() }
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clickable(
                        interactionSource = clearInteraction,
                        indication = null,
                        role = Role.Button,
                        onClick = onClear
                    )
                    .semantics { contentDescription = clearLabel },
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .indication(clearInteraction, LocalIndication.current),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground0, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
