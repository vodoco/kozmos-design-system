package com.kozmos.components.mapstatuspill

import com.kozmos.components.mapstatuspill.KozmosMapStatusPillAppearance.Ink
import com.kozmos.components.mapstatuspill.KozmosMapStatusPillAppearance.Mark
import com.kozmos.components.mapstatuspill.KozmosMapStatusPillAppearance.Surface
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * What each tone of the map's status pill resolves to (decision 39), before
 * anything is drawn: the board's marks and inks, as React's owned rules and
 * SwiftUI's `KozmosMapStatusPillAppearance` resolve them.
 */
class KozmosMapStatusPillAppearanceTest {
    @Test
    fun eachToneResolvesToTheBoardsMarkAndInk() {
        assertEquals(
            KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Ink, Mark.None),
            KozmosMapStatusPillAppearance.of(KozmosMapStatusPillTone.Neutral)
        )
        assertEquals(
            KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Themed, Mark.Spinner),
            KozmosMapStatusPillAppearance.of(KozmosMapStatusPillTone.Progress)
        )
        assertEquals(
            KozmosMapStatusPillAppearance(Surface.Page, Ink.Success, Ink.Success, Mark.Check),
            KozmosMapStatusPillAppearance.of(KozmosMapStatusPillTone.Success)
        )
        assertEquals(
            KozmosMapStatusPillAppearance(Surface.Page, Ink.Ink, Ink.Danger, Mark.Triangle),
            KozmosMapStatusPillAppearance.of(KozmosMapStatusPillTone.Danger)
        )
        assertEquals(
            KozmosMapStatusPillAppearance(Surface.Warning, Ink.OnWarning, Ink.OnWarning, Mark.Triangle),
            KozmosMapStatusPillAppearance.of(KozmosMapStatusPillTone.Warning)
        )
    }

    /** A neutral pill has no mark to reserve room for; every other tone has its own. */
    @Test
    fun onlyTheNeutralToneHasNoMarkOfItsOwn() {
        assertNull(toneIcon(KozmosMapStatusPillTone.Neutral))
        for (tone in KozmosMapStatusPillTone.entries - KozmosMapStatusPillTone.Neutral) {
            assertNotNull("$tone has no mark of its own", toneIcon(tone))
        }
    }
}
