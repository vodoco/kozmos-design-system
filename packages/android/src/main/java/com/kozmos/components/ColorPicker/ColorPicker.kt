package com.kozmos.components.colorpicker

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.AbsoluteAlignment
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.layout.layoutId
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.slider.KozmosSlider
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosColorPickerFormat {
    Hex,
    Rgb,
    Hsl
}

@Composable
fun KozmosColorPicker(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    alpha: Float = 100f,
    onAlphaChange: (Float) -> Unit = {},
    label: String? = null,
    helperText: String? = null,
    paletteLabel: String = "Kozmos Design System 2.0",
    presets: List<String> = kozmosColorPickerDefaultPresets,
    format: KozmosColorPickerFormat = KozmosColorPickerFormat.Hsl,
    expanded: Boolean? = null,
    defaultExpanded: Boolean = false,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    status: KozmosInputStatus = KozmosInputStatus.Default
) {
    var internalExpanded by rememberSaveable { mutableStateOf(defaultExpanded) }
    var currentFormat by rememberSaveable { mutableStateOf(format) }
    val isExpanded = expanded ?: internalExpanded
    val setExpanded: (Boolean) -> Unit = { next ->
        if (expanded == null) internalExpanded = next
    }
    val normalizedValue = normalizeHexColor(value)
    val color = colorFromHex(normalizedValue)
    val hsl = rgbToHsl(hexToRgb(normalizedValue))
    val fieldShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val borderColor = statusColor(status) ?: KozmosThemeTokens.semanticsBorderInput
    val fieldBackground = if (!enabled || readOnly) {
        KozmosThemeTokens.primitivesColorsBackground100
    } else {
        KozmosThemeTokens.primitivesColorsBackground0
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = if (enabled) KozmosThemeTokens.primitivesColorsForeground100 else KozmosThemeTokens.primitivesColorsForeground500
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(44.dp)
                .background(fieldBackground, fieldShape)
                .border(1.dp, borderColor, fieldShape)
                .clickable(enabled = enabled && !readOnly) { setExpanded(!isExpanded) }
                .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(color, RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
                    .border(1.dp, KozmosThemeTokens.semanticsBorderInput, RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
            )
            Text(
                text = normalizedValue,
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground0
            )
            Spacer(modifier = Modifier.weight(1f))
            androidx.compose.material3.Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = if (isExpanded) "Close color picker" else "Open color picker",
                tint = KozmosThemeTokens.primitivesColorsForeground500,
                modifier = Modifier
                    .size(20.dp)
                    .rotate(if (isExpanded) 180f else 0f)
            )
        }

        if (isExpanded) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(KozmosThemeTokens.primitivesColorsBackground0, fieldShape)
                    .border(1.dp, KozmosThemeTokens.semanticsBorderInput, fieldShape)
                    .padding(KozmosDimensions.primitivesLayoutSpacing150),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
            ) {
                ColorArea(color = colorFromHex(rgbToHex(hslToRgb(HslColor(hsl.h, 100f, 50f)))), hsl = hsl)

                LabeledKozmosSlider(
                    label = "Hue",
                    value = hsl.h,
                    range = 0f..360f,
                    enabled = enabled && !readOnly,
                    onValueChange = { nextHue ->
                        onValueChange(rgbToHex(hslToRgb(hsl.copy(h = nextHue))))
                    }
                )

                LabeledKozmosSlider(
                    label = "Opacity",
                    value = alpha.coerceIn(0f, 100f),
                    range = 0f..100f,
                    enabled = enabled && !readOnly,
                    onValueChange = { onAlphaChange(it.coerceIn(0f, 100f)) }
                )

                FormatControls(
                    format = currentFormat,
                    onFormatChange = { currentFormat = it },
                    value = normalizedValue,
                    alpha = alpha,
                    hsl = hsl,
                    enabled = enabled && !readOnly
                )

                PaletteSelector(label = paletteLabel)
                PresetGrid(
                    presets = presets,
                    selectedValue = normalizedValue,
                    enabled = enabled && !readOnly,
                    onValueChange = onValueChange
                )
            }
        }

        if (!helperText.isNullOrBlank()) {
            Text(
                text = helperText,
                style = MaterialTheme.typography.bodyMedium,
                color = statusColor(status) ?: KozmosThemeTokens.primitivesColorsForeground500
            )
        }
    }
}

