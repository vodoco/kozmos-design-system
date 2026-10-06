package com.kozmos.components.aisearchbutton

import com.kozmos.components.motion.rememberKozmosAnimationsOn
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The AI search, beside the search field: a 43 disc inside a 48 ring whose
 * sweep gradient runs through the theme's own ramp — 300 to 600 and back, the
 * first gradient the system draws, made of tokens — with a 16 icon. The
 * button shows the icon alone and is named by its label.
 */
@Composable
fun KozmosAISearchButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String = "AI search",
    enabled: Boolean = true
) {
    // The prototype's: a 48 circle whose gradient ring is a band two and a
    // half wide around a 43 white disc — nothing overflows the row.
    Box(
        modifier = modifier
            .size(48.dp)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center
    ) {
        // The gradient turns in place, the prototype's 3.6 seconds a turn, unless the
        // system's animations are off; the first frame is the resting one.
        val transition = rememberInfiniteTransition(label = "kozmos-ai-search-ring")
        val ringAngle by transition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(animation = tween(durationMillis = 3600, easing = LinearEasing), repeatMode = RepeatMode.Restart),
            label = "kozmos-ai-search-ring-angle"
        )
        val animationsOn = rememberKozmosAnimationsOn()
        Box(
            modifier = Modifier
                .size(48.dp)
                .graphicsLayer { rotationZ = if (animationsOn) ringAngle else 0f }
                .clip(CircleShape)
                // The prototype's rainbow from the system's own data colours
                // and its success green.
                .background(
                    Brush.sweepGradient(
                        listOf(
                            KozmosThemeTokens.semanticsDataRed,
                            KozmosThemeTokens.semanticsDataYellow,
                            KozmosThemeTokens.primitivesColorsEmotionalSuccess500,
                            KozmosThemeTokens.semanticsDataTeal,
                            KozmosThemeTokens.semanticsDataBlue,
                            KozmosThemeTokens.semanticsDataPurple,
                            KozmosThemeTokens.semanticsDataRed
                        )
                    )
                )
        )
        Surface(
            modifier = Modifier.size(43.dp),
            shape = CircleShape,
            color = KozmosThemeTokens.primitivesColorsBackground0
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = KozmosThemeTokens.primitivesColorsTheme500,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
