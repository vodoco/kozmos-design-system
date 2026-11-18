// CodeBlock.mdx's Compose snippet ("Implementation"), word for word below
// the package line: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.codeblock.KozmosCodeBlock

// MAP-619's merged unit: a custom field's JSON, read only, with a copy.
@Composable
fun MergedUnitJSON(json: String) {
    KozmosCodeBlock(
        code = json,
        label = "mergedUnit JSON",
        copyable = true,
        copyLabel = "Copy JSON"
    )
}
