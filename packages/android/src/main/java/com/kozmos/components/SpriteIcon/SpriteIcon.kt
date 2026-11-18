package com.kozmos.components.spriteicon

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL

/** The box a [KozmosSpriteIcon] is drawn in, square (decision 219). */
enum class KozmosSpriteIconSize(val side: Dp) {
    S16(16.dp),
    S20(20.dp),
    S24(24.dp)
}

/** One cell of a MapLibre sprite atlas's index, in the atlas image's pixels. */
data class KozmosSpriteCell(val x: Int, val y: Int, val width: Int, val height: Int)

/** Reading a published atlas, apart from any view. */
object KozmosSprite {
    /** MapLibre's suffix: `@2x` on a 2x screen and above, none below. */
    fun suffix(density: Float): String = if (density >= 2f) "@2x" else ""

    /** The atlas's index, its cells by name. */
    fun index(json: String): Map<String, KozmosSpriteCell> {
        val root = JSONObject(json)
        return root.keys().asSequence().associateWith { name ->
            val cell = root.getJSONObject(name)
            KozmosSpriteCell(cell.getInt("x"), cell.getInt("y"), cell.getInt("width"), cell.getInt("height"))
        }
    }

    /** The cell's size in a [side] box, scaled to fit with its aspect ratio kept. */
    fun fittedSize(cell: KozmosSpriteCell, side: Dp): Pair<Dp, Dp> {
        val longest = maxOf(cell.width, cell.height).toFloat()
        return (side.value * cell.width / longest).dp to (side.value * cell.height / longest).dp
    }

    /** The cell cut from its atlas image, or null where it falls outside it. */
    fun crop(atlas: Bitmap, cell: KozmosSpriteCell): Bitmap? =
        if (cell.x < 0 || cell.y < 0 || cell.x + cell.width > atlas.width || cell.y + cell.height > atlas.height) null
        else Bitmap.createBitmap(atlas, cell.x, cell.y, cell.width, cell.height)

    class Atlas(val image: Bitmap, val cells: Map<String, KozmosSpriteCell>)

    private val loads = mutableMapOf<String, CompletableDeferred<Atlas?>>()

    /**
     * The atlas at [base] with [suffix], read once per URL and scale; null
     * when it cannot be read. [read] fetches a URL's bytes.
     */
    suspend fun atlas(base: String, suffix: String, read: (String) -> ByteArray = { URL(it).readBytes() }): Atlas? {
        val key = base + suffix
        val (load, first) = synchronized(loads) {
            loads[key]?.let { it to false } ?: CompletableDeferred<Atlas?>().also { loads[key] = it }.let { it to true }
        }
        if (first) {
            val loaded = withContext(Dispatchers.IO) {
                runCatching {
                    val cells = index(String(read("$key.json")))
                    val bytes = read("$key.png")
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.let { Atlas(it, cells) }
                }.getOrNull()
            }
            load.complete(loaded)
        }
        return load.await()
    }
}

/**
 * One cell of a published MapLibre sprite atlas, drawn as published
 * (GAP-150, decisions 86 and 219), as React's `SpriteIcon`: a taxonomy type's
 * full-colour bubble, glyph and marker dot, scaled to 16, 20 or 24 with its
 * aspect ratio kept, never tinted. [sprite] is the atlas's version-pinned
 * base URL, to which `.json` and `.png` (`@2x` on a 2x screen) are added;
 * Kozmos names no version. Decorative unless [label] names it. While the
 * atlas loads, or where the cell is missing, it keeps an empty box of its
 * size. The product's app needs the INTERNET permission to read a remote atlas.
 */
@Composable
fun KozmosSpriteIcon(
    sprite: String,
    name: String,
    modifier: Modifier = Modifier,
    size: KozmosSpriteIconSize = KozmosSpriteIconSize.S24,
    label: String? = null
) {
    val suffix = KozmosSprite.suffix(LocalDensity.current.density)
    var drawn by remember(sprite, name, suffix) { mutableStateOf<Pair<Bitmap, KozmosSpriteCell>?>(null) }
    LaunchedEffect(sprite, name, suffix) {
        val atlas = KozmosSprite.atlas(sprite, suffix) ?: return@LaunchedEffect
        val cell = atlas.cells[name] ?: return@LaunchedEffect
        drawn = KozmosSprite.crop(atlas.image, cell)?.let { it to cell }
    }
    Box(
        modifier = modifier
            .size(size.side)
            .clearAndSetSemantics {
                if (label != null) {
                    contentDescription = label
                    role = Role.Image
                }
            },
        contentAlignment = Alignment.Center
    ) {
        drawn?.let { (image, cell) ->
            val (width, height) = KozmosSprite.fittedSize(cell, size.side)
            Image(
                bitmap = image.asImageBitmap(),
                contentDescription = null,
                contentScale = ContentScale.FillBounds,
                filterQuality = FilterQuality.High,
                modifier = Modifier.size(width, height)
            )
        }
    }
}
