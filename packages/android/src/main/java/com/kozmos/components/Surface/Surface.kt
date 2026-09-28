package com.kozmos.components.surface

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosEffects
import com.kozmos.tokens.KozmosThemeTokens

/**
 * What a surface is made of. Solid — the background colour with the subtle
 * border — is the default everywhere; glass, the glass surface role composed
 * from `Semantics.Effect.glass` (`KozmosEffects.semanticsEffectGlass`), is a
 * choice a product makes per surface.
 *
 * Glass here is the tint and the edge alone: Compose blurs a node's own
 * content (`Modifier.blur`, API 31), not what lies behind it, and a backdrop
 * blur needs a capture of the layer beneath that the framework does not offer.
 * The blur and saturation are the web's and iOS's numbers.
 */
enum class KozmosSurfaceStyle {
    Solid,
    Glass
}

/**
 * The Kozmos surface the content is drawn on: solid, glass, or null where
 * there is none. The map shell provides it to its panel's header and
 * content, a card with a `surface` provides it to what it holds, and a
 * details card's bordered presentations provide solid, their own card. On
 * glass, text that is muted elsewhere takes the foreground colour, so it
 * reads at 4.5:1 over whatever shows through (decision 48), as the web's
 * glass surface says with `--kozmos-surface-muted-foreground`.
 */
val LocalKozmosSurfaceStyle = compositionLocalOf<KozmosSurfaceStyle?> { null }

/**
 * Text that is muted elsewhere, as it is drawn on [surface] (decision 48): on
 * glass the foreground colour, so it reads at 4.5:1 over any map, where muted
 * it read under 3:1 over a saturated one; elsewhere the muted colour.
 */
@Composable
internal fun kozmosMutedForeground(surface: KozmosSurfaceStyle? = LocalKozmosSurfaceStyle.current): Color =
    if (surface == KozmosSurfaceStyle.Glass) {
        KozmosThemeTokens.primitivesColorsForeground100
    } else {
        KozmosThemeTokens.primitivesColorsForeground500
    }

/**
 * The fill and the edge, read through the theme. They were `KozmosColors`,
 * the light values, until 2026-09-22: a solid surface stayed white with a
 * light edge in the dark.
 */
object KozmosSurfaceDefaults {
    /** The fill in `background`: whole for solid, at the token's opacity for glass. */
    fun tint(style: KozmosSurfaceStyle, background: Color): Color = when (style) {
        KozmosSurfaceStyle.Solid -> background
        KozmosSurfaceStyle.Glass -> background.copy(alpha = KozmosEffects.semanticsEffectGlass.opacity)
    }

    /** The fill, in the theme's background colour. */
    @Composable
    fun tint(style: KozmosSurfaceStyle): Color = tint(style, KozmosThemeTokens.primitivesColorsBackground0)

    /** The edge: the subtle border, or for glass a light line at the token's border opacity. */
    @Composable
    fun border(style: KozmosSurfaceStyle): BorderStroke = when (style) {
        KozmosSurfaceStyle.Solid -> BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle)
        KozmosSurfaceStyle.Glass -> BorderStroke(1.dp, Color.White.copy(alpha = KozmosEffects.semanticsEffectGlass.borderOpacity))
    }
}

/** A surface in `shape`, for a node that is not a `Surface`: solid by default, or glass. */
fun Modifier.kozmosSurface(shape: Shape, style: KozmosSurfaceStyle = KozmosSurfaceStyle.Solid): Modifier = composed {
    clip(shape)
        .background(KozmosSurfaceDefaults.tint(style), shape)
        .border(KozmosSurfaceDefaults.border(style), shape)
}

/**
 * A dashed edge in `color` inside a rounded rectangle of `cornerRadius`, as
 * React's `border-dashed` and SwiftUI's `strokeBorder(dash: [4, 4])` draw an
 * empty or a waiting state's box: 1 wide, 4 on and 4 off, inside the shape.
 */
fun Modifier.kozmosDashedEdge(color: Color, cornerRadius: Dp): Modifier = drawWithContent {
    drawContent()
    val width = 1.dp.toPx()
    val dash = 4.dp.toPx()
    drawRoundRect(
        color = color,
        topLeft = Offset(width / 2, width / 2),
        size = Size(size.width - width, size.height - width),
        cornerRadius = CornerRadius(cornerRadius.toPx() - width / 2),
        style = Stroke(width = width, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash, dash)))
    )
}
