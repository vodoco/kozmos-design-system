package com.kozmos.components.listbox

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 215 (GAP-282): an option's Avatar is decoration, so the option
 * is said by its label, not "PC, Pointr Cloud"; GAP-260: its trailing words
 * are said after the label. Read through the semantics TalkBack walks.
 */
class KozmosListboxOptionSlotsSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theAvatarIsDecorationAndTheTrailingWordsFollowTheLabel() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosListbox(
                    options = listOf(
                        KozmosListboxOption("acme", "Acme Airport", media = KozmosOptionMedia(initials = "AA")),
                        KozmosListboxOption("pointr", "Pointr Cloud", media = KozmosOptionMedia(), trailing = "3 sites")
                    )
                )
            }
        }
        val rows = read.merged.filter { it.click != null }.map { it.texts }
        assertEquals(listOf(listOf("Acme Airport"), listOf("Pointr Cloud", "3 sites")), rows)
        val said = read.merged.flatMap { it.texts + listOfNotNull(it.description) }
        assertEquals("the initials are not said", false, said.contains("AA") || said.contains("PC"))
    }
}
