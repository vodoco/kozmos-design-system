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

@Composable
fun KozmosTableRow(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    val inHeader = LocalKozmosTableHeader.current
    Column {
        Row(
            modifier = modifier
                .fillMaxWidth()
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
