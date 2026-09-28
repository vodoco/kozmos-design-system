package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Rule
import androidx.compose.foundation.background
import com.kozmos.tokens.KozmosColors
import org.junit.Test

class KozmosPOIDetailPanelPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    /**
     * The name and the header's buttons — favourite, save and close — share
     * one row: a long name wraps beside them, three lines at most, and never
     * pushes them under — the rule iOS and the web follow. The location takes
     * the row under them, the card's whole width, as on both. The golden is
     * the evidence; a one-line ellipsis or a button under the name changes it.
     */
    @Test
    fun aLongNameWrapsBesideTheButtonsAndStopsAtThreeLines() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(24.dp).width(320.dp)) {
                    KozmosPOIDetailPanel(
                        poi = KozmosPOIPresentation(
                            id = "long-content",
                            name = "Il Forno — Neapolitan restaurant and handmade pasta kitchen on the upper concourse",
                            floorId = "1",
                            floorLabel = "Upper concourse",
                            buildingLabel = "Terminal 1",
                            actions = listOf(KozmosPOIAction.Navigate, KozmosPOIAction.Favourite, KozmosPOIAction.Bookmark)
                        ),
                        actionLabels = mapOf(
                            KozmosPOIAction.Navigate to "Go",
                            KozmosPOIAction.Favourite to "Favourite",
                            KozmosPOIAction.Bookmark to "Bookmark"
                        ),
                        onAction = { _, _ -> },
                        onClose = {}
                    )
                }
            }
        }
    }

    /**
     * In the sheet presentation the panel paints no surface of its own: it
     * sits on the sheet's, as the browse panel does (Olcay, 21st: the card
     * looked like a card within a card). The grey behind the header is the
     * evidence; a white card there changes the golden.
     */
    @Test
    fun theSheetPresentationSitsOnTheSheetsSurface() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.background(KozmosColors.primitivesColorsBackground100).padding(24.dp).width(320.dp)) {
                    KozmosPOIDetailPanel(
                        poi = KozmosPOIPresentation(
                            id = "lounge",
                            name = "British Airways Lounge",
                            floorId = "4",
                            floorLabel = "Fourth Floor",
                            buildingLabel = "Terminal E",
                            actions = listOf(KozmosPOIAction.Navigate)
                        ),
                        actionLabels = mapOf(KozmosPOIAction.Navigate to "Go"),
                        onAction = { _, _ -> },
                        onClose = {},
                        presentation = KozmosPOIDetailPanelPresentation.Sheet
                    )
                }
            }
        }
    }

    /**
     * Favourite and save are icon toggles in the header, before close, as on
     * iOS and the web: 44dp squares 6dp apart, outlined in the neutral
     * emotion, a pressed one filled with the theme. Go and Share keep the row
     * under the header. A toggle back in the row, a circle, a filled
     * bookmark glyph or the pressed fill missing changes the golden.
     *
     * A Pixel 5, 393dp across, so the card is the 360dp asked for: the
     * default Nexus 5 is 360dp across, and with the other tests' 24dp
     * padding their cards are 312.
     */
    @Test
    fun favouriteAndSaveAreTogglesInTheHeaderBeforeClose() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_5)
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(16.dp).width(360.dp)) {
                    KozmosPOIDetailPanel(
                        poi = KozmosPOIPresentation(
                            id = "harbour-coffee",
                            name = "Harbour Coffee Co.",
                            floorId = "2",
                            floorLabel = "Level 2",
                            buildingLabel = "Terminal 1",
                            availability = KozmosPOIAvailability.Open,
                            availabilityLabel = "Open until 22:00",
                            actions = listOf(
                                KozmosPOIAction.Navigate,
                                KozmosPOIAction.Favourite,
                                KozmosPOIAction.Bookmark,
                                KozmosPOIAction.Share
                            )
                        ),
                        actionLabels = mapOf(
                            KozmosPOIAction.Navigate to "Go",
                            KozmosPOIAction.Favourite to "Favourite",
                            KozmosPOIAction.Bookmark to "Save",
                            KozmosPOIAction.Share to "Share"
                        ),
                        onAction = { _, _ -> },
                        actionStates = mapOf(KozmosPOIAction.Favourite to KozmosPOIActionState(pressed = true)),
                        onClose = {}
                    )
                }
            }
        }
    }
}
