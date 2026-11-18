package com.kozmos.components.heading

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography

/**
 * Heading rank, mirroring the React `Heading.level` prop.
 *
 * Rank drives the type scale. Compose semantics only expose `heading()` as a
 * boolean with no rank, so TalkBack announces "heading" without a level;
 * SwiftUI carries the full rank via `accessibilityHeading`.
 */
enum class KozmosHeadingLevel(val level: Int, val fontSize: Int) {
    H1(1, 36),
    H2(2, 30),
    H3(3, 24),
    H4(4, 20),
    H5(5, 18),
    H6(6, 16)
}

/** A size a heading takes apart from its rank, as React's `Heading size`. */
enum class KozmosHeadingSize {
    /**
     * The one display size, 48sp bold on 54sp lines (decision 203), for a
     * marketing-style headline such as a sign-in hero. The level stays the
     * heading's rank; only its size changes.
     */
    Display
}

/**
 * A ranked heading.
 *
 * Mirrors the React `Heading` API. Unlike `Text`, rank is not styling — it is
 * document structure, so it is expressed as a variant rather than left to the
 * platform type system.
 */
@Composable
fun KozmosHeading(
    text: String,
    modifier: Modifier = Modifier,
    level: KozmosHeadingLevel = KozmosHeadingLevel.H1,
    // Display draws the heading at the display size, keeping its level.
    // Left out, the level's own size, as before.
    size: KozmosHeadingSize? = null
) {
    if (size == KozmosHeadingSize.Display) {
        Text(
            text = text,
            modifier = modifier.semantics { heading() },
            style = KozmosTypography.display,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
    } else {
        Text(
            text = text,
            modifier = modifier.semantics { heading() },
            fontSize = level.fontSize.sp,
            fontWeight = FontWeight.Bold,
            color = KozmosThemeTokens.primitivesColorsForeground100
        )
    }
}
