package com.kozmos.components.adaptivemapshell

import android.os.SystemClock
import android.view.MotionEvent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The panel header under a finger, and to TalkBack (row 73). A drag that
 * starts on the header moves the sheet whatever the list under it has
 * scrolled, a sideways one stays with the header, and the header is read
 * before the content. The shell is held in a host that keeps no picture: a
 * finger goes down once it is laid out, moves 15dp a frame, and lifts.
 */
class KozmosAdaptiveMapShellPanelHeaderDragTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var detent by mutableStateOf<KozmosMapPanelDetent>(KozmosMapPanelDetent.Large)
    /** The list under the header, scrolled five 60dp rows: 300dp. */
    private val list = LazyListState(firstVisibleItemIndex = 5)
    private val chips = LazyListState()
    private val placed = mutableMapOf<String, Rect>()

    private fun Modifier.probe(name: String) = onGloballyPositioned { placed[name] = Rect(it.positionInRoot(), it.size.toSize()) }

    /**
     * Puts a finger down in the middle of [on] and moves it [steps] times by
     * [step] dp, one move a frame, then lifts it and lets the sheet settle.
     */
    private fun drag(on: String, step: Offset, steps: Int = 20, header: @Composable () -> Unit) {
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                val density = host.resources.displayMetrics.density
                MaterialTheme {
                    KozmosAdaptiveMapShell(
                        map = { Box(modifier = Modifier.fillMaxSize().background(Color.Red)) },
                        panelHeader = header,
                        panel = {
                            LazyColumn(state = list, modifier = Modifier.fillMaxSize().probe("list")) {
                                items(30) { index ->
                                    Box(modifier = Modifier.fillMaxWidth().height(60.dp).background(if (index % 2 == 0) Color.Blue else Color.Yellow))
                                }
                            }
                        },
                        panelDetent = detent,
                        onPanelDetentChange = { detent = it }
                    )
                }
                LaunchedEffect(Unit) {
                    repeat(3) { withFrameNanos { } }
                    // Nothing to put a finger on: the test says so.
                    val start = placed[on]?.center ?: return@LaunchedEffect
                    val down = SystemClock.uptimeMillis()
                    host.dispatchTouchEvent(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, start.x, start.y, 0))
                    var at = start
                    repeat(steps) {
                        withFrameNanos { }
                        at += step * density
                        host.dispatchTouchEvent(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE, at.x, at.y, 0))
                    }
                    withFrameNanos { }
                    host.dispatchTouchEvent(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, at.x, at.y, 0))
                }
            }
        }
        paparazzi.gif(view, on, start = 0L, end = 3000L, fps = 20)
    }

    private val searchRow: @Composable () -> Unit = {
        Box(modifier = Modifier.fillMaxWidth().height(72.dp).background(Color.Green).probe("header"))
    }

    /**
     * At the largest detent, over a list scrolled 300dp: a 300dp drag down
     * from the header lands the sheet on medium. It used to be the list's,
     * which spent it scrolling back.
     */
    @Test
    fun aDragFromTheHeaderMovesTheSheetWhateverTheListHasScrolled() {
        drag(on = "header", step = Offset(0f, 15f), header = searchRow)
        assertTrue("the header is not drawn", "header" in placed)
        assertEquals("the drag from the header did not move the sheet", KozmosMapPanelDetent.Medium, detent)
    }

    /** The same drag from the list is the list's: it scrolls back to its top, and the sheet stays. */
    @Test
    fun theSameDragFromTheListScrollsTheListBackInstead() {
        drag(on = "list", step = Offset(0f, 15f), header = searchRow)
        assertEquals("the list gave its drag to the sheet", KozmosMapPanelDetent.Large, detent)
        assertEquals("the list did not scroll back", 0, list.firstVisibleItemIndex)
    }

    /** A sideways drag on a row of chips in the header scrolls the row, and leaves the sheet at medium. */
    @Test
    fun aSidewaysDragOnTheHeaderStaysWithTheHeader() {
        detent = KozmosMapPanelDetent.Medium
        drag(on = "header", step = Offset(-15f, 0f), steps = 10) {
            LazyRow(state = chips, modifier = Modifier.fillMaxWidth().height(56.dp).probe("header")) {
                items(20) { index ->
                    Box(modifier = Modifier.width(96.dp).height(56.dp).background(if (index % 2 == 0) Color.Green else Color.Cyan))
                }
            }
        }
        assertTrue("the header is not drawn", "header" in placed)
        assertEquals("a sideways drag on the header moved the sheet", KozmosMapPanelDetent.Medium, detent)
        assertNotEquals("the header's row did not scroll", 0, chips.firstVisibleItemIndex * 10_000 + chips.firstVisibleItemScrollOffset)
    }

    /** TalkBack meets the handle, then the header, then the content, which is also the order they stand in. */
    @Test
    fun theHeaderIsReadBeforeTheContent() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    panelHeader = { Text("Search places") },
                    panel = { Text("Gate B12") }
                )
            }
        }
        fun at(read: String) = tree.merged.indexOfFirst { read == it.description || read in it.texts }
        val handle = at("Panel height")
        val header = at("Search places")
        val content = at("Gate B12")
        assertTrue("the handle, header and content are not all read: ${tree.names()}", handle >= 0 && header >= 0 && content >= 0)
        assertTrue("the header is not read after the handle", handle < header)
        assertTrue("the content is read before the header", header < content)
        assertTrue("the header does not stand above the content", tree.merged[header].bounds.top < tree.merged[content].bounds.top)
    }
}
