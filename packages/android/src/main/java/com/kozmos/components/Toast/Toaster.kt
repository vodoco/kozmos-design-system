package com.kozmos.components.toast

import android.os.SystemClock
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalAccessibilityManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.KozmosTransitions
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.tokens.KozmosDimensions
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

/**
 * How a screen reader announces a toast, in Notice's words: [Assertive]
 * interrupts, [Polite] waits its turn. React's `live`.
 */
enum class KozmosToastLive { Polite, Assertive }

/**
 * One button beside a toast's words, which closes the toast as it runs:
 * React's `action`, `{ label, onClick }`.
 */
data class KozmosToastAction(
    val label: String,
    val onClick: () -> Unit = {}
)

/** A toast `toast()` showed, as the queue holds it. */
internal data class KozmosToastRecord(
    val id: String,
    /** Changes when the toast is replaced, so it is drawn, timed and announced anew. */
    val key: Long,
    val title: String,
    val description: String?,
    val tone: KozmosToastTone,
    val live: KozmosToastLive?,
    val duration: Duration?,
    val action: KozmosToastAction?,
    val toaster: String,
    val open: Boolean,
    /** Every `onDismiss` given to this id while it showed, first call first, each once. */
    val dismissals: List<() -> Unit>
)

/**
 * The one queue for the app, as React's toast store is the page's: `toast()`
 * adds to it from any thread, and each [KozmosToaster] draws its own share.
 */
internal object KozmosToastStore {
    private val lock = Any()
    var records by mutableStateOf(emptyList<KozmosToastRecord>())
        private set

    // The ids a Toaster has drawn, and how many times over: a toast dismissed
    // before it is drawn (queued, or with no Toaster) goes at once, and one
    // drawn goes once it has animated out.
    private val drawn = mutableMapOf<String, Int>()

    // The Toasters mounted for each id, in mount order: the first draws.
    private val owners = mutableStateMapOf<String, List<Any>>()
    private var made = 0L

    private fun change(next: (List<KozmosToastRecord>) -> List<KozmosToastRecord>) =
        Snapshot.withMutableSnapshot { records = next(records) }

    fun show(
        title: String,
        description: String?,
        tone: KozmosToastTone,
        live: KozmosToastLive?,
        duration: Duration?,
        action: KozmosToastAction?,
        id: String?,
        toaster: String,
        onDismiss: (() -> Unit)?
    ): String = synchronized(lock) {
        val shown = id ?: "kozmos-toast-${++made}"
        // A toast still showing keeps the callbacks it was given; one already
        // closing has run them.
        val replaced = records.firstOrNull { it.id == shown && it.open }
        val dismissals = replaced?.dismissals.orEmpty().toMutableList()
        if (onDismiss != null && onDismiss !in dismissals) dismissals += onDismiss
        val record = KozmosToastRecord(
            id = shown,
            key = ++made,
            title = title,
            description = description,
            tone = tone,
            live = live,
            duration = duration,
            action = action,
            toaster = toaster,
            open = true,
            dismissals = dismissals
        )
        change { now ->
            if (now.any { it.id == shown }) now.map { if (it.id == shown) record else it } else now + record
        }
        shown
    }

    fun dismiss(id: String?) {
        val closing = synchronized(lock) {
            val closing = records.filter { it.open && (id == null || it.id == id) }
            if (closing.isEmpty()) return
            change { now ->
                now.mapNotNull { record ->
                    when {
                        record !in closing -> record
                        (drawn[record.id] ?: 0) > 0 -> record.copy(open = false)
                        else -> null
                    }
                }
            }
            closing
        }
        // After the queue has changed, so a callback that shows the next toast
        // adds to it rather than being overwritten.
        closing.forEach { record -> record.dismissals.forEach { it() } }
    }

    /** A closed toast has animated out, or its Toaster has gone: it leaves the queue. */
    fun remove(id: String, exited: Boolean = false) = synchronized(lock) {
        if (records.any { it.id == id && !it.open } && (exited || (drawn[id] ?: 0) == 0)) {
            change { now -> now.filterNot { it.id == id && !it.open } }
        }
    }

    fun drew(id: String) = synchronized(lock) { drawn[id] = (drawn[id] ?: 0) + 1 }

    fun undrew(id: String) {
        synchronized(lock) {
            val left = (drawn[id] ?: 1) - 1
            if (left > 0) drawn[id] = left else drawn.remove(id)
        }
        remove(id)
    }

    fun claim(id: String, token: Any) = Snapshot.withMutableSnapshot {
        owners[id] = owners[id].orEmpty() + token
    }

    fun release(id: String, token: Any) = Snapshot.withMutableSnapshot {
        val left = owners[id].orEmpty() - token
        if (left.isEmpty()) owners.remove(id) else owners[id] = left
    }

