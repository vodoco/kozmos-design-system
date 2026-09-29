package com.kozmos.components

import android.os.Handler
import android.os.Looper
import android.view.Choreographer
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.BroadcastFrameClock
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Recomposer
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.toSize
import app.cash.paparazzi.Paparazzi
import app.cash.paparazzi.SnapshotHandler
import java.lang.reflect.Proxy
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.android.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Paparazzi as a host rather than a camera: it composes, measures and lays out
 * as a device does, and keeps no picture. For tests that read what TalkBack is
 * given — a name, a state, a role — which no golden can show. Nothing is
 * recorded or compared, so these tests leave no image behind in record mode
 * and need none in verify mode.
 */
fun semanticsPaparazzi(): Paparazzi = Paparazzi(snapshotHandler = DiscardFrames)

/**
 * A handler that drops every frame. A [Proxy], because the frame handler's one
 * method takes a `java.awt.image.BufferedImage`, which the Android unit-test
 * compile classpath does not have.
 */
private val DiscardFrames: SnapshotHandler = Proxy.newProxyInstance(
    SnapshotHandler::class.java.classLoader,
    arrayOf(SnapshotHandler::class.java)
) { proxy, method, args ->
    when (method.name) {
        "newFrameHandler" -> Proxy.newProxyInstance(
            SnapshotHandler.FrameHandler::class.java.classLoader,
            arrayOf(SnapshotHandler.FrameHandler::class.java)
        ) { _, _, _ -> null }
        "hashCode" -> System.identityHashCode(proxy)
        "equals" -> proxy === args?.firstOrNull()
        "toString" -> "DiscardFrames"
        else -> null
    }
} as SnapshotHandler

/** One node as an accessibility service is told about it. */
data class ReadNode(
    val description: String?,
    val texts: List<String>,
    val selected: Boolean?,
    /** Set, it replaces the "Selected" / "Not selected" TalkBack would say. */
    val stateDescription: String?,
    val enabled: Boolean,
    val role: Role?,
    val bounds: Rect,
    val tag: String?,
    val click: (() -> Boolean)?,
    /** Offered while closed: TalkBack reads it as the control's collapsed state. */
    val expand: (() -> Boolean)? = null,
    /** Offered while open: TalkBack reads it as the control's expanded state. */
    val collapse: (() -> Boolean)? = null,
    /** Set, TalkBack says the node's new description when it changes. */
    val liveRegion: LiveRegionMode? = null,
    /** How a scrolling node is moved by TalkBack's scroll gestures. */
    val scrollBy: ((Float, Float) -> Boolean)? = null,
    /** A node that scrolls sideways: how far it has, and how far it can. */
    val horizontalScroll: Pair<Float, Float>? = null,
    /**
     * Where the node is laid out, unclipped: [bounds] stops at whatever
     * clips it, so a tile scrolled half out of a strip reads as starting at
     * the strip's edge.
     */
    val frame: Rect = bounds,
    /** False for a node composed but not placed: a lazy list's prefetched or recycled item. */
    val placed: Boolean = true
)

/**
 * A composition's semantics, copied out while it was alive: [merged] is what
 * TalkBack walks, one node per control; [unmerged] keeps every node, for where
 * the parts of a control sit.
 */
class ReadSemantics(val merged: List<ReadNode>, val unmerged: List<ReadNode>) {
    fun names(): List<String> = merged.mapNotNull { it.description }

    /** The one control named [description]; fails, listing the names there are, if not exactly one. */
    fun named(description: String): ReadNode {
        val found = merged.filter { it.description == description }
        check(found.size == 1) { "expected one node named \"$description\", found ${found.size} among ${names()}" }
        return found.single()
    }
}

/** Composes [content], lays it out, and reads its semantics tree. */
fun Paparazzi.readSemantics(content: @Composable () -> Unit): ReadSemantics {
    var read: ReadSemantics? = null
    snapshot {
        val view = LocalView.current
        // Read once layout is done, from the view that owns the composition:
        // the tree is built from the laid-out nodes, and is gone once the
        // snapshot is taken.
        Box(
            Modifier.onGloballyPositioned {
                val owner = (view as ViewRootForTest).semanticsOwner
                read = ReadSemantics(
                    merged = owner.rootSemanticsNode.flatten().map(::copyOf),
                    unmerged = owner.unmergedRootSemanticsNode.flatten().map(::copyOf)
                )
            }
        ) {
            content()
        }
    }
    return checkNotNull(read) { "the content was never laid out" }
}

/**
 * A composition kept alive while a test works it: [read] is what TalkBack is
 * told now, and [frames] lets recomposition, layout and effects run. For
 * pressing a control and reading what follows, which [readSemantics] cannot
 * do: it composes once and is gone.
 */
