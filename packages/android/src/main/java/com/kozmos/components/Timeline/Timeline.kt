package com.kozmos.components.timeline

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import com.kozmos.tokens.KozmosThemeTokens

data class TimelineItem(
    val time: String,
    val title: String,
    val description: String
)

enum class KozmosTimelineDensity {
    Default,
    Compact
}

private val LocalKozmosTimelineDensity = staticCompositionLocalOf {
    KozmosTimelineDensity.Default
}

private val KozmosTimelineDensity.contentSpacing
    get() = if (this == KozmosTimelineDensity.Compact) {
        KozmosDimensions.primitivesLayoutSpacing25
    } else {
        KozmosDimensions.primitivesLayoutSpacing50
    }

private val KozmosTimelineDensity.itemBottomPadding
    get() = if (this == KozmosTimelineDensity.Compact) {
        KozmosDimensions.primitivesLayoutSpacing200
    } else {
        KozmosDimensions.primitivesLayoutSpacing400
    }

@Composable
fun KozmosTimeline(
    modifier: Modifier = Modifier,
    density: KozmosTimelineDensity = KozmosTimelineDensity.Default,
    content: @Composable ColumnScope.() -> Unit
) {
    CompositionLocalProvider(LocalKozmosTimelineDensity provides density) {
        Column(
            modifier = modifier,
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing0)
        ) {
            content()
        }
    }
}

@Composable
fun KozmosTimelineItem(
    modifier: Modifier = Modifier,
    isLast: Boolean = false,
    content: @Composable ColumnScope.() -> Unit
) {
    val density = LocalKozmosTimelineDensity.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min)
    ) {
        Column(
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
            modifier = Modifier.width(KozmosDimensions.primitivesLayoutSizing500)
        ) {
            Box(
                modifier = Modifier
                    .size(KozmosDimensions.primitivesLayoutSpacing150)
                    .clip(CircleShape)
                    // A mark on a surface: theme/600 (decision 59).
                    .background(KozmosThemeTokens.primitivesColorsTheme600)
            )
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(KozmosDimensions.primitivesLayoutSpacing25)
                        .fillMaxHeight()
                        .background(KozmosThemeTokens.primitivesColorsBackground300)
                        .padding(top = KozmosDimensions.primitivesLayoutSpacing50)
                )
            }
        }
        
        Column(
            modifier = Modifier
                .padding(
                    start = KozmosDimensions.primitivesLayoutSpacing100, 
                    bottom = if (isLast) KozmosDimensions.primitivesLayoutSpacing0 else density.itemBottomPadding
                )
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(density.contentSpacing)
        ) {
            content()
        }
    }
}

@Composable
fun KozmosTimelineTime(
    time: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = time,
        style = MaterialTheme.typography.labelMedium,
        color = KozmosThemeTokens.primitivesColorsForeground500,
        modifier = modifier
    )
}

@Composable
fun KozmosTimelineTitle(
    title: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = KozmosThemeTokens.primitivesColorsForeground100,
        modifier = modifier
    )
}

@Composable
fun KozmosTimelineDescription(
    description: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium,
        color = KozmosThemeTokens.primitivesColorsForeground500,
        modifier = modifier
    )
}
