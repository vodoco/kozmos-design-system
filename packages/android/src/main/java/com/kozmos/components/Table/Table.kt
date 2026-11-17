package com.kozmos.components.table

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosMotion
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay

/**
 * True inside a table's header: the table draws the line under its header, so
 * a [KozmosTableRow] there draws none of its own. With both, the header had
 * two lines, one on the other, twice as thick as a body row's.
 */
private val LocalKozmosTableHeader = staticCompositionLocalOf { false }

@Composable
fun KozmosTable(
    modifier: Modifier = Modifier,
    header: @Composable (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
    ) {
        if (header != null) {
            CompositionLocalProvider(LocalKozmosTableHeader provides true) { header() }
            Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
        }
        content()
    }
}

/** A table row's highlight (GAP-276): [New], a row just added. */
enum class KozmosTableRowHighlight {
    /** A short tint in the informative surface that fades, so the eye finds the row. */
    New
}

/**
 * How much of a [KozmosTableRowHighlight.New] tint shows [elapsed]
 * milliseconds after it was set (GAP-276): all of it for three deliberate
 * durations, then fading over a fourth on the standard curve, then none. With
 * animations off it shows in full and clears at the same mark, with no fade.
 */
internal fun tableRowHighlightAlpha(elapsed: Long, animationsOn: Boolean): Float {
    val deliberate = KozmosMotion.semanticsMotionDurationDeliberate.toLong()
    val hold = deliberate * 3
    if (elapsed >= hold + deliberate) return 0f
    if (!animationsOn || elapsed <= hold) return 1f
    val progress = (elapsed - hold).toFloat() / deliberate
    return 1f - KozmosMotion.semanticsMotionEasingStandard.transform(progress)
}

/**
 * A table row, with a line under it. [highlight] [KozmosTableRowHighlight.New]
 * marks a row just added (GAP-276): it is drawn on the informative surface,
 * held three deliberate durations and faded over a fourth; with the system's
 * animations off it shows and clears at the same mark with no fade. Setting
 * it again after it has cleared does not run it again: key the row to show a
 * new one.
 */
@Composable
fun KozmosTableRow(
    modifier: Modifier = Modifier,
    highlight: KozmosTableRowHighlight? = null,
    content: @Composable RowScope.() -> Unit
) {
    val inHeader = LocalKozmosTableHeader.current
    val tint = if (highlight == KozmosTableRowHighlight.New) {
        val animationsOn = rememberKozmosAnimationsOn()
        var alpha by remember(highlight) { mutableFloatStateOf(1f) }
        LaunchedEffect(highlight, animationsOn) {
            if (!animationsOn) {
                delay(KozmosMotion.semanticsMotionDurationDeliberate * 4L)
                alpha = 0f
                return@LaunchedEffect
            }
            val start = withFrameMillis { it }
            while (alpha > 0f) {
                alpha = tableRowHighlightAlpha(withFrameMillis { it } - start, animationsOn = true)
            }
        }
        KozmosThemeTokens.semanticsEmotionInformativeSurface.copy(
            alpha = KozmosThemeTokens.semanticsEmotionInformativeSurface.alpha * alpha
        )
    } else {
        Color.Transparent
    }
    Column {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .then(if (highlight != null) Modifier.background(tint) else Modifier)
                .padding(KozmosDimensions.primitivesLayoutSpacing200),
            content = content
        )
        // One line under each row, as React's border-b; the table draws the
        // header's.
        if (!inHeader) Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
    }
}

@Composable
fun RowScope.KozmosTableCell(
    text: String,
    modifier: Modifier = Modifier,
    weight: Float = 1f
) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        modifier = modifier.weight(weight)
    )
}

@Composable
fun RowScope.KozmosTableHeaderCell(
    text: String,
    modifier: Modifier = Modifier,
    weight: Float = 1f
) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall,
        color = KozmosThemeTokens.primitivesColorsForeground400,
        modifier = modifier.weight(weight)
    )
}
