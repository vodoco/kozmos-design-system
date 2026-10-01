package com.kozmos.components.mapoverlay

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

enum class OverlayPosition {
    TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, TOP_CENTER, BOTTOM_CENTER,
    TOP_START, TOP_END, BOTTOM_START, BOTTOM_END
}

internal fun OverlayPosition.alignment(direction: LayoutDirection): Alignment {
    val rtl = direction == LayoutDirection.Rtl
    return when (this) {
        OverlayPosition.TOP_LEFT -> if (rtl) Alignment.TopEnd else Alignment.TopStart
        OverlayPosition.TOP_RIGHT -> if (rtl) Alignment.TopStart else Alignment.TopEnd
        OverlayPosition.BOTTOM_LEFT -> if (rtl) Alignment.BottomEnd else Alignment.BottomStart
        OverlayPosition.BOTTOM_RIGHT -> if (rtl) Alignment.BottomStart else Alignment.BottomEnd
        OverlayPosition.TOP_START -> Alignment.TopStart
        OverlayPosition.TOP_END -> Alignment.TopEnd
        OverlayPosition.BOTTOM_START -> Alignment.BottomStart
        OverlayPosition.BOTTOM_END -> Alignment.BottomEnd
        OverlayPosition.TOP_CENTER -> Alignment.TopCenter
        OverlayPosition.BOTTOM_CENTER -> Alignment.BottomCenter
    }
}

@Composable
fun KozmosMapOverlay(
    modifier: Modifier = Modifier,
    position: OverlayPosition = OverlayPosition.TOP_LEFT,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            // Translates `pointer-events-none` into native transparent interaction bounds
            // Ensures Android System Navigation Bars do not collide with absolute components
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        val alignment = position.alignment(LocalLayoutDirection.current)

        // Structural map geometry clearance (MapLibre telemetry / Compass bounds)
        val paddingModifier = when (position) {
            OverlayPosition.BOTTOM_LEFT, OverlayPosition.BOTTOM_RIGHT, OverlayPosition.BOTTOM_CENTER,
            OverlayPosition.BOTTOM_START, OverlayPosition.BOTTOM_END ->
                Modifier.padding(bottom = KozmosDimensions.primitivesLayoutSpacing600, start = KozmosDimensions.primitivesLayoutSpacing200, end = KozmosDimensions.primitivesLayoutSpacing200, top = KozmosDimensions.primitivesLayoutSpacing200)
            else -> Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)
        }

        Box(
            modifier = Modifier
                .align(alignment)
                .then(paddingModifier)
                .widthIn(max = 384.dp) // `md:w-96` standard bounds translation natively
        ) {
            content()
        }
    }
}
