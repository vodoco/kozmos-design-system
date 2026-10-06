package com.kozmos.components.motion

import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext

/**
 * Whether the system lets things move: false once the visitor removes
 * animations, which sets the animator duration scale to 0. A test says so
 * here; Paparazzi drops a write to the setting itself, so a test that writes
 * it draws with animations on whatever it asked for.
 */
internal val LocalKozmosAnimationsOn = staticCompositionLocalOf<Boolean?> { null }

/**
 * The system's animator duration scale, read once per context, as Spinner,
 * Skeleton, Progress and AISearchButton each read it, unless a test has said
 * otherwise through [LocalKozmosAnimationsOn].
 */
@Composable
internal fun rememberKozmosAnimationsOn(): Boolean {
    val said = LocalKozmosAnimationsOn.current
    val context = LocalContext.current
    val system = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) > 0f
    }
    return said ?: system
}
