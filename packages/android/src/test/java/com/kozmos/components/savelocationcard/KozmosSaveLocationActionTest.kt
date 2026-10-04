package com.kozmos.components.savelocationcard

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosSaveLocationActionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun saveAndRemoveUseTheCoreMinimumAndKeepSingleDomainCallbacks() {
        for (saved in listOf(false, true)) {
            for (direction in LayoutDirection.values()) {
                for (fontScale in listOf(1f, 2f)) {
                    var changes = 0
                    var routes = 0
                    var density = 1f
                    val events = mutableListOf<KozmosAnalyticsEvent>()
                    val tree = paparazzi.readSemantics {
                        density = LocalDensity.current.density
                        CompositionLocalProvider(
                            LocalDensity provides Density(density, fontScale),
                            LocalLayoutDirection provides direction,
                            LocalKozmosAnalytics provides { events.add(it); Unit },
                        ) {
                            MaterialTheme {
                                Box(Modifier.width(320.dp)) {
                                    KozmosSaveLocationCard(isSaved = saved,
                                        onSaveToggle = { changes++ },
                                        onRouteToLocation = { routes++ })
                                }
                            }
                        }
                    }
                    val label = if (saved) "Remove Location" else "Save Location"
                    val action = tree.merged.single { label in it.texts && it.click != null }
                    // The Core Button: drawn at least 44dp, its 48dp target Material's (D7).
                    assertTrue("$label $direction $fontScale must be drawn at least 44dp: ${action.frame}",
                        action.frame.height / density >= 43.9f)
                    assertTrue("$label stays inside its narrow host", action.frame.left >= 0f && action.frame.right <= 320f * density + 1f)
                    action.click!!.invoke()
                    assertEquals(1, changes)
                    assertEquals(0, routes)
                    assertEquals(listOf(KozmosAnalyticsEvent("SaveLocationCard", "save_toggled",
                        mapOf("isSaved" to (!saved).toString()))), events)
                    if (saved) {
                        tree.merged.single { "Guide Me" in it.texts && it.click != null }.click!!.invoke()
                        assertEquals(1, routes)
                        assertEquals(1, changes)
                        assertEquals("route_requested", events.last().eventName)
                        assertEquals(2, events.size)
                    }
                }
            }
        }
    }
}
