package com.kozmos.components.card

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/**
 * How much room a card gives its content.
 *
 * [Default] is 24 on every side, the card as the system has always drawn it.
 * [Compact] is 16, for a card that is one setting in a column of settings
 * rather than a thing on its own (GAP-034).
 *
 * It is set on [KozmosCard] and reaches the parts through a CompositionLocal,
 * because a card padded one amount at the header and another at the content is
 * the bug, not the fix.
 */
enum class KozmosCardPadding {
    Default,
    Compact;

    val length: Dp
        get() = when (this) {
            Default -> KozmosDimensions.primitivesLayoutSpacing300
            Compact -> KozmosDimensions.primitivesLayoutSpacing200
        }
}

private val LocalKozmosCardPadding = compositionLocalOf { KozmosCardPadding.Default }

@Composable
fun KozmosCard(
    modifier: Modifier = Modifier,
    padding: KozmosCardPadding = KozmosCardPadding.Default,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.border(
            1.dp,
            KozmosThemeTokens.primitivesColorsBackground200,
            RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer)
        ),
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
        colors = CardDefaults.cardColors(
            containerColor = KozmosThemeTokens.primitivesColorsBackground0,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        content = {
            CompositionLocalProvider(LocalKozmosCardPadding provides padding) {
                Column(modifier = Modifier) {
                    content()
                }
            }
        }
    )
}

@Composable
fun KozmosCardHeader(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier.padding(LocalKozmosCardPadding.current.length)
    ) {
        content()
    }
}

@Composable
fun KozmosCardTitle(
    title: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.SemiBold,
        color = KozmosThemeTokens.primitivesColorsForeground100,
        modifier = modifier
    )
}

@Composable
fun KozmosCardDescription(
    description: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = description,
        style = MaterialTheme.typography.bodyMedium,
        color = KozmosThemeTokens.primitivesColorsForeground400,
        modifier = modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing50)
    )
}

@Composable
fun KozmosCardContent(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    // Sides and bottom only: a header above has already paid the top.
    val padding = LocalKozmosCardPadding.current.length
    Column(
        modifier = modifier
            .padding(horizontal = padding)
            .padding(bottom = padding)
    ) {
        content()
    }
}

@Composable
fun KozmosCardFooter(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    val padding = LocalKozmosCardPadding.current.length
    Row(
        modifier = modifier
            .padding(horizontal = padding)
            .padding(bottom = padding),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        content()
    }
}
