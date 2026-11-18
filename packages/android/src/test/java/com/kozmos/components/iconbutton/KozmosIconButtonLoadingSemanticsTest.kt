package com.kozmos.components.iconbutton

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import com.kozmos.components.ReadNode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * GAP-253: a loading IconButton as TalkBack hears it. Its name was on the
 * icon, which the spinner replaces while it loads, so a loading button had
 * no name and lost its count. The name, and the count, are the button's own
 * now, and while it loads it says it is busy, in [KozmosIconButton]'s
 * `loadingLabel`.
 */
class KozmosIconButtonLoadingSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun button(
        isLoading: Boolean,
        variant: KozmosIconButtonVariant = KozmosIconButtonVariant.Ghost,
        counter: Int? = null,
        loadingLabel: String? = null
    ): ReadNode = paparazzi.readSemantics {
        KozmosMaterialTheme {
            if (loadingLabel == null) {
                KozmosIconButton(
                    icon = Icons.Default.Info,
                    onClick = {},
                    contentDescription = "Help",
                    variant = variant,
                    isLoading = isLoading,
                    counter = counter
                )
            } else {
                KozmosIconButton(
                    icon = Icons.Default.Info,
                    onClick = {},
                    contentDescription = "Help",
                    variant = variant,
                    isLoading = isLoading,
                    counter = counter,
                    loadingLabel = loadingLabel
                )
            }
        }
    }.merged.single { it.description != null && it.description!!.startsWith("Help") }

    @Test
    fun aLoadingIconButtonKeepsItsNameAndCountOnEveryVariant() {
        for (variant in KozmosIconButtonVariant.values()) {
            val loading = button(isLoading = true, variant = variant, counter = 3)
            assertEquals("$variant: its name and count while it loads", "Help, 3", loading.description)
            assertEquals("$variant: it says it is busy", "Loading", loading.stateDescription)
            assertFalse("$variant: it takes no press while it loads", loading.enabled)
        }
    }

    @Test
    fun theBusyStateIsSaidInTheProductsWords() {
        val loading = button(isLoading = true, loadingLabel = "Yükleniyor")
        assertEquals("Help", loading.description)
        assertEquals("Yükleniyor", loading.stateDescription)
    }

    @Test
    fun anIdleIconButtonIsItsNameAloneWithNoState() {
        val idle = button(isLoading = false, counter = 3)
        assertEquals("Help, 3", idle.description)
        assertNull(idle.stateDescription)
    }
}