@Composable
private fun ColorArea(color: Color, hsl: HslColor) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxWidth()
            .height(144.dp)
            .background(Brush.horizontalGradient(listOf(Color.White, color)), shape)
            .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black)), shape)
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
    ) {
        val handleSize = 18.dp
        // The square is drawn physically, as React draws it: white at the
        // left and the hue at the right in either reading direction, since
        // horizontalGradient runs left to right. The handle is placed from
        // the left too: TopStart and offset mirrored right to left while the
        // gradient did not, so the handle sat over the wrong end of it.
        Box(
            modifier = Modifier
                .align(AbsoluteAlignment.TopLeft)
                .absoluteOffset(
                    x = (maxWidth - handleSize) * (hsl.s.coerceIn(0f, 100f) / 100f),
                    y = (maxHeight - handleSize) * (1f - hsl.l.coerceIn(0f, 100f) / 100f)
                )
                .size(handleSize)
                .background(KozmosThemeTokens.primitivesColorsBackground0, CircleShape)
                .border(1.dp, KozmosThemeTokens.primitivesColorsForeground0, CircleShape)
        )
    }
}

@Composable
private fun LabeledKozmosSlider(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    enabled: Boolean,
    onValueChange: (Float) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = KozmosThemeTokens.primitivesColorsForeground500
        )
        KozmosSlider(
            value = value.coerceIn(range.start, range.endInclusive),
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            valueRange = range,
            enabled = enabled
        )
    }
}

@Composable
private fun FormatControls(
    format: KozmosColorPickerFormat,
    onFormatChange: (KozmosColorPickerFormat) -> Unit,
    value: String,
    alpha: Float,
    hsl: HslColor,
    enabled: Boolean
) {
    FormatRowLayout(
        spacing = KozmosDimensions.primitivesLayoutSpacing75,
        // React's columns: minmax(3.5rem, 1fr), and 6rem for HEX.
        minimumColumn = if (format == KozmosColorPickerFormat.Hex) 96.dp else 56.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        val formatLabel = when (format) {
            KozmosColorPickerFormat.Hex -> "HEX"
            KozmosColorPickerFormat.Rgb -> "RGB"
            KozmosColorPickerFormat.Hsl -> "HSL"
        }
        CompactValueBox(
            text = formatLabel,
            // Named "Color format", the format its value, as React's select
            // is (`aria-label="Color format"`); TalkBack heard only "HSL".
            // Disabled with the picker, as React's select is
            // (`pickerDisabled`) and the sliders and presets beside it are.
            modifier = Modifier.semantics {
                contentDescription = "Color format"
                stateDescription = formatLabel
            }.clickable(enabled = enabled) {
                onFormatChange(
                    when (format) {
                        KozmosColorPickerFormat.Hex -> KozmosColorPickerFormat.Rgb
                        KozmosColorPickerFormat.Rgb -> KozmosColorPickerFormat.Hsl
                        KozmosColorPickerFormat.Hsl -> KozmosColorPickerFormat.Hex
                    }
                )
            }
        )

        val channels = when (format) {
            KozmosColorPickerFormat.Hex -> listOf(value)
            KozmosColorPickerFormat.Rgb -> {
                val rgb = hexToRgb(value)
                listOf("${rgb.r}", "${rgb.g}", "${rgb.b}")
            }
            KozmosColorPickerFormat.Hsl -> listOf("${hsl.h.toInt()}", "${hsl.s.toInt()}", "${hsl.l.toInt()}")
        }

        channels.forEach { channel ->
            CompactValueBox(
                text = channel,
                modifier = if (format == KozmosColorPickerFormat.Hex) Modifier.layoutId(FormatRowFill) else Modifier.widthIn(min = 44.dp)
            )
        }

        CompactValueBox(text = alpha.coerceIn(0f, 100f).toInt().toString())
        Text(
            text = "%",
            color = KozmosThemeTokens.primitivesColorsForeground500,
            modifier = Modifier.layoutId(FormatRowUnit)
        )
    }
}

/**
 * The HEX value box: where the row is one line, it takes the width the other
 * parts leave, as its weight did in the Row this layout replaced.
 */
private object FormatRowFill

