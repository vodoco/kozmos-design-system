package com.kozmos.utils

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.surface.KozmosSurfaceDefaults
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

@Composable internal fun KozmosRoutePanelSurface(
    presentation: KozmosRoutePresentation, surface: KozmosSurfaceStyle, modifier: Modifier,
    content: @Composable () -> Unit
) {
    if (presentation == KozmosRoutePresentation.Hosted) Box(modifier) { content() } else {
        Surface(modifier, shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
            color = KozmosSurfaceDefaults.tint(surface), border = KozmosSurfaceDefaults.border(surface), tonalElevation = 6.dp, shadowElevation = 12.dp) {
            CompositionLocalProvider(LocalKozmosSurfaceStyle provides surface) {
                Box(Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)) { content() }
            }
        }
    }
}

/** Decorative, fixed-size media: no duplicate destination announcement or error-layout shift. */
@Composable internal fun KozmosDestinationImage(source: String) {
    var loaded by remember(source) { mutableStateOf(false) }
    Box(Modifier.size(48.dp).clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
        .background(KozmosThemeTokens.primitivesColorsBackground100), contentAlignment = Alignment.Center) {
        if (!loaded) Icon(Icons.Default.Place, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100, modifier = Modifier.size(20.dp))
        AsyncImage(model = source, contentDescription = null, contentScale = ContentScale.Crop,
            modifier = Modifier.size(48.dp), onSuccess = { loaded = true }, onError = { loaded = false })
    }
}
