package com.kozmos.components.button

import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.LocalViewConfiguration
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/** Real pointer delivery across the labelled button's 48dp target. */
class KozmosButtonTouchTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun labelledButtonKeeps48DpTouchInputAndInertStates() {
        for ((enabled, loading) in listOf(true to false, false to false, true to true)) {
            var received = 0
            var frame = Rect.Zero
            var density = 1f
            var target = ""
            val view = ComposeView(paparazzi.context).apply {
                setContent {
                    val host = LocalView.current
                    density = LocalDensity.current.density
                    target = LocalViewConfiguration.current.minimumTouchTargetSize.toString()
                    MaterialTheme {
                        Box(Modifier.fillMaxSize().padding(60.dp)) {
                            KozmosButton(onClick = { received++ }, enabled = enabled, isLoading = loading,
                                modifier = Modifier.onGloballyPositioned { frame = it.boundsInRoot() }) {
                                Text("Go")
                            }
                        }
                    }
                    LaunchedEffect(Unit) {
                        repeat(3) { withFrameNanos { } }
                        // Centre and one dp inside each edge, not just the text.
                        for (y in listOf(frame.center.y, frame.top + density, frame.bottom - density)) {
                            val down = SystemClock.uptimeMillis()
                            val press = MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, frame.center.x, y, 0)
                            host.dispatchTouchEvent(press)
                            press.recycle()
                            withFrameNanos { }
                            val release = MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, frame.center.x, y, 0)
                            host.dispatchTouchEvent(release)
                            release.recycle()
                            repeat(2) { withFrameNanos { } }
                        }
                    }
                }
            }
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
            paparazzi.gif(view, "touch", start = 0L, end = 1000L, fps = 20)
            assertEquals("Material target reservation", 48f, frame.height / density, 0.5f)
            assertEquals("enabled=$enabled loading=$loading frame=$frame density=$density target=$target", if (enabled && !loading) 3 else 0, received)
        }
    }
}