    fun owner(id: String): Any? = owners[id]?.firstOrNull()

    /** Empties the queue, for a test. */
    internal fun reset() = synchronized(lock) {
        drawn.clear()
        Snapshot.withMutableSnapshot {
            records = emptyList()
            owners.clear()
        }
    }
}

/**
 * Shows a toast from anywhere — a click, a request's callback, a view model,
 * any thread — as React's `toast()` does: `toast("Saved", tone =
 * KozmosToastTone.Success)`. The app's [KozmosToaster] draws it. Returns its
 * id, for `toast.dismiss(id)` or to replace it.
 */
@Suppress("ClassName")
object toast {
    /**
     * @param description The words under the title.
     * @param tone Neutral (the default, no icon), Success, Info, Warning or Critical.
     * @param live How TalkBack announces it: [KozmosToastLive.Assertive] for a
     *   Critical toast, which interrupts, [KozmosToastLive.Polite] for every
     *   other tone, unless this says otherwise.
     * @param duration How long it shows, from when it is drawn: the Toaster's
     *   `duration` unless given; [Duration.INFINITE] keeps it until it is
     *   dismissed. A press or focus on the toasts pauses it, and TalkBack's
     *   users get the longer time Android asks for them.
     * @param action One button beside the words, which closes the toast as it runs.
     * @param id A toast already showing with this id is replaced, in its
     *   place, and announced again: "Saving…" becomes "Saved". Its
     *   `onDismiss` is kept: it still runs once, when the replacement closes.
     * @param toaster The `id` of the Toaster that draws it, when an app has more than one.
     * @param onDismiss Runs once when it closes, however it closes. Being
     *   replaced is not closing: a replaced toast's `onDismiss` runs when its
     *   replacement closes, before the replacement's own (one function given
     *   to both runs once).
     */
    operator fun invoke(
        title: String,
        description: String? = null,
        tone: KozmosToastTone = KozmosToastTone.Neutral,
        live: KozmosToastLive? = null,
        duration: Duration? = null,
        action: KozmosToastAction? = null,
        id: String? = null,
        toaster: String = "",
        onDismiss: (() -> Unit)? = null
    ): String = KozmosToastStore.show(title, description, tone, live, duration, action, id, toaster, onDismiss)

    /** Closes the toast with this id, or every toast when given none. */
    fun dismiss(id: String? = null) = KozmosToastStore.dismiss(id)
}

/**
 * Draws the toasts [toast] shows, as React's `<Toaster>`: put one over the
 * app's content, in a box that fills the screen, and call `toast()` from
 * anywhere. They stack at the box's bottom inline end, 16 from its edges and
 * at most 420 wide, oldest first, `limit` at a time; the rest wait their
 * turn. Each closes after its time, which pauses while the toasts are pressed
 * or focused, on its close button (named [closeLabel]), its action, Escape
 * from a keyboard while focus is in it, or a swipe toward the inline end; it
 * never takes focus. It is a Kozmos host, not Material's snackbar host
 * (decision 145): `KozmosToast(hostState)` still draws a SnackbarHostState's
 * snackbars, one at a time and with no tone.
 *
 * @param id Which toasts it draws: those whose `toaster` names this id. One
 *   with no id draws the toasts that name none. With two Toasters of one id
 *   composed, the first draws and the other stays empty, so no toast is shown
 *   or announced twice.
 * @param duration Each toast's time unless it gives its own: 5 seconds.
 * @param limit How many show at once: 3.
 * @param closeLabel Each toast's close button: "Dismiss notification".
 */
@Composable
fun KozmosToaster(
    modifier: Modifier = Modifier,
    id: String = "",
    duration: Duration = 5.seconds,
    limit: Int = 3,
    closeLabel: String = "Dismiss notification"
) {
    val token = remember { Any() }
    DisposableEffect(id, token) {
        KozmosToastStore.claim(id, token)
        onDispose { KozmosToastStore.release(id, token) }
    }
    val shown = if (KozmosToastStore.owner(id) === token) {
        KozmosToastStore.records.filter { it.toaster == id }.take(limit)
    } else {
        emptyList()
    }
    // Held by a finger or a pointer, hovered, or holding focus: every toast's
    // time stops, as the web's pause while the toasts are hovered or focused.
    var held by remember { mutableStateOf(false) }
    var hovered by remember { mutableStateOf(false) }
    var focused by remember { mutableStateOf(false) }
    val paused = { held || hovered || focused }
    Box(modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .widthIn(max = 420.dp)
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
                .onFocusChanged { focused = it.hasFocus }
                .pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Initial)
                            held = event.changes.any { it.pressed }
                            when (event.type) {
                                PointerEventType.Enter -> hovered = true
                                PointerEventType.Exit -> hovered = false
                            }
                        }
                    }
                }
        ) {
            shown.forEach { record ->
                key(record.key) {
                    KozmosToasterItem(record, duration, closeLabel, paused)
                }
            }
        }
    }
}

