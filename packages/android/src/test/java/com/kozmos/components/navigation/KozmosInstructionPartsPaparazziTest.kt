package com.kozmos.components.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosInstructionPart
import com.kozmos.contracts.KozmosInstructionPartRole
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

class KozmosInstructionPartsPaparazziTest {
    // A tall contact sheet, not a phone-screen composition: include every card's edge.
    @get:Rule val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.NEXUS_5.copy(screenHeight = 3000),
        maxPercentDifference = 0.0
    )

    @Test fun mixedScriptInstructionsInBothThemes() {
        val fixtures = listOf(
            "de" to listOf(KozmosInstructionPart("Biegen Sie bei "), KozmosInstructionPart("Marlow Pharmacy", lang = "en"),
                KozmosInstructionPart(" auf der linken Seite", KozmosInstructionPartRole.Secondary), KozmosInstructionPart(" rechts ab")),
            "ja" to listOf(KozmosInstructionPart("左側の", KozmosInstructionPartRole.Secondary),
                KozmosInstructionPart("Bean & Leaf Café", lang = "en"), KozmosInstructionPart("で右折してください")),
            "ar" to listOf(KozmosInstructionPart("عند "), KozmosInstructionPart("Lumen Books", lang = "en"),
                KozmosInstructionPart(" على يسارك", KozmosInstructionPartRole.Secondary), KozmosInstructionPart(" انعطف يميناً"))
        )
        for ((lang, parts) in fixtures) for (dark in listOf(false, true)) {
            paparazzi.snapshot(name = "$lang-$dark") {
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalLayoutDirection provides if (lang == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                    LocalDensity provides Density(LocalDensity.current.density, 1.5f)
                ) {
                    KozmosMaterialTheme {
                        Column(Modifier.width(320.dp).background(KozmosThemeTokens.primitivesColorsBackground0).padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            KozmosDirectionStep(DirectionType.Right, parts)
                            KozmosManoeuvreCard(DirectionType.Right, parts, false, {}, surface = KozmosSurfaceStyle.Glass) {}
                            KozmosManoeuvreCard(DirectionType.Right, parts, true, {}) {
                                KozmosItinerary("Start", listOf(KozmosItineraryStep("one", parts, DirectionType.Right, true)), "End")
                            }
                        }
                    }
                }
            }
        }
    }
}
