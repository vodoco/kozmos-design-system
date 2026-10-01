package com.kozmos.components.mapinfopanel

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import org.junit.Rule
import org.junit.Test

class KozmosMapInfoPanelPaparazziTest {
    @get:Rule val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)
    @Test fun informationPanelRendering() {
        paparazzi.snapshot {
            MaterialTheme {
                BoxWithConstraints(Modifier.fillMaxSize()) {
                    KozmosMapInfoPanel(
                        KozmosMapInfoContent(title = "About this map", introduction = "Explore Terminal 2 and find the places and services you need.", faqs = listOf(KozmosMapInfoFAQ("floors", "How do I change floors?", "Open the floor selector and choose a level.")), credits = listOf(KozmosMapInfoEntry("owner", "Indoor map data © Example venue")), links = listOf(KozmosMapInfoEntry("support", "Contact support", "mailto:support@example.com")), versions = listOf(KozmosMapInfoVersion("demo", "Example content", "Not a live SDK"))),
                        {}, Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).heightIn(min = maxHeight)
                    )
                }
            }
        }
    }
}
