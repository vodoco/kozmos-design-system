package com.kozmos.compat

import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import com.kozmos.components.ReadSemantics
import com.kozmos.components.floorselector.KozmosFloorSelector
import com.kozmos.components.floorselector.KozmosFloorSelectorVariant
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonEmphasis
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonPresentation
import com.kozmos.components.mapcontrolsgroup.KozmosMapControlsGroup
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosFloorPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultAction
import com.kozmos.contracts.KozmosPOIResultActionPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosUserLocationState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Review finding B3: a call written against 0.5.0 — the release of #129,
 * `4e87dfbd` — still compiles, and still puts every value where it went.
 *
 * Parameters added since were inserted before existing ones, so a call that
 * passed 0.5.0's parameters by position either failed to compile or, where
 * the types matched, sent a value to the wrong parameter: the map controls'
 * tenth argument, their zoom-in label, became the words TalkBack says after a
 * heading location control. New parameters go after the released ones. Where
 * the released last parameter is a function a caller may pass as a trailing
 * lambda — the result card's onAction, the floor selector's resultCountLabel
 * — it stays last, and an overload with 0.5.0's parameters keeps the
 * positional call too.
 *
 * Every call below passes its arguments in 0.5.0's order, by position, up to
 * 0.5.0's last parameter; the trailing-lambda forms are 0.5.0's too.
 */
class ReleasedParameterOrderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun ReadSemantics.has(name: String) =
        assertTrue("no control named \"$name\" among ${names()}", names().contains(name))

    @Test
    fun theMapControlsTakeTheirReleasedOrder() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosMapControlsGroup(
                    Modifier,
                    45f,
                    {},
                    {},
                    {},
                    {},
                    KozmosMapControlButtonPresentation.IconOnly,
                    "Mich finden",
                    null,
                    "Hineinzoomen",
                    "Herauszoomen",
                    "Nach Norden drehen",
                    KozmosUserLocationState.Off,
                    emptyMap(),
                    false,
                    KozmosMapControlButtonLabelPlacement.Inline,
                    null,
                    false,
                    "Stufenlos",
                    "An",
                    "Aus",
                    null
                )
            }
        }
        tree.has("Hineinzoomen")
        tree.has("Herauszoomen")
        tree.has("Nach Norden drehen")
        tree.has("Mich finden")
    }

    /** The silent case: the zoom-in label, tenth, a String like the parameters inserted before it. */
    @Test
    fun theZoomLabelsStayTheZoomLabels() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosMapControlsGroup(
                    Modifier, 0f, {}, {}, null, null,
                    KozmosMapControlButtonPresentation.IconOnly, "Mich finden", null, "Hineinzoomen"
                )
            }
        }
        tree.has("Hineinzoomen")
    }

    @Test
    fun theMapControlTakesItsReleasedOrder() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosMapControlButton(
                    "Stufenlos",
                    {},
                    Modifier,
                    { Icon(Icons.Default.Place, contentDescription = null) },
                    "An",
                    KozmosMapControlButtonPresentation.Labelled,
                    KozmosMapControlButtonEmphasis.Tinted,
                    KozmosMapControlButtonLabelPlacement.Inline,
                    true,
                    true,
                    false,
                    2500L,
                    0L,
                    false
                )
            }
        }
        tree.has("Stufenlos, An")
    }

    private val cafe = KozmosPOIPresentation(id = "cafe", name = "Harbour Coffee", floorLabel = "Level 2")
    private val selected = KozmosPOIResultPresentation(
        poiId = "cafe",
        resultIndex = 0,
        selected = true,
        actions = listOf(KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Los", primary = true))
    )

    @Test
    fun theResultCardTakesItsReleasedOrderAndItsTrailingLambda() {
        val pressed = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column {
                    KozmosPOIResultCard(
                        cafe,
                        selected,
                        {},
                        Modifier,
                        "Empfohlen",
                        null,
                        null,
                        "Aktionen",
                        { action, id -> pressed += "positional ${action.value} $id" }
                    )
                    KozmosPOIResultCard(cafe.copy(id = "gate", name = "Gate 12"), selected.copy(poiId = "gate"), {}) { action, id ->
                        pressed += "trailing ${action.value} $id"
                    }
                }
            }
        }
        val actions = tree.merged.filter { "Los" in it.texts }
        assertEquals(2, actions.size)
        actions.forEach { it.click!!.invoke() }
        assertEquals(listOf("positional navigate cafe", "trailing navigate gate"), pressed)
        tree.has("Aktionen")
    }

    private val levels = listOf(
        KozmosFloorPresentation(id = "2", label = "Second floor", shortLabel = "2F", resultCount = 3),
        KozmosFloorPresentation(id = "1", label = "First floor", shortLabel = "1F")
    )

    @Test
    fun theFloorSelectorTakesItsReleasedOrderAndItsTrailingLambda() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column {
                    KozmosFloorSelector(
                        levels,
                        "1",
                        {},
                        Modifier,
                        KozmosFloorSelectorVariant.VerticalList,
                        "Ebenen",
                        "Hoch",
                        "Runter",
                        { count -> "$count Ergebnisse" }
                    )
                    KozmosFloorSelector(levels, "1", {}) { count -> "$count résultats" }
                    KozmosFloorSelector(
                        listOf("2", "1"),
                        "1",
                        {},
                        Modifier,
                        KozmosFloorSelectorVariant.VerticalList,
                        "Etages",
                        "Monter",
                        "Descendre"
                    )
                }
            }
        }
        // A formatter alone is source-compatible, not an opt-in to counts.
        // 0.7.0 deliberately made counts hidden unless showResultCounts is true.
        tree.has("Second floor")
        assertFalse(tree.names().any { "Ergebnisse" in it || "résultats" in it })
    }

    /** The list: 0.5.0's parameters, by position, and every one added since after them. */
    @Test
    fun theResultListTakesItsReleasedOrder() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    listOf(KozmosPOIResultListItem(cafe, selected)),
                    "1 Ergebnis",
                    {},
                    Modifier,
                    "Orte",
                    "cafe",
                    "Empfohlen",
                    null,
                    "2"
                )
            }
        }
        tree.has("Orte")
        tree.has("1 Ergebnis")
    }
}