class LiveSemantics internal constructor(val view: View) {
    fun read(): ReadSemantics {
        val owner = (view as ViewRootForTest).semanticsOwner
        return ReadSemantics(
            merged = owner.rootSemanticsNode.flatten().map(::copyOf),
            unmerged = owner.unmergedRootSemanticsNode.flatten().map(::copyOf)
        )
    }

    /** The frames the script has been given. */
    var framesSeen = 0
        private set

    suspend fun frames(count: Int = 1) = repeat(count) { withFrameNanos { framesSeen++ } }
}

/**
 * Composes [content] in a host that keeps no picture and runs [script]
 * against it once it is laid out, for up to [durationMillis] of frames. A
 * failure inside the script fails the test, and so does a script that does
 * not finish in time.
 *
 * The composition has a recomposer of its own, on this test's looper, and a
 * frame clock that Paparazzi's frames tick — not the window's, which runs on
 * Compose's shared main dispatcher. That dispatcher can be left waiting for
 * good by any earlier test in the run: a Compose state write made outside a
 * frame — a click invoked on what [readSemantics] returned, whose handler sets
 * a `mutableStateOf`, or a plain logic test of a class that keeps its state in
 * one — wakes Compose's snapshot manager, whose dispatch is posted where no
 * frame will ever run it, and every composition on that dispatcher afterwards
 * gets no frames (measured 2026-09-29, from the floor switcher's close and
 * from KozmosRevealOnChangeTest). Nothing here depends on it: state written in
 * a script is sent on at the next frame.
 */
fun Paparazzi.live(
    durationMillis: Long = 3000,
    content: @Composable () -> Unit,
    script: suspend LiveSemantics.() -> Unit
) {
    var failure: Throwable? = null
    var finished = false
    var live: LiveSemantics? = null

    val clock = BroadcastFrameClock()
    val effects = Handler(Looper.getMainLooper()).asCoroutineDispatcher("kozmos-live") + clock
    val recomposer = Recomposer(effects)
    val running = CoroutineScope(effects + Job()).apply { launch { recomposer.runRecomposeAndApplyChanges() } }
    val choreographer = Choreographer.getInstance()
    val tick = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            Snapshot.sendApplyNotifications()
            clock.sendFrame(frameTimeNanos)
            choreographer.postFrameCallback(this)
        }
    }

    val host = ComposeView(context).apply {
        setParentCompositionContext(recomposer)
        setContent {
            val view = LocalView.current
            content()
            LaunchedEffect(Unit) {
                try {
                    val started = LiveSemantics(view).also { live = it }
                    started.frames(2)
                    started.script()
                    finished = true
                } catch (cancelled: CancellationException) {
                    // The composition went before the script finished: said below.
                    throw cancelled
                } catch (thrown: Throwable) {
                    failure = thrown
                }
            }
        }
    }
    choreographer.postFrameCallback(tick)
    try {
        gif(host, "live", start = 0L, end = durationMillis, fps = 30)
    } finally {
        choreographer.removeFrameCallback(tick)
        host.disposeComposition()
        recomposer.cancel()
        running.cancel()
    }
    failure?.let { throw it }
    check(live?.framesSeen != 0) { "the composition was given no frames" }
    check(finished) { "the script did not finish within ${durationMillis}ms of frames" }
}

private fun SemanticsNode.flatten(): List<SemanticsNode> =
    listOf(this) + children.flatMap { it.flatten() }

private fun copyOf(node: SemanticsNode) = ReadNode(
    description = node.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(),
    texts = node.config.getOrNull(SemanticsProperties.Text)?.map { it.text }.orEmpty(),
    selected = node.config.getOrNull(SemanticsProperties.Selected),
    stateDescription = node.config.getOrNull(SemanticsProperties.StateDescription),
    enabled = !node.config.contains(SemanticsProperties.Disabled),
    role = node.config.getOrNull(SemanticsProperties.Role),
    bounds = node.boundsInRoot,
    tag = node.config.getOrNull(SemanticsProperties.TestTag),
    click = node.config.getOrNull(SemanticsActions.OnClick)?.action,
    expand = node.config.getOrNull(SemanticsActions.Expand)?.action,
    collapse = node.config.getOrNull(SemanticsActions.Collapse)?.action,
    liveRegion = node.config.getOrNull(SemanticsProperties.LiveRegion),
    scrollBy = node.config.getOrNull(SemanticsActions.ScrollBy)?.action,
    horizontalScroll = node.config.getOrNull(SemanticsProperties.HorizontalScrollAxisRange)
        ?.let { it.value() to it.maxValue() },
    frame = Rect(node.positionInRoot, node.size.toSize()),
    placed = node.layoutInfo.isPlaced
)
