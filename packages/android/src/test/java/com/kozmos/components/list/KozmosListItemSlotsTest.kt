package com.kozmos.components.list

import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.tag.KozmosTagVariant
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosListItem`'s slots (GAP-195, decision 135): the checklist row is a
 * ListItem filled in, and TalkBack hears a tour's status with its name.
 */
class KozmosListItemSlotsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theChecklistRowReadsItsStatusThenItsName() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosList {
                    KozmosListItem(
                        text = "Explore the map",
                        description = "Pan, zoom and change levels.",
                        meta = "2 min",
                        leading = { KozmosListItemStatus(status = KozmosListItemStatusValue.Done) },
                        titleAddon = { KozmosTag(text = "Viewer", variant = KozmosTagVariant.Secondary) }
                    )
                }
            }
        }
        assertEquals(
            listOf("Done", "Explore the map", "Viewer", "Pan, zoom and change levels.", "2 min"),
            tree.merged.mapNotNull { it.words }
        )
    }

    @Test fun eachStatusIsOneNodeReadInEnglishOrTheProductsWords() {
        for ((status, words) in listOf(
            KozmosListItemStatusValue.Todo to "Not started",
            KozmosListItemStatusValue.InProgress to "In progress",
            KozmosListItemStatusValue.Done to "Done"
        )) {
            val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosListItemStatus(status = status) } }
            assertEquals(listOf(words), tree.merged.mapNotNull { it.words })
        }
        val own = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosListItemStatus(status = KozmosListItemStatusValue.Done, label = "Terminé") }
        }
        assertEquals(listOf("Terminé"), own.merged.mapNotNull { it.words })
    }

    @Test fun aStatusMarkIs20dp() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosListItemStatus(status = KozmosListItemStatusValue.Todo) }
        }
        val density = paparazzi.context.resources.displayMetrics.density
        val mark = tree.named("Not started")
        assertEquals(20f, mark.bounds.height / density, 0.5f)
        assertEquals(20f, mark.bounds.width / density, 0.5f)
    }

    @Test fun thePersonaRowEndsWithItsCheckbox() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosListItem(
                    text = "Visitor",
                    selected = true,
                    trailing = { KozmosCheckbox(checked = true, onCheckedChange = {}, label = "Show to Visitor") }
                )
            }
        }
        val words = tree.merged.mapNotNull { it.words }
        assertEquals("Visitor", words.first())
        assertEquals(true, words.last().contains("Show to Visitor"))
    }
}
