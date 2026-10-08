package com.kozmos.components.edges

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.feedbackcard.KozmosFeedbackCard
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.routinginputgroup.KozmosRoutePoint
import com.kozmos.components.routinginputgroup.KozmosRoutingInputGroup
import com.kozmos.components.stepper.KozmosStepper
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Rule
import org.junit.Test

/**
 * The edges the 2026-09-22 sweep moved onto Semantics.Border, drawn together
 * on their host's surface: a field in the Input role, a stepper's pending
 * ring (its glyph, foreground/500) and connector (the border role), the
 * result list's empty state dashed in the border role, the routing group on
 * the solid surface with its fields washed rather than outlined, and the
 * feedback card on the solid surface. Before, the field and the connector
 * were darker text colours and the cards a near-black hairline over 90 %.
 */
class KozmosEdgeRolesPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun theEdgesAreTheBorderRoles() {
        paparazzi.snapshot {
            KozmosMaterialTheme {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier
                        .background(KozmosThemeTokens.semanticsSurface0)
                        .padding(16.dp)
                ) {
                    KozmosInput(value = "Gate B12", onValueChange = {}, modifier = Modifier.fillMaxWidth())
                    KozmosStepper(steps = listOf("Search", "Route", "Go"), currentStep = 1)
                    KozmosPOIResultList(
                        items = emptyList(),
                        resultCountLabel = "0 places",
                        onSelect = {},
                        emptyState = { Text("No places match") }
                    )
                    KozmosRoutingInputGroup(
                        points = listOf(
                            KozmosRoutePoint(id = "a", value = "Current location"),
                            KozmosRoutePoint(id = "b", value = "Gate B12")
                        ),
                        onPointChange = { _, _ -> },
                        modifier = Modifier.fillMaxWidth()
                    )
                    KozmosFeedbackCard(modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
}
