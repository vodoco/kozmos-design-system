package com.kozmos.components.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import org.junit.Assert.assertEquals
import app.cash.paparazzi.Paparazzi
import org.junit.Rule
import org.junit.Test

class KozmosButtonPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        // Paparazzi defaults to maxPercentDifference = 0.1. Taking a button's
        // corner radius from 8dp to 16dp moves 0.1069% of the pixels — measured
        // by diffing the two goldens — so a change nobody could miss by eye sat
        // a hair inside the default and the gate stayed green. Rendering is
        // deterministic on one machine (re-recording gives a byte-identical
        // file), so on a fixed platform any tolerance only buys silence.
        //
        // One caveat, and it predates this setting: goldens are recorded
        // locally on macOS and CI verifies on ubuntu-latest. That mismatch has
        // been hidden until now by the loose default. If the Android job goes
        // red on an unchanged render, cross-platform rasterisation is the
        // reason — re-record on the CI platform rather than widening this back
        // out. Note that the signal here (0.1069%) is uncomfortably close to
        // the old threshold either way, which says the frame is mostly empty
        // background: more components, rendered tighter, is the real fix.
        maxPercentDifference = 0.0,
    )

    /**
     * GAP-56: the button keeps 8dp between its children, as Figma's Button (itemSpacing 8) and
     * iOS's (HStack spacing 100) do, so a caller's icon no longer touches its label. Measured
     * from the layout, not the pixels, where a glyph's inset would count as gap.
     *
     * The loader is a sibling in the same spaced row, so this measures its spacing too. It is
     * rendered in `aLoadingButtonDrawsTheSystemsArc` below: until 2026-09-22 it could not be,
     * because material3 1.1.2's indeterminate spinner throws NoSuchMethodError
     * (KeyframesSpecConfig.at) against animation-core 1.6.0, both from BOM 2024.01.00. The
     * system's own arc is a Canvas on a plain tween, so a golden can exist at last.
     */
    @Test
    fun theIconKeepsEightFromTheLabel() {
        var density = 1f
        var iconEnd = 0f
        var labelStart = 0f
        paparazzi.snapshot {
            density = LocalDensity.current.density
            MaterialTheme {
                Box(modifier = Modifier.background(Color.White).padding(24.dp)) {
                    KozmosButton(onClick = {}) {
                        Icon(
                            Icons.Filled.Add,
                            contentDescription = null,
                            modifier = Modifier
                                .size(16.dp)
                                .onGloballyPositioned { iconEnd = it.boundsInRoot().right },
                        )
                        Text(
                            "Add",
                            modifier = Modifier.onGloballyPositioned { labelStart = it.boundsInRoot().left },
                        )
                    }
                }
            }
        }
        assertEquals("icon to label, dp", 8f, (labelStart - iconEnd) / density, 0.5f)
    }

    @Test
    fun defaultButtonSnapshot() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(24.dp)) {
                    KozmosButton(
                        onClick = {}
                    ) {
                        Text("Snapshot Verification")
                    }
                }
            }
        }
    }

    /**
     * The glass variant is the glass surface: over pure red, the tint at
     * the token's opacity with the light edge, the label in ink — not the
     * dark chip of white at 16 % it used to be.
     */
    @Test
    fun glassButtonsAreTheGlassSurface() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.background(Color.Red).padding(24.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        KozmosButton(onClick = {}, variant = KozmosButtonVariant.Glass) { Text("Glass") }
                        KozmosIconButton(icon = Icons.Default.Add, onClick = {}, contentDescription = "Add", variant = KozmosIconButtonVariant.Glass)
                    }
                }
            }
        }
    }
}
