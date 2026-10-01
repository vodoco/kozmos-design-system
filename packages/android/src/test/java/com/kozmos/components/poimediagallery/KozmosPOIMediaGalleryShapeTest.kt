package com.kozmos.components.poimediagallery

import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import com.kozmos.tokens.KozmosDimensions
import org.junit.Assert.assertEquals
import org.junit.Test

class KozmosPOIMediaGalleryShapeTest {
    @Test
    fun photoTilesUseTheSameControlRadiusAsSwiftUIAndReact() {
        val density = Density(2f)
        val outline = galleryTileShape().createOutline(Size(400f, 300f), LayoutDirection.Ltr, density) as Outline.Rounded
        val expected = with(density) { KozmosDimensions.semanticsRadiusControl.toPx() }
        for (corner in listOf(outline.roundRect.topLeftCornerRadius, outline.roundRect.topRightCornerRadius,
            outline.roundRect.bottomLeftCornerRadius, outline.roundRect.bottomRightCornerRadius)) {
            assertEquals(expected, corner.x, 0f)
            assertEquals(expected, corner.y, 0f)
        }
    }
}
