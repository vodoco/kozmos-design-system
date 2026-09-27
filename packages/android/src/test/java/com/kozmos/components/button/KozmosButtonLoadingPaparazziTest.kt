package com.kozmos.components.button

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import org.junit.Rule
import org.junit.Test

/**
 * The first golden of a loading button on Android.
 *
 * material3 1.1.2's indeterminate indicator throws NoSuchMethodError
 * (KeyframesSpecConfig.at) against animation-core 1.6.0, so the state existed in
 * the API and had never been rendered — on a golden or, as far as anyone had
 * checked, a device. The button draws the system's own arc now: three quarters
 * of a circle from the top, round caps, stroke 2 in the icons' 24 box, at the
 * small size, in the button's own foreground.
 *
 * It sits apart from [KozmosButtonPaparazziTest] because of its tolerance, and
 * the tolerance is measured rather than assumed. That class holds 0.0 on
 * purpose: taking a button's corner radius from 8dp to 16dp moves 0.1069 % of
 * the pixels, and a looser gate let that through unseen. This snapshot cannot
 * hold 0.0 across the two renderers — recorded on macOS and verified on CI's
 * Linux runner it differs by **one channel value, off by three levels, 0.000044
 * %** (measured from CI's own artefact on 2026-09-23), because it is the only
 * Button golden that draws text beside an antialiased curve. That is the
 * rounding [CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE] was measured for, and it is
 * three orders of magnitude below the smallest change a reviewer could see.
 *
 * A test that passes at 0.0 on both systems keeps 0.0; this one does not, so it
 * is here and not there.
 */
class KozmosButtonLoadingPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun aLoadingButtonDrawsTheSystemsArc() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.background(Color.White).padding(24.dp)) {
                    KozmosButton(onClick = {}, isLoading = true) { Text("Loading") }
                }
            }
        }
    }
}
