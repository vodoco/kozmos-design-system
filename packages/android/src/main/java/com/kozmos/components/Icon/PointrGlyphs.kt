package com.kozmos.components.icon

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/**
 * Pointr Icon Library outlines Material has no unmirrored match for, drawn
 * from Pointr's own path data in `packages/icons/src/pointr/icons.generated.ts`
 * on its 24 grid, stroked 2 with round caps and joins: the art React draws.
 * KozmosIcon draws them by name; the direction marks for entry, exit and the
 * ramps are the Express wayfinding artwork now. Material's Login and Logout
 * are auto-mirrored, and a physical way in or out is not.
 */
internal object KozmosPointrGlyphs {
    /** Node 1007:10044. */
    val LogIn01: ImageVector by lazy {
        outline("LogIn01", "M15 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11985 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H15M10 17L15 12L10 7M15 12L3 12")
    }

    /** Node 1007:10056. */
    val LogOut01: ImageVector by lazy {
        outline("LogOut01", "M16 7L21 12L16 17M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9")
    }

    /** Node 1007:9346. */
    val ArrowUpRight: ImageVector by lazy { outline("ArrowUpRight", "M7 17L17 7M17 17V7H7") }

    /** Node 1007:9283. */
    val ArrowDownRight: ImageVector by lazy { outline("ArrowDownRight", "M7 7L17 17M7 17H17V7") }

    private fun outline(name: String, data: String): ImageVector = ImageVector.Builder(
        name = name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f, autoMirror = false
    ).addPath(
        pathData = addPathNodes(data), fill = null, stroke = SolidColor(Color.Black), strokeLineWidth = 2f,
        strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round
    ).build()
}
