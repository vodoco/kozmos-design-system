package com.kozmos.components.link

import androidx.compose.foundation.clickable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosLink(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Text(
        text = text,
        // Theme-coloured text on a surface is theme/600, as React's is
        // (decision 59): theme/500 read 3.13:1 on the dark greys.
        color = KozmosThemeTokens.primitivesColorsTheme600,
        textDecoration = TextDecoration.Underline,
        modifier = modifier.clickable { onClick() }
    )
}
