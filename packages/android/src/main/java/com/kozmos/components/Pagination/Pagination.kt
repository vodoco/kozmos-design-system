package com.kozmos.components.pagination


import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

@Composable
fun KozmosPagination(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        content()
    }
}

@Composable
fun KozmosPaginationLink(
    text: String,
    isActive: Boolean = false,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            .defaultMinSize(minWidth = 36.dp, minHeight = 36.dp)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            // Active, the page is theme/600 text and edge on a 10% tint of it,
            // as React's is (decision 59); it was theme/500.
            .background(if (isActive) KozmosThemeTokens.primitivesColorsTheme600.copy(alpha = 0.1f) else Color.Transparent)
            .clickable { 
                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Pagination", eventName = "page_changed"))
                onClick() 
            }
            .then(
                if (isActive) Modifier.border(1.dp, KozmosThemeTokens.primitivesColorsTheme600, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isActive) KozmosThemeTokens.primitivesColorsTheme600 else KozmosThemeTokens.primitivesColorsForeground100,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
fun KozmosPaginationPrevious(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    /**
     * The word drawn beside the arrow, and what TalkBack says. "Previous" by
     * default, as React's `label`; a product that translates passes its own.
     */
    label: String = "Previous"
) {
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            .defaultMinSize(minHeight = 36.dp)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .clickable(onClick = onClick)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Decoration, as React's hidden chevron: the word names the
            // control. Described as "Previous" too, TalkBack said it twice.
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100)
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
            Text(label, color = KozmosThemeTokens.primitivesColorsForeground100, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun KozmosPaginationNext(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    /**
     * The word drawn beside the arrow, and what TalkBack says. "Next" by
     * default, as React's `label`; a product that translates passes its own.
     */
    label: String = "Next"
) {
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            .defaultMinSize(minHeight = 36.dp)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .clickable(onClick = onClick)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = KozmosThemeTokens.primitivesColorsForeground100, style = MaterialTheme.typography.bodyMedium)
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
            // Decoration, as React's hidden chevron: the word names the
            // control. Described as "Next" too, TalkBack said it twice.
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100)
        }
    }
}

@Composable
fun KozmosPaginationEllipsis(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.defaultMinSize(minWidth = 36.dp, minHeight = 36.dp),
        contentAlignment = Alignment.Center
    ) {
        Text("...", color = KozmosThemeTokens.primitivesColorsForeground500, style = MaterialTheme.typography.bodyLarge)
    }
}
