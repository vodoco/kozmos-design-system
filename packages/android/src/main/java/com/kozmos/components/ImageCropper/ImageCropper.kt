package com.kozmos.components.imagecropper

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.slider.KozmosSlider
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.roundToInt

/**
 * Where an image is framed: a rectangle of the image, each side a fraction of
 * the image's own width or height (0 to 1), measured from its top-left corner,
 * whatever the layout direction. Data, not pixels: the product crops
 * (`x * pixelWidth` and so on). React's `ImageCropperCrop`.
 */
@Immutable
data class KozmosImageCrop(val x: Float, val y: Float, val width: Float, val height: Float)

/** What [KozmosImageCropper]'s `statusLabel` is given: each a whole percentage. */
@Immutable
data class KozmosImageCropperStatus(val left: Int, val top: Int, val zoom: Int)

/** The names of TalkBack's actions on the frame, in the product's language. */
@Immutable
data class KozmosImageCropperActionLabels(
    val moveLeft: String = "Move left",
    val moveRight: String = "Move right",
    val moveUp: String = "Move up",
    val moveDown: String = "Move down",
    val zoomIn: String = "Zoom in",
    val zoomOut: String = "Zoom out"
)

/**
 * The cropper's arithmetic, the same as React's and SwiftUI's: the frame at
 * zoom 1 is the largest of the ratio's shape the image holds, a zoom divides
 * it, and every frame is held inside the image.
 */
internal class KozmosImageCropFrame(imageSize: Size, aspectRatio: Float, maxZoom: Float) {
    val maxZoom: Float = maxOf(1f, maxZoom)
    val baseWidth: Float
    val baseHeight: Float

    init {
        val ratio = if (aspectRatio > 0f) aspectRatio else 1f
        val width = maxOf(imageSize.width, 1f)
        val height = maxOf(imageSize.height, 1f)
        val framed = minOf(width, height * ratio)
        baseWidth = framed / width
        baseHeight = framed / ratio / height
    }

    fun zoomOf(crop: KozmosImageCrop): Float = baseWidth / crop.width

    /** A frame at [zoom], its top-left at [x] and [y], held inside the image. */
    fun place(x: Float, y: Float, zoom: Float): KozmosImageCrop {
        val z = zoom.coerceIn(1f, maxZoom)
        val width = baseWidth / z
        val height = baseHeight / z
        return KozmosImageCrop(
            x = x.coerceIn(0f, maxOf(0f, 1f - width)),
            y = y.coerceIn(0f, maxOf(0f, 1f - height)),
            width = width,
            height = height
        )
    }

    /** A frame given in, made one this image and ratio can have; null is the middle at zoom 1. */
    fun normalise(crop: KozmosImageCrop?): KozmosImageCrop =
        if (crop == null) place((1f - baseWidth) / 2f, (1f - baseHeight) / 2f, 1f)
        else place(crop.x, crop.y, zoomOf(crop))

    /** Moved by [dx] and [dy] tenths of the frame, physically: an image does not mirror. */
    fun pan(crop: KozmosImageCrop, dx: Float, dy: Float): KozmosImageCrop =
        place(crop.x + dx * crop.width * PAN_STEP, crop.y + dy * crop.height * PAN_STEP, zoomOf(crop))

    /** Zoomed to [zoom] about the frame's middle, so what is centred stays. */
    fun zoom(crop: KozmosImageCrop, zoom: Float): KozmosImageCrop {
        val z = zoom.coerceIn(1f, maxZoom)
        return place(
            crop.x + crop.width / 2f - baseWidth / z / 2f,
            crop.y + crop.height / 2f - baseHeight / z / 2f,
            z
        )
    }

    /**
     * Dragged by a fraction of the box ([dx], [dy]) and scaled by [scale]: the
     * image follows the finger, so the frame moves the other way.
     */
    fun drag(start: KozmosImageCrop, dx: Float, dy: Float, scale: Float): KozmosImageCrop {
        val z = (zoomOf(start) * scale).coerceIn(1f, maxZoom)
        val middleX = start.x + start.width / 2f - dx * start.width
        val middleY = start.y + start.height / 2f - dy * start.height
        return place(middleX - baseWidth / z / 2f, middleY - baseHeight / z / 2f, z)
    }