@Composable
private fun KozmosToasterItem(
    record: KozmosToastRecord,
    toasterDuration: Duration,
    closeLabel: String,
    paused: () -> Boolean
) {
    DisposableEffect(record.id) {
        KozmosToastStore.drew(record.id)
        onDispose { KozmosToastStore.undrew(record.id) }
    }
    val animationsOn = rememberKozmosAnimationsOn()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    // Toward the inline end: right, or left right to left.
    val end = if (rtl) -1 else 1
    val visible = remember { MutableTransitionState(false) }
    visible.targetState = record.open
    if (!record.open && visible.isIdle && !visible.currentState) {
        LaunchedEffect(Unit) { KozmosToastStore.remove(record.id, exited = true) }
    }

    val time = record.duration ?: toasterDuration
    val accessibility = LocalAccessibilityManager.current
    if (record.open && time.isFinite()) {
        LaunchedEffect(Unit) {
            // Android's own time for TalkBack's users, as Material's snackbar takes it.
            var left = accessibility?.calculateRecommendedTimeoutMillis(
                time.inWholeMilliseconds,
                containsIcons = record.tone != KozmosToastTone.Neutral,
                containsText = true,
                containsControls = true
            ) ?: time.inWholeMilliseconds
            // Android may keep it for good for a TalkBack user who asks.
            if (left == Long.MAX_VALUE) return@LaunchedEffect
            while (left > 0) {
                snapshotFlow { paused() }.first { !it }
                val start = SystemClock.uptimeMillis()
                val pausedAgain = withTimeoutOrNull(left) { snapshotFlow { paused() }.first { it } }
                left = if (pausedAgain == null) 0 else left - (SystemClock.uptimeMillis() - start)
            }
            KozmosToastStore.dismiss(record.id)
        }
    }

    // A swipe toward the inline end past half the toast's width closes it;
    // short of that it springs back.
    val scope = rememberCoroutineScope()
    val swipe = remember { Animatable(0f) }
    var width by remember { mutableStateOf(0) }
    val fling = with(LocalDensity.current) { 400.dp.toPx() }
    val assertive = (record.live ?: if (record.tone == KozmosToastTone.Critical) {
        KozmosToastLive.Assertive
    } else {
        KozmosToastLive.Polite
    }) == KozmosToastLive.Assertive

    AnimatedVisibility(
        visibleState = visible,
        enter = if (animationsOn) {
            fadeIn(KozmosTransitions.standard()) + slideInVertically(KozmosTransitions.standard()) { it }
        } else {
            EnterTransition.None
        },
        exit = if (animationsOn) {
            fadeOut(KozmosTransitions.standard()) + slideOutHorizontally(KozmosTransitions.standard()) { it * end }
        } else {
            ExitTransition.None
        }
    ) {
        KozmosToastSurface(
            content = KozmosToastContent(
                title = record.title,
                description = record.description,
                actionText = record.action?.label,
                closeLabel = closeLabel,
                tone = record.tone
            ),
            modifier = Modifier
                .fillMaxWidth()
                .onSizeChanged { width = it.width }
                // Read where it is laid out, before it moves: dragged in its
                // own moving place, the finger's travel read as a fraction.
                .draggable(
                    state = rememberDraggableState { delta ->
                        scope.launch { swipe.snapTo((swipe.value + delta).let { if (it * end < 0) 0f else it }) }
                    },
                    orientation = Orientation.Horizontal,
                    onDragStopped = { velocity ->
                        if (abs(swipe.value) > width / 2f || velocity * end > fling) {
                            KozmosToastStore.dismiss(record.id)
                        } else if (animationsOn) {
                            swipe.animateTo(0f, KozmosTransitions.standard())
                        } else {
                            swipe.snapTo(0f)
                        }
                    }
                )
                .absoluteOffset { IntOffset(swipe.value.roundToInt(), 0) }
                .onKeyEvent { event ->
                    val escape = event.type == KeyEventType.KeyDown && event.key == Key.Escape
                    if (escape) KozmosToastStore.dismiss(record.id)
                    escape
                }
                // Each toast is its own live region, announced as it is drawn
                // and again when it is replaced: assertive for a critical one,
                // polite for every other tone, unless `live` says otherwise.
                .semantics { liveRegion = if (assertive) LiveRegionMode.Assertive else LiveRegionMode.Polite },
            onAction = record.action?.let { action ->
                {
                    action.onClick()
                    KozmosToastStore.dismiss(record.id)
                }
            },
            onDismiss = { KozmosToastStore.dismiss(record.id) }
        )
    }
}
