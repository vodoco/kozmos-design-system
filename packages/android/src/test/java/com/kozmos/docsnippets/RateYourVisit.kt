// Rating.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.rating.KozmosRating

// 0 is unrated, and choosing the chosen star clears it. label is the
// group's name for TalkBack, as aria-label is on the web.
@Composable
fun RateYourVisit() {
    var rating by remember { mutableIntStateOf(0) }
    KozmosRating(value = rating, onValueChange = { rating = it }, label = "Rate your visit")
}
