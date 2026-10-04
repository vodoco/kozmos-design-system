package com.kozmos.utils

import java.net.URI

/**
 * The destination Kozmos puts behind a link, or null to show the text
 * unlinked. One rule for every link it draws (MapAttribution's credits,
 * MapInfoPanel's entries), as on the web and iOS: http or https with a host,
 * and, where a contact link belongs, mailto or tel with a target; no
 * credentials (`https://maps.example@evil.example` reads as one host and goes
 * to another); no whitespace or control characters. Until 2026-10-04 the
 * credits checked only the scheme and host.
 */
internal fun kozmosSafeLink(href: String?, contact: Boolean = false): String? = href?.takeIf { text ->
    text.none { it.code <= 32 } && runCatching {
        val uri = URI(text)
        uri.rawUserInfo == null && when (uri.scheme?.lowercase()) {
            "http", "https" -> !uri.host.isNullOrEmpty()
            "mailto", "tel" -> contact && !uri.schemeSpecificPart.isNullOrEmpty()
            else -> false
        }
    }.getOrDefault(false)
}
