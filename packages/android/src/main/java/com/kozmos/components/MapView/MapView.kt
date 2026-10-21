package com.kozmos.components.mapview

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosMapView(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit = {}
) {
    Box(
        modifier = modifier
            .defaultMinSize(minHeight = 400.dp)
            // Clipped, then filled: the fill keeps to the rounded corners, as
            // React's overflow-hidden box does. It was filled first, so the
            // fill kept square corners outside the rounded border.
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .background(KozmosThemeTokens.primitivesColorsBackground100)
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.1f))
        )
        content()
    }
}
