package com.kozmos.utils

import com.kozmos.components.mapattribution.KozmosMapAttributionCredit
import com.kozmos.components.mapinfopanel.KozmosMapInfoEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * One link rule for every link Kozmos draws, as on the web and iOS (audit
 * H4, 2026-10-04): the credits checked only scheme and host, so a credit
 * hiding its host behind credentials was a live link.
 */
class KozmosSafeLinkTest {
    @Test
    fun linksHttpAndHttpsWithAHost() {
        for (href in listOf("https://example.com", "http://example.com/a?b=c#d")) {
            assertEquals(href, kozmosSafeLink(href))
        }
    }

    @Test
    fun linksMailtoAndTelOnlyWhereAContactLinkBelongs() {
        for (href in listOf("mailto:support@example.com", "tel:+4412345678")) {
            assertEquals(href, kozmosSafeLink(href, contact = true))
            assertNull(href, kozmosSafeLink(href))
        }
    }

    @Test
    fun refusesCredentialsWhitespaceControlCharactersAndOtherSchemes() {
        val refused = listOf(
            null, "", "/relative", "javascript:alert(1)", "data:text/html,bad",
            "https://user:secret@example.com", "https://maps.example@evil.example",
            "https://example.com/a b", " https://example.com", "https://example.com/\ttab",
            "https://exa\u0000mple.com", "mailto:", "tel:",
        )
        for (contact in listOf(false, true)) {
            for (href in refused) assertNull(href.toString(), kozmosSafeLink(href, contact))
        }
    }

    @Test
    fun aCreditHidingItsHostBehindCredentialsIsNotALink() {
        assertNull(KozmosMapAttributionCredit("c", "Credit", "https://maps.example@evil.example").destination)
        assertNull(KozmosMapAttributionCredit("s", "Credit", "https://example.com/credits page").destination)
        assertNotNull(KozmosMapAttributionCredit("ok", "Credit", "https://example.com/credits").destination)
        assertNull(KozmosMapAttributionCredit("mail", "Credit", "mailto:maps@example.com").destination)
    }

    @Test
    fun aMapInfoEntryStillTakesContactLinks() {
        assertNotNull(KozmosMapInfoEntry("m", "Mail", "mailto:support@example.com").destination)
        assertNull(KozmosMapInfoEntry("c", "Bad", "https://user:secret@example.com").destination)
    }
}
