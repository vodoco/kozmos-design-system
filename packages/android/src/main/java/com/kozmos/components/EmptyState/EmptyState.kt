package com.kozmos.components.emptystate

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.progress.KozmosProgress
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.roundToInt

/**
 * How much room an empty state takes.
 *
 * [Default] pads itself and fills its region, which is right when the empty
 * state IS the screen. [Compact] is for a slot that already draws a box round
 * it - a result list's empty slot, a card, a panel section. Measured on the
 * web, the same content came to 258dp in a result list and about 128 compact
 * (GAP-009).
 */
enum class KozmosEmptyStateSize {
    Default,
    Compact;

    val padding: Dp get() = if (this == Compact) 16.dp else 24.dp
    val gap: Dp get() = if (this == Compact) 8.dp else 16.dp
}

/**
 * A long wait the empty state is explaining, such as a download, and how far
 * it has got (GAP-115). [value] runs from 0 to 1 (clamped, and NaN is 0);
 * [label] says what is in progress and names the bar; [valueText] says how
 * far in words ("40%", "12 of 30 MB") and is read as its state.
 */
data class KozmosEmptyStateProgress(
    val value: Float,
    val label: String,
    val valueText: String? = null
)

@Composable
fun KozmosEmptyState(
    title: String,
    description: String? = null,
    icon: (@Composable () -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
    size: KozmosEmptyStateSize = KozmosEmptyStateSize.Default,
    modifier: Modifier = Modifier,
    progress: KozmosEmptyStateProgress? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(size.padding),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (icon != null) {
            icon()
            Spacer(modifier = Modifier.height(size.gap))
        }
        
        Text(
            text = title,
            color = KozmosThemeTokens.primitivesColorsForeground100,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium,
            textAlign = TextAlign.Center
        )
        
        if (description != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                color = KozmosThemeTokens.primitivesColorsForeground300,
                fontSize = 14.sp,
                textAlign = TextAlign.Center
            )
        }
        
        if (progress != null) {
            // NaN is none done, as on React: coerceIn keeps a NaN, which the
            // range info refuses and roundToInt throws on.
            val value = if (progress.value.isNaN()) 0f else progress.value.coerceIn(0f, 1f)
            Spacer(modifier = Modifier.height(size.gap))
            // One node: what is in progress, and how far it has got.
            Column(
                modifier = Modifier.widthIn(max = 280.dp).fillMaxWidth().clearAndSetSemantics {
                    contentDescription = progress.label
                    // Rounded, as React and SwiftUI do: cut down, 0.999 said "99%".
                    stateDescription = progress.valueText ?: "${(value * 100).roundToInt()}%"
                    progressBarRangeInfo = ProgressBarRangeInfo(value, 0f..1f)
                }
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = progress.label,
                        color = KozmosThemeTokens.primitivesColorsForeground100,
                        fontSize = 14.sp,
                        modifier = Modifier.weight(1f)
                    )
                    if (progress.valueText != null) {
                        Text(
                            text = progress.valueText,
                            color = KozmosThemeTokens.primitivesColorsForeground300,
                            fontSize = 14.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                KozmosProgress(progress = value, modifier = Modifier.fillMaxWidth())
            }
        }

        if (action != null) {
            Spacer(modifier = Modifier.height(size.gap))
            action()
        }
    }
}
