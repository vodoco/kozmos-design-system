package com.kozmos.components.motion

import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalContext

/**
 * The system's animator duration scale, as a test says it: 0 when the
 * visitor has removed animations. Paparazzi drops a write to the setting
 * itself, so a test that writes it draws with animations on whatever it
 * asked for; it says the scale here instead.
 */
internal val LocalKozmosAnimatorScale = staticCompositionLocalOf<Float?> { null }

/**
 * The system's animator duration scale, followed while the part is shown, so
 * removing animations stops what is moving without a restart; unless a test
 * has said otherwise through [LocalKozmosAnimatorScale]. Spinner, Skeleton,
 * Progress, AISearchButton and UserLocationMarker read it here.
 */
@Composable
internal fun rememberKozmosAnimatorScale(): Float {
    val said = LocalKozmosAnimatorScale.current
    val resolver = LocalContext.current.contentResolver
    var scale by remember(resolver) {
        mutableFloatStateOf(
            Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
        )
    }
    DisposableEffect(resolver) {
        val settings = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                scale = Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
            }
        }
        resolver.registerContentObserver(
            Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),
            false,
            settings
        )
        onDispose { resolver.unregisterContentObserver(settings) }
    }
    return said ?: scale
}

/** Whether the system lets things move: a scale above 0. */
@Composable
internal fun rememberKozmosAnimationsOn(): Boolean {
    val scale = rememberKozmosAnimatorScale()
    return scale > 0f && scale.isFinite()
}
