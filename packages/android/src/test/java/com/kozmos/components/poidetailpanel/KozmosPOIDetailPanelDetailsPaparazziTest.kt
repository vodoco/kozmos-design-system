package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIDetailAttributeGroup
import com.kozmos.contracts.KozmosPOIDetailDescription
import com.kozmos.contracts.KozmosPOIDetailSummary
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import com.kozmos.contracts.KozmosPOIDetailTone
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIOpeningHoursPresentation
import com.kozmos.contracts.KozmosPOIOpeningHoursRow
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIServicePresentation
import com.kozmos.contracts.KozmosPOISupplementaryAction
import com.kozmos.contracts.KozmosPOISupplementaryActionPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The details model drawn, in both themes: Go with the walk under its label,
 * Book after Share, the summary row across the card, then the services, the
 * groups, the opening hours closed, the description with Read more, and the
 * tags. The goldens are the evidence of how it looks; the order, the names
 * and the states are proven in [KozmosPOIDetailPanelDetailsTest].
 *
 * Drawn on a host surface rather than bare: Paparazzi's own window is dark,
 * and a card judged against it would hide a colour that only reads on the
 * light theme. A Pixel 5 made tall enough to hold the whole card.
 */
class KozmosPOIDetailPanelDetailsPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5.copy(screenHeight = 2500),
        maxPercentDifference = 0.0
    )

    @Test
    fun theDetailsInLightMode() {
        paparazzi.snapshot { KozmosMaterialTheme { Card() } }
    }

    @Test
    fun theDetailsInDarkMode() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                KozmosMaterialTheme { Card() }
            }
        }
    }

    private fun service(id: String, label: String, iconName: String? = null) =
        KozmosPOIServicePresentation(id = id, label = label, iconName = iconName)

    @Composable
    private fun Card() {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(KozmosThemeTokens.primitivesColorsBackground100)
                .padding(16.dp)
        ) {
            KozmosPOIDetailPanel(
                poi = KozmosPOIPresentation(
                    id = "il-forno",
                    name = "Il Forno",
                    floorId = "1",
                    floorLabel = "Current floor",
                    buildingLabel = "Building A",
                    availability = KozmosPOIAvailability.Open,
                    availabilityLabel = "Open",
                    description = "Wood-fired Neapolitan pizza and handmade pasta in a lively open kitchen.",
                    services = listOf(service("dine-in", "Dine-in"), service("wifi", "Wi-Fi", iconName = "wifi")),
                    actions = listOf(KozmosPOIAction.Navigate, KozmosPOIAction.Share, KozmosPOIAction.Favourite, KozmosPOIAction.Bookmark)
                ),
                actionLabels = mapOf(
                    KozmosPOIAction.Navigate to "Go",
                    KozmosPOIAction.Share to "Share",
                    KozmosPOIAction.Favourite to "Favourite",
                    KozmosPOIAction.Bookmark to "Save"
                ),
                onAction = { _, _ -> },
                onClose = {},
                details = KozmosPOIDetailsPresentation(
                    travelEstimate = KozmosTravelEstimatePresentation(
                        durationSeconds = 120.0,
                        durationLabel = "2 min",
                        distanceMetres = 120.0,
                        distanceLabel = "120 m"
                    ),
                    summary = listOf(
                        KozmosPOIDetailSummary(id = "rating", kind = KozmosPOIDetailSummaryKind.Rating, label = "Rating", value = "4.7 / 5", detail = "32 reviews"),
                        KozmosPOIDetailSummary(id = "price", kind = KozmosPOIDetailSummaryKind.Price, label = "Price", value = "Moderately expensive", priceLevel = 3),
                        KozmosPOIDetailSummary(id = "access", kind = KozmosPOIDetailSummaryKind.Accessibility, label = "Accessibility", value = "Step-free", tone = KozmosPOIDetailTone.Success)
                    ),
                    groups = listOf(
                        KozmosPOIDetailAttributeGroup("cuisines", "Cuisines", listOf(service("italian", "Italian"), service("pizza", "Pizza"), service("mediterranean", "Mediterranean"))),
                        KozmosPOIDetailAttributeGroup("dietary", "Dietary options", listOf(service("vegetarian", "Vegetarian", iconName = "check"), service("vegan", "Vegan")))
                    ),
                    openingHours = KozmosPOIOpeningHoursPresentation(
                        label = "Opening hours",
                        summary = "Open · Closes 12:30 pm",
                        rows = listOf(KozmosPOIOpeningHoursRow("weekdays", "Monday–Friday", "8:00 am–12:30 pm")),
                        note = "Venue-local hours."
                    ),
                    description = KozmosPOIDetailDescription(
                        preview = "Family-run since 1998, Il Forno serves Naples-style pizza from a wood-fired oven.",
                        full = "Family-run since 1998, Il Forno serves Naples-style pizza from a wood-fired oven. The terrace overlooks the atrium."
                    ),
                    tags = listOf(service("pizza-tag", "#pizza"), service("patio", "#patio")),
                    supplementaryActions = listOf(KozmosPOISupplementaryActionPresentation(KozmosPOISupplementaryAction.Book, "Book"))
                ),
                onSupplementaryAction = { _, _ -> }
            )
        }
    }
}
