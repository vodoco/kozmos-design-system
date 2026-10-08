package com.kozmos.components.directionstep

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Rule
import org.junit.Test

/**
 * Every direction: Pointr Maps - Express artwork for fifteen of them, walking's
 * FollowTheLine among them, and Material's marks for straight on, a level
 * change and transition.
 */
class KozmosDirectionStepPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private fun column(types: List<DirectionType>) = @androidx.compose.runtime.Composable {
        KozmosMaterialTheme {
            Column(modifier = Modifier.padding(16.dp).width(360.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                types.forEach { type -> KozmosDirectionStep(type = type, instruction = type.name) }
            }
        }
    }

    @Test
    fun theTurnsAndTheLifts() {
        paparazzi.snapshot(composable = column(DirectionType.values().take(7)))
    }

    @Test
    fun theEscalatorsStairsLevelsAndTheRest() {
        paparazzi.snapshot(composable = column(DirectionType.values().drop(7).take(7)))
    }

    @Test
    fun walkingEntriesAndRamps() {
        paparazzi.snapshot(composable = column(DirectionType.values().drop(14)))
    }
}
