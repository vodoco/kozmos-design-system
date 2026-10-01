package com.kozmos.components

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import app.cash.paparazzi.Paparazzi
import app.cash.paparazzi.SnapshotHandler
import java.lang.reflect.Proxy

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
    val horizontalScrollMax: Float? = null
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

/** Advance real Compose frames before reading measure-driven shell state. */
fun Paparazzi.readSettledSemantics(content: @Composable () -> Unit): ReadSemantics {
    var result: ReadSemantics? = null
    val view = ComposeView(context).apply {
        setContent {
            val owner = (LocalView.current as ViewRootForTest).semanticsOwner
            Box { content() }
            LaunchedEffect(Unit) {
                repeat(5) { withFrameNanos { } }
                result = ReadSemantics(
                    owner.rootSemanticsNode.flatten().map(::copyOf),
                    owner.unmergedRootSemanticsNode.flatten().map(::copyOf)
                )
            }
        }
    }
    gif(view, "settled-semantics", start = 0L, end = 1000L, fps = 20)
    return checkNotNull(result) { "settled semantics were never read" }
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
    horizontalScrollMax = node.config.getOrNull(SemanticsProperties.HorizontalScrollAxisRange)?.maxValue?.invoke()
)
