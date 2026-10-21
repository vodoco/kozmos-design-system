package com.kozmos.components.avatar

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import coil.compose.AsyncImagePainter
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosAvatar(
    imageUrl: String?,
    fallbackText: String,
    modifier: Modifier = Modifier
) {
    // The initials stand in until the image has loaded, and stay if it never
    // does, as React's Radix fallback and SwiftUI's AsyncImage placeholder.
    // With a URL, a slow or broken image left an empty grey circle until
    // 2026-10-20.
    var loaded by remember(imageUrl) { mutableStateOf(false) }
    KozmosAvatarFace(fallbackText = fallbackText, loaded = loaded, modifier = modifier) {
        if (imageUrl != null) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                onState = { state -> loaded = state is AsyncImagePainter.State.Success },
                modifier = Modifier.matchParentSize()
            )
        }
    }
}

/**
 * What the avatar draws: a circle with the image in it, cropped. Until the
 * image has [loaded] the initials on the muted fill stand in for it; once it
 * has, nothing is drawn under it, as on the web, where the fallback goes once
 * the image loads.
 */
@Composable
internal fun KozmosAvatarFace(
    fallbackText: String,
    loaded: Boolean,
    modifier: Modifier = Modifier,
    image: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .size(KozmosDimensions.primitivesLayoutSizing500)
            .clip(CircleShape)
            .then(if (loaded) Modifier else Modifier.background(KozmosThemeTokens.primitivesColorsBackground300)),
        contentAlignment = Alignment.Center
    ) {
        if (!loaded) {
            Text(
                text = fallbackText,
                style = MaterialTheme.typography.titleMedium,
                color = KozmosThemeTokens.primitivesColorsForeground500
            )
        }
        image()
    }
}
