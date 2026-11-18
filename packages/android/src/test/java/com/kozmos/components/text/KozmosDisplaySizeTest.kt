package com.kozmos.components.text

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import com.kozmos.components.heading.KozmosHeading
import com.kozmos.components.heading.KozmosHeadingLevel
import com.kozmos.components.heading.KozmosHeadingSize
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosTypography
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 203 (GAP-272) on Compose: one display size, 48sp bold on 54sp
 * lines from the display type tokens, as `KozmosTextStyle.Display` and as
 * `KozmosHeading(size = KozmosHeadingSize.Display)`, which keeps its level
 * as its rank. Read off the laid-out words.
 */
class KozmosDisplaySizeTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theDisplayStyleIs48On54BoldFromTheTokens() {
        val style = KozmosTypography.display
        assertEquals(48f, style.fontSize.value, 0f)
        assertEquals(54f, style.lineHeight.value, 0f)
        assertEquals(700, style.fontWeight?.weight)
        assertEquals(0f, style.letterSpacing.value, 0f)
    }

    @Test fun textAndHeadingAtTheDisplaySizeDrawAsTheStyleDoes() {
        var density = 0f
        var fontScale = 0f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            fontScale = LocalDensity.current.fontScale
            KozmosMaterialTheme {
                Column {
                    KozmosText(text = "Digitize", modifier = Modifier.testTag("text"), style = KozmosTextStyle.Display)
                    KozmosHeading(
                        text = "Digitize",
                        modifier = Modifier.testTag("heading"),
                        level = KozmosHeadingLevel.H2,
                        size = KozmosHeadingSize.Display
                    )
                    KozmosHeading(text = "Digitize", modifier = Modifier.testTag("h1"))
                    Text(text = "Digitize", modifier = Modifier.testTag("reference"), style = KozmosTypography.display)
                    Text(text = "Digitize\nDigitize", modifier = Modifier.testTag("two"), style = KozmosTypography.display)
                }
            }
        }
        val frame = { tag: String -> tree.unmerged.first { it.tag == tag }.frame }
        val line = 54f * density * fontScale
        assertEquals("two lines are 54 apart", line, frame("two").height - frame("reference").height, 1f)
        assertEquals("Text at the display size", frame("reference").height, frame("text").height, 0.5f)
        assertEquals("Text at the display size, as wide", frame("reference").width, frame("text").width, 0.5f)
        assertEquals("Heading at the display size", frame("reference").height, frame("heading").height, 0.5f)
        assertEquals("Heading at the display size, as wide", frame("reference").width, frame("heading").width, 0.5f)
        assert(frame("h1").height < frame("heading").height) { "a level 1 heading is smaller than the display size" }
    }
}
