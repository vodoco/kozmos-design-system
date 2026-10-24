package com.kozmos.components.colorpicker

import androidx.compose.foundation.LocalIndication
import androidx.compose.runtime.CompositionLocalProvider
import com.kozmos.components.Press
import com.kozmos.components.UnpaintedIndication
import com.kozmos.components.live
import com.kozmos.components.press
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * The open colour picker's format box, when the picker cannot be used. React
 * disables its format select with the rest of the panel, `disabled ||
 * readOnly` (`pickerDisabled`), and #392 disables SwiftUI's menu so. Compose's
 * box took a tap in a disabled or read-only picker and moved on to the next
 * format, where the hue and opacity sliders and the presets beside it were
 * already disabled. A finger's taps on the box, in a picker opened with
 * `defaultExpanded`: the usable picker moves HSL to HEX, so the tap lands; a
 * disabled or read-only one keeps HSL, and TalkBack is told the box is
 * disabled.
 */
class KozmosColorPickerInertFormatTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val formats = listOf("HEX", "RGB", "HSL")

    /** The format shown after a finger's tap on the format box, and whether TalkBack is told the box is enabled. */
    private fun afterATap(enabled: Boolean, readOnly: Boolean): Pair<String, Boolean> {
        var shown = ""
        var boxEnabled = true
        paparazzi.live(content = {
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                    KozmosColorPicker(
                        value = "#135BEC",
                        onValueChange = {},
                        defaultExpanded = true,
                        enabled = enabled,
                        readOnly = readOnly
                    )
                }
            }
        }) {
            val box = read().saying("HSL")
            boxEnabled = box.enabled
            press(box.frame.center, Press.Finger)
            shown = read().merged.mapNotNull { it.words }.single { it in formats }
        }
        return shown to boxEnabled
    }

    @Test fun aTapOnTheFormatBoxOfAUsablePickerMovesToTheNextFormat() {
        assertEquals("HEX" to true, afterATap(enabled = true, readOnly = false))
    }

    @Test fun aDisabledPickersFormatBoxKeepsItsFormat() {
        assertEquals("the format shown after a tap, and whether the box is enabled", "HSL" to false, afterATap(enabled = false, readOnly = false))
    }

    @Test fun aReadOnlyPickersFormatBoxKeepsItsFormat() {
        assertEquals("the format shown after a tap, and whether the box is enabled", "HSL" to false, afterATap(enabled = true, readOnly = true))
    }
}