    fun status(crop: KozmosImageCrop) = KozmosImageCropperStatus(
        left = (crop.x * 100f).roundToInt(),
        top = (crop.y * 100f).roundToInt(),
        zoom = (zoomOf(crop) * 100f).roundToInt()
    )

    companion object {
        const val ZOOM_STEP = 1.25f
        const val PAN_STEP = 0.1f
    }
}

/** What is said by default after each move or zoom. */
fun kozmosImageCropperStatus(status: KozmosImageCropperStatus): String =
    "Frame ${status.left}% from the left, ${status.top}% from the top, zoom ${status.zoom}%."

/**
 * An image framed to an aspect ratio (GAP-273), as React's `ImageCropper`: the
 * frame is the box, and the image moves and scales under it. A drag moves the
 * image, a pinch zooms it, and the zoom row under it has Zoom out, a zoom
 * slider and Zoom in. [crop] is the frame as fractions of the image, never
 * pixels; null frames the middle at zoom 100%, and [onCropChange] is handed
 * that frame once it is drawn, as React's `onCrop` is on load.
 *
 * TalkBack reads the frame as one node, named [label], with where the frame is
 * as its state, said politely as it changes; its actions move it by a tenth
 * of itself and zoom it, and it is adjustable, its value the zoom. A hardware
 * keyboard's arrows move it and plus and minus zoom.
 *
 * @param painter The image; its intrinsic size gives the image's shape, or
 * [imageSize] when the painter has none.
 * @param contentDescription The image's text alternative.
 * @param aspectRatio The frame's width over its height: 1, the default, for a
 * square logo; 16f / 9f for a cover.
 */
