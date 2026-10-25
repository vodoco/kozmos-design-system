package com.kozmos.components.text

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * SwiftUI's `KozmosText` takes a `style`, a step of `KozmosTextStyle` on the
 * type ramp; React's `Text` a size and a weight. Compose's took only the words
 * and a modifier, so a sheet's title drawn with it read as body text.
 *
 * Each step is the Material role Compose's parts already draw that step in:
 * title3 is Card's title (titleLarge), headline WayfindingCard's and Alert's
 * titles (titleMedium), subheadline the descriptions of Toast, Card and Alert
 * (bodyMedium), footnote MapStatusPill's 13sp on 16sp lines, caption Tag's
 * 12sp (bodySmall), caption2 BottomNavigation's labels (labelSmall), and
 * title2 the step above title3 (headlineSmall). Read off the laid-out words:
 * a step draws exactly as its role does, and no style draws as before.
 */
class KozmosTextStyleTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val words = "Ag Wayfinding"

    /** The size [content] lays [words] out at, found by its tag. */
    private fun sizes(content: @Composable () -> Unit): Map<String, String> {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { Column { content() } } }
        return tree.unmerged.filter { it.tag != null }
            .associate { it.tag!! to "%.1f×%.1f".format(it.frame.width, it.frame.height) }
    }

    @Test fun eachStepDrawsAsTheMaterialRoleComposesPartsUseForIt() {
        val roles: List<Pair<KozmosTextStyle, @Composable () -> TextStyle>> = listOf(
            KozmosTextStyle.Title2 to { MaterialTheme.typography.headlineSmall },
            KozmosTextStyle.Title3 to { MaterialTheme.typography.titleLarge },
            KozmosTextStyle.Headline to { MaterialTheme.typography.titleMedium },
            KozmosTextStyle.Body to { MaterialTheme.typography.bodyLarge },
            KozmosTextStyle.Subheadline to { MaterialTheme.typography.bodyMedium },
            KozmosTextStyle.Footnote to { MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp, lineHeight = 16.sp) },
            KozmosTextStyle.Caption to { MaterialTheme.typography.bodySmall },
            KozmosTextStyle.Caption2 to { MaterialTheme.typography.labelSmall }
        )
        val drawn = sizes {
            for ((style, role) in roles) {
                KozmosText(text = words, modifier = Modifier.testTag("kozmos $style"), style = style)
                Text(text = words, modifier = Modifier.testTag("role $style"), style = role())
            }
        }
        assertEquals("the words read, two for each step", roles.size * 2, drawn.size)
        for ((style, _) in roles) {
            assertEquals("$style, against its role", drawn["role $style"], drawn["kozmos $style"])
        }
        // The steps are a ramp: no two of them draw alike.
        assertEquals("distinct steps", roles.size, roles.map { drawn["kozmos ${it.first}"] }.toSet().size)
    }

    @Test fun withNoStyleTheWordsDrawInTheStyleAroundThemAsBefore() {
        val drawn = sizes {
            KozmosText(text = words, modifier = Modifier.testTag("kozmos page"))
            Text(text = words, modifier = Modifier.testTag("text page"))
            ProvideTextStyle(MaterialTheme.typography.labelLarge) {
                KozmosText(text = words, modifier = Modifier.testTag("kozmos label"))
                Text(text = words, modifier = Modifier.testTag("text label"))
            }
        }
        assertEquals("the words read", 4, drawn.size)
        assertEquals("on the page", drawn["text page"], drawn["kozmos page"])
        assertEquals("inside a label's style", drawn["text label"], drawn["kozmos label"])
    }
}
