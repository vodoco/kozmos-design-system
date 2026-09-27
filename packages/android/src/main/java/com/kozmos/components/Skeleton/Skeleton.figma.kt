package com.kozmos.components.skeleton

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1062")
class KozmosSkeletonConnect {
    // The set's Shape axis is the component's own `shape` since row 56, so the
    // example names the shape instead of drawing it with modifiers: a line and
    // a circle hold their own size, and a block takes the one the product gives.
    @FigmaProperty(FigmaType.Enum, "Shape")
    val shape: KozmosSkeletonShape = Figma.mapping(
        "Line" to KozmosSkeletonShape.Line,
        "Block" to KozmosSkeletonShape.Block,
        "Circle" to KozmosSkeletonShape.Circle
    )

    @Composable
    fun ComponentExample() {
        KozmosSkeleton(shape = shape)
    }
}
