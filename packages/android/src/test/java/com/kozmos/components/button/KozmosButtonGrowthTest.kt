package com.kozmos.components.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class KozmosButtonGrowthTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    @Test fun enlargedTranslatedLabelsGrowInsteadOfClipping() {
        for (direction in LayoutDirection.values()) {
            for (variant in KozmosButtonVariant.values()) {
                var button = Rect.Zero
                var label = Rect.Zero
                var layout: TextLayoutResult? = null
                var density = 1f
                paparazzi.drawn(frames) {
                    density = LocalDensity.current.density
                    CompositionLocalProvider(
                        LocalDensity provides Density(density, fontScale = 2f),
                        LocalLayoutDirection provides direction,
                    ) {
                        MaterialTheme {
                            Box(Modifier.width(200.dp)) {
                                KozmosButton(onClick = {}, variant = variant,
                                    modifier = Modifier.onGloballyPositioned { button = it.boundsInRoot() }) {
                                    Text("Wegbeschreibung zu diesem Ziel anzeigen",
                                        modifier = Modifier.onGloballyPositioned { label = it.boundsInRoot() },
                                        onTextLayout = { layout = it })
                                }
                            }
                        }
                    }
                }
                val result = checkNotNull(layout)
                assertTrue("$variant $direction needs multiple lines", result.lineCount > 1)
                assertFalse("$variant $direction clips the label", result.hasVisualOverflow)
                assertTrue("$variant $direction must grow beyond 44dp: $button", button.height / density > 44f)
                assertTrue("label must stay inside button: $label / $button",
                    label.left >= button.left && label.right <= button.right &&
                        label.top >= button.top && label.bottom <= button.bottom)
            }
        }
    }
}
