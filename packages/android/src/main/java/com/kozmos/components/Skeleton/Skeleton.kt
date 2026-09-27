package com.kozmos.components.skeleton

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import android.provider.Settings
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

fun Modifier.shimmer(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 1000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer"
    )
    
    val shimmerColors = listOf(
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.6f),
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.2f),
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.6f),
    )
    
    // Held still when the system's animations are off, as the assistant's ring
    // and the spinner are: the sheen ran whatever the preference said, which is
    // GAP-50's third part. Stopped it rests at the sweep's start, which is the
    // surface's own grey with the sheen off the end.
    val context = LocalContext.current
    val animationsOn = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) > 0f
    }
    val sweep = if (animationsOn) translateAnimation.value else 1000f

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = sweep, y = sweep)
    )
    
    background(brush)
}

@Composable
fun KozmosSkeleton(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(KozmosThemeTokens.primitivesColorsBackground100, RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
            .shimmer()
    )
}
