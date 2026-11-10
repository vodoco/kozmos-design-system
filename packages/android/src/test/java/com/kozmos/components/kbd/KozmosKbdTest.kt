package com.kozmos.components.kbd

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosKbd` (GAP-156): one key or a combination, drawn as key caps and read
 * by the key's name. Done when the hint draws Esc as a key and TalkBack reads
 * "Escape".
 */
class KozmosKbdTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun escIsReadEscape() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosKbd(key = "Esc") } }
        val kbd = tree.named("Escape")
        assertEquals("the glyph is not read as well", emptyList<String>(), kbd.texts)
        assertEquals("one node", listOf("Escape"), tree.merged.mapNotNull { it.words })
    }

    @Test fun aCombinationIsReadByItsKeysNamesJoinedWithPlus() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosKbd(keys = listOf("Ctrl", "C")) }
        }
        assertEquals(listOf("Control+C"), tree.merged.mapNotNull { it.words })
        val symbols = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosKbd(keys = listOf("⌘", "⇧", "P")) }
        }
        assertEquals(listOf("Command+Shift+P"), symbols.merged.mapNotNull { it.words })
    }

    @Test fun theLabelReplacesWhatIsRead() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosKbd(keys = listOf("Ctrl", "C"), label = "Kopieren") }
        }
        assertEquals(listOf("Kopieren"), tree.merged.mapNotNull { it.words })
    }

    /** Words in any case, symbols exactly; any other key as written. */
    @Test fun theSpokenNames() {
        val expected = mapOf(
            "Esc" to "Escape", "ESC" to "Escape", "ctrl" to "Control", "Cmd" to "Command", "⌘" to "Command",
            "Opt" to "Option", "⌥" to "Option", "⇧" to "Shift", "⌃" to "Control", "↵" to "Enter", "⏎" to "Enter",
            "⌫" to "Backspace", "Bksp" to "Backspace", "Del" to "Delete", "⌦" to "Delete", "⇥" to "Tab",
            "↑" to "Up arrow", "↓" to "Down arrow", "←" to "Left arrow", "→" to "Right arrow",
            "PgUp" to "Page up", "PgDn" to "Page down", "␣" to "Space", "Ins" to "Insert", "⇪" to "Caps lock",
            "Win" to "Windows", "F5" to "F5", "K" to "K", "Enter" to "Enter"
        )
        assertEquals(expected, expected.mapValues { (key, _) -> kozmosKbdSpokenName(key) })
    }

    /** A cap is React's h-5 min-w-5: 20dp tall, at least 20 wide. */
    @Test fun aCapIsAtLeast20dpSquare() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { KozmosKbd(key = "K") } }
        val density = paparazzi.context.resources.displayMetrics.density
        val kbd = tree.named("K")
        assertEquals("height in dp", 20f, kbd.bounds.height / density, 0.5f)
        assertTrue("width ${kbd.bounds.width / density}dp", kbd.bounds.width / density >= 19.5f)
    }
}
