// Pagination.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.pagination.KozmosPagination
import com.kozmos.components.pagination.KozmosPaginationLink
import com.kozmos.components.pagination.KozmosPaginationNext

// Each page is pressable text, not a link: there is no href, and where a
// press goes is yours. TalkBack is told no role and not which page is
// current, and Previous and Next are fixed English words.
@Composable
fun ResultPages(page: Int, goTo: (Int) -> Unit) {
    KozmosPagination {
        KozmosPaginationLink(text = "1", isActive = page == 1, onClick = { goTo(1) })
        KozmosPaginationLink(text = "2", isActive = page == 2, onClick = { goTo(2) })
        KozmosPaginationNext(onClick = { goTo(page + 1) })
    }
}
