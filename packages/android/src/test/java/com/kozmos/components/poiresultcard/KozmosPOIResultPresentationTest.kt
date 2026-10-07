package com.kozmos.components.poiresultcard

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.*
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosPOIResultPresentationTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private val name = "Northfield Artisan Bakery and Coffee Roastery"
    private val poi = KozmosPOIPresentation(id = "bakery", name = name, floorLabel = "Level 2")
    private val result = KozmosPOIResultPresentation(poiId = poi.id, resultIndex = 1234, selected = true, featured = true,
        actions = listOf(KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Go", primary = true)))

    @Test fun defaultFeaturedNumberAndActionRemainAccessibleThroughTheList() {
        for (dark in listOf(false, true)) for (rtl in listOf(false, true)) for (scale in listOf(1f, 2f)) {
            var minimum = 0f
            var selected = 0
            val actions = mutableListOf<String>()
            val tree = paparazzi.readSemantics {
                val density = LocalDensity.current.density
                minimum = 44 * density
                CompositionLocalProvider(LocalDensity provides Density(density, scale),
                    LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                    LocalKozmosUseDarkTokens provides dark) {
                    KozmosMaterialTheme {
                        Box(Modifier.width(320.dp)) {
                            KozmosPOIResultList(items = listOf(KozmosPOIResultListItem(poi, result)),
                                resultCountLabel = "1 result", numbered = true, onSelect = { selected++ },
                                onAction = { action, id -> actions += "${action.value}:$id" })
                        }
                    }
                }
            }
            val card = tree.merged.single { it.words?.startsWith("1234, Featured, $name") == true }
            assertEquals(true, card.selected)
            val tab = tree.unmerged.single { it.texts == listOf("Featured") }
            val number = tree.unmerged.single { it.texts == listOf("1234") }
            val title = tree.unmerged.single { it.texts == listOf(name) }
            assertTrue("tab overlaps title: dark=$dark rtl=$rtl scale=$scale", maxOf(tab.bounds.bottom, number.bounds.bottom) <= title.bounds.top)
            assertTrue(title.bounds.height > 0)
            val go = tree.merged.single { "Go" in it.texts }
            assertTrue(go.bounds.width >= minimum && go.bounds.height >= minimum)
            go.click!!.invoke()
            assertEquals(listOf("navigate:bakery"), actions)
            assertEquals(0, selected)
        }
    }
}
