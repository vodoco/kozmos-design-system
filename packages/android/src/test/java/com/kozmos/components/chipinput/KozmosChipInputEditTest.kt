package com.kozmos.components.chipinput

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * GAP-222, decision 216: the edits ChipInput makes, apart from any view.
 * Plain functions with no Compose state, so they wake no snapshot manager.
 */
class KozmosChipInputEditTest {
    @Test fun aCommaAddsWhatComesBeforeItTrimmedAndKeepsTheRestTyped() {
        val result = KozmosChipInputEdit.typed("  coffee ,te", listOf("wifi"))!!
        assertEquals(listOf("wifi", "coffee"), result.entries)
        assertEquals("te", result.text)
        assertEquals(listOf("coffee"), result.added)
        assertNull("text with no comma is only typed", KozmosChipInputEdit.typed("coffee", emptyList()))
    }

    @Test fun aPastedListAddsEachLineAndPart() {
        val result = KozmosChipInputEdit.typed("coffee, tea\nwater", emptyList())!!
        assertEquals(listOf("coffee", "tea"), result.entries)
        assertEquals("water", result.text)
    }

    @Test fun enterAddsTheTrimmedTextAndLeavesAnEmptyFieldToTheHost() {
        assertEquals(listOf("coffee", "tea"), KozmosChipInputEdit.submitted(" tea ", listOf("coffee"))!!.entries)
        assertNull(KozmosChipInputEdit.submitted("   ", listOf("coffee")))
    }

    @Test fun aDuplicateAddsNothingAndKeepsItsText() {
        val result = KozmosChipInputEdit.submitted("coffee", listOf("coffee"))!!
        assertEquals(listOf("coffee"), result.entries)
        assertEquals("coffee", result.text)
        assertEquals("coffee", result.duplicate)
        assertEquals(emptyList<String>(), result.added)
    }

    @Test fun backspaceInTheEmptyFieldRemovesTheLastEntry() {
        assertEquals(listOf("coffee"), KozmosChipInputEdit.deletedInEmptyField(listOf("coffee", "tea")))
        assertNull(KozmosChipInputEdit.deletedInEmptyField(emptyList()))
    }
}
