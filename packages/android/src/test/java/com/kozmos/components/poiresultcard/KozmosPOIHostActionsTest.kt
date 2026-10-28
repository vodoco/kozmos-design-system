package com.kozmos.components.poiresultcard

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.semantics.Role
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.poidetailpanel.KozmosPOIActionState
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poiresultgroup.KozmosPOIResultGroup
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.docsnippets.DetailsWithHandOff
import com.kozmos.docsnippets.ResultWithReservation
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIHostActionPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultAction
import com.kozmos.contracts.KozmosPOIResultActionPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosPOISupplementaryAction
import com.kozmos.contracts.KozmosPOISupplementaryActionPresentation
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.components.poiresultcard.KozmosPOIResultPresentationStyle.Sdk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The product's own actions, with their own words and icons (GAP-028 on a
 * result, GAP-130 on the details card), as the web's
 * `POIHostActionPresentation` defines them: drawn after the parts' own, in
 * the order given, pressed as TalkBack presses them.
 */
class KozmosPOIHostActionsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val poi = KozmosPOIPresentation(
        id = "trattoria",
        name = "Trattoria Uno",
        categoryLabel = "Restaurant",
        floorLabel = "Level 2",
        actions = listOf(KozmosPOIAction.Navigate, KozmosPOIAction.Share)
    )
    private val reserve = KozmosPOIHostActionPresentation(id = "reserve", label = "Reserve a table", iconName = "calendar")

    private fun result(
        selected: Boolean = true,
        available: Boolean? = null,
        menuDisabled: Boolean = false
    ) = KozmosPOIResultPresentation(
        poiId = poi.id,
        resultIndex = 1,
        selected = selected,
        available = available,
        actions = listOf(
            KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Go", primary = true),
            KozmosPOIResultActionPresentation(KozmosPOIResultAction.Details, "Details")
        ),
        hostActions = listOf(reserve, KozmosPOIHostActionPresentation("menu", "See the menu", disabled = menuDisabled))
    )

    /** The one control whose text is [text]. */
    private fun ReadSemantics.showing(text: String): ReadNode {
        val found = merged.filter { text in it.texts }
        check(found.size == 1) { "expected one node showing \"$text\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    /** The buttons' words, in the order TalkBack reaches them. */
    private fun ReadSemantics.buttons(): List<String> =
        merged.filter { it.role == Role.Button }.flatMap { it.texts }

    @Test
    fun aHostActionCarriesWhatTheWebContractDoes() {
        val plain = KozmosPOIHostActionPresentation(id = "menu", label = "See the menu")
        assertEquals(null, plain.iconName)
        assertFalse(plain.disabled)
        // Every existing caller leaves them out.
        assertTrue(KozmosPOIResultPresentation(poiId = "p", resultIndex = 1).hostActions.isEmpty())
        assertTrue(KozmosPOIDetailsPresentation().hostActions.isEmpty())
        // A selection change keeps them.
        assertEquals(result().hostActions, result(selected = false).selecting(poi.id).hostActions)
    }

    @Test
    fun theCardDrawsThemAfterItsOwnActionsInOrder() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}, presentationStyle = Sdk, onHostAction = { _, _ -> }, onAction = { _, _ -> })
            }
        }
        assertEquals(listOf("Go", "Details", "Reserve a table", "See the menu"), tree.buttons().takeLast(4))
        // Said by its words alone: the icon is not read.
        assertEquals(null, tree.showing("Reserve a table").description)
    }

    @Test
    fun aPressReportsTheIdAndSendsOneEvent() {
        val hosted = mutableListOf<String>()
        val actions = mutableListOf<String>()
        val selections = mutableListOf<String>()
        val events = mutableListOf<KozmosAnalyticsEvent>()
        val tree = paparazzi.readSemantics {
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosMaterialTheme {
                    KozmosPOIResultCard(
                        poi = poi,
                        result = result(),
                        onSelect = { selections += it },
                        presentationStyle = Sdk,
                        onHostAction = { id, poiId -> hosted += "$id $poiId" },
                        onAction = { action, _ -> actions += action.value }
                    )
                }
            }
        }
        tree.showing("Reserve a table").click!!.invoke()
        assertEquals(listOf("reserve trattoria"), hosted)
        assertEquals(emptyList<String>(), actions)
        assertEquals(emptyList<String>(), selections)
        assertEquals(listOf("poi_result_action"), events.map { it.eventName })
        assertEquals(
            mapOf("poiId" to "trattoria", "resultIndex" to "1", "action" to "host", "hostActionId" to "reserve"),
            events.single().properties
        )
    }

    @Test
    fun withoutAHandlerTheyAreDisabledAndOneMarkedDisabledStaysDisabled() {
        val events = mutableListOf<KozmosAnalyticsEvent>()
        val bare = paparazzi.readSemantics {
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosMaterialTheme { KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}) }
            }
        }
        assertFalse(bare.showing("Reserve a table").enabled)
        bare.showing("Reserve a table").click?.invoke()

        val hosted = mutableListOf<String>()
        val handled = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIResultCard(poi = poi, result = result(menuDisabled = true), onSelect = {}, presentationStyle = Sdk, onHostAction = { id, _ -> hosted += id })
            }
        }
        assertTrue(handled.showing("Reserve a table").enabled)
        assertFalse(handled.showing("See the menu").enabled)
        handled.showing("See the menu").click?.invoke()
        assertEquals(emptyList<String>(), hosted)
        assertEquals(emptyList<KozmosAnalyticsEvent>(), events)
    }

    @Test
    fun onlyTheSelectedAvailableResultShowsThem() {
        for ((name, given) in listOf("unselected" to result(selected = false), "unavailable" to result(available = false))) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme { KozmosPOIResultCard(poi = poi, result = given, onSelect = {}, presentationStyle = Sdk, onHostAction = { _, _ -> }) }
            }
            assertTrue("$name shows host actions", tree.merged.none { "Reserve a table" in it.texts })
        }
    }

    @Test
    fun theListAndTheGroupHandOnTheHandler() {
        val hosted = mutableListOf<String>()
        val item = KozmosPOIResultListItem(poi, result())
        val list = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIResultList(
                    items = listOf(item), resultCountLabel = "1 result", onSelect = {}, selectedPoiId = poi.id,
                    presentationStyle = Sdk,
                    onHostAction = { id, poiId -> hosted += "list $id $poiId" }
                )
            }
        }
        list.showing("Reserve a table").click!!.invoke()
        val group = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIResultGroup(
                    items = listOf(item), onSelect = {}, selectedPoiId = poi.id,
                    onHostAction = { id, poiId -> hosted += "group $id $poiId" }
                )
            }
        }
        group.showing("Reserve a table").click!!.invoke()
        assertEquals(listOf("list reserve trattoria", "group reserve trattoria"), hosted)
    }

    private val labels = mapOf(KozmosPOIAction.Navigate to "Go", KozmosPOIAction.Share to "Share")
    private val details = KozmosPOIDetailsPresentation(
        supplementaryActions = listOf(KozmosPOISupplementaryActionPresentation(KozmosPOISupplementaryAction.Call, "Call")),
        hostActions = listOf(
            KozmosPOIHostActionPresentation("open-in-app", "Get live directions in Pointr Express", iconName = "phone"),
            KozmosPOIHostActionPresentation("feedback", "Report a problem")
        )
    )

    @Test
    fun theDetailsCardDrawsThemLastAndReportsTheId() {
        val hosted = mutableListOf<String>()
        var others = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIDetailPanel(
                    poi = poi, actionLabels = labels, onAction = { _, _ -> others++ }, details = details,
                    onSupplementaryAction = { _, _ -> others++ }, onHostAction = { id, poiId -> hosted += "$id $poiId" }
                )
            }
        }
        val strip = listOf("Go", "Share", "Call", "Get live directions in Pointr Express", "Report a problem")
        assertEquals(strip, tree.buttons().filter { it in strip })
        tree.showing("Get live directions in Pointr Express").click!!.invoke()
        assertEquals(listOf("open-in-app trattoria"), hosted)
        assertEquals(0, others)
    }

    @Test
    fun theDetailsCardHonoursItsHandlerStateAndMessage() {
        val bare = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosPOIDetailPanel(poi = poi, actionLabels = labels, onAction = { _, _ -> }, details = details) }
        }
        assertFalse(bare.showing("Report a problem").enabled)

        val hosted = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIDetailPanel(
                    poi = poi, actionLabels = labels, onAction = { _, _ -> }, details = details,
                    hostActionStates = mapOf(
                        "feedback" to KozmosPOIActionState(disabled = true),
                        "open-in-app" to KozmosPOIActionState(
                            message = "Pointr Express is not installed.",
                            messageTone = KozmosPOIActionState.MessageTone.Error
                        )
                    ),
                    onHostAction = { id, _ -> hosted += id }
                )
            }
        }
        assertFalse(tree.showing("Report a problem").enabled)
        assertTrue(tree.showing("Get live directions in Pointr Express").enabled)
        tree.showing("Report a problem").click?.invoke()
        assertEquals(emptyList<String>(), hosted)
        assertTrue("the message is not drawn", tree.merged.any { "Pointr Express is not installed." in it.texts })
    }

    /** The docs' two examples (docsnippets), drawn and pressed: each reaches the product. */
    @Test
    fun theDocsExamplesReachTheProduct() {
        val reached = mutableListOf<String>()
        val card = paparazzi.readSemantics {
            KozmosMaterialTheme {
                ResultWithReservation(poi, 1, "Reserve a table", onSelect = {}, onReserve = { reached += "reserve $it" })
            }
        }
        card.showing("Reserve a table").click!!.invoke()
        val panel = paparazzi.readSemantics {
            KozmosMaterialTheme {
                DetailsWithHandOff(poi, labels, "Open in Pointr Express", onAction = { _, _ -> }, onHandOff = { reached += "hand-off $it" })
            }
        }
        panel.showing("Open in Pointr Express").click!!.invoke()
        assertEquals(listOf("reserve trattoria", "hand-off trattoria"), reached)
    }
}
