package com.kozmos.components.toast

import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarDuration
import androidx.compose.runtime.remember
import androidx.compose.ui.semantics.LiveRegionMode
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlinx.coroutines.launch
import kotlinx.coroutines.coroutineScope
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's toast is Radix's, which announces each toast it shows through a
 * live region: `aria-live="assertive"` for the default, foreground toast.
 * Compose's toast laid out in place was no live region at all, so TalkBack
 * said nothing when it appeared. It is now an assertive live region, as
 * React's default toast is, and TalkBack says its words when it appears.
 */
class KozmosToastAnnouncementTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun aToastLaidOutInPlaceIsAnAssertiveLiveRegion() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosToast(title = "Saved", description = "Your route is in Favourites", onDismiss = {})
            }
        }
        val regions = tree.merged.filter { it.liveRegion != null }
        assertEquals("the live regions TalkBack watches", listOf(LiveRegionMode.Assertive), regions.map { it.liveRegion })
        // What TalkBack says of the region is the words inside it, as in
        // Material's own snackbar host, whose region holds its words too.
        val region = regions.single().bounds
        assertEquals(
            "the words inside the region",
            listOf("Saved", "Your route is in Favourites"),
            tree.merged.filter { it.texts.isNotEmpty() && region.contains(it.bounds.center) }.flatMap { it.texts }
        )
    }

    /**
     * Through a SnackbarHostState, Material's host already makes each toast a
     * polite live region, and the toast adds none of its own: one region,
     * so TalkBack says it once.
     */
    @Test fun aToastShownThroughItsHostIsALiveRegion() {
        var regions: List<Pair<LiveRegionMode?, List<String>>> = emptyList()
        lateinit var host: SnackbarHostState
        paparazzi.live(content = {
            host = remember { SnackbarHostState() }
            KozmosMaterialTheme { KozmosToast(hostState = host) }
        }) {
            coroutineScope {
                launch { host.showSnackbar("Saved", withDismissAction = true, duration = SnackbarDuration.Indefinite) }
                frames(10)
                regions = read().merged.filter { it.liveRegion != null }.map { it.liveRegion to it.texts }
                host.currentSnackbarData?.dismiss()
            }
        }
        assertEquals("the live regions TalkBack watches", listOf(LiveRegionMode.Polite), regions.map { it.first })
    }
}
