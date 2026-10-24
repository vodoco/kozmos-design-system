package com.kozmos.components.breadcrumb

import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.*
import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosBreadcrumb(
    items: List<String>,
    onItemClick: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        items.forEachIndexed { index, item ->
            val isLast = index == items.size - 1
            
            Text(
                text = item,
                style = MaterialTheme.typography.bodyMedium,
                color = if (isLast) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.primitivesColorsForeground400,
                modifier = Modifier
                    .clickable(enabled = !isLast) { onItemClick(index) }
                    // The page the visitor is on, as React's
                    // `aria-current="page"`: selected, as the navigation
                    // item marks its current destination.
                    .semantics { if (isLast) selected = true }
                    .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            if (!isLast) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = KozmosThemeTokens.primitivesColorsForeground400,
                    modifier = Modifier.padding(horizontal = KozmosDimensions.primitivesLayoutSpacing0)
                )
            }
        }
    }
}