/** The opacity box's "%": it stays beside the box before it, in that box's column. */
private object FormatRowUnit

/**
 * The open picker's format row: the format menu, the value boxes, the
 * opacity box and its "%".
 *
 * Where every part fits on one line at its text's width, it is laid out as
 * the Row it replaces laid it out: from the inline start, [spacing] apart,
 * centred on the line, each part as wide as its text (a value box at least
 * 44dp) and the HEX value filling what is left. That Row could not wrap, so
 * at large text it squeezed its last parts: at font scale 2 and 320dp the
 * opacity value broke over three lines and the "%" was drawn 0dp wide.
 *
 * Where they do not fit, it wraps as React's format grid does,
 * `repeat(auto-fit, minmax(3.5rem, 1fr))`: as many equal columns to a line
 * as fit, each at least [minimumColumn] and at least as wide as the widest
 * part's text, the parts in reading order and lines [spacing] apart. The
 * opacity box and its "%" share a column. Placement is relative, so right
 * to left mirrors it, as React's grid does.
 */
@Composable
private fun FormatRowLayout(
    spacing: Dp,
    minimumColumn: Dp,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Layout(content = content, modifier = modifier) { measurables, constraints ->
        val gap = spacing.roundToPx()
        val ideals = measurables.map { it.maxIntrinsicWidth(Constraints.Infinity) }
        val oneLine = ideals.sum() + gap * (measurables.size - 1).coerceAtLeast(0)
        if (!constraints.hasBoundedWidth || oneLine <= constraints.maxWidth) {
            formatRowLine(measurables, constraints, spacing)
        } else {
            formatRowColumns(measurables, constraints, gap, ideals, minimumColumn.roundToPx())
        }
    }
}

/** The row on one line, measured and placed as `Row(Arrangement.spacedBy(spacing), CenterVertically)` did. */
private fun MeasureScope.formatRowLine(
    measurables: List<Measurable>,
    constraints: Constraints,
    spacing: Dp
): MeasureResult {
    val gap = spacing.roundToPx()
    val loose = constraints.copy(minWidth = 0, minHeight = 0)
    val placeables = arrayOfNulls<Placeable>(measurables.size)
    measurables.forEachIndexed { index, measurable ->
        if (measurable.layoutId != FormatRowFill) placeables[index] = measurable.measure(loose)
    }
    // What is left is shared among the fills, as the Row shared it among
    // its weights; there is one, the HEX value.
    val fills = measurables.indices.filter { measurables[it].layoutId == FormatRowFill }
    val fixed = placeables.sumOf { it?.width ?: 0 } + gap * (measurables.size - 1)
    val left = if (constraints.hasBoundedWidth) (constraints.maxWidth - fixed).coerceAtLeast(0) else 0
    fills.forEachIndexed { taken, index ->
        val width = if (constraints.hasBoundedWidth) {
            left / fills.size + if (taken < left % fills.size) 1 else 0
        } else {
            measurables[index].maxIntrinsicWidth(Constraints.Infinity)
        }
        placeables[index] = measurables[index].measure(Constraints(width, width, 0, constraints.maxHeight))
    }
    val placed = placeables.map { checkNotNull(it) }
    val width = constraints.constrainWidth(placed.sumOf { it.width } + gap * (placed.size - 1))
    val height = constraints.constrainHeight(placed.maxOfOrNull { it.height } ?: 0)
    val positions = IntArray(placed.size)
    with(Arrangement.spacedBy(spacing)) {
        arrange(width, IntArray(placed.size) { placed[it].width }, layoutDirection, positions)
    }
    return layout(width, height) {
        placed.forEachIndexed { index, placeable ->
            placeable.place(positions[index], Alignment.CenterVertically.align(placeable.height, height))
        }
    }
}

