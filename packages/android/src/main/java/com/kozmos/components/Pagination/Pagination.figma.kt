package com.kozmos.components.pagination

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.tokens.KozmosThemeTokens

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157")
@FigmaVariant("Content", "Basic")
class KozmosPaginationBasicConnect {
    @FigmaProperty(FigmaType.Text, "Page 1 Text")
    val page1: String = "1"

    @FigmaProperty(FigmaType.Text, "Page 2 Text")
    val page2: String = "2"

    @FigmaProperty(FigmaType.Text, "Page 3 Text")
    val page3: String = "3"

    @FigmaProperty(FigmaType.Text, "Previous Text")
    val previousText: String = "Previous"

    @FigmaProperty(FigmaType.Text, "Next Text")
    val nextText: String = "Next"

    @Composable
    fun ComponentExample() {
        KozmosPagination {
            KozmosPaginationPrevious(onClick = {}, label = previousText)
            KozmosPaginationLink(text = page1, onClick = {})
            KozmosPaginationLink(text = page2, isActive = true, onClick = {})
            KozmosPaginationLink(text = page3, onClick = {})
            KozmosPaginationNext(onClick = {}, label = nextText)
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157")
@FigmaVariant("Content", "Ellipsis")
class KozmosPaginationEllipsisConnect {
    @FigmaProperty(FigmaType.Text, "Page 1 Text")
    val page1: String = "1"

    @FigmaProperty(FigmaType.Text, "Page 2 Text")
    val page2: String = "2"

    @FigmaProperty(FigmaType.Text, "Page 3 Text")
    val page3: String = "3"

    @FigmaProperty(FigmaType.Text, "Last Page Text")
    val lastPage: String = "10"

    @FigmaProperty(FigmaType.Text, "Previous Text")
    val previousText: String = "Previous"

    @FigmaProperty(FigmaType.Text, "Next Text")
    val nextText: String = "Next"

    @Composable
    fun ComponentExample() {
        KozmosPagination {
            KozmosPaginationPrevious(onClick = {}, label = previousText)
            KozmosPaginationLink(text = page1, onClick = {})
            KozmosPaginationLink(text = page2, isActive = true, onClick = {})
            KozmosPaginationLink(text = page3, onClick = {})
            KozmosPaginationEllipsis()
            KozmosPaginationLink(text = lastPage, onClick = {})
            KozmosPaginationNext(onClick = {}, label = nextText)
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157")
@FigmaVariant("Content", "Compact")
class KozmosPaginationCompactConnect {
    @FigmaProperty(FigmaType.Text, "Compact Text")
    val compactText: String = "2 / 10"

    @FigmaProperty(FigmaType.Text, "Previous Text")
    val previousText: String = "Previous"

    @FigmaProperty(FigmaType.Text, "Next Text")
    val nextText: String = "Next"

    @Composable
    fun ComponentExample() {
        KozmosPagination {
            KozmosPaginationPrevious(onClick = {}, label = previousText)
            Text(
                text = compactText,
                color = KozmosThemeTokens.primitivesColorsForeground500,
                style = MaterialTheme.typography.bodyMedium
            )
            KozmosPaginationNext(onClick = {}, label = nextText)
        }
    }
}
