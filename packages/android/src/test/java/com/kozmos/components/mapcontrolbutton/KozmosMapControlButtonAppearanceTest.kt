package com.kozmos.components.mapcontrolbutton

import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonAppearance.Surface
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonAppearance.Tone
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The state → appearance decision for a map control, tested without rendering.
 *
 * These mirror the React and SwiftUI assertions, so all three platforms are held
 * to the same ruling. Decision 40 (2026-09-28): the SDK's Tracking Indicator —
 * a toggle's state is its tone, grey off and navy on with the theme's blue
 * mark, and no edge in any state. Filled inverts the surface.
 */
class KozmosMapControlButtonAppearanceTest {
    @Test
    fun aControlThatIsNotAToggleKeepsTheInk() {
        // Zoom, compass: neither off nor on, so the ink, as the SDK's own floor
        // tile keeps.
        for (emphasis in KozmosMapControlButtonEmphasis.values()) {
            val appearance = KozmosMapControlButtonAppearance.resolve(null, emphasis)
            assertEquals(Surface.Chrome, appearance.surface)
            assertEquals(Tone.Ink, appearance.icon)
            assertEquals(Tone.Ink, appearance.label)
        }
    }

    @Test
    fun aToggleThatIsOffIsGrey() {
        // The SDK's "Focus⏎Off": the mark and both lines grey, whatever the
        // emphasis, on the map's own surface.
        val off = KozmosMapControlButtonAppearance.resolve(false, KozmosMapControlButtonEmphasis.Tinted)
        assertEquals(Surface.Chrome, off.surface)
        assertEquals(Tone.Muted, off.icon)
        assertEquals(Tone.Muted, off.label)
        assertEquals(off, KozmosMapControlButtonAppearance.resolve(false, KozmosMapControlButtonEmphasis.Filled))
    }

    @Test
    fun aTintedToggleThatIsOnIsTheThemesBlueAndNavy() {
        // The SDK's "Focus On": the mark the theme's blue and the words navy,
        // on the map's own surface. The words used to stay ink under a primary
        // edge.
        val on = KozmosMapControlButtonAppearance.resolve(true, KozmosMapControlButtonEmphasis.Tinted)
        assertEquals(Surface.Chrome, on.surface)
        assertEquals(Tone.Theme, on.icon)
        assertEquals(Tone.ThemeText, on.label)
    }

    @Test
    fun filledPressedInvertsTheSurfaceAndEveryLineOnIt() {
        val appearance = KozmosMapControlButtonAppearance.resolve(true, KozmosMapControlButtonEmphasis.Filled)
        assertEquals(Surface.Filled, appearance.surface)
        assertEquals(Tone.OnFill, appearance.icon)
        // A grey line would sit at about 1.9:1 on the theme fill.
        assertEquals(Tone.OnFill, appearance.label)
    }

    @Test
    fun itDrawsItsStateAloneWhenItsNameIsNotShown() {
        // Two equal lines, the name over the state; the state alone when the
        // name is not shown — the SDK's "No Location" — and the name when there
        // is no state to show.
        assertEquals(listOf("Focus", "Off"), drawnLines("Focus", "Off", showLabel = true))
        assertEquals(listOf("No Location"), drawnLines("Focus", "No Location", showLabel = false))
        assertEquals(listOf("Focus"), drawnLines("Focus", null, showLabel = false))
    }

    @Test
    fun itSaysWhatItsWordsLeaveOutAfterThem() {
        // The name, the state, and what the words leave out, in that order, so
        // the name still begins with what is shown.
        assertEquals(
            "Focus, On, map turns with you",
            accessibleLabel("Focus", "On", "map turns with you")
        )
        assertEquals("Focus, No Location", accessibleLabel("Focus", "No Location", null))
        assertEquals("Zoom in", accessibleLabel("Zoom in", null, null))
    }
}
