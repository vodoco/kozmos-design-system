package com.kozmos.components.toast

import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * Compose's `toast()` and `KozmosToaster` (GAP-167, decision 145): a Kozmos
 * host with the web's queue and replacement (#426), not Material's snackbar
 * host. `limit` show at once, oldest first, and the rest wait; a call with an
 * existing id replaces that toast in its place; each toast closes after its
 * time, which a press pauses, on its close button, its action, Escape, a
 * swipe toward the inline end or `toast.dismiss`; `onDismiss` runs once,
 * however it closes, and a replaced toast's when its replacement closes.
 * Each is a live region: assertive for a critical toast, polite otherwise.
 *
 * Read from what TalkBack is given: the toasts' words, in order.
 */
class KozmosToasterTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Before fun emptyTheQueue() = KozmosToastStore.reset()

    private val titles = setOf(
        "One", "Two", "Three", "Saving", "Location saved", "Route copied", "Brief", "Kept",
        "Gate changed", "Map", "Could not save", "Neutral", "Success", "Critical", "Info"
    )

    private fun LiveSemantics.shown(): List<String> = read().merged.flatMap { it.texts }.filter { it in titles }

    @Composable
    private fun Host(
        limit: Int = 3,
        duration: Duration = 5.seconds,
        direction: LayoutDirection = LayoutDirection.Ltr,
        toasters: @Composable () -> Unit = { KozmosToaster(limit = limit, duration = duration) }
    ) = CompositionLocalProvider(LocalLayoutDirection provides direction) {
        KozmosMaterialTheme {
            // A Box lets the host be its own size: the window's root would
            // stretch it to its own.
            Box { Box(Modifier.size(400.dp, 700.dp)) { toasters() } }
        }
    }

    @Test fun limitShowAtOnceOldestFirstAndTheRestWaitTheirTurn() {
        paparazzi.live(content = { Host(limit = 2) }) {
            val first = toast("One", duration = Duration.INFINITE)
            toast("Two", duration = Duration.INFINITE)
            toast("Three", duration = Duration.INFINITE)
            frames(15)
            assertEquals("two at once, oldest first", listOf("One", "Two"), shown())
            toast.dismiss(first)
            frames(20) // past the exit
            assertEquals("the third takes its turn", listOf("Two", "Three"), shown())
        }
    }

    @Test fun aCallWithAnExistingIdReplacesThatToastInItsPlace() {
        paparazzi.live(content = { Host() }) {
            val id = toast("Saving", duration = Duration.INFINITE)
            toast("Route copied", duration = Duration.INFINITE)
            frames(15)
            assertEquals(listOf("Saving", "Route copied"), shown())
            val again = toast("Location saved", id = id, tone = KozmosToastTone.Success, duration = Duration.INFINITE)
            frames(15)
            assertEquals("the same id", id, again)
            assertEquals("replaced where it was", listOf("Location saved", "Route copied"), shown())
        }
    }

    @Test fun onDismissRunsOnceWhenItClosesAndAReplacedToastsWhenItsReplacementCloses() {
        val calls = mutableListOf<String>()
        val first = { calls += "first"; Unit }
        paparazzi.live(content = { Host() }) {
            val id = toast("Saving", duration = Duration.INFINITE, onDismiss = first)
            frames(5)
            toast("Location saved", id = id, duration = Duration.INFINITE, onDismiss = { calls += "second" })
            // One function given to both runs once.
            toast("Location saved", id = id, duration = Duration.INFINITE, onDismiss = first)
            frames(5)
            assertEquals("being replaced is not closing", emptyList<String>(), calls)
            toast.dismiss(id)
            toast.dismiss(id)
            frames(20)
            assertEquals("each once, first given first", listOf("first", "second"), calls)
            assertEquals(emptyList<String>(), shown())
        }
    }

    @Test fun dismissWithNoIdClosesEveryToastQueuedOrShown() {
        var dismissed = 0
        paparazzi.live(content = { Host(limit = 1) }) {
            toast("One", duration = Duration.INFINITE, onDismiss = { dismissed++ })
            toast("Two", duration = Duration.INFINITE, onDismiss = { dismissed++ })
            frames(15)
            assertEquals(listOf("One"), shown())
            toast.dismiss()
            frames(20)
            assertEquals("every one closed", emptyList<String>(), shown())
            assertEquals("the shown and the queued", 2, dismissed)
            assertTrue("the queue is empty", KozmosToastStore.records.isEmpty())
        }
    }

    @Test fun aToastClosesAfterItsTimeAndInfiniteKeepsIt() {
        paparazzi.live(durationMillis = 5000, content = { Host(duration = 1.seconds) }) {
            toast("Brief")
            toast("Kept", duration = Duration.INFINITE)
            frames(15)
            assertEquals(listOf("Brief", "Kept"), shown())
            frames(60) // two seconds
            assertEquals("the Toaster's second has run", listOf("Kept"), shown())
        }
    }

    @Test fun aToastHeldDownDoesNotTimeOutUntilItIsLetGo() {
        paparazzi.live(durationMillis = 6000, content = { Host(duration = 1.seconds) }) {
            toast("Brief")
            frames(15)
            val at = read().merged.single { "Brief" in it.texts }.bounds.center
            touch(MotionEvent.ACTION_DOWN, at)
            frames(60) // two seconds, held
            assertEquals("paused while held", listOf("Brief"), shown())
            touch(MotionEvent.ACTION_UP, at)
            frames(60)
            assertEquals("its time ran on once let go", emptyList<String>(), shown())
        }
    }

    @Test fun theFirstToasterOfAnIdDrawsAndEachToastGoesToTheToasterItNames() {
        paparazzi.live(content = {
            Host(toasters = {
                KozmosToaster()
                KozmosToaster()
                KozmosToaster(id = "map")
            })
        }) {
            toast("One", duration = Duration.INFINITE)
            toast("Map", toaster = "map", duration = Duration.INFINITE)
            frames(15)
            assertEquals("each shown once", listOf("One", "Map"), shown())
        }
    }

    @Test fun theCloseButtonTheActionAndEscapeEachCloseIt() {
        var retried = 0
        paparazzi.live(durationMillis = 6000, content = { Host() }) {
            toast("One", duration = Duration.INFINITE)
            frames(15)
            read().named("Dismiss notification").click!!.invoke()
            frames(20)
            assertEquals("its close button", emptyList<String>(), shown())

            toast("Could not save", tone = KozmosToastTone.Critical, duration = Duration.INFINITE,
                action = KozmosToastAction("Retry") { retried++ })
            frames(15)
            read().merged.single { "Retry" in it.texts && it.click != null }.click!!.invoke()
            frames(20)
            assertEquals("the action ran", 1, retried)
            assertEquals("and closed it", emptyList<String>(), shown())

            toast("Two", duration = Duration.INFINITE)
            frames(15)
            read().named("Dismiss notification").requestFocus!!.invoke()
            frames(2)
            val now = SystemClock.uptimeMillis()
            view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ESCAPE, 0))
            view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ESCAPE, 0))
            frames(20)
            assertEquals("Escape, with focus in it", emptyList<String>(), shown())
        }
    }

    /** Toward the inline end: right, and left right to left. A swipe the other way does nothing. */
    @Test fun aSwipeTowardTheInlineEndClosesIt() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            KozmosToastStore.reset()
            paparazzi.live(durationMillis = 5000, content = { Host(direction = direction) }) {
                toast("One", duration = Duration.INFINITE)
                frames(15)
                // The toast's own box: its live region, not its title's words.
                val toastBox = read().merged.single { it.liveRegion != null }.bounds
                val end = if (direction == LayoutDirection.Ltr) 1 else -1
                // Past half its width, slowly, so it is the distance that closes it.
                swipe(toastBox.center, -end * toastBox.width * 0.6f)
                frames(20)
                assertEquals("$direction: toward the start", listOf("One"), shown())
                swipe(toastBox.center, end * toastBox.width * 0.6f)
                frames(20)
                assertEquals("$direction: toward the end", emptyList<String>(), shown())
            }
        }
    }

    @Test fun aCriticalToastIsAssertiveEveryOtherPoliteAndLiveSaysOtherwise() {
        paparazzi.live(content = { Host(limit = 4) }) {
            toast("Neutral", duration = Duration.INFINITE)
            toast("Success", tone = KozmosToastTone.Success, duration = Duration.INFINITE)
            toast("Critical", tone = KozmosToastTone.Critical, duration = Duration.INFINITE)
            toast("Info", tone = KozmosToastTone.Info, live = KozmosToastLive.Assertive, duration = Duration.INFINITE)
            frames(15)
            val regions = read().merged.filter { it.liveRegion != null }
            assertEquals(
                "one region per toast",
                listOf(LiveRegionMode.Polite, LiveRegionMode.Polite, LiveRegionMode.Assertive, LiveRegionMode.Assertive),
                regions.map { it.liveRegion }
            )
            val unmerged = read().unmerged
            regions.zip(listOf("Neutral", "Success", "Critical", "Info")).forEach { (region, title) ->
                assertTrue(
                    "$title's words are inside its region",
                    unmerged.any { title in it.texts && region.bounds.contains(it.bounds.center) }
                )
            }
        }
    }

    private fun LiveSemantics.software() {
        // As Taps.press: a ripple on layoutlib's hardware renderer takes it down.
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        (view.parent as? View)?.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }

    private var downAt = 0L

    /** A finger on the touchscreen, at [at] in the view's pixels. */
    private fun LiveSemantics.touch(action: Int, at: Offset) {
        software()
        val now = SystemClock.uptimeMillis()
        if (action == MotionEvent.ACTION_DOWN) downAt = now
        val event = MotionEvent.obtain(
            downAt, now, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
            0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
        )
        view.dispatchTouchEvent(event)
        event.recycle()
    }

    /** A finger drawn [by] pixels sideways from [from], slowly, and lifted. */
    private suspend fun LiveSemantics.swipe(from: Offset, by: Float) {
        touch(MotionEvent.ACTION_DOWN, from)
        frames(1)
        for (step in 1..10) {
            touch(MotionEvent.ACTION_MOVE, Offset(from.x + by * step / 10, from.y))
            frames(1)
        }
        frames(5) // still, so the lift is no fling
        touch(MotionEvent.ACTION_UP, Offset(from.x + by, from.y))
        frames(2)
    }
}
