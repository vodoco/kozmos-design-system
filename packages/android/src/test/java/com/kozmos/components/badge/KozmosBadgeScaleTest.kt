package com.kozmos.components.badge

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-147, decision 93: Badge is a status badge on Chip's scale, 28, 32 and
 * 36dp, where it was 44 like a button; an icon Badge is 32 square.
 */
class KozmosBadgeScaleTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun eachSizeIsChipsHeight() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    for (size in BadgeSize.entries) {
                        KozmosBadge(text = "New", size = size, modifier = Modifier.testTag("badge-$size"))
                    }
                }
            }
        }
        val density = paparazzi.context.resources.displayMetrics.density
        val expected = mapOf(BadgeSize.Sm to 28f, BadgeSize.Default to 32f, BadgeSize.Lg to 36f, BadgeSize.Icon to 32f)
        for ((size, height) in expected) {
            val node = tree.unmerged.single { it.tag == "badge-$size" }
            assertEquals("$size height in dp", height, node.bounds.height / density, 0.5f)
            if (size == BadgeSize.Icon) assertEquals("icon width in dp", 32f, node.bounds.width / density, 0.5f)
        }
    }
}
