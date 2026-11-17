// Heading.mdx's Compose snippet ("Display size"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.heading.KozmosHeading
import com.kozmos.components.heading.KozmosHeadingLevel
import com.kozmos.components.heading.KozmosHeadingSize

// The sign-in page's headline at the display size, 48sp bold on 54sp lines,
// still a heading to TalkBack.
@Composable
fun SignInHero() {
    KozmosHeading(
        text = "Digitize your building like never before.",
        level = KozmosHeadingLevel.H1,
        size = KozmosHeadingSize.Display
    )
}
