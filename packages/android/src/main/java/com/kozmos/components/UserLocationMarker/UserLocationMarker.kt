package com.kozmos.components.userlocationmarker

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The visitor's position on the map, with an optional heading cone.
 *
 * [label] is what the marker is called, for a visitor who cannot see it. It
 * had no name until row 67, so TalkBack passed over the visitor's own
 * position; React's was "User location" in English whatever the device's
 * language.
 */
@Composable
fun KozmosUserLocationMarker(
    heading: Float = 0f,
    showHeading: Boolean = true,
    modifier: Modifier = Modifier,
    label: String = "User location",
    compact: Boolean = false
) {
    // The marker's blue, fixed in both themes (Semantics.Map marker.dot).
    val markerBlue = KozmosThemeTokens.semanticsMapMarkerDot
    Box(modifier = modifier.size(if (compact) 18.dp else 64.dp).clearAndSetSemantics {
        contentDescription = label
        role = Role.Image
    }, contentAlignment = Alignment.Center) {
    if (!compact) {
    // With system animations off the pulse holds still at 48 and 30 %, as
    // React's does and as Figma draws it. Read in the layer, so a frame of
    // the pulse redraws it without recomposing the marker.
    val pulseScale: State<Float>
    val pulseAlpha: State<Float>
    if (rememberKozmosAnimationsOn()) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    
    pulseScale = infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseScale"
    )
    
    pulseAlpha = infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseAlpha"
    )
    } else {
        pulseScale = remember { mutableStateOf(1f) }
        pulseAlpha = remember { mutableStateOf(0.3f) }
    }

        // The halo: 64 at 14 %, still.
        Box(
            modifier = Modifier
                .size(64.dp)
                .alpha(0.14f)
                .background(KozmosThemeTokens.semanticsMapMarkerDot, CircleShape)
        )

        // The ring: 48, pulsing.
        Box(
            modifier = Modifier
                .size(48.dp)
                .graphicsLayer {
                    scaleX = pulseScale.value
                    scaleY = pulseScale.value
                    alpha = pulseAlpha.value
                }
                .background(KozmosThemeTokens.semanticsMapMarkerDot, CircleShape)
        )

        // Heading Cone
        }
        if (showHeading && !compact) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .graphicsLayer {
                        rotationZ = heading
                    }
                    .drawBehind {
                        val path = Path().apply {
                            moveTo(size.width / 2f, size.height / 2f)
                            lineTo(size.width * 0.15f, 0f)
                            quadraticBezierTo(
                                size.width / 2f, -size.height * 0.1f,
                                size.width * 0.85f, 0f
                            )
                            close()
                        }
                        
                        drawPath(
                            path = path,
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    markerBlue.copy(alpha = 0.4f),
                                    Color.Transparent
                                ),
                                center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height / 2f),
                                radius = size.width / 2f
                            )
                        )
                    }
            )
        }

        // Core Dot
        Box(
            modifier = Modifier
                // The dot: 18, with a 3 ring: the map marker's white, the same in
                // both themes, or for the compact dot the surface it sits on.
                .size(18.dp)
                .background(KozmosThemeTokens.semanticsMapMarkerDot, CircleShape)
                .border(3.dp, if (compact) KozmosThemeTokens.primitivesColorsBackground0 else KozmosThemeTokens.semanticsMapMarkerRing, CircleShape)
        )
    }
}
