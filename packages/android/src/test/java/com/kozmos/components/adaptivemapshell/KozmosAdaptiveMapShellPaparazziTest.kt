package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Rule
import org.junit.Test

/**
 * The shell's bottom panel: as tall as what it holds, on the surface style —
 * solid by default, glass on request, over a red map.
 */
class KozmosAdaptiveMapShellPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private fun shell(
        surface: KozmosSurfaceStyle,
        detents: List<KozmosMapPanelDetent> = listOf(KozmosMapPanelDetent.Content),
        detent: KozmosMapPanelDetent? = null,
        panel: @Composable () -> Unit = {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Airport Shuttles")
                Text("4 min · 201 m")
            }
        }
    ) = @Composable {
        KozmosMaterialTheme {
            Box(modifier = Modifier.fillMaxSize().height(640.dp)) {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize().background(Color.Red)) },
                    panel = panel,
                    panelSurface = surface,
                    panelDetents = detents,
                    panelDetent = detent
                )
            }
        }
    }

    @Test
    fun theBottomPanelFitsItsContentOnASolidSurface() {
        paparazzi.snapshot(composable = shell(KozmosSurfaceStyle.Solid))
    }

    @Test
    fun theBottomPanelCanBeGlass() {
        paparazzi.snapshot(composable = shell(KozmosSurfaceStyle.Glass))
    }

    /** The default detents: the sheet rests at medium, 54 % of the shell, under its handle. */
    @Test
    fun theSheetRestsAtMediumWithItsHandle() {
        paparazzi.snapshot(
            composable = shell(
                KozmosSurfaceStyle.Solid,
                detents = KozmosDefaultPanelDetents,
                panel = { Box(modifier = Modifier.fillMaxSize().background(Color.Green)) }
            )
        )
    }

    /** Collapsed rests on the content's peek anchor: a 250-tall row plus a 16 margin, over a blue that barely shows. */
    @Test
    fun theCollapsedSheetRestsOnItsPeekAnchor() {
        paparazzi.snapshot(
            composable = shell(
                KozmosSurfaceStyle.Solid,
                detents = KozmosDefaultPanelDetents,
                detent = KozmosMapPanelDetent.Collapsed,
                panel = {
                    Column {
                        Box(modifier = Modifier.fillMaxWidth().height(250.dp).background(Color.Green).kozmosPanelPeekAnchor())
                        Box(modifier = Modifier.fillMaxWidth().height(900.dp).background(Color.Blue))
                    }
                }
            )
        )
    }
}
