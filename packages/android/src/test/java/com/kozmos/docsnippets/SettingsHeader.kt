// PageHeader.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.breadcrumb.KozmosBreadcrumb
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.pageheader.KozmosPageHeader

// The band is theme 0, its content 32 below its top and 24 above its end.
// tone = KozmosPageHeaderTone.Default paints no band; size =
// KozmosPageHeaderSize.Lg is a landing page's title. The title is a heading.
@Composable
fun SettingsHeader() {
    KozmosPageHeader(
        title = "Settings",
        description = "Manage the site's map, its levels and who can edit them.",
        breadcrumb = {
            KozmosBreadcrumb(items = listOf("Boston Logan Airport", "Settings"), onItemClick = {})
        },
        actions = {
            KozmosButton(onClick = {}) { Text("Save changes") }
        }
    )
}