@Composable
fun KozmosImageCropper(
    painter: Painter,
    contentDescription: String?,
    crop: KozmosImageCrop?,
    onCropChange: (KozmosImageCrop) -> Unit,
    modifier: Modifier = Modifier,
    aspectRatio: Float = 1f,
    maxZoom: Float = 4f,
    showZoomControls: Boolean = true,
    enabled: Boolean = true,
    imageSize: Size? = null,
    label: String = "Image frame",
    instructions: String = "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom.",
    statusLabel: (KozmosImageCropperStatus) -> String = ::kozmosImageCropperStatus,
    zoomLabel: String = "Zoom",
    actionLabels: KozmosImageCropperActionLabels = KozmosImageCropperActionLabels()
) {
    val intrinsic = painter.intrinsicSize
    val shape = imageSize
        ?: if (intrinsic.isSpecified()) intrinsic else Size(1f, 1f)
    val ratio = if (aspectRatio > 0f) aspectRatio else 1f
    val frame = KozmosImageCropFrame(shape, ratio, maxZoom)
    val current = frame.normalise(crop)
    val status = statusLabel(frame.status(current))
    val zoom = frame.zoomOf(current)
    val atMin = zoom <= 1f + 1e-4f
    val atMax = zoom >= frame.maxZoom - 1e-4f

    // null, or a frame this image cannot have, becomes the one drawn, and
    // the product is handed it.
    LaunchedEffect(current, crop == current) {
        if (crop != current) onCropChange(current)
    }

    val commit: (KozmosImageCrop) -> Unit = { next -> if (enabled && next != current) onCropChange(next) }
    val zoomIn = { commit(frame.zoom(current, zoom * KozmosImageCropFrame.ZOOM_STEP)) }
    val zoomOut = { commit(frame.zoom(current, zoom / KozmosImageCropFrame.ZOOM_STEP)) }
    val move = { dx: Float, dy: Float -> commit(frame.pan(current, dx, dy)) }
    val latest by rememberUpdatedState(Triple(frame, current, commit))

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        val box = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(ratio)
                .alpha(if (enabled) 1f else 0.5f)
                .clip(box)
                .background(KozmosThemeTokens.primitivesColorsBackground100)
                .border(1.dp, KozmosThemeTokens.semanticsBorderInput, box)
                .clearAndSetSemantics {
                    this.contentDescription = "$label. $instructions"
                    stateDescription = status
                    liveRegion = LiveRegionMode.Polite
                    progressBarRangeInfo = ProgressBarRangeInfo(zoom, 1f..frame.maxZoom)
                    if (!enabled) {
                        disabled()
                    } else {
                        setProgress { target ->
                            commit(frame.zoom(current, target))
                            true
                        }
                        customActions = listOf(
                            CustomAccessibilityAction(actionLabels.moveLeft) { move(-1f, 0f); true },
                            CustomAccessibilityAction(actionLabels.moveRight) { move(1f, 0f); true },
                            CustomAccessibilityAction(actionLabels.moveUp) { move(0f, -1f); true },
                            CustomAccessibilityAction(actionLabels.moveDown) { move(0f, 1f); true },
                            CustomAccessibilityAction(actionLabels.zoomIn) { zoomIn(); true },
                            CustomAccessibilityAction(actionLabels.zoomOut) { zoomOut(); true }
                        )
                    }
                }
                .onKeyEvent { event ->
                    if (!enabled || event.type != KeyEventType.KeyDown) return@onKeyEvent false
                    // Physical, in right to left too: an image does not mirror.
                    when (event.key) {
                        Key.DirectionLeft -> move(-1f, 0f)
                        Key.DirectionRight -> move(1f, 0f)
                        Key.DirectionUp -> move(0f, -1f)
                        Key.DirectionDown -> move(0f, 1f)
                        Key.Plus, Key.Equals, Key.NumPadAdd -> zoomIn()
                        Key.Minus, Key.NumPadSubtract -> zoomOut()
                        else -> return@onKeyEvent false
                    }
                    true
                }
                .focusable(enabled)
                .pointerInput(enabled) {
                    if (!enabled) return@pointerInput
                    detectTransformGestures { _, pan, scale, _ ->
                        val (f, now, set) = latest
                        if (size.width == 0 || size.height == 0) return@detectTransformGestures
                        set(f.drag(now, pan.x / size.width, pan.y / size.height, scale))
                    }
                }
        ) {
            val boxWidth = maxWidth
            val boxHeight = maxHeight
            // Physical: an image's pixels do not mirror right to left.
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Image(
                    painter = painter,
                    contentDescription = contentDescription,
                    contentScale = ContentScale.FillBounds,
                    modifier = Modifier
                        .wrapContentSize(Alignment.TopStart, unbounded = true)
                        .absoluteOffset(
                            x = -boxWidth * (current.x / current.width),
                            y = -boxHeight * (current.y / current.height)
                        )
                        .requiredSize(boxWidth / current.width, boxHeight / current.height)
                )
            }
        }
        if (showZoomControls) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                KozmosIconButton(
                    icon = Icons.Default.ZoomOut,
                    onClick = zoomOut,
                    contentDescription = actionLabels.zoomOut,
                    variant = KozmosIconButtonVariant.Outline,
                    enabled = enabled && !atMin
                )
                KozmosSlider(
                    value = (zoom * 100f).roundToInt().toFloat(),
                    // The slider says its own value: the frame says nothing more.
                    onValueChange = { percent -> commit(frame.zoom(current, percent / 100f)) },
                    modifier = Modifier
                        .weight(1f)
                        .semantics(mergeDescendants = false) { this.contentDescription = zoomLabel },
                    valueRange = 100f..maxOf(100.5f, frame.maxZoom * 100f),
                    enabled = enabled && frame.maxZoom > 1f,
                    formatValue = { "${it.roundToInt()}%" }
                )
                KozmosIconButton(
                    icon = Icons.Default.ZoomIn,
                    onClick = zoomIn,
                    contentDescription = actionLabels.zoomIn,
                    variant = KozmosIconButtonVariant.Outline,
                    enabled = enabled && !atMax
                )
            }
        }
    }
}

private fun Size.isSpecified(): Boolean =
    this != Size.Unspecified && width > 0f && height > 0f && width.isFinite() && height.isFinite()
