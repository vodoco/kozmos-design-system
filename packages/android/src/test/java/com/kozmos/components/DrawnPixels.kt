package com.kozmos.components

import androidx.compose.runtime.Composable
import app.cash.paparazzi.Paparazzi
import app.cash.paparazzi.SnapshotHandler
import java.lang.reflect.Proxy

/**
 * Paparazzi as a camera a test can read: it keeps the frame it draws, so a
 * test can ask what colour a point is — the Android counterpart of the iOS
 * tests' `DrawnPixels`. Nothing is recorded or compared, so these tests leave
 * no image behind in record mode and need none in verify mode.
 */
fun pixelsPaparazzi(frames: KeptFrames): Paparazzi = Paparazzi(snapshotHandler = frames.handler)

/** Composes [content], draws it, and returns what was drawn. */
fun Paparazzi.drawn(frames: KeptFrames, content: @Composable () -> Unit): DrawnPixels {
    frames.last = null
    snapshot { content() }
    return DrawnPixels(checkNotNull(frames.last) { "nothing was drawn" })
}

/**
 * Where the frames go. A [Proxy], as [semanticsPaparazzi]'s handler is,
 * because the frame handler's one method takes a
 * `java.awt.image.BufferedImage`, which the Android unit-test compile
 * classpath does not have.
 */
class KeptFrames {
    internal var last: Any? = null

    internal val handler: SnapshotHandler = Proxy.newProxyInstance(
        SnapshotHandler::class.java.classLoader,
        arrayOf(SnapshotHandler::class.java)
    ) { proxy, method, args ->
        when (method.name) {
            "newFrameHandler" -> Proxy.newProxyInstance(
                SnapshotHandler.FrameHandler::class.java.classLoader,
                arrayOf(SnapshotHandler.FrameHandler::class.java)
            ) { _, frameMethod, frameArgs ->
                if (frameMethod.name == "handle") last = frameArgs?.firstOrNull()
                null
            }
            "hashCode" -> System.identityHashCode(proxy)
            "equals" -> proxy === args?.firstOrNull()
            "toString" -> "KeptFrames"
            else -> null
        }
    } as SnapshotHandler
}

/** A drawn frame, read through the `BufferedImage` the handler was given. */
class DrawnPixels internal constructor(private val image: Any) {
    private val rgb = image.javaClass.getMethod(
        "getRGB",
        Int::class.javaPrimitiveType,
        Int::class.javaPrimitiveType
    )

    val width: Int = image.javaClass.getMethod("getWidth").invoke(image) as Int
    val height: Int = image.javaClass.getMethod("getHeight").invoke(image) as Int

    /** The colour drawn at a pixel, as 0xAARRGGBB. */
    fun argb(x: Int, y: Int): Int = rgb.invoke(image, x, y) as Int

    companion object {
        /** Opaque, and within [tolerance] of [expected] on each channel. */
        fun matches(actual: Int, expected: Int, tolerance: Int = 2): Boolean =
            actual ushr 24 > 240 &&
                listOf(16, 8, 0).all { shift ->
                    kotlin.math.abs((actual shr shift and 0xFF) - (expected shr shift and 0xFF)) <= tolerance
                }

        /** 0xAARRGGBB as "#RRGGBB", for a failure a person can read. */
        fun hex(argb: Int): String = "#%06X".format(argb and 0xFFFFFF)

        /** The sum of the three channels: a measure of how light a colour is. */
        fun lightness(argb: Int): Int = (argb shr 16 and 0xFF) + (argb shr 8 and 0xFF) + (argb and 0xFF)
    }
}