/** The row in equal columns, as many to a line as fit. */
private fun MeasureScope.formatRowColumns(
    measurables: List<Measurable>,
    constraints: Constraints,
    gap: Int,
    ideals: List<Int>,
    minimumColumn: Int
): MeasureResult {
    // A column holds a box, and the "%" that follows the opacity box.
    val cells = mutableListOf<Pair<Int, Int?>>()
    measurables.forEachIndexed { index, measurable ->
        val last = cells.lastOrNull()
        if (measurable.layoutId == FormatRowUnit && last != null && last.second == null) {
            cells[cells.size - 1] = last.first to index
        } else {
            cells += index to null
        }
    }
    val widest = cells.maxOf { (box, unit) -> ideals[box] + (unit?.let { gap + ideals[it] } ?: 0) }
    val column = maxOf(minimumColumn, widest)
    val width = constraints.maxWidth
    val perLine = ((width + gap) / (column + gap)).coerceIn(1, cells.size)
    // The line's width shared out in whole pixels, the odd ones to the first columns.
    val shared = (width - gap * (perLine - 1)).coerceAtLeast(0)
    fun columnWidth(at: Int): Int = shared / perLine + if (at < shared % perLine) 1 else 0

    class Cell(val box: Placeable, val unit: Placeable?) {
        val height: Int get() = maxOf(box.height, unit?.height ?: 0)
    }
    val laid = cells.mapIndexed { index, (box, unit) ->
        val cellWidth = columnWidth(index % perLine)
        val unitPlaceable = unit?.let { measurables[it].measure(Constraints(maxWidth = cellWidth, maxHeight = constraints.maxHeight)) }
        val boxWidth = (cellWidth - (unitPlaceable?.let { it.width + gap } ?: 0)).coerceAtLeast(0)
        Cell(measurables[box].measure(Constraints(boxWidth, boxWidth, 0, constraints.maxHeight)), unitPlaceable)
    }
    val lines = laid.chunked(perLine)
    val lineHeights = lines.map { line -> line.maxOf { it.height } }
    val height = constraints.constrainHeight(lineHeights.sum() + gap * (lines.size - 1))
    return layout(width, height) {
        var y = 0
        lines.forEachIndexed { line, cellsOnLine ->
            var x = 0
            cellsOnLine.forEachIndexed { at, cell ->
                cell.box.placeRelative(x, y + Alignment.CenterVertically.align(cell.box.height, lineHeights[line]))
                cell.unit?.let { unit ->
                    unit.placeRelative(x + cell.box.width + gap, y + Alignment.CenterVertically.align(unit.height, lineHeights[line]))
                }
                x += columnWidth(at) + gap
            }
            y += lineHeights[line] + gap
        }
    }
}

@Composable
private fun CompactValueBox(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace),
        color = KozmosThemeTokens.primitivesColorsForeground0,
        // At least 36dp, and taller with its text: a fixed 36 cut the text
        // top and bottom from font scale 1.3.
        modifier = modifier
            .heightIn(min = 36.dp)
            .background(KozmosThemeTokens.primitivesColorsBackground0, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .border(1.dp, KozmosThemeTokens.semanticsBorderInput, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100, vertical = KozmosDimensions.primitivesLayoutSpacing75)
    )
}

/**
 * The palette field: at least 40dp, and 8dp taller than its label above and
 * below, so it grows with large text as React's 2.25rem <select> does. A
 * fixed 40dp cut the label's second line off from font scale 1.5. The label
 * stays on one line, as React's and SwiftUI's do, and ends in an ellipsis
 * where it does not fit; TalkBack reads it whole. Its box is weighted, so it
 * is measured after the caret and takes only what the caret leaves: laid
 * out first, the label took the caret's 20dp, down to 0. At least 8dp sit
 * between them, as SwiftUI's Spacer(minLength: 8) keeps.
 */
@Composable
private fun PaletteSelector(label: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 40.dp)
            .background(KozmosThemeTokens.primitivesColorsBackground0, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .border(1.dp, KozmosThemeTokens.semanticsBorderInput, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150, vertical = KozmosDimensions.primitivesLayoutSpacing100),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        // The box fills the room; the label in it keeps its own width, so
        // where it fits it is laid out as it was.
        Box(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground0,
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
        }
        androidx.compose.material3.Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = null,
            tint = KozmosThemeTokens.primitivesColorsForeground500,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
private fun PresetGrid(
    presets: List<String>,
    selectedValue: String,
    enabled: Boolean,
    onValueChange: (String) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        presets.map(::normalizeHexColor).chunked(8).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                row.forEach { preset ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .background(colorFromHex(preset), RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
                            .border(
                                if (preset == selectedValue) 2.dp else 1.dp,
                                KozmosThemeTokens.semanticsBorderInput,
                                RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker)
                            )
                            .clickable(enabled = enabled) { onValueChange(preset) }
                    )
                }
                repeat(8 - row.size) {
                    Spacer(modifier = Modifier.weight(1f).aspectRatio(1f))
                }
            }
        }
    }
}

