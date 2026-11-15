package com.kozmos.components.settingsrow

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosSettingsRow` (GAP-040, decision 135): a name, a description, one
 * control, the inherited and overridden states and Reset to default, and a
 * reason while it is disabled, built on KozmosListItem's slots.
 */
class KozmosSettingsRowTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theControlIsNamedByTheRowAndReadWithItsDescriptionAndState() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSettingsRow(
                    label = "Analytics",
                    description = "Send anonymous usage events.",
                    state = KozmosSettingsRowState.Inherited,
                    onReset = {}
                ) { modifier, enabled ->
                    KozmosSwitch(checked = true, onCheckedChange = {}, modifier = modifier, enabled = enabled)
                }
            }
        }
        val toggle = tree.named("Analytics, Send anonymous usage events., Inherited")
        assertTrue("the switch is usable", toggle.enabled)
        assertTrue("the tag is drawn", tree.merged.any { it.words == "Inherited" })
        assertFalse("an inherited row offers no reset", tree.merged.any { it.words == "Reset to default" })
    }

    @Test fun anOverriddenRowOffersResetToDefault() {
        var resets = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSettingsRow(
                    label = "Show the banner",
                    state = KozmosSettingsRowState.Overridden,
                    onReset = { resets += 1 }
                ) { modifier, enabled ->
                    KozmosSwitch(checked = true, onCheckedChange = {}, modifier = modifier, enabled = enabled)
                }
            }
        }
        tree.named("Show the banner, Overridden")
        val reset = tree.saying("Reset to default")
        assertTrue(reset.click!!.invoke())
        assertEquals(1, resets)
    }

    @Test fun aDisabledRowDisablesItsControlSaysWhyAndOffersNoReset() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSettingsRow(
                    label = "Geofencing",
                    state = KozmosSettingsRowState.Overridden,
                    onReset = {},
                    enabled = false,
                    disabledReason = "Turn on Positioning first."
                ) { modifier, enabled ->
                    KozmosSwitch(checked = false, onCheckedChange = {}, modifier = modifier, enabled = enabled)
                }
            }
        }
        val toggle = tree.named("Geofencing, Overridden, Turn on Positioning first.")
        assertFalse(toggle.enabled)
        assertTrue(tree.merged.any { it.words == "Turn on Positioning first." })
        assertFalse(tree.merged.any { it.words == "Reset to default" })
    }

    @Test fun theProductsWordsReplaceTheDefaults() {
        assertEquals(
            "Banner, Geändert",
            kozmosSettingsRowControlDescription("Banner", null, "Geändert", null)
        )
    }
}
