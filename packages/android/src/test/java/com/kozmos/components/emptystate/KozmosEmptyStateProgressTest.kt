package com.kozmos.components.emptystate

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** GAP-115: an empty state says how far a long wait has got, under its description. */
class KozmosEmptyStateProgressTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theBarIsOneNodeNamedByItsLabelWithItsValue() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosEmptyState(
                    title = "The assistant isn't downloaded yet",
                    description = "It works offline once it's on this device.",
                    progress = KozmosEmptyStateProgress(0.4f, "Downloading the assistant", "12 of 30 MB")
                )
            }
        }
        val bar = tree.named("Downloading the assistant")
        assertEquals("12 of 30 MB", bar.stateDescription)
        assertEquals(0.4f, bar.progressRange!!.current, 0.001f)
        assertTrue("the label and value aren't read again", tree.merged.none { "12 of 30 MB" in it.texts })
    }

    @Test fun thePercentageIsSaidWithoutWords() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosEmptyState(title = "Downloading", progress = KozmosEmptyStateProgress(0.4f, "Downloading the assistant"))
            }
        }
        assertEquals("40%", tree.named("Downloading the assistant").stateDescription)
    }

    // React and SwiftUI round; cutting 0.999 down said "99%" for a bar drawn full.
    @Test fun thePercentageIsRoundedToTheNearest() {
        for ((value, said) in listOf(0.999f to "100%", 0.994f to "99%", 0.006f to "1%")) {
            val tree = paparazzi.readSemantics {
                MaterialTheme {
                    KozmosEmptyState(title = "Downloading", progress = KozmosEmptyStateProgress(value, "Downloading the assistant"))
                }
            }
            assertEquals("$value", said, tree.named("Downloading the assistant").stateDescription)
        }
    }

    // As on React: NaN is none done, never a crash. roundToInt throws on NaN.
    @Test fun aValueThatIsNotANumberIsNoneDone() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosEmptyState(title = "Downloading", progress = KozmosEmptyStateProgress(Float.NaN, "Downloading the assistant"))
            }
        }
        val bar = tree.named("Downloading the assistant")
        assertEquals("0%", bar.stateDescription)
        assertEquals(0f, bar.progressRange!!.current, 0f)
    }

    @Test fun noProgressDrawsNoBar() {
        val tree = paparazzi.readSemantics { MaterialTheme { KozmosEmptyState(title = "No results") } }
        assertTrue(tree.merged.none { it.progressRange != null })
    }
}