val kozmosColorPickerDefaultPresets = listOf(
    "#135BEC", "#8FB4FF", "#7C3AED", "#0F766E",
    "#1492A6", "#2E97CC", "#0EA5E9", "#38BDF8",
    "#C2410C", "#B91C1C", "#A16207", "#CA8A04",
    "#15803D", "#22C55E", "#BE185D", "#EC4899",
    "#4F46E5", "#6366F1", "#7E22CE", "#A855F7",
    "#111827", "#374151", "#747B8B", "#C7CAD1"
)

private data class RgbColor(val r: Int, val g: Int, val b: Int)
private data class HslColor(val h: Float, val s: Float, val l: Float)

private fun normalizeHexColor(value: String): String {
    val raw = value.trim().removePrefix("#")
    return when {
        raw.matches(Regex("^[0-9a-fA-F]{3}$")) -> "#${raw.map { "$it$it" }.joinToString("").uppercase()}"
        raw.matches(Regex("^[0-9a-fA-F]{6}$")) -> "#${raw.uppercase()}"
        else -> "#135BEC"
    }
}

private fun colorFromHex(value: String): Color =
    Color(android.graphics.Color.parseColor(normalizeHexColor(value)))

private fun hexToRgb(value: String): RgbColor {
    val hex = normalizeHexColor(value).removePrefix("#")
    return RgbColor(
        r = hex.substring(0, 2).toInt(16),
        g = hex.substring(2, 4).toInt(16),
        b = hex.substring(4, 6).toInt(16)
    )
}

private fun rgbToHex(rgb: RgbColor): String =
    "#%02X%02X%02X".format(rgb.r.coerceIn(0, 255), rgb.g.coerceIn(0, 255), rgb.b.coerceIn(0, 255))

private fun rgbToHsl(rgb: RgbColor): HslColor {
    val red = rgb.r / 255f
    val green = rgb.g / 255f
    val blue = rgb.b / 255f
    val max = maxOf(red, green, blue)
    val min = minOf(red, green, blue)
    val lightness = (max + min) / 2f
    val delta = max - min
    if (delta == 0f) {
        return HslColor(0f, 0f, lightness * 100f)
    }
    val saturation = if (lightness > 0.5f) delta / (2f - max - min) else delta / (max + min)
    val hue = when (max) {
        red -> ((green - blue) / delta + if (green < blue) 6f else 0f) * 60f
        green -> ((blue - red) / delta + 2f) * 60f
        else -> ((red - green) / delta + 4f) * 60f
    }
    return HslColor(hue, saturation * 100f, lightness * 100f)
}

private fun hslToRgb(hsl: HslColor): RgbColor {
    val hue = ((hsl.h % 360f) + 360f) % 360f / 360f
    val saturation = hsl.s.coerceIn(0f, 100f) / 100f
    val lightness = hsl.l.coerceIn(0f, 100f) / 100f
    if (saturation == 0f) {
        val value = (lightness * 255f).toInt()
        return RgbColor(value, value, value)
    }
    val q = if (lightness < 0.5f) lightness * (1f + saturation) else lightness + saturation - lightness * saturation
    val p = 2f * lightness - q
    fun channel(offset: Float): Int {
        var t = hue + offset
        if (t < 0f) t += 1f
        if (t > 1f) t -= 1f
        val result = when {
            t < 1f / 6f -> p + (q - p) * 6f * t
            t < 1f / 2f -> q
            t < 2f / 3f -> p + (q - p) * (2f / 3f - t) * 6f
            else -> p
        }
        return (result * 255f).toInt().coerceIn(0, 255)
    }
    return RgbColor(channel(1f / 3f), channel(0f), channel(-1f / 3f))
}

@Composable
private fun statusColor(status: KozmosInputStatus): Color? = when (status) {
    KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600
    KozmosInputStatus.Warning -> KozmosThemeTokens.primitivesColorsEmotionalAlert600
    KozmosInputStatus.Success -> KozmosThemeTokens.primitivesColorsEmotionalSuccess600
    KozmosInputStatus.Default -> null
}
