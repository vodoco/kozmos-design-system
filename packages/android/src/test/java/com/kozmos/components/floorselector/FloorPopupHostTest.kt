package com.kozmos.components.floorselector

import android.os.Handler
import android.os.Looper
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.dp
import com.kozmos.components.adaptivemapshell.LocalMapPopupRegion
import com.kozmos.components.adaptivemapshell.MapPopupRegion
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosFloorPresentation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.Assert.*
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FloorPopupHostTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    @Before fun bindMain() { Dispatchers.setMain(Handler(Looper.getMainLooper()).asCoroutineDispatcher("paparazzi-main")) }
    @After fun resetMain() { Dispatchers.resetMain() }
    private val floors = (0 until 40).map { KozmosFloorPresentation(id = "$it", label = "Level $it", shortLabel = "$it") }

    @Test fun longColumnIsBoundedAndSelectedFloorIsVisible() {
        var density = 1f
        val tree = paparazzi.readSettledSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                KozmosFloorSwitcherColumn(
                    floors = floors, selectedFloor = "20", levelSize = DpSize(48.dp, 48.dp),
                    userFloor = null, userFloorLabel = "your level", resultCountLabel = { "$it results" },
                    onChoose = {}, maxHeight = 180.dp, modifier = Modifier.testTag("column")
                )
            }
        }
        val column = tree.unmerged.first { it.tag == "column" }.bounds
        val selected = tree.named("Level 20").bounds
        assertEquals(180f, column.height / density, 1f)
        assertTrue("selected floor is visible: $selected in $column", selected.height > 0 && selected.top >= column.top && selected.bottom <= column.bottom)
    }

    @Test fun unavailableShellRegionRequestsDismissal() {
        var dismissed = false
        paparazzi.readSettledSemantics {
            CompositionLocalProvider(LocalMapPopupRegion provides MapPopupRegion(IntRect.Zero, false)) {
                KozmosMaterialTheme {
                    KozmosFloorSwitcher(
                        floors = floors, selectedFloor = "20", expanded = true,
                        onExpandedChange = { dismissed = !it }, onChoose = {}
                    )
                }
            }
        }
        assertTrue(dismissed)
    }
}
