package com.kozmos.components.adaptivemapshell

import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics

/** The panel's vertical scroller: the one node TalkBack scrolls up and down. */
internal fun ReadSemantics.verticalScroller(): ReadNode =
    merged.single { it.scrollBy != null && it.horizontalScroll == null }

/**
 * Scrolls the panel's scroller by [px], as TalkBack does, and waits for it
 * to come to rest: TalkBack's scroll is animated. [rows] are what moves; the
 * scroll is at rest once they have moved and then stayed put for a frame.
 */
internal suspend fun LiveSemantics.scrollAndSettle(px: Float, rows: (ReadSemantics) -> List<ReadNode>) {
    fun where() = rows(read()).map { it.words to it.frame.top }
    val start = where()
    read().verticalScroller().scrollBy!!.invoke(0f, px)
    var previous = start
    for (frame in 1..90) {
        frames(1)
        val now = where()
        if (now != start && now == previous) break
        previous = now
    }
    check(where() != start) { "the panel's content never scrolled" }
    frames(5)
}

/** Scrolls to the end: far, a few times over, until nothing moves. */
internal suspend fun LiveSemantics.scrollToTheEnd(rows: (ReadSemantics) -> List<ReadNode>) {
    repeat(4) {
        val before = rows(read()).map { it.words to it.frame.top }
        read().verticalScroller().scrollBy!!.invoke(0f, 100_000f)
        repeat(30) { frames(1) }
        if (rows(read()).map { it.words to it.frame.top } == before) return
    }
}

/** The lowest row that shows, clipped to what shows of it. */
internal fun lowestShown(rows: List<ReadNode>): ReadNode = rows.filter { it.bounds.height > 1f }.maxBy { it.bounds.bottom }
