package com.kozmos.components.backdrop

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosBackdrop(
    visible: Boolean = true,
    onTap: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    if (visible) {
        val tap by rememberUpdatedState(onTap)
        Box(
            modifier = modifier
                .fillMaxSize()
                // The scrim role, as React, Figma, the dialog and the drawer
                // draw it: black at half, in both themes. It was background/800
                // at 40 % until 2026-09-22, which turns light in dark mode.
                .background(KozmosThemeTokens.semanticsOverlayScrim)
                // A tap dismisses, but the scrim is no control: as React's
                // plain div and SwiftUI's tap gesture, it has no role, name
                // or focus, so TalkBack and a keyboard pass over it. The
                // overlay it dims has its own close and Back. It was a
                // `clickable` until 2026-10-20: an unnamed control TalkBack
                // focused, and a stop for a keyboard's Tab.
                .pointerInput(Unit) { detectTapGestures { tap() } }
        )
    }
}
