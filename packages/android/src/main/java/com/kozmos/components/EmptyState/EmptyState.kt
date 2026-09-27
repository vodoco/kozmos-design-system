package com.kozmos.components.emptystate

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens

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

@Composable
fun KozmosEmptyState(
    title: String,
    description: String? = null,
    icon: (@Composable () -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
    size: KozmosEmptyStateSize = KozmosEmptyStateSize.Default,
    modifier: Modifier = Modifier
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
        
        if (action != null) {
            Spacer(modifier = Modifier.height(size.gap))
            action()
        }
    }
}
